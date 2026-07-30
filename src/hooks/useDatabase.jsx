import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { calculateAccountBalances } from '../utils/format';

const DatabaseContext = createContext();

export function DatabaseProvider({ children }) {
  const [dbState, setDbState] = useState({
    accounts: [],
    transactions: [],
    categories: { income: [], expense: [] },
    salaryHistory: [],
    settings: { currency: 'LKR', theme: 'dark' },
    profile: {
      name: '',
      employeeId: '',
      company: '',
      designation: '',
      bankName: '',
      accountNumber: ''
    }
  });
  const [loading, setLoading] = useState(true);

  // Load database on startup
  useEffect(() => {
    async function load() {
      try {
        const data = await api.loadData();
        if (data) {
          // Migrate Online Transfer type to Online/Account cash transfer and force Category as Money Transfer
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
            profile: data.profile || {
              name: '',
              employeeId: '',
              company: '',
              designation: '',
              bankName: '',
              accountNumber: ''
            }
          };
          setDbState(mergedData);
        }
      } catch (err) {
        console.error('Failed to load database:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save changes offline and update React state safely using functional updates
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
    if (list.includes(categoryName)) return false; // Duplicate category protection

    updateDbState(prev => {
      const currentList = prev.categories[type] || [];
      if (currentList.includes(categoryName)) return prev;
      const updatedCategories = {
        ...prev.categories,
        [type]: [...currentList, categoryName]
      };
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
          accountNumber: ''
        }
      };
    });
  };

  // Calculate card balances dynamically based on the ledger history
  const activeAccounts = calculateAccountBalances(dbState.accounts, dbState.transactions);

  return (
    <DatabaseContext.Provider value={{
      accounts: activeAccounts,
      rawAccounts: dbState.accounts, // Keep raw copy without calculated balances if needed
      transactions: dbState.transactions,
      categories: dbState.categories,
      salaryHistory: dbState.salaryHistory,
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
      addSalaryRecord,
      deleteSalaryRecord,
      updateSettings,
      updateProfile,
      restoreDatabase
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
