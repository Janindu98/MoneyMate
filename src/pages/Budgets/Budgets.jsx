import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { formatCurrency } from '../../utils/format';
import Chart from 'chart.js/auto';
import Modal from '../../components/Modal';

export default function Budgets() {
  const { transactions, settings, updateSettings } = useDatabase();
  
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  // Target limits (User Specs)
  const budgetLimits = settings?.budgetLimits || {
    Food: 35000,
    Fuel: 20000,
    Bills: 18000,
    Shopping: 15000,
    Others: 12000,
    Transportations: 5000
  };

  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [limitFood, setLimitFood] = useState(budgetLimits.Food);
  const [limitFuel, setLimitFuel] = useState(budgetLimits.Fuel);
  const [limitBills, setLimitBills] = useState(budgetLimits.Bills);
  const [limitShopping, setLimitShopping] = useState(budgetLimits.Shopping);
  const [limitOthers, setLimitOthers] = useState(budgetLimits.Others);
  const [limitTransport, setLimitTransport] = useState(budgetLimits.Transportations);

  // Sync state if settings load later
  useEffect(() => {
    if (settings?.budgetLimits) {
      setLimitFood(settings.budgetLimits.Food);
      setLimitFuel(settings.budgetLimits.Fuel);
      setLimitBills(settings.budgetLimits.Bills);
      setLimitShopping(settings.budgetLimits.Shopping);
      setLimitOthers(settings.budgetLimits.Others);
      setLimitTransport(settings.budgetLimits.Transportations);
    }
  }, [settings]);

  const handleSaveLimits = (e) => {
    e.preventDefault();
    updateSettings({
      budgetLimits: {
        Food: parseFloat(limitFood) || 0,
        Fuel: parseFloat(limitFuel) || 0,
        Bills: parseFloat(limitBills) || 0,
        Shopping: parseFloat(limitShopping) || 0,
        Others: parseFloat(limitOthers) || 0,
        Transportations: parseFloat(limitTransport) || 0
      }
    });
    setIsLimitsModalOpen(false);
  };

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
    { name: 'Food', targetPct: Math.round((budgetLimits.Food / baseIncomeForLimits) * 100), actualAmt: foodSpent, targetAmt: budgetLimits.Food },
    { name: 'Fuel', targetPct: Math.round((budgetLimits.Fuel / baseIncomeForLimits) * 100), actualAmt: fuelSpent, targetAmt: budgetLimits.Fuel },
    { name: 'Bills (Inc. Network)', targetPct: Math.round((budgetLimits.Bills / baseIncomeForLimits) * 100), actualAmt: billsSpent, targetAmt: budgetLimits.Bills },
    { name: 'Shopping', targetPct: Math.round((budgetLimits.Shopping / baseIncomeForLimits) * 100), actualAmt: shoppingSpent, targetAmt: budgetLimits.Shopping },
    { name: 'Others', targetPct: Math.round((budgetLimits.Others / baseIncomeForLimits) * 100), actualAmt: othersSpent, targetAmt: budgetLimits.Others },
    { name: 'Transportations', targetPct: Math.round((budgetLimits.Transportations / baseIncomeForLimits) * 100), actualAmt: transportSpent, targetAmt: budgetLimits.Transportations }
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

    // Calculate category percentages
    const foodPct = totalExpense > 0 ? ((foodSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const fuelPct = totalExpense > 0 ? ((fuelSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const billsPct = totalExpense > 0 ? ((billsSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const shoppingPct = totalExpense > 0 ? ((shoppingSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const othersPct = totalExpense > 0 ? ((othersSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const transportPct = totalExpense > 0 ? ((transportSpent / totalExpense) * 100).toFixed(1) : '0.0';
    
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: (chart) => {
        const { ctx } = chart;
        const width = chart.width;
        const height = chart.height;
        ctx.save();
        
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = settings.theme === 'light' ? '#64748b' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const chartArea = chart.chartArea;
        const centerX = chartArea ? (chartArea.left + chartArea.right) / 2 : width / 2;
        const centerY = chartArea ? (chartArea.top + chartArea.bottom) / 2 : height / 2;
        
        ctx.fillText('TOTAL EXPENSES', centerX, centerY - 10);

        ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = settings.theme === 'light' ? '#0f172a' : '#f8fafc';
        ctx.fillText(formatCurrency(totalExpense, settings.currency), centerX, centerY + 10);
        ctx.restore();
      }
    };

    const pieChart = new Chart(pieCtx, {
      type: 'doughnut',
      data: {
        labels: hasExpenseData 
          ? [
              `Food (${foodPct}%)`,
              `Fuel (${fuelPct}%)`,
              `Bills (Inc. Network) (${billsPct}%)`,
              `Shopping (${shoppingPct}%)`,
              `Others (${othersPct}%)`,
              `Transportations (${transportPct}%)`
            ]
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
      plugins: [centerTextPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: { 
              color: settings.theme === 'light' ? '#475569' : '#94a3b8', 
              font: { family: 'Plus Jakarta Sans', size: 11 } 
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                return ` ${formatCurrency(val, settings.currency)}`;
              }
            }
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
            labels: { 
              color: settings.theme === 'light' ? '#475569' : '#94a3b8', 
              font: { family: 'Plus Jakarta Sans' } 
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { color: settings.theme === 'light' ? '#475569' : '#64748b' } 
          },
          y: { 
            grid: { color: settings.theme === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: settings.theme === 'light' ? '#475569' : '#64748b' } 
          }
        }
      }
    });

    return () => {
      pieChart.destroy();
      barChart.destroy();
    };
  }, [transactions, settings.theme, settings.currency, totalExpense, foodSpent, fuelSpent, billsSpent, shoppingSpent, othersSpent, transportSpent]);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Budget Scorecard</h2>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsLimitsModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Configure Limits
            </button>
          </div>
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

      {/* MODAL: CONFIGURE BUDGET LIMITS */}
      <Modal isOpen={isLimitsModalOpen} onClose={() => setIsLimitsModalOpen(false)} title="Configure Budget Limits">
        <form onSubmit={handleSaveLimits}>
          <div className="modal-body">
            <div className="form-row-2">
              <div className="form-group">
                <label>Food Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitFood} 
                  onChange={e => setLimitFood(e.target.value)} 
                  placeholder="35000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Fuel Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitFuel} 
                  onChange={e => setLimitFuel(e.target.value)} 
                  placeholder="20000" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Bills (Inc. Network) Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitBills} 
                  onChange={e => setLimitBills(e.target.value)} 
                  placeholder="18000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Shopping Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitShopping} 
                  onChange={e => setLimitShopping(e.target.value)} 
                  placeholder="15000" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Others Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitOthers} 
                  onChange={e => setLimitOthers(e.target.value)} 
                  placeholder="12000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Transportations Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitTransport} 
                  onChange={e => setLimitTransport(e.target.value)} 
                  placeholder="5000" 
                  min="0"
                  required 
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsLimitsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Limits</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
