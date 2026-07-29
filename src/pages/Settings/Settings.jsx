import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import Modal from '../../components/Modal';

export default function Settings() {
  const { settings, updateSettings, restoreDatabase, showToast: hookShowToast } = useDatabase();
  const { showToast } = useToast();

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

      if (pendingType === 'none') {
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

  const handleExportBackup = async () => {
    try {
      const res = await api.exportBackup();
      if (res.success) {
        showToast('Offline database backup file saved successfully.');
      } else if (!res.canceled) {
        showToast(`Failed to export database: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error exporting backup file.', 'error');
    }
  };

  const handleImportBackup = async () => {
    const confirmRestore = confirm('Warning: Overwriting your current database with a backup file is irreversible. All current logs will be replaced. Proceed?');
    if (!confirmRestore) return;

    try {
      const res = await api.importBackup();
      if (res.success && res.data) {
        restoreDatabase(res.data);
        showToast('Database backup restored successfully.');
      } else if (!res.canceled) {
        showToast(`Failed to restore backup: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error restoring backup file.', 'error');
    }
  };

  const handleResetData = () => {
    const firstConfirm = confirm('Are you sure you want to delete ALL records? This deletes ledger history, salary plans and accounts.');
    if (firstConfirm) {
      const secondConfirm = confirm('CRITICAL WARNING: This action is permanent and cannot be undone. Type "OK" to proceed.');
      if (secondConfirm) {
        const resetState = {
          accounts: [],
          transactions: [],
          categories: {
            income: ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
            expense: ['Food', 'Fuel', 'Bills', 'Insurance', 'Rent', 'Shopping', 'Medical', 'Entertainment', 'Investment', 'Loan', 'Other']
          },
          salaryHistory: [],
          settings: { currency: 'LKR', theme: 'dark' }
        };
        restoreDatabase(resetState);
        showToast('All local data wiped. Reset to clean template.');
      }
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

        {/* Database Backup and Restore */}
        <div className="settings-section">
          <div className="settings-section-title">Local Database Utilities</div>
          <div className="settings-section-desc">Export a copy of database JSON data or restore from a previously exported backup file.</div>
          <div className="settings-row" style={{ marginBottom: '16px' }}>
            <div className="settings-row-info">
              <div className="settings-row-title">Backup database</div>
              <div className="settings-row-desc">Generates a complete offline JSON copy of your accounts and ledger.</div>
            </div>
            <div>
              <button className="btn btn-secondary" onClick={handleExportBackup}>Create Backup</button>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Restore backup</div>
              <div className="settings-row-desc">Overwrite existing app database with a previously exported JSON backup. WARNING: Existing data will be replaced.</div>
            </div>
            <div>
              <button className="btn btn-secondary" onClick={handleImportBackup}>Restore Backup</button>
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
            <button type="submit" className="btn btn-primary">Enable Protection</button>
          </div>
        </form>
      </Modal>

      {/* VERIFY ACTIVE SECURITY CREDENTIALS MODAL */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title={`Verify Current ${settings.securityType === 'pin' ? 'PIN' : 'Password'}`}>
        <form onSubmit={handleVerifySubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              For security reasons, please enter your current {settings.securityType === 'pin' ? '4-digit PIN' : 'password'} to authorize this settings change.
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
            <button type="submit" className="btn btn-primary">Verify Credentials</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
