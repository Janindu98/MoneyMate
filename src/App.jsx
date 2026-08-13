import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './hooks/useDatabase';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import BankAccounts from './pages/BankAccounts/BankAccounts';
import Transactions from './pages/Transactions/Transactions';
import Salary from './pages/Salary/Salary';
import Budgets from './pages/Budgets/Budgets';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import Profile from './pages/Profile/Profile';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Backup from './pages/Backup/Backup';
import BillAnalysis from './pages/Budgets/BillAnalysis';
import Help from './pages/Help/Help';
import AboutModal from './components/AboutModal';
import LockScreen from './components/LockScreen';

export default function App() {
  return (
    <ToastProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const { settings, loading, unlockDatabase } = useDatabase();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (settings && settings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [settings?.theme]);

  useEffect(() => {
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    const size = settings?.fontSize || 'medium';
    document.documentElement.style.setProperty('--app-font-size', fontSizeMap[size] || '16px');
  }, [settings?.fontSize]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'accounts':
        return <BankAccounts />;
      case 'transactions':
        return <Transactions />;
      case 'salary':
        return <Salary />;
      case 'budgets':
        return <Budgets />;
      case 'bills':
        return <BillAnalysis />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'backup':
        return <Backup />;
      case 'reports':
        return <Reports />;
      case 'help':
        return <Help onNavigate={setActiveTab} onOpenAbout={() => setIsAboutModalOpen(true)} />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings onOpenAbout={() => setIsAboutModalOpen(true)} />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#070a13',
        color: '#94a3b8',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#fff',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}>MM</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px', color: '#fff' }}>MoneyMate</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Loading secure profile database...</div>
        </div>
      </div>
    );
  }

  const isLocked = settings && (settings.securityType === 'pin' || settings.securityType === 'password') && !unlocked;

  if (isLocked) {
    return <LockScreen settings={settings} onUnlock={() => setUnlocked(true)} unlockDatabase={unlockDatabase} />;
  }

  return (
    <div id="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenAbout={() => setIsAboutModalOpen(true)} 
      />
      <main className="main-content">
        {renderActivePage()}
      </main>

      {/* Global About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
