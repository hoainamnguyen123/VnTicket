import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const DarkModeToggle = () => {
    const { isDark, toggleTheme } = useContext(ThemeContext);

    return (
        <div
            onClick={toggleTheme}
            style={{
                width: '52px',
                height: '28px',
                borderRadius: '100px',
                cursor: 'pointer',
                position: 'relative',
                background: isDark
                    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                    : 'linear-gradient(135deg, #87ceeb 0%, #ffd700 100%)',
                border: isDark
                    ? '1.5px solid rgba(255,255,255,0.15)'
                    : '1.5px solid rgba(0,0,0,0.08)',
                boxShadow: isDark
                    ? '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)'
                    : '0 2px 12px rgba(135,206,235,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                userSelect: 'none',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 18px rgba(100,100,255,0.25), inset 0 1px 2px rgba(255,255,255,0.05)'
                    : '0 4px 18px rgba(255,165,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.05)'
                    : '0 2px 12px rgba(135,206,235,0.3), inset 0 1px 2px rgba(255,255,255,0.3)';
            }}
        >
            {/* Stars (visible in dark mode) */}
            <div style={{
                position: 'absolute',
                top: '5px',
                left: '8px',
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: '#fff',
                opacity: isDark ? 0.8 : 0,
                transition: 'opacity 0.4s ease',
                boxShadow: '6px 4px 0 0 rgba(255,255,255,0.6), 12px -1px 0 0 rgba(255,255,255,0.4), 3px 8px 0 -0.5px rgba(255,255,255,0.5)',
            }} />

            {/* Sun/Moon orb */}
            <div style={{
                position: 'absolute',
                top: '3px',
                left: isDark ? '27px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isDark
                    ? 'linear-gradient(135deg, #c9d1d9 0%, #e8e8e8 100%)'
                    : 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                boxShadow: isDark
                    ? '0 0 8px rgba(200,200,220,0.4), inset -3px -2px 0 rgba(150,150,170,0.3)'
                    : '0 0 10px rgba(255,215,0,0.5), 0 0 20px rgba(255,165,0,0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {/* Moon craters */}
                {isDark && (
                    <>
                        <div style={{
                            position: 'absolute', top: '4px', left: '5px',
                            width: '4px', height: '4px', borderRadius: '50%',
                            background: 'rgba(150,150,170,0.3)',
                        }} />
                        <div style={{
                            position: 'absolute', top: '10px', left: '11px',
                            width: '3px', height: '3px', borderRadius: '50%',
                            background: 'rgba(150,150,170,0.25)',
                        }} />
                    </>
                )}
            </div>

            {/* Cloud (visible in light mode) */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '7px',
                width: '12px',
                height: '5px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.8)',
                opacity: isDark ? 0 : 0.9,
                transition: 'opacity 0.4s ease',
                boxShadow: '3px -3px 0 1px rgba(255,255,255,0.6)',
            }} />
        </div>
    );
};

export default DarkModeToggle;
