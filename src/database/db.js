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
          bankId: 'acc_commercial_bank', // References accounts.id
          type: 'Deposit', // Deposit, Withdrawal, Income, Expense, Online Transfer, online payment
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
          'Bills',
          'Insurance',
          'Rent',
          'Shopping',
          'Medical',
          'Entertainment',
          'Investment',
          'Loan',
          'Other',
          'Network - Mobile',
          'Network - TV',
          'Network - WIFI'
        ]
      },
      salaryHistory: [
        // Stores salary payment details
      ],
      settings: {
        currency: 'LKR',
        theme: 'dark'
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
    if (!Array.isArray(this.data.salaryHistory)) this.data.salaryHistory = [];
    if (!this.data.settings) this.data.settings = { currency: 'LKR', theme: 'dark' };
    if (!this.data.settings.currency) this.data.settings.currency = 'LKR';
    if (!this.data.settings.theme) this.data.settings.theme = 'dark';
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
