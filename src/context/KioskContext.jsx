import { createContext, useContext, useState } from 'react';
import { useTranslation } from '../utils/translations';

const KioskContext = createContext(null);

export function KioskProvider({ children }) {
    const [patient, setPatient] = useState(null);       // current patient
    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [appointment, setAppointment] = useState(null);
    const [tokenNumber, setTokenNumber] = useState(1);
    const [darkMode, setDarkMode] = useState(false);
    const [locale, setLocale] = useState('en'); // 'en' or 'ta'

    const t = useTranslation(locale);

    const nextToken = () => {
        const t = tokenNumber;
        setTokenNumber(prev => prev + 1);
        return t;
    };

    const toggleDark = () => {
        setDarkMode(prev => {
            const next = !prev;
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // Clears only the booking selections – keeps the patient logged in
    const resetFlow = () => {
        setSelectedDept(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setAppointment(null);
    };

    // Full session reset – use when returning to the idle/home screen
    const resetAll = () => {
        setPatient(null);
        setSelectedDept(null);
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setAppointment(null);
    };

    return (
        <KioskContext.Provider value={{
            patient, setPatient,
            selectedDept, setSelectedDept,
            selectedDoctor, setSelectedDoctor,
            selectedSlot, setSelectedSlot,
            appointment, setAppointment,
            tokenNumber, nextToken,
            darkMode, toggleDark,
            locale, setLocale, t,
            resetFlow,
            resetAll,
        }}>
            {children}
        </KioskContext.Provider>
    );
}

export function useKiosk() {
    const ctx = useContext(KioskContext);
    if (!ctx) throw new Error('useKiosk must be used within KioskProvider');
    return ctx;
}
