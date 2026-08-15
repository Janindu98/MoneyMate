import fs from 'node:fs';
import path from 'node:path';

function encryptData(data, key) {
  const json = JSON.stringify(data);
  let encrypted = "";
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(encrypted)));
}

function decryptData(encryptedStr, key) {
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedStr)));
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

export default class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.getInitialState();
    this.isEncrypted = false;
    this.securityType = 'none';
    this.encryptedData = '';
    this.encryptionKey = null;
  }

  getInitialState() {
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
        }
      ],
      transactions: [],
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
      salaryHistory: [],
      subscriptions: [],
      settings: {
        currency: 'USD',
        theme: 'dark',
        fontSize: 'medium',
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
        name: '',
        employeeId: '',
        company: '',
        designation: '',
        bankName: '',
        accountNumber: '',
        taxId: '',
        epfId: '',
        etfId: '',
        contributions: []
      }
    };
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        let parsed;
        try {
          parsed = JSON.parse(fileContent);
        } catch (e) {
          parsed = null;
        }

        if (parsed && parsed.encrypted === true) {
          this.isEncrypted = true;
          this.securityType = parsed.securityType;
          this.encryptedData = parsed.data;
          this.data = {
            encrypted: true,
            securityType: parsed.securityType,
            settings: {
              securityType: parsed.securityType
            }
          };
        } else if (parsed) {
          this.isEncrypted = false;
          this.data = parsed;
          this.encryptionKey = null;
          this.ensureSchema();
        } else {
          this.data = this.getInitialState();
          this.ensureSchema();
        }
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
    if (!this.data.settings.currency) this.data.settings.currency = 'USD';
    if (!this.data.settings.theme) this.data.settings.theme = 'dark';
    if (!this.data.settings.budgetLimits) this.data.settings.budgetLimits = this.getInitialState().settings.budgetLimits;
    if (!this.data.settings.billLimits) this.data.settings.billLimits = this.getInitialState().settings.billLimits;
    if (!this.data.settings.fontSize) this.data.settings.fontSize = 'medium';
    if (!this.data.profile) {
      this.data.profile = this.getInitialState().profile;
    }
    if (!Array.isArray(this.data.profile.contributions)) {
      this.data.profile.contributions = [];
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let contentToWrite;
      const securityType = this.data?.settings?.securityType || 'none';

      if (securityType === 'pin' || securityType === 'password') {
        const key = this.encryptionKey || (securityType === 'pin' ? this.data.settings.securityPin : this.data.settings.securityPassword);
        if (key) {
          this.encryptionKey = key;
          const encryptedPayload = encryptData(this.data, key);
          contentToWrite = JSON.stringify({
            encrypted: true,
            securityType: securityType,
            data: encryptedPayload
          }, null, 2);
        } else {
          contentToWrite = JSON.stringify(this.data, null, 2);
        }
      } else {
        this.encryptionKey = null;
        contentToWrite = JSON.stringify(this.data, null, 2);
      }

      fs.writeFileSync(this.filePath, contentToWrite, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving database:', error);
      return false;
    }
  }

  unlock(pinOrPassword) {
    if (!this.isEncrypted) {
      return true;
    }
    const decrypted = decryptData(this.encryptedData, pinOrPassword);
    if (decrypted && decrypted.accounts && decrypted.transactions && decrypted.settings) {
      this.data = decrypted;
      this.isEncrypted = false;
      this.encryptionKey = pinOrPassword;
      this.ensureSchema();
      return true;
    }
    return false;
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
