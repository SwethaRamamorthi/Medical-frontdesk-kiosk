# SmartCare Hospital Kiosk - Demo Credentials

This document provides the test credentials needed to navigate the user flows in the SmartCare Hospital Kiosk application.

## 1. Existing Patient Search
Use these **Mobile Numbers** on the "Existing Patient" entry screen. These patients are pre-seeded into the Firebase database if you have run the `/seed` script.

| Patient Name | Mobile Number | Associated Aadhaar |
| :--- | :--- | :--- |
| **Sanjay Mehta** | `9644556677` | 765439012345 |
| **Nisha Reddy** | `9811223344` | 432156789012 |
| **Mohan Das** | `9922334455` | 543217890123 |
| **Lakshmi Krishnan** | `9733445566` | 654328901234 |
| **Divya Pillai** | `9555667788` | 876540123456 |

> [!TIP]
> You can also use the **Name Search** tab on the Existing Patient screen to look up these patients by typing at least 3 letters of their name (e.g., "San" for Sanjay).

---

## 2. New Patient Registration (Aadhaar Pre-fill)
Use these **12-digit Aadhaar Numbers** on the "New Patient" entry screen to test the API look-up feature. These will auto-fill the user's name, age, gender, and phone number on the confirmation screen.

### Primary Test Subjects
| Patient Name | Aadhaar Number (12 digits) |
| :--- | :--- |
| **Arjun Sharma** | `123456789012` |
| **Priya Patel** | `234567890123` |
| **Ravi Kumar** | `345678901234` |
| **Sunita Devi** | `456789012345` |
| **Manoj Verma** | `567890123456` |

### Additional Mock Data
*   `678901234567` (Kavitha Nair)
*   `789012345678` (Suresh Babu)
*   `890123456789` (Anita Singh)
*   `901234567890` (Deepak Yadav)
*   `012345678901` (Meena Kumari)

> [!NOTE]
> Entering an Aadhaar number that is *not* in this list will allow the user to manually type their details, simulating a fresh demographic entry not found in the national database.

---

## 3. Developer Endpoints
*   **Database Seeding:** Navigate to `http://localhost:5176/seed` to populate or clear dummy Patients and Doctors in your Firestore database.
