// Simulated Aadhaar API responses
// ★ First 5 records are EXISTING PATIENTS already seeded in Firebase
//   Try these Aadhaar numbers in the New Patient flow to auto-fill details:
//   1) 432156789012 – Nisha Reddy
//   2) 543217890123 – Mohan Das
//   3) 654328901234 – Lakshmi Krishnan
//   4) 765439012345 – Sanjay Mehta
//   5) 876540123456 – Divya Pillai
export const mockAadhaarData = [
    // ── Existing patients (also in Firebase) ──────────────────────────────
    { aadhaar: '432156789012', name: 'Nisha Reddy', age: 31, gender: 'Female', phone: '9811223344' },
    { aadhaar: '543217890123', name: 'Mohan Das', age: 47, gender: 'Male', phone: '9922334455' },
    { aadhaar: '654328901234', name: 'Lakshmi Krishnan', age: 55, gender: 'Female', phone: '9733445566' },
    { aadhaar: '765439012345', name: 'Sanjay Mehta', age: 39, gender: 'Male', phone: '9644556677' },
    { aadhaar: '876540123456', name: 'Divya Pillai', age: 26, gender: 'Female', phone: '9555667788' },
    // ── Additional Aadhaar lookup records (new patient pre-fill only) ─────
    { aadhaar: '123456789012', name: 'Arjun Sharma', age: 34, gender: 'Male', phone: '9876543210' },
    { aadhaar: '234567890123', name: 'Priya Patel', age: 28, gender: 'Female', phone: '9765432109' },
    { aadhaar: '345678901234', name: 'Ravi Kumar', age: 45, gender: 'Male', phone: '9654321098' },
    { aadhaar: '456789012345', name: 'Sunita Devi', age: 52, gender: 'Female', phone: '9543210987' },
    { aadhaar: '567890123456', name: 'Manoj Verma', age: 38, gender: 'Male', phone: '9432109876' },
    { aadhaar: '678901234567', name: 'Kavitha Nair', age: 29, gender: 'Female', phone: '9321098765' },
    { aadhaar: '789012345678', name: 'Suresh Babu', age: 60, gender: 'Male', phone: '9210987654' },
    { aadhaar: '890123456789', name: 'Anita Singh', age: 33, gender: 'Female', phone: '9109876543' },
    { aadhaar: '901234567890', name: 'Deepak Yadav', age: 41, gender: 'Male', phone: '9098765432' },
    { aadhaar: '012345678901', name: 'Meena Kumari', age: 26, gender: 'Female', phone: '8987654321' },
    { aadhaar: '111222333444', name: 'Ramesh Gupta', age: 55, gender: 'Male', phone: '8876543210' },
    { aadhaar: '222333444555', name: 'Lalita Mishra', age: 47, gender: 'Female', phone: '8765432109' },
    { aadhaar: '333444555666', name: 'Vikram Singh', age: 36, gender: 'Male', phone: '8654321098' },
    { aadhaar: '444555666777', name: 'Pooja Joshi', age: 24, gender: 'Female', phone: '8543210987' },
    { aadhaar: '555666777888', name: 'Ajay Tiwari', age: 43, gender: 'Male', phone: '8432109876' },
];

export function lookupAadhaar(aadhaar) {
    return mockAadhaarData.find(r => r.aadhaar === aadhaar) || null;
}
