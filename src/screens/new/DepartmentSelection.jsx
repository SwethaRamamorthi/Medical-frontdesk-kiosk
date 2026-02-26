import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departments } from '../../data/departments';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import EmergencyButton from '../../components/EmergencyButton';

export default function DepartmentSelection() {
    const navigate = useNavigate();
    const { patient, setSelectedDept, t, locale } = useKiosk();
    const { speak } = useSpeech();

    useEffect(() => {
        speak(locale === 'ta' ? 'தயவுசெய்து நீங்கள் ஆலோசிக்க விரும்பும் துறையைத் தேர்ந்தெடுக்கவும்.' : 'Please select the department you wish to consult.');
    }, [locale]);

    const handleSelect = (dept) => {
        setSelectedDept(dept);
        const deptName = typeof dept.label === 'object' ? dept.label[locale] : dept.label;
        speak(locale === 'ta' ? `நீங்கள் ${deptName} துறையைத் தேர்ந்தெடுத்துள்ளீர்கள்.` : `You selected ${deptName}. Loading available doctors.`);
        navigate('/new/doctor');
    };

    return (
        <div className="screen fade-in">
            {/* Header */}
            <div className="screen-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
                    >
                        {t('back')}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('stepDept')}</div>
            </div>

            <div className="screen-body">
                <div style={{ maxWidth: 1000, width: '100%' }}>
                    {patient && (
                        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                background: 'var(--primary-light)', borderRadius: 12, padding: '10px 20px',
                                fontWeight: 700, color: 'var(--primary)',
                            }}>
                                👤 {patient.name} &nbsp;|&nbsp; {t(patient.gender.toLowerCase()) || patient.gender} &nbsp;|&nbsp; {t('age')} {patient.age}
                            </div>
                        </div>
                    )}

                    <h2 style={{ marginBottom: 8, color: 'var(--primary)' }}>{t('chooseDept')}</h2>
                    <p className="text-muted" style={{ marginBottom: 28 }}>{t('tapIcon')}</p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 20,
                    }}>
                        {departments.map((dept) => (
                            <div
                                key={dept.id}
                                className="card card-clickable fade-up"
                                onClick={() => handleSelect(dept)}
                                style={{
                                    height: 220,
                                    position: 'relative',
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                    padding: 20,
                                    backgroundImage: `url('${dept.imageUrl}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    border: '2px solid transparent',
                                }}
                            >
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.05) 100%)' }} />

                                <div style={{ position: 'relative', zIndex: 2, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16 }}>
                                    {/* Icon container */}
                                    <div style={{
                                        width: 54, height: 54, borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.95)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.8rem', flexShrink: 0,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}>
                                        {dept.icon}
                                    </div>

                                    <div>
                                        <h3 style={{ color: '#fff', marginBottom: 4, fontSize: '1.4rem' }}>
                                            {typeof dept.label === 'object' ? dept.label[locale] : dept.label}
                                        </h3>
                                        {/* Translated Select text */}
                                        <div style={{
                                            display: 'inline-block',
                                            background: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#fff',
                                            borderRadius: 6,
                                            padding: '4px 12px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            border: '1px solid rgba(255,255,255,0.3)'
                                        }}>
                                            {t('continueBtn')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <EmergencyButton />
        </div>
    );
}
