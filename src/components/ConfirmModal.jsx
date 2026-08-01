import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', requireTextInput }) {
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTextInput('');
    }
  }, [isOpen]);

  const handleConfirm = (e) => {
    if (e) e.preventDefault();
    if (requireTextInput && textInput !== requireTextInput) return;
    onConfirm();
    onClose();
  };

  const isDanger = type === 'danger';
  const isConfirmDisabled = requireTextInput ? textInput !== requireTextInput : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirmation Required'}>
      <form onSubmit={handleConfirm}>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {message}
          </p>
          {requireTextInput && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Type <strong style={{ color: 'var(--text-primary)' }}>{requireTextInput}</strong> to authorize this action:
              </label>
              <input
                type="text"
                className="input-ctrl"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={`Type ${requireTextInput}`}
                required
                style={{ marginTop: '8px' }}
              />
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            type="submit" 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} 
            disabled={isConfirmDisabled}
            style={isDanger ? { backgroundColor: '#f43f5e', borderColor: '#f43f5e', color: '#fff' } : {}}
          >
            {confirmText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
