/**
 * SeedScreen – Dev-only utility page accessible at /seed
 * Writes 5 dummy existing patients (with Aadhaar + appointment history)
 * to Firestore using the browser client, which respects the project's
 * security rules and avoids the PERMISSION_DENIED error from Node.
 *
 * Usage: run the app → visit http://localhost:5173/seed → click "Seed Patients"
 */

import { useState } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const DUMMY_PATIENTS = [
    {
        aadhaar: '432156789012',
        name: 'Nisha Reddy',
        age: 31,
        gender: 'Female',
        phone: '9811223344',
        createdAt: new Date().toISOString(),
        appointments: [
            { date: '2025-11-10', department: 'Ophthalmologist', doctor: 'Dr. Sunil Verma', fee: 450, token: 'A12', status: 'Completed' },
            { date: '2026-01-20', department: 'Neurologist', doctor: 'Dr. Rajesh Kumar', fee: 600, token: 'B04', status: 'Completed' },
        ],
    },
    {
        aadhaar: '543217890123',
        name: 'Mohan Das',
        age: 47,
        gender: 'Male',
        phone: '9922334455',
        createdAt: new Date().toISOString(),
        appointments: [
            { date: '2025-10-05', department: 'Cardiologist', doctor: 'Dr. Ramesh Gupta', fee: 700, token: 'C07', status: 'Completed' },
            { date: '2026-02-01', department: 'Orthopedic', doctor: 'Dr. Vikram Singh', fee: 550, token: 'D11', status: 'Completed' },
        ],
    },
    {
        aadhaar: '654328901234',
        name: 'Lakshmi Krishnan',
        age: 55,
        gender: 'Female',
        phone: '9733445566',
        createdAt: new Date().toISOString(),
        appointments: [
            { date: '2025-09-15', department: 'Pediatrician', doctor: 'Dr. Kavitha Nair', fee: 400, token: 'E02', status: 'Completed' },
            { date: '2025-12-22', department: 'Cardiologist', doctor: 'Dr. Meena Iyer', fee: 650, token: 'F09', status: 'Completed' },
            { date: '2026-02-18', department: 'Neurologist', doctor: 'Dr. Ananya Mehta', fee: 500, token: 'G05', status: 'Completed' },
        ],
    },
    {
        aadhaar: '765439012345',
        name: 'Sanjay Mehta',
        age: 39,
        gender: 'Male',
        phone: '9644556677',
        createdAt: new Date().toISOString(),
        appointments: [
            { date: '2025-08-30', department: 'Orthopedic', doctor: 'Dr. Geeta Bhatt', fee: 500, token: 'H03', status: 'Completed' },
            { date: '2026-01-10', department: 'Ophthalmologist', doctor: 'Dr. Priya Sharma', fee: 400, token: 'I08', status: 'Completed' },
        ],
    },
    {
        aadhaar: '876540123456',
        name: 'Divya Pillai',
        age: 26,
        gender: 'Female',
        phone: '9555667788',
        createdAt: new Date().toISOString(),
        appointments: [
            { date: '2025-07-14', department: 'Pediatrician', doctor: 'Dr. Arjun Pillai', fee: 350, token: 'J06', status: 'Completed' },
            { date: '2025-11-27', department: 'Neurologist', doctor: 'Dr. Rajesh Kumar', fee: 600, token: 'K01', status: 'Completed' },
            { date: '2026-02-14', department: 'Orthopedic', doctor: 'Dr. Vikram Singh', fee: 550, token: 'L10', status: 'Completed' },
        ],
    },
];

const DUMMY_DOCTORS = [
    {
        id: 'n1', name: 'Dr. Rajesh Kumar', department: 'neurologist',
        qualification: 'MD Neurology, DM', experience: '12 years', fee: 600,
        availableSlots: ['9:00 AM', '9:30 AM', '10:00 AM', '11:00 AM', '11:30 AM'],
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Rajesh Kumar is a Senior Consultant Neurologist specializing in stroke management, epilepsy, and movement disorders.',
        education: 'MBBS from AIIMS Delhi, MD Neurology from JIPMER, DM in Neurology.',
        languages: 'English, Tamil, Hindi'
    },
    {
        id: 'n2', name: 'Dr. Ananya Mehta', department: 'neurologist',
        qualification: 'MBBS, MD, DNB Neuro', experience: '8 years', fee: 500,
        availableSlots: ['10:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Ananya Mehta focuses on neuromuscular disorders and neuro-immunology, offering compassionate patient care.',
        education: 'MD Neurology from CMC Vellore, DNB Neuro.',
        languages: 'English, Tamil, Kannada'
    },
    {
        id: 'o1', name: 'Dr. Sunil Verma', department: 'ophthalmologist',
        qualification: 'MS Ophthalmology', experience: '15 years', fee: 450,
        availableSlots: ['8:30 AM', '9:00 AM', '9:30 AM', '4:00 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1537368910025-7028ca43fb36?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Sunil Verma is a renowned eye surgeon specializing in cataract surgery, glaucoma, and laser refractive surgeries.',
        education: 'MS Ophthalmology from Madras Medical College.',
        languages: 'English, Tamil, Telugu'
    },
    {
        id: 'o2', name: 'Dr. Priya Sharma', department: 'ophthalmologist',
        qualification: 'DNB Ophthalmology', experience: '7 years', fee: 400,
        availableSlots: ['11:00 AM', '11:30 AM', '3:00 PM', '3:30 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1594824436951-7f12bc44ce7e?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Priya Sharma is dedicated to pediatric ophthalmology and correction of adult squint disorders.',
        education: 'DNB Ophthalmology, Fellowship in Pediatric Ophthalmology.',
        languages: 'English, Tamil, Hindi'
    },
    {
        id: 'p1', name: 'Dr. Kavitha Nair', department: 'pediatrician',
        qualification: 'MD Pediatrics, DCH', experience: '10 years', fee: 400,
        availableSlots: ['9:00 AM', '10:00 AM', '10:30 AM', '5:00 PM'],
        imageUrl: 'https://plus.unsplash.com/premium_photo-1661764878654-3d0fc2eefcca?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Kavitha Nair is an expert in child healthcare, immunizations, and developmental pediatrics.',
        education: 'MD Pediatrics, DCH from Stanley Medical College.',
        languages: 'English, Tamil, Malayalam'
    },
    {
        id: 'p2', name: 'Dr. Arjun Pillai', department: 'pediatrician',
        qualification: 'MBBS, DCH, MD', experience: '6 years', fee: 350,
        availableSlots: ['11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Arjun Pillai is known for his friendly approach in treating infectious diseases and newborn care.',
        education: 'MD in Pediatrics from AFMC Pune.',
        languages: 'English, Tamil, Hindi'
    },
    {
        id: 'c1', name: 'Dr. Ramesh Gupta', department: 'cardiologist',
        qualification: 'DM Cardiology, MD', experience: '18 years', fee: 700,
        availableSlots: ['8:00 AM', '8:30 AM', '9:00 AM', '4:30 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Ramesh Gupta is a pioneer in interventional cardiology and structural heart disease treatments.',
        education: 'DM Cardiology from AIIMS Delhi, Fellow of American College of Cardiology.',
        languages: 'English, Tamil, Hindi'
    },
    {
        id: 'c2', name: 'Dr. Meena Iyer', department: 'cardiologist',
        qualification: 'MD, DM Cardiology', experience: '11 years', fee: 650,
        availableSlots: ['10:00 AM', '10:30 AM', '3:00 PM', '3:30 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Meena Iyer focuses on preventive cardiology and cardiac rehabilitation programs.',
        education: 'DM Cardiology from Sri Ramachandra Medical College.',
        languages: 'English, Tamil, Malayalam'
    },
    {
        id: 'or1', name: 'Dr. Vikram Singh', department: 'orthopedic',
        qualification: 'MS Ortho, MBBS', experience: '14 years', fee: 550,
        availableSlots: ['9:30 AM', '10:00 AM', '11:00 AM', '5:30 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1537368910025-7028ca43fb36?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Vikram Singh specializes in joint replacement surgery, sports injuries, and complex trauma.',
        education: 'MS Orthopedics from KEM Hospital Mumbai.',
        languages: 'English, Tamil, Punjabi, Hindi'
    },
    {
        id: 'or2', name: 'Dr. Geeta Bhatt', department: 'orthopedic',
        qualification: 'DNB Orthopedics', experience: '9 years', fee: 500,
        availableSlots: ['11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'],
        imageUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400&h=400',
        about: 'Dr. Geeta Bhatt offers expertise in arthroscopy and treating degenerative spine conditions.',
        education: 'DNB Orthopedics, Fellowship in Spine Surgery.',
        languages: 'English, Tamil, Hindi'
    },
];

export default function SeedScreen() {
    const [log, setLog] = useState([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const addLog = (msg, type = 'info') => setLog(prev => [...prev, { msg, type }]);

    const handleSeed = async () => {
        setRunning(true);
        setLog([]);
        setDone(false);
        addLog('🌱 Starting patient seed…');

        let seeded = 0;
        let skipped = 0;

        for (const patient of DUMMY_PATIENTS) {
            try {
                // Check if already exists
                const q = query(collection(db, 'patients'), where('aadhaar', '==', patient.aadhaar));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    addLog(`⏭  Skipped (already exists): ${patient.name} (${patient.aadhaar})`, 'warn');
                    skipped++;
                    continue;
                }
                await addDoc(collection(db, 'patients'), patient);
                addLog(`✅ Added: ${patient.name} — Aadhaar: ${patient.aadhaar}`, 'success');
                seeded++;
            } catch (err) {
                addLog(`❌ Failed for ${patient.name}: ${err.message}`, 'error');
            }
        }

        addLog(`\n🎉 Done! ${seeded} added, ${skipped} skipped.`);
        setRunning(false);
        setDone(true);
    };

    const handleSeedDoctors = async () => {
        setRunning(true);
        setLog([]);
        setDone(false);
        addLog('🩺 Starting doctor seed…');

        let seeded = 0;
        let skipped = 0;

        for (const doctor of DUMMY_DOCTORS) {
            try {
                // Check if already exists based on our custom 'id'
                const q = query(collection(db, 'doctors'), where('id', '==', doctor.id));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    addLog(`⏭  Skipped (already exists): ${doctor.name} (${doctor.department})`, 'warn');
                    skipped++;
                    continue;
                }
                await addDoc(collection(db, 'doctors'), doctor);
                addLog(`✅ Added: ${doctor.name} — ${doctor.department}`, 'success');
                seeded++;
            } catch (err) {
                addLog(`❌ Failed for ${doctor.name}: ${err.message}`, 'error');
            }
        }

        addLog(`\n🎉 Done! ${seeded} added, ${skipped} skipped.`);
        setRunning(false);
        setDone(true);
    };

    const handleClear = async () => {
        if (!confirm('Delete ALL seeded dummy patients from Firestore?')) return;
        setRunning(true);
        setLog([]);
        addLog('🗑  Clearing dummy patients…');
        for (const patient of DUMMY_PATIENTS) {
            try {
                const q = query(collection(db, 'patients'), where('aadhaar', '==', patient.aadhaar));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(doc(db, 'patients', d.id));
                    addLog(`🗑  Removed: ${patient.name}`, 'warn');
                }
            } catch (err) {
                addLog(`❌ Error: ${err.message}`, 'error');
            }
        }
        addLog('✅ Clear complete.');
        setRunning(false);
        setDone(false);
    };

    const handleClearDoctors = async () => {
        if (!confirm('Delete ALL seeded dummy doctors from Firestore?')) return;
        setRunning(true);
        setLog([]);
        addLog('🗑  Clearing dummy doctors…');
        for (const doctor of DUMMY_DOCTORS) {
            try {
                const q = query(collection(db, 'doctors'), where('id', '==', doctor.id));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(doc(db, 'doctors', d.id));
                    addLog(`🗑  Removed: ${doctor.name}`, 'warn');
                }
            } catch (err) {
                addLog(`❌ Error: ${err.message}`, 'error');
            }
        }
        addLog('✅ Clear doctors complete.');
        setRunning(false);
        setDone(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: '#1e293b', borderRadius: 20, padding: 40, maxWidth: 680, width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                <h1 style={{ color: '#38bdf8', marginBottom: 4, fontSize: '1.6rem' }}>🌱 Kiosk Dev Seeder</h1>
                <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: '0.95rem' }}>
                    Populates 5 dummy patient records with Aadhaar numbers into Firestore.
                </p>

                {/* Aadhaar quick-reference table */}
                <div style={{ background: '#0f172a', borderRadius: 14, padding: 20, marginBottom: 28 }}>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dummy Patient Aadhaar Numbers</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
                        <thead>
                            <tr style={{ color: '#64748b' }}>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Aadhaar</th>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Age</th>
                                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DUMMY_PATIENTS.map((p, i) => (
                                <tr key={i} style={{ borderTop: '1px solid #1e293b' }}>
                                    <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: 600 }}>{p.name}</td>
                                    <td style={{ padding: '8px 10px', color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{p.aadhaar}</td>
                                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{p.age} / {p.gender[0]}</td>
                                    <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{p.appointments.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 12, marginBottom: 12 }}>
                    <button
                        onClick={handleSeed}
                        disabled={running}
                        style={{ padding: '14px 20px', background: running ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff', border: 'none', borderRadius: 12, cursor: running ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}
                    >
                        {running ? '⏳ Working…' : '🌱 Seed Patients'}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={running}
                        style={{ padding: '14px 20px', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 12, cursor: running ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}
                    >
                        🗑 Clear Patients
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 12, marginBottom: 24 }}>
                    <button
                        onClick={handleSeedDoctors}
                        disabled={running}
                        style={{ padding: '14px 20px', background: running ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 12, cursor: running ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}
                    >
                        {running ? '⏳ Working…' : '🩺 Seed Doctors'}
                    </button>
                    <button
                        onClick={handleClearDoctors}
                        disabled={running}
                        style={{ padding: '14px 20px', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 12, cursor: running ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem' }}
                    >
                        🗑 Clear Doctors
                    </button>
                </div>

                {/* Log output */}
                {log.length > 0 && (
                    <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, maxHeight: 220, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {log.map((entry, i) => (
                            <div key={i} style={{ color: entry.type === 'success' ? '#4ade80' : entry.type === 'error' ? '#f87171' : entry.type === 'warn' ? '#facc15' : '#94a3b8', marginBottom: 4 }}>
                                {entry.msg}
                            </div>
                        ))}
                    </div>
                )}

                <p style={{ color: '#334155', fontSize: '0.8rem', marginTop: 20, textAlign: 'center' }}>
                    Dev tool · Not linked from the main kiosk UI
                </p>
            </div>
        </div>
    );
}
