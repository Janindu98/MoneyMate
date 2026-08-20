import React, { useState, useEffect } from 'react';
import logoImg from '../../images/logo_2.png';

export default function LockScreen({ settings, onUnlock, unlockDatabase }) {
  const securityType = settings.securityType; // 'pin' or 'password'
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);

  const correctPin = settings.securityPin || '';
  const correctPassword = settings.securityPassword || '';

  // Handle keyboard listener for PIN inputs
  useEffect(() => {
    if (securityType !== 'pin') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          setPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, securityType]);

  // Auto-submit PIN when it reaches 4 digits
  useEffect(() => {
    if (securityType === 'pin' && pin.length === 4 && !isVerifying) {
      handlePinVerify();
    }
  }, [pin, securityType, isVerifying]);

  const triggerShake = () => {
    setShake(true);
    setError(true);
    setTimeout(() => {
      setShake(false);
    }, 500);
  };

  const handlePinVerify = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      if (unlockDatabase) {
        setError(false);
        const res = await unlockDatabase(pin);
        if (res.success) {
          onUnlock();
        } else {
          triggerShake();
          setPin('');
        }
      } else {
        if (pin === correctPin) {
          onUnlock();
        } else {
          triggerShake();
          setPin('');
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      if (unlockDatabase) {
        setError(false);
        const res = await unlockDatabase(password);
        if (res.success) {
          onUnlock();
        } else {
          triggerShake();
          setPassword('');
        }
      } else {
        if (password === correctPassword) {
          onUnlock();
        } else {
          triggerShake();
          setPassword('');
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <div className="lockscreen-overlay">
      <div className={`lockscreen-card ${shake ? 'shake' : ''} ${error ? 'error' : ''}`}>
        <div className="lockscreen-header">
          <div className="lockscreen-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
            <img src={logoImg} alt="MoneyMate Vault Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <h2>MoneyMate Vault</h2>
          <p className="lockscreen-subtitle">
            {securityType === 'pin' ? 'Enter PIN to unlock your vault' : 'Enter Password to unlock your vault'}
          </p>
        </div>

        {securityType === 'pin' ? (
          <div className="pin-container">
            {/* PIN Dots */}
            <div className="pin-dots">
              {[0, 1, 2, 3].map(index => (
                <div 
                  key={index} 
                  className={`pin-dot ${index < pin.length ? 'filled' : ''}`}
                />
              ))}
            </div>

            {error && <p className="lockscreen-error-msg">Incorrect PIN. Try again.</p>}

            {/* Numeric Keypad */}
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  className="keypad-btn" 
                  onClick={() => handleKeypadPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button type="button" className="keypad-btn action" onClick={handleClear}>
                C
              </button>
              <button type="button" className="keypad-btn" onClick={() => handleKeypadPress('0')}>
                0
              </button>
              <button type="button" className="keypad-btn action" onClick={handleBackspace} aria-label="delete">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2.5">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="input-ctrl lockscreen-password-input"
                placeholder="Enter password..."
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                autoFocus
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="lockscreen-error-msg">Incorrect password. Try again.</p>}

            <button type="submit" className="btn btn-primary lockscreen-submit-btn">
              Unlock Vault
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
