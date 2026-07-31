import fs from 'node:fs';
import path from 'node:path';

export default class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.getInitialState();
  }

  getInitialState() {
    return {
      accounts: [
        {
          id: 'acc_commercial_bank',
          bankName: 'Commercial Bank',
          accountName: 'Personal Savings',
          accountNumber: '5678',
          branch: 'Kandy',
          accountType: 'Savings',
          currency: 'LKR',
          status: 'Active'
        },
        {
          id: 'acc_cash_wallet',
          bankName: 'Cash',
          accountName: 'Physical Wallet',
          accountNumber: '',
          branch: 'Main',
          accountType: 'Cash / Other',
          currency: 'LKR',
          status: 'Active'
        }
      ],
      transactions: [
        {
          id: 'tx_init_commercial',
          date: new Date().toISOString().split('T')[0],
          bankId: 'acc_commercial_bank',
          type: 'Deposit',
          category: 'Other',
          payee: 'Self',
          amount: 150000.00,
          description: 'Initial deposit'
        },
        {
          id: 'tx_init_cash',
          date: new Date().toISOString().split('T')[0],
          bankId: 'acc_cash_wallet',
          type: 'Deposit',
          category: 'Other',
          payee: 'Self',
          amount: 10000.00,
          description: 'Cash opening balance'
        }
      ],
      categories: {
        income: ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
        expense: [
          'Food',
          'Fuel',
          'Shopping',
          'Transportations',
          'Electricity',
          'Water',
          'Internet',
          'Mobile phone',
          'Insurance',
          'Credit cards',
          'Rent',
          'Other'
        ],
        'Income': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
        'Expense': ['Food', 'Fuel', 'Shopping', 'Transportations', 'Other'],
        'Online/Account cash transfer': ['Money Transfer'],
        'Deposit': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
        'Withdrawal': ['Cash Withdrawal', 'ATM Withdrawal', 'Other'],
        'Online Payment': ['Food', 'Fuel', 'Shopping', 'Transportations', 'Other'],
        'Bill & Payment': [
          'Electricity',
          'Water',
          'Internet',
          'Mobile phone',
          'Insurance',
          'Credit cards',
          'Rent',
          'Other'
        ]
      },
      salaryHistory: [],
      subscriptions: [],
      settings: {
        currency: 'LKR',
        theme: 'dark',
        budgetLimits: {
          Food: 35000,
          Fuel: 20000,
          Bills: 18000,
          Shopping: 15000,
          Others: 12000,
          Transportations: 5000
        },
        billLimits: {
          Electricity: 8000,
          Water: 2000,
          Internet: 5000,
          Mobile: 3000,
          Insurance: 15000,
          CreditCards: 25000,
          Rent: 45000
        }
      },
      profile: {
        name: '',
        employeeId: '',
        company: '',
        designation: '',
        bankName: '',
        accountNumber: '',
        taxId: '',
        epfId: '',
        etfId: ''
      }
    };
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
        this.ensureSchema();
      } else {
        // Create directory and initial file
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        this.save();
      }
    } catch (error) {
      console.error('Error loading database:', error);
      // Back up corrupt file
      if (fs.existsSync(this.filePath)) {
        try {
          const backupPath = `${this.filePath}.corrupt.${Date.now()}`;
          fs.renameSync(this.filePath, backupPath);
          console.warn(`Database was corrupt. Backed up to ${backupPath}`);
        } catch (backupError) {
          console.error('Failed to backup corrupt database:', backupError);
        }
      }
      this.data = this.getInitialState();
      this.save();
    }
    return this.data;
  }

  ensureSchema() {
    if (!this.data) this.data = this.getInitialState();
    if (!Array.isArray(this.data.accounts)) this.data.accounts = [];
    if (!Array.isArray(this.data.transactions)) this.data.transactions = [];
    if (!this.data.categories) {
      this.data.categories = this.getInitialState().categories;
    }
    if (!Array.isArray(this.data.categories.income)) {
      this.data.categories.income = this.getInitialState().categories.income;
    }
    if (!Array.isArray(this.data.categories.expense)) {
      this.data.categories.expense = this.getInitialState().categories.expense;
    }
    
    // Migrate categories for individual payment types
    const currentCats = this.data.categories;
    const initialCats = this.getInitialState().categories;
    const paymentTypes = ['Income', 'Expense', 'Online/Account cash transfer', 'Deposit', 'Withdrawal', 'Online Payment', 'Bill & Payment'];
    paymentTypes.forEach(pt => {
      if (!Array.isArray(currentCats[pt])) {
        if (pt === 'Income') currentCats[pt] = currentCats.income || initialCats['Income'];
        else if (pt === 'Expense') currentCats[pt] = currentCats.expense || initialCats['Expense'];
        else if (pt === 'Deposit') currentCats[pt] = currentCats.income || initialCats['Deposit'];
        else if (pt === 'Withdrawal') currentCats[pt] = initialCats['Withdrawal'];
        else if (pt === 'Online/Account cash transfer') currentCats[pt] = initialCats['Online/Account cash transfer'];
        else if (pt === 'Online Payment') currentCats[pt] = currentCats.expense || initialCats['Online Payment'];
        else if (pt === 'Bill & Payment') currentCats[pt] = initialCats['Bill & Payment'];
      }
    });
    if (!Array.isArray(this.data.salaryHistory)) this.data.salaryHistory = [];
    if (!Array.isArray(this.data.subscriptions)) this.data.subscriptions = [];
    if (!this.data.settings) this.data.settings = this.getInitialState().settings;
    if (!this.data.settings.currency) this.data.settings.currency = 'LKR';
    if (!this.data.settings.theme) this.data.settings.theme = 'dark';
    if (!this.data.settings.budgetLimits) this.data.settings.budgetLimits = this.getInitialState().settings.budgetLimits;
    if (!this.data.settings.billLimits) this.data.settings.billLimits = this.getInitialState().settings.billLimits;
    if (!this.data.profile) {
      this.data.profile = this.getInitialState().profile;
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving database:', error);
      return false;
    }
  }

  getData() {
    return this.data;
  }

  setData(newData) {
    this.data = newData;
    this.ensureSchema();
    return this.save();
  }
}
