# 📊 MoneyMate Vault - Automated Test Execution Result Sheet

**Execution Date**: 8/21/2026, 3:45:12 AM  
**Environment**: Node.js v22.13.1 / Windows  
**Overall Status**: 🟢 ALL TESTS PASSED  

## 📈 Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Test Cases** | **100** |
| **Passed Cases** | **100** (100.0%) |
| **Failed Cases** | **0** |
| **Total Execution Duration** | **0.11s** |

## 📋 Test Case Execution Matrix

| Case ID | Module / Page | Test Case Name | Expected Result | Status | Duration |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-DASH-001` | **Dashboard** | Total Balance Calculation Across Active Accounts | Total balance correctly matches sum of active balances (4765.00) | ✅ PASS | 1.09ms |
| `TC-DASH-002` | **Dashboard** | Total Bank Balance Excluding Physical Cash Accounts | Total bank balance is 4465.00 (excluding 300 cash) | ✅ PASS | 0.53ms |
| `TC-DASH-003` | **Dashboard** | Inactive Accounts Exclusion from Balance Calculations | Inactive account balance is omitted from active total | ✅ PASS | 2.04ms |
| `TC-DASH-004` | **Dashboard** | Period Filtering - This Month Aggregation | Income = 5000, Expense = 235, Savings = 4765 | ✅ PASS | 0.41ms |
| `TC-DASH-005` | **Dashboard** | Period Filtering - This Year Aggregation | Yearly income correctly includes all months (6200) | ✅ PASS | 0.53ms |
| `TC-DASH-006` | **Dashboard** | Period Filtering - Last Month Aggregation | Only previous month transactions are counted (450) | ✅ PASS | 0.38ms |
| `TC-DASH-007` | **Dashboard** | Period Filtering - Overall History Aggregation | Overall lifetime income equals 9000 | ✅ PASS | 0.35ms |
| `TC-DASH-008` | **Dashboard** | Period Filtering - Custom Date Range | Returns exactly 2 transactions in range | ✅ PASS | 0.3ms |
| `TC-DASH-009` | **Dashboard** | Recent Ledger Transactions Extraction & Slicing | First transaction is latest (2026-08-10) | ✅ PASS | 0.57ms |
| `TC-DASH-010` | **Dashboard** | Currency Formatting Helper Presentation | Formats correctly with appropriate symbols and two decimals | ✅ PASS | 35.66ms |
| `TC-ACC-001` | **BankAccounts** | Create New Bank Account with Metadata | Account created with designated fields | ✅ PASS | 0.71ms |
| `TC-ACC-002` | **BankAccounts** | Create Account with Initial Opening Balance Auto-Generates Ledger Deposit | Automatic Deposit transaction created with amount 1500 | ✅ PASS | 0.58ms |
| `TC-ACC-003` | **BankAccounts** | Edit Existing Bank Account Details | Account name and branch updated successfully | ✅ PASS | 0.48ms |
| `TC-ACC-004` | **BankAccounts** | Delete Bank Account with Cascading Cleanup | Account and all related records deleted cleanly | ✅ PASS | 0.75ms |
| `TC-ACC-005` | **BankAccounts** | Dynamic Ledger Balance Calculation for Multiple Transaction Outflows | Balance computed accurately as 1250.00 | ✅ PASS | 0.39ms |
| `TC-ACC-006` | **BankAccounts** | Inter-Account Transfer Balance Adjustments | Source debited by 500, Destination credited by 500 | ✅ PASS | 0.43ms |
| `TC-ACC-007` | **BankAccounts** | Account Status Toggle (Active vs Inactive) | Status toggles properly without loss of data | ✅ PASS | 0.5ms |
| `TC-ACC-008` | **BankAccounts** | Default Cash Wallet Account Persistence | Default Cash Wallet account is present | ✅ PASS | 0.35ms |
| `TC-ACC-009` | **BankAccounts** | Multi-Account Balance Isolation | Balances are strictly isolated to their respective accounts | ✅ PASS | 0.39ms |
| `TC-TX-001` | **Transactions** | Record Standard Expense Transaction | Expense recorded with correct amount and category | ✅ PASS | 0.49ms |
| `TC-TX-002` | **Transactions** | Record Income Transaction | Income transaction successfully added | ✅ PASS | 0.44ms |
| `TC-TX-003` | **Transactions** | Record Cash Deposit Transaction | Deposit transaction logged | ✅ PASS | 0.23ms |
| `TC-TX-004` | **Transactions** | Record Cash Withdrawal Transaction | Withdrawal transaction logged | ✅ PASS | 0.23ms |
| `TC-TX-005` | **Transactions** | Record Inter-Account Transfer Transaction | Transfer transaction logged with both bank references | ✅ PASS | 0.26ms |
| `TC-TX-006` | **Transactions** | Record Online Payment Transaction | Online Payment transaction logged | ✅ PASS | 0.23ms |
| `TC-TX-007` | **Transactions** | Record Utility Bill & Payment Transaction | Bill & Payment transaction logged | ✅ PASS | 0.2ms |
| `TC-TX-008` | **Transactions** | Edit Transaction Amount and Category | Transaction successfully modified | ✅ PASS | 0.43ms |
| `TC-TX-009` | **Transactions** | Delete Transaction from Ledger | Transaction deleted | ✅ PASS | 0.36ms |
| `TC-TX-010` | **Transactions** | Add Custom Transaction Category | Custom category added and duplicates prevented | ✅ PASS | 0.37ms |
| `TC-TX-011` | **Transactions** | Prevent Deletion of Core Default Categories While Allowing Custom Deletion | Default category protected; custom category deleted | ✅ PASS | 0.57ms |
| `TC-TX-012` | **Transactions** | Multi-Criteria Search and Filtering | Matches accurate subsets of transactions | ✅ PASS | 0.35ms |
| `TC-TX-013` | **Transactions** | Receipt Attachment Metadata Handling | Receipt metadata stored properly | ✅ PASS | 0.24ms |
| `TC-TX-014` | **Transactions** | Legacy Category Migration Mapping | Food becomes Food & Dining, Medical becomes Healthcare & Medical | ✅ PASS | 0.18ms |
| `TC-SAL-001` | **Salary** | Gross Earnings Calculation with Allowances, Bonus & Overtime | Gross Earnings is accurately calculated as 5550.00 | ✅ PASS | 0.07ms |
| `TC-SAL-002` | **Salary** | Statutory Deductions (EPF Employee 8%, EPF Employer 12%, ETF Employer 3%) | EPF Employee = 400, EPF Employer = 600, ETF Employer = 150 | ✅ PASS | 0.07ms |
| `TC-SAL-003` | **Salary** | Dynamic Profile Contributions Computation Based on Custom Rates | Dynamic contributions computed accurately | ✅ PASS | 0.17ms |
| `TC-SAL-004` | **Salary** | Total Deductions Calculation (Taxes, Loans, Employee Deductions) | Total Deductions equals 1000.00 | ✅ PASS | 0.07ms |
| `TC-SAL-005` | **Salary** | Net Salary Calculation (Gross Earnings - Total Deductions) | Net Salary is 4550.00 | ✅ PASS | 0.06ms |
| `TC-SAL-006` | **Salary** | Automatic Synchronized Income Transaction Creation on Adding Salary Record | Income transaction created and linked via salaryRecordId | ✅ PASS | 0.63ms |
| `TC-SAL-007` | **Salary** | Edit Salary Record Automatically Syncs Ledger Transaction | Salary record and ledger transaction updated in lockstep | ✅ PASS | 0.79ms |
| `TC-SAL-008` | **Salary** | Delete Salary Record Automatically Unlinks / Removes Ledger Transaction | Salary record and linked transaction removed | ✅ PASS | 0.55ms |
| `TC-SAL-009` | **Salary** | Salary History Filtering by Year and Month | Correct records returned per year filter | ✅ PASS | 0.55ms |
| `TC-SAL-010` | **Salary** | Month and Year Auto-Derivation from Payment Date | Year is 2026 and Month is November | ✅ PASS | 0.1ms |
| `TC-BUD-001` | **Budgets** | Configure and Update Category Monthly Budget Limits | Budget limits saved in settings | ✅ PASS | 0.42ms |
| `TC-BUD-002` | **Budgets** | Monthly Expense Aggregation per Budget Category | Category monthly expense accurately summed as 500.00 | ✅ PASS | 0.5ms |
| `TC-BUD-003` | **Budgets** | Budget Progress Percentage and Remaining Budget Calculation | Progress is 75% and Remaining is 5000.00 | ✅ PASS | 0.09ms |
| `TC-BUD-004` | **Budgets** | Budget Alert Status Triggers (Normal, Warning, Exceeded) | Returns "normal", "warning", and "exceeded" correctly | ✅ PASS | 0.15ms |
| `TC-BUD-005` | **Budgets** | Custom Category Budget Limits Configuration | Custom category budget limits saved properly | ✅ PASS | 0.47ms |
| `TC-BUD-006` | **Budgets** | Overall Monthly Budget vs Total Monthly Expenses Comparison | Total budget is 147000 and overall utilization is 31% | ✅ PASS | 0.14ms |
| `TC-BILL-001` | **BillAnalysis** | Group Bill & Payment Transactions by Utility Category | Electricity: 200, Water: 45, Internet: 60 | ✅ PASS | 0.45ms |
| `TC-BILL-002` | **BillAnalysis** | Bill Spending vs Configured Bill Limits Evaluation | Electricity is within limit; Water is flagged exceeded | ✅ PASS | 0.11ms |
| `TC-BILL-003` | **BillAnalysis** | Total Utility Bills Aggregation and Percentage Distribution | Total bills sum is 1000 and Rent represents 65% | ✅ PASS | 0.13ms |
| `TC-SUB-001` | **Subscriptions** | Add New Recurring Subscription | Subscription successfully created | ✅ PASS | 0.58ms |
| `TC-SUB-002` | **Subscriptions** | Edit Subscription Details & Billing Cost | Subscription cost updated | ✅ PASS | 0.5ms |
| `TC-SUB-003` | **Subscriptions** | Delete Subscription | Subscription removed | ✅ PASS | 0.47ms |
| `TC-SUB-004` | **Subscriptions** | Calculate Monthly and Annualized Subscription Costs | Monthly cost is 40.00, Annual cost is 480.00 | ✅ PASS | 0.21ms |
| `TC-SUB-005` | **Subscriptions** | Auto-Renewal Engine - Monthly Subscription Renewal & Date Advance | nextRenewalDate advanced by 1 month to 2026-09-01 | ✅ PASS | 0.71ms |
| `TC-SUB-006` | **Subscriptions** | Auto-Renewal Engine - Yearly Subscription Renewal & Date Advance | nextRenewalDate advanced by 1 year to 2027-08-01 | ✅ PASS | 0.21ms |
| `TC-SUB-007` | **Subscriptions** | Auto-Renewal Engine - Automatic Generation of Ledger Renewal Transaction | Bill & Payment transaction created with category "Subscriptions" and amount 25.00 | ✅ PASS | 0.19ms |
| `TC-SUB-008` | **Subscriptions** | Subscription Status Filtering (Active vs Cancelled) | Active and Cancelled subscriptions accurately segregated | ✅ PASS | 0.48ms |
| `TC-REP-001` | **Reports** | Monthly Financial Breakdown & Savings Rate Computation | Income: 5000, Expense: 235, Net Savings: 4765, Savings Rate: 95.3% | ✅ PASS | 0.5ms |
| `TC-REP-002` | **Reports** | Yearly Monthly-by-Month Financial Trend Matrix | Jan Savings: 3600, Feb Savings: 3900 | ✅ PASS | 0.67ms |
| `TC-REP-003` | **Reports** | Expense Distribution by Category Calculation | Food & Dining: 63.8%, Electricity: 36.2% | ✅ PASS | 0.43ms |
| `TC-REP-004` | **Reports** | Income Distribution by Category Calculation | Salary: 5000, Interest: 250 | ✅ PASS | 0.42ms |
| `TC-REP-005` | **Reports** | Bank Account Net Cash Flow Tracking | Account flows accurately matched | ✅ PASS | 0.55ms |
| `TC-REP-006` | **Reports** | Custom Date Range Financial Analytics Report | Returns exactly 2 transactions | ✅ PASS | 0.35ms |
| `TC-REP-007` | **Reports** | Excel Export Data Structure Preparation | Formatted correctly for XLSX sheet generator | ✅ PASS | 0.47ms |
| `TC-REP-008` | **Reports** | PDF Report AutoTable Rows Formatting | Compatible with jsPDF AutoTable structure | ✅ PASS | 0.21ms |
| `TC-BAK-001` | **Backup** | Full Database Payload Export Structure | All 7 main data models present in export payload | ✅ PASS | 0.41ms |
| `TC-BAK-002` | **Backup** | Local Backup Encryption Using XOR + Base64 with Encryption Key | Payload successfully encrypted | ✅ PASS | 0.38ms |
| `TC-BAK-003` | **Backup** | Local Backup Decryption and Data Integrity Verification | Decrypted data is bit-for-bit identical to original payload | ✅ PASS | 0.49ms |
| `TC-BAK-004` | **Backup** | Decryption Failure Handling on Invalid Key or Corrupted Payload | Throws explicit decryption failure error | ✅ PASS | 0.41ms |
| `TC-BAK-005` | **Backup** | Database Restore Process & State Replacement | Database state updated to match restored data | ✅ PASS | 0.42ms |
| `TC-BAK-006` | **Backup** | Automated Google Drive Backup File Naming Format | File name matches exact schema | ✅ PASS | 0.16ms |
| `TC-BAK-007` | **Backup** | Cloud Sync Direct Upload Payload Preparation | Upload descriptor prepared with encrypted payload length | ✅ PASS | 1.47ms |
| `TC-BAK-008` | **Backup** | OAuth Token Masking and Encrypted Storage Representation | Token securely recovered | ✅ PASS | 0.14ms |
| `TC-PROF-001` | **Profile** | Update Profile Personal and Employment Information | Profile fields saved in state | ✅ PASS | 0.33ms |
| `TC-PROF-002` | **Profile** | Configure Dynamic Statutory Contribution Schemes | Custom contribution scheme added to profile | ✅ PASS | 0.52ms |
| `TC-PROF-003` | **Profile** | Edit and Remove Contribution Schemes from Profile | Rates modified and ETF contribution removed | ✅ PASS | 0.67ms |
| `TC-PROF-004` | **Profile** | Profile Auto-Fill Prefill Logic into Salary Records | Salary inputs successfully prefilled from profile | ✅ PASS | 0.49ms |
| `TC-SET-001` | **Settings** | Update Currency Preference & Symbol Resolution | Currency changed to EUR and formats with € symbol | ✅ PASS | 0.83ms |
| `TC-SET-002` | **Settings** | Theme Configuration Switching (Dark vs Light) | Theme preference toggles properly | ✅ PASS | 0.59ms |
| `TC-SET-003` | **Settings** | Font Size Preferences (Small, Medium, Large, X-Large) | Font size set to large with 18px mapping | ✅ PASS | 1.33ms |
| `TC-SET-004` | **Settings** | Security Mode Configuration (None, PIN, Password) | Security modes configured and saved in settings | ✅ PASS | 0.54ms |
| `TC-SET-005` | **Settings** | Security PIN and Password Validation Rules | Valid credentials pass; invalid formats rejected | ✅ PASS | 0.38ms |
| `TC-SET-006` | **Settings** | Database Reset to Clean Initial State | Database restored to initial state | ✅ PASS | 0.48ms |
| `TC-HLP-001` | **Help** | Help Documentation Sections & Topic Retrieval | All 6 key documentation sections present | ✅ PASS | 0.24ms |
| `TC-HLP-002` | **Help** | Knowledge Base FAQ Keyword Search & Filtering | Returns matched backup FAQ | ✅ PASS | 0.12ms |
| `TC-HLP-003` | **Help** | Keyboard Shortcuts Mapping Validation | Key shortcuts defined and mapped | ✅ PASS | 0.08ms |
| `TC-HLP-004` | **Help** | Application Diagnostic and About Metadata | App metadata matches version 1.6.0 | ✅ PASS | 0.05ms |
| `TC-SEC-001` | **SecurityAndLock** | Lock Screen Trigger on Startup When Security Mode Is Active | Locks on PIN/Password when unlocked=false; bypasses when unlocked=true or security=none | ✅ PASS | 0.09ms |
| `TC-SEC-002` | **SecurityAndLock** | Unlocking Database with Valid PIN or Password | Database unlocked and schema intact | ✅ PASS | 1.91ms |
| `TC-SEC-003` | **SecurityAndLock** | Authentication Failure & Rejection on Incorrect Credentials | Decryption fails and database remains locked | ✅ PASS | 2.42ms |
| `TC-SEC-004` | **SecurityAndLock** | Encrypted Disk File Structure When Security Mode Is Active | File contains ciphertext without plaintext transaction leak | ✅ PASS | 1.3ms |
| `TC-SEC-005` | **SecurityAndLock** | Unlocking Restores Full Database Schema and Categories | Complete operational schema restored | ✅ PASS | 2.43ms |
| `TC-DBE-001` | **DatabaseEngine** | Initial Database Schema Generation on Empty / New File | Initial database created with default cash account | ✅ PASS | 3.4ms |
| `TC-DBE-002` | **DatabaseEngine** | Schema Migration Ensures All Required Payment Category Tables Exist | All 7 category tables populated with defaults | ✅ PASS | 4.1ms |
| `TC-DBE-003` | **DatabaseEngine** | Corrupt Database Auto-Recovery & Schema Reset | Corrupted file handled gracefully and state restored to default | ✅ PASS | 3.18ms |
| `TC-DBE-004` | **DatabaseEngine** | State Persistence and Reload Consistency | State persisted and recovered identically | ✅ PASS | 4.55ms |
| `TC-DBE-005` | **DatabaseEngine** | Payment Type Category Migration (Online Transfer, Debit Card Fees, Alerts) | New bill categories migrated into category list | ✅ PASS | 0.19ms |

---
*Report auto-generated by MoneyMate Automated Test Suite Engine.*
