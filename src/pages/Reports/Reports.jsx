import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { formatCurrency, currencySymbols } from '../../utils/format';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { accounts, transactions, salaryHistory, settings } = useDatabase();
  const { showToast } = useToast();

  const [period, setPeriod] = useState('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountId, setAccountId] = useState('all');

  const filterByDate = (dateStr) => {
    if (!dateStr) return false;

    if (period === 'custom') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }

    const txDate = new Date(dateStr);
    const now = new Date();
    
    if (period === 'this-month') {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    } else if (period === 'last-month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txDate.getMonth() === prev.getMonth() && txDate.getFullYear() === prev.getFullYear();
    } else if (period === 'last-3-months') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return txDate >= cutoff;
    } else if (period === 'last-6-months') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return txDate >= cutoff;
    } else if (period === 'this-year') {
      return txDate.getFullYear() === now.getFullYear();
    }
    return true; // all time
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      const matchesAcc = accountId === 'all' || t.bankId === accountId || t.targetBankId === accountId;
      const matchesDate = filterByDate(t.date);
      return matchesAcc && matchesDate;
    });
  };

  const getFilteredSalaries = () => {
    return salaryHistory.filter(s => {
      const matchesAcc = accountId === 'all' || s.bankAccount === accountId;
      const matchesDate = filterByDate(s.paymentDate);
      return matchesAcc && matchesDate;
    });
  };

  // Compile Excel Worksheet
  const handleExportExcel = () => {
    const targetTx = getFilteredTransactions();
    if (targetTx.length === 0) {
      showToast('Ledger list is empty for the active query parameters.', 'error');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Accounts Summary
      const accountsRows = accounts.map(a => ({
        'Bank Name': a.bankName,
        'Account Holder Name': a.accountName,
        'Type': a.accountType,
        'LKR Balance': a.balance,
        'Branch': a.branch || 'N/A',
        'Account Number': a.accountNumber || 'N/A',
        'Status': a.status
      }));
      const wsAcc = XLSX.utils.json_to_sheet(accountsRows);
      XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts Summary');

      // Sheet 2: Transactions
      const ledgerRows = targetTx.map(t => {
        const acc = accounts.find(a => a.id === t.bankId);
        const targetAcc = accounts.find(a => a.id === t.targetBankId);
        return {
          'Date': t.date,
          'Bank / Wallet': acc ? acc.bankName : 'Unknown',
          'Target Bank (For Transfer)': targetAcc ? targetAcc.bankName : 'N/A',
          'Type': t.type,
          'Category': t.category,
          'Payee / Recipient': t.payee || 'N/A',
          'Amount': t.amount,
          'Description': t.description
        };
      });
      const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
      XLSX.utils.book_append_sheet(wb, wsLedger, 'Ledger Transactions');

      // Sheet 3: Salary History
      const targetSalaries = getFilteredSalaries();
      const salaryRows = targetSalaries.map(s => ({
        'Company': s.company,
        'Employer ID': s.employerId,
        'Position': s.position,
        'Period': `${s.month} ${s.year}`,
        'Basic Salary': s.basicSalary,
        'Fixed Allowance': s.fixedAllowance,
        'Other Allowance': s.otherAllowances || 0,
        'Bonus': s.bonus || 0,
        'Overtime': s.overtime || 0,
        'EPF Employee (8%)': s.epfEmployee || 0,
        'Tax Deduct': s.tax || 0,
        'Loan Deduct': s.loanDeduction || 0,
        'Other Deduct': s.otherDeduction || 0,
        'Net Salary Pay': s.netSalary || 0,
        'Net Allowance': s.netAllowance || 0,
        'Payment Date': s.paymentDate,
        'Deposit Account Name': s.bankName
      }));
      const wsSal = XLSX.utils.json_to_sheet(salaryRows);
      XLSX.utils.book_append_sheet(wb, wsSal, 'Salary Ledger');

      XLSX.writeFile(wb, `moneymate_local_audit_report_${Date.now()}.xlsx`);
      showToast('Excel spreadsheet compiled and downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile Excel file.', 'error');
    }
  };

  // Compile PDF document
  const handleExportPDF = () => {
    const targetTx = getFilteredTransactions();
    if (targetTx.length === 0) {
      showToast('Ledger list is empty for the active query parameters.', 'error');
      return;
    }

    try {
      const doc = new jsPDF();
      const symbol = currencySymbols[settings.currency || 'LKR'] || 'Rs.';

      // Title layout
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 19, 34);
      doc.text('MoneyMate Salary & Finance Audit Sheet', 14, 20);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated offline on: ${new Date().toLocaleString()}`, 14, 28);
      const periodLabel = period === 'custom'
        ? `Custom (${startDate || 'Start'} to ${endDate || 'End'})`
        : period.replace(/-/g, ' ');
      doc.text(`Report Period: ${periodLabel} • Filter Account: ${accountId === 'all' ? 'All' : accounts.find(a => a.id === accountId)?.bankName}`, 14, 33);
      doc.line(14, 37, 196, 37);

      // 1. Accounts Summary Section
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 19, 34);
      doc.text('Bank Accounts Summary', 14, 46);

      const accountsHeaders = [['Bank / Source', 'Account Name', 'Type', 'Branch', `Balance (${symbol})`, 'Status']];
      const accountsRows = accounts.map(a => [
        a.bankName,
        a.accountName,
        a.accountType,
        a.branch || 'N/A',
        a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        a.status
      ]);

      autoTable(doc, {
        startY: 51,
        head: accountsHeaders,
        body: accountsRows,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // 2. Ledger Transactions Section
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.text('Ledger Transactions History', 14, doc.lastAutoTable.finalY + 14);

      const txHeaders = [['Date', 'Bank / Source', 'Payment Type', 'Category', 'Payee / Recipient', `Amount (${symbol})`, 'Description']];
      const txRows = targetTx.map(t => {
        const sourceAcc = accounts.find(a => a.id === t.bankId);
        const targetAcc = accounts.find(a => a.id === t.targetBankId);
        const bankName = t.type === 'Online/Account cash transfer' 
          ? `${sourceAcc?.bankName} -> ${targetAcc?.bankName}`
          : (sourceAcc?.bankName || 'Unknown');
        
        return [
          t.date,
          bankName,
          t.type,
          t.category,
          t.payee || 'N/A',
          t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          t.description
        ];
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 19,
        head: txHeaders,
        body: txRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      // 3. Salary History Section
      const targetSalaries = getFilteredSalaries();
      if (targetSalaries.length > 0) {
        if (doc.lastAutoTable.finalY > 180) {
          doc.addPage();
          doc.setFontSize(13);
          doc.setFont('Helvetica', 'bold');
          doc.text('Monthly Salaries History Registry', 14, 20);
        } else {
          doc.setFontSize(13);
          doc.setFont('Helvetica', 'bold');
          doc.text('Monthly Salaries History Registry', 14, doc.lastAutoTable.finalY + 14);
        }

        const salaryHeaders = [['Period', 'Employer ID / Position', 'Company', 'Gross Base', 'Total Deduct', `Net Salary (${symbol})`, 'Pay Date']];
        const salaryRows = targetSalaries.map(s => {
          const ded = s.deductions || { tax: 0, pf: 0, health: 0, other: 0 };
          const totalDed = (s.epfEmployee || 0) + (s.epfCompany || 0) + (s.etfCompany || 0) + (s.tax || 0) + (s.loanDeduction || 0) + (s.otherDeduction || 0);
          return [
            `${s.month} ${s.year}`,
            `${s.employerId}\n${s.position}`,
            s.company,
            s.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            totalDed.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            s.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            s.paymentDate
          ];
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY > 180 ? 25 : doc.lastAutoTable.finalY + 19,
          head: salaryHeaders,
          body: salaryRows,
          theme: 'striped',
          headStyles: { fillColor: [13, 148, 136], fontStyle: 'bold' },
          styles: { fontSize: 8 },
          margin: { left: 14, right: 14 }
        });
      }

      doc.save(`moneymate_local_audit_report_${Date.now()}.pdf`);
      showToast('PDF report compiled and downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile PDF report.', 'error');
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Report Compiler</h1>
          <p>Generate financial summaries and export transaction logs offline.</p>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Filter audit bounds</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Select dates and bank accounts to export.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="form-group">
            <label>Report Time Period</label>
            <select className="input-ctrl" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="this-month">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="this-year">This Year</option>
              <option value="all-time">All Records</option>
              <option value="custom">Custom Period</option>
            </select>
          </div>

          <div className="form-group">
            <label>Filter by Bank Account</label>
            <select className="input-ctrl" value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="all">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
              ))}
            </select>
          </div>
        </div>

        {period === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input-ctrl"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="input-ctrl"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button className="btn btn-primary" onClick={handleExportExcel}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Export Excel (.xlsx)
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Export PDF (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
}
