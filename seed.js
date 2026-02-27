// Firestore Seed Script – run ONCE to populate sample data
// Usage: node seed.js
// Requires: npm install firebase (already done)

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

// ⚠️ Copy your actual Firebase config here before running
const firebaseConfig = {
    apiKey: "AIzaSyA5jxuFQPttX-9YIh950lysjBgVDS2zRrY",
    authDomain: "medicalkisok.firebaseapp.com",
    projectId: "medicalkisok",
    storageBucket: "medicalkisok.firebasestorage.app",
    messagingSenderId: "472070781743",
    appId: "1:472070781743:web:8fda3512d3a1eb96e3ffda"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const doctors = [
    // Neurologist
    { name: 'Dr. Rajesh Kumar', department: 'neurologist', qualification: 'MD Neurology, DM', experience: '12 years', fee: 600, imageUrl: '', availableSlots: ['9:00 AM', '9:30 AM', '10:00 AM', '11:00 AM', '11:30 AM'] },
    { name: 'Dr. Ananya Mehta', department: 'neurologist', qualification: 'MBBS, MD, DNB Neuro', experience: '8 years', fee: 500, imageUrl: '', availableSlots: ['10:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'] },
    // Ophthalmologist
    { name: 'Dr. Sunil Verma', department: 'ophthalmologist', qualification: 'MS Ophthalmology', experience: '15 years', fee: 450, imageUrl: '', availableSlots: ['8:30 AM', '9:00 AM', '9:30 AM', '4:00 PM'] },
    { name: 'Dr. Priya Sharma', department: 'ophthalmologist', qualification: 'DNB Ophthalmology', experience: '7 years', fee: 400, imageUrl: '', availableSlots: ['11:00 AM', '11:30 AM', '3:00 PM', '3:30 PM'] },
    // Pediatrician
    { name: 'Dr. Kavitha Nair', department: 'pediatrician', qualification: 'MD Pediatrics, DCH', experience: '10 years', fee: 400, imageUrl: '', availableSlots: ['9:00 AM', '10:00 AM', '10:30 AM', '5:00 PM'] },
    { name: 'Dr. Arjun Pillai', department: 'pediatrician', qualification: 'MBBS, DCH, MD', experience: '6 years', fee: 350, imageUrl: '', availableSlots: ['11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM'] },
    // Cardiologist
    { name: 'Dr. Ramesh Gupta', department: 'cardiologist', qualification: 'DM Cardiology, MD', experience: '18 years', fee: 700, imageUrl: '', availableSlots: ['8:00 AM', '8:30 AM', '9:00 AM', '4:30 PM'] },
    { name: 'Dr. Meena Iyer', department: 'cardiologist', qualification: 'MD, DM Cardiology', experience: '11 years', fee: 650, imageUrl: '', availableSlots: ['10:00 AM', '10:30 AM', '3:00 PM', '3:30 PM'] },
    // Orthopedic
    { name: 'Dr. Vikram Singh', department: 'orthopedic', qualification: 'MS Ortho, MBBS', experience: '14 years', fee: 550, imageUrl: '', availableSlots: ['9:30 AM', '10:00 AM', '11:00 AM', '5:30 PM'] },
    { name: 'Dr. Geeta Bhatt', department: 'orthopedic', qualification: 'DNB Orthopedics', experience: '9 years', fee: 500, imageUrl: '', availableSlots: ['11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM'] },
];

// ★ These 5 patients match the Aadhaar numbers in mockAadhaar.js (first 5 entries)
const samplePatients = [
    {
        aadhaar: '432156789012',
        name: 'Nisha Reddy',
        age: 31,
        gender: 'Female',
        phone: '9811223344',
        appointments: [
            { date: '2025-11-10', department: 'Ophthalmologist', doctor: 'Dr. Sunil Verma', fee: 450, token: 'A12', status: 'Completed', prescription: 'Moxifloxacin Eye Drops 0.5% (1 drop, 3 times a day for 7 days)', labResult: 'Vision Test: 20/20. No signs of glaucoma.' },
            { date: '2026-01-20', department: 'Neurologist', doctor: 'Dr. Rajesh Kumar', fee: 600, token: 'B04', status: 'Completed', prescription: 'Amitriptyline 10mg (1 tablet at night for 14 days)', labResult: 'MRI Brain: Unremarkable. Normal study.' },
        ],
    },
    {
        aadhaar: '543217890123',
        name: 'Mohan Das',
        age: 47,
        gender: 'Male',
        phone: '9922334455',
        appointments: [
            { date: '2025-10-05', department: 'Cardiologist', doctor: 'Dr. Ramesh Gupta', fee: 700, token: 'C07', status: 'Completed', prescription: 'Atorvastatin 20mg (1 tablet daily post dinner)', labResult: 'Lipid Profile: Total Cholesterol 240mg/dL (High).' },
            { date: '2026-02-01', department: 'Orthopedic', doctor: 'Dr. Vikram Singh', fee: 550, token: 'D11', status: 'Completed', prescription: 'Ibuprofen 400mg (as needed for pain), Calcium supplements', labResult: 'X-Ray Knee: Mild osteoarthritis.' },
        ],
    },
    {
        aadhaar: '654328901234',
        name: 'Lakshmi Krishnan',
        age: 55,
        gender: 'Female',
        phone: '9733445566',
        appointments: [
            { date: '2025-09-15', department: 'Pediatrician', doctor: 'Dr. Kavitha Nair', fee: 400, token: 'E02', status: 'Completed', prescription: 'Paracetamol 250mg syrup (5ml SOS for fever), Cough syrup (5ml twice daily)', labResult: 'Complete Blood Count: Normal.' },
            { date: '2025-12-22', department: 'Cardiologist', doctor: 'Dr. Meena Iyer', fee: 650, token: 'F09', status: 'Completed', prescription: 'Metoprolol 25mg (1 tablet morning)', labResult: 'ECG: Normal sinus rhythm. BP: 140/90.' },
            { date: '2026-02-18', department: 'Neurologist', doctor: 'Dr. Ananya Mehta', fee: 500, token: 'G05', status: 'Completed', prescription: 'Donepezil 5mg (1 tablet before bed)', labResult: 'CT Head: Age-related cerebral atrophy.' },
        ],
    },
    {
        aadhaar: '765439012345',
        name: 'Sanjay Mehta',
        age: 39,
        gender: 'Male',
        phone: '9644556677',
        appointments: [
            { date: '2025-08-30', department: 'Orthopedic', doctor: 'Dr. Geeta Bhatt', fee: 500, token: 'H03', status: 'Completed', prescription: 'Diclofenac Gel (apply locally 2 times a day)', labResult: 'MRI Spine: L4-L5 disc desiccation.' },
            { date: '2026-01-10', department: 'Ophthalmologist', doctor: 'Dr. Priya Sharma', fee: 400, token: 'I08', status: 'Completed', prescription: 'Lubricating Eye Drops (Carboxymethylcellulose 0.5%)', labResult: 'Dry Eye Test: Positive.' },
        ],
    },
    {
        aadhaar: '876540123456',
        name: 'Divya Pillai',
        age: 26,
        gender: 'Female',
        phone: '9555667788',
        appointments: [
            { date: '2025-07-14', department: 'Pediatrician', doctor: 'Dr. Arjun Pillai', fee: 350, token: 'J06', status: 'Completed', prescription: 'Cetirizine Syrup (5ml at bedtime for 5 days)', labResult: 'Allergy Test: Mild dust mite allergy.' },
            { date: '2025-11-27', department: 'Neurologist', doctor: 'Dr. Rajesh Kumar', fee: 600, token: 'K01', status: 'Completed', prescription: 'Sumatriptan 50mg (Take at onset of migraine)', labResult: 'No acute findings.' },
            { date: '2026-02-14', department: 'Orthopedic', doctor: 'Dr. Vikram Singh', fee: 550, token: 'L10', status: 'Completed', prescription: 'Vitamin D3 60,000 IU (once a week for 8 weeks)', labResult: 'Vit D levels: 12 ng/mL (Deficient).' },
        ],
    },
];

async function seed() {
    console.log('🌱 Starting Firestore seeding…');

    // Seed doctors
    console.log('\n📋 Seeding doctors…');
    for (const doc of doctors) {
        const ref = await addDoc(collection(db, 'doctors'), doc);
        console.log(`  ✅ ${doc.name} (${doc.department}) → ${ref.id}`);
    }

    // Seed patients
    console.log('\n👤 Seeding patients…');
    for (const patient of samplePatients) {
        const ref = await addDoc(collection(db, 'patients'), {
            ...patient,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ ${patient.name} → ${ref.id}`);
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
});
