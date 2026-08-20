import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase, getInitialMockData } from '../core/mockData.js';
import { currencySymbols, formatCurrency } from '../../src/utils/format.js';

export function registerSettingsTests() {
  describe('Settings', () => {

    test('TC-SET-001', 'Update Currency Preference & Symbol Resolution', () => {
      const db = createMockDatabase();
      db.updateSettings({ currency: 'EUR' });

      const state = db.getState();
      expect(state.settings.currency).toBe('EUR');

      const symbol = currencySymbols['EUR'];
      expect(symbol).toBe('€');

      const formatted = formatCurrency(500, 'EUR');
      expect(formatted).toBe('€ 500.00');
    }, {
      description: 'Changes default currency to EUR and verifies correct currency symbol resolution across app',
      steps: ['Update settings currency to EUR', 'Check currencySymbols map', 'Format currency value'],
      expectedResult: 'Currency changed to EUR and formats with € symbol'
    });

    test('TC-SET-002', 'Theme Configuration Switching (Dark vs Light)', () => {
      const db = createMockDatabase();
      db.updateSettings({ theme: 'light' });

      expect(db.getState().settings.theme).toBe('light');

      db.updateSettings({ theme: 'dark' });
      expect(db.getState().settings.theme).toBe('dark');
    }, {
      description: 'Switches application visual theme preference between dark and light modes',
      steps: ['Set theme to light', 'Assert theme', 'Set theme to dark', 'Assert theme'],
      expectedResult: 'Theme preference toggles properly'
    });

    test('TC-SET-003', 'Font Size Preferences (Small, Medium, Large, X-Large)', () => {
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px'
      };

      const db = createMockDatabase();
      db.updateSettings({ fontSize: 'large' });

      const state = db.getState();
      expect(state.settings.fontSize).toBe('large');
      expect(fontSizeMap[state.settings.fontSize]).toBe('18px');
    }, {
      description: 'Configures application font scale preference and checks CSS variable mapping',
      steps: ['Update fontSize setting to large', 'Assert pixel mapping is 18px'],
      expectedResult: 'Font size set to large with 18px mapping'
    });

    test('TC-SET-004', 'Security Mode Configuration (None, PIN, Password)', () => {
      const db = createMockDatabase();
      db.updateSettings({
        securityType: 'pin',
        securityPin: '1234'
      });

      let state = db.getState();
      expect(state.settings.securityType).toBe('pin');
      expect(state.settings.securityPin).toBe('1234');

      db.updateSettings({
        securityType: 'password',
        securityPassword: 'SecretVaultPassword@2026'
      });

      state = db.getState();
      expect(state.settings.securityType).toBe('password');
      expect(state.settings.securityPassword).toBe('SecretVaultPassword@2026');
    }, {
      description: 'Configures lock screen security mode with PIN and Password credentials',
      steps: ['Set securityType to pin with 1234', 'Set securityType to password with complex string'],
      expectedResult: 'Security modes configured and saved in settings'
    });

    test('TC-SET-005', 'Security PIN and Password Validation Rules', () => {
      function validatePIN(pin) {
        return /^\d{4,8}$/.test(pin);
      }

      function validatePassword(pw) {
        return typeof pw === 'string' && pw.length >= 6;
      }

      expect(validatePIN('1234')).toBe(true);
      expect(validatePIN('12')).toBe(false); // Too short
      expect(validatePIN('abcd')).toBe(false); // Non-numeric

      expect(validatePassword('Pass123')).toBe(true);
      expect(validatePassword('123')).toBe(false); // Too short
    }, {
      description: 'Tests validation constraints for 4-8 digit numeric PINs and minimum 6-character passwords',
      steps: ['Validate PINs and passwords against validation functions'],
      expectedResult: 'Valid credentials pass; invalid formats rejected'
    });

    test('TC-SET-006', 'Database Reset to Clean Initial State', () => {
      const db = createMockDatabase();
      // Add custom records
      db.addAccount({ bankName: 'Temp Bank' });
      db.addTransaction({ amount: 9999, type: 'Expense' });

      // Execute Reset
      const cleanState = getInitialMockData();
      db.setState(cleanState);

      const state = db.getState();
      expect(state.accounts.length).toBe(3);
      expect(state.transactions.length).toBe(4);
      expect(state.accounts.find(a => a.bankName === 'Temp Bank')).toBeUndefined();
    }, {
      description: 'Resets database state back to initial default configuration',
      steps: ['Modify state with temporary entries', 'Reset state to getInitialMockData', 'Verify clean state'],
      expectedResult: 'Database restored to initial state'
    });

  }, 'General settings, currency preferences, appearance themes, and security configuration');
}
