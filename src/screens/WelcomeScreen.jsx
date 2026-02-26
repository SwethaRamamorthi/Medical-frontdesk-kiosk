import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '../context/KioskContext';
import { useSpeech } from '../hooks/useSpeech';
import EmergencyButton from '../components/EmergencyButton';

export default function WelcomeScreen() {
    const navigate = useNavigate();
    const { resetAll, toggleDark, darkMode, tokenNumber, t, locale, setLocale } = useKiosk();
    const { speak } = useSpeech();

    useEffect(() => {
        resetAll();
        speak(locale === 'ta' ? 'ஸ்மார்ட்கேர் மருத்துவமனைக்கு வருக.' : 'Welcome to SmartCare Hospital. Please select New Patient or Existing Patient to proceed.');
    }, [locale]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="screen fade-in" style={{
            minHeight: '100vh',
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=100&q=80" alt="Hospital Logo" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                    <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>{t('hospitalName')}</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{dateStr}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem' }}>{timeStr}</div>

                    {/* Language Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 4, marginLeft: 8 }}>
                        <button
                            onClick={() => setLocale('en')}
                            style={{
                                background: locale === 'en' ? '#fff' : 'transparent',
                                color: locale === 'en' ? 'var(--primary-dark)' : '#fff',
                                border: 'none', borderRadius: 8, padding: '6px 12px',
                                cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                        >EN</button>
                        <button
                            onClick={() => setLocale('ta')}
                            style={{
                                background: locale === 'ta' ? '#fff' : 'transparent',
                                color: locale === 'ta' ? 'var(--primary-dark)' : '#fff',
                                border: 'none', borderRadius: 8, padding: '6px 12px',
                                cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                                transition: 'all 0.2s', fontFamily: 'Mukta Malar, sans-serif'
                            }}
                        >தமிழ்</button>
                    </div>

                    <div className="token-badge" style={{ background: 'rgba(255,255,255,0.9)', marginLeft: 8 }}>
                        Token #{tokenNumber}
                    </div>
                </div>
            </div>

            {/* Main card */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                paddingTop: 0,
            }}>
                <div className="card fade-up" style={{
                    maxWidth: 700,
                    width: '100%',
                    padding: '48px 40px',
                    textAlign: 'center',
                    borderRadius: 28,
                }}>
                    <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=200&q=80" alt="Hospital Icon" style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', marginBottom: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <h1 style={{ marginBottom: '8px', color: 'var(--primary)' }}>{t('welcomeTo')}</h1>
                    <h1 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>{t('kioskTitle')}</h1>
                    <p className="text-muted" style={{ marginBottom: '40px', fontSize: '1.15rem' }}>
                        {t('kioskSubtitle')}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* New Patient with Background Image */}
                        <div
                            className="card card-clickable fade-up"
                            style={{
                                height: 280,
                                position: 'relative',
                                borderRadius: 24,
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                boxShadow: '0 15px 35px rgba(0,212,200,0.25)',
                                color: '#fff',
                                padding: 24,
                                backgroundImage: `url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center center',
                                backgroundColor: '#f0f0f0',
                                border: '2px solid rgba(0,212,200,0.4)',
                            }}
                            onClick={() => {
                                speak(locale === 'ta' ? 'புதிய நோயாளி பதிவு.' : 'New Patient registration. Please have your Aadhaar card ready.');
                                navigate('/new/aadhaar');
                            }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,180,170,0.5) 50%, rgba(0,0,0,0.1) 100%)' }} />
                            <div style={{ position: 'relative', zIndex: 2, textAlign: 'left' }}>
                                <div style={{ background: 'var(--primary)', color: '#fff', padding: '6px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 12, fontWeight: 800, fontSize: '0.85rem', letterSpacing: 1 }}>STEP 1</div>
                                <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.8rem' }}>{t('newPatient')}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', lineHeight: 1.4, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {t('newPatientDesc')}
                                </p>
                            </div>
                        </div>

                        {/* Existing Patient with Background Image */}
                        <div
                            className="card card-clickable fade-up"
                            style={{
                                height: 280,
                                position: 'relative',
                                borderRadius: 24,
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                color: '#fff',
                                padding: 24,
                                backgroundImage: `url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center center',
                                backgroundColor: '#f0f0f0',
                            }}
                            onClick={() => {
                                speak(locale === 'ta' ? 'தற்போதைய நோயாளி தேடல்.' : 'Existing Patient. Please search with your mobile number or name.');
                                navigate('/existing');
                            }}
                        >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }} />
                            <div style={{ position: 'relative', zIndex: 2, textAlign: 'left' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', padding: '6px 12px', borderRadius: 8, display: 'inline-block', marginBottom: 12, fontWeight: 800, fontSize: '0.85rem', letterSpacing: 1 }}>QUICK ACCESS</div>
                                <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.8rem' }}>{t('existingPatient')}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.4, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {t('existingPatientDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted" style={{ marginTop: '28px', fontSize: '0.95rem' }}>
                        {t('dataPrivacy')}
                    </p>
                </div>

                {/* Quick info strips */}
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    maxWidth: 700,
                    width: '100%',
                }}>
                    {[
                        { icon: '📞', text: t('helpline') },
                        { icon: '🕐', text: t('opd') },
                        { icon: '🚑', text: t('emergencyNum') },
                    ].map((item, i) => (
                        <div key={i} style={{
                            background: 'rgba(0, 212, 200, 0.10)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--primary)',
                            border: '1px solid rgba(0,212,200,0.25)',
                            boxShadow: '0 0 12px rgba(0,212,200,0.12)',
                        }}>
                            {item.icon} {item.text}
                        </div>
                    ))}
                </div>
            </div>

            <EmergencyButton />
        </div>
    );
}
