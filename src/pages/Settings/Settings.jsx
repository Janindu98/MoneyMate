import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

export default function Settings({ onOpenAbout }) {
  const { settings, updateSettings, restoreDatabase, showToast: hookShowToast } = useDatabase();
  const { showToast } = useToast();

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', requireTextInput: '' });

  const showConfirm = (title, message, onConfirm, type = 'danger', requireTextInput = '') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type, requireTextInput });
  };

  // Security options states
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [securityModalType, setSecurityModalType] = useState('pin'); // 'pin' or 'password'
  const [setupPin, setSetupPin] = useState('');
  const [confirmSetupPin, setConfirmSetupPin] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmSetupPassword, setConfirmSetupPassword] = useState('');

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyValue, setVerifyValue] = useState('');
  const [pendingType, setPendingType] = useState('');

  const handleSecurityChange = (e) => {
    const val = e.target.value;
    const currentType = settings.securityType || 'none';

    if (val === currentType) return;

    if (currentType === 'none') {
      if (val === 'pin') {
        setSecurityModalType('pin');
        setSetupPin('');
        setConfirmSetupPin('');
        setSecurityModalOpen(true);
      } else if (val === 'password') {
        setSecurityModalType('password');
        setSetupPassword('');
        setConfirmSetupPassword('');
        setSecurityModalOpen(true);
      }
    } else {
      setPendingType(val);
      setVerifyValue('');
      setVerifyModalOpen(true);
    }
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (securityModalType === 'pin') {
      if (setupPin.length !== 4 || !/^\d+$/.test(setupPin)) {
        showToast('PIN must be exactly 4 digits.', 'error');
        return;
      }
      if (setupPin !== confirmSetupPin) {
        showToast('PIN entries do not match.', 'error');
        return;
      }
      updateSettings({
        securityType: 'pin',
        securityPin: setupPin,
        securityPassword: ''
      });
      showToast('PIN lock security successfully enabled.');
    } else {
      if (!setupPassword.trim()) {
        showToast('Password cannot be empty.', 'error');
        return;
      }
      if (setupPassword !== confirmSetupPassword) {
        showToast('Password entries do not match.', 'error');
        return;
      }
      updateSettings({
        securityType: 'password',
        securityPin: '',
        securityPassword: setupPassword.trim()
      });
      showToast('Password security successfully enabled.');
    }
    setSecurityModalOpen(false);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const currentType = settings.securityType;
    const correctValue = currentType === 'pin' ? settings.securityPin : settings.securityPassword;

    if (verifyValue === correctValue) {
      setVerifyModalOpen(false);

      if (pendingType === 'reset') {
        setTimeout(() => {
          executeResetDatabase();
        }, 150);
      } else if (pendingType === 'none') {
        updateSettings({
          securityType: 'none',
          securityPin: '',
          securityPassword: ''
        });
        showToast('App security successfully disabled.');
      } else if (pendingType === 'pin') {
        setSecurityModalType('pin');
        setSetupPin('');
        setConfirmSetupPin('');
        setSecurityModalOpen(true);
      } else if (pendingType === 'password') {
        setSecurityModalType('password');
        setSetupPassword('');
        setConfirmSetupPassword('');
        setSecurityModalOpen(true);
      }
    } else {
      showToast(`Incorrect ${currentType === 'pin' ? 'PIN' : 'Password'}. Verification failed.`, 'error');
    }
  };

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    updateSettings({ currency: val });
    showToast(`Currency symbol config updated to: ${val}`);
  };

  const handleThemeChange = (e) => {
    const val = e.target.value;
    updateSettings({ theme: val });
    showToast(`App theme set to: ${val === 'light' ? 'Light Theme' : 'Dark Theme'}`);
  };

  const handleFontSizeChange = (e) => {
    const val = e.target.value;
    updateSettings({ fontSize: val });
    showToast(`App font size set to: ${val.charAt(0).toUpperCase() + val.slice(1)}`);
  };

  const executeResetDatabase = () => {
    showConfirm(
      'Reset Database?',
      'Are you sure you want to delete ALL records? This deletes ledger history, salary plans and accounts.',
      () => {
        setTimeout(() => {
          showConfirm(
            'Confirm Permanent Deletion',
            'CRITICAL WARNING: This action is permanent and cannot be undone. Please type "OK" below to proceed.',
            () => {
              const resetState = {
                accounts: [],
                transactions: [],
                categories: {
                  income: ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
                  expense: ['Food & Dining', 'Groceries', 'Fuel', 'Bills', 'Insurance', 'Rent', 'Shopping', 'Healthcare & Medical', 'Education', 'Entertainment', 'Investment', 'Loan', 'Other']
                },
                salaryHistory: [],
                settings: { currency: 'LKR', theme: 'dark' }
              };
              restoreDatabase(resetState);
              showToast('All local data wiped. Reset to clean template.');
            },
            'danger',
            'OK'
          );
        }, 150);
      }
    );
  };

  const handleResetData = () => {
    if (settings.securityType && settings.securityType !== 'none') {
      setPendingType('reset');
      setVerifyValue('');
      setVerifyModalOpen(true);
    } else {
      executeResetDatabase();
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Settings</h1>
          <p>Configure currencies, local backup, and manage data parameters.</p>
        </div>
      </div>

      <div className="panel">
        {/* Currency Selection */}
        <div className="settings-section">
          <div className="settings-section-title">Localization Options</div>
          <div className="settings-section-desc">Set your currency display preferences. All monetary values will be styled using this symbol.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Active Currency Symbol</div>
              <div className="settings-row-desc">Controls symbol displayed across charts, ledger lists, and totals.</div>
            </div>
            <div>
              <select className="input-ctrl" value={settings.currency || 'LKR'} onChange={handleCurrencyChange} style={{ width: '150px' }}>
                <option value="LKR">LKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="KRW">KRW (₩)</option>
                <option value="RUB">RUB (₽)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Theme Options */}
        <div className="settings-section">
          <div className="settings-section-title">Theme Personalization</div>
          <div className="settings-section-desc">Toggle between a clean light background layout or a comfortable dark mode layout.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Active App Theme</div>
              <div className="settings-row-desc">Currently active layout mode: <strong>{settings.theme === 'light' ? 'Light Theme' : 'Dark Theme'}</strong></div>
            </div>
            <div>
              <select className="input-ctrl" value={settings.theme || 'dark'} onChange={handleThemeChange} style={{ width: '150px' }}>
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
              </select>
            </div>
          </div>
        </div>

        {/* Font Size Options */}
        <div className="settings-section">
          <div className="settings-section-title">Font Size Customization</div>
          <div className="settings-section-desc">Adjust the default sizing of the letters, numbers, and user interfaces.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">App Font Size</div>
              <div className="settings-row-desc">Currently active font size: <strong style={{ textTransform: 'capitalize' }}>{settings.fontSize || 'Medium'}</strong></div>
            </div>
            <div>
              <select className="input-ctrl" value={settings.fontSize || 'medium'} onChange={handleFontSizeChange} style={{ width: '150px' }}>
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Lock Options */}
        <div className="settings-section">
          <div className="settings-section-title">Security & Vault Protection</div>
          <div className="settings-section-desc">Add extra protection for your local data. Select None, PIN lock, or Password lock.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Lock Mode</div>
              <div className="settings-row-desc">Currently active lock mechanism: <strong>{settings.securityType === 'pin' ? 'PIN Lock Enabled' : settings.securityType === 'password' ? 'Password Enabled' : 'None (No Security)'}</strong></div>
            </div>
            <div>
              <select className="input-ctrl" value={settings.securityType || 'none'} onChange={handleSecurityChange} style={{ width: '150px' }}>
                <option value="none">None (No Lock)</option>
                <option value="pin">PIN Lock</option>
                <option value="password">Password</option>
              </select>
            </div>
          </div>
        </div>

        {/* About & Privacy Information */}
        <div className="settings-section">
          <div className="settings-section-title">About MoneyMate Vault & Privacy Guarantee</div>
          <div className="settings-section-desc">View product build version details, software benefits, and local storage data architecture.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Version 1.6.0 (Offline & Private Edition)</div>
              <div className="settings-row-desc">
                Your financial data stays 100% on your device. Zero cloud telemetry.
              </div>
            </div>
            <div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onOpenAbout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: '150px', justifyContent: 'center' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                About & Specs
              </button>
            </div>
          </div>
        </div>

        {/* Reset Data section */}
        <div className="settings-section">
          <div className="settings-section-title" style={{ color: '#f43f5e' }}>Dangerous Territory</div>
          <div className="settings-section-desc">Permanently wipe all records. This is irreversible.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Reset Database</div>
              <div className="settings-row-desc">Deletes all ledger history, accounts, and salary plans, initializing back to blank slate.</div>
            </div>
            <div>
              <button className="btn btn-danger" onClick={handleResetData}>Reset Data</button>
            </div>
          </div>
        </div>
      </div>

      {/* SETUP SECURITY CREDENTIALS MODAL */}
      <Modal isOpen={securityModalOpen} onClose={() => setSecurityModalOpen(false)} title={`Setup ${securityModalType === 'pin' ? 'PIN Lock' : 'Password'}`}>
        <form onSubmit={handleSetupSubmit}>
          <div className="modal-body">
            {securityModalType === 'pin' ? (
              <>
                <div className="form-group">
                  <label>Enter 4-Digit PIN</label>
                  <input
                    type="password"
                    pattern="\d*"
                    maxLength="4"
                    className="input-ctrl"
                    value={setupPin}
                    onChange={e => setSetupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm 4-Digit PIN</label>
                  <input
                    type="password"
                    pattern="\d*"
                    maxLength="4"
                    className="input-ctrl"
                    value={confirmSetupPin}
                    onChange={e => setConfirmSetupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Enter Password</label>
                  <input
                    type="password"
                    className="input-ctrl"
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    placeholder="Secure password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    className="input-ctrl"
                    value={confirmSetupPassword}
                    onChange={e => setConfirmSetupPassword(e.target.value)}
                    placeholder="Confirm secure password"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setSecurityModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-settings">Enable Protection</button>
          </div>
        </form>
      </Modal>

      {/* VERIFY ACTIVE SECURITY CREDENTIALS MODAL */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title={`Verify Current ${settings.securityType === 'pin' ? 'PIN' : 'Password'}`}>
        <form onSubmit={handleVerifySubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              For security reasons, please enter your current {settings.securityType === 'pin' ? '4-digit PIN' : 'password'} to authorize this {pendingType === 'reset' ? 'database reset' : 'settings change'}.
            </p>
            <div className="form-group">
              <label>Current {settings.securityType === 'pin' ? 'PIN' : 'Password'}</label>
              <input
                type="password"
                className="input-ctrl"
                value={verifyValue}
                onChange={e => setVerifyValue(e.target.value)}
                placeholder={settings.securityType === 'pin' ? "e.g. 1234" : "Your password"}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-settings">Verify Credentials</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        requireTextInput={confirmState.requireTextInput}
      />
    </div>
  );
}
