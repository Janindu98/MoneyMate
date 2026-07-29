import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import { formatCurrency } from '../../utils/format';

export default function Transactions() {
  const { 
    accounts, 
    transactions, 
    categories, 
    addTransaction, 
    editTransaction, 
    deleteTransaction, 
    addCategory, 
    settings 
  } = useDatabase();
  const { showToast } = useToast();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filters & Pagination State
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Transaction Form Fields
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txBankId, setTxBankId] = useState('');
  const [txTargetBankId, setTxTargetBankId] = useState(''); // Only used for Online Transfer
  const [txType, setTxType] = useState('Expense'); // Income, Expense, Online Transfer, Deposit, Withdrawal, online payment
  const [txCategory, setTxCategory] = useState('');
  const [txPayee, setTxPayee] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');

  // Category Form Fields
  const [newCatType, setNewCatType] = useState('expense'); // income or expense
  const [newCatName, setNewCatName] = useState('');

  // 1. Types list based on user spec
  const paymentTypes = [
    'Income',
    'Expense',
    'Online Transfer',
    'Deposit',
    'Withdrawal',
    'online payment'
  ];

  // 2. Fetch Category options dynamically based on transaction type selection
  const getCategoryOptions = (type) => {
    // If it's an Income or Deposit, load income categories.
    // Otherwise load expense categories.
    const isIncomeType = type === 'Income' || type === 'Deposit';
    return isIncomeType ? categories.income : categories.expense;
  };

  const handleTxTypeChange = (type) => {
    setTxType(type);
    const opts = getCategoryOptions(type);
    setTxCategory(opts[0] || 'Other');
  };

  // Open transaction modals
  const handleOpenAddTxModal = () => {
    if (accounts.length === 0) {
      showToast('Please create at least one Bank Account first.', 'error');
      return;
    }
    setEditId(null);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxBankId(accounts[0].id);
    setTxTargetBankId(accounts[1]?.id || '');
    setTxType('Expense');
    const defaultCats = categories.expense;
    setTxCategory(defaultCats[0] || 'Other');
    setTxPayee('');
    setTxAmount('');
    setTxDesc('');
    setIsTxModalOpen(true);
  };

  const handleOpenEditTxModal = (tx) => {
    setEditId(tx.id);
    setTxDate(tx.date);
    setTxBankId(tx.bankId);
    setTxTargetBankId(tx.targetBankId || '');
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxPayee(tx.payee || '');
    setTxAmount(tx.amount.toString());
    setTxDesc(tx.description || '');
    setIsTxModalOpen(true);
  };

  // Submit transaction
  const handleTxSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount) || 0;

    if (amountVal <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }
    if (!txBankId) {
      showToast('Please select a bank account.', 'error');
      return;
    }
    if (txType === 'Online Transfer' && txBankId === txTargetBankId) {
      showToast('Source and Destination accounts must be different for transfers.', 'error');
      return;
    }

    const payload = {
      date: txDate,
      bankId: txBankId,
      targetBankId: txType === 'Online Transfer' ? txTargetBankId : '',
      type: txType,
      category: txCategory,
      payee: txPayee.trim(),
      amount: amountVal,
      description: txDesc.trim()
    };

    if (editId) {
      editTransaction(editId, payload);
      showToast('Transaction updated.');
    } else {
      addTransaction(payload);
      showToast('Transaction logged.');
    }

    setIsTxModalOpen(false);
  };

  // Submit custom category
  const handleCatSubmit = (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    const success = addCategory(newCatType, name);
    if (success) {
      showToast(`Category "${name}" added to ${newCatType} options.`);
      setNewCatName('');
      setIsCatModalOpen(false);
    } else {
      showToast('This category already exists.', 'error');
    }
  };

  const handleDeleteTx = (id, desc) => {
    if (confirm(`Are you sure you want to delete transaction "${desc}"?`)) {
      deleteTransaction(id);
      showToast('Transaction deleted.');
    }
  };

  // Filter Ledger
  const filteredTx = transactions.filter(tx => {
    const matchesAcc = filterAccount === 'all' || tx.bankId === filterAccount || tx.targetBankId === filterAccount;
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCat = filterCategory === 'all' || tx.category === filterCategory;
    const search = searchQuery.toLowerCase();
    const matchesSearch = tx.description.toLowerCase().includes(search) || 
      tx.category.toLowerCase().includes(search) || 
      (tx.payee && tx.payee.toLowerCase().includes(search));

    return matchesAcc && matchesType && matchesCat && matchesSearch;
  });

  // Sort descending by date
  filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination Math
  const totalRecords = filteredTx.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const currentPage = page > totalPages ? totalPages : page;
  const startIdx = (currentPage - 1) * limit;
  const paginatedTx = filteredTx.slice(startIdx, startIdx + limit);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Transaction Ledger</h1>
          <p>Search money movements and create custom categories.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setIsCatModalOpen(true)}>
            Manage Categories
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddTxModal}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Transaction
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="panel filter-bar">
        <div className="filter-group">
          <select className="input-ctrl filter-select" value={filterAccount} onChange={e => { setPage(1); setFilterAccount(e.target.value); }}>
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
            ))}
          </select>

          <select className="input-ctrl filter-select" value={filterType} onChange={e => { setPage(1); setFilterType(e.target.value); }}>
            <option value="all">All Types</option>
            {paymentTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select className="input-ctrl filter-select" value={filterCategory} onChange={e => { setPage(1); setFilterCategory(e.target.value); }}>
            <option value="all">All Categories</option>
            <optgroup label="Income">
              {categories.income.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
            <optgroup label="Expense">
              {categories.expense.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <input 
          type="text" 
          className="input-ctrl search-input" 
          value={searchQuery}
          onChange={e => { setPage(1); setSearchQuery(e.target.value); }}
          placeholder="Search descriptions, categories, payees..."
        />
      </div>

      {/* Ledger Table */}
      <div className="panel">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bank Account</th>
                <th>Payment Type</th>
                <th>Category</th>
                <th>Payee / Recipient</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTx.map(tx => {
                const sourceAcc = accounts.find(a => a.id === tx.bankId);
                const targetAcc = accounts.find(a => a.id === tx.targetBankId);
                const isOutflow = ['Expense', 'Withdrawal', 'online payment', 'Online Transfer'].includes(tx.type) && tx.bankId === sourceAcc?.id;
                
                return (
                  <tr key={tx.id}>
                    <td>{tx.date}</td>
                    <td>
                      {tx.type === 'Online Transfer' ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>From: {sourceAcc ? sourceAcc.bankName : 'Unknown'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>To: {targetAcc ? targetAcc.bankName : 'Unknown'}</div>
                        </div>
                      ) : (
                        sourceAcc ? sourceAcc.bankName : 'Unknown'
                      )}
                    </td>
                    <td><span className={`badge badge-${isOutflow ? 'expense' : 'income'}`}>{tx.type}</span></td>
                    <td>{tx.category}</td>
                    <td>{tx.payee || 'N/A'}</td>
                    <td>{tx.description}</td>
                    <td>
                      <span className={`amount ${isOutflow ? 'expense' : 'income'}`}>
                        {isOutflow ? '-' : '+'}{formatCurrency(tx.amount, settings.currency)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-icon-only" style={{ width: '28px', height: '28px' }} onClick={() => handleOpenEditTxModal(tx)} title="Edit">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button className="btn btn-danger btn-icon-only" style={{ width: '28px', height: '28px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }} onClick={() => handleDeleteTx(tx.id, tx.description)} title="Delete">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedTx.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div className="empty-state-text">No matching transactions in ledger.</div>
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div className="pagination">
          <span className="pagination-text">
            Showing {totalRecords > 0 ? startIdx + 1 : 0}-{Math.min(startIdx + limit, totalRecords)} of {totalRecords} transactions
          </span>
          <div className="pagination-buttons">
            <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </button>
            <button className="btn btn-secondary" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD/EDIT TRANSACTION */}
      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title={editId ? 'Edit Transaction' : 'Record Transaction'}>
        <form onSubmit={handleTxSubmit}>
          <div className="modal-body">
            <div className="form-row-2">
              <div className="form-group">
                <label>Payment Type</label>
                <select className="input-ctrl" value={txType} onChange={e => handleTxTypeChange(e.target.value)}>
                  {paymentTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{txType === 'Online Transfer' ? 'Source Account' : 'Bank Account'}</label>
                <select className="input-ctrl" value={txBankId} onChange={e => setTxBankId(e.target.value)} required>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            </div>

            {txType === 'Online Transfer' && (
              <div className="form-group">
                <label>Destination Account</label>
                <select className="input-ctrl" value={txTargetBankId} onChange={e => setTxTargetBankId(e.target.value)} required>
                  <option value="">Select target account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label>Amount (Rs.)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  className="input-ctrl" 
                  value={txAmount} 
                  onChange={e => setTxAmount(e.target.value)} 
                  placeholder="0.00" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  className="input-ctrl" 
                  value={txDate} 
                  onChange={e => setTxDate(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Category</label>
                <select className="input-ctrl" value={txCategory} onChange={e => setTxCategory(e.target.value)} required>
                  {getCategoryOptions(txType).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Payee / Recipient</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={txPayee} 
                  onChange={e => setTxPayee(e.target.value)} 
                  placeholder="e.g. Keells, Dialog, Self" 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input 
                type="text" 
                className="input-ctrl" 
                value={txDesc} 
                onChange={e => setTxDesc(e.target.value)} 
                placeholder="Details of the payment" 
                required 
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsTxModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Transaction</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD CUSTOM CATEGORY */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Create Custom Category">
        <form onSubmit={handleCatSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Category Group</label>
              <select className="input-ctrl" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Category Name</label>
              <input 
                type="text" 
                className="input-ctrl" 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                placeholder="e.g. WiFi, Mobile Bill, Bonus, Dividend" 
                required 
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCatModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Category</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
