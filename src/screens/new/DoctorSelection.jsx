import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const { selectedDept, setSelectedDoctor, setSelectedSlot, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlotLocal, setSelectedSlotLocal] = useState({});
    const [expandedDocId, setExpandedDocId] = useState(null);

    useEffect(() => {
        if (!selectedDept) { navigate('/new/department'); return; }
        const deptName = typeof selectedDept.label === 'object' ? selectedDept.label[locale] : selectedDept.label;
        speak(locale === 'ta' ? `${deptName} மருத்துவர்கள் காட்டப்படுகிறார்கள். தயவுசெய்து ஒரு மருத்துவரையும் நேரத்தையும் தேர்ந்தெடுக்கவும்.` : `Showing doctors for ${deptName}. Please select a doctor and available time slot.`);
        fetchDoctors();
    }, [locale]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'doctors'), where('department', '==', selectedDept.id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setDoctors(FALLBACK_DOCTORS[selectedDept.id] || []);
            }
        } catch {
            setDoctors(FALLBACK_DOCTORS[selectedDept.id] || []);
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
                                                <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
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
            <EmergencyButton />
        </div>
    );
}
