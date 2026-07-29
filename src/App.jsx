import React, { useState } from 'react';
import { DatabaseProvider } from './hooks/useDatabase';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <ToastProvider>
      <DatabaseProvider>
        <div id="app-container">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="main-content">
            {renderActivePage()}
          </main>
        </div>
      </DatabaseProvider>
    </ToastProvider>
  );
}
