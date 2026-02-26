import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { lookupAadhaar } from '../../data/mockAadhaar';
import { useKiosk } from '../../context/KioskContext';
import { useSpeech } from '../../hooks/useSpeech';
import NumericKeypad from '../../components/NumericKeypad';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmergencyButton from '../../components/EmergencyButton';

export default function AadhaarEntry() {
    const navigate = useNavigate();
    const { setPatient, t, locale } = useKiosk();
    const { speak } = useSpeech();

    const [aadhaar, setAadhaar] = useState('');
    const [step, setStep] = useState('enter'); // enter | confirm | loading
    const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        speak(locale === 'ta' ? 'கீழே உள்ள விசைப்பலகையைப் பயன்படுத்தி உங்கள் 12 இலக்க ஆதார் எண்ணை உள்ளிடவும்.' : 'Please enter your 12-digit Aadhaar number using the keypad below.');
    }, [locale]);

    const formatDisplay = (val) => {
        const parts = [];
        for (let i = 0; i < val.length; i += 4) parts.push(val.slice(i, i + 4));
        return parts.join('  ') || '_ _ _ _   _ _ _ _   _ _ _ _';
    };

    const handleSubmit = async () => {
        if (aadhaar.length !== 12) { setError('Please enter all 12 digits'); return; }
        setError('');
        setStep('loading');

        try {
            // Check if patient already exists in Firestore
            const q = query(collection(db, 'patients'), where('aadhaar', '==', aadhaar));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const existing = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setPatient(existing);
                speak(locale === 'ta' ? `நோயாளி ${existing.name} ஏற்கனவே பதிவு செய்யப்பட்டுள்ளார்.` : `Patient ${existing.name} already registered. Redirecting to existing patient.`);
                navigate('/existing/history');
                return;
            }

            // Lookup in mock Aadhaar data
            const mock = lookupAadhaar(aadhaar);
            if (mock) {
                setForm({ name: mock.name, age: String(mock.age), gender: mock.gender, phone: mock.phone });
                speak(locale === 'ta' ? `${mock.name} க்கான ஆதார் விவரங்கள் கிடைத்தன.` : `Aadhaar details found for ${mock.name}. Please confirm your details.`);
            } else {
                setForm({ name: '', age: '', gender: 'Male', phone: '' });
                speak(locale === 'ta' ? 'புதிய ஆதார். உங்கள் விவரங்களை நிரப்பவும்.' : 'New Aadhaar detected. Please fill in your details.');
            }
            setStep('confirm');
        } catch (err) {
            console.error(err);
            setError('Error checking records. Please try again.');
            setStep('enter');
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
        setStep('loading');
        try {
            const docRef = await addDoc(collection(db, 'patients'), {
                aadhaar,
                name: form.name,
                age: Number(form.age),
                gender: form.gender,
                phone: form.phone,
                createdAt: serverTimestamp(),
            });
            const newPatient = { id: docRef.id, aadhaar, ...form, age: Number(form.age) };
            setPatient(newPatient);
            speak(`Registration successful! Welcome ${form.name}.`);
            navigate('/new/department');
        } catch (err) {
            console.error(err);
            setError('Failed to save. Please try again.');
            setStep('confirm');
        }
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
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>{t('step1Title')}</div>
            </div>

            <div className="screen-body">
                {step === 'loading' && <LoadingSpinner label="Processing…" />}

                {step === 'enter' && (
                    <div className="card fade-up" style={{ padding: '40px 32px', textAlign: 'center' }}>
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🪪</div>
                            <h2 style={{ marginBottom: 8, color: 'var(--primary-dark)' }}>{t('enterAadhaar')}</h2>
                            <p className="text-muted">{t('aadhaarDesc')}</p>
                        </div>

                        <div className="aadhaar-display" style={{ marginBottom: 24 }}>
                            {formatDisplay(aadhaar)}
                        </div>

                        {error && <div style={{ color: 'var(--danger)', marginBottom: 20, fontWeight: 600 }}>{error}</div>}

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                            <NumericKeypad value={aadhaar} onChange={setAadhaar} maxLength={12} />
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: 24, fontSize: '1.2rem', padding: '16px' }}
                            onClick={handleSubmit}
                            disabled={aadhaar.length !== 12}
                        >
                            {t('continueBtn')}
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="card fade-left" style={{ padding: '36px' }}>
                        <h2 style={{ color: 'var(--primary-dark)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            {t('confirmDetails')}
                        </h2>
                        <p className="text-muted" style={{ marginBottom: 28 }}>
                            Aadhaar: <strong>{aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: 6 }}>{t('fullName')}</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    value={form.name}
                                    placeholder={t('enterYourName')}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 20 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: 6 }}>{t('age')}</label>
                                    <input
                                        className="input-field"
                                        type="number"
                                        value={form.age}
                                        placeholder={t('enterAge')}
                                        onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: 6 }}>{t('mobileNumber')}</label>
                                    <input
                                        className="input-field"
                                        type="tel"
                                        value={form.phone}
                                        placeholder={t('tenDigitMobile')}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: 6 }}>{t('gender')}</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <button
                                            key={g}
                                            className={`btn ${form.gender === g ? 'btn-primary' : 'btn-outline'}`}
                                            style={{ flex: 1, padding: '14px 8px' }}
                                            onClick={() => setForm(p => ({ ...p, gender: g }))}
                                        >
                                            {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🧑'} {t(g.toLowerCase())}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 12, padding: '12px 20px', marginTop: 16, fontWeight: 600, textAlign: 'center' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setStep('enter'); setError(''); }}>
                                {t('reEnter')}
                            </button>
                            <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                                {t('registerContinue')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <EmergencyButton />
        </div>
    );
}
