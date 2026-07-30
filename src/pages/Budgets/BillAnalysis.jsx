import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { formatCurrency } from '../../utils/format';
import Chart from 'chart.js/auto';
import Modal from '../../components/Modal';

export default function BillAnalysis() {
  const { transactions, settings, updateSettings } = useDatabase();
  
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Target limits (User Specs for Bills)
  const billLimits = settings?.billLimits || {
    Electricity: 8000,
    Water: 2000,
    Internet: 5000,
    Mobile: 3000,
    Insurance: 15000,
    CreditCards: 25000,
    Rent: 45000
  };

  const [isLimitsModalOpen, setIsLimitsModalOpen] = useState(false);
  const [limitElectricity, setLimitElectricity] = useState(billLimits.Electricity);
  const [limitWater, setLimitWater] = useState(billLimits.Water);
  const [limitInternet, setLimitInternet] = useState(billLimits.Internet);
  const [limitMobile, setLimitMobile] = useState(billLimits.Mobile);
  const [limitInsurance, setLimitInsurance] = useState(billLimits.Insurance);
  const [limitCreditCards, setLimitCreditCards] = useState(billLimits.CreditCards);
  const [limitRent, setLimitRent] = useState(billLimits.Rent);

  // Sync state if settings load later
  useEffect(() => {
    if (settings?.billLimits) {
      setLimitElectricity(settings.billLimits.Electricity || 0);
      setLimitWater(settings.billLimits.Water || 0);
      setLimitInternet(settings.billLimits.Internet || 0);
      setLimitMobile(settings.billLimits.Mobile || 0);
      setLimitInsurance(settings.billLimits.Insurance || 0);
      setLimitCreditCards(settings.billLimits.CreditCards || 0);
      setLimitRent(settings.billLimits.Rent || 0);
    }
  }, [settings]);

  const handleSaveLimits = (e) => {
    e.preventDefault();
    updateSettings({
      billLimits: {
        Electricity: parseFloat(limitElectricity) || 0,
        Water: parseFloat(limitWater) || 0,
        Internet: parseFloat(limitInternet) || 0,
        Mobile: parseFloat(limitMobile) || 0,
        Insurance: parseFloat(limitInsurance) || 0,
        CreditCards: parseFloat(limitCreditCards) || 0,
        Rent: parseFloat(limitRent) || 0
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
      } else if (tx.type === 'Bill & Payment') {
        currentMonthExpenses.push(tx);
      }
    }
  });

  // Calculate actual category spending
  let electricitySpent = 0;
  let waterSpent = 0;
  let internetSpent = 0;
  let mobileSpent = 0;
  let insuranceSpent = 0;
  let creditCardsSpent = 0;
  let rentSpent = 0;
  let othersSpent = 0;

  currentMonthExpenses.forEach(tx => {
    const category = tx.category.toLowerCase();
    
    if (category.includes('electricity') || category.includes('power') || category.includes('ceb') || category.includes('leco')) {
      electricitySpent += tx.amount;
    } else if (category.includes('water') || category.includes('nwsdb') || category.includes('h2o')) {
      waterSpent += tx.amount;
    } else if (category.includes('internet') || category.includes('wifi') || category.includes('slt') || category.includes('dialog home') || category.includes('broadband')) {
      internetSpent += tx.amount;
    } else if (category.includes('mobile') || category.includes('phone') || category.includes('sim') || category.includes('reload') || category.includes('telecom')) {
      mobileSpent += tx.amount;
    } else if (category.includes('insurance') || category.includes('lic') || category.includes('premium')) {
      insuranceSpent += tx.amount;
    } else if (category.includes('credit card') || category.includes('card payment') || category.includes('credit') || category.includes('mastercard') || category.includes('visa')) {
      creditCardsSpent += tx.amount;
    } else if (category.includes('rent') || category.includes('lease') || category.includes('boarding')) {
      rentSpent += tx.amount;
    } else {
      othersSpent += tx.amount;
    }
  });

  const totalExpense = electricitySpent + waterSpent + internetSpent + mobileSpent + insuranceSpent + creditCardsSpent + rentSpent + othersSpent;
  const baseIncomeForLimits = monthlyIncome > 0 ? monthlyIncome : 100000;
  
  const scorecard = [
    { name: 'Electricity', targetPct: Math.round((limitElectricity / baseIncomeForLimits) * 100), actualAmt: electricitySpent, targetAmt: limitElectricity },
    { name: 'Water', targetPct: Math.round((limitWater / baseIncomeForLimits) * 100), actualAmt: waterSpent, targetAmt: limitWater },
    { name: 'Internet', targetPct: Math.round((limitInternet / baseIncomeForLimits) * 100), actualAmt: internetSpent, targetAmt: limitInternet },
    { name: 'Mobile phone', targetPct: Math.round((limitMobile / baseIncomeForLimits) * 100), actualAmt: mobileSpent, targetAmt: limitMobile },
    { name: 'Insurance', targetPct: Math.round((limitInsurance / baseIncomeForLimits) * 100), actualAmt: insuranceSpent, targetAmt: limitInsurance },
    { name: 'Credit cards', targetPct: Math.round((limitCreditCards / baseIncomeForLimits) * 100), actualAmt: creditCardsSpent, targetAmt: limitCreditCards },
    { name: 'Rent', targetPct: Math.round((limitRent / baseIncomeForLimits) * 100), actualAmt: rentSpent, targetAmt: limitRent },
    { name: 'Others', targetPct: 0, actualAmt: othersSpent, targetAmt: 0 }
  ];

  // 2. Multi-month aggregates for Line Chart (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsData = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsData.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`,
      electricity: 0,
      water: 0,
      internet: 0,
      mobile: 0,
      insurance: 0,
      creditCards: 0,
      rent: 0
    });
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const match = monthsData.find(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
    if (match && tx.type === 'Bill & Payment') {
      const category = tx.category.toLowerCase();
      if (category.includes('electricity') || category.includes('power') || category.includes('ceb')) {
        match.electricity += tx.amount;
      } else if (category.includes('water') || category.includes('nwsdb')) {
        match.water += tx.amount;
      } else if (category.includes('internet') || category.includes('wifi') || category.includes('slt')) {
        match.internet += tx.amount;
      } else if (category.includes('mobile') || category.includes('phone') || category.includes('dialog')) {
        match.mobile += tx.amount;
      } else if (category.includes('insurance')) {
        match.insurance += tx.amount;
      } else if (category.includes('credit card') || category.includes('mastercard') || category.includes('visa')) {
        match.creditCards += tx.amount;
      } else if (category.includes('rent') || category.includes('lease')) {
        match.rent += tx.amount;
      }
    }
  });

  // Chart rendering effects
  useEffect(() => {
    // 1. Render Pie Chart
    const pieCtx = pieChartRef.current.getContext('2d');
    const hasExpenseData = totalExpense > 0;

    // Calculate category percentages
    const electPct = totalExpense > 0 ? ((electricitySpent / totalExpense) * 100).toFixed(1) : '0.0';
    const waterPct = totalExpense > 0 ? ((waterSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const internetPct = totalExpense > 0 ? ((internetSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const mobilePct = totalExpense > 0 ? ((mobileSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const insurancePct = totalExpense > 0 ? ((insuranceSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const cardsPct = totalExpense > 0 ? ((creditCardsSpent / totalExpense) * 100).toFixed(1) : '0.0';
    const rentPct = totalExpense > 0 ? ((rentSpent / totalExpense) * 100).toFixed(1) : '0.0';
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
        
        ctx.fillText('TOTAL BILLS', centerX, centerY - 10);

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
              `Electricity (${electPct}%)`,
              `Water (${waterPct}%)`,
              `Internet (${internetPct}%)`,
              `Mobile phone (${mobilePct}%)`,
              `Insurance (${insurancePct}%)`,
              `Credit cards (${cardsPct}%)`,
              `Rent (${rentPct}%)`,
              `Others (${othersPct}%)`
            ]
          : ['No bills logged'],
        datasets: [{
          data: hasExpenseData 
            ? [electricitySpent, waterSpent, internetSpent, mobileSpent, insuranceSpent, creditCardsSpent, rentSpent, othersSpent] 
            : [1],
          backgroundColor: hasExpenseData 
            ? ['#ef4444', '#06b6d4', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'] 
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
              label: function(context) {
                const val = context.raw || 0;
                return ` ${formatCurrency(val, settings.currency)}`;
              }
            }
          }
        }
      }
    });

    // 2. Render MoM Billing line chart
    const lineCtx = lineChartRef.current.getContext('2d');
    const lineChart = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: monthsData.map(m => m.label),
        datasets: [
          {
            label: 'Electricity',
            data: monthsData.map(m => m.electricity),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Water',
            data: monthsData.map(m => m.water),
            borderColor: '#06b6d4',
            backgroundColor: 'transparent',
            tension: 0.3
          },
          {
            label: 'Internet',
            data: monthsData.map(m => m.internet),
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            tension: 0.3
          },
          {
            label: 'Mobile phone',
            data: monthsData.map(m => m.mobile),
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            tension: 0.3
          },
          {
            label: 'Insurance',
            data: monthsData.map(m => m.insurance),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.3
          },
          {
            label: 'Credit cards',
            data: monthsData.map(m => m.creditCards),
            borderColor: '#8b5cf6',
            backgroundColor: 'transparent',
            tension: 0.3
          },
          {
            label: 'Rent',
            data: monthsData.map(m => m.rent),
            borderColor: '#ec4899',
            backgroundColor: 'transparent',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: settings.theme === 'light' ? '#475569' : '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
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
      lineChart.destroy();
    };
  }, [transactions, settings.theme, settings.currency, totalExpense, electricitySpent, waterSpent, internetSpent, mobileSpent, insuranceSpent, creditCardsSpent, rentSpent, othersSpent]);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Bill & Payment Analysis</h1>
          <p>Analyze utility payments, lease rent, credit cards, and insurance costs against targets.</p>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        {/* Budget comparison scorecard - LEFT SIDE */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bill Scorecard</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => setIsLimitsModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Configure Limits
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Comparing actual LKR utility costs against target thresholds.
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Monthly Bill Distribution</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Current month breakdown relative to LKR values.
          </p>
          <div className="chart-wrapper" style={{ height: '330px' }}>
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* MoM billing trends line chart */}
      <div className="panel">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Month-over-Month Billing Cost Trends</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Six-month category line visualization of bills progression.
        </p>
        <div className="chart-wrapper" style={{ height: '350px' }}>
          <canvas ref={lineChartRef}></canvas>
        </div>
      </div>

      {/* MODAL: CONFIGURE BILL LIMITS */}
      <Modal isOpen={isLimitsModalOpen} onClose={() => setIsLimitsModalOpen(false)} title="Configure Bill Limits">
        <form onSubmit={handleSaveLimits}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Electricity Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitElectricity} 
                  onChange={e => setLimitElectricity(e.target.value)} 
                  placeholder="8000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Water Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitWater} 
                  onChange={e => setLimitWater(e.target.value)} 
                  placeholder="2000" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Internet Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitInternet} 
                  onChange={e => setLimitInternet(e.target.value)} 
                  placeholder="5000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mobile phone Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitMobile} 
                  onChange={e => setLimitMobile(e.target.value)} 
                  placeholder="3000" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Insurance Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitInsurance} 
                  onChange={e => setLimitInsurance(e.target.value)} 
                  placeholder="15000" 
                  min="0"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Credit cards Limit (Rs.)</label>
                <input 
                  type="number" 
                  className="input-ctrl" 
                  value={limitCreditCards} 
                  onChange={e => setLimitCreditCards(e.target.value)} 
                  placeholder="25000" 
                  min="0"
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '10px' }}>
              <label>Rent Limit (Rs.)</label>
              <input 
                type="number" 
                className="input-ctrl" 
                value={limitRent} 
                onChange={e => setLimitRent(e.target.value)} 
                placeholder="45000" 
                min="0"
                required 
              />
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
