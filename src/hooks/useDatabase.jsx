import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { calculateAccountBalances } from '../utils/format';

const DatabaseContext = createContext();

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
        
        // Add expense transaction to ledger
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

        // Advance renewal date
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

export function DatabaseProvider({ children }) {
  const [dbState, setDbState] = useState({
    accounts: [],
    transactions: [],
    categories: {
      income: [],
      expense: [],
      'Income': [],
      'Expense': [],
      'Online/Account cash transfer': [],
      'Deposit': [],
      'Withdrawal': [],
      'Online Payment': [],
      'Bill & Payment': []
    },
    salaryHistory: [],
    subscriptions: [],
    settings: {
      currency: 'LKR',
      theme: 'dark',
      budgetLimits: {
        FoodDining: 20000,
        Groceries: 15000,
        Transportation: 5000,
        Fuel: 20000,
        HealthcareMedical: 10000,
        Shopping: 15000,
        Education: 10000,
        Others: 12000
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
  });
  const [loading, setLoading] = useState(true);

  // Load database on startup
  useEffect(() => {
    async function load() {
      try {
        let data = await api.loadData();
        if (data) {
          if (data.encrypted) {
            setDbState(prev => ({
              ...prev,
              settings: {
                securityType: data.securityType
              }
            }));
            setLoading(false);
            return;
          }

          let migrationPerformed = false;
          // Migrate Transactions
          if (Array.isArray(data.transactions)) {
            data.transactions = data.transactions.map(tx => {
              if (tx.category === 'Food') {
                migrationPerformed = true;
                return { ...tx, category: 'Food & Dining' };
              }
              if (tx.category === 'Medical') {
                migrationPerformed = true;
                return { ...tx, category: 'Healthcare & Medical' };
              }
              return tx;
            });
          }

          // Migrate Category lists
          if (data.categories) {
            const listKeys = ['income', 'expense', 'Income', 'Expense', 'Online/Account cash transfer', 'Deposit', 'Withdrawal', 'Online Payment', 'Bill & Payment'];
            listKeys.forEach(key => {
              if (Array.isArray(data.categories[key])) {
                const originalList = data.categories[key];
                let newList = [...originalList];
                let listChanged = false;

                const foodIdx = newList.indexOf('Food');
                if (foodIdx !== -1) {
                  newList[foodIdx] = 'Food & Dining';
                  listChanged = true;
                }

                const medicalIdx = newList.indexOf('Medical');
                if (medicalIdx !== -1) {
                  newList[medicalIdx] = 'Healthcare & Medical';
                  listChanged = true;
                }

                if (key === 'expense' || key === 'Expense') {
                  if (!newList.includes('Groceries')) {
                    const otherIdx = newList.indexOf('Other');
                    if (otherIdx !== -1) {
                      newList.splice(otherIdx, 0, 'Groceries');
                    } else {
                      newList.push('Groceries');
                    }
                    listChanged = true;
                  }
                  if (!newList.includes('Education')) {
                    const otherIdx = newList.indexOf('Other');
                    if (otherIdx !== -1) {
                      newList.splice(otherIdx, 0, 'Education');
                    } else {
                      newList.push('Education');
                    }
                    listChanged = true;
                  }
                }

                if (listChanged) {
                  data.categories[key] = newList;
                  migrationPerformed = true;
                }
              }
            });
          }

          // Migrate Settings Budget Limits
          if (data.settings && data.settings.budgetLimits) {
            const limits = { ...data.settings.budgetLimits };
            let limitsChanged = false;

            if ('Food' in limits) {
              limits['Food & Dining'] = limits['Food'];
              delete limits['Food'];
              limitsChanged = true;
            }
            if ('Medical' in limits) {
              limits['Healthcare & Medical'] = limits['Medical'];
              delete limits['Medical'];
              limitsChanged = true;
            }
            if (!('Groceries' in limits)) {
              limits['Groceries'] = 25000;
              limitsChanged = true;
            }
            if (!('Education' in limits)) {
              limits['Education'] = 15000;
              limitsChanged = true;
            }

            if (limitsChanged) {
              data.settings.budgetLimits = limits;
              migrationPerformed = true;
            }
          }

          if (migrationPerformed) {
            await api.saveData(data).catch(err => console.error('Failed to save migrated database:', err));
          }

          // Migrate Online Transfer type to Online/Account cash transfer
          const migratedTransactions = (data.transactions || []).map(tx => {
            if (tx.type === 'Online Transfer') {
              return {
                ...tx,
                type: 'Online/Account cash transfer',
                category: 'Money Transfer'
              };
            }
            return tx;
          });

          const mergedData = {
            ...data,
            transactions: migratedTransactions,
            subscriptions: data.subscriptions || [],
            settings: {
              currency: 'LKR',
              theme: 'dark',
              budgetLimits: {
                FoodDining: 20000,
                Groceries: 15000,
                Transportation: 5000,
                Fuel: 20000,
                HealthcareMedical: 10000,
                Shopping: 15000,
                Education: 10000,
                Others: 12000
              },
              billLimits: {
                Electricity: 8000,
                Water: 2000,
                Internet: 5000,
                Mobile: 3000,
                Insurance: 15000,
                CreditCards: 25000,
                Rent: 45000
              },
              ...(data.settings || {})
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
              ...(data.profile || {})
            }
          };

          // Ensure new category schema keys are loaded
          const currentCats = mergedData.categories || {};
          const paymentTypes = ['Income', 'Expense', 'Online/Account cash transfer', 'Deposit', 'Withdrawal', 'Online Payment', 'Bill & Payment'];
          const initialIncome = ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'];
          const initialExpense = [
            'Food & Dining',
            'Groceries',
            'Transportation',
            'Fuel',
            'Healthcare & Medical',
            'Shopping',
            'Family & Gifts',
            'Education',
            'Other'
          ];
          const initialBills = [
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
          ];
          const initialDeposit = ['Cash Deposit', 'Bank Deposit', 'Other Deposit'];

          paymentTypes.forEach(pt => {
            if (!Array.isArray(currentCats[pt])) {
              if (pt === 'Income') currentCats[pt] = currentCats.income || initialIncome;
              else if (pt === 'Expense') currentCats[pt] = currentCats.expense || initialExpense;
              else if (pt === 'Deposit') currentCats[pt] = initialDeposit;
              else if (pt === 'Withdrawal') currentCats[pt] = ['Cash Withdrawal', 'ATM Withdrawal', 'Other'];
              else if (pt === 'Online/Account cash transfer') currentCats[pt] = ['Money Transfer', 'Wallet Transfer'];
              else if (pt === 'Online Payment') currentCats[pt] = ['Food & Dining', 'Groceries', 'Fuel', 'Shopping', 'Transportations', 'Healthcare & Medical', 'Education', 'Transaction Charges', 'Other'];
              else if (pt === 'Bill & Payment') currentCats[pt] = initialBills;
            }
          });

          // Migrate Expense lists (replace old defaults with new ones, keeping custom entries)
          const oldExpense = ['Food', 'Fuel', 'Shopping', 'Transportations', 'Alert Charges', 'Debit Card Annual Fee', 'Other', 'Electricity', 'Water', 'Internet', 'Mobile phone', 'Insurance', 'Credit cards', 'Rent', 'Subscriptions'];
          if (Array.isArray(currentCats['Expense'])) {
            const custom = currentCats['Expense'].filter(c => !oldExpense.includes(c));
            currentCats['Expense'] = [...initialExpense.filter(c => c !== 'Other'), ...custom, 'Other'].filter((v, i, a) => a.indexOf(v) === i);
          }
          if (Array.isArray(currentCats['expense'])) {
            const custom = currentCats['expense'].filter(c => !oldExpense.includes(c));
            currentCats['expense'] = [...initialExpense.filter(c => c !== 'Other'), ...custom, 'Other'].filter((v, i, a) => a.indexOf(v) === i);
          }

          // Migrate Deposit list
          const oldDeposit = ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'];
          if (Array.isArray(currentCats['Deposit'])) {
            const custom = currentCats['Deposit'].filter(c => !oldDeposit.includes(c));
            currentCats['Deposit'] = [...initialDeposit, ...custom].filter((v, i, a) => a.indexOf(v) === i);
          }

          // Migrate Transfer list
          if (Array.isArray(currentCats['Online/Account cash transfer'])) {
            if (!currentCats['Online/Account cash transfer'].includes('Wallet Transfer')) {
              currentCats['Online/Account cash transfer'] = ['Money Transfer', 'Wallet Transfer', ...currentCats['Online/Account cash transfer'].filter(c => c !== 'Money Transfer' && c !== 'Wallet Transfer')];
            }
          }

          // Migrate Bill & Payment list
          if (Array.isArray(currentCats['Bill & Payment'])) {
            const list = ['Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment'];
            list.forEach(c => {
              if (!currentCats['Bill & Payment'].includes(c)) {
                const otherIdx = currentCats['Bill & Payment'].indexOf('Other');
                if (otherIdx !== -1) {
                  currentCats['Bill & Payment'].splice(otherIdx, 0, c);
                } else {
                  currentCats['Bill & Payment'].push(c);
                }
              }
            });
          }

          if (Array.isArray(currentCats['Online Payment'])) {
            const hasCharges = currentCats['Online Payment'].includes('Transaction Charges');
            if (!hasCharges) {
              const otherIdx = currentCats['Online Payment'].indexOf('Other');
              const newCats = [...currentCats['Online Payment']];
              if (otherIdx !== -1) {
                newCats.splice(otherIdx, 0, 'Transaction Charges');
              } else {
                newCats.push('Transaction Charges');
              }
              currentCats['Online Payment'] = newCats;
            }
          }
          mergedData.categories = currentCats;

          // Subscriptions Auto-Renewal Check
          const renewedData = processSubscriptionRenewals(mergedData);
          if (renewedData.transactions.length !== mergedData.transactions.length) {
            api.saveData(renewedData).catch(err => console.error('Failed to auto-save renewals:', err));
          }

          setDbState(renewedData);
        }
      } catch (err) {
        console.error('Failed to load database:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save changes offline
  const updateDbState = (updater) => {
    setDbState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      api.saveData(next).catch(err => console.error('Failed to save database:', err));
      return next;
    });
  };

  // Accounts CRUD
  const addAccount = (acc, initialBalance = 0) => {
    updateDbState(prev => {
      const accountId = acc.id || `acc_${Date.now()}`;
      const newAccount = { id: accountId, ...acc };
      const newAccounts = [...prev.accounts, newAccount];
      
      let newTx = prev.transactions;
      if (initialBalance > 0) {
        newTx = [...prev.transactions, {
          id: `tx_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          bankId: accountId,
          type: 'Deposit',
          category: 'Other',
          payee: 'Self',
          amount: initialBalance,
          description: 'Opening balance'
        }];
      }
      return { ...prev, accounts: newAccounts, transactions: newTx };
    });
  };

  const editAccount = (id, updated) => {
    updateDbState(prev => {
      const newAccounts = prev.accounts.map(a => a.id === id ? { ...a, ...updated } : a);
      return { ...prev, accounts: newAccounts };
    });
  };

  const deleteAccount = (id) => {
    updateDbState(prev => {
      const newAccounts = prev.accounts.filter(a => a.id !== id);
      const newTx = prev.transactions.filter(t => t.bankId !== id && t.targetBankId !== id);
      const newSalary = prev.salaryHistory.filter(s => s.bankAccount !== id);
      return { ...prev, accounts: newAccounts, transactions: newTx, salaryHistory: newSalary };
    });
  };

  // Transactions CRUD
  const addTransaction = (tx) => {
    updateDbState(prev => {
      const newTx = [...prev.transactions, { id: tx.id || `tx_${Date.now()}`, ...tx }];
      return { ...prev, transactions: newTx };
    });
  };

  const editTransaction = (id, updated) => {
    updateDbState(prev => {
      const newTx = prev.transactions.map(t => t.id === id ? { ...t, ...updated } : t);
      return { ...prev, transactions: newTx };
    });
  };

  const deleteTransaction = (id) => {
    updateDbState(prev => {
      const newTx = prev.transactions.filter(t => t.id !== id);
      return { ...prev, transactions: newTx };
    });
  };

  // Categories Creator
  const addCategory = (type, categoryName) => {
    const list = dbState.categories[type] || [];
    if (list.includes(categoryName)) return false;

    updateDbState(prev => {
      const currentList = prev.categories[type] || [];
      if (currentList.includes(categoryName)) return prev;
      const updatedCategories = {
        ...prev.categories,
        [type]: [...currentList, categoryName]
      };
      // Keep legacy keys in sync
      if (type === 'Income') {
        updatedCategories.income = [...(prev.categories.income || []), categoryName].filter((v, i, a) => a.indexOf(v) === i);
      }
      if (type === 'Expense') {
        updatedCategories.expense = [...(prev.categories.expense || []), categoryName].filter((v, i, a) => a.indexOf(v) === i);
      }
      return { ...prev, categories: updatedCategories };
    });
    return true;
  };

  const deleteCategory = (type, categoryName) => {
    const defaults = {
      'Income': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
      'Expense': ['Food & Dining', 'Groceries', 'Transportation', 'Fuel', 'Healthcare & Medical', 'Shopping', 'Family & Gifts', 'Education', 'Other'],
      'Online/Account cash transfer': ['Money Transfer', 'Wallet Transfer'],
      'Deposit': ['Cash Deposit', 'Bank Deposit', 'Other Deposit'],
      'Withdrawal': ['Cash Withdrawal', 'ATM Withdrawal', 'Other'],
      'Online Payment': ['Food', 'Fuel', 'Shopping', 'Transportations', 'Transaction Charges', 'Other'],
      'Bill & Payment': ['Electricity', 'Water', 'Internet', 'Mobile phone', 'Insurance', 'Credit cards', 'Rent', 'Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment', 'Other']
    };
    const defaultList = defaults[type] || [];
    if (defaultList.includes(categoryName)) return false;

    updateDbState(prev => {
      const currentList = prev.categories[type] || [];
      const updatedList = currentList.filter(c => c !== categoryName);
      const updatedCategories = {
        ...prev.categories,
        [type]: updatedList
      };
      if (type === 'Income') {
        updatedCategories.income = (prev.categories.income || []).filter(c => c !== categoryName);
      }
      if (type === 'Expense') {
        updatedCategories.expense = (prev.categories.expense || []).filter(c => c !== categoryName);
      }
      return { ...prev, categories: updatedCategories };
    });
    return true;
  };

  // Salary CRUD
  const addSalaryRecord = (sal) => {
    updateDbState(prev => {
      const newSal = [...prev.salaryHistory, { id: sal.id || `sal_${Date.now()}`, ...sal }];
      return { ...prev, salaryHistory: newSal };
    });
  };

  const deleteSalaryRecord = (id) => {
    updateDbState(prev => {
      const newSal = prev.salaryHistory.filter(s => s.id !== id);
      return { ...prev, salaryHistory: newSal };
    });
  };

  // Subscriptions CRUD
  const addSubscription = (sub) => {
    updateDbState(prev => {
      const newSub = { id: sub.id || `sub_${Date.now()}`, ...sub };
      const nextState = { ...prev, subscriptions: [...(prev.subscriptions || []), newSub] };
      return processSubscriptionRenewals(nextState);
    });
  };

  const editSubscription = (id, updated) => {
    updateDbState(prev => {
      const newSub = (prev.subscriptions || []).map(s => s.id === id ? { ...s, ...updated } : s);
      const nextState = { ...prev, subscriptions: newSub };
      return processSubscriptionRenewals(nextState);
    });
  };

  const deleteSubscription = (id) => {
    updateDbState(prev => {
      const newSub = (prev.subscriptions || []).filter(s => s.id !== id);
      return { ...prev, subscriptions: newSub };
    });
  };

  // Settings
  const updateSettings = (settings) => {
    updateDbState(prev => {
      return { ...prev, settings: { ...prev.settings, ...settings } };
    });
  };

  const updateProfile = (updatedProfile) => {
    updateDbState(prev => {
      return { ...prev, profile: { ...prev.profile, ...updatedProfile } };
    });
  };

  // Reset database or restore backup imports
  const restoreDatabase = (newData) => {
    updateDbState(prev => {
      return {
        ...newData,
        profile: newData.profile || {
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
    });
  };

  const unlockDatabase = async (pinOrPassword) => {
    try {
      const res = await api.unlockData(pinOrPassword);
      if (res.success && res.data) {
        let data = res.data;
        let migrationPerformed = false;
        // Migrate Transactions
        if (Array.isArray(data.transactions)) {
          data.transactions = data.transactions.map(tx => {
            if (tx.category === 'Food') {
              migrationPerformed = true;
              return { ...tx, category: 'Food & Dining' };
            }
            if (tx.category === 'Medical') {
              migrationPerformed = true;
              return { ...tx, category: 'Healthcare & Medical' };
            }
            return tx;
          });
        }

        // Migrate Category lists
        if (data.categories) {
          const listKeys = ['income', 'expense', 'Income', 'Expense', 'Online/Account cash transfer', 'Deposit', 'Withdrawal', 'Online Payment', 'Bill & Payment'];
          listKeys.forEach(key => {
            if (Array.isArray(data.categories[key])) {
              const originalList = data.categories[key];
              let newList = [...originalList];
              let listChanged = false;

              const foodIdx = newList.indexOf('Food');
              if (foodIdx !== -1) {
                newList[foodIdx] = 'Food & Dining';
                listChanged = true;
              }

              const medicalIdx = newList.indexOf('Medical');
              if (medicalIdx !== -1) {
                newList[medicalIdx] = 'Healthcare & Medical';
                listChanged = true;
              }

              if (key === 'expense' || key === 'Expense') {
                if (!newList.includes('Groceries')) {
                  const otherIdx = newList.indexOf('Other');
                  if (otherIdx !== -1) {
                    newList.splice(otherIdx, 0, 'Groceries');
                  } else {
                    newList.push('Groceries');
                  }
                  listChanged = true;
                }
                if (!newList.includes('Education')) {
                  const otherIdx = newList.indexOf('Other');
                  if (otherIdx !== -1) {
                    newList.splice(otherIdx, 0, 'Education');
                  } else {
                    newList.push('Education');
                  }
                  listChanged = true;
                }
              }

              if (listChanged) {
                data.categories[key] = newList;
                migrationPerformed = true;
              }
            }
          });
        }

        // Migrate Settings Budget Limits
        if (data.settings && data.settings.budgetLimits) {
          const limits = { ...data.settings.budgetLimits };
          let limitsChanged = false;

          if ('Food' in limits) {
            limits['Food & Dining'] = limits['Food'];
            delete limits['Food'];
            limitsChanged = true;
          }
          if ('Medical' in limits) {
            limits['Healthcare & Medical'] = limits['Medical'];
            delete limits['Medical'];
            limitsChanged = true;
          }
          if (!('Groceries' in limits)) {
            limits['Groceries'] = 25000;
            limitsChanged = true;
          }
          if (!('Education' in limits)) {
            limits['Education'] = 15000;
            limitsChanged = true;
          }

          if (limitsChanged) {
            data.settings.budgetLimits = limits;
            migrationPerformed = true;
          }
        }

        if (migrationPerformed) {
          await api.saveData(data).catch(err => console.error('Failed to save migrated database:', err));
        }

        // Migrate Online Transfer type to Online/Account cash transfer
        const migratedTransactions = (data.transactions || []).map(tx => {
          if (tx.type === 'Online Transfer') {
            return {
              ...tx,
              type: 'Online/Account cash transfer',
              category: 'Money Transfer'
            };
          }
          return tx;
        });

        const mergedData = {
          ...data,
          transactions: migratedTransactions,
          subscriptions: data.subscriptions || [],
          settings: {
            'Food & Dining': 35000,
            Fuel: 20000,
            'Healthcare & Medical': 18000,
            Shopping: 15000,
            Groceries: 25000,
            Education: 15000,
            Others: 12000,
            Transportations: 5000,
            ...(data.settings || {})
          },
          billLimits: {
            Electricity: 8000,
            Water: 2000,
            Internet: 5000,
            Mobile: 3000,
            Insurance: 15000,
            CreditCards: 25000,
            Rent: 45000,
            ...(data.settings?.billLimits || {})
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
            ...(data.profile || {})
          }
        };

        const currentCats = mergedData.categories || {};
        const paymentTypes = ['Income', 'Expense', 'Online/Account cash transfer', 'Deposit', 'Withdrawal', 'Online Payment', 'Bill & Payment'];
        const initialIncome = ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'];
        const initialExpense = [
          'Food & Dining',
          'Groceries',
          'Transportation',
          'Fuel',
          'Healthcare & Medical',
          'Shopping',
          'Family & Gifts',
          'Education',
          'Other'
        ];
        const initialBills = [
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
        ];
        const initialDeposit = ['Cash Deposit', 'Bank Deposit', 'Other Deposit'];

        paymentTypes.forEach(pt => {
          if (!Array.isArray(currentCats[pt])) {
            if (pt === 'Income') currentCats[pt] = currentCats.income || initialIncome;
            else if (pt === 'Expense') currentCats[pt] = currentCats.expense || initialExpense;
            else if (pt === 'Deposit') currentCats[pt] = initialDeposit;
            else if (pt === 'Withdrawal') currentCats[pt] = ['Cash Withdrawal', 'ATM Withdrawal', 'Other'];
            else if (pt === 'Online/Account cash transfer') currentCats[pt] = ['Money Transfer', 'Wallet Transfer'];
            else if (pt === 'Online Payment') currentCats[pt] = ['Food & Dining', 'Groceries', 'Fuel', 'Shopping', 'Transportations', 'Healthcare & Medical', 'Education', 'Transaction Charges', 'Other'];
            else if (pt === 'Bill & Payment') currentCats[pt] = initialBills;
          }
        });

        // Migrate Expense lists
        const oldExpense = ['Food', 'Fuel', 'Shopping', 'Transportations', 'Alert Charges', 'Debit Card Annual Fee', 'Other', 'Electricity', 'Water', 'Internet', 'Mobile phone', 'Insurance', 'Credit cards', 'Rent', 'Subscriptions'];
        if (Array.isArray(currentCats['Expense'])) {
          const custom = currentCats['Expense'].filter(c => !oldExpense.includes(c));
          currentCats['Expense'] = [...initialExpense.filter(c => c !== 'Other'), ...custom, 'Other'].filter((v, i, a) => a.indexOf(v) === i);
        }
        if (Array.isArray(currentCats['expense'])) {
          const custom = currentCats['expense'].filter(c => !oldExpense.includes(c));
          currentCats['expense'] = [...initialExpense.filter(c => c !== 'Other'), ...custom, 'Other'].filter((v, i, a) => a.indexOf(v) === i);
        }

        // Migrate Deposit list
        const oldDeposit = ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'];
        if (Array.isArray(currentCats['Deposit'])) {
          const custom = currentCats['Deposit'].filter(c => !oldDeposit.includes(c));
          currentCats['Deposit'] = [...initialDeposit, ...custom].filter((v, i, a) => a.indexOf(v) === i);
        }

        // Migrate Transfer list
        if (Array.isArray(currentCats['Online/Account cash transfer'])) {
          if (!currentCats['Online/Account cash transfer'].includes('Wallet Transfer')) {
            currentCats['Online/Account cash transfer'] = ['Money Transfer', 'Wallet Transfer', ...currentCats['Online/Account cash transfer'].filter(c => c !== 'Money Transfer' && c !== 'Wallet Transfer')];
          }
        }

        // Migrate Bill & Payment list
        if (Array.isArray(currentCats['Bill & Payment'])) {
          const list = ['Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment'];
          list.forEach(c => {
            if (!currentCats['Bill & Payment'].includes(c)) {
              const otherIdx = currentCats['Bill & Payment'].indexOf('Other');
              if (otherIdx !== -1) {
                currentCats['Bill & Payment'].splice(otherIdx, 0, c);
              } else {
                currentCats['Bill & Payment'].push(c);
              }
            }
          });
        }

        if (Array.isArray(currentCats['Online Payment'])) {
          const hasCharges = currentCats['Online Payment'].includes('Transaction Charges');
          if (!hasCharges) {
            const otherIdx = currentCats['Online Payment'].indexOf('Other');
            const newCats = [...currentCats['Online Payment']];
            if (otherIdx !== -1) {
              newCats.splice(otherIdx, 0, 'Transaction Charges');
            } else {
              newCats.push('Transaction Charges');
            }
            currentCats['Online Payment'] = newCats;
          }
        }
        mergedData.categories = currentCats;

        const renewedData = processSubscriptionRenewals(mergedData);
        if (renewedData.transactions.length !== mergedData.transactions.length) {
          api.saveData(renewedData).catch(err => console.error('Failed to auto-save renewals:', err));
        }

        setDbState(renewedData);
        return { success: true };
      } else {
        return { success: false, error: res.error || 'Incorrect PIN or Password.' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Decryption failed.' };
    }
  };

  // Calculate card balances dynamically based on the ledger history
  const activeAccounts = calculateAccountBalances(dbState.accounts, dbState.transactions);

  return (
    <DatabaseContext.Provider value={{
      accounts: activeAccounts,
      rawAccounts: dbState.accounts,
      transactions: dbState.transactions,
      categories: dbState.categories,
      salaryHistory: dbState.salaryHistory,
      subscriptions: dbState.subscriptions || [],
      settings: dbState.settings,
      profile: dbState.profile,
      loading,
      addAccount,
      editAccount,
      deleteAccount,
      addTransaction,
      editTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      addSalaryRecord,
      deleteSalaryRecord,
      addSubscription,
      editSubscription,
      deleteSubscription,
      updateSettings,
      updateProfile,
      restoreDatabase,
      unlockDatabase
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
