import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('db:load'),
  unlockData: (pinOrPassword) => ipcRenderer.invoke('db:unlock', pinOrPassword),
  saveData: (data) => ipcRenderer.invoke('db:save', data),
  exportBackup: () => ipcRenderer.invoke('db:export-backup'),
  importBackup: () => ipcRenderer.invoke('db:import-backup'),
  savePayslip: (filePath, month, year) => ipcRenderer.invoke('db:save-payslip', filePath, month, year),
  openFile: (filePath) => ipcRenderer.invoke('db:open-file', filePath),
  selectFile: () => ipcRenderer.invoke('dialog:select-file'),
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  saveTransactionImage: (filePath) => ipcRenderer.invoke('db:save-transaction-image', filePath),
  readImageBase64: (filePath) => ipcRenderer.invoke('db:read-image-base64', filePath),
  syncGDrive: () => ipcRenderer.invoke('db:sync-gdrive'),
  syncCloudFolder: (backupPath) => ipcRenderer.invoke('db:sync-cloud-folder', backupPath),
  writeEncryptedFile: (content, defaultName) => ipcRenderer.invoke('db:write-encrypted-file', content, defaultName),
  readEncryptedFile: () => ipcRenderer.invoke('db:read-encrypted-file'),
  checkLicense: () => ipcRenderer.invoke('license:check'),
  purchaseMicrosoftStore: () => ipcRenderer.invoke('license:buy-microsoft'),
  activateLicenseKey: (key) => ipcRenderer.invoke('license:activate-key', key),
  deactivateLicense: () => ipcRenderer.invoke('license:deactivate'),
  toggleDevOverride: (enabled) => ipcRenderer.invoke('license:toggle-dev-override', enabled)
});
