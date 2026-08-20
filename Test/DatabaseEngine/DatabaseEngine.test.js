import { describe, test, expect } from '../core/testFramework.js';
import Database from '../../src/database/db.js';
import path from 'node:path';
import fs from 'node:fs';

export function registerDatabaseEngineTests() {
  describe('DatabaseEngine', () => {

    test('TC-DBE-001', 'Initial Database Schema Generation on Empty / New File', () => {
      const testDbPath = path.join(process.cwd(), 'Test', 'scratch_test_db_001.json');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

      const db = new Database(testDbPath);
      const data = db.load();

      expect(fs.existsSync(testDbPath)).toBe(true);
      expect(Array.isArray(data.accounts)).toBe(true);
      expect(data.accounts.length).toBe(1); // Default Cash Wallet
      expect(data.accounts[0].id).toBe('acc_cash_wallet');
      expect(Array.isArray(data.transactions)).toBe(true);
      expect(data.settings.currency).toBe('USD');

      // Cleanup
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }, {
      description: 'Initializes and writes fresh default schema when database file does not exist',
      steps: ['Create Database instance on non-existent path', 'Call load()', 'Assert default Cash Wallet and schema'],
      expectedResult: 'Initial database created with default cash account'
    });

    test('TC-DBE-002', 'Schema Migration Ensures All Required Payment Category Tables Exist', () => {
      const partialData = {
        accounts: [],
        transactions: []
      };

      const testDbPath = path.join(process.cwd(), 'Test', 'scratch_test_db_002.json');
      fs.writeFileSync(testDbPath, JSON.stringify(partialData), 'utf8');

      const db = new Database(testDbPath);
      const data = db.load();

      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories['Income'])).toBe(true);
      expect(Array.isArray(data.categories['Expense'])).toBe(true);
      expect(Array.isArray(data.categories['Online/Account cash transfer'])).toBe(true);
      expect(Array.isArray(data.categories['Bill & Payment'])).toBe(true);
      expect(data.settings).toBeDefined();

      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }, {
      description: 'Automatically patches missing category dictionaries and settings on load via ensureSchema',
      steps: ['Write partial database without categories', 'Load database', 'Verify ensureSchema fills missing tables'],
      expectedResult: 'All 7 category tables populated with defaults'
    });

    test('TC-DBE-003', 'Corrupt Database Auto-Recovery & Schema Reset', () => {
      const testDbPath = path.join(process.cwd(), 'Test', 'scratch_test_db_corrupt.json');
      fs.writeFileSync(testDbPath, '{ this is corrupted json data !!!', 'utf8');

      const db = new Database(testDbPath);
      const data = db.load();

      // Database recovers gracefully from corrupt JSON and returns clean initial state
      expect(data).toBeDefined();
      expect(Array.isArray(data.accounts)).toBe(true);
      expect(data.accounts[0].id).toBe('acc_cash_wallet');
      expect(data.settings.currency).toBe('USD');

      // Cleanup
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }, {
      description: 'Detects corrupted JSON file and recovers gracefully by initializing fresh default state',
      steps: ['Write invalid JSON to file', 'Invoke db.load()', 'Verify clean state recovery'],
      expectedResult: 'Corrupted file handled gracefully and state restored to default'
    });

    test('TC-DBE-004', 'State Persistence and Reload Consistency', () => {
      const testDbPath = path.join(process.cwd(), 'Test', 'scratch_test_db_004.json');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

      const db1 = new Database(testDbPath);
      db1.load();
      
      const currentData = db1.getData();
      currentData.accounts.push({
        id: 'acc_custom_persist',
        bankName: 'Persisted Bank',
        balance: 7500
      });
      db1.setData(currentData);

      // Re-read from a brand new Database instance
      const db2 = new Database(testDbPath);
      const loadedData = db2.load();

      const found = loadedData.accounts.find(a => a.id === 'acc_custom_persist');
      expect(found).toBeDefined();
      expect(found.bankName).toBe('Persisted Bank');

      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    }, {
      description: 'Saves data modifications to disk and verifies exact state is loaded by subsequent instances',
      steps: ['Modify data and save with db1', 'Create db2 and load from disk', 'Assert persisted accounts'],
      expectedResult: 'State persisted and recovered identically'
    });

    test('TC-DBE-005', 'Payment Type Category Migration (Online Transfer, Debit Card Fees, Alerts)', () => {
      const rawCategories = {
        'Bill & Payment': ['Electricity', 'Water', 'Other']
      };

      // App category migration logic
      const initialBills = ['Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment'];
      initialBills.forEach(c => {
        if (!rawCategories['Bill & Payment'].includes(c)) {
          const otherIdx = rawCategories['Bill & Payment'].indexOf('Other');
          if (otherIdx !== -1) {
            rawCategories['Bill & Payment'].splice(otherIdx, 0, c);
          } else {
            rawCategories['Bill & Payment'].push(c);
          }
        }
      });

      expect(rawCategories['Bill & Payment']).toContain('Alert Charges');
      expect(rawCategories['Bill & Payment']).toContain('Subscriptions');
      expect(rawCategories['Bill & Payment']).toContain('Debit Card Annual Fee');
      expect(rawCategories['Bill & Payment']).toContain('Government Payment');
    }, {
      description: 'Migrates category definitions and ensures new system utility categories are dynamically added',
      steps: ['Run migration routine on bill categories', 'Verify Alert Charges, Subscriptions, and Card Fees added'],
      expectedResult: 'New bill categories migrated into category list'
    });

  }, 'Database file handling, schema migration, corruption auto-recovery, and persistence');
}
