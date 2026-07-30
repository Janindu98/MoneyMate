import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('db:load'),
  saveData: (data) => ipcRenderer.invoke('db:save', data),
  exportBackup: () => ipcRenderer.invoke('db:export-backup'),
  importBackup: () => ipcRenderer.invoke('db:import-backup'),
  savePayslip: (filePath, month, year) => ipcRenderer.invoke('db:save-payslip', filePath, month, year),
  openFile: (filePath) => ipcRenderer.invoke('db:open-file', filePath),
  selectFile: () => ipcRenderer.invoke('dialog:select-file'),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  syncGDrive: () => ipcRenderer.invoke('db:sync-gdrive')
});
