import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const IDLE_TIMEOUT = 20_000; // 20 seconds

export function useIdle() {
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    useEffect(() => {
        const reset = () => {
            // Don't reset if already on ads screen (avoid loop)
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                navigate('/ads');
            }, IDLE_TIMEOUT);
        };

        // Don't set idle timer on the ads screen itself
        if (location.pathname === '/ads') {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const events = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll'];
        events.forEach(e => window.addEventListener(e, reset, { passive: true }));
        reset(); // start timer immediately

        return () => {
            events.forEach(e => window.removeEventListener(e, reset));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [navigate, location.pathname]);
}
