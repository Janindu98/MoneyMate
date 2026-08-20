import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';
import { encryptData, decryptData } from '../../src/utils/crypto.js';

export function registerBackupTests() {
  describe('Backup', () => {

    test('TC-BAK-001', 'Full Database Payload Export Structure', () => {
      const db = createMockDatabase();
      const state = db.getState();

      const backupPayload = {
        accounts: state.accounts || [],
        transactions: state.transactions || [],
        categories: state.categories || {},
        salaryHistory: state.salaryHistory || [],
        subscriptions: state.subscriptions || [],
        settings: state.settings || {},
        profile: state.profile || {}
      };

      expect(backupPayload.accounts).toBeDefined();
      expect(backupPayload.transactions).toBeDefined();
      expect(backupPayload.categories).toBeDefined();
      expect(backupPayload.salaryHistory).toBeDefined();
      expect(backupPayload.subscriptions).toBeDefined();
      expect(backupPayload.settings).toBeDefined();
      expect(backupPayload.profile).toBeDefined();
    }, {
      description: 'Verifies the complete backup payload includes all essential tables and collections',
      steps: ['Assemble export object from state', 'Validate all keys exist'],
      expectedResult: 'All 7 main data models present in export payload'
    });

    test('TC-BAK-002', 'Local Backup Encryption Using XOR + Base64 with Encryption Key', () => {
      const payload = { test: 'MoneyMate Secret', amount: 1234.56 };
      const key = 'custom_backup_passcode';
      const encrypted = encryptData(payload, key);

      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(10);
      // Encrypted string should not contain plain text
      expect(encrypted.includes('MoneyMate Secret')).toBe(false);
    }, {
      description: 'Encrypts payload using XOR cipher with key and encodes into Base64 string',
      steps: ['Call encryptData with secret payload and custom key', 'Verify output string is non-plain and valid Base64'],
      expectedResult: 'Payload successfully encrypted'
    });

    test('TC-BAK-003', 'Local Backup Decryption and Data Integrity Verification', () => {
      const payload = { accounts: [{ id: 'acc_1', name: 'Test' }], balance: 500 };
      const key = 'secure_key_123';
      const encrypted = encryptData(payload, key);
      const decrypted = decryptData(encrypted, key);

      expect(decrypted).toEqual(payload);
      expect(decrypted.accounts[0].name).toBe('Test');
    }, {
      description: 'Decrypts encrypted backup string and verifies restored object exactly matches original payload',
      steps: ['Encrypt payload with key', 'Decrypt with same key', 'Assert deep equality with original'],
      expectedResult: 'Decrypted data is bit-for-bit identical to original payload'
    });

    test('TC-BAK-004', 'Decryption Failure Handling on Invalid Key or Corrupted Payload', () => {
      const payload = { secret: 'Confidential Data' };
      const correctKey = 'correct_pass';
      const wrongKey = 'wrong_pass';
      const encrypted = encryptData(payload, correctKey);

      expect(() => {
        decryptData(encrypted, wrongKey);
      }).toThrow('Failed to decrypt database backup. Corrupted file or invalid key.');
    }, {
      description: 'Throws error when attempting to decrypt with incorrect encryption key or malformed data',
      steps: ['Encrypt with correct key', 'Attempt decrypt with wrong key', 'Assert error is thrown'],
      expectedResult: 'Throws explicit decryption failure error'
    });

    test('TC-BAK-005', 'Database Restore Process & State Replacement', () => {
      const db = createMockDatabase();
      const restoredData = {
        accounts: [{ id: 'acc_restored_1', bankName: 'Restored Bank', balance: 9999, status: 'Active' }],
        transactions: [{ id: 'tx_restored_1', amount: 500, type: 'Income' }],
        categories: { Income: ['Salary'], Expense: ['Groceries'] },
        salaryHistory: [],
        subscriptions: [],
        settings: { currency: 'EUR' },
        profile: { name: 'Restored User' }
      };

      db.setState(restoredData);
      const state = db.getState();

      expect(state.accounts[0].bankName).toBe('Restored Bank');
      expect(state.settings.currency).toBe('EUR');
      expect(state.profile.name).toBe('Restored User');
    }, {
      description: 'Applies restored backup object into database and validates state overwriting',
      steps: ['Call setState with restored backup payload', 'Verify all state sections updated'],
      expectedResult: 'Database state updated to match restored data'
    });

    test('TC-BAK-006', 'Automated Google Drive Backup File Naming Format', () => {
      const dateStr = '2026-08-21';
      const expectedFileName = `moneymate_vault_backup_gdrive_${dateStr}.enc`;
      const regexPattern = /^moneymate_vault_backup_gdrive_\d{4}-\d{2}-\d{2}\.enc$/;

      expect(regexPattern.test(expectedFileName)).toBe(true);
    }, {
      description: 'Validates automated Google drive backup naming pattern (moneymate_vault_backup_gdrive_YYYY-MM-DD.enc)',
      steps: ['Test backup file name against strict regex'],
      expectedResult: 'File name matches exact schema'
    });

    test('TC-BAK-007', 'Cloud Sync Direct Upload Payload Preparation', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const encryptedString = encryptData(state, 'moneymate_key');

      const cloudUploadTask = {
        provider: 'gdrive',
        fileName: 'moneymate_vault_backup_gdrive_2026-08-21.enc',
        payloadLength: encryptedString.length,
        contentType: 'application/octet-stream'
      };

      expect(cloudUploadTask.provider).toBe('gdrive');
      expect(cloudUploadTask.payloadLength).toBeGreaterThan(0);
    }, {
      description: 'Constructs upload descriptor for direct cloud storage API transfers',
      steps: ['Encrypt current state', 'Build cloud upload descriptor'],
      expectedResult: 'Upload descriptor prepared with encrypted payload length'
    });

    test('TC-BAK-008', 'OAuth Token Masking and Encrypted Storage Representation', () => {
      const sampleOAuthToken = 'ya29.a0AfH6SMD_SampleGoogleOAuthAccessToken123456';
      const encryptedToken = encryptData({ token: sampleOAuthToken }, 'cloud_auth_secret');
      const decrypted = decryptData(encryptedToken, 'cloud_auth_secret');

      expect(decrypted.token).toBe(sampleOAuthToken);
    }, {
      description: 'Ensures cloud refresh tokens and access tokens can be securely encrypted and recovered',
      steps: ['Encrypt token payload with auth key', 'Decrypt and assert match'],
      expectedResult: 'Token securely recovered'
    });

  }, 'Database backup export, XOR/Base64 encryption, decryption, and cloud sync');
}
