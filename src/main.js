import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import Database from './database/db.js';
import { execFile } from 'node:child_process';
import util from 'node:util';
import {
  startOAuthFlow,
  cancelOAuthFlow,
  refreshAccessToken,
  verifyAccountIdentity,
  testStorageAccess,
  uploadToGoogleDrive,
  listGoogleDriveBackups,
  downloadGoogleDriveBackup,
  uploadToOneDrive,
  listOneDriveBackups,
  downloadOneDriveBackup,
  uploadToDropbox,
  listDropboxBackups,
  downloadDropboxBackup,
  encryptToken,
  decryptToken,
  CloudAuthManager
} from './main/oauthService.js';

const execFileAsync = util.promisify(execFile);

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
    title: "MoneyMate Vault - Expense Tracker",
    icon: path.join(__dirname, '..', '..', 'images', 'logo_2.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // mainWindow.webContents.openDevTools();
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

function encryptDataLocal(data, key = "moneymate_key") {
  const json = JSON.stringify(data);
  let encrypted = "";
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return Buffer.from(encrypted, 'utf8').toString('base64');
}

function runAutomatedGDriveBackup(appData) {
  try {
    if (!appData) return;

    const settings = appData.settings;
    const gdrivePath = settings?.gdriveBackupPath;

    // The option must execute ONLY if the user has provided the Google Drive Sync Folder.
    if (!gdrivePath || !fs.existsSync(gdrivePath)) {
      console.log('[Automated Backup] Google Drive Sync Folder is not provided or does not exist. Skipping backup.');
      return;
    }

    console.log(`[Automated Backup] Checking Google Drive folder at: ${gdrivePath}`);

    // If backup file already exists in the location, delete it
    const files = fs.readdirSync(gdrivePath);
    const backupPattern = /^moneymate_vault_backup_gdrive.*\.enc$/i;

    for (const file of files) {
      if (backupPattern.test(file)) {
        const filePath = path.join(gdrivePath, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`[Automated Backup] Deleted existing backup file: ${file}`);
        } catch (unlinkErr) {
          console.error(`[Automated Backup] Failed to delete existing backup file ${file}:`, unlinkErr);
        }
      }
    }

    // Build the payload (as done in Backup.jsx)
    const appDataPayload = {
      accounts: appData.accounts || [],
      transactions: appData.transactions || [],
      categories: appData.categories || {},
      salaryHistory: appData.salaryHistory || [],
      settings: appData.settings || {},
      profile: appData.profile || {}
    };

    const encryptedString = encryptDataLocal(appDataPayload);

    // Write actual encrypted file, replace and rename it
    const currentDateStr = new Date().toISOString().split('T')[0];
    const finalFileName = `moneymate_vault_backup_gdrive_${currentDateStr}.enc`;
    const finalFilePath = path.join(gdrivePath, finalFileName);
    const tempFilePath = path.join(gdrivePath, 'moneymate_vault_backup_gdrive.tmp');

    // Create temp file first, then rename it to final file name
    fs.writeFileSync(tempFilePath, encryptedString, 'utf8');
    fs.renameSync(tempFilePath, finalFilePath);

    console.log(`[Automated Backup] Backup successfully saved and renamed to: ${finalFileName}`);
  } catch (err) {
    console.error('[Automated Backup] Failed to execute automated Google Drive backup:', err);
  }
}

app.whenReady().then(() => {
  // Initialize Database in the userData directory
  const dbPath = path.join(app.getPath('userData'), 'personal_finance_db.json');
  db = new Database(dbPath);
  const loadedData = db.load();
  if (loadedData && !loadedData.encrypted) {
    runAutomatedGDriveBackup(loadedData);
  }

  // Setup IPC Handlers
  ipcMain.handle('db:load', () => {
    return db.load();
  });

  ipcMain.handle('db:unlock', (event, pinOrPassword) => {
    const success = db.unlock(pinOrPassword);
    if (success) {
      const data = db.getData();
      runAutomatedGDriveBackup(data);
      return { success: true, data };
    } else {
      return { success: false, error: 'Incorrect PIN or Password.' };
    }
  });

  ipcMain.handle('db:save', (event, newData) => {
    const currentData = db.getData() || {};
    const currentSettings = currentData.settings || {};

    // Protect encrypted OAuth credentials from being erased during renderer state updates
    const tokenKeys = [
      'gdriveEncryptedAccessToken', 'gdriveEncryptedRefreshToken', 'gdriveTokenExpiresAt',
      'onedriveEncryptedAccessToken', 'onedriveEncryptedRefreshToken', 'onedriveTokenExpiresAt',
      'dropboxEncryptedAccessToken', 'dropboxEncryptedRefreshToken', 'dropboxTokenExpiresAt'
    ];

    const safeSettings = { ...(newData?.settings || {}) };
    for (const key of tokenKeys) {
      if (currentSettings[key] && !safeSettings[key]) {
        safeSettings[key] = currentSettings[key];
      }
    }

    const mergedData = {
      ...newData,
      settings: safeSettings
    };

    const success = db.setData(mergedData);
    if (success) {
      try {
        const settings = safeSettings;
        // GDrive backup
        if (settings?.gdriveBackupEnabled && settings?.gdriveBackupPath && fs.existsSync(settings.gdriveBackupPath)) {
          const targetBackupFile = path.join(settings.gdriveBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(mergedData, null, 2), 'utf8');
        }
        // OneDrive backup
        if (settings?.onedriveBackupEnabled && settings?.onedriveBackupPath && fs.existsSync(settings.onedriveBackupPath)) {
          const targetBackupFile = path.join(settings.onedriveBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(mergedData, null, 2), 'utf8');
        }
        // Dropbox backup
        if (settings?.dropboxBackupEnabled && settings?.dropboxBackupPath && fs.existsSync(settings.dropboxBackupPath)) {
          const targetBackupFile = path.join(settings.dropboxBackupPath, 'personal_finance_backup.json');
          fs.writeFileSync(targetBackupFile, JSON.stringify(mergedData, null, 2), 'utf8');
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

      // Copy all existing transaction images from local transaction_images dir
      const localTxImagesDir = path.join(appDir, 'transaction_images');
      if (fs.existsSync(localTxImagesDir)) {
        const files = fs.readdirSync(localTxImagesDir);
        const gdriveTxImagesDir = path.join(backupPath, 'transaction_images');
        if (!fs.existsSync(gdriveTxImagesDir)) {
          fs.mkdirSync(gdriveTxImagesDir, { recursive: true });
        }

        for (const file of files) {
          const sourceFile = path.join(localTxImagesDir, file);
          const targetFile = path.join(gdriveTxImagesDir, file);
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

      // Copy all existing transaction images from local transaction_images dir
      const localTxImagesDir = path.join(appDir, 'transaction_images');
      if (fs.existsSync(localTxImagesDir)) {
        const files = fs.readdirSync(localTxImagesDir);
        const cloudTxImagesDir = path.join(backupPath, 'transaction_images');
        if (!fs.existsSync(cloudTxImagesDir)) {
          fs.mkdirSync(cloudTxImagesDir, { recursive: true });
        }

        for (const file of files) {
          const sourceFile = path.join(localTxImagesDir, file);
          const targetFile = path.join(cloudTxImagesDir, file);
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

  ipcMain.handle('dialog:select-image', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(activeWindow, {
      title: 'Select Transaction Image (PNG, JPG, JPEG)',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return { canceled: false, filePath: result.filePaths[0] };
    }
    return { canceled: true };
  });

  ipcMain.handle('db:save-transaction-image', async (event, sourcePath) => {
    try {
      const documentsDir = app.getPath('documents');
      const appDir = path.join(documentsDir, 'MoneyMate');
      const txImagesDir = path.join(appDir, 'transaction_images');
      if (!fs.existsSync(txImagesDir)) {
        fs.mkdirSync(txImagesDir, { recursive: true });
      }

      const fileExt = path.extname(sourcePath) || '.png';
      const fileName = `tx_image_${Date.now()}_${Math.random().toString(36).substr(2, 5)}${fileExt}`;
      const targetPath = path.join(txImagesDir, fileName);

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
          const cloudTxImagesDir = path.join(p, 'transaction_images');
          if (!fs.existsSync(cloudTxImagesDir)) {
            fs.mkdirSync(cloudTxImagesDir, { recursive: true });
          }
          const cloudTargetPath = path.join(cloudTxImagesDir, fileName);
          fs.copyFileSync(sourcePath, cloudTargetPath);
        });
      } catch (backupErr) {
        console.error('Failed to auto-backup transaction image to cloud folders:', backupErr);
      }

      return { success: true, filePath: targetPath };
    } catch (e) {
      console.error('Failed to copy transaction image:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('db:read-image-base64', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.svg') mimeType = 'image/svg+xml';
        else if (ext === '.webp') mimeType = 'image/webp';

        const base64 = fileBuffer.toString('base64');
        return { success: true, base64: `data:${mimeType};base64,${base64}` };
      } else {
        throw new Error(`File not found: ${filePath}`);
      }
    } catch (e) {
      console.error('Failed to read image file:', e);
      return { success: false, error: e.message };
    }
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

  async function runStoreHelper(action, hwndStr = '0') {
    const isPackaged = app.isPackaged;
    const baseDir = isPackaged ? process.resourcesPath : app.getAppPath();
    const helperPath = path.join(baseDir, 'build-native', 'StoreHelper.exe');

    if (!fs.existsSync(helperPath)) {
      console.warn('StoreHelper.exe not found at:', helperPath);
      return { isPro: false, success: false, error: 'StoreHelper binary not found.' };
    }

    try {
      const { stdout } = await execFileAsync(helperPath, [action, hwndStr]);
      return JSON.parse(stdout.trim());
    } catch (err) {
      console.error('Error running StoreHelper:', err);
      return { isPro: false, success: false, error: err.message };
    }
  }

  ipcMain.handle('license:check', async () => {
    const data = db.getData() || {};
    const license = data.license || { status: 'free', type: 'none', purchaseToken: '', isProDevOverride: false };

    // Dev Mode Override for local UI & feature development
    if (license.isProDevOverride) {
      return { status: 'pro', type: 'dev_override', isPro: true, license };
    }

    // Query Microsoft Store Entitlement via native StoreHelper (StoreContext -> StoreAppLicense -> AddOnLicenses)
    const storeRes = await runStoreHelper('check');

    // Case 1: Microsoft Store confirms Pro durable add-on entitlement
    if (storeRes && storeRes.isPro) {
      if (license.status !== 'pro' || license.type !== 'microsoft_store') {
        data.license = {
          status: 'pro',
          type: 'microsoft_store',
          purchaseToken: 'microsoft_store_verified',
          addOnId: storeRes.activeAddOnId || '',
          lastVerified: Date.now(),
          isProDevOverride: data.license?.isProDevOverride || false
        };
        db.setData(data);
        return { status: 'pro', type: 'microsoft_store', isPro: true, license: data.license };
      }
      return { status: 'pro', type: 'microsoft_store', isPro: true, license };
    }

    // Case 2: Store check ran successfully with Store package identity, and Store explicitly states no active Pro add-on
    if (storeRes && storeRes.hasStoreContext && !storeRes.isPro) {
      if (license.status === 'pro' && license.type === 'microsoft_store') {
        data.license = {
          status: 'free',
          type: 'none',
          purchaseToken: '',
          lastVerified: Date.now(),
          isProDevOverride: data.license?.isProDevOverride || false
        };
        db.setData(data);
        return { status: 'free', type: 'none', isPro: false, license: data.license };
      }
      return { status: 'free', type: 'none', isPro: false, license };
    }

    // Case 3: Offline / Network failure / Unpackaged dev environment (no Store response or error)
    // Maintain the cached / last-known Store entitlement so offline users retain Pro capabilities
    if (license.status === 'pro' && license.type === 'microsoft_store') {
      return { status: 'pro', type: 'microsoft_store', isPro: true, offlineCached: true, license };
    }

    // Default fallback: Free tier
    return { status: 'free', type: 'none', isPro: false, license };
  });

  ipcMain.handle('license:buy-microsoft', async () => {
    const activeWindow = BrowserWindow.getFocusedWindow();
    let hwndStr = '0';
    if (activeWindow) {
      const hwndBuffer = activeWindow.getNativeWindowHandle();
      hwndStr = process.arch === 'x64' ? hwndBuffer.readBigInt64LE().toString() : hwndBuffer.readInt32LE().toString();
    }

    // Run the native purchase flow in the C# helper
    const storeRes = await runStoreHelper('purchase', hwndStr);

    if (storeRes && storeRes.success) {
      const data = db.getData() || {};
      data.license = {
        status: 'pro',
        type: 'microsoft_store',
        purchaseToken: 'microsoft_store_verified',
        addOnId: storeRes.activeAddOnId || '',
        lastVerified: Date.now(),
        isProDevOverride: data.license?.isProDevOverride || false
      };
      db.setData(data);
      return { success: true, isPro: true, license: data.license };
    } else {
      return { success: false, error: storeRes?.error || 'Purchase declined or cancelled.' };
    }
  });

  ipcMain.handle('license:deactivate', () => {
    const data = db.getData() || {};
    data.license = {
      status: 'free',
      type: 'none',
      purchaseToken: '',
      lastVerified: Date.now(),
      isProDevOverride: data.license?.isProDevOverride || false
    };
    db.setData(data);
    return { success: true, license: data.license };
  });

  ipcMain.handle('license:toggle-dev-override', (event, enabled) => {
    const data = db.getData();
    data.license = {
      ...data.license,
      isProDevOverride: enabled
    };
    db.setData(data);
    return { success: true, license: data.license };
  });

  // 1-Click OAuth 2.0 PKCE Handlers
  ipcMain.handle('auth:start-oauth', async (event, providerKey) => {
    try {
      const activeWindow = BrowserWindow.getFocusedWindow();
      const result = await startOAuthFlow(providerKey, (progress) => {
        if (activeWindow && !activeWindow.isDestroyed()) {
          activeWindow.webContents.send('auth:progress', progress);
        }
      });

      const appData = db.getData() || {};
      const currentSettings = appData.settings || {};
      
      // Preserve existing refresh token if provider did not send a new one in this handshake
      const existingRefreshToken = currentSettings[`${providerKey}EncryptedRefreshToken`];
      const finalRefreshToken = result.encryptedRefreshToken || existingRefreshToken || '';

      const updatedSettings = {
        ...currentSettings,
        [`${providerKey}Connected`]: true,
        [`${providerKey}Email`]: result.email,
        [`${providerKey}Name`]: result.name,
        [`${providerKey}Picture`]: result.picture,
        [`${providerKey}StorageQuota`]: result.storageQuota,
        [`${providerKey}LastVerified`]: result.lastVerified,
        [`${providerKey}EncryptedAccessToken`]: result.encryptedAccessToken,
        [`${providerKey}EncryptedRefreshToken`]: finalRefreshToken,
        [`${providerKey}TokenExpiresAt`]: result.tokenExpiresAt
      };

      db.setData({ ...appData, settings: updatedSettings });

      return { success: true, ...result };
    } catch (err) {
      console.error(`[OAuth] Authentication error for ${providerKey}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:cancel-oauth', () => {
    return cancelOAuthFlow();
  });

  ipcMain.handle('auth:verify-token', async (event, providerKey) => {
    try {
      const appData = db.getData() || {};
      const currentSettings = appData.settings || {};

      // Get valid access token with automatic silent refresh
      const accessToken = await CloudAuthManager.getValidAccessToken(providerKey, currentSettings, (newTokens) => {
        const liveData = db.getData() || {};
        db.setData({
          ...liveData,
          settings: { ...(liveData.settings || {}), ...newTokens }
        });
      });

      const identity = await verifyAccountIdentity(providerKey, accessToken);
      const storageQuota = await testStorageAccess(providerKey, accessToken);
      const lastVerified = new Date().toISOString();

      const liveData = db.getData() || {};
      const liveSettings = liveData.settings || {};
      const updatedSettings = {
        ...liveSettings,
        [`${providerKey}Email`]: identity.email,
        [`${providerKey}Name`]: identity.name,
        [`${providerKey}Picture`]: identity.picture,
        [`${providerKey}StorageQuota`]: storageQuota,
        [`${providerKey}LastVerified`]: lastVerified
      };

      db.setData({ ...liveData, settings: updatedSettings });

      return {
        success: true,
        email: identity.email,
        name: identity.name,
        picture: identity.picture,
        storageQuota,
        lastVerified
      };
    } catch (err) {
      console.error(`[OAuth] Verification error for ${providerKey}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:disconnect', async (event, providerKey) => {
    try {
      const appData = db.getData() || {};
      const settings = appData.settings || {};

      settings[`${providerKey}Connected`] = false;
      settings[`${providerKey}Email`] = '';
      settings[`${providerKey}Name`] = '';
      settings[`${providerKey}Picture`] = '';
      settings[`${providerKey}StorageQuota`] = null;
      settings[`${providerKey}LastVerified`] = null;
      settings[`${providerKey}EncryptedAccessToken`] = '';
      settings[`${providerKey}EncryptedRefreshToken`] = '';
      settings[`${providerKey}TokenExpiresAt`] = null;
      settings[`${providerKey}BackupEnabled`] = false;

      db.setData({ ...appData, settings });

      return { success: true };
    } catch (err) {
      console.error(`[OAuth] Disconnect error for ${providerKey}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('cloud:direct-upload', async (event, providerKey, encryptedPayload, defaultName) => {
    try {
      const appData = db.getData() || {};
      const currentSettings = appData.settings || {};

      // Get valid access token with automatic silent refresh
      const accessToken = await CloudAuthManager.getValidAccessToken(providerKey, currentSettings, (newTokens) => {
        const liveData = db.getData() || {};
        db.setData({
          ...liveData,
          settings: { ...(liveData.settings || {}), ...newTokens }
        });
      });

      const fileName = defaultName || `moneymate_vault_backup_${providerKey}_${new Date().toISOString().split('T')[0]}.enc`;

      let uploadResult;
      if (providerKey === 'gdrive') {
        uploadResult = await uploadToGoogleDrive(accessToken, encryptedPayload, fileName);
      } else if (providerKey === 'onedrive') {
        uploadResult = await uploadToOneDrive(accessToken, encryptedPayload, fileName);
      } else if (providerKey === 'dropbox') {
        uploadResult = await uploadToDropbox(accessToken, encryptedPayload, fileName);
      } else {
        throw new Error(`Unsupported provider: ${providerKey}`);
      }

      const liveData = db.getData() || {};
      const liveSettings = liveData.settings || {};
      liveSettings[`${providerKey}LastBackupTime`] = new Date().toISOString();
      db.setData({ ...liveData, settings: liveSettings });

      return { success: true, ...uploadResult };
    } catch (err) {
      console.error(`[Cloud Upload] Upload error for ${providerKey}:`, err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('cloud:list-backups', async (event, providerKey) => {
    try {
      const appData = db.getData() || {};
      const currentSettings = appData.settings || {};

      const accessToken = await CloudAuthManager.getValidAccessToken(providerKey, currentSettings, (newTokens) => {
        const liveData = db.getData() || {};
        db.setData({
          ...liveData,
          settings: { ...(liveData.settings || {}), ...newTokens }
        });
      });

      let files = [];
      if (providerKey === 'gdrive') {
        files = await listGoogleDriveBackups(accessToken);
      } else if (providerKey === 'onedrive') {
        files = await listOneDriveBackups(accessToken);
      } else if (providerKey === 'dropbox') {
        files = await listDropboxBackups(accessToken);
      }

      return { success: true, files };
    } catch (err) {
      console.error(`[Cloud List] Error listing backups for ${providerKey}:`, err);
      return { success: false, error: err.message, files: [] };
    }
  });

  ipcMain.handle('cloud:download-backup', async (event, providerKey, fileId) => {
    try {
      const appData = db.getData() || {};
      const currentSettings = appData.settings || {};

      const accessToken = await CloudAuthManager.getValidAccessToken(providerKey, currentSettings, (newTokens) => {
        const liveData = db.getData() || {};
        db.setData({
          ...liveData,
          settings: { ...(liveData.settings || {}), ...newTokens }
        });
      });

      let content;
      if (providerKey === 'gdrive') {
        content = await downloadGoogleDriveBackup(accessToken, fileId);
      } else if (providerKey === 'onedrive') {
        content = await downloadOneDriveBackup(accessToken, fileId);
      } else if (providerKey === 'dropbox') {
        content = await downloadDropboxBackup(accessToken, fileId);
      } else {
        throw new Error(`Unsupported provider: ${providerKey}`);
      }

      return { success: true, content };
    } catch (err) {
      console.error(`[Cloud Download] Error downloading backup for ${providerKey}:`, err);
      return { success: false, error: err.message };
    }
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
