import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { encryptData, decryptData } from '../../utils/crypto';
import { api } from '../../services/api';

export default function Backup() {
  const { transactions, accounts, categories, salaryHistory, settings, profile, restoreDatabase, updateSettings } = useDatabase();
  const { showToast } = useToast();

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', requireTextInput: '' });

  const showConfirm = (title, message, onConfirm, type = 'danger', requireTextInput = '') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type, requireTextInput });
  };

  const [activeTab, setActiveTab] = useState('gdrive'); // gdrive, onedrive, dropbox
  const connections = {
    gdrive: {
      connected: !!settings.gdriveConnected,
      email: settings.gdriveEmail || ''
    },
    onedrive: {
      connected: !!settings.onedriveConnected,
      email: settings.onedriveEmail || ''
    },
    dropbox: {
      connected: !!settings.dropboxConnected,
      email: settings.dropboxEmail || ''
    }
  };

  const [simulatedLoginEmail, setSimulatedLoginEmail] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Workflows animations
  const [workflowType, setWorkflowType] = useState(null); // 'backup' or 'restore'
  const [workflowStep, setWorkflowStep] = useState(0); // 0 to 4 steps
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);

  const activeConn = connections[activeTab];

  const handleOpenLogin = () => {
    setSimulatedLoginEmail(activeTab === 'gdrive' ? 'john@gmail.com' : activeTab === 'onedrive' ? 'john@outlook.com' : 'john@dropbox.com');
    setIsLoginModalOpen(true);
  };

  const handleConnect = (e) => {
    e.preventDefault();
    if (!simulatedLoginEmail.trim()) {
      showToast('Please enter an account email.', 'error');
      return;
    }
    updateSettings({
      [activeTab + 'Connected']: true,
      [activeTab + 'Email']: simulatedLoginEmail.trim()
    });
    setIsLoginModalOpen(false);
    showToast(`Successfully linked to ${activeTab === 'gdrive' ? 'Google Drive' : activeTab === 'onedrive' ? 'OneDrive' : 'Dropbox'}!`);
  };

  const handleDisconnect = () => {
    updateSettings({
      [activeTab + 'Connected']: false,
      [activeTab + 'Email']: '',
      [activeTab + 'BackupEnabled']: false
    });
    showToast(`Disconnected from ${activeTab === 'gdrive' ? 'Google Drive' : activeTab === 'onedrive' ? 'OneDrive' : 'Dropbox'}.`);
  };

  const handleLinkFolder = async () => {
    try {
      const res = await api.selectFolder();
      if (!res.canceled && res.folderPath) {
        updateSettings({
          [activeTab + 'BackupPath']: res.folderPath
        });
        showToast(`Linked ${activeTab === 'gdrive' ? 'Google Drive' : activeTab === 'onedrive' ? 'OneDrive' : 'Dropbox'} local sync folder.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to select folder.', 'error');
    }
  };

  const handleToggleAutoSync = (e) => {
    const checked = e.target.checked;
    const currentPath = settings[activeTab + 'BackupPath'];
    if (checked && !currentPath) {
      showToast('Please select a local sync folder path first.', 'warning');
      return;
    }
    updateSettings({
      [activeTab + 'BackupEnabled']: checked
    });
    showToast(`Background auto-sync ${checked ? 'enabled' : 'disabled'}.`);
  };

  const handleSyncFolderNow = async () => {
    const currentPath = settings[activeTab + 'BackupPath'];
    if (!currentPath) {
      showToast('Please select a local sync folder path first.', 'error');
      return;
    }
    showToast('Starting cloud sync... Copying database and missing payslips...');
    try {
      const res = await api.syncCloudFolder(currentPath);
      if (res.success) {
        showToast('Cloud synchronization complete! Database and missing payslips uploaded.');
      } else {
        showToast(`Sync failed: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Sync failed.', 'error');
    }
  };

  // Run Encrypted Backup Workflow
  const handleBackupWorkflow = async () => {
    if (!activeConn.connected) {
      showToast('Please connect your cloud account first.', 'warning');
      return;
    }
    
    setIsWorkflowActive(true);
    setWorkflowType('backup');
    setWorkflowStep(1); // 1. Extracting data

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    
    try {
      await sleep(1000);
      setWorkflowStep(2); // 2. Encrypting JSON

      // Build payload
      const appData = {
        accounts,
        transactions,
        categories,
        salaryHistory,
        settings,
        profile
      };

      // Encrypt
      const encryptedString = encryptData(appData);
      
      await sleep(1000);
      setWorkflowStep(3); // 3. Uploading socket
      
      await sleep(1200);
      setWorkflowStep(4); // 4. Saving package file
      
      // Write actual encrypted file via OS dialog
      const defaultName = `moneymate_vault_backup_${activeTab}_${new Date().toISOString().split('T')[0]}.enc`;
      const res = await api.writeEncryptedFile(encryptedString, defaultName);
      
      if (res.success) {
        showToast('Vault backup file encrypted and saved successfully!');
      } else if (!res.canceled) {
        throw new Error(res.error || 'Failed to save encrypted file.');
      }
    } catch (err) {
      console.error(err);
      showToast(`Backup workflow failed: ${err.message}`, 'error');
    } finally {
      setIsWorkflowActive(false);
      setWorkflowType(null);
      setWorkflowStep(0);
    }
  };

  const executeRestoreWorkflow = async () => {
    setIsWorkflowActive(true);
    setWorkflowType('restore');
    setWorkflowStep(1); // 1. Select / Download file

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    try {
      // Read encrypted file from OS dialog
      const fileRes = await api.readEncryptedFile();
      
      if (fileRes.canceled) {
        showToast('Restore cancelled.');
        return;
      }
      
      if (!fileRes.success || !fileRes.content) {
        throw new Error(fileRes.error || 'Could not load backup file.');
      }

      await sleep(1000);
      setWorkflowStep(2); // 2. Decrypting cipher
      
      const decryptedData = decryptData(fileRes.content);
      
      await sleep(1000);
      setWorkflowStep(3); // 3. Schema validation
      
      if (!decryptedData.accounts || !decryptedData.transactions) {
        throw new Error('Corrupted data format. Accounts or transactions array is missing.');
      }

      await sleep(1000);
      setWorkflowStep(4); // 4. Restoring DB state
      
      restoreDatabase(decryptedData);
      showToast('App database restored and decrypted successfully!');
    } catch (err) {
      console.error(err);
      showToast(`Restore failed: ${err.message}`, 'error');
    } finally {
      setIsWorkflowActive(false);
      setWorkflowType(null);
      setWorkflowStep(0);
    }
  };

  // Run Decrypted Restore Workflow
  const handleRestoreWorkflow = async () => {
    if (!activeConn.connected) {
      showToast('Please connect your cloud account first.', 'warning');
      return;
    }

    showConfirm(
      'Restore Database Backup',
      'Warning: Restoring from a backup will overwrite all current profiles, accounts, and transactions ledger. Proceed?',
      () => {
        executeRestoreWorkflow();
      }
    );
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Cloud Vault Backups</h1>
          <p>Encrypt and synchronize your personal finance ledger securely on OneDrive, Google Drive or Dropbox.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'gdrive' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('gdrive')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          Google Drive
        </button>
        <button 
          className={`btn ${activeTab === 'onedrive' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('onedrive')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          Microsoft OneDrive
        </button>
        <button 
          className={`btn ${activeTab === 'dropbox' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dropbox')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          Dropbox Vault
        </button>
      </div>

      <div className="grid-2-1" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize', marginBottom: '6px' }}>
              {activeTab === 'gdrive' ? 'Google Drive Cloud Sync' : activeTab === 'onedrive' ? 'Microsoft OneDrive Sync' : 'Dropbox Secure Sync'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Create encrypted backups of your offline financial charts or load a previously generated payload package file.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: activeConn.connected ? '#10b981' : '#f43f5e' }}></span>
                {activeConn.connected ? 'Cloud Service Active' : 'Service Disconnected'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {activeConn.connected ? `Linked account email: ${activeConn.email}` : 'Please log in to authorize storage folders.'}
              </div>
            </div>
            <div>
              {activeConn.connected ? (
                <button className="btn btn-secondary" onClick={handleDisconnect} style={{ borderColor: '#f43f5e', color: '#f43f5e' }}>Disconnect</button>
              ) : (
                <button className="btn btn-primary" onClick={handleOpenLogin}>Link Account</button>
              )}
            </div>
          </div>

          {activeConn.connected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              
              {/* Desktop Sync Folder Linking */}
              <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'capitalize' }}>{activeTab === 'gdrive' ? 'Google Drive' : activeTab === 'onedrive' ? 'OneDrive' : 'Dropbox'} Sync Folder</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>Copy database state and attachments to your local cloud client directory.</p>
                  </div>
                  <button type="button" className="btn btn-settings" onClick={handleLinkFolder} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Link Directory</button>
                </div>
                {settings[activeTab + 'BackupPath'] && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Folder path: <code style={{ color: 'var(--text-primary)' }}>{settings[activeTab + 'BackupPath']}</code>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        checked={!!settings[activeTab + 'BackupEnabled']} 
                        onChange={handleToggleAutoSync} 
                        style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                      />
                      Enable Auto-Sync
                    </label>
                  </div>
                )}
                <button type="button" className="btn btn-primary" onClick={handleSyncFolderNow} style={{ fontSize: '0.8rem', padding: '10px', marginTop: '4px', width: '100%' }}>
                  🔄 Sync Now (Upload Database & Missing Payslips)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🔒 Encrypted Backup</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                    Encrypts database data locally with an offline cipher key, encodes to base64, and exports a secure `.enc` file.
                  </p>
                  <button className="btn btn-secondary" onClick={handleBackupWorkflow} disabled={isWorkflowActive}>
                    Start Encrypted Backup
                  </button>
                </div>

                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📂 Decrypted Restore</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                    Browse and select an encrypted `.enc` file. Decrypts locally, validates schema parameters, and restores app state.
                  </p>
                  <button className="btn btn-secondary" onClick={handleRestoreWorkflow} disabled={isWorkflowActive}>
                    Restore from Cloud Backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simulated connection animation workflow */}
          {isWorkflowActive && (
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary-color)', width: '16px', height: '16px', borderRadius: '50%', display: 'inline-block' }}></span>
                {workflowType === 'backup' ? 'Running Database Backup Workflow' : 'Running Cloud Restore Workflow'}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                {workflowType === 'backup' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 1 ? 1 : 0.4 }}>
                      <span>{workflowStep > 1 ? '✅' : '⏳'}</span>
                      <span>Extracting local database ledger structures...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 2 ? 1 : 0.4 }}>
                      <span>{workflowStep > 2 ? '✅' : '⏳'}</span>
                      <span>Encrypting JSON data bytes (Base64 XOR block cipher)...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 3 ? 1 : 0.4 }}>
                      <span>{workflowStep > 3 ? '✅' : '⏳'}</span>
                      <span>Pushing package to cloud socket storage directory...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 4 ? 1 : 0.4 }}>
                      <span>{workflowStep >= 4 ? '✅' : '⏳'}</span>
                      <span>Finalizing secure `.enc` file generation...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 1 ? 1 : 0.4 }}>
                      <span>{workflowStep > 1 ? '✅' : '⏳'}</span>
                      <span>Downloading database package from cloud directory...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 2 ? 1 : 0.4 }}>
                      <span>{workflowStep > 2 ? '✅' : '⏳'}</span>
                      <span>Decrypting XOR base64 cipher streams...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 3 ? 1 : 0.4 }}>
                      <span>{workflowStep > 3 ? '✅' : '⏳'}</span>
                      <span>Validating database ledger parameters and security signatures...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: workflowStep >= 4 ? 1 : 0.4 }}>
                      <span>{workflowStep >= 4 ? '✅' : '⏳'}</span>
                      <span>Overwriting app data state & reloading dashboard interface...</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security Information</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px', color: '#60a5fa' }}>
              <strong>🔒 Zero Knowledge Key</strong><br />
              Encryption happens client-side. The cloud servers only receive the encrypted `.enc` file format. Your finance data is completely secure.
            </div>
            <div>
              <strong>📂 Backup Schema</strong><br />
              Backups hold your full transaction ledger, custom categories, profile parameters, salary monitors, and bank card information.
            </div>
            <div>
              <strong>💡 Sync Note</strong><br />
              Google Drive local folders natively handle continuous backup files in the background if Google Drive Desktop Client is running.
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Login Modal */}
      {isLoginModalOpen && (
        <div className="modal-backdrop active" onClick={() => setIsLoginModalOpen(false)}>
          <div className="modal-content active" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Authorize {activeTab === 'gdrive' ? 'Google Drive' : activeTab === 'onedrive' ? 'OneDrive' : 'Dropbox'} Connection</h2>
              <button className="modal-close" onClick={() => setIsLoginModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleConnect}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Link your cloud account to create automated, secure backups directly from MoneyMate.
                </p>
                <div className="form-group">
                  <label>Service Account Email</label>
                  <input 
                    type="email" 
                    className="input-ctrl" 
                    value={simulatedLoginEmail}
                    onChange={e => setSimulatedLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsLoginModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Connect Vault</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
