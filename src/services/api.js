// React IPC Service bridge wrappers
export const api = {
  loadData: async () => {
    return await window.api.loadData();
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
  savePayslip: async (filePath) => {
    return await window.api.savePayslip(filePath);
  },
  openFile: async (filePath) => {
    return await window.api.openFile(filePath);
  },
  selectFile: async () => {
    return await window.api.selectFile();
  }
};
