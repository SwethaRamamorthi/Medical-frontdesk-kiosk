import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { departments } from '../../data/departments';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import EmergencyButton from '../../components/EmergencyButton';

export default function DepartmentSelection() {
    const navigate = useNavigate();
    const { patient, setSelectedDept, t, locale } = useKiosk();
    const { speak } = useSpeech();
    const [botStep, setBotStep] = useState(0);

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
    };

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

                {/* Floating AI Suggestion Bot (Bottom Left) */}
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
                    <div style={{ ...suggestionBubbleStyle, display: botStep === 0 ? 'block' : 'none' }}>
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                                ✨ AI Assistant
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <div className="fade-in">
                            <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                                Not sure which department to choose? Tell me your symptoms and I can guide you!
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(1)}>
                                    🤕 I have a headache / dizziness
                                </button>
                                <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(2)}>
                                    🦴 I have joint / bone pain
                                </button>
                                <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(3)}>
                                    ❤️ I have chest pain / palpitations
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
                                For headaches and dizziness, you should consult a <strong>Neurologist</strong>. I'll highlight the Neurology department for you.
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => handleSelect(departments.find(d => d.id === 'neurologist'))}>
                                    Select Neurology ➔
                                </button>
                            </div>
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
                                For bone or joint pain, an <strong>Orthopedic</strong> specialist is best. Let's go to their profiles!
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => handleSelect(departments.find(d => d.id === 'orthopedic'))}>
                                    Select Orthopedics ➔
                                </button>
                            </div>
                        </div>
                    )}

                    {botStep === 3 && (
                        <div style={suggestionBubbleStyle} className="fade-in">
                            <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                            <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                            <h3 style={{ color: '#5b54d6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>✨ AI Assistant</h3>
                            <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.95rem' }}>
                                Chest pain and palpitations require attention from a <strong>Cardiologist</strong>. Please select Cardiology, or use the Emergency button if urgent.
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>⬅ Back</button>
                                <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => handleSelect(departments.find(d => d.id === 'cardiologist'))}>
                                    Select Cardiology ➔
                                </button>
                            </div>
                        </div>
                    )}

                    {/* The Bot Icon */}
                    <div style={floatingBotStyle} onClick={() => setBotStep(botStep === -1 ? 0 : -1)}>
                        🤖
                    </div>
                </div>

            </div>
            <EmergencyButton />
        </div>
    );
}
