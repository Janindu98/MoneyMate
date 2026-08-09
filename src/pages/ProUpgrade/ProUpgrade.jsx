import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';

export default function ProUpgrade({ activeTab }) {
  const { purchaseProMicrosoftStore, activateLicenseKey, setProDevOverride } = useDatabase();
  const { showToast } = useToast();
  
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getFeatureTitle = () => {
    switch (activeTab) {
      case 'bills':
        return 'Bill & Payment Analysis';
      case 'subscriptions':
        return 'Subscriptions Ledger';
      case 'backup':
        return 'Cloud Backup & Recovery';
      default:
        return 'MoneyMate Pro Features';
    }
  };

  const getFeatureDescription = () => {
    switch (activeTab) {
      case 'bills':
        return 'Unlock advanced analysis of utilities, credit card limits, insurance cycles, and rental payments to avoid late fee penalties.';
      case 'subscriptions':
        return 'Unlock automated tracking of active software, entertainment, and service subscriptions with auto-renewal alerts and ledger integration.';
      case 'backup':
        return 'Secure your financial history by enabling background auto-backup synchronization to Google Drive, Microsoft OneDrive, or Dropbox folders.';
      default:
        return 'Get access to cloud backups, subscription auto-renewals, utility bill monitors, and high-fidelity PDF audit reports.';
    }
  };

  const handlePurchaseStore = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await purchaseProMicrosoftStore();
      if (res.success) {
        showToast('Successfully upgraded to MoneyMate Pro! All premium features are unlocked.');
      } else if (res.error) {
        setErrorMessage(res.error);
        showToast(res.error, 'error');
      }
    } catch (err) {
      setErrorMessage(err.message);
      showToast('Purchase simulation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateKey = async (e) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      showToast('Please enter a license key first.', 'warning');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await activateLicenseKey(licenseKeyInput.trim());
      if (res.success) {
        showToast('License activated successfully! MoneyMate Pro is now unlocked.');
      } else {
        setErrorMessage(res.error || 'Invalid key.');
        showToast(res.error || 'Invalid key.', 'error');
      }
    } catch (err) {
      setErrorMessage(err.message);
      showToast('Key activation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDevOverride = async () => {
    try {
      await setProDevOverride(true);
      showToast('Development Override: Pro Mode temporarily unlocked.');
    } catch (e) {
      showToast('Failed to apply dev override.', 'error');
    }
  };

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 40px)', padding: '40px 20px', color: '#fff', background: '#0a0d1a' }}>
      
      {/* Premium Header Accent */}
      <div style={{ textAlign: 'center', maxWidth: '640px', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#818cf8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px'
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          MoneyMate Premium Feature
        </div>
        
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 30%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px' }}>
          {getFeatureTitle()}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {getFeatureDescription()}
        </p>
      </div>

      {/* Grid Layout for Upgrade Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '840px', width: '100%', marginBottom: '40px' }}>
        
        {/* Card 1: Microsoft Store Billing */}
        <div className="panel" style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="#60a5fa" fill="none" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 20H2v-5"/>
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Lifetime Access</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>$9.99</div>
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Upgrade via Microsoft Store</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Secure payment processed natively through the Microsoft Store ecosystem. Unlocks Pro instantly across all Windows devices linked to your account.
            </p>
          </div>

          <button 
            className="btn btn-primary" 
            disabled={loading}
            onClick={handlePurchaseStore}
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            {loading ? 'Initiating Purchase Dialog...' : 'Buy Now'}
          </button>
        </div>

        {/* Card 2: Standalone License Key */}
        <div className="panel" style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <form onSubmit={handleActivateKey} style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="#34d399" fill="none" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Standalone</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '4px 8px', borderRadius: '6px', marginTop: '4px' }}>Wired / Web</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>Activate Standalone License</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
                Purchased outside the Microsoft Store? Enter your 18-digit license key below to unlock details instantly.
              </p>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  placeholder="MM-XXXX-XXXX-XXXX-XXXX" 
                  value={licenseKeyInput} 
                  onChange={e => setLicenseKeyInput(e.target.value)} 
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    letterSpacing: '0.05em'
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-secondary" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '8px', 
                cursor: 'pointer'
              }}
            >
              {loading ? 'Activating Key...' : 'Activate License'}
            </button>
          </form>
        </div>

      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          maxWidth: '840px',
          width: '100%',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <strong>Upgrade failed:</strong> {errorMessage}
        </div>
      )}

      {/* Developer Options Accent Block */}
      <div style={{
        maxWidth: '840px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: '#94a3b8'
      }}>
        <div>
          <strong style={{ color: '#fff' }}>Developer Environment Detected:</strong> You can bypass licensing checks instantly during local testing using the override.
        </div>
        <button 
          className="btn btn-danger" 
          onClick={handleDevOverride}
          style={{ 
            padding: '6px 14px', 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#f87171',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Quick Unlock Pro
        </button>
      </div>

    </div>
  );
}
