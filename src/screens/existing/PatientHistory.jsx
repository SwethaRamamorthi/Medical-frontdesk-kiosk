import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import { departments } from '../../data/departments';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmergencyButton from '../../components/EmergencyButton';

// Floating animation for the bot icon
const floatingBotStyle = {
    fontSize: '3rem',
    filter: 'drop-shadow(0 10px 15px rgba(91,84,214,0.3))',
    animation: 'floating 3s ease-in-out infinite',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 100,
};

// Tooltip/bubble style for the suggestion
const suggestionBubbleStyle = {
    position: 'absolute',
    bottom: '100%',
    left: '20px',
    marginBottom: '20px',
    width: '290px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    border: '2px solid rgba(108, 99, 255, 0.4)',
    borderRadius: '24px 24px 24px 4px', // distinct bubble shape
    padding: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 40px rgba(108, 99, 255, 0.1)',
    transformOrigin: 'bottom left',
    animation: 'fadeUpScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    zIndex: 99,
};

export default function PatientHistory() {
    const navigate = useNavigate();
    const { patient, resetFlow, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [botStep, setBotStep] = useState(0);

    useEffect(() => {
        if (!patient) { navigate('/existing'); return; }
        speak(locale === 'ta' ? `மீண்டும் வருக, ${patient.name}. உங்கள் முந்தைய வருகை ஆவணங்கள் இங்கே.` : `Welcome back, ${patient.name}. Here are your visit records.`);
        fetchHistory();
    }, [locale]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'appointments'),
                where('patientId', '==', patient.id)
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by date desc
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setAppointments(data);
        } catch (err) {
            console.warn('Could not fetch history:', err.message);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNew = () => {
        // Keep patient context but reset flow selections
        resetFlow(); // resets dept/doctor/slot/appointment but we need to retain patient
        navigate('/new/department');
    };

    const handleRevisitDoctor = (doctorName, deptId) => {
        resetFlow();
        // Skip department selection and go straight to doctor selection for that department
        navigate('/new/doctor', { state: { preSelectedDept: deptId, preSelectedDoctorName: doctorName } });
    };

    const handleSuggestOther = (deptId) => {
        resetFlow();
        navigate('/new/doctor', { state: { preSelectedDept: deptId } });
    };

    if (!patient) return null;

    const lastVisit = appointments[0];

    // Find department ID from the last visit's department name
    let lastVisitDeptId = null;
    if (lastVisit?.department) {
        const dept = departments.find(d =>
            d.label.en === lastVisit.department ||
            d.label.ta === lastVisit.department ||
            d.id.toLowerCase() === lastVisit.department.toLowerCase()
        );
        lastVisitDeptId = dept ? dept.id : null;
    }

    return (
        <div className="screen fade-in">
            <div className="screen-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate('/existing')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                        {t('back')}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('patientRecords')}</div>
            </div>

            <div className="screen-body">
                <div style={{ maxWidth: 900, width: '100%' }}>
                    {/* Patient info card */}
                    <div className="card fade-up" style={{ padding: 28, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: `url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '3px solid var(--primary)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }} />
                                <div>
                                    <h2 style={{ color: 'var(--primary)', marginBottom: 4 }}>{patient.name}</h2>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <span className="badge badge-primary">🪪 {patient.aadhaar?.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}</span>
                                        <span className="badge badge-primary">👤 {t(patient.gender.toLowerCase()) || patient.gender}</span>
                                        <span className="badge badge-primary">🎂 {t('age')} {patient.age}</span>
                                        <span className="badge badge-primary">📱 {patient.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={handleBookNew}>
                                {t('bookNewAppt')}
                            </button>
                        </div>
                    </div>

                    {/* Last visit summary */}
                    {lastVisit && (
                        <div className="card fade-up" style={{
                            padding: 24, marginBottom: 24,
                            background: 'linear-gradient(135deg, var(--primary-light), #e0f0ff)',
                            border: '2px solid var(--primary)',
                        }}>
                            <h3 style={{ color: 'var(--primary)', marginBottom: 12 }}>{t('lastVisit')}</h3>
                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                {[
                                    [t('doctorTerm'), lastVisit.doctorName],
                                    [t('deptTerm'), lastVisit.department],
                                    [t('dateTerm'), lastVisit.date],
                                    [t('slotTerm'), lastVisit.slot],
                                    [t('statusTerm'), lastVisit.paymentStatus],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Floating AI Suggestion Bot (Bottom Left) */}
                    {lastVisit && lastVisitDeptId && (
                        <div style={{
                            position: 'fixed',
                            bottom: '40px',
                            left: '20px',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}>
                            {/* The Message Bubble */}
                            <div style={{ ...suggestionBubbleStyle, display: botStep === -1 ? 'none' : 'block' }}>
                                {/* Arrow pointing down to the bot */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-12px',
                                    left: '16px',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '12px solid transparent',
                                    borderRight: '12px solid transparent',
                                    borderTop: '12px solid rgba(108, 99, 255, 0.4)'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-9px',
                                    left: '17px',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '11px solid transparent',
                                    borderRight: '11px solid transparent',
                                    borderTop: '11px solid rgba(255, 255, 255, 0.95)'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                                        ✨ AI Assistant
                                    </h3>
                                    <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                                </div>

                                {botStep === 0 && (
                                    <div className="fade-in" style={{ animation: 'fadeIn 0.3s' }}>
                                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                            Hi <strong>{patient.name}</strong>! I noticed your last visit was with <strong>Dr. {lastVisit.doctorName}</strong> for {lastVisit.department.replace(/department/i, '').trim()}. How can I help you today?
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }}
                                                onClick={() => setBotStep(1)}
                                            >
                                                👨‍⚕️ I want a follow-up with Dr. {lastVisit.doctorName}
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }}
                                                onClick={() => setBotStep(2)}
                                            >
                                                � I'd like to see another {lastVisit.department.replace(/department/i, '').trim()} doctor
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }}
                                                onClick={() => setBotStep(3)}
                                            >
                                                🩺 I have a new or different problem
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {botStep === 1 && (
                                    <div className="fade-in" style={{ animation: 'fadeIn 0.3s' }}>
                                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                            Great! Let's book a follow-up. I will take you to <strong>Dr. {lastVisit.doctorName}'s</strong> profile where you can select an available time slot and complete your booking.
                                        </p>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                            <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => handleRevisitDoctor(lastVisit.doctorName, lastVisitDeptId)}>
                                                Select Time Slot ➔
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {botStep === 2 && (
                                    <div className="fade-in" style={{ animation: 'fadeIn 0.3s' }}>
                                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                            Sure. I will show you our other experienced doctors in the <strong>{lastVisit.department}</strong> department so you can choose who you'd like to consult.
                                        </p>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                            <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => handleSuggestOther(lastVisitDeptId)}>
                                                View Doctors ➔
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {botStep === 3 && (
                                    <div className="fade-in" style={{ animation: 'fadeIn 0.3s' }}>
                                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                                            I'm here to help. I will redirect you to the department selection menu so we can find the right specialist for your new concern.
                                        </p>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                            <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={handleBookNew}>
                                                Start New Booking ➔
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* The Bot Icon */}
                            <div style={floatingBotStyle} onClick={() => setBotStep(botStep === -1 ? 0 : -1)}>
                                🤖
                            </div>
                        </div>
                    )}

                    {/* History table */}
                    <div className="card fade-up" style={{ padding: 28 }}>
                        <h3 style={{ marginBottom: 20, color: 'var(--text-main)' }}>{t('visitHistory')} ({appointments.length})</h3>
                        {loading ? (
                            <LoadingSpinner label="Loading history…" />
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                                <p>{t('noRecords')}</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--primary-light)' }}>
                                            {[t('apptId'), t('doctorTerm'), t('deptTerm'), t('dateTerm'), t('slotTerm'), t('statusTerm')].map(h => (
                                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', borderRadius: 4 }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((appt, i) => (
                                            <tr key={appt.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)' }}>
                                                    {appt.appointmentId || appt.id?.slice(0, 8)}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>{appt.doctorName || '—'}</td>
                                                <td style={{ padding: '12px 16px' }}>{appt.department || '—'}</td>
                                                <td style={{ padding: '12px 16px' }}>{appt.date || '—'}</td>
                                                <td style={{ padding: '12px 16px' }}>{appt.slot || '—'}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        background: appt.paymentStatus === 'Paid' ? '#d1fae5' : '#fee2e2',
                                                        color: appt.paymentStatus === 'Paid' ? '#065f46' : '#dc2626',
                                                        borderRadius: 999, padding: '4px 12px', fontWeight: 700, fontSize: '0.85rem',
                                                    }}>
                                                        {appt.paymentStatus === 'Paid' ? '✅' : '⏳'} {appt.paymentStatus || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <EmergencyButton />
        </div>
    );
}
