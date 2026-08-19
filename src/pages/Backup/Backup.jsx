import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import Modal from '../../components/Modal';
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
      providerKey: 'gdrive',
      providerName: 'Google Drive',
      brandIcon: '📁',
      connected: !!settings.gdriveConnected,
      email: settings.gdriveEmail || '',
      name: settings.gdriveName || '',
      picture: settings.gdrivePicture || '',
      storageQuota: settings.gdriveStorageQuota || null,
      lastVerified: settings.gdriveLastVerified || null,
      lastBackupTime: settings.gdriveLastBackupTime || null
    },
    onedrive: {
      providerKey: 'onedrive',
      providerName: 'Microsoft OneDrive',
      brandIcon: '☁️',
      connected: !!settings.onedriveConnected,
      email: settings.onedriveEmail || '',
      name: settings.onedriveName || '',
      picture: settings.onedrivePicture || '',
      storageQuota: settings.onedriveStorageQuota || null,
      lastVerified: settings.onedriveLastVerified || null,
      lastBackupTime: settings.onedriveLastBackupTime || null
    },
    dropbox: {
      providerKey: 'dropbox',
      providerName: 'Dropbox',
      brandIcon: '📦',
      connected: !!settings.dropboxConnected,
      email: settings.dropboxEmail || '',
      name: settings.dropboxName || '',
      picture: settings.dropboxPicture || '',
      storageQuota: settings.dropboxStorageQuota || null,
      lastVerified: settings.dropboxLastVerified || null,
      lastBackupTime: settings.dropboxLastBackupTime || null
    }
  };

  const activeConn = connections[activeTab];

  // OAuth States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState('');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);

  // Cloud Backups List & Restore States
  const [cloudBackups, setCloudBackups] = useState([]);
  const [isLoadingCloudBackups, setIsLoadingCloudBackups] = useState(false);
  const [isRestoringCloudBackup, setIsRestoringCloudBackup] = useState(false);

  // Workflow animations for local file operations
  const [workflowType, setWorkflowType] = useState(null); // 'backup' or 'restore'
  const [workflowStep, setWorkflowStep] = useState(0);
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);

  // Progress subscriber from Electron
  useEffect(() => {
    const unsubscribe = api.onAuthProgress((progress) => {
      if (progress.message) {
        setAuthStatusMessage(progress.message);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch Cloud Backups list whenever tab changes or connection is confirmed
  const loadCloudBackups = async (provider = activeTab) => {
    if (!connections[provider]?.connected) {
      setCloudBackups([]);
      return;
    }
    setIsLoadingCloudBackups(true);
    try {
      const res = await api.listCloudBackups(provider);
      if (res.success) {
        setCloudBackups(res.files || []);
      } else {
        console.warn('Could not list cloud backups:', res.error);
        setCloudBackups([]);
      }
    } catch (e) {
      console.error(e);
      setCloudBackups([]);
    } finally {
      setIsLoadingCloudBackups(false);
    }
  };

  useEffect(() => {
    if (activeConn.connected) {
      loadCloudBackups(activeTab);
    } else {
      setCloudBackups([]);
    }
  }, [activeTab, activeConn.connected]);

  const handleOpenAuthModal = () => {
    setIsAuthenticating(false);
    setAuthStatusMessage('');
    setAuthErrorMessage('');
    setIsAuthModalOpen(true);
  };

  const handleStartOAuth = async () => {
    setIsAuthenticating(true);
    setAuthErrorMessage('');
    setAuthStatusMessage(`Opening your browser to log in with ${activeConn.providerName}...`);

    try {
      const res = await api.startOAuth(activeTab);

      if (res.success) {
        updateSettings({
          [`${activeTab}Connected`]: true,
          [`${activeTab}Email`]: res.email,
          [`${activeTab}Name`]: res.name,
          [`${activeTab}Picture`]: res.picture,
          [`${activeTab}StorageQuota`]: res.storageQuota,
          [`${activeTab}LastVerified`]: res.lastVerified,
          [`${activeTab}EncryptedAccessToken`]: res.encryptedAccessToken,
          [`${activeTab}EncryptedRefreshToken`]: res.encryptedRefreshToken,
          [`${activeTab}TokenExpiresAt`]: res.tokenExpiresAt
        });

        setIsAuthModalOpen(false);
        showToast(`✓ ${activeConn.providerName} Connected successfully!`);
        loadCloudBackups(activeTab);
      } else {
        throw new Error(res.error || 'Connection failed.');
      }
    } catch (err) {
      console.error(err);
      setIsAuthenticating(false);
      setAuthErrorMessage(err.message || 'Connection was cancelled or encountered an error.');
    }
  };

  const handleTestConnection = async () => {
    setIsVerifyingConnection(true);
    showToast(`Testing ${activeConn.providerName} connection...`);
    try {
      const res = await api.verifyOAuthToken(activeTab);
      if (res.success) {
        updateSettings({
          [`${activeTab}Email`]: res.email,
          [`${activeTab}Name`]: res.name,
          [`${activeTab}Picture`]: res.picture,
          [`${activeTab}StorageQuota`]: res.storageQuota,
          [`${activeTab}LastVerified`]: res.lastVerified
        });
        showToast(`✓ ${activeConn.providerName} connection verified! Account is active.`);
        loadCloudBackups(activeTab);
      } else {
        showToast(`Verification failed: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`Verification error: ${err.message}`, 'error');
    } finally {
      setIsVerifyingConnection(false);
    }
  };

  const handleDisconnect = () => {
    showConfirm(
      `Disconnect ${activeConn.providerName}`,
      `Are you sure you want to disconnect ${activeConn.providerName} (${activeConn.email})?`,
      async () => {
        try {
          await api.disconnectOAuth(activeTab);
          updateSettings({
            [`${activeTab}Connected`]: false,
            [`${activeTab}Email`]: '',
            [`${activeTab}Name`]: '',
            [`${activeTab}Picture`]: '',
            [`${activeTab}StorageQuota`]: null,
            [`${activeTab}LastVerified`]: null,
            [`${activeTab}EncryptedAccessToken`]: '',
            [`${activeTab}EncryptedRefreshToken`]: '',
            [`${activeTab}TokenExpiresAt`]: null,
            [`${activeTab}BackupEnabled`]: false
          });
          setCloudBackups([]);
          showToast(`Disconnected from ${activeConn.providerName}.`);
        } catch (err) {
          console.error(err);
          showToast('Failed to disconnect.', 'error');
        }
      }
    );
  };

  const handleDirectCloudUpload = async () => {
    if (!activeConn.connected) {
      showToast(`Please connect ${activeConn.providerName} first.`, 'warning');
      return;
    }

    setIsDirectUploading(true);
    showToast(`Encrypting data and uploading to MoneyMate Backups folder...`);

    try {
      const appData = {
        accounts,
        transactions,
        categories,
        salaryHistory,
        settings,
        profile
      };

      const encryptedString = encryptData(appData);
      const currentDate = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultName = `moneymate_vault_backup_${activeTab}_${currentDate}.enc`;

      const res = await api.directCloudUpload(activeTab, encryptedString, defaultName);

      if (res.success) {
        updateSettings({
          [`${activeTab}LastBackupTime`]: res.uploadedAt || new Date().toISOString()
        });
        showToast(`✓ Encrypted backup successfully saved to "MoneyMate Backups" on ${activeConn.providerName}!`);
        loadCloudBackups(activeTab);
      } else {
        throw new Error(res.error || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setIsDirectUploading(false);
    }
  };

  const handleRestoreFromCloud = (backupFile) => {
    showConfirm(
      'Restore Cloud Backup',
      `Are you sure you want to restore from "${backupFile.name}"? All current local accounts and transactions will be replaced with this encrypted backup.`,
      async () => {
        setIsRestoringCloudBackup(true);
        showToast(`Downloading and restoring from ${activeConn.providerName}...`);
        try {
          const res = await api.downloadCloudBackup(activeTab, backupFile.id);
          if (!res.success || !res.content) {
            throw new Error(res.error || 'Failed to download cloud backup file.');
          }

          const decryptedData = decryptData(res.content);
          if (!decryptedData || !decryptedData.accounts || !decryptedData.transactions) {
            throw new Error('Corrupted or invalid backup file format.');
          }

          restoreDatabase(decryptedData);
          showToast(`✓ App database restored successfully from ${backupFile.name}!`);
        } catch (err) {
          console.error(err);
          showToast(`Restore failed: ${err.message}`, 'error');
        } finally {
          setIsRestoringCloudBackup(false);
        }
      }
    );
  };

  const handleLinkFolder = async () => {
    try {
      const res = await api.selectFolder();
      if (!res.canceled && res.folderPath) {
        updateSettings({
          [`${activeTab}BackupPath`]: res.folderPath
        });
        showToast(`Linked ${activeConn.providerName} local sync folder.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to select folder.', 'error');
    }
  };

  const handleToggleAutoSync = (e) => {
    const checked = e.target.checked;
    const currentPath = settings[`${activeTab}BackupPath`];
    if (checked && !currentPath) {
      showToast('Please select a local sync folder path first.', 'warning');
      return;
    }
    updateSettings({
      [`${activeTab}BackupEnabled`]: checked
    });
    showToast(`Background auto-sync ${checked ? 'enabled' : 'disabled'}.`);
  };

  const handleSyncFolderNow = async () => {
    const currentPath = settings[`${activeTab}BackupPath`];
    if (!currentPath) {
      showToast('Please select a local sync folder path first.', 'error');
      return;
    }
    showToast(`Starting ${activeConn.providerName} folder sync...`);
    try {
      const res = await api.syncCloudFolder(currentPath);
      if (res.success) {
        showToast('Cloud synchronization complete! Database and payslips copied.');
      } else {
        showToast(`Sync failed: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Sync failed.', 'error');
    }
  };

  const handleBackupWorkflow = async () => {
    setIsWorkflowActive(true);
    setWorkflowType('backup');
    setWorkflowStep(1);

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    
    try {
      await sleep(800);
      setWorkflowStep(2);

      const appData = {
        accounts,
        transactions,
        categories,
        salaryHistory,
        settings,
        profile
      };

      const encryptedString = encryptData(appData);
      
      await sleep(800);
      setWorkflowStep(3);
      
      await sleep(800);
      setWorkflowStep(4);
      
      const defaultName = `moneymate_vault_backup_${new Date().toISOString().split('T')[0]}.enc`;
      const res = await api.writeEncryptedFile(encryptedString, defaultName);
      
      if (res.success) {
        showToast('Vault backup file encrypted and saved successfully!');
      } else if (!res.canceled) {
        throw new Error(res.error || 'Failed to save encrypted file.');
      }
    } catch (err) {
      console.error(err);
      showToast(`Backup failed: ${err.message}`, 'error');
    } finally {
      setIsWorkflowActive(false);
      setWorkflowType(null);
      setWorkflowStep(0);
    }
  };

  const executeRestoreWorkflow = async () => {
    setIsWorkflowActive(true);
    setWorkflowType('restore');
    setWorkflowStep(1);

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    try {
      const fileRes = await api.readEncryptedFile();
      
      if (fileRes.canceled) {
        showToast('Restore cancelled.');
        return;
      }
      
      if (!fileRes.success || !fileRes.content) {
        throw new Error(fileRes.error || 'Could not load backup file.');
      }

      await sleep(800);
      setWorkflowStep(2);
      
      const decryptedData = decryptData(fileRes.content);
      
      await sleep(800);
      setWorkflowStep(3);
      
      if (!decryptedData.accounts || !decryptedData.transactions) {
        throw new Error('Corrupted data format. Accounts or transactions array is missing.');
      }

      await sleep(800);
      setWorkflowStep(4);
      
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

  const handleRestoreWorkflow = async () => {
    showConfirm(
      'Restore Database Backup',
      'Warning: Restoring from a backup file will overwrite all current profiles, accounts, and transactions ledger. Proceed?',
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
          <p>Back up your encrypted MoneyMate data securely to your personal cloud storage.</p>
        </div>
      </div>

      {/* Provider Selector Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'gdrive' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('gdrive')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem' }}
        >
          <span>📁</span>
          Google Drive {settings.gdriveConnected && '✓'}
        </button>
        <button 
          className={`btn ${activeTab === 'onedrive' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('onedrive')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem' }}
        >
          <span>☁️</span>
          Microsoft OneDrive {settings.onedriveConnected && '✓'}
        </button>
        <button 
          className={`btn ${activeTab === 'dropbox' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dropbox')}
          style={{ flexGrow: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem' }}
        >
          <span>📦</span>
          Dropbox {settings.dropboxConnected && '✓'}
        </button>
      </div>

      <div className="grid-2-1" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              {activeConn.providerName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Back up your encrypted MoneyMate data securely to {activeConn.providerName}.
            </p>
          </div>

          {/* Connected View vs Disconnected View */}
          {activeConn.connected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Connected Hero Card */}
              <div className="cloud-account-hero">
                <div className="cloud-user-section">
                  <div className="cloud-avatar-wrapper">
                    {activeConn.picture ? (
                      <img src={activeConn.picture} alt={activeConn.name || 'User'} className="cloud-avatar-img" />
                    ) : (
                      <div className="cloud-avatar-fallback">
                        {(activeConn.name || activeConn.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="cloud-status-dot-badge"></span>
                  </div>
                  <div className="cloud-user-info">
                    <h3>
                      {activeConn.providerName}
                      <span className="cloud-verified-pill">● Connected</span>
                    </h3>
                    <div className="cloud-user-email">{activeConn.email}</div>
                    <div className="cloud-verified-meta">
                      Last verified: {activeConn.lastVerified ? new Date(activeConn.lastVerified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleTestConnection}
                    disabled={isVerifyingConnection}
                    style={{ fontSize: '0.84rem', padding: '8px 14px' }}
                  >
                    {isVerifyingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleDisconnect}
                    style={{ borderColor: '#f43f5e', color: '#f43f5e', fontSize: '0.84rem', padding: '8px 14px' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Storage Quota widget */}
              {activeConn.storageQuota && (
                <div className="cloud-quota-box">
                  <div className="cloud-quota-header">
                    <span><strong>Cloud Storage:</strong> {activeConn.storageQuota.formattedUsed} of {activeConn.storageQuota.formattedTotal} used ({activeConn.storageQuota.percentage}%)</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span>
                  </div>
                  <div className="cloud-quota-track">
                    <div 
                      className="cloud-quota-progress" 
                      style={{ width: `${Math.max(3, Math.min(100, activeConn.storageQuota.percentage))}%` }}
                    ></div>
                  </div>
                  {activeConn.lastBackupTime && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Last backup: {new Date(activeConn.lastBackupTime).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Direct Cloud Backup Action */}
              <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'rgba(99, 102, 241, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>☁️ Backup to {activeConn.providerName}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                    Creates and uploads an encrypted backup directly into your <strong>MoneyMate Backups</strong> folder.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleDirectCloudUpload}
                  disabled={isDirectUploading}
                  style={{ flexShrink: 0, padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  {isDirectUploading ? 'Uploading...' : `Backup Now`}
                </button>
              </div>

              {/* Cloud Restore / Available Backups in App Folder */}
              <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📥 Restore from {activeConn.providerName}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                      Restore encrypted backups saved in your <strong>MoneyMate Backups</strong> cloud folder.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => loadCloudBackups(activeTab)}
                    disabled={isLoadingCloudBackups}
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    {isLoadingCloudBackups ? 'Refreshing...' : '🔄 Refresh Backups'}
                  </button>
                </div>

                {isLoadingCloudBackups ? (
                  <div style={{ textAlign: 'center', padding: '18px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Scanning {activeConn.providerName} for MoneyMate backups...
                  </div>
                ) : cloudBackups.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cloudBackups.map(file => (
                      <div 
                        key={file.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '12px 14px', 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          borderRadius: '8px' 
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            🔒 {file.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Recent'} • {file.formattedSize || 'Encrypted'}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => handleRestoreFromCloud(file)}
                          disabled={isRestoringCloudBackup}
                          style={{ flexShrink: 0, fontSize: '0.8rem', padding: '6px 14px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                        >
                          {isRestoringCloudBackup ? 'Restoring...' : 'Restore'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No cloud backups found in <strong>MoneyMate Backups</strong>. Click <strong>Backup Now</strong> to create your first cloud snapshot.
                  </div>
                )}
              </div>

              {/* Desktop Local Folder Sync */}
              <div style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{activeConn.providerName} Desktop Sync Folder</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>Copy database snapshots and receipt attachments to your local cloud sync directory.</p>
                  </div>
                  <button type="button" className="btn btn-settings" onClick={handleLinkFolder} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>Link Directory</button>
                </div>
                {settings[`${activeTab}BackupPath`] && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Folder path: <code style={{ color: 'var(--text-primary)' }}>{settings[`${activeTab}BackupPath`]}</code>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <input 
                        type="checkbox" 
                        checked={!!settings[`${activeTab}BackupEnabled`]} 
                        onChange={handleToggleAutoSync} 
                        style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                      />
                      Enable Auto-Sync
                    </label>
                  </div>
                )}
                <button type="button" className="btn btn-secondary" onClick={handleSyncFolderNow} style={{ fontSize: '0.8rem', padding: '10px', marginTop: '4px', width: '100%' }}>
                  🔄 Sync Folder Now
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 24px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {activeConn.brandIcon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeConn.providerName}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
                  Not connected
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleOpenAuthModal}
                style={{ padding: '12px 28px', fontSize: '0.92rem', fontWeight: 600 }}
              >
                Connect {activeConn.providerName}
              </button>
            </div>
          )}

          {/* Local File Export / Import - Always Available without linking any accounts */}
          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '4px' }}>
            <div style={{ flexGrow: 1, flexBasis: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>🔒 Save File to Computer</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                Encrypts and exports an offline `.enc` backup file to your hard drive.
              </p>
              <button className="btn btn-secondary" onClick={handleBackupWorkflow} disabled={isWorkflowActive} style={{ marginTop: 'auto' }}>
                Save Backup File
              </button>
            </div>

            <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

            <div style={{ flexGrow: 1, flexBasis: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>📂 Restore from File</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.4 }}>
                Browse and select a previously exported `.enc` file to restore ledger data.
              </p>
              <button className="btn btn-secondary" onClick={handleRestoreWorkflow} disabled={isWorkflowActive} style={{ marginTop: 'auto' }}>
                Restore Backup File
              </button>
            </div>
          </div>

          {/* Workflow Animation */}
          {isWorkflowActive && (
            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary-color)', width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block' }}></span>
                {workflowType === 'backup' ? 'Creating Backup File' : 'Restoring Database'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: workflowStep >= 1 ? 1 : 0.4 }}>
                  <span>{workflowStep > 1 ? '✓' : '⏳'}</span>
                  <span>Extracting database ledger...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: workflowStep >= 2 ? 1 : 0.4 }}>
                  <span>{workflowStep > 2 ? '✓' : '⏳'}</span>
                  <span>Encrypting data bytes...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: workflowStep >= 3 ? 1 : 0.4 }}>
                  <span>{workflowStep > 3 ? '✓' : '⏳'}</span>
                  <span>Generating `.enc` file...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: workflowStep >= 4 ? 1 : 0.4 }}>
                  <span>{workflowStep >= 4 ? '✓' : '⏳'}</span>
                  <span>Complete!</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Info Sidebar */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Security Guarantee</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: '10px', color: '#6ee7b7' }}>
              <strong>🔒 Client-Side Encryption</strong><br />
              All MoneyMate backups are encrypted locally on your device before they are sent to the cloud.
            </div>
            <div>
              <strong>📁 Dedicated App Folder</strong><br />
              All backups are organized neatly in a dedicated <strong>MoneyMate Backups</strong> folder in your cloud drive.
            </div>
            <div>
              <strong>🛡️ Zero Password Sharing</strong><br />
              MoneyMate never sees or stores your cloud provider password. Authentication takes place entirely inside your web browser.
            </div>
            <div>
              <strong>📂 Isolated Backups</strong><br />
              MoneyMate only creates and accesses its own encrypted backup files, leaving the rest of your cloud drive untouched.
            </div>
          </div>
        </div>
      </div>

      {/* Simplified, Consumer-Friendly Connect Modal */}
      <Modal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          if (!isAuthenticating) setIsAuthModalOpen(false);
        }} 
        title={`Connect ${activeConn.providerName}`}
      >
        <div style={{ padding: '6px 0' }}>
          {!isAuthenticating ? (
            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '14px' }}>
                MoneyMate will open your browser to securely connect your <strong>{activeConn.providerName}</strong> account.
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                  <span>Your MoneyMate backup files are encrypted before they are uploaded.</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                  <span>Uploads to a dedicated "MoneyMate Backups" folder.</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                  <span>No password is ever shared with MoneyMate.</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                  <span>Keep your connection active for automatic backups.</span>
                </div>
              </div>

              {authErrorMessage && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px', padding: '10px 14px', color: '#f43f5e', fontSize: '0.82rem', marginBottom: '16px' }}>
                  {authErrorMessage}
                </div>
              )}

              <div className="modal-footer" style={{ borderTop: 'none', padding: '0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAuthModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleStartOAuth}>
                  Connect {activeConn.providerName}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <span className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #6366f1', width: '40px', height: '40px', borderRadius: '50%', display: 'inline-block', marginBottom: '16px' }}></span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
                Connecting to {activeConn.providerName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 16px' }}>
                {authStatusMessage || 'Please select your account and click Allow in the browser window.'}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You can return to MoneyMate once the browser confirmation appears.
              </div>
            </div>
          )}
        </div>
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
