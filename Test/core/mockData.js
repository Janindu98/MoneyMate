/**
 * Test Mock Data & In-Memory Store Simulation for MoneyMate
 */

export function getInitialMockData() {
  return {
    accounts: [
      {
        id: 'acc_cash_wallet',
        bankName: 'Cash',
        accountName: 'Cash Wallet',
        accountNumber: '',
        branch: 'Main',
        accountType: 'Cash / Other',
        currency: 'USD',
        status: 'Active'
      },
      {
        id: 'acc_boc_01',
        bankName: 'Bank of Ceylon',
        accountName: 'Personal Checking',
        accountNumber: '8910234567',
        branch: 'City Center',
        accountType: 'Checking',
        currency: 'USD',
        status: 'Active'
      },
      {
        id: 'acc_com_02',
        bankName: 'Commercial Bank',
        accountName: 'Savings Plus',
        accountNumber: '1092837465',
        branch: 'Metro',
        accountType: 'Savings',
        currency: 'USD',
        status: 'Active'
      }
    ],
    transactions: [
      {
        id: 'tx_init_01',
        date: '2026-08-01',
        bankId: 'acc_boc_01',
        type: 'Income',
        category: 'Salary',
        payee: 'Acme Corp',
        amount: 5000,
        description: 'Monthly Salary August 2026',
        salaryRecordId: 'sal_init_01'
      },
      {
        id: 'tx_init_02',
        date: '2026-08-03',
        bankId: 'acc_boc_01',
        type: 'Expense',
        category: 'Food & Dining',
        payee: 'Metro Bistro',
        amount: 150,
        description: 'Dinner with team'
      },
      {
        id: 'tx_init_03',
        date: '2026-08-05',
        bankId: 'acc_boc_01',
        targetBankId: 'acc_cash_wallet',
        type: 'Online/Account cash transfer',
        category: 'Money Transfer',
        payee: 'Self',
        amount: 300,
        description: 'ATM Cash Withdrawal to Wallet'
      },
      {
        id: 'tx_init_04',
        date: '2026-08-10',
        bankId: 'acc_boc_01',
        type: 'Bill & Payment',
        category: 'Electricity',
        payee: 'City Power',
        amount: 85,
        description: 'August Electricity Bill'
      }
    ],
    categories: {
      income: ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
      expense: [
        'Food & Dining',
        'Groceries',
        'Transportation',
        'Fuel',
        'Healthcare & Medical',
        'Shopping',
        'Family & Gifts',
        'Education',
        'Other'
      ],
      'Income': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
      'Expense': [
        'Food & Dining',
        'Groceries',
        'Transportation',
        'Fuel',
        'Healthcare & Medical',
        'Shopping',
        'Family & Gifts',
        'Education',
        'Other'
      ],
      'Online/Account cash transfer': ['Money Transfer', 'Wallet Transfer'],
      'Deposit': ['Cash Deposit', 'Bank Deposit', 'Other Deposit'],
      'Withdrawal': ['Cash Withdrawal', 'ATM Withdrawal', 'Other'],
      'Online Payment': ['Food & Dining', 'Groceries', 'Fuel', 'Shopping', 'Transportations', 'Healthcare & Medical', 'Education', 'Transaction Charges', 'Other'],
      'Bill & Payment': [
        'Electricity',
        'Water',
        'Internet',
        'Mobile phone',
        'Insurance',
        'Credit cards',
        'Rent',
        'Alert Charges',
        'Debit Card Annual Fee',
        'Subscriptions',
        'Government Payment',
        'Other'
      ]
    },
    salaryHistory: [
      {
        id: 'sal_init_01',
        employerId: 'EMP-9081',
        company: 'Acme Corp',
        position: 'Senior Engineer',
        year: '2026',
        month: 'August',
        paymentDate: '2026-08-01',
        bankAccount: 'acc_boc_01',
        basicSalary: 4500,
        fixedAllowance: 500,
        otherAllowances: 200,
        bonus: 300,
        overtime: 150,
        grossEarnings: 5650,
        epfEmployee: 360,
        epfCompany: 540,
        etfCompany: 135,
        tax: 290,
        taxType: 'APIT',
        loanDeduction: 0,
        otherDeduction: 0,
        totalDeductions: 650,
        netSalary: 5000,
        payslipPath: ''
      }
    ],
    subscriptions: [
      {
        id: 'sub_init_01',
        name: 'Cloud Storage Pro',
        cost: 12,
        billingCycle: 'Monthly',
        category: 'Subscriptions',
        bankAccountId: 'acc_boc_01',
        startDate: '2026-01-15',
        nextRenewalDate: '2026-09-15',
        status: 'Active'
      },
      {
        id: 'sub_init_02',
        name: 'Developer Annual Tool',
        cost: 120,
        billingCycle: 'Yearly',
        category: 'Subscriptions',
        bankAccountId: 'acc_boc_01',
        startDate: '2026-02-01',
        nextRenewalDate: '2027-02-01',
        status: 'Active'
      }
    ],
    settings: {
      currency: 'USD',
      theme: 'dark',
      fontSize: 'medium',
      securityType: 'none',
      budgetLimits: {
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
      },
      billLimits: {
        Electricity: 8000,
        Water: 2000,
        Internet: 5000,
        Mobile: 3000,
        Insurance: 15000,
        CreditCards: 25000,
        Rent: 45000,
        Subscriptions: 10000
      }
    },
    profile: {
      name: 'Jane Doe',
      employeeId: 'EMP-9081',
      company: 'Acme Corp',
      designation: 'Senior Engineer',
      bankName: 'Bank of Ceylon',
      accountNumber: '8910234567',
      taxId: 'TAX-88902',
      epfId: 'EPF-11029',
      etfId: 'ETF-77291',
      contributions: [
        {
          id: 'contrib_epf',
          name: 'EPF (Employees Provident Fund)',
          memberId: 'EPF-11029',
          employeeRate: 8,
          employerRate: 12
        },
        {
          id: 'contrib_etf',
          name: 'ETF (Employees Trust Fund)',
          memberId: 'ETF-77291',
          employeeRate: 0,
          employerRate: 3
        }
      ]
    }
  };
}

/**
 * Creates an isolated mock database manager instance for test executions
 */
export function createMockDatabase(initialData = null) {
  let state = JSON.parse(JSON.stringify(initialData || getInitialMockData()));

  return {
    getState: () => JSON.parse(JSON.stringify(state)),
    setState: (newState) => {
      state = JSON.parse(JSON.stringify(newState));
    },

    // Accounts
    addAccount: (acc, initialBalance = 0) => {
      const accountId = acc.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newAccount = { id: accountId, status: 'Active', currency: 'USD', ...acc };
      state.accounts.push(newAccount);

      if (initialBalance > 0) {
        state.transactions.push({
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString().split('T')[0],
          bankId: accountId,
          type: 'Deposit',
          category: 'Other',
          payee: 'Self',
          amount: initialBalance,
          description: 'Opening balance'
        });
      }
      return newAccount;
    },

    editAccount: (id, updated) => {
      state.accounts = state.accounts.map(a => a.id === id ? { ...a, ...updated } : a);
    },

    deleteAccount: (id) => {
      state.accounts = state.accounts.filter(a => a.id !== id);
      state.transactions = state.transactions.filter(t => t.bankId !== id && t.targetBankId !== id);
      state.salaryHistory = state.salaryHistory.filter(s => s.bankAccount !== id);
    },

    // Transactions
    addTransaction: (tx) => {
      const newTx = { id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...tx };
      state.transactions.push(newTx);
      return newTx;
    },

    editTransaction: (id, updated) => {
      state.transactions = state.transactions.map(t => t.id === id ? { ...t, ...updated } : t);
    },

    deleteTransaction: (id) => {
      state.transactions = state.transactions.filter(t => t.id !== id);
    },

    // Categories
    addCategory: (type, categoryName) => {
      const list = state.categories[type] || [];
      if (list.includes(categoryName)) return false;
      state.categories[type] = [...list, categoryName];
      if (type === 'Income' && state.categories.income) {
        state.categories.income = [...state.categories.income, categoryName];
      }
      if (type === 'Expense' && state.categories.expense) {
        state.categories.expense = [...state.categories.expense, categoryName];
      }
      return true;
    },

    deleteCategory: (type, categoryName) => {
      const defaults = {
        'Income': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
        'Expense': ['Food & Dining', 'Groceries', 'Transportation', 'Fuel', 'Healthcare & Medical', 'Shopping', 'Family & Gifts', 'Education', 'Other'],
        'Online/Account cash transfer': ['Money Transfer', 'Wallet Transfer'],
        'Deposit': ['Cash Deposit', 'Bank Deposit', 'Other Deposit'],
        'Withdrawal': ['Cash Withdrawal', 'ATM Withdrawal', 'Other'],
        'Online Payment': ['Food & Dining', 'Groceries', 'Fuel', 'Shopping', 'Transportations', 'Healthcare & Medical', 'Education', 'Transaction Charges', 'Other'],
        'Bill & Payment': ['Electricity', 'Water', 'Internet', 'Mobile phone', 'Insurance', 'Credit cards', 'Rent', 'Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment', 'Other']
      };
      if ((defaults[type] || []).includes(categoryName)) return false;
      const list = state.categories[type] || [];
      state.categories[type] = list.filter(c => c !== categoryName);
      return true;
    },

    // Salary
    addSalaryRecord: (sal) => {
      const salaryId = sal.id || `sal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newSal = { id: salaryId, ...sal };
      state.salaryHistory.push(newSal);

      if (newSal.netSalary > 0) {
        state.transactions.push({
          id: `tx_sal_${salaryId}`,
          date: newSal.paymentDate,
          bankId: newSal.bankAccount,
          type: 'Income',
          category: 'Salary',
          payee: newSal.company || 'Employer',
          amount: newSal.netSalary,
          description: `Salary: ${newSal.month} ${newSal.year}`,
          salaryRecordId: salaryId
        });
      }
      return newSal;
    },

    editSalaryRecord: (id, updated) => {
      state.salaryHistory = state.salaryHistory.map(s => s.id === id ? { ...s, ...updated } : s);
      state.transactions = state.transactions.map(t => {
        if (t.salaryRecordId === id) {
          return {
            ...t,
            date: updated.paymentDate || t.date,
            bankId: updated.bankAccount || t.bankId,
            payee: updated.company || t.payee,
            amount: updated.netSalary !== undefined ? updated.netSalary : t.amount
          };
        }
        return t;
      });
    },

    deleteSalaryRecord: (id) => {
      const targetSalary = state.salaryHistory.find(s => s.id === id);
      state.salaryHistory = state.salaryHistory.filter(s => s.id !== id);
      state.transactions = state.transactions.filter(t => {
        if (t.salaryRecordId === id) return false;
        if (targetSalary && !t.salaryRecordId && t.category === 'Salary' && t.amount === targetSalary.netSalary && t.date === targetSalary.paymentDate) {
          return false;
        }
        return true;
      });
    },

    // Subscriptions
    addSubscription: (sub) => {
      const newSub = { id: sub.id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...sub };
      state.subscriptions.push(newSub);
      return newSub;
    },

    editSubscription: (id, updated) => {
      state.subscriptions = state.subscriptions.map(s => s.id === id ? { ...s, ...updated } : s);
    },

    deleteSubscription: (id) => {
      state.subscriptions = state.subscriptions.filter(s => s.id !== id);
    },

    // Settings & Profile
    updateSettings: (newSettings) => {
      state.settings = { ...state.settings, ...newSettings };
    },

    updateProfile: (newProfile) => {
      state.profile = { ...state.profile, ...newProfile };
    }
  };
}
