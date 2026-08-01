import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { formatCurrency } from '../../utils/format';
import Chart from 'chart.js/auto';
import Modal from '../../components/Modal';

export default function Budgets() {
  const { transactions, settings, updateSettings } = useDatabase();

  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  // Target limits (User Specs for Expenses)
  const budgetLimits = settings?.budgetLimits || {
    FoodDining: 20000,
    Groceries: 15000,
    Transportation: 5000,
    Fuel: 20000,
    HealthcareMedical: 10000,
    Shopping: 15000,
    Education: 10000,
    Others: 12000
  };

  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [limitFoodDining, setLimitFoodDining] = useState(budgetLimits.FoodDining || 20000);
  const [limitGroceries, setLimitGroceries] = useState(budgetLimits.Groceries || 15000);
  const [limitTransportation, setLimitTransportation] = useState(budgetLimits.Transportation || 5000);
  const [limitFuel, setLimitFuel] = useState(budgetLimits.Fuel || 20000);
  const [limitHealthcareMedical, setLimitHealthcareMedical] = useState(budgetLimits.HealthcareMedical || 10000);
  const [limitShopping, setLimitShopping] = useState(budgetLimits.Shopping || 15000);
  const [limitEducation, setLimitEducation] = useState(budgetLimits.Education || 10000);
  const [limitOthers, setLimitOthers] = useState(budgetLimits.Others || 12000);

  // Sync state if settings load later
  useEffect(() => {
    if (settings?.budgetLimits) {
      setLimitFoodDining(settings.budgetLimits.FoodDining || 0);
      setLimitGroceries(settings.budgetLimits.Groceries || 0);
      setLimitTransportation(settings.budgetLimits.Transportation || 0);
      setLimitFuel(settings.budgetLimits.Fuel || 0);
      setLimitHealthcareMedical(settings.budgetLimits.HealthcareMedical || 0);
      setLimitShopping(settings.budgetLimits.Shopping || 0);
      setLimitEducation(settings.budgetLimits.Education || 0);
      setLimitOthers(settings.budgetLimits.Others || 0);
    }
  }, [settings]);

  const handleSaveLimits = (e) => {
    e.preventDefault();
    updateSettings({
      budgetLimits: {
        FoodDining: parseFloat(limitFoodDining) || 0,
        Groceries: parseFloat(limitGroceries) || 0,
        Transportation: parseFloat(limitTransportation) || 0,
        Fuel: parseFloat(limitFuel) || 0,
        HealthcareMedical: parseFloat(limitHealthcareMedical) || 0,
        Shopping: parseFloat(limitShopping) || 0,
        Education: parseFloat(limitEducation) || 0,
        Others: parseFloat(limitOthers) || 0
      }
    });
    setIsLimitsModalOpen(false);
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = selectedMonth;
  const currentYear = selectedYear;

  // 1. Group transactions for the current month
  let monthlyIncome = 0;
  const currentMonthExpenses = [];

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      if (tx.type === 'Income' || tx.type === 'Deposit') {
        monthlyIncome += tx.amount;
      } else if (tx.type === 'Expense' || tx.type === 'Withdrawal' || tx.type === 'online payment' || tx.type === 'Online Payment' || tx.type === 'Bill & Payment') {
        currentMonthExpenses.push(tx);
      }
    }
  });

  // Calculate actual category spending
  let foodDiningSpent = 0;
  let groceriesSpent = 0;
  let transportationSpent = 0;
  let fuelSpent = 0;
  let healthcareMedicalSpent = 0;
  let shoppingSpent = 0;
  let educationSpent = 0;
  let othersSpent = 0;

  currentMonthExpenses.forEach(tx => {
    const category = tx.category.toLowerCase();

    if (category.includes('food & dining') || category === 'food' || category === 'dining' || category === 'food & dining') {
      foodDiningSpent += tx.amount;
    } else if (category.includes('groceries')) {
      groceriesSpent += tx.amount;
    } else if (category.includes('transportation') || category === 'transport' || category === 'transportations') {
      transportationSpent += tx.amount;
    } else if (category.includes('fuel')) {
      fuelSpent += tx.amount;
    } else if (category.includes('healthcare & medical') || category.includes('healthcare') || category.includes('medical') || category.includes('medicine') || category.includes('pharmacy')) {
      healthcareMedicalSpent += tx.amount;
    } else if (category.includes('shopping')) {
      shoppingSpent += tx.amount;
    } else if (category.includes('education')) {
      educationSpent += tx.amount;
    } else {
      othersSpent += tx.amount;
    }
  });

  const totalExpense = foodDiningSpent + groceriesSpent + transportationSpent + fuelSpent + healthcareMedicalSpent + shoppingSpent + educationSpent + othersSpent;
  const monthlySavings = Math.max(0, monthlyIncome - totalExpense);

  const baseIncomeForLimits = monthlyIncome > 0 ? monthlyIncome : 100000;

  const scorecard = [
    { name: 'Food & Dining', targetPct: Math.round((limitFoodDining / baseIncomeForLimits) * 100), actualAmt: foodDiningSpent, targetAmt: limitFoodDining },
    { name: 'Groceries', targetPct: Math.round((limitGroceries / baseIncomeForLimits) * 100), actualAmt: groceriesSpent, targetAmt: limitGroceries },
    { name: 'Transportation', targetPct: Math.round((limitTransportation / baseIncomeForLimits) * 100), actualAmt: transportationSpent, targetAmt: limitTransportation },
    { name: 'Fuel', targetPct: Math.round((limitFuel / baseIncomeForLimits) * 100), actualAmt: fuelSpent, targetAmt: limitFuel },
    { name: 'Healthcare & Medical', targetPct: Math.round((limitHealthcareMedical / baseIncomeForLimits) * 100), actualAmt: healthcareMedicalSpent, targetAmt: limitHealthcareMedical },
    { name: 'Shopping', targetPct: Math.round((limitShopping / baseIncomeForLimits) * 100), actualAmt: shoppingSpent, targetAmt: limitShopping },
    { name: 'Education', targetPct: Math.round((limitEducation / baseIncomeForLimits) * 100), actualAmt: educationSpent, targetAmt: limitEducation },
    { name: 'Others', targetPct: 0, actualAmt: othersSpent, targetAmt: limitOthers }
  ];

  // 2. Multi-month aggregates for Income vs Expenses Bar Chart (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - i, 1);
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
      } else if (tx.type === 'Expense' || tx.type === 'Withdrawal' || tx.type === 'online payment' || tx.type === 'Online Payment' || tx.type === 'Bill & Payment') {
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
    const foodDiningPct = totalExpense > 0 ? ((foodDiningSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const groceriesPct = totalExpense > 0 ? ((groceriesSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const transportationPct = totalExpense > 0 ? ((transportationSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const fuelPct = totalExpense > 0 ? ((fuelSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const healthcareMedicalPct = totalExpense > 0 ? ((healthcareMedicalSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const shoppingPct = totalExpense > 0 ? ((shoppingSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const educationPct = totalExpense > 0 ? ((educationSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const othersPct = totalExpense > 0 ? ((othersSpent / totalExpense) * 100).toFixed(1) : '0.0';

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
            `Food & Dining (${foodDiningPct}%)`,
            `Groceries (${groceriesPct}%)`,
            `Transportation (${transportationPct}%)`,
            `Fuel (${fuelPct}%)`,
            `Healthcare & Medical (${healthcareMedicalPct}%)`,
            `Shopping (${shoppingPct}%)`,
            `Education (${educationPct}%)`,
            `Others (${othersPct}%)`
          ]
          : ['No expense logged'],
        datasets: [{
          data: hasExpenseData
            ? [foodDiningSpent, groceriesSpent, transportationSpent, fuelSpent, healthcareMedicalSpent, shoppingSpent, educationSpent, othersSpent]
            : [1],
          backgroundColor: hasExpenseData
            ? ['#ec4899', '#10b981', '#06b6d4', '#f59e0b', '#3b82f6', '#7c3aed', '#db2777', '#64748b']
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
              font: { family: 'Plus Jakarta Sans', size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
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
            backgroundColor: '#10b981',
            borderRadius: 4
          },
          {
            label: 'Expenses',
            data: monthsData.map(m => m.expense),
            backgroundColor: '#ef4444',
            borderRadius: 4
          },
          {
            label: 'Savings',
            data: monthsData.map(m => m.savings),
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: settings.theme === 'light' ? '#475569' : '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          }
        },
        scales: {
          x: {
            ticks: { color: settings.theme === 'light' ? '#475569' : '#94a3b8' },
            grid: { color: settings.theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }
          },
          y: {
            ticks: { color: settings.theme === 'light' ? '#475569' : '#94a3b8' },
            grid: { color: settings.theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });

    return () => {
      pieChart.destroy();
      barChart.destroy();
    };
  }, [transactions, settings.theme, settings.currency, totalExpense, foodDiningSpent, groceriesSpent, transportationSpent, fuelSpent, healthcareMedicalSpent, shoppingSpent, educationSpent, othersSpent, selectedMonth, selectedYear]);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Expense Analysis & Budgets</h1>
          <p>Diagnostic category charts compared against target ratios.</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Period:</span>
            <select
              className="input-ctrl"
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.85rem' }}
            >
              {monthsList.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              className="input-ctrl"
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
              style={{ width: '80px', padding: '6px 10px', fontSize: '0.85rem' }}
              min="2000"
              max="2100"
            />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Budget comparison scorecard - LEFT SIDE */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Budget Scorecard</h2>
            <button
              className="btn btn-primary"
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

        {/* Category breakdown pie - RIGHT SIDE */}
        <div className="panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Monthly Expense Distribution</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Current month breakdown relative to LKR values.
          </p>
          <div className="chart-wrapper" style={{ height: '330px' }}>
            <canvas ref={pieChartRef}></canvas>
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
                <label>Food & Dining Limit (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={limitFoodDining}
                  onChange={e => setLimitFoodDining(e.target.value)}
                  placeholder="20000"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Groceries Limit (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={limitGroceries}
                  onChange={e => setLimitGroceries(e.target.value)}
                  placeholder="15000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Transportation Limit (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={limitTransportation}
                  onChange={e => setLimitTransportation(e.target.value)}
                  placeholder="5000"
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
                <label>Healthcare & Medical Limit (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={limitHealthcareMedical}
                  onChange={e => setLimitHealthcareMedical(e.target.value)}
                  placeholder="10000"
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
                <label>Education Limit (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={limitEducation}
                  onChange={e => setLimitEducation(e.target.value)}
                  placeholder="10000"
                  min="0"
                  required
                />
              </div>
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
