import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    restoreDatabase, 
    showToast: hookShowToast,
    license,
    isPro,
    purchaseProMicrosoftStore,
    activateLicenseKey,
    deactivateLicense,
    setProDevOverride
  } = useDatabase();
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
  const [settingsLicenseKey, setSettingsLicenseKey] = useState('');

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

  const handleResetData = () => {
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

        {/* Licensing & Pro Features */}
        <div className="settings-section">
          <div className="settings-section-title">License & Subscription Tiers</div>
          <div className="settings-section-desc">Manage your MoneyMate license key and unlock premium capabilities.</div>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="settings-row-info">
                <div className="settings-row-title">Active License Status</div>
                <div className="settings-row-desc">
                  Current Status: <strong style={{ color: isPro ? '#34d399' : '#fbbf24' }}>{isPro ? 'Pro Mode Active' : 'Free Tier'}</strong>
                  {isPro && license?.type === 'dev_override' && ' (Development Mode)'}
                  {isPro && license?.type === 'microsoft_store' && ' (Microsoft Store App)'}
                  {isPro && license?.type === 'license_key' && ' (Standalone License Key)'}
                </div>
              </div>
              <div>
                {isPro ? (
                  <button className="btn btn-secondary" onClick={async () => {
                    await deactivateLicense();
                    showToast('License deactivated. Reverted to Free mode.');
                  }}>Deactivate License</button>
                ) : (
                  <button className="btn btn-primary" onClick={async () => {
                    const res = await purchaseProMicrosoftStore();
                    if (res.success) {
                      showToast('Microsoft Store purchase simulation succeeded! MoneyMate Pro activated.');
                    } else if (res.error) {
                      showToast(res.error, 'error');
                    }
                  }} style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}>
                    Upgrade to Pro ($9.99)
                  </button>
                )}
              </div>
            </div>

            {!isPro && (
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Activate Standalone Offline Key</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="input-ctrl"
                    placeholder="MM-XXXX-XXXX-XXXX-XXXX"
                    value={settingsLicenseKey}
                    onChange={e => setSettingsLicenseKey(e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em', color: '#fff', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}
                  />
                  <button className="btn btn-secondary" onClick={async () => {
                    if (!settingsLicenseKey.trim()) {
                      showToast('Please enter a key.', 'warning');
                      return;
                    }
                    const res = await activateLicenseKey(settingsLicenseKey.trim());
                    if (res.success) {
                      showToast('License key activated! Welcome to MoneyMate Pro.');
                      setSettingsLicenseKey('');
                    } else {
                      showToast(res.error || 'Invalid key checksum.', 'error');
                    }
                  }}>Activate Key</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Enter the standalone key purchased outside the store. Try valid keys: <code>MM-FREE-PROM-O26X-6F7B</code>
                </div>
              </div>
            )}

            {/* Development Override for Testers */}
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f87171' }}>Local Development Override</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instantly switch Pro state offline during development or UI verification.</div>
              </div>
              <div>
                <input
                  type="checkbox"
                  checked={!!license?.isProDevOverride}
                  onChange={async (e) => {
                    await setProDevOverride(e.target.checked);
                    showToast(e.target.checked ? 'Development Mode Pro Override Enabled.' : 'Development Mode Pro Override Disabled.');
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
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
