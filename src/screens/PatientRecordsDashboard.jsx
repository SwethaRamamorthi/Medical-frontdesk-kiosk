import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PatientRecordsDashboard() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patient, setPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        if (!token) {
            setError('Invalid access token. Please scan a valid QR code.');
            setLoading(false);
            return;
        }
        fetchData(token);
    }, [token]);

    const fetchData = async (tokenId) => {
        try {
            // 1. Validate Token from qrAccess collection
            const tokenQuery = query(collection(db, 'qrAccess'), where('tokenId', '==', tokenId));
            const tokenSnap = await getDocs(tokenQuery);

            if (tokenSnap.empty) {
                setError('QR Code is invalid or has expired.');
                setLoading(false);
                return;
            }

            const tokenData = tokenSnap.docs[0].data();

            if (!tokenData.isActive) {
                setError('This QR code is no longer active.');
                setLoading(false);
                return;
            }

            const patientId = tokenData.patientId;

            if (!patientId) {
                setError('No patient is associated with this QR code.');
                setLoading(false);
                return;
            }

            // 2. Fetch Patient Details
            let patientSnap;
            try {
                // Try querying by 'id' field first
                const patientQuery = query(collection(db, 'patients'), where('id', '==', patientId));
                patientSnap = await getDocs(patientQuery);

                // If empty, try getting by document ID directly
                if (patientSnap.empty) {
                    const docIdQuery = query(collection(db, 'patients'), where('__name__', '==', patientId));
                    patientSnap = await getDocs(docIdQuery);
                }
            } catch (e) {
                console.warn("Query fallback error", e);
            }

            if (!patientSnap || patientSnap.empty) {
                setError('Patient profile not found.');
                setLoading(false);
                return;
            }

            const patientData = { id: patientSnap.docs[0].id, ...patientSnap.docs[0].data() };
            setPatient(patientData);

            // 3. Fetch Appointment History
            const apptQuery = query(collection(db, 'appointments'), where('patientId', '==', patientId));
            const apptSnap = await getDocs(apptQuery);

            let apptsData = apptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 4. Merge old seeded dummy appointments (which are nested in the patient doc)
            if (patientData.appointments && Array.isArray(patientData.appointments)) {
                const oldAppts = patientData.appointments.map((appt, i) => ({
                    id: `legacy-${i}`,
                    appointmentId: appt.token || `LEGACY-${i}`,
                    doctorName: appt.doctor ? appt.doctor.replace('Dr. ', '') : 'Unknown',
                    department: appt.department || 'General',
                    date: appt.date || 'Unknown Date',
                    slot: 'Unknown Time',
                    fee: appt.fee || 0,
                    paymentStatus: 'Paid',
                    prescription: appt.prescription || null,
                    labResult: appt.labResult || null,
                    // Use a mock timestamp based on date for sorting
                    createdAt: { seconds: new Date(appt.date || '2025-01-01').getTime() / 1000 }
                }));
                apptsData = [...apptsData, ...oldAppts];
            }

            // DEMO OVERRIDE: Always inject at least one dummy record for Demonstration if they only have 1 (the brand new one)
            if (apptsData.length <= 1) {
                const demoAppts = [
                    {
                        id: 'demo-legacy-override-1',
                        appointmentId: 'HIST-DEMO-1',
                        doctorName: 'Vikram Singh',
                        department: 'Orthopedic',
                        date: '10/02/2026',
                        slot: '11:00 AM',
                        fee: 550,
                        paymentStatus: 'Paid',
                        prescription: 'Vitamin D3 60,000 IU (once a week for 8 weeks). Calcium supplements daily.',
                        labResult: 'X-Ray Knee: Mild osteoarthritis. Vit D levels: 14 ng/mL (Deficient).',
                        createdAt: { seconds: new Date('2026-02-10').getTime() / 1000 }
                    },
                    {
                        id: 'demo-legacy-override-2',
                        appointmentId: 'HIST-DEMO-2',
                        doctorName: 'Ananya Mehta',
                        department: 'Neurologist',
                        date: '20/01/2026',
                        slot: '02:00 PM',
                        fee: 600,
                        paymentStatus: 'Paid',
                        prescription: 'Amitriptyline 10mg (1 tablet at night for 14 days)',
                        labResult: 'MRI Brain: Unremarkable. Normal study.',
                        createdAt: { seconds: new Date('2026-01-20').getTime() / 1000 }
                    }
                ];
                apptsData = [...apptsData, ...demoAppts];
            }

            // Sort by date desc
            apptsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setAppointments(apptsData);
            setLoading(false);

        } catch (err) {
            console.error('Error fetching records:', err);
            setError('Could not load patient records. Please try again later.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f7fa' }}>
                <LoadingSpinner label="Authenticating Secure Token..." />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f7fa', padding: '20px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
                    <h2 style={{ color: '#ef4444', marginBottom: '12px', fontFamily: "'Inter', sans-serif" }}>Access Denied</h2>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5', fontFamily: "'Inter', sans-serif" }}>{error}</p>
                </div>
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f4f7fa', fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ background: 'linear-gradient(135deg, #00d4c8, #00a8a0)', color: 'white', padding: '24px 20px', boxShadow: '0 4px 12px rgba(0,212,200,0.3)', borderRadius: '0 0 24px 24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
                    <span style={{ fontSize: '2rem' }}>🏥</span>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Medical History</h1>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Secure Patient Portal</p>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>

                {/* Patient Profile Card */}
                <section style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#6c63ff' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0f0ff', color: '#6c63ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem', color: '#111827' }}>{patient.name}</h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 500 }}>Patient ID: {patient.id.slice(0, 8)}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Age</p>
                            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{patient.age} years</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Gender</p>
                            <p style={{ margin: 0, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{patient.gender}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Phone</p>
                            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{patient.phone}</p>
                        </div>
                    </div>
                </section>

                {/* Patient History Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#111827' }}>Appointment History</h3>
                        <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                            {appointments.length} Total
                        </span>
                    </div>

                    {appointments.length === 0 ? (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                            <p style={{ color: '#6b7280', margin: 0 }}>No past appointments found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {appointments.map((appt, idx) => (
                                <div key={appt.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <span style={{ display: 'inline-block', background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', marginBottom: '8px' }}>
                                                ID: {appt.appointmentId || appt.id.slice(0, 8)}
                                            </span>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Dr. {appt.doctorName}</h4>
                                            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.9rem' }}>{appt.department}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{appt.date}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px' }}>{appt.slot}</div>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Consultation Fee: <strong style={{ color: '#111827' }}>₹{appt.fee}</strong></div>
                                        <div style={{
                                            background: appt.paymentStatus === 'Paid' ? '#dcfce7' : '#fee2e2',
                                            color: appt.paymentStatus === 'Paid' ? '#166534' : '#991b1b',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {appt.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}
                                        </div>
                                    </div>

                                    {/* Medical Records Section (Always shown now) */}
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <span>💊</span> Prescription
                                            </div>
                                            <div style={{ color: '#444', fontSize: '0.9rem', lineHeight: '1.5', paddingLeft: '24px' }}>
                                                {appt.prescription || 'No previous prescription records found.'}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <span>🔬</span> Lab Results
                                            </div>
                                            <div style={{ color: '#444', fontSize: '0.9rem', lineHeight: '1.5', paddingLeft: '24px' }}>
                                                {appt.labResult || 'No previous lab records found.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div style={{ textAlign: 'center', marginTop: '40px', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500 }}>
                    Powered by SmartCare Kiosk Systems
                </div>
            </main>
        </div>
    );
}
