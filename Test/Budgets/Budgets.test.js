import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

export function registerBudgetsTests() {
  describe('Budgets', () => {

    test('TC-BUD-001', 'Configure and Update Category Monthly Budget Limits', () => {
      const db = createMockDatabase();
      db.updateSettings({
        budgetLimits: {
          FoodDining: 25000,
          BillPayment: 35000,
          Groceries: 18000,
          Transportation: 6000,
          Fuel: 22000,
          HealthcareMedical: 12000,
          Shopping: 16000,
          Education: 15000,
          Withdrawal: 10000,
          Others: 14000
        }
      });

      const state = db.getState();
      expect(state.settings.budgetLimits.FoodDining).toBe(25000);
      expect(state.settings.budgetLimits.Groceries).toBe(18000);
      expect(state.settings.budgetLimits.BillPayment).toBe(35000);
    }, {
      description: 'Updates budget limits across standard expense categories and verifies persistence',
      steps: ['Invoke updateSettings with new budgetLimits object', 'Assert state.settings.budgetLimits'],
      expectedResult: 'Budget limits saved in settings'
    });

    test('TC-BUD-002', 'Monthly Expense Aggregation per Budget Category', () => {
      const db = createMockDatabase();
      // Add transactions in August 2026 for Food & Dining
      db.addTransaction({
        date: '2026-08-04',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Food & Dining',
        amount: 250
      });
      db.addTransaction({
        date: '2026-08-08',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Food & Dining',
        amount: 100
      });

      const state = db.getState();
      let foodExpenses = 0;

      state.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getMonth() === 7 && txDate.getFullYear() === 2026) {
          if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Bill & Payment'].includes(tx.type)) {
            if (tx.category === 'Food & Dining' || tx.category === 'Food') {
              foodExpenses += tx.amount;
            }
          }
        }
      });

      // initial 150 + 250 + 100 = 500
      expect(foodExpenses).toBe(500);
    }, {
      description: 'Aggregates all expense transactions for a specific category within the selected month',
      steps: ['Add multiple Food & Dining transactions', 'Compute category sum for Aug 2026', 'Assert total'],
      expectedResult: 'Category monthly expense accurately summed as 500.00'
    });

    test('TC-BUD-003', 'Budget Progress Percentage and Remaining Budget Calculation', () => {
      const budgetLimit = 20000;
      const actualSpent = 15000;
      const progressPercent = Math.min(Math.round((actualSpent / budgetLimit) * 100), 100);
      const remaining = Math.max(budgetLimit - actualSpent, 0);

      expect(progressPercent).toBe(75);
      expect(remaining).toBe(5000);
    }, {
      description: 'Calculates budget utilization percentage and remaining spendable allowance',
      steps: ['Compute spent/limit ratio', 'Compute remaining balance'],
      expectedResult: 'Progress is 75% and Remaining is 5000.00'
    });

    test('TC-BUD-004', 'Budget Alert Status Triggers (Normal, Warning, Exceeded)', () => {
      function getBudgetStatus(spent, limit) {
        if (limit <= 0) return 'normal';
        const ratio = spent / limit;
        if (ratio >= 1.0) return 'exceeded';
        if (ratio >= 0.8) return 'warning';
        return 'normal';
      }

      expect(getBudgetStatus(5000, 10000)).toBe('normal'); // 50%
      expect(getBudgetStatus(8500, 10000)).toBe('warning'); // 85%
      expect(getBudgetStatus(10500, 10000)).toBe('exceeded'); // 105%
    }, {
      description: 'Validates status thresholds: Normal under 80%, Warning at 80-99%, Exceeded at 100%+',
      steps: ['Evaluate getBudgetStatus at 50%, 85%, and 105% utilization'],
      expectedResult: 'Returns "normal", "warning", and "exceeded" correctly'
    });

    test('TC-BUD-005', 'Custom Category Budget Limits Configuration', () => {
      const db = createMockDatabase();
      const currentLimits = db.getState().settings.budgetLimits || {};
      db.updateSettings({
        budgetLimits: {
          ...currentLimits,
          'Hobbies & Gaming': 8000,
          'Charity': 5000
        }
      });

      const state = db.getState();
      expect(state.settings.budgetLimits['Hobbies & Gaming']).toBe(8000);
      expect(state.settings.budgetLimits['Charity']).toBe(5000);
    }, {
      description: 'Allows users to configure and persist custom budget limits for non-standard categories',
      steps: ['Add custom keys to budgetLimits settings', 'Verify custom keys are retained in state'],
      expectedResult: 'Custom category budget limits saved properly'
    });

    test('TC-BUD-006', 'Overall Monthly Budget vs Total Monthly Expenses Comparison', () => {
      const limits = {
        FoodDining: 20000,
        BillPayment: 30000,
        Groceries: 15000,
        Transportation: 5000,
        Fuel: 20000,
        HealthcareMedical: 10000,
        Shopping: 15000,
        Education: 10000,
        Withdrawal: 10000,
        Others: 12000
      };

      const totalBudget = Object.values(limits).reduce((sum, val) => sum + val, 0);
      const totalExpenses = 45000;
      const overallProgress = (totalExpenses / totalBudget) * 100;

      expect(totalBudget).toBe(147000);
      expect(Math.round(overallProgress)).toBe(31);
    }, {
      description: 'Calculates total overall budget limit and aggregate monthly progress across all categories',
      steps: ['Sum all individual category limits', 'Compute ratio against total monthly spending'],
      expectedResult: 'Total budget is 147000 and overall utilization is 31%'
    });

  }, 'Monthly budget limits, expense tracking against budgets, and alert thresholds');
}
