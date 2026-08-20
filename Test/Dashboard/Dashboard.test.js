import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';
import { calculateAccountBalances, formatCurrency } from '../../src/utils/format.js';

export function registerDashboardTests() {
  describe('Dashboard', () => {
    
    test('TC-DASH-001', 'Total Balance Calculation Across Active Accounts', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);
      
      const totalBalance = accountsWithBal
        .filter(a => a.status === 'Active')
        .reduce((sum, a) => sum + a.balance, 0);

      // Boc balance: +5000 (Income) - 150 (Expense) - 300 (Transfer source) - 85 (Bill) = 4465
      // Cash wallet balance: +300 (Transfer dest) = 300
      // Commercial bank: 0
      // Total = 4465 + 300 = 4765
      expect(totalBalance).toBe(4765);
    }, {
      description: 'Verifies current total balance sums all active accounts with calculated ledger balances',
      steps: ['Fetch active accounts', 'Calculate ledger balances', 'Sum all active balances'],
      expectedResult: 'Total balance correctly matches sum of active balances (4765.00)'
    });

    test('TC-DASH-002', 'Total Bank Balance Excluding Physical Cash Accounts', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);
      
      const bankBalance = accountsWithBal
        .filter(a => a.status === 'Active' && a.accountType !== 'Cash / Other')
        .reduce((sum, a) => sum + a.balance, 0);

      // Only BOC (4465) + Commercial (0)
      expect(bankBalance).toBe(4465);
    }, {
      description: 'Verifies total bank balance aggregates only bank accounts excluding Cash / Other accounts',
      steps: ['Filter active accounts where accountType != "Cash / Other"', 'Sum balances'],
      expectedResult: 'Total bank balance is 4465.00 (excluding 300 cash)'
    });

    test('TC-DASH-003', 'Inactive Accounts Exclusion from Balance Calculations', () => {
      const db = createMockDatabase();
      // Add inactive account with positive balance
      db.addAccount({
        id: 'acc_inactive_old',
        bankName: 'Old Bank',
        accountName: 'Old Account',
        accountType: 'Savings',
        status: 'Inactive'
      }, 2000);

      const state = db.getState();
      const accountsWithBal = calculateAccountBalances(state.accounts, state.transactions);

      const totalBalance = accountsWithBal
        .filter(a => a.status === 'Active')
        .reduce((sum, a) => sum + a.balance, 0);

      // Should still be 4765, ignoring inactive account's 2000
      expect(totalBalance).toBe(4765);
    }, {
      description: 'Ensures accounts marked as Inactive are excluded from Dashboard total metrics',
      steps: ['Add inactive account with opening balance', 'Calculate active balance sum'],
      expectedResult: 'Inactive account balance is omitted from active total'
    });

    test('TC-DASH-004', 'Period Filtering - This Month Aggregation', () => {
      const db = createMockDatabase();
      const state = db.getState();
      
      // Filter August 2026 transactions
      let displayedIncome = 0;
      let displayedExpense = 0;

      state.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        // Aug 2026 matches current mock month
        if (txDate.getMonth() === 7 && txDate.getFullYear() === 2026) {
          if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
            displayedIncome += tx.amount;
          } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type) && tx.bankId) {
            displayedExpense += tx.amount;
          }
        }
      });

      const savings = displayedIncome - displayedExpense;
      expect(displayedIncome).toBe(5000);
      expect(displayedExpense).toBe(235); // 150 + 85
      expect(savings).toBe(4765);
    }, {
      description: 'Verifies monthly income, expense and net savings calculation for the current month',
      steps: ['Filter tx by month and year', 'Sum inflows and outflows', 'Calculate net savings'],
      expectedResult: 'Income = 5000, Expense = 235, Savings = 4765'
    });

    test('TC-DASH-005', 'Period Filtering - This Year Aggregation', () => {
      const db = createMockDatabase();
      // Add a transaction from earlier in 2026 (e.g. Feb)
      db.addTransaction({
        date: '2026-02-15',
        bankId: 'acc_boc_01',
        type: 'Income',
        category: 'Bonus',
        amount: 1200,
        description: 'Annual bonus'
      });

      const state = db.getState();
      let yearlyIncome = 0;
      let yearlyExpense = 0;

      state.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === 2026) {
          if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
            yearlyIncome += tx.amount;
          } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type) && tx.bankId) {
            yearlyExpense += tx.amount;
          }
        }
      });

      expect(yearlyIncome).toBe(6200); // 5000 + 1200
      expect(yearlyExpense).toBe(235);
    }, {
      description: 'Verifies yearly income and expense rollup across all months in current calendar year',
      steps: ['Add tx in different month of same year', 'Filter by year 2026', 'Assert totals'],
      expectedResult: 'Yearly income correctly includes all months (6200)'
    });

    test('TC-DASH-006', 'Period Filtering - Last Month Aggregation', () => {
      const db = createMockDatabase();
      // Add July 2026 transaction
      db.addTransaction({
        date: '2026-07-20',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Shopping',
        amount: 450,
        description: 'July Shopping'
      });

      const state = db.getState();
      let lastMonthExpense = 0;

      state.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getMonth() === 6 && txDate.getFullYear() === 2026) { // Month 6 = July
          if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type)) {
            lastMonthExpense += tx.amount;
          }
        }
      });

      expect(lastMonthExpense).toBe(450);
    }, {
      description: 'Verifies correct isolation of previous month transactions',
      steps: ['Add previous month transaction', 'Filter for previous month index', 'Assert values'],
      expectedResult: 'Only previous month transactions are counted (450)'
    });

    test('TC-DASH-007', 'Period Filtering - Overall History Aggregation', () => {
      const db = createMockDatabase();
      // Add transactions across different years
      db.addTransaction({
        date: '2025-11-10',
        bankId: 'acc_boc_01',
        type: 'Income',
        category: 'Salary',
        amount: 4000,
        description: '2025 Salary'
      });

      const state = db.getState();
      let overallIncome = 0;
      state.transactions.forEach(tx => {
        if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
          overallIncome += tx.amount;
        }
      });

      expect(overallIncome).toBe(9000); // 5000 + 4000
    }, {
      description: 'Verifies overall lifetime history aggregates all historical transactions regardless of date',
      steps: ['Add past year transaction', 'Compute overall income', 'Assert total'],
      expectedResult: 'Overall lifetime income equals 9000'
    });

    test('TC-DASH-008', 'Period Filtering - Custom Date Range', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const customStart = '2026-08-02';
      const customEnd = '2026-08-06';

      const filtered = state.transactions.filter(tx => tx.date >= customStart && tx.date <= customEnd);
      
      // Should match tx_init_02 (2026-08-03) and tx_init_03 (2026-08-05)
      expect(filtered.length).toBe(2);
    }, {
      description: 'Filters ledger transactions within custom start and end date boundary',
      steps: ['Set customStartDate and customEndDate', 'Filter transactions array'],
      expectedResult: 'Returns exactly 2 transactions in range'
    });

    test('TC-DASH-009', 'Recent Ledger Transactions Extraction & Slicing', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const recent5 = sortedTx.slice(0, 5);

      expect(recent5.length).toBe(4); // 4 transactions in initial mock
      expect(recent5[0].id).toBe('tx_init_04'); // Most recent date: 2026-08-10
      expect(recent5[recent5.length - 1].id).toBe('tx_init_01'); // Oldest: 2026-08-01
    }, {
      description: 'Verifies recent transactions table shows latest items sorted in descending date order',
      steps: ['Sort transactions by date desc', 'Slice top 5'],
      expectedResult: 'First transaction is latest (2026-08-10)'
    });

    test('TC-DASH-010', 'Currency Formatting Helper Presentation', () => {
      const formattedUSD = formatCurrency(1250.5, 'USD');
      const formattedNegative = formatCurrency(-45.2, 'USD');
      const formattedEUR = formatCurrency(800, 'EUR');

      expect(formattedUSD).toContain('$ 1,250.50');
      expect(formattedNegative).toContain('-$ 45.20');
      expect(formattedEUR).toContain('€ 800.00');
    }, {
      description: 'Validates currency symbols and formatting for positive, negative, and multi-currency values',
      steps: ['Call formatCurrency with USD, negative amount, and EUR'],
      expectedResult: 'Formats correctly with appropriate symbols and two decimals'
    });

  }, 'Dashboard metrics, balance calculation, period filters and recent ledger widgets');
}
