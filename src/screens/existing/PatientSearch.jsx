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
            const q = query(collection(db, 'patients'), where('mobile', '==', phone));
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
            <EmergencyButton />
        </div>
    );
}
