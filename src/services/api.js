// React IPC Service bridge wrappers
export const api = {
  loadData: async () => {
    return await window.api.loadData();
  },
  unlockData: async (pinOrPassword) => {
    return await window.api.unlockData(pinOrPassword);
  },
  saveData: async (data) => {
    return await window.api.saveData(data);
  },
  exportBackup: async () => {
    return await window.api.exportBackup();
  },
  importBackup: async () => {
    return await window.api.importBackup();
  },
  savePayslip: async (filePath, month, year) => {
    return await window.api.savePayslip(filePath, month, year);
  },
  openFile: async (filePath) => {
    return await window.api.openFile(filePath);
  },
  selectFile: async () => {
    return await window.api.selectFile();
  },
  selectFolder: async () => {
    return await window.api.selectFolder();
  },
  syncGDrive: async () => {
    return await window.api.syncGDrive();
  },
  syncCloudFolder: async (backupPath) => {
    return await window.api.syncCloudFolder(backupPath);
  },
  writeEncryptedFile: async (content, defaultName) => {
    return await window.api.writeEncryptedFile(content, defaultName);
  },
  readEncryptedFile: async () => {
    return await window.api.readEncryptedFile();
  },
  checkLicense: async () => {
    return await window.api.checkLicense();
  },
  purchaseMicrosoftStore: async () => {
    return await window.api.purchaseMicrosoftStore();
  },
  activateLicenseKey: async (key) => {
    return await window.api.activateLicenseKey(key);
  },
  deactivateLicense: async () => {
    return await window.api.deactivateLicense();
  },
  toggleDevOverride: async (enabled) => {
    return await window.api.toggleDevOverride(enabled);
  }
};
