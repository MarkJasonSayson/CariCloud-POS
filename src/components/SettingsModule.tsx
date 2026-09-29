import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Store,
  ShieldCheck,
  Users,
  User,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  Mail,
  Key
} from 'lucide-react';
import { StoreSettings, OperationalMode, SubscriptionTierLevel, UserProfile, Role } from '../types';

interface SettingsModuleProps {
  settings: StoreSettings;
  staffAccounts: UserProfile[];
  onSaveSettings: (settings: StoreSettings) => void;
  onUpgradeTier: (tier: SubscriptionTierLevel) => void;
  onSaveStaffAccount: (user: UserProfile) => void;
  onDeleteStaffAccount: (userId: string) => void;
  currentUserRole?: Role;
  currentUserId?: string | number;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  staffAccounts,
  onSaveSettings,
  onUpgradeTier,
  onSaveStaffAccount,
  onDeleteStaffAccount,
  currentUserRole = 'ADMIN',
  currentUserId,
}) => {
  const isOwner = currentUserRole === 'ADMIN';
  const [storeName, setStoreName] = useState(settings.storeName);
  const [branchName, setBranchName] = useState(settings.branchName);
  const [address, setAddress] = useState(settings.address);
  const [tinNumber, setTinNumber] = useState(settings.tinNumber);
  const [bploPermitNo, setBploPermitNo] = useState(settings.bploPermitNo);
  const [contactNumber, setContactNumber] = useState(settings.contactNumber);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>(settings.operationalMode);
  const [showSingleOpModal, setShowSingleOpModal] = useState(false);

  // Fresh staff roster fetched directly from database API
  const [rosterStaff, setRosterStaff] = useState<UserProfile[]>(staffAccounts);

  useEffect(() => {
    setStoreName(settings.storeName);
    setBranchName(settings.branchName);
    setAddress(settings.address);
    setTinNumber(settings.tinNumber);
    setBploPermitNo(settings.bploPermitNo);
    setContactNumber(settings.contactNumber);
    setOperationalMode(settings.operationalMode);
  }, [settings]);

  useEffect(() => {
    setRosterStaff(staffAccounts);
  }, [staffAccounts]);

  useEffect(() => {
    const fetchFreshRoster = async () => {
      try {
        if (staffAccounts && staffAccounts.length > 0) return;
        const res = await fetch(`/api/staff?tenantId=${currentUserId || 1}`);
        if (res.ok) {
          const freshData = await res.json();
          if (Array.isArray(freshData) && freshData.length > 0) {
            setRosterStaff(freshData);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch fresh staff accounts roster:', err);
      }
    };

    fetchFreshRoster();
  }, [staffAccounts, currentUserId]);

  // Staff Account Management Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [empEmail, setEmpEmail] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empModalError, setEmpModalError] = useState('');
  const [empModalSuccess, setEmpModalSuccess] = useState('');
  const [isSubmittingInv, setIsSubmittingInv] = useState(false);

  // Delete Account State & Handler
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    // SECURITY CHECK: Force explicit confirmation to prevent wrong-account targeting
    const targetEmail = prompt("SECURITY CHECK: Please type the exact email address of the account you want to permanently delete:");

    if (!targetEmail) {
      setIsDeleteModalOpen(false);
      return; // Stop if the user clicked cancel or left it blank
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        localStorage.clear();
        sessionStorage.clear();
        navigate('/', { state: { accountDeleted: true, deletedUserId: targetEmail } });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete account. Please try again.');
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Network error while deleting account. Please try again.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreSettings = {
      ...settings,
      storeName: storeName.trim(),
      branchName: branchName.trim(),
      address: address.trim(),
      tinNumber: tinNumber.trim(),
      bploPermitNo: bploPermitNo.trim(),
      contactNumber: contactNumber.trim(),
      operationalMode,
      themeColor: settings.themeColor || 'orange',
    };

    onSaveSettings(updated);
    alert('System settings updated successfully!');
  };

  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setEmpEmail('');
    setEmpUsername('');
    setEmpModalError('');
    setEmpModalSuccess('');
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: UserProfile) => {
    setEditingEmp(emp);
    setEmpEmail(emp.email || '');
    setEmpUsername(emp.username || '');
    setEmpModalError('');
    setEmpModalSuccess('');
    setIsEmpModalOpen(true);
  };

  const handleSaveEmpForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpModalError('');
    setEmpModalSuccess('');

    if (!empEmail.trim()) {
      setEmpModalError('Please enter an employee email address to send invitation.');
      return;
    }

    // Hard-lock role to CASHIER (Illegal Owner Account Prevention)
    const forcedRole: Role = 'CASHIER';

    setIsSubmittingInv(true);
    let invitationToken = 'inv_' + Math.random().toString(36).substring(2, 15);

    try {
      // 1. Non-Existent Account Guard & Role Verification via Backend DB API
      const verifyRes = await fetch(`/api/accounts/verify?identifier=${encodeURIComponent(empEmail.trim())}&tenantId=${currentUserId || 1}`);
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.exists) {
        setEmpModalError('This Employee does not exist');
        setIsSubmittingInv(false);
        return;
      }

      if (!verifyData.valid) {
        setEmpModalError(verifyData.error || 'This Employee does not exist');
        setIsSubmittingInv(false);
        return;
      }

      // 2. Issue invitation via Express API
      const res = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentUserId || 1, // Store Owner Tenant ID
          email: empEmail.trim(),
          employeeEmail: empEmail.trim(),
          storeName: settings.storeName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmpModalError(data.error || 'This Employee does not exist');
        setIsSubmittingInv(false);
        return;
      }

      if (data.token) {
        invitationToken = data.token;
      } else if (data.invitation && data.invitation.token) {
        invitationToken = data.invitation.token;
      }
    } catch (err: any) {
      console.warn('Backend DB check / invitation warning:', err.message);
      setEmpModalError('This Employee does not exist');
      setIsSubmittingInv(false);
      return;
    } finally {
      setIsSubmittingInv(false);
    }

    const user: UserProfile = {
      id: editingEmp ? editingEmp.id : 'u-emp-' + Date.now(),
      name: editingEmp?.name || empUsername.trim() || empEmail.trim().split('@')[0],
      email: empEmail.trim(),
      username: empUsername.trim() || empEmail.trim().split('@')[0],
      role: forcedRole, // Hard-locked to CASHIER
      parentOwnerId: 1,
      invitationStatus: 'PENDING',
      invitationToken: invitationToken,
      avatar: editingEmp?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
    };

    onSaveStaffAccount(user);
    setIsEmpModalOpen(false);
    alert(`Invitation successfully issued to ${user.email}!\nInvitation Token: ${invitationToken}`);
  };


  // If Employee / Cashier Role: Settings are restricted to Store Owners
  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
          <ShieldCheck className="w-12 h-12 text-orange-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-1">
            Store metadata and system configuration are restricted to Store Owners only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-orange-600" />
            Core System Configuration & Multi-Tenant Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure store metadata, employee staff accounts, multi-tenant governance, and theme personalization
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* OPERATIONAL MODE SWITCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Users className="w-4 h-4 text-orange-600" />
            Operational Workspace Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <button
              type="button"
              onClick={() => setShowSingleOpModal(true)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${operationalMode === 'SINGLE_OPERATOR'
                ? 'bg-orange-50/60 border-orange-500 ring-2 ring-orange-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">Single Operator Mode</span>
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Synthesizes Admin and Staff workflows into a single unified workspace. Best for solo owners.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOperationalMode('MULTI_TENANT')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${operationalMode === 'MULTI_TENANT'
                ? 'bg-orange-50/60 border-orange-500 ring-2 ring-orange-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">Multi-Tenant Mode</span>
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Separates Owner governance from Employee workspaces with account logins and staff creation controls.
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* MULTI-TENANT EMPLOYEE MANAGEMENT SECTION */}
        {operationalMode === 'MULTI_TENANT' && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-orange-600" />
                  Multi-Tenant Employee Staff Accounts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add and manage individual employee accounts with custom username/password logins for your system.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddEmp}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee Account</span>
              </button>
            </div>

            {/* Employee Accounts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rosterStaff
                .filter((s) => s.role === 'CASHIER')
                .map((emp) => {
                  const isAccepted = emp.invitationStatus === 'ACCEPTED' || !!emp.password;
                  return (
                    <div
                      key={emp.id}
                      className="bg-[#FCFAF7] border border-[#E8E2DD] rounded-xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-[#2D241E] truncate">{emp.name}</h4>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                              {isAccepted ? 'ACCEPTED' : 'INVITATION PENDING'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#756D67] truncate mt-0.5">
                            {emp.email} {emp.invitationToken && (
                              <span>• Token: <code className="font-mono text-[#2D241E] font-bold">{emp.invitationToken}</code></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEmp(emp)}
                          className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit Account Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove employee account ${emp.name}?`)) {
                              onDeleteStaffAccount(emp.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* STORE METADATA & COMPLIANCE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Store className="w-4 h-4 text-orange-600" />
            Eatery Metadata & BPLO / BIR Official Receipts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Eatery Trade Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Branch Identifier
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone / Landline
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                BIR Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Marikina BPLO Permit Number
              </label>
              <input
                type="text"
                value={bploPermitNo}
                onChange={(e) => setBploPermitNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>SAVE SYSTEM CONFIGURATION</span>
          </button>
        </div>

      </form>

      {/* Danger Zone: Delete Account */}
      <div className="bg-red-50/60 border border-red-200/80 rounded-3xl p-6 shadow-airmee flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-red-900 uppercase tracking-wider">
            Danger Zone
          </h3>
          <p className="text-xs text-red-700/80 font-medium mt-1">
            Permanently delete this account and all associated operational records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-extrabold rounded-2xl text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account</span>
        </button>
      </div>

      {/* Single Operator Mode Confirmation Modal */}
      {showSingleOpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-orange-600">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Single Operator Mode</h3>
                <span className="text-[11px] font-bold text-orange-600 block">Workspace Architecture</span>
              </div>
            </div>

            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Are you sure you want to turn on single operator mode? This locks staff access to your store's POS
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSingleOpModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => {
                  setOperationalMode('SINGLE_OPERATOR');
                  setShowSingleOpModal(false);
                  onSaveSettings({
                    ...settings,
                    storeName: storeName.trim(),
                    branchName: branchName.trim(),
                    address: address.trim(),
                    tinNumber: tinNumber.trim(),
                    bploPermitNo: bploPermitNo.trim(),
                    contactNumber: contactNumber.trim(),
                    operationalMode: 'SINGLE_OPERATOR',
                    themeColor: settings.themeColor || 'orange',
                  });
                }}
                className="px-5 py-2 text-xs font-extrabold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs cursor-pointer transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 p-6 space-y-4 dark:bg-slate-900 dark:text-white dark:border-slate-800">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Delete Account</h3>
                <span className="text-[11px] font-bold text-red-600 block">Permanent Action</span>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to delete this account? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEmpForm}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-[#E8E2DD] dark:bg-slate-900 dark:text-white dark:border-slate-800"
          >
            <h3 className="font-bold text-base text-[#2D241E] dark:text-white border-b border-[#E8E2DD] dark:border-slate-800 pb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <span>{editingEmp ? 'Edit Staff Account' : 'Issue Employee Invitation'}</span>
            </h3>

            {/* Compliance Info Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Secure Invitation Protocol Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90 font-medium">
                Store Owners cannot set employee passwords directly. An invitation link & verification token will be sent to the employee's email address.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D241E] dark:text-slate-200 mb-1">
                  Email Invitation Input Field (employeeEmail) *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. cashier@caricloud.ph"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D241E] dark:text-slate-200 mb-1">
                  Internal Staff Alias (Optional - Only visible on Owner Dashboard)
                </label>
                <input
                  type="text"
                  placeholder="e.g. juana"
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                />
              </div>

              {/* Error Banner for Cross-Eatery Conflict or Validation Error */}
              {empModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-start gap-2">
                  <span className="shrink-0 text-red-600 font-extrabold">⚠️</span>
                  <span>{empModalError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E2DD]">
              <button
                type="button"
                onClick={() => setIsEmpModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#756D67] hover:bg-[#FCFAF7] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingInv}
                className="px-5 py-2 text-xs font-bold bg-[#E65100] hover:bg-[#BF360C] text-white rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isSubmittingInv ? 'Sending Invitation...' : 'Send Email Invitation'}</span>
              </button>
            </div>
          </form>
        </div>
      )}


    </div>
  );
};
