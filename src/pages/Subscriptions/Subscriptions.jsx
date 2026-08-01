import React, { useState, useEffect, useRef } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { formatCurrency } from '../../utils/format';
import Modal from '../../components/Modal';
import Chart from 'chart.js/auto';

export default function Subscriptions() {
  const { subscriptions, addSubscription, editSubscription, deleteSubscription, accounts, settings } = useDatabase();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // Form Fields
  const [name, setName] = useState('Netflix');
  const [customName, setCustomName] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState('');

  // Chart State & Ref
  const chartRef = useRef(null);
  const [chartFilter, setChartFilter] = useState('Monthly');

  const subscriptionPresets = [
    'Netflix',
    'YouTube Premium',
    'Spotify',
    'Apple Music',
    'Google One',
    'Microsoft 365',
    'Adobe Creative Cloud',
    'Grammarly Premium',
    'Claude Pro',
    'Custom'
  ];

  // Calculate statistics
  let activeMonthlyTotal = 0;
  let activeYearlyTotal = 0;
  let activeCount = 0;

  subscriptions.forEach(sub => {
    if (sub.status === 'Active') {
      activeCount++;
      const val = parseFloat(sub.cost) || 0;
      if (sub.billingCycle === 'Monthly') {
        activeMonthlyTotal += val;
        activeYearlyTotal += (val * 12);
      } else {
        activeMonthlyTotal += (val / 12);
        activeYearlyTotal += val;
      }
    }
  });

  const handleOpenAddModal = () => {
    setModalMode('add');
    setName('Netflix');
    setCustomName('');
    setCost('');
    setBillingCycle('Monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setBankAccountId(accounts[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setModalMode('edit');
    setEditingId(sub.id);
    if (subscriptionPresets.includes(sub.name)) {
      setName(sub.name);
      setCustomName('');
    } else {
      setName('Custom');
      setCustomName(sub.name);
    }
    setCost(sub.cost);
    setBillingCycle(sub.billingCycle);
    setStartDate(sub.startDate);
    setBankAccountId(sub.bankAccountId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cost || parseFloat(cost) <= 0) {
      showToast('Please enter a valid billing cost.', 'error');
      return;
    }

    const finalName = name === 'Custom' ? customName.trim() : name;
    if (!finalName) {
      showToast('Please enter subscription name.', 'error');
      return;
    }

    const existing = modalMode === 'edit' ? subscriptions.find(s => s.id === editingId) : null;
    const payload = {
      name: finalName,
      cost: parseFloat(cost),
      billingCycle,
      startDate,
      bankAccountId,
      status: existing ? existing.status : 'Active',
      nextRenewalDate: existing && existing.startDate === startDate ? existing.nextRenewalDate : startDate
    };

    if (modalMode === 'add') {
      addSubscription(payload);
      showToast(`Subscription "${finalName}" added successfully.`);
    } else {
      editSubscription(editingId, payload);
      showToast(`Subscription "${finalName}" updated successfully.`);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (sub) => {
    const nextStatus = sub.status === 'Active' ? 'Cancelled' : 'Active';
    editSubscription(sub.id, { status: nextStatus });
    showToast(`Subscription "${sub.name}" marked as ${nextStatus === 'Active' ? 'active' : 'cancelled'}.`);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete subscription "${name}"?`)) {
      deleteSubscription(id);
      showToast(`Subscription "${name}" deleted.`);
    }
  };

  // Chart Rendering Effect
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active');
  const chartLabels = activeSubs.map(sub => sub.name);
  const chartData = activeSubs.map(sub => {
    const costVal = parseFloat(sub.cost) || 0;
    if (chartFilter === 'Monthly') {
      return sub.billingCycle === 'Monthly' ? costVal : costVal / 12;
    } else {
      return sub.billingCycle === 'Monthly' ? costVal * 12 : costVal;
    }
  });

  useEffect(() => {
    if (activeSubs.length === 0 || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    
    const centerTextPlugin = {
      id: 'subCenterText',
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

        ctx.fillText('TOTAL SUB COST', centerX, centerY - 10);

        ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = settings.theme === 'light' ? '#0f172a' : '#f8fafc';
        
        const total = chartData.reduce((a, b) => a + b, 0);
        ctx.fillText(formatCurrency(total, settings.currency), centerX, centerY + 10);
        ctx.restore();
      }
    };

    const colors = [
      '#6366f1', // Indigo
      '#ec4899', // Pink
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#3b82f6', // Blue
      '#a855f7', // Purple
      '#14b8a6', // Teal
      '#f43f5e', // Rose
      '#84cc16', // Lime
      '#06b6d4'  // Cyan
    ];

    const subChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: colors.slice(0, activeSubs.length),
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
            position: 'bottom',
            labels: {
              color: settings.theme === 'light' ? '#475569' : '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                return ` ${context.label}: ${formatCurrency(val, settings.currency)}`;
              }
            }
          }
        }
      }
    });

    return () => {
      subChart.destroy();
    };
  }, [subscriptions, chartFilter, settings.theme, settings.currency]);

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Subscription Manager</h1>
          <p>Track your recurring SaaS products, antivirus licenses, cloud services, and automate ledger renewals.</p>
        </div>
      </div>

      {/* Subscription Summary Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
        <div className="panel card-panel" style={{ background: 'var(--accent-gradient)' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Cost Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
            {formatCurrency(activeMonthlyTotal, settings.currency)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', marginTop: '6px' }}>Combined active billing load</div>
        </div>

        <div className="panel card-panel">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Yearly Cost Load</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {formatCurrency(activeYearlyTotal, settings.currency)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>Combined annual cash flow</div>
        </div>

        <div className="panel card-panel">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Trackers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {activeCount} Subscriptions
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>From {subscriptions.length} registered entries</div>
        </div>
      </div>

      {/* Table & Chart Split Layout Grid */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Subscriptions Table */}
        <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Subscriptions List</h2>
            <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Add Subscription
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Renewals automatically update cash-flows inside your transaction ledger logs on renewal dates.
          </p>

          {subscriptions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No subscriptions registered yet. Click "Add Subscription" to start tracking recurring products!
            </div>
          ) : (
            <div className="table-container" style={{ flexGrow: 1 }}>
              <table style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Cost</th>
                    <th>Billing Cycle</th>
                    <th>Next Renewal Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(sub => {
                    return (
                      <tr key={sub.id} style={{ opacity: sub.status === 'Cancelled' ? 0.6 : 1, cursor: 'pointer' }}>
                        <td onClick={() => setSelectedSub(sub)} style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</td>
                        <td onClick={() => setSelectedSub(sub)} style={{ fontWeight: 700 }}>{formatCurrency(sub.cost, settings.currency)}</td>
                        <td onClick={() => setSelectedSub(sub)}>
                          <span className={`badge ${sub.billingCycle === 'Monthly' ? 'badge-income' : 'badge-pending'}`}>
                            {sub.billingCycle}
                          </span>
                        </td>
                        <td onClick={() => setSelectedSub(sub)} style={{ fontWeight: 600 }}>{sub.status === 'Active' ? sub.nextRenewalDate || sub.startDate : 'N/A'}</td>
                        <td onClick={() => setSelectedSub(sub)}>
                          <span className={`badge ${sub.status === 'Active' ? 'badge-income' : 'badge-expense'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-icon-only" style={{ width: '28px', height: '28px' }} onClick={() => handleToggleStatus(sub)} title={sub.status === 'Active' ? 'Cancel' : 'Activate'}>
                              {sub.status === 'Active' ? (
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                              )}
                            </button>
                            <button className="btn btn-secondary btn-icon-only" style={{ width: '28px', height: '28px' }} onClick={() => handleOpenEditModal(sub)} title="Edit">
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                            </button>
                            <button className="btn btn-danger btn-icon-only" style={{ width: '28px', height: '28px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }} onClick={() => handleDelete(sub.id, sub.name)} title="Delete">
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscription Expense Distribution Chart Panel */}
        <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Subscription Expense Distribution</h2>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
              <button 
                type="button"
                className={`btn ${chartFilter === 'Monthly' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setChartFilter('Monthly')}
                style={{ padding: '4px 10px', fontSize: '0.75rem', border: 'none', borderRadius: '4px' }}
              >
                Monthly
              </button>
              <button 
                type="button"
                className={`btn ${chartFilter === 'Yearly' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => setChartFilter('Yearly')}
                style={{ padding: '4px 10px', fontSize: '0.75rem', border: 'none', borderRadius: '4px' }}
              >
                Yearly
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Recurring cost contribution ratio filtered by cycle.
          </p>

          {activeSubs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '40px' }}>
              No active subscriptions to display distribution data.
            </div>
          ) : (
            <div className="chart-wrapper" style={{ height: '330px', position: 'relative' }}>
              <canvas ref={chartRef}></canvas>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT SUBSCRIPTION MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Add Subscription' : 'Edit Subscription Details'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row-2">
              <div className="form-group">
                <label>Select Product Preset</label>
                <select className="input-ctrl" value={name} onChange={e => setName(e.target.value)}>
                  {subscriptionPresets.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {name === 'Custom' && (
                <div className="form-group">
                  <label>Custom Product Name</label>
                  <input
                    type="text"
                    className="input-ctrl"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Disney+"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-row-2" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Billing Cost (Rs.)</label>
                <input
                  type="number"
                  className="input-ctrl"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="1490.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Billing Cycle</label>
                <select className="input-ctrl" value={billingCycle} onChange={e => setBillingCycle(e.target.value)}>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="form-row-2" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Billing Start Date</label>
                <input
                  type="date"
                  className="input-ctrl"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pay From Bank Account</label>
                <select className="input-ctrl" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}>
                  <option value="">Select account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {modalMode === 'add' ? 'Add Subscription' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUBSCRIPTION DETAILS MODAL */}
      <Modal isOpen={!!selectedSub} onClose={() => setSelectedSub(null)} title="Subscription Details">
        {selectedSub && (() => {
          const payAcc = accounts.find(a => a.id === selectedSub.bankAccountId);
          return (
            <div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Product Name</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>{selectedSub.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${selectedSub.status === 'Active' ? 'badge-income' : 'badge-expense'}`} style={{ fontSize: '0.85rem' }}>
                        {selectedSub.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cost</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '2px', color: '#f43f5e' }}>
                      {formatCurrency(selectedSub.cost, settings.currency)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Billing Cycle</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${selectedSub.billingCycle === 'Monthly' ? 'badge-income' : 'badge-pending'}`} style={{ fontSize: '0.85rem' }}>
                        {selectedSub.billingCycle}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Start Date</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>{selectedSub.startDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Next Renewal Date</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                      {selectedSub.status === 'Active' ? selectedSub.nextRenewalDate || selectedSub.startDate : 'N/A'}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment Account</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                      {payAcc ? `${payAcc.bankName} (${payAcc.accountName}) • ${payAcc.accountNumber || 'N/A'}` : 'None Linked'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedSub(null)}>Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
