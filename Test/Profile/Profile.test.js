import { describe, test, expect } from '../core/testFramework.js';
import { createMockDatabase } from '../core/mockData.js';

export function registerProfileTests() {
  describe('Profile', () => {

    test('TC-PROF-001', 'Update Profile Personal and Employment Information', () => {
      const db = createMockDatabase();
      db.updateProfile({
        name: 'Alexander Hamilton',
        employeeId: 'EMP-1776',
        company: 'Treasury Department',
        designation: 'Chief Economist',
        bankName: 'Bank of New York',
        accountNumber: '1789001234',
        taxId: 'US-TAX-1789',
        epfId: 'EPF-889900',
        etfId: 'ETF-112233'
      });

      const state = db.getState();
      expect(state.profile.name).toBe('Alexander Hamilton');
      expect(state.profile.employeeId).toBe('EMP-1776');
      expect(state.profile.company).toBe('Treasury Department');
      expect(state.profile.designation).toBe('Chief Economist');
    }, {
      description: 'Updates and saves all user profile details in state',
      steps: ['Call updateProfile with employment details', 'Assert state.profile'],
      expectedResult: 'Profile fields saved in state'
    });

    test('TC-PROF-002', 'Configure Dynamic Statutory Contribution Schemes', () => {
      const db = createMockDatabase();
      const currentProfile = db.getState().profile;

      const newContribution = {
        id: 'contrib_medical_insurance',
        name: 'Corporate Health Care Fund',
        memberId: 'MED-554433',
        employeeRate: 3.5,
        employerRate: 5.0
      };

      db.updateProfile({
        ...currentProfile,
        contributions: [...(currentProfile.contributions || []), newContribution]
      });

      const state = db.getState();
      const added = state.profile.contributions.find(c => c.id === 'contrib_medical_insurance');

      expect(added).toBeDefined();
      expect(added.name).toBe('Corporate Health Care Fund');
      expect(added.employeeRate).toBe(3.5);
      expect(added.employerRate).toBe(5.0);
    }, {
      description: 'Adds custom contribution schemes to user profile with custom employee and employer percentage rates',
      steps: ['Append new contribution object to profile.contributions', 'Assert saved rates in state'],
      expectedResult: 'Custom contribution scheme added to profile'
    });

    test('TC-PROF-003', 'Edit and Remove Contribution Schemes from Profile', () => {
      const db = createMockDatabase();
      let profile = db.getState().profile;

      // Edit existing contribution
      profile.contributions = profile.contributions.map(c => 
        c.id === 'contrib_epf' ? { ...c, employeeRate: 10, employerRate: 15 } : c
      );
      db.updateProfile(profile);

      let state = db.getState();
      let epf = state.profile.contributions.find(c => c.id === 'contrib_epf');
      expect(epf.employeeRate).toBe(10);
      expect(epf.employerRate).toBe(15);

      // Remove ETF contribution
      profile = state.profile;
      profile.contributions = profile.contributions.filter(c => c.id !== 'contrib_etf');
      db.updateProfile(profile);

      state = db.getState();
      expect(state.profile.contributions.find(c => c.id === 'contrib_etf')).toBeUndefined();
    }, {
      description: 'Modifies contribution rates and removes selected schemes from profile',
      steps: ['Update EPF rate to 10%', 'Remove ETF from contributions array', 'Assert updated profile'],
      expectedResult: 'Rates modified and ETF contribution removed'
    });

    test('TC-PROF-004', 'Profile Auto-Fill Prefill Logic into Salary Records', () => {
      const db = createMockDatabase();
      const state = db.getState();
      const profile = state.profile;
      const accounts = state.accounts;

      // Simulate Salary slip prefill
      const prefilledCompany = profile.company || '';
      const prefilledEmpId = profile.employeeId || '';
      const prefilledPosition = profile.designation || '';

      // Match bank account by name
      const matchingAccount = accounts.find(a => 
        a.bankName.toLowerCase() === profile.bankName.toLowerCase()
      );

      expect(prefilledCompany).toBe('Acme Corp');
      expect(prefilledEmpId).toBe('EMP-9081');
      expect(prefilledPosition).toBe('Senior Engineer');
      expect(matchingAccount).toBeDefined();
      expect(matchingAccount.id).toBe('acc_boc_01');
    }, {
      description: 'Tests logic that auto-populates Salary modal inputs from user profile configuration',
      steps: ['Read profile properties', 'Match profile bankName with accounts list'],
      expectedResult: 'Salary inputs successfully prefilled from profile'
    });

  }, 'Profile management, statutory scheme configurations, and salary prefilling');
}
