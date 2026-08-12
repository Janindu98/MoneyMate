import React, { useState } from 'react';
import Modal from './Modal';
import { useDatabase } from '../hooks/useDatabase';
import { useToast } from './Toast';

export default function ProUpgradeModal({ isOpen, onClose, reason }) {
  const { purchaseProMicrosoftStore } = useDatabase();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await purchaseProMicrosoftStore();
      if (res && res.success) {
        showToast('Successfully upgraded to MoneyMate Pro! All premium features are unlocked.', 'success');
        onClose();
      } else {
        showToast(res?.error || 'Upgrade failed or was cancelled.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Purchase simulation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade via Microsoft Store">
      <div className="modal-body" style={{ textAlign: 'left', padding: '20px 24px', color: 'var(--text-primary)' }}>
        
        {/* Launch Offer Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
            🚀 Launch Offer
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '6px', display: 'block' }}>
            MoneyMate Pro — $11.99 One-Time Purchase
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center', lineHeight: '1.4' }}>
          Your finances. Your data. One simple upgrade.
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px', textAlign: 'center' }}>
          Unlock all premium features and manage your finances without a recurring subscription.
        </p>

        <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', paddingTop: '16px', paddingBottom: '16px', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Pro includes:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>📊</span> Advanced financial reports
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>💰</span> Detailed salary management
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>🏦</span> Multiple bank-account management
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>📄</span> PDF & Excel exports
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>💾</span> Encrypted backup & restore
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>📈</span> Advanced financial analysis
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '1rem' }}>🔓</span> All future Pro improvements
            </li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
          ✨ No monthly subscription
        </div>

      </div>
      <div className="modal-footer" style={{ gap: '12px', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading} style={{ minWidth: '100px' }}>
          Cancel
        </button>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleUpgrade} 
          disabled={loading}
          style={{ 
            minWidth: '200px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {loading ? 'Upgrading...' : 'Upgrade to Pro ($11.99)'}
        </button>
      </div>
    </Modal>
  );
}
