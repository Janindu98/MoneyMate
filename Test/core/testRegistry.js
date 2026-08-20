import { framework } from './testFramework.js';
import { registerDashboardTests } from '../Dashboard/Dashboard.test.js';
import { registerBankAccountsTests } from '../BankAccounts/BankAccounts.test.js';
import { registerTransactionsTests } from '../Transactions/Transactions.test.js';
import { registerSalaryTests } from '../Salary/Salary.test.js';
import { registerBudgetsTests } from '../Budgets/Budgets.test.js';
import { registerBillAnalysisTests } from '../Budgets/BillAnalysis.test.js';
import { registerSubscriptionsTests } from '../Subscriptions/Subscriptions.test.js';
import { registerReportsTests } from '../Reports/Reports.test.js';
import { registerBackupTests } from '../Backup/Backup.test.js';
import { registerProfileTests } from '../Profile/Profile.test.js';
import { registerSettingsTests } from '../Settings/Settings.test.js';
import { registerHelpTests } from '../Help/Help.test.js';
import { registerSecurityAndLockTests } from '../SecurityAndLock/SecurityAndLock.test.js';
import { registerDatabaseEngineTests } from '../DatabaseEngine/DatabaseEngine.test.js';

let registered = false;

export function registerAllTests() {
  if (registered) return framework;
  
  registerDashboardTests();
  registerBankAccountsTests();
  registerTransactionsTests();
  registerSalaryTests();
  registerBudgetsTests();
  registerBillAnalysisTests();
  registerSubscriptionsTests();
  registerReportsTests();
  registerBackupTests();
  registerProfileTests();
  registerSettingsTests();
  registerHelpTests();
  registerSecurityAndLockTests();
  registerDatabaseEngineTests();

  registered = true;
  return framework;
}

export { framework };
