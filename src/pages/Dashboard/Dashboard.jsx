import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { formatCurrency } from '../../utils/format';

export default function Dashboard({ onNavigate }) {
  const { accounts, transactions, settings } = useDatabase();
  const [dashboardPeriod, setDashboardPeriod] = useState('monthly'); // 'overall', 'yearly', 'monthly'

  // 1. Calculations
  // Current Total Balance (sum of all active account balances)
  const currentTotalBalance = accounts
    .filter(a => a.status === 'Active')
    .reduce((sum, a) => sum + a.balance, 0);

  // Total Bank Balance (sum of active bank accounts excluding "Cash / Other")
  const totalBankBalance = accounts
    .filter(a => a.status === 'Active' && a.accountType !== 'Cash / Other')
    .reduce((sum, a) => sum + a.balance, 0);

  // Find aggregates based on selected period
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let displayedIncome = 0;
  let displayedExpense = 0;

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    let match = false;
    
    if (dashboardPeriod === 'overall') {
      match = true;
    } else if (dashboardPeriod === 'yearly') {
      match = txDate.getFullYear() === currentYear;
    } else if (dashboardPeriod === 'monthly') {
      match = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    }

    if (match) {
      if (['Income', 'Deposit', 'Refund'].includes(tx.type)) {
        displayedIncome += tx.amount;
      } else if (['Expense', 'Withdrawal', 'online payment', 'Online Transfer'].includes(tx.type) && tx.bankId) {
        displayedExpense += tx.amount;
      }
    }
  });

  const displayedSavings = displayedIncome - displayedExpense;

  const getPeriodLabels = () => {
    switch (dashboardPeriod) {
      case 'overall':
        return {
          savings: 'Overall Savings',
          income: 'Overall Income',
          expenses: 'Overall Expenses',
          trend: 'For all logged history'
        };
      case 'yearly':
        return {
          savings: 'Yearly Savings',
          income: 'Yearly Income',
          expenses: 'Yearly Expenses',
          trend: `For current calendar year (${currentYear})`
        };
      case 'monthly':
      default:
        return {
          savings: 'Monthly Savings',
          income: 'Monthly Income',
          expenses: 'Monthly Expenses',
          trend: 'For current calendar month'
        };
    }
  };

  const periodLabels = getPeriodLabels();

  // Recent transactions (last 5)
  const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentTx = sortedTx.slice(0, 5);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Financial Dashboard</h1>
          <p>Local offline salary and spending oversight styled in {settings.currency || 'LKR'}.</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Period:</label>
            <select
              className="input-ctrl"
              style={{ width: '220px', padding: '8px 12px', fontSize: '0.85rem' }}
              value={dashboardPeriod}
              onChange={(e) => setDashboardPeriod(e.target.value)}
            >
              <option value="overall">Overall</option>
              <option value="yearly">Yearly (Current)</option>
              <option value="monthly">Monthly (Current year)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Cards representing key balances */}
      <div className="grid-3">
        <div className="panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Current Total Balance</span>
            <span className="stat-value">{formatCurrency(currentTotalBalance, settings.currency)}</span>
            <span className="stat-trend up">Across all active accounts</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--accent-gradient)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>

        <div className="panel stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Bank Balance</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>{formatCurrency(totalBankBalance, settings.currency)}</span>
            <span className="stat-trend up">Excluding physical cash</span>
          </div>
          <div className="stat-icon" style={{ background: 'var(--card-blue-gradient)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
        </div>

        <div className="panel stat-card">
          <div className="stat-info">
            <span className="stat-label">{periodLabels.savings}</span>
            <span className="stat-value" style={{ color: displayedSavings >= 0 ? '#10b981' : '#f43f5e' }}>
              {formatCurrency(displayedSavings, settings.currency)}
            </span>
            <span className="stat-trend" style={{ color: displayedSavings >= 0 ? '#10b981' : '#f43f5e' }}>
              {periodLabels.trend}
            </span>
          </div>
          <div className="stat-icon" style={{ background: displayedSavings >= 0 ? 'var(--success-gradient)' : 'var(--danger-gradient)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="M8 12h8"/></svg>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="panel stat-card" style={{ display: 'block', padding: '18px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-label">{periodLabels.income}</span>
              <span className="stat-value" style={{ color: '#10b981', fontSize: '1.5rem' }}>{formatCurrency(displayedIncome, settings.currency)}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--success-gradient)', width: '36px', height: '36px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
        </div>

        <div className="panel stat-card" style={{ display: 'block', padding: '18px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="stat-label">{periodLabels.expenses}</span>
              <span className="stat-value" style={{ color: '#f43f5e', fontSize: '1.5rem' }}>{formatCurrency(displayedExpense, settings.currency)}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--danger-gradient)', width: '36px', height: '36px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions panel */}
      <div style={{ width: '100%' }}>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Ledger Transactions</h2>
            <button className="btn btn-secondary" onClick={() => onNavigate('transactions')}>View Ledger</button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Bank Account</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map(tx => {
                  const acc = accounts.find(a => a.id === tx.bankId);
                  const isOutflow = ['Expense', 'Withdrawal', 'online payment', 'Online Transfer'].includes(tx.type) && tx.bankId === acc?.id;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="tx-description-cell">
                          <div className="category-icon">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                          </div>
                          <div>
                            <div className="tx-main">{tx.description}</div>
                            {tx.payee && <div className="tx-sub" style={{ fontSize: '0.7rem' }}>Payee: {tx.payee}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{acc ? acc.bankName : 'Unknown'}</td>
                      <td>{tx.category}</td>
                      <td>{tx.date}</td>
                      <td>
                        <span className={`badge badge-${isOutflow ? 'expense' : 'income'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td>
                        <span className={`amount ${isOutflow ? 'expense' : 'income'}`}>
                          {isOutflow ? '-' : '+'}{formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {recentTx.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div className="empty-state-text">No transactions logged. Go to Transactions tab to add.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
