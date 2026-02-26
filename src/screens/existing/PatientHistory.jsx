import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmergencyButton from '../../components/EmergencyButton';

export default function PatientHistory() {
    const navigate = useNavigate();
    const { patient, resetFlow, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (!patient) return null;

    const lastVisit = appointments[0];

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
