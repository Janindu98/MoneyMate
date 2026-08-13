import React, { useState, useMemo } from 'react';

export default function Help({ onNavigate, onOpenAbout }) {
  const [activeDocId, setActiveDocId] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  const docs = [
    {
      id: 'getting-started',
      navTarget: 'dashboard',
      title: 'Getting Started & Quick Tour',
      category: 'Basics',
      badge: 'Start Here',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      summary: 'Welcome to MoneyMate! Discover the core layout, offline architecture, and how to set up your financial command center.',
      overview: 'MoneyMate is an offline-first desktop personal finance platform built to help you track bank balances, analyze monthly expenditures, monitor salary packages, automate bill deadlines, and generate financial reports with 100% data privacy.',
      steps: [
        {
          title: '1. Set Up Your Bank & Cash Accounts',
          desc: 'Head over to Bank Accounts to record your active checking, savings, physical cash wallets, and credit cards with starting balances.'
        },
        {
          title: '2. Record Daily Incomes & Expenses',
          desc: 'Use the Transactions tab to log incoming funds, purchases, utility bills, and inter-account transfers.'
        },
        {
          title: '3. Set Category Budget Caps',
          desc: 'Visit Expense Analysis to define monthly budget limits for Food, Transport, Rent, and Entertainment to receive warning alerts before overspending.'
        },
        {
          title: '4. Configure Salary & Recurring Bills',
          desc: 'Monitor take-home pay under Salary Monitor and schedule regular household bills and subscriptions.'
        }
      ],
      features: [
        '100% Offline-first local database storage',
        'Instant real-time net worth calculation',
        'Comprehensive multi-account ledger with transfer auditing',
        'Built-in PDF & Excel report compiling engine',
        'Bank-grade PIN & Password vault lock'
      ],
      proTips: [
        'Set up a PIN or Password Lock under Settings to safeguard your numbers if sharing your computer.',
        'Use the Search bar on the Transactions page to quickly locate past receipts by merchant or note keywords.'
      ],
      faqs: [
        {
          q: 'Does MoneyMate upload my bank data to the internet?',
          a: 'No. MoneyMate never sends your financial numbers to cloud servers or third parties. All information is saved locally in database.json inside your local device data directory.'
        },
        {
          q: 'Can I use MoneyMate on multiple devices?',
          a: 'You can export encrypted backup files from the Cloud Backup page or sync your local file database via your own Google Drive, OneDrive, or Dropbox account.'
        }
      ]
    },
    {
      id: 'dashboard',
      navTarget: 'dashboard',
      title: 'Dashboard Overview',
      category: 'Analytics',
      badge: 'Command Center',
      readTime: '2 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      summary: 'Monitor your total net worth, monthly cash inflow, outflow, trend charts, and recent activity at a glance.',
      overview: 'The Dashboard gives you an executive financial summary. It aggregates live balances from all active bank accounts, calculates total net worth, charts monthly cash flows, and displays upcoming bills and budget health in real time.',
      steps: [
        {
          title: '1. Review Metric Cards',
          desc: 'Check Net Worth (Total Assets minus Liabilities), Total Monthly Income, Monthly Expenses, and Net Savings Rate at the top of the screen.'
        },
        {
          title: '2. Analyze Cash Flow Trends',
          desc: 'The interactive chart plots your cumulative monthly income against expenditures to illustrate your wealth accumulation trajectory.'
        },
        {
          title: '3. Quick Action Buttons',
          desc: 'Quickly trigger transaction entries, transfer funds, or jump directly into deeper budget breakdowns.'
        },
        {
          title: '4. Inspect Recent Activity',
          desc: 'View the latest recorded transactions along with category badges and account origins.'
        }
      ],
      features: [
        'Live Net Worth calculation combining all liquid and credit balances',
        'Visual Expense Distribution breakdown chart',
        'Upcoming payment alerts and bill countdowns',
        'Recent transaction quick review stream'
      ],
      proTips: [
        'Click on any quick action button on the dashboard to jump straight into adding records without extra clicks.',
        'Review the Expense Breakdown donut chart at the end of every week to identify high-spending categories early.'
      ],
      faqs: [
        {
          q: 'How is Total Net Worth computed?',
          a: 'Net Worth is the sum of all positive balances (Savings, Checking, Cash Wallets, Investments) minus any credit card or loan balances.'
        }
      ]
    },
    {
      id: 'accounts',
      navTarget: 'accounts',
      title: 'Bank Accounts Management',
      category: 'Core Ledger',
      badge: 'Assets & Wallets',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
      summary: 'Manage checking accounts, savings accounts, credit cards, investment funds, and physical cash wallets.',
      overview: 'The Bank Accounts module lets you organize all your financial storage entities in one place. Each account maintains its own transaction history and dynamic balance, giving you complete visibility into where your funds reside.',
      steps: [
        {
          title: '1. Add a New Account',
          desc: 'Click "+ Add Account" in the top right. Select account type (Savings, Checking, Cash / Other, Credit Card, Investment), bank name, account nickname, currency, and initial opening balance.'
        },
        {
          title: '2. Edit or Adjust Account Details',
          desc: 'Use the action menu on any account card to edit the nickname, branch, or account number.'
        },
        {
          title: '3. View Account Statements',
          desc: 'Click on any account card to filter transactions and inspect chronological inflows and outflows specifically for that account.'
        },
        {
          title: '4. Archive or Remove Accounts',
          desc: 'Close inactive accounts without losing historical transaction records.'
        }
      ],
      features: [
        'Multi-type support: Savings, Checking, Cash Wallet, Credit Card, Fixed Deposit, Investment',
        'Dynamic balance recalculation on every recorded transaction or transfer',
        'Masked account number privacy display',
        'Custom color coding and institution tagging'
      ],
      proTips: [
        'Create a dedicated "Physical Cash Wallet" account to track day-to-day cash disbursements and ATM withdrawals.',
        'When withdrawing cash from an ATM, record it as a Transfer from your Bank Account to your Cash Wallet so your total Net Worth remains accurate.'
      ],
      faqs: [
        {
          q: 'What happens to transactions if I delete an account?',
          a: 'MoneyMate will ask for confirmation. Deleting an account will unlink associated transactions or prompt you to archive it safely.'
        }
      ]
    },
    {
      id: 'transactions',
      navTarget: 'transactions',
      title: 'Transactions & Transfers',
      category: 'Core Ledger',
      badge: 'Daily Operations',
      readTime: '4 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      summary: 'Log incomes, track daily expenditures, record inter-account transfers, manage categories, and export audit trails.',
      overview: 'The Transactions page is your double-entry financial ledger. It tracks every cent flowing in and out of your accounts with customizable categories, tags, payee notes, and instant filtering.',
      steps: [
        {
          title: '1. Record a New Transaction',
          desc: 'Click "+ Record Transaction". Choose transaction type: Income, Expense, or Transfer.'
        },
        {
          title: '2. Fill Details',
          desc: 'Select the Source/Target Account, Category (e.g. Groceries, Fuel, Dining, Salary), Date, Amount, and optional reference memo/notes.'
        },
        {
          title: '3. Perform Inter-Account Transfers',
          desc: 'Select "Transfer", pick the "From Account" and "To Account", enter the transfer amount, and both account balances will be updated in a single atomic record.'
        },
        {
          title: '4. Filter, Search & Export',
          desc: 'Use the category filter, date picker, or search bar to narrow down items. Click "Export Excel" or "Export PDF" to download audit records.'
        }
      ],
      features: [
        'Support for Income (+), Expense (-), and Account-to-Account Transfers (⇄)',
        'Custom category manager with color badges',
        'Date range selector (Today, This Month, Custom Ranges)',
        'Multi-column search (Payee, Category, Notes, Amount)',
        'Instant CSV / Excel / PDF exports'
      ],
      proTips: [
        'Add detailed notes (e.g., "Invoice #402", "Client dinner") to make tax season and audits effortless.',
        'Use custom categories to tailor tracking to your personal or freelance business needs.'
      ],
      faqs: [
        {
          q: 'Can I edit or delete a past transaction?',
          a: 'Yes, click the edit or delete icon on any row in the transaction table. The associated account balances and budget limits will automatically adjust.'
        }
      ]
    },
    {
      id: 'salary',
      navTarget: 'salary',
      title: 'Salary & Compensation Monitor',
      category: 'Income Engine',
      badge: 'Payroll Tracking',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      summary: 'Analyze monthly compensation, basic pay, allowances, overtime, statutory deductions (EPF/ETF), and net take-home salary.',
      overview: 'The Salary Monitor provides a structured payroll breakdown. It allows working professionals and contractors to track salary slips, understand statutory deductions (such as EPF employee/employer contributions, ETF, and income tax), and forecast annual take-home earnings.',
      steps: [
        {
          title: '1. Configure Salary Structure',
          desc: 'Click "Update Salary Plan" to enter your Basic Salary, Fixed Allowances (Transport, Housing, Medical), and Variable Bonuses.'
        },
        {
          title: '2. Set Statutory Deductions',
          desc: 'Specify employee deduction percentages (e.g., EPF 8%, APIT/PAYE Tax) and employer contributions (EPF 12%, ETF 3%).'
        },
        {
          title: '3. Track Monthly Salary History',
          desc: 'Log monthly payslips to visualize career salary growth, increment trends, and total net compensation received over time.'
        },
        {
          title: '4. Direct Deposit Linking',
          desc: 'One-click deposit of your monthly take-home salary into your primary bank account.'
        }
      ],
      features: [
        'Comprehensive breakdown: Basic, Allowances, Gross Pay, Deductions, Net Pay',
        'Statutory deduction calculators (EPF, ETF, Taxes)',
        'Employer contribution tracker (Total cost to company)',
        'Historical salary revisions timeline and visual growth chart'
      ],
      proTips: [
        'Log salary increments whenever you receive a promotion or annual appraisal to track your income growth trajectory.',
        'Use the net pay figure to calibrate your 50/30/20 monthly budget rules.'
      ],
      faqs: [
        {
          q: 'Does logging a salary slip automatically credit my bank account?',
          a: 'You can click "Record to Ledger" on the salary breakdown to automatically post an Income transaction to your designated bank account.'
        }
      ]
    },
    {
      id: 'budgets',
      navTarget: 'budgets',
      title: 'Expense Analysis & Budgets',
      category: 'Analytics',
      badge: 'Budgeting',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
      summary: 'Set monthly category budgets, track progress bars, and receive real-time alerts before exceeding spending caps.',
      overview: 'Expense Analysis helps you build disciplined spending habits. Define target expenditure ceilings for each category (Groceries, Dining, Fuel, Utilities, Entertainment) and monitor live consumption with color-coded safety meters.',
      steps: [
        {
          title: '1. Set Category Budgets',
          desc: 'Click "Manage Budgets" to allocate target spending amounts for each expense category for the current month.'
        },
        {
          title: '2. Monitor Real-Time Progress',
          desc: 'Progress bars dynamically change color from Green (Healthy < 70%) to Yellow (Warning 70-90%) to Red (Exceeded > 100%).'
        },
        {
          title: '3. Review Variance & Savings',
          desc: 'Inspect under-budget and over-budget variances to rebalance allocations for upcoming weeks.'
        }
      ],
      features: [
        'Category-specific monthly spending thresholds',
        'Visual progress meters with live percentage consumption',
        'Automatic calculation of remaining disposable allowances',
        'Budget vs. Actual comparative variance analysis'
      ],
      proTips: [
        'Review your Budget meters mid-month to curb discretionary spending before exceeding limits.',
        'Adjust seasonal budgets (e.g. higher budget in December for holiday gifts) at the start of the month.'
      ],
      faqs: [
        {
          q: 'Do budgets reset automatically each month?',
          a: 'Yes, budget limits carry over to new months while monthly spending tallies reset based on transactions in that calendar month.'
        }
      ]
    },
    {
      id: 'bills',
      navTarget: 'bills',
      title: 'Bill & Payment Analysis',
      category: 'Obligations',
      badge: 'Due Dates',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="13" y2="16" />
        </svg>
      ),
      summary: 'Track recurring utility invoices, rent payments, loan installments, due dates, and paid/unpaid statuses.',
      overview: 'Never miss a payment deadline or incur late fees. The Bill & Payment Analysis module lets you catalog recurring invoices (Electricity, Water, Internet, Insurance, Rent), tracks payment deadlines, and monitors payment records.',
      steps: [
        {
          title: '1. Add a Recurring Bill',
          desc: 'Click "+ Add Bill", enter the bill title (e.g. "Fiber Internet"), billing company, monthly amount, due day of the month, and category.'
        },
        {
          title: '2. Track Due Date Countdowns',
          desc: 'Bills are automatically sorted by urgency: Overdue, Due Soon (next 5 days), and Upcoming.'
        },
        {
          title: '3. Mark as Paid',
          desc: 'When paid, click "Mark as Paid" to record payment confirmation and optionally create an expense ledger entry automatically.'
        }
      ],
      features: [
        'Countdown indicators for impending invoice deadlines',
        'Categorized bill groups: Utilities, Housing, Telecom, Loans, Insurance',
        'One-click ledger posting on payment completion',
        'Monthly unpaid obligation sum totals'
      ],
      proTips: [
        'Review the "Total Pending Bills" metric at the start of every month to reserve sufficient bank account funds.',
        'Mark bills as paid right after completing online transfers to keep your reminder dashboard clean.'
      ],
      faqs: [
        {
          q: 'Can I set recurring bill reminders for different dates?',
          a: 'Yes, each bill has its own individual due day (1st through 31st of the month).'
        }
      ]
    },
    {
      id: 'subscriptions',
      navTarget: 'subscriptions',
      title: 'Subscriptions Tracker',
      category: 'Obligations',
      badge: 'Recurring Costs',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      summary: 'Manage streaming services, cloud software, memberships, renewal cycles, and annual subscription costs.',
      overview: 'Subscription fatigue is one of the biggest leaks in modern personal finance. This module provides total clarity on active subscriptions (Netflix, Spotify, GitHub, gym memberships, software licenses), annual cost projections, and cancellation reviews.',
      steps: [
        {
          title: '1. Register Subscriptions',
          desc: 'Click "+ Add Subscription". Enter provider name, billing frequency (Monthly or Annually), cost, renewal date, and payment account.'
        },
        {
          title: '2. Review Cumulative Annual Costs',
          desc: 'Check the "Projected Annual Subscription Burden" metric to understand your true long-term costs.'
        },
        {
          title: '3. Cancel Unused Services',
          desc: 'Audit your subscription list periodically and toggle status to Inactive for services you no longer use.'
        }
      ],
      features: [
        'Monthly and Annual billing frequency support',
        'Annualized cost projection algorithm',
        'Renewal countdown badges',
        'Category tagging (Entertainment, Productivity, Cloud, Health)'
      ],
      proTips: [
        'Switch monthly subscriptions to annual billing plans where discounts are available to reduce total yearly expense.',
        'Review the subscription list quarterly to cancel services you have not used in the past 30 days.'
      ],
      faqs: [
        {
          q: 'How does Annualized Cost work?',
          a: 'Monthly subscriptions are multiplied by 12 and annual subscriptions are added to calculate your total yearly recurring commitment.'
        }
      ]
    },
    {
      id: 'backup',
      navTarget: 'backup',
      title: 'Cloud & Local Encrypted Backup',
      category: 'Data & Security',
      badge: 'Data Safety',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.2 15c.6-1 1-2.2 1-3.5 0-3.9-3.1-7-7-7-2.8 0-5.2 1.6-6.4 4C7.6 8.2 6.4 8 5 8c-2.8 0-5 2.2-5 5 0 2.5 1.8 4.6 4.2 4.9H20v-.1z" />
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>
      ),
      summary: 'Export encrypted snapshots to your hard drive, or link Google Drive, OneDrive, or Dropbox for secure portable backups.',
      overview: 'Your financial data is sacred. MoneyMate ensures you have 100% control over backup archives. Create local JSON backups anytime or link your personal cloud storage accounts for seamless disaster recovery.',
      steps: [
        {
          title: '1. Export Local Backup',
          desc: 'Click "Export Local JSON Backup" to download a full timestamped snapshot file of your accounts, transactions, salaries, and budgets.'
        },
        {
          title: '2. Restore from Backup File',
          desc: 'Click "Restore Local Backup", select your previously saved JSON file, and confirm to restore your complete database.'
        },
        {
          title: '3. Cloud Account Linking (Optional)',
          desc: 'Connect your own Google Drive, OneDrive, or Dropbox to push encrypted backups to your personal cloud folder with a single click.'
        }
      ],
      features: [
        'One-click JSON file backup export and instant restore',
        'Integration with Google Drive, OneDrive, and Dropbox',
        'Automatic snapshot timestamping',
        'Encrypted payload export with key verification'
      ],
      proTips: [
        'Export a local backup file to a secure USB drive or secondary hard drive once a month.',
        'Before performing major data edits or resets, take a quick snapshot using the Export Backup button.'
      ],
      faqs: [
        {
          q: 'Does MoneyMate have access to my Google Drive / cloud storage files?',
          a: 'No. The app only accesses its dedicated MoneyMate backup folder in your linked cloud storage, keeping all other files private.'
        }
      ]
    },
    {
      id: 'reports',
      navTarget: 'reports',
      title: 'Reports Compiler & Exports',
      category: 'Analytics',
      badge: 'Audit & Statements',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      summary: 'Compile comprehensive financial statements, category breakdowns, and export professional PDF and Excel reports.',
      overview: 'The Reports Compiler generates clean, publication-ready financial reports. Whether you need monthly expense audits, annual tax documentation, or bank balance sheets, you can compile and download customized reports in seconds.',
      steps: [
        {
          title: '1. Select Time Range',
          desc: 'Choose a preset timeframe (This Month, Last Month, Last 3 Months, Year to Date) or pick a custom start and end date.'
        },
        {
          title: '2. Review Report Analytics',
          desc: 'Inspect generated tables: Income vs. Expense Totals, Category Share Percentages, Net Surplus/Deficit, and Top Spend Categories.'
        },
        {
          title: '3. Export to PDF or Excel',
          desc: 'Click "Download PDF Statement" for a formatted printable audit sheet or "Download Excel (.xlsx)" for spreadsheet calculations.'
        }
      ],
      features: [
        'Multi-period filtering: Monthly, Quarterly, Annual, Custom Ranges',
        'Category distribution ranking and variance metrics',
        'Boardroom-ready vector PDF statement formatting with auto-paging',
        'Styled multi-sheet Excel (.xlsx) export'
      ],
      proTips: [
        'Generate an annual PDF statement at the close of each tax year for easy filing with your accountant.',
        'Use Excel exports if you need to perform advanced custom pivot tables or charts.'
      ],
      faqs: [
        {
          q: 'Do PDF reports include masked bank account details?',
          a: 'Yes, account numbers are masked for security and privacy in all generated PDF and Excel statements.'
        }
      ]
    },
    {
      id: 'profile',
      navTarget: 'profile',
      title: 'Profile & Financial Goals',
      category: 'Personalization',
      badge: 'Milestones',
      readTime: '2 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      summary: 'Personalize user details, set monthly savings targets, track emergency fund milestones, and review profile metrics.',
      overview: 'The Profile section is your financial identity and target milestone hub. Customize your personal profile, configure your target monthly savings rate, and track progress toward building a 6-month emergency reserve fund.',
      steps: [
        {
          title: '1. Update Profile Info',
          desc: 'Set your name, occupation, email, and preferred display avatar.'
        },
        {
          title: '2. Define Savings Targets',
          desc: 'Specify your monthly target savings rate (%) and target emergency fund amount.'
        },
        {
          title: '3. Track Goal Completion',
          desc: 'Monitor visual milestone indicators showing how close your liquid assets are to funding your emergency buffer.'
        }
      ],
      features: [
        'Personal financial identity customization',
        'Monthly target savings goal meter',
        'Emergency fund milestone calculator (3-month and 6-month buffers)',
        'Financial health badge status'
      ],
      proTips: [
        'Aim to build an emergency fund covering at least 3 to 6 months of typical living expenses in liquid bank accounts.'
      ],
      faqs: [
        {
          q: 'Where is my profile information saved?',
          a: 'All profile details and targets are saved strictly in your local database file on your machine.'
        }
      ]
    },
    {
      id: 'settings',
      navTarget: 'settings',
      title: 'Settings, Themes & Security Vault',
      category: 'Preferences',
      badge: 'Configuration',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      summary: 'Configure active currency symbols, toggle Dark/Light themes, adjust font scaling, enable PIN/Password lock, and manage database resets.',
      overview: 'The Settings page gives you complete control over the application environment. Customize visual appearance, typography scale, monetary currencies, and activate hardware vault PIN or Password locks for maximum privacy.',
      steps: [
        {
          title: '1. Change Currency Symbol',
          desc: 'Select your preferred currency: LKR (Rs.), USD ($), EUR (€), GBP (£), INR (₹), CAD, AUD, JPY, AED, SAR, and more.'
        },
        {
          title: '2. Switch Theme & Font Sizing',
          desc: 'Toggle between sleek Dark Mode and high-contrast Light Mode. Select Small, Medium, Large, or Extra Large UI font sizes.'
        },
        {
          title: '3. Enable Security Lock',
          desc: 'Choose PIN Lock (4 digits) or Password Lock. When enabled, MoneyMate locks the screen on startup and requires verification.'
        },
        {
          title: '4. Database Wipe & Factory Reset',
          desc: 'In case you wish to start over with a clean slate, use the Dangerous Territory reset tool with two-step confirmation.'
        }
      ],
      features: [
        'Global currency switcher updating all charts and reports',
        'Dynamic Dark and Light theme engine',
        'Responsive typography scaler (Small to Extra Large)',
        'PIN & Password vault security with startup lock screen',
        'Irreversible database factory reset safeguard'
      ],
      proTips: [
        'If you frequently use MoneyMate on a shared office laptop, activate the 4-digit PIN lock to prevent unauthorized viewing.',
        'Use the Large font size option if working on a high-DPI desktop monitor.'
      ],
      faqs: [
        {
          q: 'What if I forget my PIN or Password?',
          a: 'Because data is stored 100% locally with zero cloud bypass, keep a record of your PIN/password in your password manager. You can also restore from an unencrypted backup file if needed.'
        }
      ]
    },
    {
      id: 'privacy-guarantee',
      navTarget: null,
      title: 'Offline Privacy & Local Database Architecture',
      category: 'Data & Security',
      badge: 'Privacy Shield',
      readTime: '3 min read',
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      summary: 'Complete confirmation of how MoneyMate safeguards your financial records on your local drive with zero cloud telemetry.',
      overview: 'Unlike cloud-based fintech apps that sell aggregate consumer data or suffer server data breaches, MoneyMate was designed from the ground up on an uncompromising Offline-First privacy model: "Your Financial Data Stays on Your Device."',
      steps: [
        {
          title: '1. On-Device Local Storage File',
          desc: 'All ledger data, account balances, salary slips, budgets, and keys are stored in a local JSON database file (database.json) in your operating system user data folder.'
        },
        {
          title: '2. Zero External Telemetry',
          desc: 'MoneyMate contains zero background tracking scripts, zero advertising SDKs, and zero telemetry analytics. Nothing leaves your machine.'
        },
        {
          title: '3. Full Offline Capability',
          desc: 'You can disconnect your WiFi or run the app in airplane mode with 100% full feature capability across all tools.'
        },
        {
          title: '4. Optional Vault Encryption',
          desc: 'When PIN or Password security is activated, database entries are encrypted with your key, preventing unauthorized local inspection.'
        }
      ],
      features: [
        '100% Local file storage architecture (database.json)',
        'Zero cloud dependency and zero third-party telemetry',
        'Works completely offline without an internet connection',
        'Hardware and local OS-level file isolation',
        'Instant manual backup exports anytime you want'
      ],
      proTips: [
        'Check the About Modal anytime by clicking the version number in the sidebar footer to review privacy specs.',
        'Store your exported JSON backup archives in an encrypted folder or secure drive for long-term peace of mind.'
      ],
      faqs: [
        {
          q: 'Where is the database file located on my computer?',
          a: 'On Windows, the local database is stored in your AppData directory under %APPDATA%\\moneymate\\database.json.'
        },
        {
          q: 'Can anyone else see my data?',
          a: 'Only individuals who have physical access to your operating system user account can view your data. Enabling a PIN or Password Lock adds an additional layer of security.'
        }
      ]
    }
  ];

  // Filter docs based on search query
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.overview.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.features.some(f => f.toLowerCase().includes(q)) ||
      doc.faqs.some(faq => faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const currentDoc = useMemo(() => {
    return docs.find(d => d.id === activeDocId) || docs[0];
  }, [activeDocId]);

  const toggleFaq = (idx) => {
    setExpandedFaqId(expandedFaqId === idx ? null : idx);
  };

  return (
    <div className="page active help-page-container">
      {/* Top Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Help & User Documentation</h1>
          <p>Complete guides, feature walkthroughs, tips, and privacy assurances for every tool in MoneyMate.</p>
        </div>
        <div className="header-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onOpenAbout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About MoneyMate & Privacy
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Hero Banner */}
      <div className="help-privacy-banner" onClick={() => setActiveDocId('privacy-guarantee')}>
        <div className="privacy-banner-left">
          <div className="privacy-badge-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="privacy-banner-title">
              100% Offline Privacy Guarantee: Your Financial Data Stays on Your Device
            </div>
            <div className="privacy-banner-desc">
              All transactions, balances, and salary plans are stored strictly in your local <code>database.json</code> file. Zero cloud telemetry.
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
          Read Privacy Architecture →
        </button>
      </div>

      {/* Main 2-Column Documentation Hub */}
      <div className="help-hub-layout">
        {/* Left Column: Topics Sidebar & Search */}
        <aside className="help-sidebar-panel">
          <div className="help-search-box">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="help-search-input"
              placeholder="Search help docs & features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="help-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
                &times;
              </button>
            )}
          </div>

          <div className="help-nav-list">
            <div className="help-nav-section-label">
              {searchQuery ? `Matching Results (${filteredDocs.length})` : 'Documentation Topics'}
            </div>
            {filteredDocs.length === 0 ? (
              <div className="help-no-results">
                No guides matching "<em>{searchQuery}</em>".
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = activeDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    className={`help-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveDocId(doc.id);
                      setExpandedFaqId(null);
                    }}
                  >
                    <span className="help-btn-icon">{doc.icon}</span>
                    <div className="help-btn-text">
                      <div className="help-btn-title">{doc.title}</div>
                      <div className="help-btn-meta">
                        <span className="help-meta-cat">{doc.category}</span>
                        <span className="help-meta-dot">•</span>
                        <span>{doc.readTime}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Active Documentation Article Reader */}
        <section className="help-doc-viewer">
          {/* Article Header */}
          <div className="doc-article-header">
            <div className="doc-meta-bar">
              <span className="doc-category-badge">{currentDoc.category}</span>
              <span className="doc-badge-pill">{currentDoc.badge}</span>
              <span className="doc-read-time">{currentDoc.readTime}</span>
            </div>
            <h2 className="doc-main-title">{currentDoc.title}</h2>
            <p className="doc-lead-summary">{currentDoc.summary}</p>
            
            {currentDoc.navTarget && (
              <div className="doc-quick-jump">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigate(currentDoc.navTarget)}
                >
                  Open {currentDoc.title.split('&')[0].trim()} Screen →
                </button>
              </div>
            )}
          </div>

          {/* Section: Overview */}
          <div className="doc-content-section">
            <h3 className="doc-section-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Feature Overview & Purpose
            </h3>
            <p className="doc-body-text">{currentDoc.overview}</p>
          </div>

          {/* Section: Step-by-Step Instructions */}
          <div className="doc-content-section">
            <h3 className="doc-section-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Step-by-Step How-To Guide
            </h3>
            <div className="doc-steps-container">
              {currentDoc.steps.map((step, idx) => (
                <div key={idx} className="doc-step-card">
                  <div className="doc-step-badge">{idx + 1}</div>
                  <div className="doc-step-body">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Key Capabilities */}
          <div className="doc-content-section">
            <h3 className="doc-section-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Key Capabilities
            </h3>
            <div className="doc-features-grid">
              {currentDoc.features.map((feat, idx) => (
                <div key={idx} className="doc-feature-pill">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Pro Tips */}
          {currentDoc.proTips && currentDoc.proTips.length > 0 && (
            <div className="doc-content-section">
              <div className="doc-pro-tips-box">
                <div className="pro-tips-header">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                  <h4>Pro Tips & Best Practices</h4>
                </div>
                <ul className="pro-tips-list">
                  {currentDoc.proTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section: Frequently Asked Questions */}
          {currentDoc.faqs && currentDoc.faqs.length > 0 && (
            <div className="doc-content-section">
              <h3 className="doc-section-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Frequently Asked Questions
              </h3>
              <div className="doc-faq-accordion">
                {currentDoc.faqs.map((faq, idx) => {
                  const isExpanded = expandedFaqId === idx;
                  return (
                    <div key={idx} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                      <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                        <span>{faq.q}</span>
                        <svg
                          className="faq-chevron"
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="faq-answer-body">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
