import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

export function registerReportsTests() {
  describe('Reports', () => {

    test('TC-REP-001', 'Monthly Financial Breakdown & Savings Rate Computation', () => {
      const db = createMockDatabase();
      const state = db.getState();

      let totalIncome = 0;
      let totalExpense = 0;

      state.transactions.forEach(tx => {
        const d = new Date(tx.date);
        if (d.getMonth() === 7 && d.getFullYear() === 2026) {
          if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
            totalIncome += tx.amount;
          } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type)) {
            totalExpense += tx.amount;
          }
        }
      });

      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

      expect(totalIncome).toBe(5000);
      expect(totalExpense).toBe(235);
      expect(netSavings).toBe(4765);
      expect(savingsRate).toBe('95.3');
    }, {
      description: 'Calculates monthly total income, total expenses, net savings, and savings rate percentage',
      steps: ['Aggregate August 2026 transactions', 'Compute net savings and savings rate percentage'],
      expectedResult: 'Income: 5000, Expense: 235, Net Savings: 4765, Savings Rate: 95.3%'
    });

    test('TC-REP-002', 'Yearly Monthly-by-Month Financial Trend Matrix', () => {
      const db = createMockDatabase();
      // Add transactions across different months of 2026
      db.addTransaction({ date: '2026-01-15', bankId: 'acc_boc_01', type: 'Income', amount: 4800 });
      db.addTransaction({ date: '2026-01-20', bankId: 'acc_boc_01', type: 'Expense', amount: 1200 });
      db.addTransaction({ date: '2026-02-15', bankId: 'acc_boc_01', type: 'Income', amount: 4800 });
      db.addTransaction({ date: '2026-02-22', bankId: 'acc_boc_01', type: 'Expense', amount: 900 });

      const state = db.getState();
      const monthsSummary = Array(12).fill(0).map(() => ({ income: 0, expense: 0, savings: 0 }));

      state.transactions.forEach(tx => {
        const d = new Date(tx.date);
        if (d.getFullYear() === 2026) {
          const m = d.getMonth();
          if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
            monthsSummary[m].income += tx.amount;
          } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type)) {
            monthsSummary[m].expense += tx.amount;
          }
          monthsSummary[m].savings = monthsSummary[m].income - monthsSummary[m].expense;
        }
      });

      // Month 0 (January): Income 4800, Expense 1200, Savings 3600
      // Month 1 (February): Income 4800, Expense 900, Savings 3900
      expect(monthsSummary[0].income).toBe(4800);
      expect(monthsSummary[0].expense).toBe(1200);
      expect(monthsSummary[0].savings).toBe(3600);

      expect(monthsSummary[1].income).toBe(4800);
      expect(monthsSummary[1].expense).toBe(900);
      expect(monthsSummary[1].savings).toBe(3900);
    }, {
      description: 'Generates 12-month summary matrix for yearly report graphs and table breakdowns',
      steps: ['Iterate 12 months for 2026', 'Aggregate monthly values for Jan and Feb'],
      expectedResult: 'Jan Savings: 3600, Feb Savings: 3900'
    });

    test('TC-REP-003', 'Expense Distribution by Category Calculation', () => {
      const db = createMockDatabase();
      const state = db.getState();

      const expenseByCategory = {};
      let totalExp = 0;

      state.transactions.forEach(tx => {
        if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type)) {
          expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
          totalExp += tx.amount;
        }
      });

      // Food & Dining: 150, Electricity: 85 -> Total: 235
      const foodPercentage = ((expenseByCategory['Food & Dining'] / totalExp) * 100).toFixed(1);
      const elecPercentage = ((expenseByCategory['Electricity'] / totalExp) * 100).toFixed(1);

      expect(foodPercentage).toBe('63.8');
      expect(elecPercentage).toBe('36.2');
    }, {
      description: 'Calculates percentage share of each expense category against total expenses for pie chart rendering',
      steps: ['Aggregate category expense totals', 'Calculate percentage of overall spending'],
      expectedResult: 'Food & Dining: 63.8%, Electricity: 36.2%'
    });

    test('TC-REP-004', 'Income Distribution by Category Calculation', () => {
      const db = createMockDatabase();
      db.addTransaction({
        date: '2026-08-15',
        bankId: 'acc_boc_01',
        type: 'Income',
        category: 'Interest',
        amount: 250
      });

      const state = db.getState();
      const incomeByCategory = {};
      state.transactions.forEach(tx => {
        if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
          incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
        }
      });

      expect(incomeByCategory['Salary']).toBe(5000);
      expect(incomeByCategory['Interest']).toBe(250);
    }, {
      description: 'Groups income streams into categories (Salary, Interest, Bonus, etc.)',
      steps: ['Add interest income', 'Aggregate income dictionary'],
      expectedResult: 'Salary: 5000, Interest: 250'
    });

    test('TC-REP-005', 'Bank Account Net Cash Flow Tracking', () => {
      const db = createMockDatabase();
      const state = db.getState();

      const accountFlows = {};
      state.accounts.forEach(a => {
        accountFlows[a.id] = { in: 0, out: 0, net: 0 };
      });

      state.transactions.forEach(tx => {
        if (accountFlows[tx.bankId]) {
          if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
            accountFlows[tx.bankId].in += tx.amount;
          } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Online/Account cash transfer', 'Bill & Payment'].includes(tx.type)) {
            accountFlows[tx.bankId].out += tx.amount;
          }
        }
        if (tx.type === 'Online/Account cash transfer' && accountFlows[tx.targetBankId]) {
          accountFlows[tx.targetBankId].in += tx.amount;
        }
      });

      // BOC: In 5000, Out (150 + 300 + 85) = 535
      // Cash wallet: In (300 from transfer) = 300, Out = 0
      expect(accountFlows['acc_boc_01'].in).toBe(5000);
      expect(accountFlows['acc_boc_01'].out).toBe(535);
      expect(accountFlows['acc_cash_wallet'].in).toBe(300);
    }, {
      description: 'Verifies inflow, outflow, and net liquidity change for each individual bank account',
      steps: ['Iterate accounts and transactions', 'Calculate In and Out flows per bank account'],
      expectedResult: 'Account flows accurately matched'
    });

    test('TC-REP-006', 'Custom Date Range Financial Analytics Report', () => {
      const db = createMockDatabase();
      const startDate = '2026-08-01';
      const endDate = '2026-08-04';

      const state = db.getState();
      const filtered = state.transactions.filter(t => t.date >= startDate && t.date <= endDate);

      // Matches tx_init_01 (Aug 1, 5000) and tx_init_02 (Aug 3, 150)
      expect(filtered.length).toBe(2);
    }, {
      description: 'Generates report dataset bounded by custom date filters',
      steps: ['Filter transactions between 2026-08-01 and 2026-08-04'],
      expectedResult: 'Returns exactly 2 transactions'
    });

    test('TC-REP-007', 'Excel Export Data Structure Preparation', () => {
      const db = createMockDatabase();
      const state = db.getState();

      const exportRows = state.transactions.map(tx => ({
        Date: tx.date,
        Type: tx.type,
        Category: tx.category,
        Payee: tx.payee || '',
        Amount: tx.amount,
        Description: tx.description
      }));

      expect(exportRows.length).toBe(4);
      expect(Object.keys(exportRows[0])).toContain('Date');
      expect(Object.keys(exportRows[0])).toContain('Amount');
      expect(Object.keys(exportRows[0])).toContain('Description');
    }, {
      description: 'Validates that data prepared for Excel/XLSX export includes all required column mappings',
      steps: ['Map transactions to tabular Excel format', 'Assert column headers'],
      expectedResult: 'Formatted correctly for XLSX sheet generator'
    });

    test('TC-REP-008', 'PDF Report AutoTable Rows Formatting', () => {
      const transactions = [
        { date: '2026-08-01', description: 'Salary', category: 'Salary', type: 'Income', amount: 5000 },
        { date: '2026-08-03', description: 'Dinner', category: 'Food & Dining', type: 'Expense', amount: 150 }
      ];

      const tableRows = transactions.map(tx => [
        tx.date,
        tx.description,
        tx.category,
        tx.type,
        `$ ${tx.amount.toFixed(2)}`
      ]);

      expect(tableRows.length).toBe(2);
      expect(tableRows[0][4]).toBe('$ 5000.00');
      expect(tableRows[1][4]).toBe('$ 150.00');
    }, {
      description: 'Prepares formatted row arrays for jsPDF AutoTable report generation',
      steps: ['Map transactions to array of string arrays', 'Assert formatted amount columns'],
      expectedResult: 'Compatible with jsPDF AutoTable structure'
    });

  }, 'Financial analytics, category breakdown, cash flow reports, and export datasets');
}
