import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';
import { calculateAccountBalances } from '../../src/utils/format.js';

export function registerBankAccountsTests() {
  describe('BankAccounts', () => {

    test('TC-ACC-001', 'Create New Bank Account with Metadata', () => {
      const db = createMockDatabase();
      const newAcc = db.addAccount({
        bankName: 'HSBC',
        accountName: 'Global Advantage',
        accountNumber: '4455667788',
        branch: 'Downtown',
        accountType: 'Checking',
        currency: 'USD',
        status: 'Active'
      });

      const state = db.getState();
      const created = state.accounts.find(a => a.id === newAcc.id);
      
      expect(created).toBeDefined();
      expect(created.bankName).toBe('HSBC');
      expect(created.accountType).toBe('Checking');
      expect(created.status).toBe('Active');
    }, {
      description: 'Creates a new bank account and verifies all attributes are recorded in state',
      steps: ['Invoke addAccount with HSBC details', 'Verify account entry exists in state.accounts'],
      expectedResult: 'Account created with designated fields'
    });

    test('TC-ACC-002', 'Create Account with Initial Opening Balance Auto-Generates Ledger Deposit', () => {
      const db = createMockDatabase();
      const initialBal = 1500;
      const newAcc = db.addAccount({
        bankName: 'Sampath Bank',
        accountName: 'Fixed Saver',
        accountType: 'Savings'
      }, initialBal);

      const state = db.getState();
      const openingTx = state.transactions.find(t => t.bankId === newAcc.id && t.type === 'Deposit');
      
      expect(openingTx).toBeDefined();
      expect(openingTx.amount).toBe(1500);
      expect(openingTx.description).toBe('Opening balance');

      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);
      const accCalculated = accountsWithBal.find(a => a.id === newAcc.id);
      expect(accCalculated.balance).toBe(1500);
    }, {
      description: 'Verifies that creating an account with an initial opening balance creates an automatic Deposit transaction in the ledger',
      steps: ['Call addAccount with 1500 initialBalance', 'Check transactions array for Deposit', 'Assert calculated balance is 1500'],
      expectedResult: 'Automatic Deposit transaction created with amount 1500'
    });

    test('TC-ACC-003', 'Edit Existing Bank Account Details', () => {
      const db = createMockDatabase();
      db.editAccount('acc_boc_01', {
        accountName: 'Primary Operating Account',
        branch: 'North Fort',
        status: 'Active'
      });

      const state = db.getState();
      const updated = state.accounts.find(a => a.id === 'acc_boc_01');
      expect(updated.accountName).toBe('Primary Operating Account');
      expect(updated.branch).toBe('North Fort');
    }, {
      description: 'Updates bank account properties without affecting other account fields',
      steps: ['Call editAccount with updated name and branch', 'Verify updated state'],
      expectedResult: 'Account name and branch updated successfully'
    });

    test('TC-ACC-004', 'Delete Bank Account with Cascading Cleanup', () => {
      const db = createMockDatabase();
      // Initially, acc_boc_01 has transactions and a salary record
      expect(db.getState().transactions.filter(t => t.bankId === 'acc_boc_01').length).toBeGreaterThan(0);
      expect(db.getState().salaryHistory.filter(s => s.bankAccount === 'acc_boc_01').length).toBeGreaterThan(0);

      db.deleteAccount('acc_boc_01');

      const state = db.getState();
      const accExists = state.accounts.find(a => a.id === 'acc_boc_01');
      const orphanTx = state.transactions.filter(t => t.bankId === 'acc_boc_01' || t.targetBankId === 'acc_boc_01');
      const orphanSalary = state.salaryHistory.filter(s => s.bankAccount === 'acc_boc_01');

      expect(accExists).toBeUndefined();
      expect(orphanTx.length).toBe(0);
      expect(orphanSalary.length).toBe(0);
    }, {
      description: 'Deletes a bank account and verifies cascade removal of associated transactions and salary entries',
      steps: ['Delete account acc_boc_01', 'Check accounts array', 'Check transactions array for orphan records', 'Check salaryHistory'],
      expectedResult: 'Account and all related records deleted cleanly'
    });

    test('TC-ACC-005', 'Dynamic Ledger Balance Calculation for Multiple Transaction Outflows', () => {
      const db = createMockDatabase();
      // Add multiple transaction types on Commercial Bank
      db.addTransaction({
        date: '2026-08-01',
        bankId: 'acc_com_02',
        type: 'Deposit',
        amount: 2000
      });
      db.addTransaction({
        date: '2026-08-02',
        bankId: 'acc_com_02',
        type: 'Expense',
        amount: 300
      });
      db.addTransaction({
        date: '2026-08-03',
        bankId: 'acc_com_02',
        type: 'Withdrawal',
        amount: 200
      });
      db.addTransaction({
        date: '2026-08-04',
        bankId: 'acc_com_02',
        type: 'Online Payment',
        amount: 150
      });
      db.addTransaction({
        date: '2026-08-05',
        bankId: 'acc_com_02',
        type: 'Bill & Payment',
        amount: 100
      });

      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);
      const comAcc = accountsWithBal.find(a => a.id === 'acc_com_02');

      // Balance = 2000 - 300 - 200 - 150 - 100 = 1250
      expect(comAcc.balance).toBe(1250);
    }, {
      description: 'Computes account balance correctly across Deposit, Expense, Withdrawal, Online Payment, and Bill & Payment',
      steps: ['Add varied transaction types to acc_com_02', 'Execute calculateAccountBalances', 'Assert net balance is 1250'],
      expectedResult: 'Balance computed accurately as 1250.00'
    });

    test('TC-ACC-006', 'Inter-Account Transfer Balance Adjustments', () => {
      const db = createMockDatabase();
      // Transfer 500 from BOC to Commercial Bank
      db.addTransaction({
        date: '2026-08-11',
        bankId: 'acc_boc_01',
        targetBankId: 'acc_com_02',
        type: 'Online/Account cash transfer',
        category: 'Money Transfer',
        amount: 500,
        description: 'Savings Transfer'
      });

      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);
      
      const bocAcc = accountsWithBal.find(a => a.id === 'acc_boc_01');
      const comAcc = accountsWithBal.find(a => a.id === 'acc_com_02');

      // BOC: 4465 - 500 = 3965
      // COM: 0 + 500 = 500
      expect(bocAcc.balance).toBe(3965);
      expect(comAcc.balance).toBe(500);
    }, {
      description: 'Verifies transfer transaction decreases source account balance and increases destination account balance',
      steps: ['Add transfer transaction with source bankId and targetBankId', 'Calculate balances', 'Verify source debited and target credited'],
      expectedResult: 'Source debited by 500, Destination credited by 500'
    });

    test('TC-ACC-007', 'Account Status Toggle (Active vs Inactive)', () => {
      const db = createMockDatabase();
      db.editAccount('acc_com_02', { status: 'Inactive' });
      
      const state = db.getState();
      const updated = state.accounts.find(a => a.id === 'acc_com_02');
      expect(updated.status).toBe('Inactive');

      // Re-enable
      db.editAccount('acc_com_02', { status: 'Active' });
      const reEnabled = db.getState().accounts.find(a => a.id === 'acc_com_02');
      expect(reEnabled.status).toBe('Active');
    }, {
      description: 'Toggles status between Active and Inactive for account archiving',
      steps: ['Set status to Inactive', 'Assert inactive', 'Set status to Active', 'Assert active'],
      expectedResult: 'Status toggles properly without loss of data'
    });

    test('TC-ACC-008', 'Default Cash Wallet Account Persistence', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const cashAcc = state.accounts.find(a => a.id === 'acc_cash_wallet');

      expect(cashAcc).toBeDefined();
      expect(cashAcc.accountType).toBe('Cash / Other');
      expect(cashAcc.bankName).toBe('Cash');
    }, {
      description: 'Ensures the built-in Cash Wallet account is present and configured as Cash / Other',
      steps: ['Check initial mock accounts for acc_cash_wallet', 'Validate account properties'],
      expectedResult: 'Default Cash Wallet account is present'
    });

    test('TC-ACC-009', 'Multi-Account Balance Isolation', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);

      // Verify each account only calculates transactions referencing its specific id
      const bocBal = accountsWithBal.find(a => a.id === 'acc_boc_01').balance;
      const comBal = accountsWithBal.find(a => a.id === 'acc_com_02').balance;
      const cashBal = accountsWithBal.find(a => a.id === 'acc_cash_wallet').balance;

      expect(bocBal).toBe(4465);
      expect(comBal).toBe(0);
      expect(cashBal).toBe(300);
    }, {
      description: 'Verifies transactions on one bank account do not leak or miscalculate other accounts',
      steps: ['Calculate balances across all accounts', 'Verify independent balance values'],
      expectedResult: 'Balances are strictly isolated to their respective accounts'
    });

  }, 'Bank Accounts management, opening balances, transfers, and balance math');
}
