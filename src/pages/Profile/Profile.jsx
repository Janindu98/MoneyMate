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
  const [epfId, setEpfId] = useState('');
  const [etfId, setEtfId] = useState('');

  const developerPositions = [
    'Intern Software Developer',
    'Junior Software Engineer',
    'Associate Software Engineer',
    'Software Engineer',
    'Senior Software Engineer',
    'Tech Lead',
    'Tech Architect',
    'Project Manager',
    'Engineering Manager'
  ];

  // Prefill states when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmployeeId(profile.employeeId || '');
      setCompany(profile.company || '');
      setDesignation(profile.designation || 'Software Engineer');
      setTaxId(profile.taxId || '');
      setEpfId(profile.epfId || '');
      setEtfId(profile.etfId || '');
      
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
      epfId: epfId.trim(),
      etfId: etfId.trim()
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
                  placeholder="e.g. Janindu Sachinthana" 
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
                <select 
                  className="input-ctrl" 
                  value={designation} 
                  onChange={e => setDesignation(e.target.value)}
                >
                  {developerPositions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
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

            {/* Statutory Reference IDs */}
            <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
                <label>EPF Member ID</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={epfId} 
                  onChange={e => setEpfId(e.target.value)} 
                  placeholder="e.g. EPF-3456" 
                />
              </div>

              <div className="form-group">
                <label>ETF Member ID</label>
                <input 
                  type="text" 
                  className="input-ctrl" 
                  value={etfId} 
                  onChange={e => setEtfId(e.target.value)} 
                  placeholder="e.g. ETF-7890" 
                />
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                <span style={{ opacity: 0.8 }}>EPF ID:</span>
                <span style={{ fontWeight: 600 }}>{epfId || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '6px' }}>
                <span style={{ opacity: 0.8 }}>ETF ID:</span>
                <span style={{ fontWeight: 600 }}>{etfId || 'N/A'}</span>
              </div>
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
