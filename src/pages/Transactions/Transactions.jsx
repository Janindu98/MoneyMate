import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/format';
import { api } from '../../services/api';

export default function Transactions() {
  const {
    accounts,
    transactions,
    categories,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    settings,
    salaryHistory
  } = useDatabase();
  const { showToast } = useToast();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', requireTextInput: '' });

  const showConfirm = (title, message, onConfirm, type = 'danger', requireTextInput = '') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type, requireTextInput });
  };

  const findSalaryRecord = (tx) => {
    if (!tx) return null;
    if (tx.salaryRecordId) {
      return salaryHistory.find(s => s.id === tx.salaryRecordId);
    }
    if (tx.category === 'Salary') {
      return salaryHistory.find(s => s.netSalary === tx.amount && s.paymentDate === tx.date);
    }
    return null;
  };

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
  const [txTargetBankId, setTxTargetBankId] = useState(''); // Only used for Online/Account cash transfer
  const [txType, setTxType] = useState('Expense'); // Income, Expense, Online/Account cash transfer, Deposit, Withdrawal, online payment
  const [txCategory, setTxCategory] = useState('');
  const [txPayee, setTxPayee] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txImagePath, setTxImagePath] = useState('');
  const [txImageName, setTxImageName] = useState('');
  const [selectedTxImageBase64, setSelectedTxImageBase64] = useState('');

  React.useEffect(() => {
    if (selectedTx && selectedTx.imagePath) {
      async function loadImage() {
        const res = await api.readImageBase64(selectedTx.imagePath);
        if (res.success) {
          setSelectedTxImageBase64(res.base64);
        } else {
          console.error(res.error);
          setSelectedTxImageBase64('');
        }
      }
      loadImage();
    } else {
      setSelectedTxImageBase64('');
    }
  }, [selectedTx]);

  const handleSelectImage = async () => {
    try {
      const fileRes = await api.selectImage();
      if (!fileRes.canceled && fileRes.filePath) {
        setTxImagePath(fileRes.filePath);
        const split = fileRes.filePath.split(/[\\/]/);
        setTxImageName(split[split.length - 1]);
        showToast('Image selected. It will be copied locally on submission.');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to select image.', 'error');
    }
  };

  const handleOpenImage = async (path) => {
    if (!path) return;
    try {
      const res = await api.openFile(path);
      if (res.success) {
        showToast('Opening transaction image...');
      } else {
        showToast(`Failed to open image: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error launching image viewer.', 'error');
    }
  };

  // Category Form Fields
  const [newCatType, setNewCatType] = useState('Expense');
  const [newCatName, setNewCatName] = useState('');

  // 1. Types list based on user spec
  const paymentTypes = [
    'Income',
    'Expense',
    'Online/Account cash transfer',
    'Deposit',
    'Withdrawal',
    'Online Payment',
    'Bill & Payment'
  ];

  // 2. Fetch Category options dynamically based on transaction type selection
  const getCategoryOptions = (type) => {
    return categories[type] || [];
  };

  const handleTxTypeChange = (type) => {
    setTxType(type);
    const opts = getCategoryOptions(type);
    
    if (type === 'Online/Account cash transfer') {
      setTxCategory(opts[0] || 'Money Transfer');
      const defaultTarget = txTargetBankId || (accounts.find(a => a.id !== txBankId)?.id || '');
      setTxTargetBankId(defaultTarget);
      const targetAcc = accounts.find(a => a.id === defaultTarget);
      if (targetAcc) {
        setTxPayee(targetAcc.accountName);
      }
    } else {
      setTxCategory(opts[0] || 'Other');
    }
  };

  const handleTargetBankChange = (targetId) => {
    setTxTargetBankId(targetId);
    if (txType === 'Online/Account cash transfer') {
      const targetAcc = accounts.find(a => a.id === targetId);
      if (targetAcc) {
        setTxPayee(targetAcc.accountName);
      }
    }
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
    setTxImagePath('');
    setTxImageName('');
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
    setTxImagePath(tx.imagePath || '');
    if (tx.imagePath) {
      const split = tx.imagePath.split(/[\\/]/);
      setTxImageName(split[split.length - 1]);
    } else {
      setTxImageName('');
    }
    setIsTxModalOpen(true);
  };

  // Submit transaction
  const handleTxSubmit = async (e) => {
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
    if (txType === 'Online/Account cash transfer' && txBankId === txTargetBankId) {
      showToast('Source and Destination accounts must be different for transfers.', 'error');
      return;
    }

    let finalImagePath = txImagePath;
    if (txImagePath && !txImagePath.includes('transaction_images')) {
      const copyRes = await api.saveTransactionImage(txImagePath);
      if (copyRes.success) {
        finalImagePath = copyRes.filePath;
      } else {
        showToast(`Failed to archive transaction image: ${copyRes.error}`, 'error');
        return;
      }
    }

    const payload = {
      date: txDate,
      bankId: txBankId,
      targetBankId: txType === 'Online/Account cash transfer' ? txTargetBankId : '',
      type: txType,
      category: txCategory,
      payee: txType === 'Online/Account cash transfer' 
        ? (accounts.find(a => a.id === txTargetBankId)?.accountName || 'Self') 
        : txPayee.trim(),
      amount: amountVal,
      description: txDesc.trim() || `${txType} - ${txCategory}`,
      imagePath: finalImagePath
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
    } else {
      showToast('This category already exists.', 'error');
    }
  };

  const isDefaultCategory = (type, catName) => {
    const defaults = {
      'Income': ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
      'Expense': ['Food & Dining', 'Groceries', 'Transportation', 'Fuel', 'Healthcare & Medical', 'Shopping', 'Family & Gifts', 'Education', 'Other'],
      'Online/Account cash transfer': ['Money Transfer', 'Wallet Transfer'],
      'Deposit': ['Cash Deposit', 'Bank Deposit', 'Other Deposit'],
      'Withdrawal': ['Cash Withdrawal', 'ATM Withdrawal', 'Other'],
      'Online Payment': ['Food', 'Fuel', 'Shopping', 'Transportations', 'Transaction Charges', 'Other'],
      'Bill & Payment': ['Electricity', 'Water', 'Internet', 'Mobile phone', 'Insurance', 'Credit cards', 'Rent', 'Alert Charges', 'Debit Card Annual Fee', 'Subscriptions', 'Government Payment', 'Other']
    };
    return (defaults[type] || []).includes(catName);
  };

  const handleDeleteCategory = (type, catName) => {
    showConfirm(
      'Delete Category',
      `Are you sure you want to remove the category "${catName}" from ${type} types?`,
      () => {
        deleteCategory(type, catName);
        showToast(`Category "${catName}" deleted.`);
      }
    );
  };

  const handleDeleteTx = (id, desc) => {
    showConfirm(
      'Delete Transaction',
      `Are you sure you want to delete transaction "${desc}"?`,
      () => {
        deleteTransaction(id);
        showToast('Transaction deleted.');
      }
    );
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
  filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date) || transactions.indexOf(b) - transactions.indexOf(a));

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
          <button className="btn btn-primary" onClick={() => setIsCatModalOpen(true)}>
            Manage Categories
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddTxModal}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
            {paymentTypes.map(pt => {
              const cats = categories[pt] || [];
              if (cats.length === 0) return null;
              return (
                <optgroup key={pt} label={pt}>
                  {cats.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              );
            })}
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
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTx.map(tx => {
                const sourceAcc = accounts.find(a => a.id === tx.bankId);
                const targetAcc = accounts.find(a => a.id === tx.targetBankId);
                const isOutflow = ['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Online/Account cash transfer', 'Bill & Payment'].includes(tx.type) && tx.bankId === sourceAcc?.id;

                return (
                  <tr key={tx.id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => setSelectedTx(tx)}>{tx.date}</td>
                    <td onClick={() => setSelectedTx(tx)}>
                      {tx.type === 'Online/Account cash transfer' ? (
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>From: {sourceAcc ? sourceAcc.bankName : 'Unknown'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>To: {targetAcc ? targetAcc.bankName : 'Unknown'}</div>
                        </div>
                      ) : (
                        sourceAcc ? sourceAcc.bankName : 'Unknown'
                      )}
                    </td>
                    <td onClick={() => setSelectedTx(tx)}>
                       <span className={`badge ${tx.type === 'Online/Account cash transfer' ? 'badge-transfer' : (isOutflow ? 'badge-expense' : 'badge-income')}`}>
                         {tx.type}
                       </span>
                     </td>
                     <td onClick={() => setSelectedTx(tx)}>{tx.category}</td>
                     <td onClick={() => setSelectedTx(tx)}>{tx.payee || 'N/A'}</td>
                     <td onClick={() => setSelectedTx(tx)}>
                       <span className={`amount ${tx.type === 'Online/Account cash transfer' ? 'transfer' : (isOutflow ? 'expense' : 'income')}`}>
                         {isOutflow ? '-' : '+'}{formatCurrency(tx.amount, settings.currency)}
                       </span>
                     </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-icon-only" style={{ width: '28px', height: '28px' }} onClick={() => setSelectedTx(tx)} title="View Details">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        <button className="btn btn-secondary btn-icon-only" style={{ width: '28px', height: '28px' }} onClick={() => handleOpenEditTxModal(tx)} title="Edit">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button className="btn btn-danger btn-icon-only" style={{ width: '28px', height: '28px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }} onClick={() => handleDeleteTx(tx.id, tx.description)} title="Delete">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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
                <label>{txType === 'Online/Account cash transfer' ? 'Source Account' : 'Bank Account'}</label>
                <select className="input-ctrl" value={txBankId} onChange={e => setTxBankId(e.target.value)} required>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            </div>

            {txType === 'Online/Account cash transfer' && (
              <div className="form-group">
                <label>Destination Account</label>
                <select className="input-ctrl" value={txTargetBankId} onChange={e => handleTargetBankChange(e.target.value)} required>
                  <option value="">Select target account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label>Amount</label>
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
                  placeholder={txType === 'Online/Account cash transfer' ? "Recipient account holder" : "e.g. Keells, Dialog, Self"}
                  disabled={txType === 'Online/Account cash transfer'}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                className="input-ctrl"
                value={txDesc}
                onChange={e => setTxDesc(e.target.value)}
                placeholder="Details of the payment (e.g. Weekly Groceries)"
              />
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>Transaction Image (Optional Receipt / Invoice)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSelectImage}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {txImagePath ? 'Change Image' : 'Select Image'}
                </button>
                {txImagePath && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    {txImageName}
                    <button
                      type="button"
                      onClick={() => { setTxImagePath(''); setTxImageName(''); }}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Remove Attachment"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsTxModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Transaction</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MANAGE CATEGORIES */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Manage Categories">
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600 }}>Select Payment Type</label>
            <select 
              className="input-ctrl" 
              value={newCatType} 
              onChange={e => setNewCatType(e.target.value)}
            >
              {paymentTypes.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Existing Categories for {newCatType}
            </label>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              maxHeight: '150px', 
              overflowY: 'auto', 
              padding: '10px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px' 
            }}>
              {(categories[newCatType] || []).length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categories defined.</span>
              ) : (
                (categories[newCatType] || []).map(cat => {
                  const isDefault = isDefaultCategory(newCatType, cat);
                  return (
                    <span 
                      key={cat} 
                      className="badge badge-secondary" 
                      style={{ 
                        fontSize: '0.85rem', 
                        padding: '6px 10px', 
                        background: 'rgba(255,255,255,0.05)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {cat}
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(newCatType, cat)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f43f5e',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remove Category"
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          <form onSubmit={handleCatSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 600 }}>Add New Category</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  className="input-ctrl"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. WiFi, Mobile Bill, Bonus, Dividend"
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setIsCatModalOpen(false)}>Close</button>
        </div>
      </Modal>

      {/* MODAL: TRANSACTION DETAILS & INSPECTOR */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (() => {
          const sourceAcc = accounts.find(a => a.id === selectedTx.bankId);
          const targetAcc = accounts.find(a => a.id === selectedTx.targetBankId);
          const isOutflow = ['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Online/Account cash transfer', 'Bill & Payment'].includes(selectedTx.type) && selectedTx.bankId === sourceAcc?.id;
          const salaryRec = findSalaryRecord(selectedTx);

          const handleOpenPayslip = async (path) => {
            if (!path) return;
            try {
              const res = await api.openFile(path);
              if (res.success) {
                showToast('Opening payslip document attachment...');
              } else {
                showToast(`Failed to open payslip: ${res.error}`, 'error');
              }
            } catch (err) {
              console.error(err);
              showToast('Error launching document viewer.', 'error');
            }
          };

          return (
            <div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>{selectedTx.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment Type</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${selectedTx.type === 'Online/Account cash transfer' ? 'badge-transfer' : (isOutflow ? 'badge-expense' : 'badge-income')}`} style={{ fontSize: '0.85rem' }}>{selectedTx.type}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bank Account</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                      {selectedTx.type === 'Online/Account cash transfer' ? (
                        <span>From {sourceAcc ? sourceAcc.bankName : 'Unknown'} to {targetAcc ? targetAcc.bankName : 'Unknown'}</span>
                      ) : (
                        sourceAcc ? sourceAcc.bankName : 'Unknown'
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>{selectedTx.category}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payee / Recipient</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>{selectedTx.payee || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transaction Amount</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: selectedTx.type === 'Online/Account cash transfer' ? '#6366f1' : (isOutflow ? '#f43f5e' : '#10b981'), marginTop: '2px' }}>
                      {isOutflow ? '-' : '+'}{formatCurrency(selectedTx.amount, settings.currency)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Description</div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginTop: '4px', fontStyle: 'italic', fontSize: '0.95rem' }}>
                    {selectedTx.description || 'No description provided.'}
                  </div>
                </div>

                {selectedTx.imagePath ? (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Attached Receipt / Invoice
                    </h3>
                    {selectedTxImageBase64 ? (
                      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', padding: '10px' }}>
                        <img 
                          src={selectedTxImageBase64} 
                          alt="Transaction attachment" 
                          style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block', cursor: 'pointer', borderRadius: '4px' }}
                          onClick={() => handleOpenImage(selectedTx.imagePath)}
                          title="Click to open image in system viewer"
                        />
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading attachment image...</div>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => handleOpenImage(selectedTx.imagePath)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px' }}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Open Original Image file
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      Attached Receipt / Invoice
                    </h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No receipt or image attached to this transaction.</div>
                  </div>
                )}

                {/* salary details if linked */}
                {salaryRec && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      Linked Salary Paystub Breakdown
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      <div><strong>Company:</strong> {salaryRec.company}</div>
                      <div><strong>Position:</strong> {salaryRec.position}</div>
                      <div><strong>Pay Period:</strong> {salaryRec.month} {salaryRec.year}</div>
                      <div><strong>Employer ID:</strong> {salaryRec.employerId || 'N/A'}</div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Earnings Details</h4>
                      <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.85rem' }}>
                        <span>Basic Salary</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(salaryRec.basicSalary, settings.currency)}</span>
                      </div>
                      <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                        <span>Fixed Allowance</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(salaryRec.fixedAllowance, settings.currency)}</span>
                      </div>
                      {(salaryRec.otherAllowances > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Other Allowances</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(salaryRec.otherAllowances, settings.currency)}</span>
                        </div>
                      )}
                      {(salaryRec.bonus > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Bonus</span>
                          <span style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(salaryRec.bonus, settings.currency)}</span>
                        </div>
                      )}
                      {(salaryRec.overtime > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Overtime Pay</span>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{formatCurrency(salaryRec.overtime, settings.currency)}</span>
                        </div>
                      )}
                    </div>

                     <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Deductions & Statutory</h4>
                      
                      {salaryRec.contributions && salaryRec.contributions.length > 0 ? (
                        salaryRec.contributions.map(c => (
                          <React.Fragment key={c.id || c.name}>
                            {c.employeeContribution > 0 && (
                              <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                                <span>{c.name} Employee ({c.employeeRate}%)</span>
                                <span>{formatCurrency(c.employeeContribution, settings.currency)}</span>
                              </div>
                            )}
                            {c.employerContribution > 0 && (
                              <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                                <span>{c.name} Employer ({c.employerRate}%)</span>
                                <span>{formatCurrency(c.employerContribution, settings.currency)}</span>
                              </div>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <>
                          {salaryRec.epfEmployee > 0 && (
                            <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.85rem' }}>
                              <span>EPF Employee contribution (8%)</span>
                              <span>{formatCurrency(salaryRec.epfEmployee, settings.currency)}</span>
                            </div>
                          )}
                          {salaryRec.epfCompany > 0 && (
                            <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                              <span>EPF Company contribution (12%)</span>
                              <span>{formatCurrency(salaryRec.epfCompany, settings.currency)}</span>
                            </div>
                          )}
                          {salaryRec.etfCompany > 0 && (
                            <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                              <span>ETF Company contribution (3%)</span>
                              <span>{formatCurrency(salaryRec.etfCompany, settings.currency)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {(salaryRec.tax > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Tax{salaryRec.taxType ? ` (${salaryRec.taxType})` : ''}</span>
                          <span>{formatCurrency(salaryRec.tax, settings.currency)}</span>
                        </div>
                      )}
                      {(salaryRec.loanDeduction > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Loan Deductions</span>
                          <span>{formatCurrency(salaryRec.loanDeduction, settings.currency)}</span>
                        </div>
                      )}
                      {(salaryRec.otherDeduction > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Other Deductions</span>
                          <span>{formatCurrency(salaryRec.otherDeduction, settings.currency)}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.9rem' }}>
                      <span><strong>Net Allowance:</strong> {formatCurrency(salaryRec.netAllowance, settings.currency)}</span>
                      <span><strong>Net Disbursed:</strong> <strong style={{ color: '#10b981' }}>{formatCurrency(salaryRec.netSalary, settings.currency)}</strong></span>
                    </div>

                    {salaryRec.payslipPath && (
                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <button type="button" className="btn btn-primary" onClick={() => handleOpenPayslip(salaryRec.payslipPath)} style={{ width: '100%' }}>
                          📄 Open Attached Payslip Document
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTx(null)}>Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        requireTextInput={confirmState.requireTextInput}
      />
    </div>
  );
}
