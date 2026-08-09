import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const { profile, updateProfile, accounts } = useDatabase();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [selectedBankAccId, setSelectedBankAccId] = useState('');
  const [taxId, setTaxId] = useState('');
  const [contributions, setContributions] = useState([]);
  const [newContribName, setNewContribName] = useState('');
  const [newContribMemberId, setNewContribMemberId] = useState('');
  const [newContribEmpRate, setNewContribEmpRate] = useState('');
  const [newContribEmrRate, setNewContribEmrRate] = useState('');
  const [editingContribId, setEditingContribId] = useState(null);

  // Prefill states when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmployeeId(profile.employeeId || '');
      setCompany(profile.company || '');
      setDesignation(profile.designation || 'Software Engineer');
      setTaxId(profile.taxId || '');
      setContributions(profile.contributions || []);
      
      // Attempt to find bank account matching the saved bankName & accountNumber
      if (profile.bankName && accounts.length > 0) {
        const match = accounts.find(a => 
          a.bankName.toLowerCase() === profile.bankName.toLowerCase() && 
          (!profile.accountNumber || a.accountNumber === profile.accountNumber)
        );
        if (match) {
          setSelectedBankAccId(match.id);
        }
      }
    }
  }, [profile, accounts]);

  const handleStartEdit = (c) => {
    setEditingContribId(c.id);
    setNewContribName(c.name);
    setNewContribMemberId(c.memberId || '');
    setNewContribEmpRate(c.employeeRate);
    setNewContribEmrRate(c.employerRate);
  };

  const handleCancelEdit = () => {
    setEditingContribId(null);
    setNewContribName('');
    setNewContribMemberId('');
    setNewContribEmpRate('');
    setNewContribEmrRate('');
  };

  const handleAddContribution = () => {
    const nameVal = newContribName.trim();
    if (!nameVal) {
      showToast('Please enter a fund name.', 'error');
      return;
    }
    const empRate = parseFloat(newContribEmpRate) || 0;
    const emrRate = parseFloat(newContribEmrRate) || 0;

    if (editingContribId) {
      setContributions(prev => prev.map(c => c.id === editingContribId ? {
        ...c,
        name: nameVal,
        memberId: newContribMemberId.trim(),
        employeeRate: empRate,
        employerRate: emrRate
      } : c));
      setEditingContribId(null);
      showToast(`Custom fund "${nameVal}" updated.`);
    } else {
      const newContrib = {
        id: `contrib_${Date.now()}`,
        name: nameVal,
        memberId: newContribMemberId.trim(),
        employeeRate: empRate,
        employerRate: emrRate
      };
      setContributions(prev => [...prev, newContrib]);
      showToast(`Custom fund "${nameVal}" added.`);
    }

    setNewContribName('');
    setNewContribMemberId('');
    setNewContribEmpRate('');
    setNewContribEmrRate('');
  };

  const handleRemoveContribution = (id) => {
    if (editingContribId === id) {
      handleCancelEdit();
    }
    setContributions(prev => prev.filter(c => c.id !== id));
    showToast('Custom fund removed.');
  };

  const handleSave = (e) => {
    e.preventDefault();

    let savedBankName = '';
    let savedAccountNumber = '';

    if (selectedBankAccId) {
      const selectedAcc = accounts.find(a => a.id === selectedBankAccId);
      if (selectedAcc) {
        savedBankName = selectedAcc.bankName;
        savedAccountNumber = selectedAcc.accountNumber || '';
      }
    }

    updateProfile({
      name: name.trim(),
      employeeId: employeeId.trim(),
      company: company.trim(),
      designation,
      bankName: savedBankName,
      accountNumber: savedAccountNumber,
      taxId: taxId.trim(),
      epfId: profile?.epfId || '',
      etfId: profile?.etfId || '',
      contributions
    });

    showToast('User profile settings updated successfully.');
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="header-title">
          <h1>Profile Management</h1>
          <p>Manage your user identity parameters, employer details, tax credentials, and active designations.</p>
        </div>
      </div>

      <div className="grid-2-1" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>User Details Form</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            These details will auto-populate transaction ledgers and salary slip records.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-row-2">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Employee ID</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={employeeId} 
                  onChange={e => setEmployeeId(e.target.value)} 
                  placeholder="e.g. EMP-103" 
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Current Designation</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={designation} 
                  onChange={e => setDesignation(e.target.value)} 
                  placeholder="e.g. Software Engineer, HR Manager"
                  required
                />
              </div>

              <div className="form-group">
                <label>Current Working Company</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={company} 
                  onChange={e => setCompany(e.target.value)} 
                  placeholder="e.g. Virtusa, WSO2" 
                  required 
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Tax ID (TIN)</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={taxId} 
                  onChange={e => setTaxId(e.target.value)} 
                  placeholder="e.g. TIN-789012" 
                />
              </div>

              <div className="form-group">
                <label>Default Salary Deposit Account</label>
                <select 
                  className="input-ctrl" 
                  value={selectedBankAccId} 
                  onChange={e => setSelectedBankAccId(e.target.value)}
                >
                  <option value="">Select bank account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName} ({a.accountNumber ? `No: ${a.accountNumber}` : 'No No.'})</option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ⚠️ Create a bank account in the "Bank Accounts" tab first to set up a default deposit account.
                  </div>
                )}
              </div>
            </div>

            {/* Contributions Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: '#6366f1' }}>Contributions & Social Security</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '14px' }}>
                Add custom pension, retirement, or statutory funds with local contribution rates.
              </p>

              {/* Contributions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {contributions.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Fund Name: <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Member ID / Account Number: <span style={{ color: c.memberId ? 'var(--text-primary)' : '#6366f1', fontWeight: 600 }}>{c.memberId || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Employee Rate: <strong style={{ color: 'var(--text-primary)' }}>{c.employeeRate}%</strong> | Employer Rate: <strong style={{ color: 'var(--text-primary)' }}>{c.employerRate}%</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => handleStartEdit(c)}
                        style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: '#6366f1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveContribution(c.id)}
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', color: '#f43f5e', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {contributions.length === 0 && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                    No custom contributions added yet.
                  </div>
                )}
              </div>

              {/* Form to add a new contribution */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>
                  {editingContribId ? `Edit Contribution: ${newContribName}` : 'Add Custom Contribution'}
                </h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Fund Name</label>
                    <input 
                      type="text" 
                      className="input-ctrl" 
                      value={newContribName} 
                      onChange={e => setNewContribName(e.target.value)} 
                      placeholder="e.g. EPF, 401(k), Pension" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Member ID / Account Number</label>
                    <input 
                      type="text" 
                      className="input-ctrl" 
                      value={newContribMemberId} 
                      onChange={e => setNewContribMemberId(e.target.value)} 
                      placeholder="e.g. EPF-3456" 
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                <div className="form-row-2" style={{ marginTop: '10px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Employee Rate (%)</label>
                    <input 
                      type="number" 
                      className="input-ctrl" 
                      value={newContribEmpRate} 
                      onChange={e => setNewContribEmpRate(e.target.value)} 
                      placeholder="e.g. 8" 
                      min="0"
                      max="100"
                      step="0.01"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Employer Rate (%)</label>
                    <input 
                      type="number" 
                      className="input-ctrl" 
                      value={newContribEmrRate} 
                      onChange={e => setNewContribEmrRate(e.target.value)} 
                      placeholder="e.g. 12" 
                      min="0"
                      max="100"
                      step="0.01"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleAddContribution}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {editingContribId ? 'Save Changes' : '+ Add to List'}
                  </button>
                  {editingContribId && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelEdit}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              Save Profile
            </button>
          </form>
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Card View</h2>
          
          <div style={{ background: 'var(--accent-gradient)', borderRadius: '16px', padding: '24px', color: '#fff', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                {name ? name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{name || 'Jane Doe'}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{designation || 'Software Engineer'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                <span style={{ opacity: 0.8 }}>Employee ID:</span>
                <span style={{ fontWeight: 600 }}>{employeeId || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                <span style={{ opacity: 0.8 }}>Company:</span>
                <span style={{ fontWeight: 600 }}>{company || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                <span style={{ opacity: 0.8 }}>Tax ID (TIN):</span>
                <span style={{ fontWeight: 600 }}>{taxId || 'N/A'}</span>
              </div>
              {contributions.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                  <span style={{ opacity: 0.8 }}>{c.name}:</span>
                  <span style={{ fontWeight: 600 }}>{c.employeeRate}% / {c.employerRate}%</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.8 }}>Bank Account:</span>
                <span style={{ fontWeight: 600 }}>
                  {profile?.bankName ? `${profile.bankName} ${profile.accountNumber ? `(${profile.accountNumber})` : ''}` : 'None Linked'}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <strong>💡 Quick Tip:</strong> Auto-fill functionality links these profile variables to your monthly Salary monitor spreadsheets and quick inputs automatically!
          </div>
        </div>
      </div>
    </div>
  );
}
