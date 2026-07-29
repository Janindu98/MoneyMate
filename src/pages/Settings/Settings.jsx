import React from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';

export default function Settings() {
  const { settings, updateSettings, restoreDatabase, showToast: hookShowToast } = useDatabase();
  const { showToast } = useToast();

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    updateSettings({ currency: val });
    showToast(`Currency symbol config updated to: ${val}`);
  };

  const handleExportBackup = async () => {
    try {
      const res = await api.exportBackup();
      if (res.success) {
        showToast('Offline database backup file saved successfully.');
      } else if (!res.canceled) {
        showToast(`Failed to export database: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error exporting backup file.', 'error');
    }
  };

  const handleImportBackup = async () => {
    const confirmRestore = confirm('Warning: Overwriting your current database with a backup file is irreversible. All current logs will be replaced. Proceed?');
    if (!confirmRestore) return;

    try {
      const res = await api.importBackup();
      if (res.success && res.data) {
        restoreDatabase(res.data);
        showToast('Database backup restored successfully.');
      } else if (!res.canceled) {
        showToast(`Failed to restore backup: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error restoring backup file.', 'error');
    }
  };

  const handleResetData = () => {
    const firstConfirm = confirm('Are you sure you want to delete ALL records? This deletes ledger history, salary plans and accounts.');
    if (firstConfirm) {
      const secondConfirm = confirm('CRITICAL WARNING: This action is permanent and cannot be undone. Type "OK" to proceed.');
      if (secondConfirm) {
        const resetState = {
          accounts: [],
          transactions: [],
          categories: {
            income: ['Salary', 'Bonus', 'Interest', 'Refund', 'Other'],
            expense: ['Food', 'Fuel', 'Bills', 'Insurance', 'Rent', 'Shopping', 'Medical', 'Entertainment', 'Investment', 'Loan', 'Other']
          },
          salaryHistory: [],
          settings: { currency: 'LKR', theme: 'dark' }
        };
        restoreDatabase(resetState);
        showToast('All local data wiped. Reset to clean template.');
      }
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Settings</h1>
          <p>Configure currencies, local backup, and manage data parameters.</p>
        </div>
      </div>

      <div className="panel">
        {/* Currency Selection */}
        <div className="settings-section">
          <div className="settings-section-title">Localization Options</div>
          <div className="settings-section-desc">Set your currency display preferences. All monetary values will be styled using this symbol.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Active Currency Symbol</div>
              <div className="settings-row-desc">Controls symbol displayed across charts, ledger lists, and totals.</div>
            </div>
            <div>
              <select className="input-ctrl" value={settings.currency || 'LKR'} onChange={handleCurrencyChange} style={{ width: '150px' }}>
                <option value="LKR">LKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Database Backup and Restore */}
        <div className="settings-section">
          <div className="settings-section-title">Local Database Utilities</div>
          <div className="settings-section-desc">Export a copy of database JSON data or restore from a previously exported backup file.</div>
          <div className="settings-row" style={{ marginBottom: '16px' }}>
            <div className="settings-row-info">
              <div className="settings-row-title">Backup database</div>
              <div className="settings-row-desc">Generates a complete offline JSON copy of your accounts and ledger.</div>
            </div>
            <div>
              <button className="btn btn-secondary" onClick={handleExportBackup}>Create Backup</button>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Restore backup</div>
              <div className="settings-row-desc">Overwrite existing app database with a previously exported JSON backup. WARNING: Existing data will be replaced.</div>
            </div>
            <div>
              <button className="btn btn-secondary" onClick={handleImportBackup}>Restore Backup</button>
            </div>
          </div>
        </div>

        {/* Reset Data section */}
        <div className="settings-section">
          <div className="settings-section-title" style={{ color: '#f43f5e' }}>Dangerous Territory</div>
          <div className="settings-section-desc">Permanently wipe all records. This is irreversible.</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-title">Reset Database</div>
              <div className="settings-row-desc">Deletes all ledger history, accounts, and salary plans, initializing back to blank slate.</div>
            </div>
            <div>
              <button className="btn btn-danger" onClick={handleResetData}>Reset Data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
