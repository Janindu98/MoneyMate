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
    settings: { currency: 'LKR', theme: 'dark' }
  });
  const [loading, setLoading] = useState(true);

  // Load database on startup
  useEffect(() => {
    async function load() {
      try {
        const data = await api.loadData();
        if (data) {
          setDbState(data);
        }
      } catch (err) {
        console.error('Failed to load database:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save changes offline and update React state
  const syncState = async (newDb) => {
    setDbState(newDb);
    await api.saveData(newDb);
  };

  // Accounts CRUD
  const addAccount = (acc) => {
    const newAccounts = [...dbState.accounts, { id: `acc_${Date.now()}`, ...acc }];
    syncState({ ...dbState, accounts: newAccounts });
  };

  const editAccount = (id, updated) => {
    const newAccounts = dbState.accounts.map(a => a.id === id ? { ...a, ...updated } : a);
    syncState({ ...dbState, accounts: newAccounts });
  };

  const deleteAccount = (id) => {
    const newAccounts = dbState.accounts.filter(a => a.id !== id);
    // Remove transaction reference links
    const newTx = dbState.transactions.filter(t => t.bankId !== id && t.targetBankId !== id);
    const newSalary = dbState.salaryHistory.filter(s => s.bankAccount !== id);
    syncState({ ...dbState, accounts: newAccounts, transactions: newTx, salaryHistory: newSalary });
  };

  // Transactions CRUD
  const addTransaction = (tx) => {
    const newTx = [...dbState.transactions, { id: `tx_${Date.now()}`, ...tx }];
    syncState({ ...dbState, transactions: newTx });
  };

  const editTransaction = (id, updated) => {
    const newTx = dbState.transactions.map(t => t.id === id ? { ...t, ...updated } : t);
    syncState({ ...dbState, transactions: newTx });
  };

  const deleteTransaction = (id) => {
    const newTx = dbState.transactions.filter(t => t.id !== id);
    syncState({ ...dbState, transactions: newTx });
  };

  // Categories Creator
  const addCategory = (type, categoryName) => {
    const list = dbState.categories[type] || [];
    if (list.includes(categoryName)) return false; // Duplicate category protection

    const updatedCategories = {
      ...dbState.categories,
      [type]: [...list, categoryName]
    };
    syncState({ ...dbState, categories: updatedCategories });
    return true;
  };

  // Salary CRUD
  const addSalaryRecord = (sal) => {
    const newSal = [...dbState.salaryHistory, { id: `sal_${Date.now()}`, ...sal }];
    syncState({ ...dbState, salaryHistory: newSal });
  };

  const deleteSalaryRecord = (id) => {
    const newSal = dbState.salaryHistory.filter(s => s.id !== id);
    syncState({ ...dbState, salaryHistory: newSal });
  };

  // Settings
  const updateSettings = (settings) => {
    syncState({ ...dbState, settings: { ...dbState.settings, ...settings } });
  };

  // Reset database or restore backup imports
  const restoreDatabase = (newData) => {
    syncState(newData);
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
      restoreDatabase
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
