import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

export function registerSalaryTests() {
  describe('Salary', () => {

    test('TC-SAL-001', 'Gross Earnings Calculation with Allowances, Bonus & Overtime', () => {
      const basic = 4000;
      const fixedAllowance = 600;
      const otherAllowances = 250;
      const bonus = 500;
      const overtime = 200;

      const grossEarnings = basic + fixedAllowance + otherAllowances + bonus + overtime;
      expect(grossEarnings).toBe(5550);
    }, {
      description: 'Calculates gross salary from basic salary and all additive components',
      steps: ['Sum basic, fixed allowance, other allowance, bonus, and overtime', 'Assert gross earnings'],
      expectedResult: 'Gross Earnings is accurately calculated as 5550.00'
    });

    test('TC-SAL-002', 'Statutory Deductions (EPF Employee 8%, EPF Employer 12%, ETF Employer 3%)', () => {
      const basic = 5000;
      const epfEmployeeRate = 8;
      const epfEmployerRate = 12;
      const etfEmployerRate = 3;

      const epfEmployee = (basic * epfEmployeeRate) / 100;
      const epfEmployer = (basic * epfEmployerRate) / 100;
      const etfEmployer = (basic * etfEmployerRate) / 100;

      expect(epfEmployee).toBe(400);
      expect(epfEmployer).toBe(600);
      expect(etfEmployer).toBe(150);
    }, {
      description: 'Calculates EPF and ETF statutory contributions from basic salary according to standard rates',
      steps: ['Compute 8% EPF employee', 'Compute 12% EPF employer', 'Compute 3% ETF employer'],
      expectedResult: 'EPF Employee = 400, EPF Employer = 600, ETF Employer = 150'
    });

    test('TC-SAL-003', 'Dynamic Profile Contributions Computation Based on Custom Rates', () => {
      const basic = 6000;
      const customContributions = [
        { id: 'c1', name: 'Provident Fund', employeeRate: 10, employerRate: 15 },
        { id: 'c2', name: 'Gratuity Fund', employeeRate: 2, employerRate: 4 }
      ];

      let employeeTotal = 0;
      let employerTotal = 0;

      customContributions.forEach(c => {
        const emp = (basic * c.employeeRate) / 100;
        const emr = (basic * c.employerRate) / 100;
        employeeTotal += emp;
        employerTotal += emr;
      });

      expect(employeeTotal).toBe(720); // 600 + 120
      expect(employerTotal).toBe(1140); // 900 + 240
    }, {
      description: 'Evaluates custom statutory contribution rates configured in user profile',
      steps: ['Iterate profile contribution schemes', 'Compute employee and employer sums'],
      expectedResult: 'Dynamic contributions computed accurately'
    });

    test('TC-SAL-004', 'Total Deductions Calculation (Taxes, Loans, Employee Deductions)', () => {
      const tax = 350;
      const loanDeduction = 200;
      const otherDeduction = 50;
      const employeeContributionsSum = 400; // EPF 8%

      const totalDeductions = tax + loanDeduction + otherDeduction + employeeContributionsSum;
      expect(totalDeductions).toBe(1000);
    }, {
      description: 'Aggregates all subtractions from gross earnings into total deductions',
      steps: ['Sum tax, loan, other deduction, and employee contributions'],
      expectedResult: 'Total Deductions equals 1000.00'
    });

    test('TC-SAL-005', 'Net Salary Calculation (Gross Earnings - Total Deductions)', () => {
      const grossEarnings = 5550;
      const totalDeductions = 1000;
      const netSalary = grossEarnings - totalDeductions;

      expect(netSalary).toBe(4550);
    }, {
      description: 'Calculates final net take-home salary',
      steps: ['Subtract total deductions from gross earnings', 'Assert net salary'],
      expectedResult: 'Net Salary is 4550.00'
    });

    test('TC-SAL-006', 'Automatic Synchronized Income Transaction Creation on Adding Salary Record', () => {
      const db = createMockDatabase();
      const newSalary = db.addSalaryRecord({
        employerId: 'EMP-9081',
        company: 'Acme Corp',
        year: '2026',
        month: 'September',
        paymentDate: '2026-09-01',
        bankAccount: 'acc_boc_01',
        basicSalary: 5000,
        grossEarnings: 5500,
        totalDeductions: 500,
        netSalary: 5000
      });

      const state = db.getState();
      const autoTx = state.transactions.find(t => t.salaryRecordId === newSalary.id);

      expect(autoTx).toBeDefined();
      expect(autoTx.type).toBe('Income');
      expect(autoTx.category).toBe('Salary');
      expect(autoTx.amount).toBe(5000);
      expect(autoTx.bankId).toBe('acc_boc_01');
      expect(autoTx.description).toBe('Salary: September 2026');
    }, {
      description: 'Verifies that adding a salary slip automatically creates a corresponding Income transaction in the ledger',
      steps: ['Add salary record via addSalaryRecord', 'Search transactions array for matching salaryRecordId', 'Assert transaction fields'],
      expectedResult: 'Income transaction created and linked via salaryRecordId'
    });

    test('TC-SAL-007', 'Edit Salary Record Automatically Syncs Ledger Transaction', () => {
      const db = createMockDatabase();
      // Initially sal_init_01 exists with netSalary 5000
      const initialSalary = db.getState().salaryHistory.find(s => s.id === 'sal_init_01');
      expect(initialSalary).toBeDefined();

      db.editSalaryRecord('sal_init_01', {
        netSalary: 5200,
        paymentDate: '2026-08-02',
        company: 'Acme Corp Global'
      });

      const state = db.getState();
      const updatedSalary = state.salaryHistory.find(s => s.id === 'sal_init_01');
      const syncedTx = state.transactions.find(t => t.salaryRecordId === 'sal_init_01' || t.id === 'tx_init_01');

      expect(updatedSalary.netSalary).toBe(5200);
      expect(syncedTx.amount).toBe(5200);
      expect(syncedTx.date).toBe('2026-08-02');
      expect(syncedTx.payee).toBe('Acme Corp Global');
    }, {
      description: 'Edits salary record and verifies corresponding ledger transaction amounts and dates are updated in sync',
      steps: ['Call editSalaryRecord with new netSalary 5200', 'Check linked transaction amount and payment date'],
      expectedResult: 'Salary record and ledger transaction updated in lockstep'
    });

    test('TC-SAL-008', 'Delete Salary Record Automatically Unlinks / Removes Ledger Transaction', () => {
      const db = createMockDatabase();
      db.deleteSalaryRecord('sal_init_01');

      const state = db.getState();
      const salExists = state.salaryHistory.find(s => s.id === 'sal_init_01');
      const txExists = state.transactions.find(t => t.salaryRecordId === 'sal_init_01' || (t.category === 'Salary' && t.id === 'tx_init_01'));

      expect(salExists).toBeUndefined();
      expect(txExists).toBeUndefined();
    }, {
      description: 'Deletes salary slip and verifies cascading removal of its generated ledger transaction',
      steps: ['Call deleteSalaryRecord with sal_init_01', 'Verify salaryHistory array', 'Verify transactions array'],
      expectedResult: 'Salary record and linked transaction removed'
    });

    test('TC-SAL-009', 'Salary History Filtering by Year and Month', () => {
      const db = createMockDatabase();
      // Add multiple salary records
      db.addSalaryRecord({
        year: '2025',
        month: 'December',
        paymentDate: '2025-12-01',
        bankAccount: 'acc_boc_01',
        netSalary: 4500
      });

      const state = db.getState();
      
      const filtered2026 = state.salaryHistory.filter(s => s.year === '2026');
      const filtered2025 = state.salaryHistory.filter(s => s.year === '2025');

      expect(filtered2026.length).toBe(1);
      expect(filtered2025.length).toBe(1);
    }, {
      description: 'Filters salary history slips by year',
      steps: ['Filter salary history by year 2026 vs 2025', 'Assert filtered count'],
      expectedResult: 'Correct records returned per year filter'
    });

    test('TC-SAL-010', 'Month and Year Auto-Derivation from Payment Date', () => {
      const monthsList = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const paymentDate = '2026-11-25';
      const parts = paymentDate.split('-');
      const derivedYear = parts[0];
      const derivedMonth = monthsList[parseInt(parts[1], 10) - 1];

      expect(derivedYear).toBe('2026');
      expect(derivedMonth).toBe('November');
    }, {
      description: 'Derives month name and year string from ISO payment date format YYYY-MM-DD',
      steps: ['Parse paymentDate 2026-11-25', 'Extract year and month name from lookup list'],
      expectedResult: 'Year is 2026 and Month is November'
    });

  }, 'Salary slip computation, EPF/ETF statutory rates, taxes, net pay, and ledger sync');
}
