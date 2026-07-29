import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { formatCurrency } from '../../utils/format';

export default function BankAccounts() {
  const { accounts, transactions, addAccount, editAccount, deleteAccount, settings } = useDatabase();
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

  // ePassbook state variables
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'monthly', 'yearly', 'dates'
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    LKR: 'Rs.'
  };

  const getPassbookData = () => {
    if (!selectedAccountId) return [];
    
    // Get all transactions for this account
    const accTx = transactions.filter(t => 
      t.bankId === selectedAccountId || 
      (t.type === 'Online/Account cash transfer' && t.targetBankId === selectedAccountId)
    );
    
    // Sort chronologically (date ascending) to compute running balance correctly
    const sortedAccTx = [...accTx].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let running = 0;
    const computedTx = sortedAccTx.map(tx => {
      let isOutflow = false;
      let isInflow = false;
      
      if (tx.bankId === selectedAccountId) {
        if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
          isInflow = true;
          running += tx.amount;
        } else if (['Expense', 'Withdrawal', 'online payment', 'Online/Account cash transfer'].includes(tx.type)) {
          isOutflow = true;
          running -= tx.amount;
        }
      } else if (tx.type === 'Online/Account cash transfer' && tx.targetBankId === selectedAccountId) {
        isInflow = true;
        running += tx.amount;
      }
      
      return {
        ...tx,
        isOutflow,
        isInflow,
        runningBalance: running
      };
    });
    
    // Apply filters
    const filtered = computedTx.filter(tx => {
      const txDate = new Date(tx.date);
      if (filterType === 'monthly') {
        return txDate.getMonth() === parseInt(filterMonth) && txDate.getFullYear() === parseInt(filterYear);
      } else if (filterType === 'yearly') {
        return txDate.getFullYear() === parseInt(filterYear);
      } else if (filterType === 'dates') {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) {
          const current = new Date(tx.date);
          current.setHours(0,0,0,0);
          start.setHours(0,0,0,0);
          end.setHours(0,0,0,0);
          return current >= start && current <= end;
        }
        return true;
      }
      return true;
    });

    // Show most recent transaction first (descending)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

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
      const initialDepositVal = parseFloat(initialDeposit) || 0;
      addAccount(payload, initialDepositVal);
      showToast(`Account "${accountName}" created.`);
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
          <div 
            key={acc.id} 
            className={`bank-card ${selectedAccountId === acc.id ? 'active' : ''}`}
            style={{ 
              background: acc.color || '#1e293b',
              border: selectedAccountId === acc.id ? '2.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: selectedAccountId === acc.id ? '0 0 15px rgba(99, 102, 241, 0.4)' : '0 10px 25px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedAccountId(acc.id)}
          >
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
                {acc.accountNumber ? `A/C: ${acc.accountNumber}` : 'A/C: N/A'}
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

      {/* Selected Account ePassbook Section */}
      {selectedAccountId && (() => {
        const selectedAcc = accounts.find(a => a.id === selectedAccountId);
        if (!selectedAcc) return null;
        
        const passbookData = getPassbookData();
        
        return (
          <div className="panel" style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>ePassbook Statement</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Account: <strong>{selectedAcc.bankName}</strong> ({selectedAcc.accountName}) • No: {selectedAcc.accountNumber || 'N/A'}
                </p>
              </div>
              
              {/* Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                  <label style={{ marginBottom: 0, fontSize: '0.8rem' }}>Filter:</label>
                  <select 
                    className="input-ctrl" 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)} 
                    style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <option value="all">All Logs</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="dates">Date Range</option>
                  </select>
                </div>
                
                {filterType === 'monthly' && (
                  <>
                    <select 
                      className="input-ctrl" 
                      value={filterMonth} 
                      onChange={e => setFilterMonth(e.target.value)} 
                      style={{ width: '110px', padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      {monthsList.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      className="input-ctrl" 
                      value={filterYear} 
                      onChange={e => setFilterYear(e.target.value)} 
                      style={{ width: '80px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </>
                )}
                
                {filterType === 'yearly' && (
                  <input 
                    type="number" 
                    className="input-ctrl" 
                    value={filterYear} 
                    onChange={e => setFilterYear(e.target.value)} 
                    style={{ width: '80px', padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                )}
                
                {filterType === 'dates' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="date" 
                      className="input-ctrl" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input 
                      type="date" 
                      className="input-ctrl" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Payee</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Debit (Outflow)</th>
                    <th style={{ textAlign: 'right' }}>Credit (Inflow)</th>
                    <th style={{ textAlign: 'right' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {passbookData.map(tx => {
                    const symbol = currencySymbols[settings.currency || 'LKR'] || 'Rs.';
                    return (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td>
                          <span className={`badge badge-${tx.isOutflow ? 'expense' : 'income'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.category}</td>
                        <td>{tx.payee || 'N/A'}</td>
                        <td>{tx.description}</td>
                        <td style={{ textAlign: 'right', color: '#f43f5e', fontWeight: 600 }}>
                          {tx.isOutflow ? `${symbol} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                          {tx.isInflow ? `${symbol} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(tx.runningBalance, settings.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {passbookData.length === 0 && (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div className="empty-state-text">No ePassbook entries found matching the filter bounds.</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
              <label>Account Holder Name</label>
              <input 
                type="text" 
                className="input-ctrl" 
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="e.g. John Doe, A. B. Perera"
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
                <label>Account Number</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 8012345678"
                  required
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
