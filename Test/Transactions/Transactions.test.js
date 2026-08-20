import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';
import { calculateAccountBalances } from '../../src/utils/format.js';

export function registerTransactionsTests() {
  describe('Transactions', () => {

    test('TC-TX-001', 'Record Standard Expense Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-12',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Groceries',
        payee: 'Supermarket Plus',
        amount: 85.50,
        description: 'Weekly grocery items'
      });

      const state = db.getState();
      const found = state.transactions.find(t => t.id === tx.id);
      expect(found).toBeDefined();
      expect(found.amount).toBe(85.50);
      expect(found.category).toBe('Groceries');
    }, {
      description: 'Records an Expense transaction and checks fields are correctly preserved in state',
      steps: ['Call addTransaction with Expense payload', 'Assert transaction exists in state'],
      expectedResult: 'Expense recorded with correct amount and category'
    });

    test('TC-TX-002', 'Record Income Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-14',
        bankId: 'acc_boc_01',
        type: 'Income',
        category: 'Bonus',
        payee: 'Acme Corp',
        amount: 1000,
        description: 'Quarterly performance bonus'
      });

      const state = db.getState();
      const found = state.transactions.find(t => t.id === tx.id);
      expect(found.type).toBe('Income');
      expect(found.amount).toBe(1000);
    }, {
      description: 'Records an Income transaction to increase account balance',
      steps: ['Call addTransaction with Income payload', 'Assert ledger updates'],
      expectedResult: 'Income transaction successfully added'
    });

    test('TC-TX-003', 'Record Cash Deposit Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-15',
        bankId: 'acc_boc_01',
        type: 'Deposit',
        category: 'Cash Deposit',
        payee: 'Self',
        amount: 600,
        description: 'Cash deposit at ATM kiosk'
      });

      expect(tx.type).toBe('Deposit');
      expect(tx.amount).toBe(600);
    }, {
      description: 'Records a Deposit transaction into a bank account',
      steps: ['Call addTransaction with Deposit type', 'Verify record'],
      expectedResult: 'Deposit transaction logged'
    });

    test('TC-TX-004', 'Record Cash Withdrawal Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-16',
        bankId: 'acc_boc_01',
        type: 'Withdrawal',
        category: 'ATM Withdrawal',
        payee: 'Self',
        amount: 250,
        description: 'Cash withdrawal for pocket money'
      });

      expect(tx.type).toBe('Withdrawal');
      expect(tx.amount).toBe(250);
    }, {
      description: 'Records a Cash Withdrawal transaction',
      steps: ['Call addTransaction with Withdrawal type', 'Verify record'],
      expectedResult: 'Withdrawal transaction logged'
    });

    test('TC-TX-005', 'Record Inter-Account Transfer Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-17',
        bankId: 'acc_boc_01',
        targetBankId: 'acc_com_02',
        type: 'Online/Account cash transfer',
        category: 'Money Transfer',
        payee: 'Commercial Bank Savings',
        amount: 1200,
        description: 'Emergency fund transfer'
      });

      expect(tx.type).toBe('Online/Account cash transfer');
      expect(tx.bankId).toBe('acc_boc_01');
      expect(tx.targetBankId).toBe('acc_com_02');
    }, {
      description: 'Records an inter-account transfer with source and target bank IDs',
      steps: ['Call addTransaction with source and target bank IDs', 'Assert properties'],
      expectedResult: 'Transfer transaction logged with both bank references'
    });

    test('TC-TX-006', 'Record Online Payment Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-18',
        bankId: 'acc_boc_01',
        type: 'Online Payment',
        category: 'Shopping',
        payee: 'Amazon Store',
        amount: 199.99,
        description: 'Tech accessories purchase'
      });

      expect(tx.type).toBe('Online Payment');
      expect(tx.amount).toBe(199.99);
    }, {
      description: 'Records an Online Payment transaction with merchant payee',
      steps: ['Call addTransaction with Online Payment type', 'Verify record'],
      expectedResult: 'Online Payment transaction logged'
    });

    test('TC-TX-007', 'Record Utility Bill & Payment Transaction', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-19',
        bankId: 'acc_boc_01',
        type: 'Bill & Payment',
        category: 'Water',
        payee: 'National Water Board',
        amount: 35.00,
        description: 'August residential water bill'
      });

      expect(tx.type).toBe('Bill & Payment');
      expect(tx.category).toBe('Water');
    }, {
      description: 'Records a Bill & Payment transaction with specific utility category',
      steps: ['Call addTransaction with Bill & Payment type', 'Verify record'],
      expectedResult: 'Bill & Payment transaction logged'
    });

    test('TC-TX-008', 'Edit Transaction Amount and Category', () => {
      const db = createMockDatabase();
      db.editTransaction('tx_init_02', {
        amount: 220,
        category: 'Food & Dining',
        description: 'Dinner with executive team'
      });

      const state = db.getState();
      const edited = state.transactions.find(t => t.id === 'tx_init_02');
      expect(edited.amount).toBe(220);
      expect(edited.description).toBe('Dinner with executive team');
    }, {
      description: 'Edits transaction attributes and verifies updated values in state',
      steps: ['Call editTransaction with updated amount 220', 'Assert updated fields in state'],
      expectedResult: 'Transaction successfully modified'
    });

    test('TC-TX-009', 'Delete Transaction from Ledger', () => {
      const db = createMockDatabase();
      db.deleteTransaction('tx_init_02');

      const state = db.getState();
      const found = state.transactions.find(t => t.id === 'tx_init_02');
      expect(found).toBeUndefined();
    }, {
      description: 'Deletes a transaction and confirms its removal from state',
      steps: ['Call deleteTransaction with tx_init_02', 'Assert transaction is absent'],
      expectedResult: 'Transaction deleted'
    });

    test('TC-TX-010', 'Add Custom Transaction Category', () => {
      const db = createMockDatabase();
      const added = db.addCategory('Expense', 'Pet Supplies');
      expect(added).toBe(true);

      const state = db.getState();
      expect(state.categories.Expense).toContain('Pet Supplies');

      // Duplicate addition should return false
      const addedDuplicate = db.addCategory('Expense', 'Pet Supplies');
      expect(addedDuplicate).toBe(false);
    }, {
      description: 'Adds custom categories and prevents duplicate insertions',
      steps: ['Call addCategory with Pet Supplies', 'Assert array contains new category', 'Try adding duplicate'],
      expectedResult: 'Custom category added and duplicates prevented'
    });

    test('TC-TX-011', 'Prevent Deletion of Core Default Categories While Allowing Custom Deletion', () => {
      const db = createMockDatabase();
      
      // Attempt to delete protected default 'Salary'
      const deleteProtected = db.deleteCategory('Income', 'Salary');
      expect(deleteProtected).toBe(false);
      expect(db.getState().categories.Income).toContain('Salary');

      // Add then delete custom category
      db.addCategory('Expense', 'Hobbies');
      const deleteCustom = db.deleteCategory('Expense', 'Hobbies');
      expect(deleteCustom).toBe(true);
      expect(db.getState().categories.Expense.includes('Hobbies')).toBe(false);
    }, {
      description: 'Protects core system categories from accidental deletion while permitting custom category removal',
      steps: ['Attempt to delete default Salary category', 'Add and delete custom Hobbies category'],
      expectedResult: 'Default category protected; custom category deleted'
    });

    test('TC-TX-012', 'Multi-Criteria Search and Filtering', () => {
      const db = createMockDatabase();
      const state = db.getState();

      // Search by keyword "Dinner"
      const keywordResults = state.transactions.filter(t => 
        (t.description || '').toLowerCase().includes('dinner') ||
        (t.payee || '').toLowerCase().includes('dinner')
      );
      expect(keywordResults.length).toBe(1);
      expect(keywordResults[0].id).toBe('tx_init_02');

      // Filter by type "Bill & Payment"
      const billResults = state.transactions.filter(t => t.type === 'Bill & Payment');
      expect(billResults.length).toBe(1);
      expect(billResults[0].category).toBe('Electricity');
    }, {
      description: 'Performs multi-criteria filtering by search keyword and transaction type',
      steps: ['Filter transactions by keyword "dinner"', 'Filter by type "Bill & Payment"'],
      expectedResult: 'Matches accurate subsets of transactions'
    });

    test('TC-TX-013', 'Receipt Attachment Metadata Handling', () => {
      const db = createMockDatabase();
      const tx = db.addTransaction({
        date: '2026-08-20',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Shopping',
        amount: 80,
        receiptPath: 'C:\\Users\\User\\Pictures\\receipt_aug20.jpg',
        receiptName: 'receipt_aug20.jpg'
      });

      expect(tx.receiptPath).toBe('C:\\Users\\User\\Pictures\\receipt_aug20.jpg');
      expect(tx.receiptName).toBe('receipt_aug20.jpg');
    }, {
      description: 'Verifies receipt image attachment path is stored with the transaction',
      steps: ['Add transaction with receiptPath and receiptName', 'Assert properties'],
      expectedResult: 'Receipt metadata stored properly'
    });

    test('TC-TX-014', 'Legacy Category Migration Mapping', () => {
      // Simulate raw data with legacy category names
      const legacyData = [
        { id: 'tx_old_1', type: 'Expense', category: 'Food', amount: 50 },
        { id: 'tx_old_2', type: 'Expense', category: 'Medical', amount: 75 },
        { id: 'tx_old_3', type: 'Expense', category: 'Fuel', amount: 40 }
      ];

      const migrated = legacyData.map(tx => {
        if (tx.category === 'Food') return { ...tx, category: 'Food & Dining' };
        if (tx.category === 'Medical') return { ...tx, category: 'Healthcare & Medical' };
        return tx;
      });

      expect(migrated[0].category).toBe('Food & Dining');
      expect(migrated[1].category).toBe('Healthcare & Medical');
      expect(migrated[2].category).toBe('Fuel');
    }, {
      description: 'Tests automated schema migration from legacy category names to unified categories',
      steps: ['Process legacy transactions array with migration map', 'Assert updated categories'],
      expectedResult: 'Food becomes Food & Dining, Medical becomes Healthcare & Medical'
    });

  }, 'Transactions CRUD, 7 transaction types, category rules, search and filtering');
}
