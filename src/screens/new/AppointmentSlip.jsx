import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import EmergencyButton from '../../components/EmergencyButton';

export default function AppointmentSlip() {
    const navigate = useNavigate();
    const { appointment, patient, selectedDoctor, selectedDept, selectedSlot, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const printedRef = useRef(false);
    const countdownRef = useRef(null);

    useEffect(() => {
        if (!appointment) { navigate('/'); return; }

        speak(locale === 'ta'
            ? `உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது! முன்பதிவு எண்: ${appointment.appointmentId}. டோக்கன் எண் ${appointment.tokenNumber}. உங்கள் சீட்டு அச்சடிக்கப்படுகிறது. தயவுசெய்து அதை பெற்றுக்கொள்ளுங்கள்.`
            : `Your appointment has been confirmed! Appointment ID: ${appointment.appointmentId}. Token number ${appointment.tokenNumber}. Your slip is being printed. Please collect it.`);

        // Auto-print once
        if (!printedRef.current) {
            printedRef.current = true;
            setTimeout(() => window.print(), 800);
        }

        // Auto-return to welcome after 12s
        let count = 12;
        countdownRef.current = setInterval(() => {
            count--;
            const el = document.getElementById('countdown-num');
            if (el) el.textContent = count;
            if (count <= 0) {
                clearInterval(countdownRef.current);
                navigate('/');
            }
        }, 1000);

        return () => clearInterval(countdownRef.current);
    }, []);

    if (!appointment) return null;

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const handleWhatsAppShare = () => {
        const phoneNumber = patient?.phone || '';
        const waPhone = phoneNumber.startsWith('91') || phoneNumber.startsWith('+91')
            ? phoneNumber.replace('+', '')
            : `91${phoneNumber}`;

        const ptName = appointment.patientName || patient?.name;
        const drName = appointment.doctorName || selectedDoctor?.name;
        const apptDate = appointment.date || today;
        const apptSlot = appointment.slot || selectedSlot;
        const hospitalName = t('hospitalName', { returnObjects: true });

        const message = `*Appointment Confirmed!* 🏥\n\n*Name:* ${ptName}\n*Doctor:* ${drName}\n*Date:* ${apptDate}\n*Time:* ${apptSlot}\n*Token:* ${appointment.tokenNumber}\n\nThank you for choosing ${typeof hospitalName === 'string' ? hospitalName : 'SmartCare Hospital'}.`;

        const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="screen fade-in">
            {/* ── Non-print header ── */}
            <div className="screen-header no-print">
                <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {t('returningHomeIn')} <strong id="countdown-num">12</strong>s
                    </span>
                    <button
                        onClick={() => { clearInterval(countdownRef.current); navigate('/'); }}
                        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
                    >
                        🏠 {t('homeBtn')}
                    </button>
                </div>
            </div>

            <div className="screen-body" style={{ alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

                {/* ── Success banner (screen only) ── */}
                <div className="no-print" style={{
                    marginBottom: 24,
                    padding: '18px 40px',
                    background: 'rgba(0, 229, 160, 0.12)',
                    border: '1.5px solid rgba(0, 229, 160, 0.40)',
                    backdropFilter: 'blur(14px)',
                    borderRadius: 18, textAlign: 'center',
                    maxWidth: 620, width: '100%',
                    boxShadow: '0 0 30px rgba(0, 229, 160, 0.15)',
                }}>
                    <div className="success-check" style={{ fontSize: '2.5rem', marginBottom: 6 }}>✅</div>
                    <h3 style={{ color: 'var(--success)', textShadow: '0 0 16px rgba(0,229,160,0.45)' }}>
                        {t('apptBookedSuccess')}
                    </h3>
                </div>

                {/* ── Printable Slip ── */}
                <div className="print-area card" style={{
                    maxWidth: 620,
                    width: '100%',
                    padding: '36px',
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {/* Slip header */}
                    <div style={{
                        textAlign: 'center',
                        paddingBottom: 20,
                        borderBottom: '2px solid rgba(0, 212, 200, 0.30)',
                        marginBottom: 24,
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>🏥</div>
                        <h2 style={{ color: 'var(--primary)', marginBottom: 4 }}>{t('hospitalName')}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {t('hospitalAddress')}
                        </p>
                        <div style={{
                            marginTop: 12,
                            background: 'linear-gradient(135deg, #00d4c8, #00a8a0)',
                            color: '#060d1f',
                            borderRadius: 8,
                            padding: '8px 24px',
                            display: 'inline-block',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            letterSpacing: '2px',
                        }}>
                            {t('apptSlip')}
                        </div>
                    </div>

                    {/* ID and Token row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{
                            background: 'rgba(0, 212, 200, 0.10)',
                            border: '1.5px solid rgba(0, 212, 200, 0.30)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 14,
                            padding: '16px 20px',
                        }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', marginBottom: 4 }}>
                                APPOINTMENT ID
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {appointment.appointmentId}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(108, 99, 255, 0.12)',
                            border: '1.5px solid rgba(108, 99, 255, 0.30)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 14,
                            padding: '16px 20px',
                        }}>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(180, 170, 255, 0.8)', fontWeight: 700, letterSpacing: '1px', marginBottom: 4 }}>
                                {t('tokenNumber').toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '2.2rem', color: '#a89cff', textShadow: '0 0 16px rgba(108,99,255,0.5)' }}>
                                #{appointment.tokenNumber}
                            </div>
                        </div>
                    </div>

                    {/* Details table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                        <tbody>
                            {[
                                [`👤 ${t('patientTerm')}`, appointment.patientName || patient?.name],
                                [`👨‍⚕️ ${t('doctorTerm')}`, appointment.doctorName || selectedDoctor?.name],
                                [`🏥 ${t('deptTerm')}`, appointment.department || (selectedDept && (typeof selectedDept.label === 'object' ? selectedDept.label[locale] : selectedDept.label))],
                                [`📅 ${t('dateTerm')}`, appointment.date || today],
                                [`🕐 ${t('timeSlotTerm')}`, appointment.slot || selectedSlot],
                                [`💰 ${t('feePaid')}`, `₹${appointment.fee || selectedDoctor?.fee}`],
                                [`✅ ${t('paymentStatus')}`, t('paidStatus')],
                            ].map(([label, value]) => (
                                <tr key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <td style={{ padding: '11px 0', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.95rem', width: '45%' }}>{label}</td>
                                    <td style={{ padding: '11px 0', fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Instructions */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 12,
                        padding: '16px 20px',
                        fontSize: '0.92rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.8,
                    }}>
                        <strong style={{ color: 'var(--text-main)' }}>📋 {t('instructions')}:</strong>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                            <li>{t('instruction1')}</li>
                            <li>{t('instruction2')}</li>
                            <li>{t('instruction3')}</li>
                        </ul>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {t('generatedOn')} {today} • {t('hospitalName')}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="no-print" style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        🖨️ {t('printAgain')}
                    </button>
                    {patient?.phone && (
                        <button
                            className="btn btn-outline"
                            style={{ borderColor: '#25D366', color: '#25D366' }}
                            onClick={handleWhatsAppShare}
                        >
                            💬 WhatsApp
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => { clearInterval(countdownRef.current); navigate('/'); }}>
                        🏠 {t('backToHome')}
                    </button>
                </div>
            </div>

            <EmergencyButton />
        </div>
    );
}
