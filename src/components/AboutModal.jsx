import React from 'react';
import Modal from './Modal';
import logoImg from '../../images/logo.png';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About MoneyMate Vault">
      <div className="about-modal-content">
        {/* Brand Header */}
        <div className="about-brand-header">
          <div className="about-logo-wrapper">
            <img src={logoImg} alt="MoneyMate Vault Logo" className="about-logo-img" />
            <div className="about-logo-glow"></div>
          </div>
          <div className="about-brand-info">
            <div className="about-title-row">
              <h3 className="about-app-name">MoneyMate Vault</h3>
              <span className="about-version-badge">v1.6.0</span>
            </div>
            <p className="about-tagline">Expense Tracker & Personal Wealth Companion</p>
            <div className="about-meta-pills">
              <span className="about-pill">Desktop Edition</span>
              <span className="about-pill">Offline & Private</span>
              <span className="about-pill">MIT License</span>
            </div>
          </div>
        </div>

        {/* Highlighted Privacy & Local Database Guarantee */}
        <div className="about-privacy-hero">
          <div className="privacy-hero-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="privacy-hero-content">
            <div className="privacy-hero-title">
              Your Financial Data Stays on Your Device
            </div>
            <p className="privacy-hero-desc">
              MoneyMate operates on a <strong>100% Local Storage Database</strong> architecture. All your bank balances, transactions, salary slips, budgets, and security keys are stored locally on your hard drive in your application directory.
            </p>
            <div className="privacy-points-grid">
              <div className="privacy-point-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Zero cloud tracking or data harvesting</span>
              </div>
              <div className="privacy-point-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Local file storage (<code>database.json</code>)</span>
              </div>
              <div className="privacy-point-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Full offline functionality without internet</span>
              </div>
              <div className="privacy-point-item">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Optional PIN / Password Vault encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Benefits */}
        <div className="about-section-container">
          <h4 className="about-section-heading">Key Product Benefits</h4>
          <div className="about-benefits-grid">
            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <h5>Multi-Account Auditing</h5>
                <p>Track Bank Accounts, Physical Wallets, Savings, and Credit balances with instant real-time net worth calculation.</p>
              </div>
            </div>

            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <h5>Transaction & Transfer Ledger</h5>
                <p>Effortlessly log income, daily expenditures, and internal account transfers with custom categories and receipt notes.</p>
              </div>
            </div>

            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <div>
                <h5>Budget & Spending Controls</h5>
                <p>Define monthly spending caps per category, monitor threshold alerts, and visualize budget variances before overspending.</p>
              </div>
            </div>

            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h5>Salary & Compensation Engine</h5>
                <p>Calculate take-home pay with basic salary, allowances, overtime, statutory deductions (EPF/ETF), and tax breakdowns.</p>
              </div>
            </div>

            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </div>
              <div>
                <h5>Bills & Subscription Watcher</h5>
                <p>Stay ahead of recurring utility invoices, rent deadlines, and streaming subscriptions with due date reminders.</p>
              </div>
            </div>

            <div className="about-benefit-card">
              <div className="benefit-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                </svg>
              </div>
              <div>
                <h5>PDF & Excel Reports Compiler</h5>
                <p>Compile boardroom-quality financial statements, cash flow analytics, and category summaries for audits or tax filings.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical & Environment Details */}
        <div className="about-tech-specs">
          <div className="spec-row">
            <span className="spec-label">Application Version</span>
            <span className="spec-value">1.6.0 (Stable Release)</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Database Architecture</span>
            <span className="spec-value">Local Encrypted JSON File Store</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Runtime Engine</span>
            <span className="spec-value">Electron 43.2.0 • React 19 • Vite</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Data Privacy Model</span>
            <span className="spec-value" style={{ color: '#10b981', fontWeight: 600 }}>100% On-Device / Zero Cloud Telemetry</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">License</span>
            <span className="spec-value">MIT Open Source License</span>
          </div>
        </div>

        <div className="about-footer-action">
          <button type="button" className="btn btn-primary" onClick={onClose} style={{ minWidth: '130px' }}>
            Back
          </button>
        </div>
      </div>
    </Modal>
  );
}
