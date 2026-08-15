import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/format';
import { api } from '../../services/api';

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Salary() {
  const { accounts, salaryHistory, addSalaryRecord, editSalaryRecord, deleteSalaryRecord, settings, profile, addTransaction } = useDatabase();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger', requireTextInput: '' });

  const showConfirm = (title, message, onConfirm, type = 'danger', requireTextInput = '') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, type, requireTextInput });
  };

  // Form Fields
  const [employerId, setEmployerId] = useState('');
  const [position, setPosition] = useState('Software Engineer');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [company, setCompany] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [fixedAllowance, setFixedAllowance] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [bonus, setBonus] = useState('');
  const [overtime, setOvertime] = useState('');
  const [epfEmployee, setEpfEmployee] = useState('');
  const [epfCompany, setEpfCompany] = useState('');
  const [etfCompany, setEtfCompany] = useState('');
  const [tax, setTax] = useState('');
  const [taxType, setTaxType] = useState('');
  const [loanDeduction, setLoanDeduction] = useState('');
  const [otherDeduction, setOtherDeduction] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [payslipPath, setPayslipPath] = useState('');
  const [payslipName, setPayslipName] = useState('');
  const [salaryContributions, setSalaryContributions] = useState({});

  // Prefill states when profile/accounts change
  useEffect(() => {
    if (profile) {
      if (profile.company) setCompany(profile.company);
      if (profile.employeeId) setEmployerId(profile.employeeId);
      if (profile.designation) setPosition(profile.designation);
      
      if (profile.bankName && accounts.length > 0) {
        const matchingAcc = accounts.find(a => 
          a.bankName.toLowerCase() === profile.bankName.toLowerCase() &&
          (!profile.accountNumber || (a.accountNumber && a.accountNumber.endsWith(profile.accountNumber)))
        );
        if (matchingAcc) {
          setBankAccountId(matchingAcc.id);
        }
      }
    }
  }, [profile, accounts, isModalOpen]);



  // Statutory suggestion math based on Basic Salary
  const handleBasicSalaryChange = (val) => {
    setBasicSalary(val);
    const basic = parseFloat(val) || 0;
    
    // Auto-suggest values for custom contributions
    const updatedContribs = { ...salaryContributions };
    if (profile && Array.isArray(profile.contributions)) {
      profile.contributions.forEach(c => {
        const empRate = parseFloat(c.employeeRate) || 0;
        const emrRate = parseFloat(c.employerRate) || 0;
        updatedContribs[c.id] = {
          employee: basic > 0 ? (basic * empRate / 100).toFixed(2) : '',
          employer: basic > 0 ? (basic * emrRate / 100).toFixed(2) : ''
        };
      });
    }
    setSalaryContributions(updatedContribs);

    if (basic > 0) {
      setEpfEmployee((basic * 0.08).toFixed(2));
      setEpfCompany((basic * 0.12).toFixed(2));
      setEtfCompany((basic * 0.03).toFixed(2));
    } else {
      setEpfEmployee('');
      setEpfCompany('');
      setEtfCompany('');
    }
  };

  const handlePaymentDateChange = (val) => {
    setPaymentDate(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          setMonth(monthsList[mIdx]);
        }
      }
    }
  };

  // Select File PDF Dialog
  const handleSelectPayslip = async () => {
    try {
      const fileRes = await api.selectFile();
      if (!fileRes.canceled && fileRes.filePath) {
        setPayslipPath(fileRes.filePath);
        // Get name of file from path
        const split = fileRes.filePath.split(/[\\/]/);
        setPayslipName(split[split.length - 1]);
        showToast('Payslip document selected. It will be copied locally on submission.');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to select file.', 'error');
    }
  };

  // Open Payslip file
  const handleOpenPayslip = async (path) => {
    if (!path) return;
    try {
      const res = await api.openFile(path);
      if (res.success) {
        showToast('Opening payslip document attachment...');
      } else {
        showToast(`Failed to open payslip: ${res.error}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error launching document viewer.', 'error');
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankAccountId) {
      showToast('Please select the deposit bank account.', 'error');
      return;
    }

    const basic = parseFloat(basicSalary) || 0;
    const fixedAllow = parseFloat(fixedAllowance) || 0;
    const otherAllow = parseFloat(otherAllowances) || 0;
    const bonusVal = parseFloat(bonus) || 0;
    const otVal = parseFloat(overtime) || 0;
    
    // Calculate dynamic contributions
    let employeeContributionsSum = 0;
    const salarySlipContributions = (profile?.contributions || []).map(c => {
      const empContrib = parseFloat(salaryContributions[c.id]?.employee) || 0;
      const emrContrib = parseFloat(salaryContributions[c.id]?.employer) || 0;
      employeeContributionsSum += empContrib;
      return {
        id: c.id,
        name: c.name,
        memberId: c.memberId,
        employeeRate: parseFloat(c.employeeRate) || 0,
        employerRate: parseFloat(c.employerRate) || 0,
        employeeContribution: empContrib,
        employerContribution: emrContrib
      };
    });

    const epfContrib = salarySlipContributions.find(c => c.name.toLowerCase().includes('epf'));
    const etfContrib = salarySlipContributions.find(c => c.name.toLowerCase().includes('etf'));

    const epfEmpVal = epfContrib ? epfContrib.employeeContribution : 0;
    const epfCompVal = epfContrib ? epfContrib.employerContribution : 0;
    const etfCompVal = etfContrib ? etfContrib.employerContribution : 0;

    const taxVal = parseFloat(tax) || 0;
    const loanVal = parseFloat(loanDeduction) || 0;
    const otherDedVal = parseFloat(otherDeduction) || 0;

    // Auto calculations
    const grossEarnings = basic + fixedAllow + otherAllow + bonusVal + otVal;
    const totalDeductions = taxVal + loanVal + otherDedVal + employeeContributionsSum;
    const netSalary = grossEarnings - totalDeductions;
    const netAllowance = fixedAllow + otherAllow;

    // Derive correct month/year from date on submit
    const dateParts = paymentDate.split('-');
    const finalYear = dateParts[0];
    const finalMonth = monthsList[parseInt(dateParts[1], 10) - 1];

    // Secure local copying of payslip if selected
    let finalPayslipPath = '';
    if (payslipPath) {
      const copyRes = await api.savePayslip(payslipPath, finalMonth.toLowerCase(), finalYear);
      if (copyRes.success) {
        finalPayslipPath = copyRes.filePath;
      } else {
        showToast(`Failed to archive payslip attachment: ${copyRes.error}`, 'error');
        return;
      }
    }

    const acc = accounts.find(a => a.id === bankAccountId);
    const bankName = acc ? acc.bankName : 'Unknown';

    const payload = {
      employerId: employerId.trim(),
      position,
      year: finalYear,
      month: finalMonth,
      company: company.trim(),
      basicSalary: basic,
      fixedAllowance: fixedAllow,
      otherAllowances: otherAllow,
      bonus: bonusVal,
      overtime: otVal,
      epfEmployee: epfEmpVal,
      epfCompany: epfCompVal,
      etfCompany: etfCompVal,
      tax: taxVal,
      taxType,
      loanDeduction: loanVal,
      otherDeduction: otherDedVal,
      netSalary,
      netAllowance,
      paymentDate,
      bankName,
      bankAccount: bankAccountId,
      payslipPath: finalPayslipPath,
      contributions: salarySlipContributions
    };

    if (editingId) {
      editSalaryRecord(editingId, payload);
      setSelectedSalary({ id: editingId, ...payload });
      setIsModalOpen(false);
      showToast('Monthly salary details updated.');
    } else {
      const salaryId = `sal_${Date.now()}`;
      addSalaryRecord({ id: salaryId, ...payload });

      // Auto-record as an Income transaction in the ledger
      addTransaction({
        date: paymentDate,
        bankId: bankAccountId,
        type: 'Income',
        category: 'Salary',
        payee: company.trim(),
        amount: netSalary,
        description: 'Salary Received',
        salaryRecordId: salaryId
      });

      setIsModalOpen(false);
      showToast('Monthly salary details recorded.');
    }
  };

  const handleDelete = (id, month, year) => {
    showConfirm(
      'Delete Salary Record',
      `Delete salary record for ${month} ${year}?`,
      () => {
        deleteSalaryRecord(id);
        if (selectedSalary?.id === id) setSelectedSalary(null);
        showToast('Salary record deleted.');
      }
    );
  };

  const handleEdit = (sal) => {
    setEditingId(sal.id);
    setCompany(sal.company || '');
    setEmployerId(sal.employerId || '');
    setPosition(sal.position || '');
    setBankAccountId(sal.bankAccount || '');
    setYear(sal.year || '');
    setMonth(sal.month || '');
    setBasicSalary(sal.basicSalary !== undefined ? sal.basicSalary.toString() : '');
    setFixedAllowance(sal.fixedAllowance !== undefined ? sal.fixedAllowance.toString() : '');
    setOtherAllowances(sal.otherAllowances !== undefined ? sal.otherAllowances.toString() : '');
    setBonus(sal.bonus !== undefined ? sal.bonus.toString() : '');
    setOvertime(sal.overtime !== undefined ? sal.overtime.toString() : '');
    setEpfEmployee(sal.epfEmployee !== undefined ? sal.epfEmployee.toString() : '');
    setEpfCompany(sal.epfCompany !== undefined ? sal.epfCompany.toString() : '');
    setEtfCompany(sal.etfCompany !== undefined ? sal.etfCompany.toString() : '');
    setTax(sal.tax !== undefined ? sal.tax.toString() : '');
    setTaxType(sal.taxType || '');
    setLoanDeduction(sal.loanDeduction !== undefined ? sal.loanDeduction.toString() : '');
    setOtherDeduction(sal.otherDeduction !== undefined ? sal.otherDeduction.toString() : '');
    setPaymentDate(sal.paymentDate || '');
    setPayslipPath(sal.payslipPath || '');
    if (sal.payslipPath) {
      const split = sal.payslipPath.split(/[\\/]/);
      setPayslipName(split[split.length - 1]);
    } else {
      setPayslipName('');
    }

    const contribs = {};
    if (profile && Array.isArray(profile.contributions)) {
      profile.contributions.forEach(c => {
        const matchingContrib = sal.contributions?.find(sc => sc.id === c.id);
        contribs[c.id] = {
          employee: matchingContrib ? matchingContrib.employeeContribution.toString() : '',
          employer: matchingContrib ? matchingContrib.employerContribution.toString() : ''
        };
      });
    }
    setSalaryContributions(contribs);

    setIsModalOpen(true);
  };

  // --- STATS CALCULATIONS ---
  const count = salaryHistory.length;
  const netSalaries = salaryHistory.map(s => s.netSalary || 0);

  const averageSalary = count > 0 ? netSalaries.reduce((a, b) => a + b, 0) / count : 0;
  const highestSalary = count > 0 ? Math.max(...netSalaries) : 0;
  const lowestSalary = count > 0 ? Math.min(...netSalaries) : 0;
  const totalEarnings = netSalaries.reduce((a, b) => a + b, 0);

  const bonusEarned = salaryHistory.reduce((sum, s) => sum + (s.bonus || 0), 0);
  const overtimeEarned = salaryHistory.reduce((sum, s) => sum + (s.overtime || 0), 0);
  
  const totalEPF = salaryHistory.reduce((sum, s) => {
    if (s.contributions && s.contributions.length > 0) {
      const epf = s.contributions.find(c => c.name.toLowerCase().includes('epf'));
      if (epf) {
        return sum + (epf.employeeContribution || 0) + (epf.employerContribution || 0);
      }
    }
    return sum + (s.epfEmployee || 0) + (s.epfCompany || 0);
  }, 0);

  const totalETF = salaryHistory.reduce((sum, s) => {
    if (s.contributions && s.contributions.length > 0) {
      const etf = s.contributions.find(c => c.name.toLowerCase().includes('etf'));
      if (etf) {
        return sum + (etf.employerContribution || 0);
      }
    }
    return sum + (s.etfCompany || 0);
  }, 0);

  // Set default selected salary as the most recent record on mount
  useEffect(() => {
    if (salaryHistory.length > 0 && !selectedSalary) {
      // Sort chronologically and set most recent
      const sorted = [...salaryHistory].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      setSelectedSalary(sorted[0]);
    }
  }, [salaryHistory, selectedSalary]);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Salary Management</h1>
          <p>Monitor paystubs history, position progression, and EPF/ETF contributions.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setEmployerId('');
            setCompany('');
            setBasicSalary('');
            setFixedAllowance('');
            setOtherAllowances('');
            setBonus('');
            setOvertime('');
            setEpfEmployee('');
            setEpfCompany('');
            setEtfCompany('');
            setTax('');
            setTaxType('');
            setLoanDeduction('');
            setOtherDeduction('');
            setPayslipPath('');
            setPayslipName('');
            
            const initialContribs = {};
            if (profile && Array.isArray(profile.contributions)) {
              profile.contributions.forEach(c => {
                initialContribs[c.id] = { employee: '', employer: '' };
              });
            }
            setSalaryContributions(initialContribs);

            const today = new Date().toISOString().split('T')[0];
            setPaymentDate(today);
            const parts = today.split('-');
            setYear(parts[0]);
            const mIdx = parseInt(parts[1], 10) - 1;
            setMonth(monthsList[mIdx]);
            setBankAccountId(accounts[0]?.id || '');
            setIsModalOpen(true);
          }}>
            Log Salary Record
          </button>
        </div>
      </div>

      {/* Salary Statistics Dashboard */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="panel stat-card" style={{ display: 'block', padding: '16px 20px' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Average Net Pay</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#6366f1', marginTop: '4px' }}>
            {formatCurrency(averageSalary, settings.currency)}
          </div>
        </div>
        
        <div className="panel stat-card" style={{ display: 'block', padding: '16px 20px' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Highest Net Salary</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#10b981', marginTop: '4px' }}>
            {formatCurrency(highestSalary, settings.currency)}
          </div>
        </div>

        <div className="panel stat-card" style={{ display: 'block', padding: '16px 20px' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Lowest Net Salary</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', color: '#f43f5e', marginTop: '4px' }}>
            {formatCurrency(lowestSalary, settings.currency)}
          </div>
        </div>

        <div className="panel stat-card" style={{ display: 'block', padding: '16px 20px' }}>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>Total Earnings</div>
          <div className="stat-value" style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            {formatCurrency(totalEarnings, settings.currency)}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="panel" style={{ padding: '14px 20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Bonus Earned</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#eab308', marginTop: '2px' }}>{formatCurrency(bonusEarned, settings.currency)}</div>
        </div>
        <div className="panel" style={{ padding: '14px 20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Overtime Earned</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>{formatCurrency(overtimeEarned, settings.currency)}</div>
        </div>
        <div className="panel" style={{ padding: '14px 20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Total EPF (Emp + Comp)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{formatCurrency(totalEPF, settings.currency)}</div>
        </div>
        <div className="panel" style={{ padding: '14px 20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>Total ETF (Comp)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#14b8a6', marginTop: '2px' }}>{formatCurrency(totalETF, settings.currency)}</div>
        </div>
      </div>

      {/* Split view: list of records on left, detailed pay stub on right */}
      <div className="salary-dashboard">
        {/* Left Column: timeline history list */}
        <div className="panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Salary Records Timeline</h2>
          <div className="salary-timeline">
            {salaryHistory.map(pay => (
              <div 
                key={pay.id} 
                className={`salary-event-card ${selectedSalary?.id === pay.id ? 'active' : ''}`}
                onClick={() => setSelectedSalary(pay)}
                style={{ cursor: 'pointer', borderLeft: selectedSalary?.id === pay.id ? '4px solid var(--border-focus)' : '4px solid #10b981' }}
              >
                <div className="salary-info-main">
                  <div className="salary-date">{pay.month} {pay.year}</div>
                  <div className="salary-details-text">{pay.company} • {pay.position}</div>
                </div>
                <div className="salary-amount-block">
                  <div className="salary-amount" style={{ color: '#10b981' }}>
                    {formatCurrency(pay.netSalary, settings.currency)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Paid: {pay.paymentDate}</div>
                </div>
              </div>
            ))}

            {salaryHistory.length === 0 && (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <div className="empty-state-text">No salary records saved. Log one above.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payslip inspector details */}
        <div className="panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Salary Statements</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Detailed salary breakdowns, earnings information, and related attachments.</p>

          {selectedSalary ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedSalary.month} {selectedSalary.year}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedSalary.company} • {selectedSalary.position}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Employer ID</div>
                  <div style={{ fontWeight: 600 }}>{selectedSalary.employerId || 'N/A'}</div>
                </div>
              </div>

              {/* Earnings */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Earnings</h3>
                <div className="deduction-item">
                  <span className="deduction-label">Basic Salary</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(selectedSalary.basicSalary, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Fixed Allowance</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(selectedSalary.fixedAllowance, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Other Expense Allowances</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(selectedSalary.otherAllowances || 0, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Bonus</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(selectedSalary.bonus || 0, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Overtime Pay</span>
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>{formatCurrency(selectedSalary.overtime || 0, settings.currency)}</span>
                </div>
                <div className="deduction-item" style={{ borderBottom: 'none', borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '6px' }}>
                  <span className="deduction-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Gross Earnings</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {formatCurrency(
                      selectedSalary.basicSalary + 
                      selectedSalary.fixedAllowance + 
                      (selectedSalary.otherAllowances || 0) + 
                      (selectedSalary.bonus || 0) + 
                      (selectedSalary.overtime || 0), 
                      settings.currency
                    )}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Deductions</h3>
                
                {selectedSalary.contributions && selectedSalary.contributions.length > 0 ? (
                  selectedSalary.contributions.map(c => (
                    c.employeeContribution > 0 && (
                      <div key={c.id} className="deduction-item">
                        <span className="deduction-label">{c.name} Employee ({c.employeeRate}%)</span>
                        <span className="deduction-val">{formatCurrency(c.employeeContribution, settings.currency)}</span>
                      </div>
                    )
                  ))
                ) : (
                  <>
                    {selectedSalary.epfEmployee > 0 && (
                      <div className="deduction-item">
                        <span className="deduction-label">EPF Employee (8%)</span>
                        <span className="deduction-val">{formatCurrency(selectedSalary.epfEmployee, settings.currency)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="deduction-item">
                  <span className="deduction-label">Tax{selectedSalary.taxType ? ` (${selectedSalary.taxType})` : ''}</span>
                  <span className="deduction-val">{formatCurrency(selectedSalary.tax || 0, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Loan Deductions</span>
                  <span className="deduction-val">{formatCurrency(selectedSalary.loanDeduction || 0, settings.currency)}</span>
                </div>
                <div className="deduction-item">
                  <span className="deduction-label">Other Miscellaneous Deductions</span>
                  <span className="deduction-val">{formatCurrency(selectedSalary.otherDeduction || 0, settings.currency)}</span>
                </div>
              </div>

              {/* Company statutory contributions (informational) */}
              {((selectedSalary.contributions && selectedSalary.contributions.some(c => c.employerContribution > 0)) || selectedSalary.epfCompany > 0 || selectedSalary.etfCompany > 0) ? (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Company Statutory Contributions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                    {selectedSalary.contributions && selectedSalary.contributions.length > 0 ? (
                      selectedSalary.contributions.map(c => (
                        c.employerContribution > 0 && (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.name} Employer ({c.employerRate}%):</span>
                            <strong>{formatCurrency(c.employerContribution, settings.currency)}</strong>
                          </div>
                        )
                      ))
                    ) : (
                      <>
                        {selectedSalary.epfCompany > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Employer EPF (12%):</span>
                            <strong>{formatCurrency(selectedSalary.epfCompany, settings.currency)}</strong>
                          </div>
                        )}
                        {selectedSalary.etfCompany > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Employer ETF (3%):</span>
                            <strong>{formatCurrency(selectedSalary.etfCompany, settings.currency)}</strong>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Summary net pay */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Allowance (Auto calculated)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(selectedSalary.netAllowance, settings.currency)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Disbursed Salary (Auto calculated)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(selectedSalary.netSalary, settings.currency)}</div>
                </div>
              </div>

              {/* Actions & attachment viewer */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button className="btn btn-danger" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }} onClick={() => handleDelete(selectedSalary.id, selectedSalary.month, selectedSalary.year)}>
                  Delete Slip
                </button>
                <button className="btn btn-secondary" onClick={() => handleEdit(selectedSalary)}>
                  Edit Details
                </button>
                {selectedSalary.payslipPath ? (
                  <button className="btn btn-primary" onClick={() => handleOpenPayslip(selectedSalary.payslipPath)}>
                    View Payslip Attachment (PDF)
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>No PDF attachment linked.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div className="empty-state-text">Select a month record to view detailed salary slip diagnostics.</div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: LOG/EDIT SALARY HISTORY */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Monthly Salary Slip" : "Log Monthly Salary Slip"}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row-2">
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={company} 
                  onChange={e => setCompany(e.target.value)} 
                  placeholder="e.g. WSO2, Virtusa" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>My Employer ID</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={employerId} 
                  onChange={e => setEmployerId(e.target.value)} 
                  placeholder="e.g. EMP-2234" 
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Position / Title</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={position} 
                  onChange={e => setPosition(e.target.value)} 
                  placeholder="e.g. Software Engineer, Sales Executive" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Deposit Bank Account</label>
                <select className="input-ctrl" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} required>
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Year</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={year} 
                  onChange={e => setYear(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Month</label>
                <select className="input-ctrl" value={month} onChange={e => setMonth(e.target.value)}>
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Basic Salary (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={basicSalary} 
                  onChange={e => handleBasicSalaryChange(e.target.value)} 
                  placeholder="0.00" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Fixed Allowance (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={fixedAllowance} 
                  onChange={e => setFixedAllowance(e.target.value)} 
                  placeholder="0.00" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Other Allowances</label>
                <input type="number" className="input-ctrl" value={otherAllowances} onChange={e => setOtherAllowances(e.target.value)} placeholder="0.00" min="0" />
              </div>
              <div className="form-group">
                <label>Bonus (Rs.)</label>
                <input type="number" className="input-ctrl" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="0.00" min="0" />
              </div>
              <div className="form-group">
                <label>Overtime Pay (Rs.)</label>
                <input type="number" className="input-ctrl" value={overtime} onChange={e => setOvertime(e.target.value)} placeholder="0.00" min="0" />
              </div>
            </div>

            <div style={{ margin: '14px 0', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Statutory Details (Auto Suggested)</span>
            </div>

            {(!profile || !Array.isArray(profile.contributions) || profile.contributions.length === 0) ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '14px' }}>
                No custom contributions configured in your profile.
              </div>
            ) : (
              profile.contributions.map(c => (
                <div key={c.id} className="form-row-2" style={{ marginBottom: '12px' }}>
                  <div className="form-group">
                    <label>{c.name} Employee ({c.employeeRate}%)</label>
                    <input 
                      type="number" 
                      className="input-ctrl" 
                      value={salaryContributions[c.id]?.employee || ''} 
                      onChange={e => setSalaryContributions(prev => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], employee: e.target.value }
                      }))} 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>{c.name} Employer ({c.employerRate}%)</label>
                    <input 
                      type="number" 
                      className="input-ctrl" 
                      value={salaryContributions[c.id]?.employer || ''} 
                      onChange={e => setSalaryContributions(prev => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], employer: e.target.value }
                      }))} 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01"
                    />
                  </div>
                </div>
              ))
            )}

            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tax Deducted (Rs.)</label>
                <input type="number" className="input-ctrl" value={tax} onChange={e => setTax(e.target.value)} placeholder="0.00" min="0" />
              </div>
              <div className="form-group">
                <label>Tax Type</label>
                <input
                  type="text"
                  className="input-ctrl"
                  value={taxType}
                  onChange={e => setTaxType(e.target.value)}
                  placeholder="e.g. APIT, PAYE, WHT"
                />
              </div>
              <div className="form-group">
                <label>Loan Deductions (Rs.)</label>
                <input type="number" className="input-ctrl" value={loanDeduction} onChange={e => setLoanDeduction(e.target.value)} placeholder="0.00" min="0" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Other Deductions (Rs.)</label>
              <input type="number" className="input-ctrl" value={otherDeduction} onChange={e => setOtherDeduction(e.target.value)} placeholder="0.00" min="0" />
            </div>

            <div className="form-row-2" style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div className="form-group">
                <label>Payment Received Date</label>
                <input type="date" className="input-ctrl" value={paymentDate} onChange={e => handlePaymentDateChange(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Payslip PDF Attachment</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={handleSelectPayslip}>
                    {payslipName ? payslipName : 'Browse File...'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? "Save Changes" : "Archive Record"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        requireTextInput={confirmState.requireTextInput}
      />
    </div>
  );
}
