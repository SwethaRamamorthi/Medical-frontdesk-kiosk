import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import NumericKeypad from '../../components/NumericKeypad';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmergencyButton from '../../components/EmergencyButton';

export default function PatientSearch() {
    const navigate = useNavigate();
    const { setPatient, t, locale } = useKiosk();
    const { speak } = useSpeech();

    const [mode, setMode] = useState('phone'); // phone | name
    const [phone, setPhone] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
        speak(locale === 'ta' ? 'மொபைல் எண் அல்லது பெயர் மூலம் உங்கள் ஆவணங்களைத் தேடுங்கள்.' : 'Please search for your records using mobile number or name.');
    }, [locale]);

    const formatDisplay = (val) => {
        const parts = [];
        for (let i = 0; i < val.length; i += 4) parts.push(val.slice(i, i + 4));
        return parts.join('  ') || '_ _ _ _   _ _ _ _   _ _ _ _';
    };

    const searchByPhone = async () => {
        if (phone.length !== 10) { setError(locale === 'ta' ? 'தயவுசெய்து 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter 10 digit mobile number'); return; }
        setError(''); setLoading(true);
        try {
            const q = query(collection(db, 'patients'), where('phone', '==', phone));
            const snap = await getDocs(q);
            if (snap.empty) {
                setError(locale === 'ta' ? 'இந்த எண்ணில் நோயாளி தகவல் இல்லை. புதிய நோயாளியாக பதிவு செய்யவும்.' : 'No patient found with this mobile number. Please register as a new patient.');
            } else {
                const p = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setPatient(p);
                speak(locale === 'ta' ? `மீண்டும் வருக, ${p.name}. ஆவணங்கள் ஏற்றப்படுகின்றன.` : `Welcome back, ${p.name}. Loading your records.`);
                navigate('/existing/history');
            }
        } catch (err) {
            setError(locale === 'ta' ? 'தேடுவதில் பிழை. மீண்டும் முயற்சிக்கவும்.' : 'Error searching. Please try again.');
        } finally { setLoading(false); }
    };

    const searchByName = async () => {
        if (nameSearch.length < 3) { setError('Please enter at least 3 characters'); return; }
        setError(''); setLoading(true);
        try {
            // Simple prefix search
            const q = query(
                collection(db, 'patients'),
                where('name', '>=', nameSearch),
                where('name', '<=', nameSearch + '\uf8ff')
            );
            const snap = await getDocs(q);
            if (snap.empty) {
                setError('No patient found with this name.');
            } else {
                const p = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setPatient(p);
                speak(locale === 'ta' ? `${p.name} கண்டுபிடிக்கப்பட்டார். ஆவணங்கள் ஏற்றப்படுகின்றன.` : `Found ${p.name}. Loading records.`);
                navigate('/existing/history');
            }
        } catch (err) {
            setError('Search error. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="screen fade-in">
            <div className="screen-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                        {t('back')}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>🏥 {t('hospitalName')}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('existingSearchTitle')}</div>
            </div>

            <div className="screen-body">
                {loading ? <LoadingSpinner label={locale === 'ta' ? 'தேடப்படுகிறது…' : 'Searching…'} /> : (
                    <div className="card fade-up" style={{ maxWidth: 520, width: '100%', padding: 40 }}>
                        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: 8 }}>{t('findRecords')}</h2>
                        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
                            {t('searchDesc')}
                        </p>

                        {/* Tab toggle */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
                            {[
                                { key: 'phone', label: t('tabPhone') },
                                { key: 'name', label: t('tabName') },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    className={`btn ${mode === key ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => { setMode(key); setError(''); }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {mode === 'phone' ? (
                            <>
                                <div className="aadhaar-display" style={{ marginBottom: 20 }}>{formatDisplay(phone)}</div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                    <NumericKeypad value={phone} onChange={setPhone} maxLength={10} />
                                </div>
                                {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 20px', marginBottom: 16, fontWeight: 600, textAlign: 'center' }}>⚠️ {error}</div>}
                                <button className="btn btn-primary btn-lg w-full" onClick={searchByPhone} disabled={phone.length !== 10}>
                                    {t('searchBtn')}
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder={t('enterNamePlaceholder')}
                                    value={nameSearch}
                                    onChange={e => setNameSearch(e.target.value)}
                                    style={{ marginBottom: 16, fontSize: '1.25rem' }}
                                    autoFocus
                                />
                                {error && <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 20px', marginBottom: 16, fontWeight: 600, textAlign: 'center' }}>⚠️ {error}</div>}
                                <button className="btn btn-primary btn-lg w-full" onClick={searchByName} disabled={nameSearch.length < 3}>
                                    {t('searchBtn')}
                                </button>
                            </>
                        )}

                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate('/new/aadhaar')}>
                                {t('notRegistered')}
                            </button>
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
                        <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                            {locale === 'ta' ? '✨ AI உதவியாளர்' : '✨ AI Assistant'}
                        </h3>
                        <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                    </div>

                    <div className="fade-in">
                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {locale === 'ta' ? 'வணக்கம்! உங்கள் ஆவணங்களை தேட உதவி வேண்டுமா?' : 'Hello! Need help finding your records?'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(1)}>
                                {locale === 'ta' ? '📱 என்னிடம் எனது பதிவு செய்யப்பட்ட மொபைல் எண் உள்ளது' : '📱 I have my registered phone number'}
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(2)}>
                                {locale === 'ta' ? '🔤 நான் எனது பெயரால் தேட விரும்புகிறேன்' : '🔤 I want to search by my name'}
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: '#5b54d6', color: '#5b54d6', width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px', background: 'transparent' }} onClick={() => setBotStep(3)}>
                                {locale === 'ta' ? '❌ நான் பதிவு செய்யவில்லை என்றால் என்ன செய்வது?' : "❌ What if I'm not registered?"}
                            </button>
                        </div>
                    </div>
                </div>

                {botStep === 1 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                                {locale === 'ta' ? '✨ AI உதவியாளர்' : '✨ AI Assistant'}
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {locale === 'ta' ? (
                                <>சிறப்பு! <strong>"மொபைல் எண்"</strong> தாவல் தேர்ந்தெடுக்கப்பட்டிருப்பதை உறுதிசெய்யவும். திரையில் உள்ள விசைப்பலகையைப் பயன்படுத்தி உங்கள் 10 இலக்க எண்ணை உள்ளிட்டு, <strong>தேடு</strong> என்பதை அழுத்தவும்.</>
                            ) : (
                                <>Great! Make sure the "Mobile Number" tab is selected. Use the on-screen keypad to enter your 10-digit phone number, then tap <strong>Search</strong>.</>
                            )}
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => { setMode('phone'); setBotStep(-1); }}>
                            {locale === 'ta' ? 'புரிந்தது ➔' : 'Got it ➔'}
                        </button>
                    </div>
                )}

                {botStep === 2 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                                {locale === 'ta' ? '✨ AI உதவியாளர்' : '✨ AI Assistant'}
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {locale === 'ta' ? (
                                <>பிரச்சனை இல்லை! <strong>"பெயர்"</strong> தாவலைத் தட்டவும். பிறகு, விசைப்பலகையைப் பயன்படுத்தி உங்கள் பெயரின் முதல் 3 எழுத்துக்களைத் தட்டச்சு செய்து <strong>தேடு</strong> என்பதை அழுத்தவும்.</>
                            ) : (
                                <>No problem! Tap the "Name" tab above the keypad. Then, use the keyboard that appears to type at least the first 3 letters of your name and tap <strong>Search</strong>.</>
                            )}
                        </p>
                        <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => { setMode('name'); setBotStep(-1); }}>
                            {locale === 'ta' ? 'புரிந்தது ➔' : 'Got it ➔'}
                        </button>
                    </div>
                )}

                {botStep === 3 && (
                    <div style={suggestionBubbleStyle} className="fade-in">
                        <div style={{ position: 'absolute', bottom: '-12px', left: '16px', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid rgba(108, 99, 255, 0.4)' }} />
                        <div style={{ position: 'absolute', bottom: '-9px', left: '17px', width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '11px solid rgba(255, 255, 255, 0.95)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h3 style={{ color: '#5b54d6', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', margin: 0 }}>
                                {locale === 'ta' ? '✨ AI உதவியாளர்' : '✨ AI Assistant'}
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setBotStep(-1); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px', lineHeight: 1 }}>×</button>
                        </div>

                        <p style={{ color: '#333', marginBottom: 16, lineHeight: 1.5, fontSize: '0.9rem' }}>
                            {locale === 'ta' ? (
                                <>இது உங்கள் முதல் வருகை என்றால், உங்கள் புதிய சுயவிவரத்தை உருவாக்க அட்டையின் கீழே உள்ள <strong>"புதிய நோயாளியாக பதிவு செய்யவும்"</strong> என்ற பொத்தானைத் தட்டவும்.</>
                            ) : (
                                <>If this is your first visit, tap the <strong>"Not registered? Register as New Patient"</strong> button at the bottom of the card to create your new profile.</>
                            )}
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-outline" style={{ width: 'auto', padding: '10px' }} onClick={() => setBotStep(0)}>{locale === 'ta' ? '⬅ பின்செல்' : '⬅ Back'}</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: '#5b54d6', borderColor: '#5b54d6' }} onClick={() => navigate('/new/aadhaar')}>
                                {locale === 'ta' ? 'பதிவைத் தொடங்கு ➔' : 'Start Registration ➔'}
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
