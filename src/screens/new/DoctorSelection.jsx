import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmergencyButton from '../../components/EmergencyButton';

// Fallback doctors in case Firestore is not seeded
const FALLBACK_DOCTORS = {
    neurologist: [
        { id: 'n1', name: 'Dr. Rajesh Kumar', department: 'neurologist', qualification: 'MD Neurology, DM', experience: '12 years', fee: 600, imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['9:00 AM', '9:30 AM', '10:00 AM', '11:00 AM', '11:30 AM'] },
        { id: 'n2', name: 'Dr. Ananya Mehta', department: 'neurologist', qualification: 'MBBS, MD, DNB Neuro', experience: '8 years', fee: 500, imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['10:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'] },
    ],
    ophthalmologist: [
        { id: 'o1', name: 'Dr. Sunil Verma', department: 'ophthalmologist', qualification: 'MS Ophthalmology', experience: '15 years', fee: 450, imageUrl: 'https://images.unsplash.com/photo-1537368910025-7028ca43fb36?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['8:30 AM', '9:00 AM', '9:30 AM', '4:00 PM'] },
        { id: 'o2', name: 'Dr. Priya Sharma', department: 'ophthalmologist', qualification: 'DNB Ophthalmology', experience: '7 years', fee: 400, imageUrl: 'https://images.unsplash.com/photo-1594824436951-7f12bc44ce7e?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['11:00 AM', '11:30 AM', '3:00 PM', '3:30 PM'] },
    ],
    pediatrician: [
        { id: 'p1', name: 'Dr. Kavitha Nair', department: 'pediatrician', qualification: 'MD Pediatrics, DCH', experience: '10 years', fee: 400, imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['9:00 AM', '10:00 AM', '10:30 AM', '5:00 PM'] },
        { id: 'p2', name: 'Dr. Arjun Pillai', department: 'pediatrician', qualification: 'MBBS, DCH, MD', experience: '6 years', fee: 350, imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM'] },
    ],
    cardiologist: [
        { id: 'c1', name: 'Dr. Ramesh Gupta', department: 'cardiologist', qualification: 'DM Cardiology, MD', experience: '18 years', fee: 700, imageUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['8:00 AM', '8:30 AM', '9:00 AM', '4:30 PM'] },
        { id: 'c2', name: 'Dr. Meena Iyer', department: 'cardiologist', qualification: 'MD, DM Cardiology', experience: '11 years', fee: 650, imageUrl: 'https://images.unsplash.com/photo-1594824436951-7f12bc44ce7e?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['10:00 AM', '10:30 AM', '3:00 PM', '3:30 PM'] },
    ],
    orthopedic: [
        { id: 'or1', name: 'Dr. Vikram Singh', department: 'orthopedic', qualification: 'MS Ortho, MBBS', experience: '14 years', fee: 550, imageUrl: 'https://images.unsplash.com/photo-1537368910025-7028ca43fb36?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['9:30 AM', '10:00 AM', '11:00 AM', '5:30 PM'] },
        { id: 'or2', name: 'Dr. Geeta Bhatt', department: 'orthopedic', qualification: 'DNB Orthopedics', experience: '9 years', fee: 500, imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250&h=250', availableSlots: ['11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'] },
    ],
};

const DEPT_COLORS = {
    neurologist: '#7c3aed',
    ophthalmologist: '#0891b2',
    pediatrician: '#059669',
    cardiologist: '#dc2626',
    orthopedic: '#d97706',
};

export default function DoctorSelection() {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedDept, setSelectedDept, setSelectedDoctor, setSelectedSlot, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlotLocal, setSelectedSlotLocal] = useState({});
    const [expandedDocId, setExpandedDocId] = useState(null);
    const [botStep, setBotStep] = useState(0);

    // Floating animation for the bot icon
    const floatingBotStyle = {
        fontSize: '3rem',
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
        width: '290px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(108, 99, 255, 0.4)',
        borderRadius: '24px 24px 24px 4px',
        padding: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 40px rgba(108, 99, 255, 0.1)',
        transformOrigin: 'bottom left',
        animation: 'fadeUpScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        zIndex: 99,
        color: '#333'
    };

    useEffect(() => {
        // Handle pre-selected department from history/AI
        if (location.state?.preSelectedDept && !selectedDept) {
            import('../../data/departments').then(({ departments }) => {
                const dept = departments.find(d => d.id === location.state.preSelectedDept);
                if (dept) {
                    setSelectedDept(dept);
                } else {
                    navigate('/new/department');
                }
            });
            return; // let setting selectedDept trigger a re-render
        }

        if (!selectedDept) { navigate('/new/department'); return; }

        const deptName = typeof selectedDept.label === 'object' ? selectedDept.label[locale] : selectedDept.label;
        if (location.state?.preSelectedDoctorName) {
            speak(locale === 'ta' ? `${deptName} மருத்துவர் ${location.state.preSelectedDoctorName} காட்டப்படுகிறார். நேரத்தைத் தேர்ந்தெடுக்கவும்.` : `Showing ${location.state.preSelectedDoctorName} from ${deptName}. Please select an available time slot.`);
        } else {
            speak(locale === 'ta' ? `${deptName} மருத்துவர்கள் காட்டப்படுகிறார்கள். தயவுசெய்து ஒரு மருத்துவரையும் நேரத்தையும் தேர்ந்தெடுக்கவும்.` : `Showing doctors for ${deptName}. Please select a doctor and available time slot.`);
        }
        fetchDoctors();
    }, [locale, selectedDept, location.state]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'doctors'), where('department', '==', selectedDept.id));
            const snap = await getDocs(q);
            let resultDocs = [];
            if (!snap.empty) {
                resultDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } else {
                resultDocs = FALLBACK_DOCTORS[selectedDept.id] || [];
            }

            // Filter by preSelectedDoctorName if provided
            if (location.state?.preSelectedDoctorName) {
                const targetName = location.state.preSelectedDoctorName.toLowerCase().trim();
                const filtered = resultDocs.filter(d => d.name.toLowerCase().trim() === targetName);
                if (filtered.length > 0) {
                    resultDocs = filtered;
                }
            }

            setDoctors(resultDocs);

        } catch {
            let fallbackResult = FALLBACK_DOCTORS[selectedDept.id] || [];
            if (location.state?.preSelectedDoctorName) {
                const targetName = location.state.preSelectedDoctorName.toLowerCase().trim();
                const filtered = fallbackResult.filter(d => d.name.toLowerCase().trim() === targetName);
                if (filtered.length > 0) fallbackResult = filtered;
            }
            setDoctors(fallbackResult);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotSelect = (doctor, slot) => {
        setSelectedSlotLocal({ [doctor.id]: slot });
        setSelectedDoctor(doctor);
        setSelectedSlot(slot);
        speak(locale === 'ta' ? `நீங்கள் ${doctor.name} நிபுணரை ${slot} மணிக்குத் தேர்ந்தெடுத்துள்ளீர்கள்.` : `You have selected ${doctor.name} at ${slot}. Proceeding to payment.`);
        setTimeout(() => navigate('/new/payment'), 600);
    };

    const deptColor = selectedDept ? DEPT_COLORS[selectedDept.id] : 'var(--primary)';

    return (
        <div className="screen fade-in">
            <div className="screen-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                        {t('back')}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('stepDoc')}</div>
            </div>

            <div className="screen-body">
                {loading ? (
                    <LoadingSpinner label="Loading available doctors…" />
                ) : (
                    <div style={{ maxWidth: 900, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                            <div style={{
                                fontSize: '2rem', width: 56, height: 56, borderRadius: '50%',
                                background: selectedDept?.lightColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {selectedDept?.icon}
                            </div>
                            <div>
                                <h2 style={{ color: deptColor }}>
                                    {selectedDept && (typeof selectedDept.label === 'object' ? selectedDept.label[locale] : selectedDept.label)}
                                </h2>
                                <p className="text-muted">{doctors.length} {t('doctorsAvailable')}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {doctors.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="card fade-up card-clickable"
                                    style={{
                                        padding: 28,
                                        cursor: doc.about ? 'pointer' : 'default',
                                        border: expandedDocId === doc.id ? `2px solid ${deptColor}88` : '2px solid transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => doc.about && setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                                >
                                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        {/* Doctor avatar / image */}
                                        <div style={{
                                            width: 100, height: 100, borderRadius: '50%',
                                            background: doc.imageUrl ? `url('${doc.imageUrl}')` : `linear-gradient(135deg, ${deptColor}22, ${deptColor}44)`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '2.5rem',
                                            flexShrink: 0,
                                            border: `3px solid ${deptColor}55`,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }}>
                                            {!doc.imageUrl && selectedDept?.icon}
                                        </div>

                                        {/* Doctor info */}
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <h3 style={{ color: 'var(--text-main)', marginBottom: 4 }}>{doc.name}</h3>
                                            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{doc.qualification}</div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                                                <span className="badge badge-primary">⏰ {doc.experience}</span>
                                                <span style={{
                                                    background: 'rgba(0, 229, 160, 0.15)', color: 'var(--success)',
                                                    border: '1px solid rgba(0, 229, 160, 0.35)',
                                                    borderRadius: 999, padding: '4px 14px', fontSize: '0.85rem', fontWeight: 700
                                                }}>
                                                    💰 ₹{doc.fee}
                                                </span>
                                            </div>

                                            {/* Profile Hints (No longer a button, just an indicator) */}
                                            {doc.about && (
                                                <div
                                                    style={{
                                                        color: deptColor,
                                                        fontSize: '0.85rem', fontWeight: 600,
                                                        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6,
                                                        opacity: 0.8
                                                    }}
                                                >
                                                    {expandedDocId === doc.id ? `▲ ${t('hideProfile')}` : `▼ ${t('viewProfile')}`}
                                                </div>
                                            )}

                                            {/* Expanded Profile Info */}
                                            {expandedDocId === doc.id && doc.about && (
                                                <div style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    padding: 16, borderRadius: 12,
                                                    marginBottom: 16, fontSize: '0.9rem',
                                                    color: 'rgba(255,255,255,0.8)',
                                                    lineHeight: 1.5,
                                                    animation: 'fadeIn 0.3s ease-out'
                                                }}>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <strong style={{ color: deptColor }}>{t('aboutDoctor')}:</strong><br />
                                                        {doc.about}
                                                    </div>
                                                    {doc.education && (
                                                        <div style={{ marginBottom: 12 }}>
                                                            <strong style={{ color: deptColor }}>{t('education')}:</strong><br />
                                                            {doc.education}
                                                        </div>
                                                    )}
                                                    {doc.languages && (
                                                        <div>
                                                            <strong style={{ color: deptColor }}>{t('languages')}:</strong><br />
                                                            {doc.languages}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Slots */}
                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    {t('availableSlots')}
                                                </div>
                                                <div
                                                    style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
                                                    onClick={(e) => e.stopPropagation()} /* Prevent card click when clicking slots */
                                                >
                                                    {(doc.availableSlots || []).map(slot => (
                                                        <button
                                                            key={slot}
                                                            className={`slot-btn ${selectedSlotLocal[doc.id] === slot ? 'selected' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSlotSelect(doc, slot);
                                                            }}
                                                        >
                                                            🕐 {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating AI Suggestion Bot (Bottom Left) */}
            <div style={{ position: 'fixed', bottom: '40px', left: '16px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ ...suggestionBubbleStyle, display: botStep === 0 ? 'block' : 'none' }}>
                    <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                    <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>✨ AI Assistant</h3>
                        <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                    </div>

                    <div className="fade-in">
                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            These are our top {selectedDept && (typeof selectedDept.label === 'object' ? selectedDept.label.en : selectedDept.label)}s. Need help choosing?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(1)}>
                                👨‍⚕️ Who is the most experienced?
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(2)}>
                                💰 Show most economical option
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(3)}>
                                🕐 How do I book a slot?
                            </button>
                        </div>
                    </div>
                </div>

                {botStep === 1 && doctors.length > 0 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>✨ AI Assistant</h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {(() => {
                                const mostExp = [...doctors].sort((a, b) => parseInt(b.experience) - parseInt(a.experience))[0];
                                return (
                                    <>
                                        <strong>{mostExp.name}</strong> has the most experience out of available doctors today, with <strong>{mostExp.experience}</strong> of practice. I recommend them for complex cases.
                                    </>
                                );
                            })()}
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                    </div>
                )}

                {botStep === 2 && doctors.length > 0 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <h3 style={{ color: '#5b54d6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>✨ AI Assistant</h3>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {(() => {
                                const cheapest = [...doctors].sort((a, b) => a.fee - b.fee)[0];
                                return (
                                    <>
                                        <strong>{cheapest.name}</strong> currently has the most economical consultation fee of <strong>₹{cheapest.fee}</strong>. You can choose any of their available timeslots to book!
                                    </>
                                );
                            })()}
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                    </div>
                )}

                {botStep === 3 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <h3 style={{ color: '#5b54d6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>✨ AI Assistant</h3>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            To book, simply tap on any of the <strong>available time slots</strong> (e.g., 🕐 11:30 AM) listed under the doctor's name. You will be automatically taken to the payment screen to confirm!
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
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
