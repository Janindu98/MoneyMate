import React, { useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';
import { formatCurrency } from '../../utils/format';
import Modal from '../../components/Modal';

export default function Subscriptions() {
  const { subscriptions, addSubscription, editSubscription, deleteSubscription, accounts, settings } = useDatabase();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [name, setName] = useState('Netflix');
  const [customName, setCustomName] = useState('');
  const [cost, setCost] = useState('');
  const [billingCycle, setBillingCycle] = useState('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState('');

  const subscriptionPresets = [
    'Netflix',
    'Spotify',
    'Microsoft 365',
    'Adobe Creative Cloud',
    'ChatGPT Plus',
    'Antivirus Software',
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

    const payload = {
      name: finalName,
      cost: parseFloat(cost),
      billingCycle,
      startDate,
      bankAccountId,
      status: modalMode === 'edit' ? subscriptions.find(s => s.id === editingId)?.status || 'Active' : 'Active',
      nextRenewalDate: startDate // Reset renewal base
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

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Subscription Manager</h1>
          <p>Track your recurring SaaS products, antivirus licenses, cloud services, and automate ledger renewals.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            Add Subscription
          </button>
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

      {/* Subscriptions Table */}
      <div className="panel">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Registered Subscriptions List</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Renewals automatically update cash-flows inside your transaction ledger logs on renewal dates.
        </p>

        {subscriptions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No subscriptions registered yet. Click "Add Subscription" to start tracking recurring products!
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Cost</th>
                  <th>Billing Cycle</th>
                  <th>Start Date</th>
                  <th>Next Renewal Date</th>
                  <th>Payment Account</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => {
                  const payAcc = accounts.find(a => a.id === sub.bankAccountId);
                  return (
                    <tr key={sub.id} style={{ opacity: sub.status === 'Cancelled' ? 0.6 : 1 }}>
                      <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sub.name}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(sub.cost, settings.currency)}</td>
                      <td>
                        <span className={`badge ${sub.billingCycle === 'Monthly' ? 'badge-income' : 'badge-pending'}`}>
                          {sub.billingCycle}
                        </span>
                      </td>
                      <td>{sub.startDate}</td>
                      <td style={{ fontWeight: 600 }}>{sub.status === 'Active' ? sub.nextRenewalDate || sub.startDate : 'N/A'}</td>
                      <td>{payAcc ? `${payAcc.bankName} - ${payAcc.accountName}` : 'None Linked'}</td>
                      <td>
                        <span className={`badge ${sub.status === 'Active' ? 'badge-income' : 'badge-expense'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" onClick={() => handleToggleStatus(sub)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            {sub.status === 'Active' ? 'Cancel' : 'Activate'}
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleOpenEditModal(sub)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            Edit
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleDelete(sub.id, sub.name)} style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#f43f5e', borderColor: '#f43f5e' }}>
                            Delete
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
    </div>
  );
}
