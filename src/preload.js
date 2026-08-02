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
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  syncGDrive: () => ipcRenderer.invoke('db:sync-gdrive'),
  syncCloudFolder: (backupPath) => ipcRenderer.invoke('db:sync-cloud-folder', backupPath),
  writeEncryptedFile: (content, defaultName) => ipcRenderer.invoke('db:write-encrypted-file', content, defaultName),
  readEncryptedFile: () => ipcRenderer.invoke('db:read-encrypted-file')
});
