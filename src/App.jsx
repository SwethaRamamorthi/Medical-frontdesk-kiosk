import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { KioskProvider } from './context/KioskContext';
import { useIdle } from './hooks/useIdle';

// Screens
import AdScreen from './screens/AdScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import AadhaarEntry from './screens/new/AadhaarEntry';
import DepartmentSelection from './screens/new/DepartmentSelection';
import DoctorSelection from './screens/new/DoctorSelection';
import UpiPayment from './screens/new/UpiPayment';
import AppointmentSlip from './screens/new/AppointmentSlip';
import PatientSearch from './screens/existing/PatientSearch';
import PatientHistory from './screens/existing/PatientHistory';
import SeedScreen from './screens/SeedScreen';
import PatientRecordsDashboard from './screens/PatientRecordsDashboard';

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
document.head.appendChild(fontLink);

function IdleWrapper({ children }) {
    useIdle();
    return children;
}

function AppRoutes() {
    return (
        <IdleWrapper>
            <Routes>
                <Route path="/ads" element={<AdScreen />} />
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/new/aadhaar" element={<AadhaarEntry />} />
                <Route path="/new/department" element={<DepartmentSelection />} />
                <Route path="/new/doctor" element={<DoctorSelection />} />
                <Route path="/new/payment" element={<UpiPayment />} />
                <Route path="/new/slip" element={<AppointmentSlip />} />
                <Route path="/existing" element={<PatientSearch />} />
                <Route path="/existing/history" element={<PatientHistory />} />
                {/* External Mobile Route */}
                <Route path="/records/:token" element={<PatientRecordsDashboard />} />
                {/* Dev seeder */}
                <Route path="/seed" element={<SeedScreen />} />
                {/* Fallback */}
                <Route path="*" element={<WelcomeScreen />} />
            </Routes>
        </IdleWrapper>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <KioskProvider>
                <AppRoutes />
            </KioskProvider>
        </BrowserRouter>
    );
}
