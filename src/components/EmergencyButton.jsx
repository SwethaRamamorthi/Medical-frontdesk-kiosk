import { useSpeech } from '../hooks/useSpeech';

export default function EmergencyButton() {
    const { speak } = useSpeech();

    const handleClick = () => {
        speak('Emergency services are being alerted. Please stay calm. Staff will reach you shortly.');
        alert('🚨 EMERGENCY ALERT\nStaff has been notified.\nPlease remain calm.\nCall 108 for immediate ambulance.');
    };

    return (
        <button
            className="emergency-btn no-print"
            onClick={handleClick}
            title="Emergency Help"
            aria-label="Emergency Button"
        >
            <span style={{ fontSize: '1.6rem' }}>🆘</span>
            <span>SOS</span>
        </button>
    );
}
