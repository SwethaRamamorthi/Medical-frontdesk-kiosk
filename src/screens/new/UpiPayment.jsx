import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import EmergencyButton from '../../components/EmergencyButton';

const PAYMENT_SECONDS = 300; // 5 minutes

function generateAppointmentId() {
    const prefix = 'SC';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${date}${rand}`;
}

// Deterministic QR-like cell grid — seeded so it's stable across renders
function makeQrCells(seed = 42) {
    const cells = [];
    let s = seed;
    const lcg = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    const positions = [70, 80, 90, 100, 110, 120, 130];
    for (const x of positions) {
        for (const y of positions) {
            if (lcg() > 0.45) cells.push({ x, y });
        }
    }
    return cells;
}

export default function UpiPayment() {
    const navigate = useNavigate();
    const { patient, selectedDept, selectedDoctor, selectedSlot, setAppointment, nextToken, t, locale } = useKiosk();
    const { speak } = useSpeech();

    const [timeLeft, setTimeLeft] = useState(PAYMENT_SECONDS);
    const [paid, setPaid] = useState(false);
    const [saving, setSaving] = useState(false);
    const [botStep, setBotStep] = useState(0);
    const timerRef = useRef(null);

    // Floating animation for the bot icon
    const floatingBotStyle = {
        fontSize: '3.5rem',
        filter: 'drop-shadow(0 10px 15px rgba(91,84,214,0.3))',
        animation: 'floating 3s ease-in-out infinite',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 100,
    };

    // Tooltip/bubble style
    const suggestionBubbleStyle = {
        position: 'absolute',
        bottom: '100%',
        left: '20px',
        marginBottom: '20px',
        width: '380px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(108, 99, 255, 0.4)',
        borderRadius: '24px 24px 24px 4px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 40px rgba(108, 99, 255, 0.1)',
        transformOrigin: 'bottom left',
        animation: 'fadeUpScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        zIndex: 99,
        color: '#333'
    };

    // Stable QR cells — computed once
    const qrCells = useMemo(() => makeQrCells(selectedDoctor?.fee || 42), []);

    useEffect(() => {
        if (!selectedDoctor || !patient) { navigate('/'); return; }
        speak(locale === 'ta'
            ? `தயவுசெய்து ${selectedDoctor.fee} ரூபாய்க்கான UPI கட்டணத்தை முடிக்கவும். QR குறியீட்டை ஸ்கேன் செய்யுங்கள் அல்லது UPI ஐடியைப் பயன்படுத்தவும். உங்களுக்கு 5 நிமிடங்கள் உள்ளன.`
            : `Please complete the UPI payment of Rupees ${selectedDoctor.fee}. Scan the QR code or use UPI ID. You have 5 minutes.`);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (timeLeft === 0 && !paid) {
            speak(locale === 'ta' ? 'கட்டணம் செலுத்தும் நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Payment time expired. Please try again.');
            alert(locale === 'ta' ? '⏰ கட்டணம் செலுத்தும் நேரம் முடிந்தது. தயவுசெய்து ஆரம்பத்தில் இருந்து தொடங்கவும்.' : '⏰ Payment window expired. Please restart.');
            navigate('/');
        }
    }, [timeLeft, paid]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    };

    const handlePaymentDone = async () => {
        clearInterval(timerRef.current);
        setSaving(true);
        const appointmentId = generateAppointmentId();
        const token = nextToken();

        const appointmentData = {
            appointmentId,
            patientId: patient.id,
            patientName: patient.name,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            department: typeof selectedDept?.label === 'object' ? selectedDept.label.en : selectedDept?.label,
            slot: selectedSlot,
            date: new Date().toLocaleDateString('en-IN'),
            fee: selectedDoctor.fee,
            paymentStatus: 'Paid',
            tokenNumber: token,
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'appointments'), appointmentData);
        } catch (err) {
            console.warn('Could not save to Firestore:', err.message);
        }

        setAppointment({ ...appointmentData, createdAt: new Date().toISOString() });
        setSaving(false);
        setPaid(true);
        speak(locale === 'ta'
            ? `பணம் செலுத்தியது உறுதி செய்யப்பட்டது! உங்கள் முன்பதிவு எண் ${appointmentId}. டோக்கன் எண் ${token}. உங்கள் முன்பதிவு சீட்டு தயாராகிறது.`
            : `Payment confirmed! Your appointment ID is ${appointmentId}. Token number ${token}. Preparing your appointment slip.`);
        setTimeout(() => navigate('/new/slip'), 1800);
    };

    const timerColor = timeLeft < 60 ? 'var(--danger)' : 'var(--primary)';

    return (
        <div className="screen fade-in">
            <div className="screen-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                        {t('back')}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('stepPayment')}</div>
            </div>

            <div className="screen-body" style={{ justifyContent: 'center' }}>
                {paid ? (
                    <div className="card fade-up" style={{ padding: 48, textAlign: 'center', maxWidth: 480 }}>
                        <div className="success-check" style={{ fontSize: '5rem', marginBottom: 20 }}>✅</div>
                        <h2 style={{ color: 'var(--success)', marginBottom: 12 }}>{t('paymentSuccess')}</h2>
                        <p className="text-muted">{t('generatingSlip')}</p>
                    </div>
                ) : saving ? (
                    <div className="card fade-up" style={{ padding: 48, textAlign: 'center', maxWidth: 480 }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }} />
                        <p>{t('savingAppt')}</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900, width: '100%', alignItems: 'start' }}>

                        {/* ── Left – Payment details ── */}
                        <div className="card fade-up" style={{ padding: 32 }}>
                            <h2 style={{ color: 'var(--primary)', marginBottom: 20 }}>💳 {t('paymentDetails')}</h2>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        [t('hospitalName'), t('hospitalName')],
                                        [t('patientTerm'), patient?.name],
                                        [t('doctorTerm'), selectedDoctor?.name],
                                        [t('deptTerm'), selectedDept && (typeof selectedDept.label === 'object' ? selectedDept.label[locale] : selectedDept.label)],
                                        [t('dateTerm'), new Date().toLocaleDateString('en-IN')],
                                        [t('slotTerm'), selectedSlot],
                                    ].map(([label, value]) => (
                                        <tr key={label} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '10px 0', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>{label}</td>
                                            <td style={{ padding: '10px 0', fontWeight: 700, textAlign: 'right', color: 'var(--text-main)' }}>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Fee box */}
                            <div style={{
                                marginTop: 20, padding: '16px 20px',
                                background: 'rgba(0, 229, 160, 0.12)',
                                border: '1.5px solid rgba(0, 229, 160, 0.35)',
                                borderRadius: 14, textAlign: 'center',
                                backdropFilter: 'blur(10px)',
                            }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>{t('consultationFee')}</div>
                                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--success)', textShadow: '0 0 20px rgba(0,229,160,0.4)' }}>
                                    ₹{selectedDoctor?.fee}
                                </div>
                            </div>

                            {/* Timer */}
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                                    ⏱ {t('paymentWindow')}
                                </div>
                                <div className="timer-ring" style={{ color: timerColor, textShadow: timeLeft < 60 ? '0 0 16px rgba(255,77,109,0.6)' : '0 0 16px rgba(0,212,200,0.4)' }}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>

                            <button
                                className="btn btn-success btn-lg w-full"
                                style={{ marginTop: 24 }}
                                onClick={handlePaymentDone}
                            >
                                ✅ {t('paymentCompleted')}
                            </button>
                        </div>

                        {/* ── Right – QR Code ── */}
                        <div className="card fade-up" style={{ padding: 32, textAlign: 'center' }}>
                            <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>📱 {t('scanQRPay')}</h2>

                            {/* QR Code – glassmorphic frame + teal palette */}
                            <div style={{
                                width: 230, height: 230, margin: '0 auto 20px',
                                borderRadius: 20,
                                padding: 10,
                                background: 'rgba(255,255,255,0.95)',
                                boxShadow: '0 0 40px rgba(0,212,200,0.30), 0 0 80px rgba(0,212,200,0.10)',
                                border: '2px solid rgba(0,212,200,0.50)',
                                position: 'relative',
                            }}>
                                <svg width="210" height="210" viewBox="0 0 210 210" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="210" height="210" fill="white" />

                                    {/* ── Top-left finder ── */}
                                    <rect x="10" y="10" width="54" height="54" rx="5" fill="none" stroke="#00a8a0" strokeWidth="5" />
                                    <rect x="20" y="20" width="34" height="34" rx="3" fill="#00d4c8" />

                                    {/* ── Top-right finder ── */}
                                    <rect x="146" y="10" width="54" height="54" rx="5" fill="none" stroke="#00a8a0" strokeWidth="5" />
                                    <rect x="156" y="20" width="34" height="34" rx="3" fill="#00d4c8" />

                                    {/* ── Bottom-left finder ── */}
                                    <rect x="10" y="146" width="54" height="54" rx="5" fill="none" stroke="#00a8a0" strokeWidth="5" />
                                    <rect x="20" y="156" width="34" height="34" rx="3" fill="#00d4c8" />

                                    {/* ── Data cells (deterministic) ── */}
                                    {qrCells.map(({ x, y }, i) => (
                                        <rect key={i} x={x} y={y} width="8" height="8" fill="#00a8a0" rx="1.5" />
                                    ))}

                                    {/* ── Centre UPI badge ── */}
                                    <circle cx="105" cy="105" r="18" fill="white" stroke="#00d4c8" strokeWidth="2.5" />
                                    <text x="105" y="110" textAnchor="middle" fill="#00a8a0" fontSize="10" fontWeight="bold">UPI</text>
                                </svg>
                            </div>

                            {/* UPI ID chip */}
                            <div style={{
                                background: 'rgba(0, 212, 200, 0.10)',
                                border: '1.5px solid rgba(0, 212, 200, 0.30)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: 12,
                                padding: '14px 20px',
                                marginBottom: 16,
                            }}>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('upiId')}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                                    smartcare.hospital@upi
                                </div>
                            </div>

                            <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: 16 }}>
                                {t('payUsingUpi')}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {['📱 PhonePe', '🟢 GPay', '💙 Paytm', '🔵 BHIM'].map(app => (
                                    <span key={app} style={{
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1px solid rgba(255,255,255,0.14)',
                                        borderRadius: 8, padding: '6px 12px',
                                        fontSize: '0.82rem', fontWeight: 600,
                                        color: 'var(--text-muted)',
                                    }}>{app}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating AI Suggestion Bot (Bottom Left) */}
            <div style={{ position: 'fixed', bottom: '40px', left: '40px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ ...suggestionBubbleStyle, display: botStep === 0 ? 'block' : 'none' }}>
                    <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                    <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>✨ AI Assistant</h3>
                        <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                    </div>

                    <div className="fade-in">
                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                            You are almost done! I can help you complete this payment.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(1)}>
                                📱 How do I scan the QR code?
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(2)}>
                                ⏱️ What happens if the timer runs out?
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(3)}>
                                ✅ I have paid. What next?
                            </button>
                        </div>
                    </div>
                </div>

                {botStep === 1 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>✨ AI Assistant</h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                            Open any UPI app on your phone (like <strong>GPay, PhonePe, or Paytm</strong>). Tap the "Scan QR" button in your app, point your camera at the QR code on this screen, and pay the requested amount.
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                    </div>
                )}

                {botStep === 2 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>✨ AI Assistant</h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                            If the 5-minute timer runs out, this session will expire for your security. You will be safely returned to the home screen and can start over anytime!
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                    </div>
                )}

                {botStep === 3 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <h3 style={{ color: '#5b54d6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>✨ AI Assistant</h3>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                            If you have successfully paid using your phone, tap the large green <strong>"✅ Payment Completed"</strong> button below the timer to confirm and print your appointment slip!
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => {
                                setBotStep(-1);
                                handlePaymentDone();
                            }}>
                                Confirm Payment ➔
                            </button>
                        </div>
                    </div>
                )}

                <div style={floatingBotStyle} onClick={() => setBotStep(botStep === -1 ? 0 : -1)}>
                    🤖
                </div>
            </div>

            <EmergencyButton />
        </div>
    );
}
