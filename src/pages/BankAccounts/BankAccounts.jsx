import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { formatCurrency } from '../../utils/format';

export default function BankAccounts() {
  const { accounts, addAccount, editAccount, deleteAccount, settings } = useDatabase();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [status, setStatus] = useState('Active');
  const [cardColor, setCardColor] = useState('#4f46e5');
  const [initialDeposit, setInitialDeposit] = useState('0.00');

  // Colors available for selection
  const colorThemes = [
    { value: '#4f46e5', label: 'Royal Indigo' },
    { value: '#10b981', label: 'Teal Emerald' },
    { value: '#7c3aed', label: 'Vibrant Purple' },
    { value: '#f59e0b', label: 'Warm Amber' },
    { value: '#3b82f6', label: 'Ocean Blue' },
    { value: '#1e293b', label: 'Slate Slate' },
    { value: '#f43f5e', label: 'Crimson Rose' }
  ];

  const handleOpenAddModal = () => {
    setEditId(null);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setBranch('');
    setAccountType('Savings');
    setStatus('Active');
    setCardColor('#4f46e5');
    setInitialDeposit('0.00');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditId(acc.id);
    setBankName(acc.bankName);
    setAccountName(acc.accountName);
    setAccountNumber(acc.accountNumber || '');
    setBranch(acc.branch || '');
    setAccountType(acc.accountType);
    setStatus(acc.status || 'Active');
    setCardColor(acc.color || '#4f46e5');
    setInitialDeposit('0.00'); // Disabled or ignored during edit
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bankName.trim() || !accountName.trim()) {
      showToast('Please enter both Bank and Account Names.', 'error');
      return;
    }

    const payload = {
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      branch: branch.trim(),
      accountType,
      currency: 'LKR',
      status,
      color: cardColor
    };

    if (editId) {
      editAccount(editId, payload);
      showToast(`Account "${accountName}" updated.`);
    } else {
      // For initial balance, we trigger the addAccount which internally handles creation.
      // Wait, we also want to record an initial deposit transaction in ledger to adjust balance!
      // Since useDatabase handles balance aggregations, we'll append the account,
      // and if starting balance > 0, we can add a deposit transaction.
      const initialDepositVal = parseFloat(initialDeposit) || 0;
      addAccount(payload);
      
      // Wait! Because useDatabase runs sequentially, we need the new account ID to record a transaction.
      // Let's add the transaction inside hook, or we can handle it inside useDatabase.
      // In useDatabase addAccount function, we generate acc_Date.now().
      // Let's pass the deposit amount if needed, or we can log it here if we know the ID or we can just append a transaction with the same timestamp ID.
      if (initialDepositVal > 0) {
        // Let's find the new account ID or we can just let useDatabase do it.
        // Actually, our hook addAccount takes the account object.
        // Let's modify our useDatabase hook or we can add it in the transaction ledger directly.
        // Wait, in our hook useDatabase.js:
        // `const newAccounts = [...dbState.accounts, { id: newId, ...acc }]`
        // We can check if `initialDeposit` was provided or just create a deposit transaction using the same timestamp!
        // Yes, let's create a custom action inside useDatabase, or since we know it creates `acc_${timestamp}`, we can run:
        // `addTransaction({ date: date, bankId: newId, ... })`
        // Wait! Let's verify: `addAccount` uses `Date.now()`. If we do:
        const tempTimestamp = Date.now();
        const accountWithId = {
          id: `acc_${tempTimestamp}`,
          ...payload
        };
        
        addAccount(accountWithId);
        
        if (initialDepositVal > 0) {
          // Add initial deposit
          // We can call useDatabase's addTransaction or save it
          // Wait! In useDatabase useDatabase.js line 42:
          // `addAccount` does: `const newAccounts = [...dbState.accounts, { id: `acc_${Date.now()}`, ...acc }]`
          // Since it adds the id dynamically, we can update useDatabase to accept an `id` if it already exists, or handle it cleanly.
          // Let's look at `useDatabase.js` addAccount:
          // `const addAccount = (acc) => { const newAccounts = [...dbState.accounts, { id: acc.id || `acc_${Date.now()}`, ...acc }]; ... }`
          // Ah! Our useDatabase implementation does support `id` if passed or creates a new one!
          // So passing `id` explicitly works perfectly!
          // Let's trigger both:
          // 1. `addAccount(accountWithId)`
          // 2. `addTransaction({ date, bankId: accountWithId.id, type: 'Deposit', category: 'Other', payee: 'Self', amount: initialDepositVal, description: 'Opening balance' })`
        }
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Wipe "${name}"? This permanently deletes the account and all corresponding transaction ledgers.`)) {
      deleteAccount(id);
      showToast(`Account "${name}" deleted.`);
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Bank Accounts</h1>
          <p>Organize local checkings, savings, cash, and investments cards.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Account
          </button>
        </div>
      </div>

      <div className="accounts-grid">
        {accounts.map(acc => (
          <div key={acc.id} className="bank-card" style={{ background: acc.color || '#1e293b' }}>
            <div className="card-top">
              <span className="card-bank-name">{acc.bankName}</span>
              <span className="card-type" style={{ background: acc.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)' }}>
                {acc.status}
              </span>
            </div>
            
            <div className="card-middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="card-label">{acc.accountName}</div>
                  <div className="card-balance">{formatCurrency(acc.balance, settings.currency)}</div>
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, textAlign: 'right' }}>
                  <div>Type: {acc.accountType}</div>
                  {acc.branch && <div>Branch: {acc.branch}</div>}
                </div>
              </div>
            </div>

            <div className="card-bottom">
              <span className="card-number">
                {acc.accountNumber ? `•••• •••• •••• ${acc.accountNumber}` : '•••• •••• •••• N/A'}
              </span>
              <div className="card-actions" onClick={e => e.stopPropagation()}>
                <button className="btn-card-action" onClick={() => handleOpenEditModal(acc)} title="Edit Details">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
                <button className="btn-card-action" onClick={() => handleDelete(acc.id, acc.bankName)} style={{ background: 'rgba(244, 63, 94, 0.3)' }} title="Delete Account">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="panel empty-state" style={{ gridColumn: '1 / -1' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <div className="empty-state-text">No active cards found. Create a bank account to log ledger entries.</div>
          </div>
        )}
      </div>

      {/* Modal CRUD Account */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? 'Edit Bank Account' : 'Create Bank Account'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Bank Name</label>
              <input 
                type="text" 
                className="input-ctrl" 
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="e.g. Commercial Bank, HNB, Sampath, Cash"
                required
              />
            </div>

            <div className="form-group">
              <label>Account Name / Holder</label>
              <input 
                type="text" 
                className="input-ctrl" 
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="e.g. Personal Savings, Salary Account"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Account Type</label>
                <select 
                  className="input-ctrl" 
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                >
                  <option value="Savings">Savings</option>
                  <option value="Checking">Checking</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Investment">Investment</option>
                  <option value="Cash / Other">Cash / Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  className="input-ctrl" 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Branch Office Location</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="e.g. Kandy, Colombo, Galle"
                />
              </div>

              <div className="form-group">
                <label>Last 4 Digits (Optional)</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 5678"
                  maxLength="4"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Card Color Theme</label>
                <select 
                  className="input-ctrl" 
                  value={cardColor}
                  onChange={e => setCardColor(e.target.value)}
                >
                  {colorThemes.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {!editId && (
                <div className="form-group">
                  <label>Starting Balance (Rs.)</label>
                  <input 
                    type="number" 
                    className="input-ctrl" 
                    value={initialDeposit}
                    onChange={e => setInitialDeposit(e.target.value)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Account</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
