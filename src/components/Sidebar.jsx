import React from 'react';
import logoImg from '../../images/logo.png';
import { useDatabase } from '../hooks/useDatabase';

export default function Sidebar({ activeTab, onTabChange, onOpenAbout }) {
  const { isPro } = useDatabase();
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    {
      id: 'accounts',
      label: 'Bank Accounts',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: (
        <svg viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    },
    {
      id: 'salary',
      label: 'Salary Monitor',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 'budgets',
      label: 'Expense Analysis',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      )
    },
    {
      id: 'bills',
      label: 'Bill & Payment Analysis',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="13" y2="16" />
        </svg>
      )
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: (
        <svg viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'backup',
      label: 'Cloud Backup',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21.2 15c.6-1 1-2.2 1-3.5 0-3.9-3.1-7-7-7-2.8 0-5.2 1.6-6.4 4C7.6 8.2 6.4 8 5 8c-2.8 0-5 2.2-5 5 0 2.5 1.8 4.6 4.2 4.9H20v-.1z" />
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports compiler',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      id: 'help',
      label: 'Help & Docs',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logoImg} alt="MoneyMate Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
        <div className="brand-name">MoneyMate</div>
      </div>
      <nav className="nav-links">
        {tabs.map((tab) => {
          const isPremiumTab = ['bills', 'subscriptions', 'backup'].includes(tab.id);
          return (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              style={{ border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center' }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isPremiumTab && !isPro && (
                <span style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#fbbf24',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1'
                }}>
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-about-btn"
          onClick={onOpenAbout}
          title="Click to view Version Details & Privacy Guarantees"
        >
          <span className="sidebar-version-pill">MoneyMate v1.5.0</span>
          <span className="sidebar-privacy-tag">
            <span className="sidebar-status-dot"></span>
            Local Storage DB
          </span>
        </button>
      </div>
    </aside>
  );
}
