import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

function processSubscriptionRenewals(data) {
  const today = new Date().toISOString().split('T')[0];
  const updatedSubscriptions = [];
  const newTransactionsToAdd = [];
  let hasRenewals = false;

  (data.subscriptions || []).forEach(sub => {
    let nextRenewal = sub.nextRenewalDate || sub.startDate;
    let currentSub = { ...sub };
    
    if (sub.status === 'Active') {
      while (nextRenewal && nextRenewal <= today) {
        hasRenewals = true;
        
        newTransactionsToAdd.push({
          id: `tx_sub_${sub.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date: nextRenewal,
          bankId: sub.bankAccountId || (data.accounts[0]?.id || ''),
          type: 'Bill & Payment',
          category: 'Subscriptions',
          payee: sub.name,
          amount: sub.cost,
          description: `Subscription Auto-Renewal: ${sub.name}`
        });

        const date = new Date(nextRenewal);
        if (sub.billingCycle === 'Monthly') {
          date.setMonth(date.getMonth() + 1);
        } else {
          date.setFullYear(date.getFullYear() + 1);
        }
        nextRenewal = date.toISOString().split('T')[0];
      }
      currentSub.nextRenewalDate = nextRenewal;
    }
    updatedSubscriptions.push(currentSub);
  });

  if (hasRenewals) {
    return {
      ...data,
      subscriptions: updatedSubscriptions,
      transactions: [...(data.transactions || []), ...newTransactionsToAdd]
    };
  }
  return data;
}

export function registerSubscriptionsTests() {
  describe('Subscriptions', () => {

    test('TC-SUB-001', 'Add New Recurring Subscription', () => {
      const db = createMockDatabase();
      const newSub = db.addSubscription({
        name: 'Music Streaming Premium',
        cost: 9.99,
        billingCycle: 'Monthly',
        category: 'Subscriptions',
        bankAccountId: 'acc_boc_01',
        startDate: '2026-08-01',
        nextRenewalDate: '2026-09-01',
        status: 'Active'
      });

      const state = db.getState();
      const created = state.subscriptions.find(s => s.id === newSub.id);
      expect(created).toBeDefined();
      expect(created.name).toBe('Music Streaming Premium');
      expect(created.cost).toBe(9.99);
      expect(created.billingCycle).toBe('Monthly');
    }, {
      description: 'Adds a recurring subscription with monthly billing cycle',
      steps: ['Call addSubscription with subscription details', 'Verify subscription stored in state'],
      expectedResult: 'Subscription successfully created'
    });

    test('TC-SUB-002', 'Edit Subscription Details & Billing Cost', () => {
      const db = createMockDatabase();
      db.editSubscription('sub_init_01', {
        cost: 15.00,
        billingCycle: 'Monthly',
        status: 'Active'
      });

      const state = db.getState();
      const updated = state.subscriptions.find(s => s.id === 'sub_init_01');
      expect(updated.cost).toBe(15.00);
    }, {
      description: 'Edits existing subscription attributes (cost, cycle, status)',
      steps: ['Call editSubscription with updated cost 15.00', 'Assert updated cost in state'],
      expectedResult: 'Subscription cost updated'
    });

    test('TC-SUB-003', 'Delete Subscription', () => {
      const db = createMockDatabase();
      db.deleteSubscription('sub_init_01');

      const state = db.getState();
      const found = state.subscriptions.find(s => s.id === 'sub_init_01');
      expect(found).toBeUndefined();
    }, {
      description: 'Deletes a subscription from the subscriptions list',
      steps: ['Call deleteSubscription with sub_init_01', 'Assert subscription is removed'],
      expectedResult: 'Subscription removed'
    });

    test('TC-SUB-004', 'Calculate Monthly and Annualized Subscription Costs', () => {
      const subscriptions = [
        { name: 'Monthly App A', cost: 10, billingCycle: 'Monthly', status: 'Active' },
        { name: 'Monthly App B', cost: 20, billingCycle: 'Monthly', status: 'Active' },
        { name: 'Annual App C', cost: 120, billingCycle: 'Yearly', status: 'Active' },
        { name: 'Cancelled App D', cost: 50, billingCycle: 'Monthly', status: 'Cancelled' }
      ];

      let monthlyTotal = 0;
      let yearlyTotal = 0;

      subscriptions.filter(s => s.status === 'Active').forEach(s => {
        if (s.billingCycle === 'Monthly') {
          monthlyTotal += s.cost;
          yearlyTotal += s.cost * 12;
        } else {
          monthlyTotal += s.cost / 12;
          yearlyTotal += s.cost;
        }
      });

      // Monthly App A (10) + Monthly App B (20) + Annual App C (120/12 = 10) = 40
      // Yearly: 10*12 + 20*12 + 120 = 480
      expect(monthlyTotal).toBe(40);
      expect(yearlyTotal).toBe(480);
    }, {
      description: 'Computes monthly and annualized cost across active subscriptions while ignoring cancelled ones',
      steps: ['Filter active subscriptions', 'Convert monthly and yearly cycles into normalized monthly and annual costs'],
      expectedResult: 'Monthly cost is 40.00, Annual cost is 480.00'
    });

    test('TC-SUB-005', 'Auto-Renewal Engine - Monthly Subscription Renewal & Date Advance', () => {
      const initialData = {
        accounts: [{ id: 'acc_1', bankName: 'BOC' }],
        transactions: [],
        subscriptions: [
          {
            id: 'sub_due_monthly',
            name: 'Streaming Service',
            cost: 15,
            billingCycle: 'Monthly',
            bankAccountId: 'acc_1',
            status: 'Active',
            startDate: '2026-07-01',
            nextRenewalDate: '2026-08-01' // Due as of current date in Aug 2026
          }
        ]
      };

      const renewed = processSubscriptionRenewals(initialData);
      const renewedSub = renewed.subscriptions.find(s => s.id === 'sub_due_monthly');

      // Next renewal date should advance to 2026-09-01
      expect(renewedSub.nextRenewalDate).toBe('2026-09-01');
    }, {
      description: 'Detects due monthly subscription and advances nextRenewalDate by 1 month',
      steps: ['Pass subscription with past nextRenewalDate into processSubscriptionRenewals', 'Assert nextRenewalDate'],
      expectedResult: 'nextRenewalDate advanced by 1 month to 2026-09-01'
    });

    test('TC-SUB-006', 'Auto-Renewal Engine - Yearly Subscription Renewal & Date Advance', () => {
      const initialData = {
        accounts: [{ id: 'acc_1', bankName: 'BOC' }],
        transactions: [],
        subscriptions: [
          {
            id: 'sub_due_yearly',
            name: 'Annual Domain Hosting',
            cost: 80,
            billingCycle: 'Yearly',
            bankAccountId: 'acc_1',
            status: 'Active',
            startDate: '2025-08-01',
            nextRenewalDate: '2026-08-01'
          }
        ]
      };

      const renewed = processSubscriptionRenewals(initialData);
      const renewedSub = renewed.subscriptions.find(s => s.id === 'sub_due_yearly');

      expect(renewedSub.nextRenewalDate).toBe('2027-08-01');
    }, {
      description: 'Detects due yearly subscription and advances nextRenewalDate by 1 year',
      steps: ['Pass yearly subscription with past nextRenewalDate into processSubscriptionRenewals', 'Assert nextRenewalDate'],
      expectedResult: 'nextRenewalDate advanced by 1 year to 2027-08-01'
    });

    test('TC-SUB-007', 'Auto-Renewal Engine - Automatic Generation of Ledger Renewal Transaction', () => {
      const initialData = {
        accounts: [{ id: 'acc_1', bankName: 'BOC' }],
        transactions: [],
        subscriptions: [
          {
            id: 'sub_auto_tx',
            name: 'Cloud Pro',
            cost: 25,
            billingCycle: 'Monthly',
            bankAccountId: 'acc_1',
            status: 'Active',
            nextRenewalDate: '2026-08-01'
          }
        ]
      };

      const renewed = processSubscriptionRenewals(initialData);
      expect(renewed.transactions.length).toBe(1);
      
      const createdTx = renewed.transactions[0];
      expect(createdTx.type).toBe('Bill & Payment');
      expect(createdTx.category).toBe('Subscriptions');
      expect(createdTx.amount).toBe(25);
      expect(createdTx.payee).toBe('Cloud Pro');
      expect(createdTx.description).toBe('Subscription Auto-Renewal: Cloud Pro');
    }, {
      description: 'Verifies auto-renewal engine automatically posts expense transaction into the ledger for renewed subscriptions',
      steps: ['Process due renewal', 'Check transactions array for generated auto-renewal entry'],
      expectedResult: 'Bill & Payment transaction created with category "Subscriptions" and amount 25.00'
    });

    test('TC-SUB-008', 'Subscription Status Filtering (Active vs Cancelled)', () => {
      const db = createMockDatabase();
      db.addSubscription({
        name: 'Inactive Newspaper',
        cost: 5,
        billingCycle: 'Monthly',
        status: 'Cancelled'
      });

      const state = db.getState();
      const activeSubs = state.subscriptions.filter(s => s.status === 'Active');
      const cancelledSubs = state.subscriptions.filter(s => s.status === 'Cancelled');

      expect(activeSubs.length).toBe(2);
      expect(cancelledSubs.length).toBe(1);
    }, {
      description: 'Filters subscriptions by status (Active vs Cancelled/Paused)',
      steps: ['Add cancelled subscription', 'Filter by status'],
      expectedResult: 'Active and Cancelled subscriptions accurately segregated'
    });

  }, 'Subscription lifecycle, cost computation, and auto-renewal scheduler');
}
