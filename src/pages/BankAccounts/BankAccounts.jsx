import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/format';
import { api } from '../../services/api';

export default function BankAccounts() {
  const { accounts, transactions, addAccount, editAccount, deleteAccount, settings, salaryHistory } = useDatabase();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAccountId, setViewAccountId] = useState(null);
  const [viewRevealPin, setViewRevealPin] = useState(false);
  const [viewRevealNumber, setViewRevealNumber] = useState(false);
  const [viewRevealCvv, setViewRevealCvv] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', requireTextInput: '' });

  const isCardEligible = (type) => type === 'Savings' || type === 'Credit Card';

  const handleOpenViewModal = (acc) => {
    setViewAccountId(acc.id);
    setViewRevealPin(false);
    setViewRevealNumber(false);
    setViewRevealCvv(false);
    setIsViewModalOpen(true);
  };

  const showConfirm = (title, message, onConfirm, type = 'danger', requireTextInput = '') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type, requireTextInput });
  };

  const findSalaryRecord = (tx) => {
    if (!tx) return null;
    if (tx.salaryRecordId) {
      return salaryHistory?.find(s => s.id === tx.salaryRecordId);
    }
    if (tx.category === 'Salary') {
      return salaryHistory?.find(s => s.netSalary === tx.amount && s.paymentDate === tx.date);
    }
    return null;
  };

  // Form Fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [status, setStatus] = useState('Active');
  const [cardColor, setCardColor] = useState('#4f46e5');
  const [initialDeposit, setInitialDeposit] = useState('');

  // Debit Card Fields
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardPin, setCardPin] = useState('');

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

  // Secure Card Vault Modal States
  const [isCardVaultOpen, setIsCardVaultOpen] = useState(false);
  const [selectedVaultAccount, setSelectedVaultAccount] = useState(null);
  const [revealVaultPin, setRevealVaultPin] = useState(false);
  const [revealVaultNumber, setRevealVaultNumber] = useState(false);

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
    LKR: 'Rs.',
    KRW: '₩',
    RUB: '₽',
    AED: 'د.إ',
    SAR: '﷼'
  };

  const getPassbookData = () => {
    if (!selectedAccountId) return [];

    // Get all transactions for this account
    const accTx = transactions.filter(t =>
      t.bankId === selectedAccountId ||
      (t.type === 'Online/Account cash transfer' && t.targetBankId === selectedAccountId)
    );

    // Map transactions to include their original index in the main transactions list
    const accTxWithIndex = accTx.map(tx => ({
      tx,
      index: transactions.indexOf(tx)
    }));

    // Sort chronologically (date ascending) to compute running balance correctly
    const sortedAccTx = [...accTxWithIndex].sort((a, b) => new Date(a.tx.date) - new Date(b.tx.date) || a.index - b.index);

    let running = 0;
    const computedTx = sortedAccTx.map(item => {
      const tx = item.tx;
      let isOutflow = false;
      let isInflow = false;

      if (tx.bankId === selectedAccountId) {
        if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
          isInflow = true;
          running += tx.amount;
        } else if (['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Online/Account cash transfer', 'Bill & Payment'].includes(tx.type)) {
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
        runningBalance: running,
        originalIndex: item.index
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
          current.setHours(0, 0, 0, 0);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          return current >= start && current <= end;
        }
        return true;
      }
      return true;
    });

    // Show most recent transaction first (descending)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.originalIndex - a.originalIndex);
  };

  // Colors available for selection
  const colorThemes = [
    { value: '#4f46e5', label: 'Royal Indigo' },
    { value: '#10b981', label: 'Teal Emerald' },
    { value: '#7c3aed', label: 'Vibrant Purple' },
    { value: '#f59e0b', label: 'Warm Amber' },
    { value: '#3b82f6', label: 'Ocean Blue' },
    { value: '#1e293b', label: 'Slate Slate' },
    { value: '#f43f5e', label: 'Crimson Rose' },
    { value: '#db2777', label: 'Sunset Berry' },
    { value: '#0d9488', label: 'Forest Pine' },
    { value: '#b45309', label: 'Golden Bronze' },
    { value: '#2563eb', label: 'Cobalt Neon' }
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
    setInitialDeposit('0');
    setCardNo('');
    setCardExpiry('');
    setCardCvv('');
    setCardPin('');
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
    setInitialDeposit('0'); // Disabled or ignored during edit
    setCardNo(acc.cardNo || '');
    setCardExpiry(acc.cardExpiry || '');
    setCardCvv(acc.cardCvv || '');
    setCardPin(acc.cardPin || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bankName.trim() || !accountName.trim()) {
      showToast('Please enter both Bank and Account Names.', 'error');
      return;
    }

    const isEligible = isCardEligible(accountType);
    if (isEligible && cardPin.trim() && (cardPin.trim().length < 4 || cardPin.trim().length > 8)) {
      showToast('Card PIN must be between 4 and 8 digits.', 'error');
      return;
    }

    const payload = {
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      branch: branch.trim(),
      accountType,
      currency: settings?.currency || 'USD',
      status,
      color: cardColor,
      cardNo: isEligible ? cardNo.trim() : '',
      cardExpiry: isEligible ? cardExpiry.trim() : '',
      cardCvv: isEligible ? cardCvv.trim() : '',
      cardPin: isEligible ? cardPin.trim() : ''
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
    showConfirm(
      'Delete Bank Account',
      `Wipe "${name}"? This permanently deletes the account and all corresponding transaction ledgers.`,
      () => {
        deleteAccount(id);
        showToast(`Account "${name}" deleted.`);
      }
    );
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
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
                {isCardEligible(acc.accountType) && (acc.cardPin || acc.cardNo) && (
                  <button className="btn-card-action" onClick={() => { setSelectedVaultAccount(acc); setRevealVaultPin(false); setRevealVaultNumber(false); setIsCardVaultOpen(true); }} style={{ background: 'rgba(99, 102, 241, 0.25)' }} title="Reveal Card PIN & Info">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </button>
                )}
                <button className="btn-card-action" onClick={() => handleOpenViewModal(acc)} title="View Account Details">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
                <button className="btn-card-action" onClick={() => handleDelete(acc.id, acc.bankName)} style={{ background: 'rgba(244, 63, 94, 0.3)' }} title="Delete Account">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="panel empty-state" style={{ gridColumn: '1 / -1' }}>
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
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
                    <th style={{ textAlign: 'right' }}>Debit (Outflow)</th>
                    <th style={{ textAlign: 'right' }}>Credit (Inflow)</th>
                    <th style={{ textAlign: 'right' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {passbookData.map(tx => {
                    const symbol = currencySymbols[settings.currency || 'USD'] || '$';
                    return (
                      <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTx(tx)}>
                        <td>{tx.date}</td>
                        <td>
                          <span className={`badge ${tx.type === 'Online/Account cash transfer' ? 'badge-transfer' : (tx.isOutflow ? 'badge-expense' : 'badge-income')}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.category}</td>
                        <td>{tx.payee || 'N/A'}</td>
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
                  <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <div className="empty-state-text">No ePassbook entries found matching the filter bounds.</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* VIEW ACCOUNT DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Bank Account Details"
      >
        {(() => {
          if (!viewAccountId) return null;
          const liveAcc = accounts.find(a => a.id === viewAccountId) || {};
          return (
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {/* Visual Card Header */}
              <div style={{
                background: liveAcc.color || '#1e293b',
                borderRadius: '16px',
                padding: '22px 24px',
                color: '#fff',
                marginBottom: '20px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px' }}>{liveAcc.bankName || 'Cash'}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: liveAcc.status === 'Active' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {liveAcc.status || 'Active'}
                  </span>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{liveAcc.accountName}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px' }}>
                    {formatCurrency(liveAcc.balance, settings.currency)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', opacity: 0.9 }}>
                  <span>{liveAcc.accountNumber ? `A/C: ${liveAcc.accountNumber}` : 'A/C: N/A'}</span>
                  <span>{liveAcc.accountType || 'Savings'}</span>
                </div>
              </div>

              {/* Specification Grid */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bank / Institution</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveAcc.bankName || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Holder</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveAcc.accountName || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Number</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace' }}>{liveAcc.accountNumber || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Type</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveAcc.accountType || 'Savings'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Branch Location</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveAcc.branch || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Currency</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveAcc.currency || settings.currency || 'USD'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: liveAcc.status === 'Active' ? '#34d399' : '#f87171'
                  }}>
                    {liveAcc.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Debit / Credit Card Information Section (Savings and Credit Card only) */}
              {isCardEligible(liveAcc.accountType) && (
                <div style={{
                  marginTop: '18px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                      {liveAcc.accountType === 'Credit Card' ? 'Credit Card Information' : 'Debit Card Information'}
                    </div>
                  {(liveAcc.cardNo || liveAcc.cardPin) && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setSelectedVaultAccount(liveAcc);
                        setRevealVaultPin(false);
                        setRevealVaultNumber(false);
                        setIsCardVaultOpen(true);
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Open Card Vault
                    </button>
                  )}
                </div>

                {(!liveAcc.cardNo && !liveAcc.cardPin && !liveAcc.cardExpiry && !liveAcc.cardCvv) ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                    No debit card details linked to this account yet. Click "Edit Account" below to add card number, expiry, and secure PIN.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Card Number */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Card Number</span>
                        {liveAcc.cardNo && (
                          <button
                            type="button"
                            onClick={() => setViewRevealNumber(!viewRevealNumber)}
                            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                          >
                            {viewRevealNumber ? 'Hide' : 'Reveal'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.05em' }}>
                        {liveAcc.cardNo ? (
                          viewRevealNumber ? (
                            liveAcc.cardNo.replace(/(\d{4})/g, '$1 ').trim()
                          ) : (
                            `${liveAcc.cardNo.slice(0, 4)} •••• •••• ${liveAcc.cardNo.slice(-4)}`
                          )
                        ) : 'Not Provided'}
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Expiry Date</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                        {liveAcc.cardExpiry || 'N/A'}
                      </div>
                    </div>

                    {/* CVV */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>CVV</span>
                        {liveAcc.cardCvv && (
                          <button
                            type="button"
                            onClick={() => setViewRevealCvv(!viewRevealCvv)}
                            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                          >
                            {viewRevealCvv ? 'Hide' : 'Reveal'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                        {liveAcc.cardCvv ? (viewRevealCvv ? liveAcc.cardCvv : '•••') : 'N/A'}
                      </div>
                    </div>

                    {/* Card PIN */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Card PIN</span>
                        {liveAcc.cardPin && (
                          <button
                            type="button"
                            onClick={() => setViewRevealPin(!viewRevealPin)}
                            style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.72rem', padding: 0 }}
                          >
                            {viewRevealPin ? 'Hide' : 'Reveal'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: viewRevealPin ? '#34d399' : '#fff' }}>
                        {liveAcc.cardPin ? (viewRevealPin ? liveAcc.cardPin : '••••') : 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          );
        })()}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsViewModalOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const targetAcc = accounts.find(a => a.id === viewAccountId);
              setIsViewModalOpen(false);
              if (targetAcc) {
                handleOpenEditModal(targetAcc);
              }
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            Edit Account
          </button>
        </div>
      </Modal>

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
                placeholder="e.g. ABC Bank, HNB, Sampath, Cash"
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
                  <label>Starting Balance</label>
                  <input
                    type="number"
                    className="input-ctrl"
                    value={initialDeposit}
                    onChange={e => setInitialDeposit(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            {/* Card Details Section (Savings & Credit Card only) */}
            {isCardEligible(accountType) && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  {accountType === 'Credit Card' ? 'Credit Card Information (Optional)' : 'Debit Card Information (Optional)'}
                </h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Card Number (16 Digits)</label>
                    <input
                      type="text"
                      className="input-ctrl"
                      value={cardNo}
                      onChange={e => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="e.g. 4000 1234 5678 9012"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date (MM/YY)</label>
                    <input
                      type="text"
                      className="input-ctrl"
                      value={cardExpiry}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (val.length > 2) {
                          val = val.slice(0, 2) + '/' + val.slice(2);
                        }
                        setCardExpiry(val);
                      }}
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>
                </div>
                <div className="form-row-2" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label>Card CVV (3 Digits)</label>
                    <input
                      type="password"
                      className="input-ctrl"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="e.g. 123"
                      maxLength="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Card PIN Number (4-8 Digits)</label>
                    <input
                      type="password"
                      className="input-ctrl"
                      value={cardPin}
                      onChange={e => setCardPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="e.g. 987654"
                      maxLength="8"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Account</button>
          </div>
        </form>
      </Modal>

      {/* DEBIT CARD VAULT MODAL */}
      <Modal isOpen={isCardVaultOpen} onClose={() => setIsCardVaultOpen(false)} title="Secure Debit Card Vault">
        {selectedVaultAccount && (
          <div className="modal-body" style={{ padding: '24px 32px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
              🔒 This vault displays stored details offline for <strong>{selectedVaultAccount.bankName}</strong> to help you memorize the PIN.
            </p>

            {/* Premium Physical Debit Card Render */}
            <div style={{
              background: selectedVaultAccount.color || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              height: '210px',
              color: '#fff',
              position: 'relative',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              {/* Card background glowing highlights */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-20%',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                filter: 'blur(30px)'
              }}></div>

              {/* Top Row: Bank Name and chip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.5px' }}>{selectedVaultAccount.bankName}</span>
                <span style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>Debit Card</span>
              </div>

              {/* Physical Chip Icon */}
              <div style={{
                width: '42px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                marginTop: '16px',
                position: 'relative',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }}>
                <div style={{ position: 'absolute', top: '5px', left: '8px', width: '26px', height: '22px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '3px' }}></div>
              </div>

              {/* Card Number */}
              <div style={{ marginTop: '24px', fontSize: '1.35rem', fontFamily: 'monospace', letterSpacing: '2.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {revealVaultNumber ? (
                  selectedVaultAccount.cardNo ? selectedVaultAccount.cardNo.replace(/(\d{4})/g, '$1 ').trim() : 'N/A'
                ) : (
                  selectedVaultAccount.cardNo ? `•••• •••• •••• ${selectedVaultAccount.cardNo.slice(-4)}` : 'N/A'
                )}
                {selectedVaultAccount.cardNo && (
                  <button onClick={() => setRevealVaultNumber(!revealVaultNumber)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', opacity: 0.6 }} title="Reveal Card Number">
                    {revealVaultNumber ? (
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                )}
              </div>

              {/* Card Bottom: Holder Name, Expiry, CVV */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.5px' }}>Cardholder</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedVaultAccount.accountName}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>Expires</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedVaultAccount.cardExpiry || 'MM/YY'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>CVV</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>{selectedVaultAccount.cardCvv || '•••'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secure PIN Vault Segment */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Debit Card PIN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '4px', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                  {revealVaultPin ? selectedVaultAccount.cardPin : '•'.repeat(selectedVaultAccount.cardPin.length)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                onClick={() => setRevealVaultPin(!revealVaultPin)}
              >
                {revealVaultPin ? 'Hide PIN Code' : 'Reveal PIN Code'}
              </button>
            </div>
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={() => setIsCardVaultOpen(false)}>Done</button>
        </div>
      </Modal>

      {/* MODAL: TRANSACTION DETAILS & INSPECTOR */}
      <Modal isOpen={!!selectedTx} onClose={() => setSelectedTx(null)} title="Transaction Details">
        {selectedTx && (() => {
          const sourceAcc = accounts.find(a => a.id === selectedTx.bankId);
          const targetAcc = accounts.find(a => a.id === selectedTx.targetBankId);
          const isOutflow = ['Expense', 'Withdrawal', 'online payment', 'Online Payment', 'Online/Account cash transfer', 'Bill & Payment'].includes(selectedTx.type) && selectedTx.bankId === sourceAcc?.id;
          const salaryRec = findSalaryRecord(selectedTx);

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
                        <span>Allowances</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(salaryRec.allowances, settings.currency)}</span>
                      </div>
                      <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                        <span>Overtime (OT) Pay</span>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(salaryRec.otPay, settings.currency)}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Deductions Details</h4>
                      
                      {salaryRec.contributions && salaryRec.contributions.length > 0 ? (
                        salaryRec.contributions.map(c => (
                          <React.Fragment key={c.id || c.name}>
                            {c.employeeContribution > 0 && (
                              <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.85rem' }}>
                                <span>{c.name} Employee ({c.employeeRate}%)</span>
                                <span style={{ fontWeight: 600, color: '#f43f5e' }}>-{formatCurrency(c.employeeContribution, settings.currency)}</span>
                              </div>
                            )}
                            {c.employerContribution > 0 && (
                              <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                                <span>{c.name} Employer ({c.employerRate}%)</span>
                                <span style={{ fontWeight: 600 }}>{formatCurrency(c.employerContribution, settings.currency)}</span>
                              </div>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <>
                          {(salaryRec.epfDeduction > 0 || salaryRec.epfEmployee > 0) && (
                            <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', fontSize: '0.85rem' }}>
                              <span>EPF Employee Share</span>
                              <span style={{ fontWeight: 600, color: '#f43f5e' }}>-{formatCurrency(salaryRec.epfDeduction || salaryRec.epfEmployee, settings.currency)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {(salaryRec.payeTaxDeduction > 0 || salaryRec.tax > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Tax Deducted</span>
                          <span style={{ fontWeight: 600, color: '#f43f5e' }}>-{formatCurrency(salaryRec.payeTaxDeduction || salaryRec.tax, settings.currency)}</span>
                        </div>
                      )}
                      {(salaryRec.otherDeductions > 0 || salaryRec.otherDeduction > 0 || salaryRec.loanDeduction > 0) && (
                        <div className="deduction-item" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', paddingTop: '4px', fontSize: '0.85rem' }}>
                          <span>Other Deductions</span>
                          <span style={{ fontWeight: 600, color: '#f43f5e' }}>-{formatCurrency(salaryRec.otherDeductions || salaryRec.otherDeduction || salaryRec.loanDeduction || 0, settings.currency)}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Disbursed Take-home Salary</div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981', marginTop: '2px' }}>
                          {formatCurrency(salaryRec.netSalary, settings.currency)}
                        </div>
                      </div>
                    </div>
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
