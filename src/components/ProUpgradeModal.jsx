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
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to MoneyMate Pro">
      <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.5))' }}>
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
            <path d="M3 20h18"/>
          </svg>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>Premium Feature Locked</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '8px' }}>
          {reason || 'This action requires a MoneyMate Pro license.'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Upgrade to MoneyMate Pro now to gain full access to high-fidelity exports, receipt attachment vaults, unlimited accounts, and all other premium features.
        </p>
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
            minWidth: '160px',
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
          {loading ? 'Upgrading...' : 'Upgrade to Pro'}
        </button>
      </div>
    </Modal>
  );
}
