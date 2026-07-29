import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import Database from './database/db.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let db;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: "MoneyMate",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove default menu to look like a clean modern app
  mainWindow.setMenu(null);
  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  // Initialize Database in the userData directory
  const dbPath = path.join(app.getPath('userData'), 'personal_finance_db.json');
  db = new Database(dbPath);
  db.load();

  // Setup IPC Handlers
  ipcMain.handle('db:load', () => {
    return db.load();
  });

  ipcMain.handle('db:save', (event, newData) => {
    return db.setData(newData);
  });

  ipcMain.handle('db:export-backup', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(activeWindow, {
      title: 'Backup Personal Finance Database',
      defaultPath: path.join(app.getPath('documents'), 'personal_finance_backup.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, JSON.stringify(db.getData(), null, 2), 'utf8');
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, canceled: true };
  });

  ipcMain.handle('db:import-backup', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(activeWindow, {
      title: 'Restore Database Backup',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const fileContent = fs.readFileSync(result.filePaths[0], 'utf8');
        const data = JSON.parse(fileContent);
        // Basic schema verification
        if (!data.accounts || !data.transactions) {
          throw new Error('Invalid database format. Missing required fields.');
        }
        db.setData(data);
        return { success: true, data };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, canceled: true };
  });

  // Local PDF / File attachments handlers
  ipcMain.handle('db:save-payslip', async (event, sourcePath) => {
    try {
      const payslipsDir = path.join(app.getPath('userData'), 'payslips');
      if (!fs.existsSync(payslipsDir)) {
        fs.mkdirSync(payslipsDir, { recursive: true });
      }

      const fileExt = path.extname(sourcePath) || '.pdf';
      const fileName = `payslip_${Date.now()}${fileExt}`;
      const targetPath = path.join(payslipsDir, fileName);

      fs.copyFileSync(sourcePath, targetPath);
      return { success: true, filePath: targetPath };
    } catch (e) {
      console.error('Failed to copy payslip file:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('db:open-file', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        await shell.openPath(filePath);
        return { success: true };
      } else {
        throw new Error(`File at location does not exist: ${filePath}`);
      }
    } catch (e) {
      console.error('Failed to open file path:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('dialog:select-file', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(activeWindow, {
      title: 'Select Payslip Document (PDF, Image)',
      filters: [{ name: 'Documents & Images', extensions: ['pdf', 'png', 'jpg', 'jpeg'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { canceled: false, filePath: result.filePaths[0] };
    }
    return { canceled: true };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
