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
  selectImage: async () => {
    return await window.api.selectImage();
  },
  selectFolder: async () => {
    return await window.api.selectFolder();
  },
  saveTransactionImage: async (filePath) => {
    return await window.api.saveTransactionImage(filePath);
  },
  readImageBase64: async (filePath) => {
    return await window.api.readImageBase64(filePath);
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
  deactivateLicense: async () => {
    return await window.api.deactivateLicense();
  },
  toggleDevOverride: async (enabled) => {
    return await window.api.toggleDevOverride(enabled);
  },
  startOAuth: async (providerKey) => {
    return await window.api.startOAuth(providerKey);
  },
  cancelOAuth: async () => {
    return await window.api.cancelOAuth();
  },
  verifyOAuthToken: async (providerKey) => {
    return await window.api.verifyOAuthToken(providerKey);
  },
  disconnectOAuth: async (providerKey) => {
    return await window.api.disconnectOAuth(providerKey);
  },
  directCloudUpload: async (providerKey, encryptedPayload, defaultName) => {
    return await window.api.directCloudUpload(providerKey, encryptedPayload, defaultName);
  },
  listCloudBackups: async (providerKey) => {
    return await window.api.listCloudBackups(providerKey);
  },
  downloadCloudBackup: async (providerKey, fileId) => {
    return await window.api.downloadCloudBackup(providerKey, fileId);
  },
  onAuthProgress: (callback) => {
    return window.api.onAuthProgress(callback);
  }
};
