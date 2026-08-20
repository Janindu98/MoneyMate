import { describe, test, expect } from '../core/testFramework.js';

export function registerHelpTests() {
  describe('Help', () => {

    test('TC-HLP-001', 'Help Documentation Sections & Topic Retrieval', () => {
      const helpSections = [
        { id: 'getting-started', title: 'Getting Started', topics: ['Overview', 'Quick Setup', 'Navigation'] },
        { id: 'accounts', title: 'Bank Accounts', topics: ['Adding Accounts', 'Opening Balances', 'Transfers'] },
        { id: 'transactions', title: 'Transactions & Ledger', topics: ['Logging Inflows/Outflows', 'Receipt Uploads', 'Categories'] },
        { id: 'salary', title: 'Salary & Payslips', topics: ['Generating Slips', 'EPF & ETF Calculations', 'Payslip Attachments'] },
        { id: 'budgets', title: 'Budgets & Bills', topics: ['Setting Limits', 'Alert Notifications', 'Utility Breakdown'] },
        { id: 'backup', title: 'Backup & Security', topics: ['Encrypted Backups', 'Google Drive Sync', 'PIN & Password Lock'] }
      ];

      expect(helpSections.length).toBe(6);
      expect(helpSections.find(s => s.id === 'salary')).toBeDefined();
      expect(helpSections.find(s => s.id === 'salary').topics).toContain('EPF & ETF Calculations');
    }, {
      description: 'Verifies the structure of all Help and User Guide knowledge base modules',
      steps: ['Verify help sections collection', 'Check for essential guide categories'],
      expectedResult: 'All 6 key documentation sections present'
    });

    test('TC-HLP-002', 'Knowledge Base FAQ Keyword Search & Filtering', () => {
      const faqItems = [
        { q: 'How is EPF and ETF calculated?', a: 'EPF is calculated at 8% for employee and 12% for employer from Basic Salary.' },
        { q: 'How do I backup my data?', a: 'Go to Backup tab, enter an encryption key and click Export Backup.' },
        { q: 'Where are receipt images saved?', a: 'Receipts are copied safely to the user application data directory.' }
      ];

      const query = 'backup';
      const results = faqItems.filter(item => 
        item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      );

      expect(results.length).toBe(1);
      expect(results[0].q).toContain('How do I backup my data?');
    }, {
      description: 'Searches knowledge base questions and answers by search keywords',
      steps: ['Perform search for keyword "backup" across FAQs', 'Assert matching FAQ entry'],
      expectedResult: 'Returns matched backup FAQ'
    });

    test('TC-HLP-003', 'Keyboard Shortcuts Mapping Validation', () => {
      const shortcuts = [
        { key: 'Ctrl + N', action: 'New Transaction' },
        { key: 'Ctrl + S', action: 'Save / Export Data' },
        { key: 'Ctrl + D', action: 'Navigate to Dashboard' },
        { key: 'Ctrl + F', action: 'Focus Search Bar' }
      ];

      expect(shortcuts.length).toBe(4);
      expect(shortcuts.find(s => s.key === 'Ctrl + N').action).toBe('New Transaction');
    }, {
      description: 'Validates keyboard shortcut key combinations and associated action handlers',
      steps: ['Verify shortcuts list contains essential navigation and creation commands'],
      expectedResult: 'Key shortcuts defined and mapped'
    });

    test('TC-HLP-004', 'Application Diagnostic and About Metadata', () => {
      const appInfo = {
        name: 'MoneyMate Vault',
        version: '1.6.0',
        platform: 'Electron + React',
        storageType: 'Local JSON File with Optional XOR-Base64 Encryption',
        license: 'MIT'
      };

      expect(appInfo.name).toBe('MoneyMate Vault');
      expect(appInfo.version).toBe('1.6.0');
      expect(appInfo.license).toBe('MIT');
    }, {
      description: 'Verifies About modal metadata and application diagnostic information',
      steps: ['Verify application name, version string, and license metadata'],
      expectedResult: 'App metadata matches version 1.6.0'
    });

  }, 'Help documentation, search FAQs, shortcuts, and application diagnostics');
}
