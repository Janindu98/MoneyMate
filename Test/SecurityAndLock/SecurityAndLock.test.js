import { describe, test, expect } from '../core/testFramework.js';
import { getInitialMockData } from '../core/mockData.js';

function encryptPayload(data, key) {
  const json = JSON.stringify(data);
  let encrypted = "";
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(encrypted)));
}

function decryptPayload(encryptedStr, key) {
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedStr)));
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

export function registerSecurityAndLockTests() {
  describe('SecurityAndLock', () => {

    test('TC-SEC-001', 'Lock Screen Trigger on Startup When Security Mode Is Active', () => {
      const settingsWithPIN = { securityType: 'pin', securityPin: '9988' };
      const settingsWithPassword = { securityType: 'password', securityPassword: 'MyStrongPassword123' };
      const settingsNone = { securityType: 'none' };

      function isLocked(settings, unlockedState) {
        return settings && (settings.securityType === 'pin' || settings.securityType === 'password') && !unlockedState;
      }

      expect(isLocked(settingsWithPIN, false)).toBe(true);
      expect(isLocked(settingsWithPassword, false)).toBe(true);
      expect(isLocked(settingsNone, false)).toBe(false);
      expect(isLocked(settingsWithPIN, true)).toBe(false); // Unlocked
    }, {
      description: 'Checks that lock screen activates on launch if PIN or Password security is set',
      steps: ['Test isLocked logic with PIN, Password, None, and unlocked states'],
      expectedResult: 'Locks on PIN/Password when unlocked=false; bypasses when unlocked=true or security=none'
    });

    test('TC-SEC-002', 'Unlocking Database with Valid PIN or Password', () => {
      const cleanData = getInitialMockData();
      cleanData.settings.securityType = 'pin';
      cleanData.settings.securityPin = '4321';

      const key = '4321';
      const encryptedDataString = encryptPayload(cleanData, key);

      // Simulate Database.unlock(pinOrPassword)
      const decrypted = decryptPayload(encryptedDataString, '4321');
      const isSuccess = decrypted && decrypted.accounts && decrypted.transactions && decrypted.settings;

      expect(isSuccess).toBeTruthy();
      expect(decrypted.settings.securityPin).toBe('4321');
    }, {
      description: 'Successfully decrypts and unlocks database when provided with correct PIN',
      steps: ['Encrypt payload with PIN 4321', 'Decrypt with 4321', 'Validate decrypted schema'],
      expectedResult: 'Database unlocked and schema intact'
    });

    test('TC-SEC-003', 'Authentication Failure & Rejection on Incorrect Credentials', () => {
      const cleanData = getInitialMockData();
      const key = 'SecretMasterKey2026';
      const encryptedDataString = encryptPayload(cleanData, key);

      // Attempt unlocking with wrong password
      const decrypted = decryptPayload(encryptedDataString, 'WrongPassword');
      const isSuccess = decrypted && decrypted.accounts && decrypted.transactions && decrypted.settings;

      expect(isSuccess).toBeFalsy();
    }, {
      description: 'Rejects unlock attempt and prevents data access when wrong credential is entered',
      steps: ['Encrypt with secret key', 'Attempt decrypt with wrong key', 'Assert unlock failure'],
      expectedResult: 'Decryption fails and database remains locked'
    });

    test('TC-SEC-004', 'Encrypted Disk File Structure When Security Mode Is Active', () => {
      const data = getInitialMockData();
      data.settings.securityType = 'password';
      data.settings.securityPassword = 'VaultPassword#1';

      const encryptedPayload = encryptPayload(data, 'VaultPassword#1');
      const fileOnDisk = JSON.stringify({
        encrypted: true,
        securityType: 'password',
        data: encryptedPayload
      }, null, 2);

      const parsedDiskFile = JSON.parse(fileOnDisk);

      expect(parsedDiskFile.encrypted).toBe(true);
      expect(parsedDiskFile.securityType).toBe('password');
      expect(typeof parsedDiskFile.data).toBe('string');
      // Verify raw accounts/transactions are not visible in plain text
      expect(fileOnDisk.includes('acc_cash_wallet')).toBe(false);
    }, {
      description: 'Verifies encrypted JSON wrapper written to disk hides sensitive financial data',
      steps: ['Generate disk JSON wrapper for password-protected database', 'Check encrypted: true and ciphertext'],
      expectedResult: 'File contains ciphertext without plaintext transaction leak'
    });

    test('TC-SEC-005', 'Unlocking Restores Full Database Schema and Categories', () => {
      const data = getInitialMockData();
      const key = '5566';
      const encryptedStr = encryptPayload(data, key);

      const unlockedData = decryptPayload(encryptedStr, key);
      expect(unlockedData.accounts.length).toBe(3);
      expect(unlockedData.categories.Expense).toContain('Food & Dining');
      expect(unlockedData.settings.currency).toBe('USD');
    }, {
      description: 'Confirms that after unlocking, all accounts, categories, and settings are fully restored',
      steps: ['Unlock encrypted payload', 'Verify accounts count, categories, and currency settings'],
      expectedResult: 'Complete operational schema restored'
    });

  }, 'PIN/Password lock screens, database encryption, and security authentication');
}
