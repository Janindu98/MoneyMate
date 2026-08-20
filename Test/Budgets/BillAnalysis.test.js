import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

export function registerBillAnalysisTests() {
  describe('BillAnalysis', () => {

    test('TC-BILL-001', 'Group Bill & Payment Transactions by Utility Category', () => {
      const db = createMockDatabase();
      // Add multiple bill transactions for August 2026
      db.addTransaction({
        date: '2026-08-05',
        bankId: 'acc_boc_01',
        type: 'Bill & Payment',
        category: 'Water',
        amount: 45
      });
      db.addTransaction({
        date: '2026-08-07',
        bankId: 'acc_boc_01',
        type: 'Bill & Payment',
        category: 'Internet',
        amount: 60
      });
      db.addTransaction({
        date: '2026-08-09',
        bankId: 'acc_boc_01',
        type: 'Bill & Payment',
        category: 'Electricity',
        amount: 115
      });

      const state = db.getState();
      const billsByCategory = {};

      state.transactions.forEach(tx => {
        if (tx.type === 'Bill & Payment') {
          billsByCategory[tx.category] = (billsByCategory[tx.category] || 0) + tx.amount;
        }
      });

      // Initial mock had 85 for Electricity
      // Total Electricity = 85 + 115 = 200
      expect(billsByCategory['Electricity']).toBe(200);
      expect(billsByCategory['Water']).toBe(45);
      expect(billsByCategory['Internet']).toBe(60);
    }, {
      description: 'Groups all Bill & Payment transactions by specific utility category for the month',
      steps: ['Filter Bill & Payment transactions', 'Aggregate sums per category dictionary'],
      expectedResult: 'Electricity: 200, Water: 45, Internet: 60'
    });

    test('TC-BILL-002', 'Bill Spending vs Configured Bill Limits Evaluation', () => {
      const billLimits = {
        Electricity: 8000,
        Water: 2000,
        Internet: 5000,
        Mobile: 3000,
        Insurance: 15000,
        CreditCards: 25000,
        Rent: 45000,
        Subscriptions: 10000
      };

      const billSpending = {
        Electricity: 7200,
        Water: 2400 // Exceeded
      };

      const electricityStatus = billSpending.Electricity <= billLimits.Electricity ? 'within_limit' : 'exceeded';
      const waterStatus = billSpending.Water <= billLimits.Water ? 'within_limit' : 'exceeded';

      expect(electricityStatus).toBe('within_limit');
      expect(waterStatus).toBe('exceeded');
    }, {
      description: 'Compares category bill spending against configured bill limits to identify overages',
      steps: ['Evaluate bill spending vs limit thresholds for Electricity and Water'],
      expectedResult: 'Electricity is within limit; Water is flagged exceeded'
    });

    test('TC-BILL-003', 'Total Utility Bills Aggregation and Percentage Distribution', () => {
      const billItems = [
        { category: 'Electricity', amount: 200 },
        { category: 'Water', amount: 50 },
        { category: 'Internet', amount: 100 },
        { category: 'Rent', amount: 650 }
      ];

      const totalBills = billItems.reduce((sum, b) => sum + b.amount, 0);
      const rentShare = (650 / totalBills) * 100;

      expect(totalBills).toBe(1000);
      expect(rentShare).toBe(65);
    }, {
      description: 'Calculates total utility bills sum and individual category percentage shares',
      steps: ['Sum all utility bill amounts', 'Compute percentage share for Rent category'],
      expectedResult: 'Total bills sum is 1000 and Rent represents 65%'
    });

  }, 'Recurring bill analysis, utility breakdowns, and bill limit evaluations');
}
