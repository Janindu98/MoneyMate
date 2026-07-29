import React, { useEffect, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { formatCurrency } from '../../utils/format';
import Chart from 'chart.js/auto';

export default function Budgets() {
  const { transactions, settings } = useDatabase();
  
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Group transactions for the current month
  let monthlyIncome = 0;
  const currentMonthExpenses = [];

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      if (tx.type === 'Income' || tx.type === 'Deposit') {
        monthlyIncome += tx.amount;
      } else if (tx.type === 'Expense' || tx.type === 'Withdrawal' || tx.type === 'online payment') {
        currentMonthExpenses.push(tx);
      }
    }
  });

  // Calculate actual category spending
  let foodSpent = 0;
  let fuelSpent = 0;
  let billsSpent = 0;
  let shoppingSpent = 0;
  let transportSpent = 0;
  let othersSpent = 0;

  currentMonthExpenses.forEach(tx => {
    const category = tx.category.toLowerCase();
    
    if (category.includes('food') || category.includes('dining')) {
      foodSpent += tx.amount;
    } else if (category.includes('fuel') || category.includes('petrol')) {
      fuelSpent += tx.amount;
    } else if (category.includes('bill') || category.includes('network') || category.includes('utility') || category.includes('wifi') || category.includes('tv') || category.includes('mobile')) {
      billsSpent += tx.amount;
    } else if (category.includes('shopping')) {
      shoppingSpent += tx.amount;
    } else if (category.includes('transport') || category.includes('commute')) {
      transportSpent += tx.amount;
    } else {
      othersSpent += tx.amount;
    }
  });

  const totalExpense = foodSpent + fuelSpent + billsSpent + shoppingSpent + transportSpent + othersSpent;
  const monthlySavings = Math.max(0, monthlyIncome - totalExpense);

  // Target percentages (User Specs)
  const budgetRatios = {
    Food: 0.35,
    Fuel: 0.20,
    Bills: 0.18,
    Shopping: 0.15,
    Others: 0.12
  };

  // Scorecard compilation (dynamic limits are based on monthly income, defaults to a baseline of 100,000 LKR if income is 0)
  const baseIncomeForLimits = monthlyIncome > 0 ? monthlyIncome : 100000;
  const scorecard = [
    { name: 'Food', targetPct: 35, actualAmt: foodSpent, targetAmt: baseIncomeForLimits * budgetRatios.Food },
    { name: 'Fuel', targetPct: 20, actualAmt: fuelSpent, targetAmt: baseIncomeForLimits * budgetRatios.Fuel },
    { name: 'Bills (Inc. Network)', targetPct: 18, actualAmt: billsSpent, targetAmt: baseIncomeForLimits * budgetRatios.Bills },
    { name: 'Shopping', targetPct: 15, actualAmt: shoppingSpent, targetAmt: baseIncomeForLimits * budgetRatios.Shopping },
    { name: 'Others', targetPct: 12, actualAmt: othersSpent, targetAmt: baseIncomeForLimits * budgetRatios.Others },
    { name: 'Transportations', targetPct: 0, actualAmt: transportSpent, targetAmt: 0 } // no target specified, show actuals
  ];

  // 2. Multi-month aggregates for Income vs Expenses Bar Chart (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsData = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsData.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`,
      income: 0,
      expense: 0,
      savings: 0
    });
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const match = monthsData.find(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
    if (match) {
      if (tx.type === 'Income' || tx.type === 'Deposit') {
        match.income += tx.amount;
      } else if (tx.type === 'Expense' || tx.type === 'Withdrawal' || tx.type === 'online payment') {
        match.expense += tx.amount;
      }
    }
  });

  monthsData.forEach(m => {
    m.savings = Math.max(0, m.income - m.expense);
  });

  // Chart rendering effects
  useEffect(() => {
    // 1. Render Pie Chart
    const pieCtx = pieChartRef.current.getContext('2d');
    const hasExpenseData = totalExpense > 0;
    
    const pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: hasExpenseData 
          ? ['Food', 'Fuel', 'Bills (Inc. Network)', 'Shopping', 'Others', 'Transportations'] 
          : ['No expense logged'],
        datasets: [{
          data: hasExpenseData 
            ? [foodSpent, fuelSpent, billsSpent, shoppingSpent, othersSpent, transportSpent] 
            : [1],
          backgroundColor: hasExpenseData 
            ? ['#ec4899', '#f97316', '#3b82f6', '#7c3aed', '#64748b', '#14b8a6'] 
            : ['rgba(255, 255, 255, 0.05)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });

    // 2. Render Bar Chart MoM
    const barCtx = barChartRef.current.getContext('2d');
    const barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: monthsData.map(m => m.label),
        datasets: [
          {
            label: 'Income',
            data: monthsData.map(m => m.income),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderRadius: 5
          },
          {
            label: 'Expenses',
            data: monthsData.map(m => m.expense),
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderRadius: 5
          },
          {
            label: 'Savings',
            data: monthsData.map(m => m.savings),
            backgroundColor: 'rgba(99, 102, 241, 0.85)',
            borderRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
        }
      }
    });

    return () => {
      pieChart.destroy();
      barChart.destroy();
    };
  }, [transactions, totalExpense, foodSpent, fuelSpent, billsSpent, shoppingSpent, othersSpent, transportSpent, monthsData]);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Expense Analysis & Budgets</h1>
          <p>Diagnostic category charts compared against target ratios.</p>
        </div>
      </div>

      <div className="charts-grid">
        {/* Category breakdown pie */}
        <div className="panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Monthly Expense Distribution</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Current month breakdown relative to LKR values.
          </p>
          <div className="chart-wrapper">
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>

        {/* Budget comparison scorecard */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Budget Scorecard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Comparing actual LKR expenses against target thresholds.
          </p>
          
          <div className="table-container" style={{ flexGrow: 1 }}>
            <table style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Target (%)</th>
                  <th>Limit (Rs.)</th>
                  <th>Actual (Rs.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scorecard.map(item => {
                  const exceeded = item.targetAmt > 0 && item.actualAmt > item.targetAmt;
                  const shareVal = totalExpense > 0 ? (item.actualAmt / totalExpense) * 100 : 0;
                  
                  return (
                    <tr key={item.name}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.targetPct > 0 ? `${item.targetPct}%` : 'N/A'}</td>
                      <td>{item.targetAmt > 0 ? formatCurrency(item.targetAmt, settings.currency) : 'No Limit'}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{formatCurrency(item.actualAmt, settings.currency)}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{shareVal.toFixed(1)}% of total</div>
                      </td>
                      <td>
                        {item.targetAmt === 0 && item.actualAmt > 0 ? (
                          <span className="badge badge-pending">No Target</span>
                        ) : exceeded ? (
                          <span className="badge badge-expense">Exceeded</span>
                        ) : (
                          <span className="badge badge-income">Within limit</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MoM trend double lines comparison */}
      <div className="panel">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Monthly Income vs. Expenses vs. Savings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Six-month bar representation of money flows.
        </p>
        <div className="chart-wrapper" style={{ height: '350px' }}>
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
