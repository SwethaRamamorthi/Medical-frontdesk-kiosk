import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adSlides } from '../data/adSlides';

export default function AdScreen() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);

    // Auto-advance carousel every 3 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % adSlides.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const slide = adSlides[current];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: slide.gradient,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.8s ease',
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
            }}
            onClick={() => navigate('/')}
            onTouchStart={() => navigate('/')}
        >
            {/* Background decorative circles */}
            <div style={{
                position: 'absolute', top: '-80px', right: '-80px',
                width: '350px', height: '350px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-60px', left: '-60px',
                width: '280px', height: '280px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
            }} />

            {/* Content */}
            <div className="fade-in" key={current} style={{
                textAlign: 'center', padding: '48px 40px', maxWidth: '700px',
            }}>
                <div style={{ fontSize: '6rem', marginBottom: '24px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>
                    {slide.icon}
                </div>
                <h1 style={{ color: '#fff', marginBottom: '16px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {slide.title}
                </h1>
                <h2 style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '20px' }}>
                    {slide.subtitle}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', marginBottom: '36px' }}>
                    {slide.description}
                </p>
                <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    border: '2px solid rgba(255,255,255,0.35)',
                }}>
                    📍 {slide.cta}
                </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '40px' }}>
                {adSlides.map((_, i) => (
                    <div
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                        style={{
                            width: i === current ? 32 : 10,
                            height: 10,
                            borderRadius: '999px',
                            background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                        }}
                    />
                ))}
            </div>

            {/* Touch hint */}
            <div style={{
                position: 'absolute', bottom: '32px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '1rem',
                fontWeight: 500,
                letterSpacing: '1px',
                animation: 'fadeIn 2s ease infinite alternate',
            }}>
                👆 Touch anywhere to continue
            </div>

            {/* Hospital name header */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '20px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
            }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem' }}>
                    🏥 SmartCare Hospital
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>
        </div>
    );
}
