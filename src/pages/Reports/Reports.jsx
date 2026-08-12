import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { formatCurrency, currencySymbols } from '../../utils/format';
import XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function createStyledSheet(title, subtitle, headers, rows, columnAlignments, numberFormats, headerColor = "3B82F6") {
  const aoa = [
    [title],
    [subtitle],
    [],
    headers,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const numCols = headers.length;

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }
  ];

  ws['!rows'] = [
    { hpt: 28 }, // Title
    { hpt: 18 }, // Subtitle
    { hpt: 10 }, // Empty spacer
    { hpt: 24 }  // Table Headers
  ];
  for (let i = 0; i < rows.length; i++) {
    ws['!rows'].push({ hpt: 20 });
  }

  const colWidths = headers.map(h => Math.max(12, h.length + 4));
  rows.forEach(row => {
    row.forEach((val, cIdx) => {
      if (val !== null && val !== undefined) {
        const textLen = val.toString().length;
        if (textLen + 3 > colWidths[cIdx]) {
          colWidths[cIdx] = textLen + 3;
        }
      }
    });
  });
  ws['!cols'] = colWidths.map(w => ({ wch: w }));

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r; r <= range.e.r; ++r) {
    for (let c = range.s.c; c <= range.e.c; ++c) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      if (r === 0) {
        cell.s = {
          font: { name: 'Segoe UI', bold: true, size: 14, color: { rgb: '1F2937' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      } else if (r === 1) {
        cell.s = {
          font: { name: 'Segoe UI', italic: true, size: 9.5, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      } else if (r === 3) {
        cell.s = {
          font: { name: 'Segoe UI', bold: true, size: 10, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: headerColor } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            bottom: { style: 'medium', color: { rgb: '111827' } },
            top: { style: 'thin', color: { rgb: headerColor } },
            left: { style: 'thin', color: { rgb: headerColor } },
            right: { style: 'thin', color: { rgb: headerColor } }
          }
        };
      } else if (r > 3) {
        const isEven = (r % 2 === 0);
        const colAlign = columnAlignments[c] || 'left';
        const numFormat = numberFormats[c];

        if (numFormat && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = numFormat;
        }

        const isTotalRow = (ws[XLSX.utils.encode_cell({ r, c: 0 })]?.v === 'Total');

        cell.s = {
          font: { name: 'Segoe UI', size: 9.5, bold: isTotalRow, color: { rgb: isTotalRow ? '111827' : '374151' } },
          fill: { fgColor: { rgb: isTotalRow ? 'E2E8F0' : (isEven ? 'F9FAFB' : 'FFFFFF') } },
          alignment: { horizontal: colAlign, vertical: 'center' },
          border: {
            bottom: { style: isTotalRow ? 'double' : 'thin', color: { rgb: isTotalRow ? '111827' : 'E5E7EB' } },
            top: { style: isTotalRow ? 'thin' : 'thin', color: { rgb: isTotalRow ? '111827' : 'E5E7EB' } },
            left: { style: 'thin', color: { rgb: 'E5E7EB' } },
            right: { style: 'thin', color: { rgb: 'E5E7EB' } }
          }
        };
      }
    }
  }

  return ws;
}

function getExportFilename(typeLabel, extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const sanitizedLabel = typeLabel.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  return `MoneyMate_${sanitizedLabel}_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.${extension}`;
}

function getPeriodStartDateStr(period, startDate) {
  const now = new Date();
  if (period === 'custom') {
    return startDate || '0000-00-00';
  }
  if (period === 'this-month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
  if (period === 'last-month') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  }
  if (period === 'last-3-months') {
    return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
  }
  if (period === 'last-6-months') {
    return new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
  }
  if (period === 'this-year') {
    return `${now.getFullYear()}-01-01`;
  }
  return '0000-00-00'; // all time
}

function getPassbookData(accountId, transactions, filterByDate, period, startDate) {
  const accTx = transactions.filter(t => t.bankId === accountId || (t.type === 'Online/Account cash transfer' && t.targetBankId === accountId));
  accTx.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  let startingBalance = 0;
  const periodStartDate = getPeriodStartDateStr(period, startDate);
  const periodTx = [];
  let totalDebits = 0;
  let totalCredits = 0;

  accTx.forEach(t => {
    let isCredit = false;
    let isDebit = false;
    const amount = t.amount;

    if (t.bankId === accountId) {
      const type = t.type;
      if (type === 'Income' || type === 'Deposit' || type === 'Refund') {
        isCredit = true;
        runningBalance += amount;
      } else if (type === 'Expense' || type === 'Withdrawal' || type === 'online payment' || type === 'Online Payment' || type === 'Online/Account cash transfer' || type === 'Bill & Payment') {
        isDebit = true;
        runningBalance -= amount;
      }
    } else if (t.type === 'Online/Account cash transfer' && t.targetBankId === accountId) {
      isCredit = true;
      runningBalance += amount;
    }

    const dateMatches = filterByDate(t.date);
    if (dateMatches) {
      if (isCredit) totalCredits += amount;
      if (isDebit) totalDebits += amount;
      
      periodTx.push({
        ...t,
        debit: isDebit ? amount : null,
        credit: isCredit ? amount : null,
        balanceAfter: runningBalance
      });
    } else {
      if (t.date < periodStartDate) {
        startingBalance = runningBalance;
      }
    }
  });

  return {
    startingBalance,
    periodTx,
    totalDebits,
    totalCredits,
    finalBalance: runningBalance
  };
}

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
      const matchesAcc = accountId === 'all' || accountId === 'overall-salaries' || s.bankAccount === accountId;
      const matchesDate = filterByDate(s.paymentDate);
      return matchesAcc && matchesDate;
    });
  };

  // Compile Excel Worksheet
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const periodLabel = period === 'custom'
        ? `Custom Period (${startDate || 'Start'} to ${endDate || 'End'})`
        : period.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const dateStr = new Date().toLocaleString();

      if (accountId === 'all') {
        // Overall Bank Accounts Summary
        const targetTx = getFilteredTransactions();
        const targetSalaries = getFilteredSalaries();

        // 1. Accounts Summary Sheet
        const accHeaders = ['Bank Name', 'Account Holder Name', 'Type', 'LKR Balance', 'Branch', 'Account Number', 'Status'];
        const accRows = accounts.map(a => [
          a.bankName,
          a.accountName,
          a.accountType,
          a.balance,
          a.branch || 'N/A',
          a.accountNumber || 'N/A',
          a.status
        ]);
        const wsAcc = createStyledSheet(
          'MoneyMate - Bank Accounts Summary',
          `Report Period: ${periodLabel} • Generated on: ${dateStr}`,
          accHeaders,
          accRows,
          ['left', 'left', 'left', 'right', 'left', 'center', 'center'],
          [null, null, null, '#,##0.00', null, null, null],
          '6366F1' // Indigo
        );
        XLSX.utils.book_append_sheet(wb, wsAcc, 'Accounts Summary');

        // 2. Ledger Transactions Sheet
        const txHeaders = ['Date', 'Bank / Wallet', 'Target Bank (For Transfer)', 'Type', 'Category', 'Payee / Recipient', 'Amount', 'Description'];
        const txRows = targetTx.map(t => {
          const acc = accounts.find(a => a.id === t.bankId);
          const targetAcc = accounts.find(a => a.id === t.targetBankId);
          return [
            t.date,
            acc ? acc.bankName : 'Unknown',
            targetAcc ? targetAcc.bankName : 'N/A',
            t.type,
            t.category,
            t.payee || 'N/A',
            t.amount,
            t.description
          ];
        });
        const wsLedger = createStyledSheet(
          'MoneyMate - Ledger Transactions History',
          `Report Period: ${periodLabel} • Generated on: ${dateStr}`,
          txHeaders,
          txRows,
          ['center', 'left', 'left', 'left', 'left', 'left', 'right', 'left'],
          [null, null, null, null, null, null, '#,##0.00', null],
          '3B82F6' // Blue
        );
        XLSX.utils.book_append_sheet(wb, wsLedger, 'Ledger Transactions');

        // 3. Salary Ledger Sheet
        const salHeaders = [
          'Company', 'Employer ID', 'Position', 'Period', 'Basic Salary', 'Fixed Allowance', 
          'Other Allowance', 'Bonus', 'Overtime', 'EPF Employee (8%)', 'Tax Deduct', 
          'Loan Deduct', 'Other Deduct', 'Net Salary Pay', 'Net Allowance', 'Payment Date', 'Deposit Account Name'
        ];
        const salRows = targetSalaries.map(s => [
          s.company,
          s.employerId,
          s.position,
          `${s.month} ${s.year}`,
          s.basicSalary,
          s.fixedAllowance,
          s.otherAllowances || 0,
          s.bonus || 0,
          s.overtime || 0,
          s.epfEmployee || 0,
          s.tax || 0,
          s.loanDeduction || 0,
          s.otherDeduction || 0,
          s.netSalary || 0,
          s.netAllowance || 0,
          s.paymentDate,
          s.bankName
        ]);
        const wsSal = createStyledSheet(
          'MoneyMate - Monthly Salaries History Registry',
          `Report Period: ${periodLabel} • Generated on: ${dateStr}`,
          salHeaders,
          salRows,
          ['left', 'center', 'left', 'center', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center', 'left'],
          [null, null, null, null, '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', null, null],
          '10B981' // Teal
        );
        XLSX.utils.book_append_sheet(wb, wsSal, 'Salary Ledger');

      } else if (accountId === 'overall-salaries') {
        // Overall Monthly Salaries details
        const targetSalaries = getFilteredSalaries();
        if (targetSalaries.length === 0) {
          showToast('Salary records are empty for the active query parameters.', 'error');
          return;
        }

        const salHeaders = [
          'Company', 'Employer ID', 'Position', 'Period', 'Basic Salary', 'Fixed Allowance', 
          'Other Allowance', 'Bonus', 'Overtime', 'EPF Employee (8%)', 'Tax Deduct', 
          'Loan Deduct', 'Other Deduct', 'Net Salary Pay', 'Net Allowance', 'Payment Date', 'Deposit Account Name'
        ];
        const salRows = targetSalaries.map(s => [
          s.company,
          s.employerId,
          s.position,
          `${s.month} ${s.year}`,
          s.basicSalary,
          s.fixedAllowance,
          s.otherAllowances || 0,
          s.bonus || 0,
          s.overtime || 0,
          s.epfEmployee || 0,
          s.tax || 0,
          s.loanDeduction || 0,
          s.otherDeduction || 0,
          s.netSalary || 0,
          s.netAllowance || 0,
          s.paymentDate,
          s.bankName
        ]);
        const wsSal = createStyledSheet(
          'MoneyMate - Overall Monthly Salaries History Registry',
          `Report Period: ${periodLabel} • Generated on: ${dateStr}`,
          salHeaders,
          salRows,
          ['left', 'center', 'left', 'center', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'center', 'left'],
          [null, null, null, null, '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', '#,##0.00', null, null],
          '10B981' // Teal
        );
        XLSX.utils.book_append_sheet(wb, wsSal, 'Salary Ledger');

      } else {
        // Specific Bank Account Transactions (Passbook Statement)
        const selectedAcc = accounts.find(a => a.id === accountId);
        const accountName = selectedAcc ? `${selectedAcc.bankName} - ${selectedAcc.accountName}` : 'Unknown Account';

        const { startingBalance, periodTx, totalDebits, totalCredits } = getPassbookData(accountId, transactions, filterByDate, period, startDate);

        if (periodTx.length === 0) {
          showToast('Ledger list is empty for the active query parameters.', 'error');
          return;
        }

        const passbookHeaders = ['Date', 'Description / Payee', 'Type / Category', 'Debit (Withdrawal)', 'Credit (Deposit)', 'Balance'];
        const periodStartDate = getPeriodStartDateStr(period, startDate);
        const passbookRows = [];

        // Prepend Starting Balance
        passbookRows.push([
          periodStartDate,
          'Starting Balance',
          'Balance Forward',
          null,
          null,
          startingBalance
        ]);

        // Add Transactions
        periodTx.forEach(t => {
          const detail = t.description || t.payee || 'N/A';
          passbookRows.push([
            t.date,
            detail,
            `${t.type} / ${t.category}`,
            t.debit,
            t.credit,
            t.balanceAfter
          ]);
        });

        // Add Total Row
        passbookRows.push([
          'Total',
          'Period Debits / Credits',
          '',
          totalDebits,
          totalCredits,
          startingBalance + totalCredits - totalDebits
        ]);

        const wsLedger = createStyledSheet(
          `MoneyMate - Passbook Statement (${accountName})`,
          `Report Period: ${periodLabel} • Generated on: ${dateStr}`,
          passbookHeaders,
          passbookRows,
          ['center', 'left', 'left', 'right', 'right', 'right'],
          [null, null, null, '#,##0.00', '#,##0.00', '#,##0.00'],
          '3B82F6' // Blue
        );
        XLSX.utils.book_append_sheet(wb, wsLedger, 'Ledger Transactions');
      }

      let typeLabel = 'Overall_Financial_Summary';
      if (accountId === 'overall-salaries') {
        typeLabel = 'Overall_Monthly_Salaries_Details';
      } else if (accountId !== 'all') {
        const selectedAcc = accounts.find(a => a.id === accountId);
        typeLabel = `Bank_Statement_${selectedAcc ? selectedAcc.bankName : 'Account'}`;
      }
      const fileName = getExportFilename(typeLabel, 'xlsx');
      XLSX.writeFile(wb, fileName);
      showToast('Excel spreadsheet compiled and downloaded.');
    } catch (err) {
      console.error(err);
      showToast('Failed to compile Excel file.', 'error');
    }
  };

  // Compile PDF document
  const handleExportPDF = () => {
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
        : period.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      let accountLabel = 'All Accounts';
      if (accountId === 'overall-salaries') {
        accountLabel = 'Overall Monthly Salaries details';
      } else if (accountId !== 'all') {
        const selectedAcc = accounts.find(a => a.id === accountId);
        accountLabel = selectedAcc ? `${selectedAcc.bankName} - ${selectedAcc.accountName}` : 'Unknown Account';
      }
      
      doc.text(`Report Period: ${periodLabel} • Filter Account: ${accountLabel}`, 14, 33);
      doc.line(14, 37, 196, 37);

      if (accountId === 'all') {
        // Overall Bank Accounts Summary
        const targetTx = getFilteredTransactions();
        const targetSalaries = getFilteredSalaries();

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

      } else if (accountId === 'overall-salaries') {
        // Overall Monthly Salaries details
        const targetSalaries = getFilteredSalaries();
        if (targetSalaries.length === 0) {
          showToast('Salary records are empty for the active query parameters.', 'error');
          return;
        }

        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.text('Overall Monthly Salaries History Registry', 14, 46);

        const salaryHeaders = [['Period', 'Employer ID / Position', 'Company', 'Gross Base', 'Total Deduct', `Net Salary (${symbol})`, 'Pay Date']];
        const salaryRows = targetSalaries.map(s => {
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
          startY: 51,
          head: salaryHeaders,
          body: salaryRows,
          theme: 'striped',
          headStyles: { fillColor: [13, 148, 136], fontStyle: 'bold' },
          styles: { fontSize: 8 },
          margin: { left: 14, right: 14 }
        });

      } else {
        // Specific bank account transactions only (Passbook Statement)
        const selectedAcc = accounts.find(a => a.id === accountId);
        const accountName = selectedAcc ? `${selectedAcc.bankName} - ${selectedAcc.accountName}` : 'Unknown Account';

        const { startingBalance, periodTx, totalDebits, totalCredits, finalBalance } = getPassbookData(accountId, transactions, filterByDate, period, startDate);

        if (periodTx.length === 0) {
          showToast('Ledger list is empty for the active query parameters.', 'error');
          return;
        }

        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.text(`Passbook Statement: ${accountName}`, 14, 46);

        const periodStartDate = getPeriodStartDateStr(period, startDate);
        const passbookHeaders = [['Date', 'Description / Payee', 'Type / Category', `Debit (${symbol})`, `Credit (${symbol})`, `Balance (${symbol})`]];
        
        const passbookBody = [
          [
            periodStartDate,
            'Starting Balance',
            'Balance Forward',
            '',
            '',
            startingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
          ],
          ...periodTx.map(t => [
            t.date,
            t.description || t.payee || 'N/A',
            `${t.type} / ${t.category}`,
            t.debit ? t.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
            t.credit ? t.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '',
            t.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })
          ])
        ];

        const passbookFoot = [[
          'Total',
          'Period Debits / Credits',
          '',
          totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]];

        autoTable(doc, {
          startY: 51,
          head: passbookHeaders,
          body: passbookBody,
          foot: passbookFoot,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
          footStyles: { fillColor: [226, 232, 240], textColor: [17, 24, 39], fontStyle: 'bold' },
          styles: { fontSize: 8 },
          columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
          },
          margin: { left: 14, right: 14 }
        });
      }

      let typeLabel = 'Overall_Financial_Summary';
      if (accountId === 'overall-salaries') {
        typeLabel = 'Overall_Monthly_Salaries_Details';
      } else if (accountId !== 'all') {
        const selectedAcc = accounts.find(a => a.id === accountId);
        typeLabel = `Bank_Statement_${selectedAcc ? selectedAcc.bankName : 'Account'}`;
      }
      const fileName = getExportFilename(typeLabel, 'pdf');
      doc.save(fileName);
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
              <option value="all">Overall Bank Accounts Summary</option>
              <option value="overall-salaries">Overall Monthly Salaries details</option>
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
