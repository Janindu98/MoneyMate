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
    icon: path.join(__dirname, '..', '..', 'images', 'logo.png'),
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
    const success = db.setData(newData);
    if (success) {
      try {
        const settings = newData?.settings;
        // GDrive backup
        if (settings?.gdriveBackupEnabled && settings?.gdriveBackupPath && fs.existsSync(settings.gdriveBackupPath)) {
          const targetBackupFile = path.join(settings.gdriveBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(newData, null, 2), 'utf8');
        }
        // OneDrive backup
        if (settings?.onedriveBackupEnabled && settings?.onedriveBackupPath && fs.existsSync(settings.onedriveBackupPath)) {
          const targetBackupFile = path.join(settings.onedriveBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(newData, null, 2), 'utf8');
        }
        // Dropbox backup
        if (settings?.dropboxBackupEnabled && settings?.dropboxBackupPath && fs.existsSync(settings.dropboxBackupPath)) {
          const targetBackupFile = path.join(settings.dropboxBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(newData, null, 2), 'utf8');
        }
      } catch (backupErr) {
        console.error('Failed to auto-backup database to cloud folders:', backupErr);
      }
    }
    return success;
  });

  ipcMain.handle('db:export-backup', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const documentsDir = app.getPath('documents');
    const appDir = path.join(documentsDir, 'MoneyMate');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    const result = await dialog.showSaveDialog(activeWindow, {
      title: 'Backup Personal Finance Database',
      defaultPath: path.join(appDir, 'personal_finance_backup.json'),
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
  ipcMain.handle('db:save-payslip', async (event, sourcePath, month, year) => {
    try {
      const documentsDir = app.getPath('documents');
      const appDir = path.join(documentsDir, 'MoneyMate');
      const payslipsDir = path.join(appDir, 'payslips');
      if (!fs.existsSync(payslipsDir)) {
        fs.mkdirSync(payslipsDir, { recursive: true });
      }

      const fileExt = path.extname(sourcePath) || '.pdf';
      const fileName = `payslip_${month || 'archive'}_${year || Date.now()}${fileExt}`;
      const targetPath = path.join(payslipsDir, fileName);

      fs.copyFileSync(sourcePath, targetPath);

      // Check and copy to all enabled cloud folders
      try {
        const appData = db.getData();
        const settings = appData?.settings;
        const cloudPaths = [];

        if (settings?.gdriveBackupEnabled && settings?.gdriveBackupPath && fs.existsSync(settings.gdriveBackupPath)) {
          cloudPaths.push(settings.gdriveBackupPath);
        }
        if (settings?.onedriveBackupEnabled && settings?.onedriveBackupPath && fs.existsSync(settings.onedriveBackupPath)) {
          cloudPaths.push(settings.onedriveBackupPath);
        }
        if (settings?.dropboxBackupEnabled && settings?.dropboxBackupPath && fs.existsSync(settings.dropboxBackupPath)) {
          cloudPaths.push(settings.dropboxBackupPath);
        }

        cloudPaths.forEach(p => {
          const cloudPayslipsDir = path.join(p, 'payslips');
          if (!fs.existsSync(cloudPayslipsDir)) {
            fs.mkdirSync(cloudPayslipsDir, { recursive: true });
          }
          const cloudTargetPath = path.join(cloudPayslipsDir, fileName);
          fs.copyFileSync(sourcePath, cloudTargetPath);
        });
      } catch (backupErr) {
        console.error('Failed to auto-backup payslip to cloud folders:', backupErr);
      }

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

  ipcMain.handle('dialog:select-folder', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(activeWindow, {
      title: 'Select Google Drive Backup Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { canceled: false, folderPath: result.filePaths[0] };
    }
    return { canceled: true };
  });

  ipcMain.handle('db:sync-gdrive', async () => {
    try {
      const appData = db.getData();
      const backupPath = appData?.settings?.gdriveBackupPath;

      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Google Drive backup path does not exist. Please configure it in Settings first.');
      }

      // Copy database JSON
      const targetBackupFile = path.join(backupPath, 'personal_finance_backup.json');
      fs.writeFileSync(targetBackupFile, JSON.stringify(appData, null, 2), 'utf8');

      // Copy all existing payslips from local payslips dir
      const documentsDir = app.getPath('documents');
      const appDir = path.join(documentsDir, 'MoneyMate');
      const localPayslipsDir = path.join(appDir, 'payslips');

      if (fs.existsSync(localPayslipsDir)) {
        const files = fs.readdirSync(localPayslipsDir);
        const gdrivePayslipsDir = path.join(backupPath, 'payslips');
        if (!fs.existsSync(gdrivePayslipsDir)) {
          fs.mkdirSync(gdrivePayslipsDir, { recursive: true });
        }

        for (const file of files) {
          const sourceFile = path.join(localPayslipsDir, file);
          const targetFile = path.join(gdrivePayslipsDir, file);
          fs.copyFileSync(sourceFile, targetFile);
        }
      }

      return { success: true };
    } catch (e) {
      console.error('Failed to sync to GDrive folder:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('db:sync-cloud-folder', async (event, backupPath) => {
    try {
      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Cloud backup path does not exist. Please check configuration.');
      }

      // Copy database JSON
      const appData = db.getData();
      const targetBackupFile = path.join(backupPath, 'personal_finance_backup.json');
      fs.writeFileSync(targetBackupFile, JSON.stringify(appData, null, 2), 'utf8');

      // Copy all existing payslips from local payslips dir
      const documentsDir = app.getPath('documents');
      const appDir = path.join(documentsDir, 'MoneyMate');
      const localPayslipsDir = path.join(appDir, 'payslips');

      if (fs.existsSync(localPayslipsDir)) {
        const files = fs.readdirSync(localPayslipsDir);
        const cloudPayslipsDir = path.join(backupPath, 'payslips');
        if (!fs.existsSync(cloudPayslipsDir)) {
          fs.mkdirSync(cloudPayslipsDir, { recursive: true });
        }

        for (const file of files) {
          const sourceFile = path.join(localPayslipsDir, file);
          const targetFile = path.join(cloudPayslipsDir, file);
          if (!fs.existsSync(targetFile)) {
            fs.copyFileSync(sourceFile, targetFile);
          }
        }
      }

      return { success: true };
    } catch (e) {
      console.error('Failed to sync to cloud folder:', e);
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

  ipcMain.handle('db:write-encrypted-file', async (event, content, defaultName) => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const documentsDir = app.getPath('documents');
    const appDir = path.join(documentsDir, 'MoneyMate');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    const result = await dialog.showSaveDialog(activeWindow, {
      title: 'Export Encrypted Cloud Backup',
      defaultPath: path.join(appDir, defaultName || 'moneymate_secure_backup.enc'),
      filters: [{ name: 'Encrypted Backups', extensions: ['enc'] }]
    });
    if (!result.canceled && result.filePath) {
      try {
        fs.writeFileSync(result.filePath, content, 'utf8');
        return { success: true, filePath: result.filePath };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, canceled: true };
  });

  ipcMain.handle('db:read-encrypted-file', async (event) => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(activeWindow, {
      title: 'Restore Encrypted Backup',
      filters: [{ name: 'Encrypted Backups', extensions: ['enc'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const content = fs.readFileSync(result.filePaths[0], 'utf8');
        return { success: true, content };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: false, canceled: true };
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
