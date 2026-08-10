import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Store, 
  ShieldCheck, 
  Palette, 
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
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  staffAccounts,
  onSaveSettings,
  onUpgradeTier,
  onSaveStaffAccount,
  onDeleteStaffAccount,
  currentUserRole = 'ADMIN',
}) => {
  const isOwner = currentUserRole === 'ADMIN';
  const [storeName, setStoreName] = useState(settings.storeName);
  const [branchName, setBranchName] = useState(settings.branchName);
  const [address, setAddress] = useState(settings.address);
  const [tinNumber, setTinNumber] = useState(settings.tinNumber);
  const [bploPermitNo, setBploPermitNo] = useState(settings.bploPermitNo);
  const [contactNumber, setContactNumber] = useState(settings.contactNumber);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>(settings.operationalMode);
  const [themeColor, setThemeColor] = useState<'orange' | 'amber' | 'emerald' | 'slate'>(settings.themeColor);

  // Staff Account Management Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empUsername, setEmpUsername] = useState('');
  const [empRole, setEmpRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER');
  const [empModalError, setEmpModalError] = useState('');
  const [empModalSuccess, setEmpModalSuccess] = useState('');
  const [isSubmittingInv, setIsSubmittingInv] = useState(false);

  const isTier2Unlocked = settings.activeTier >= 2;

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
      themeColor,
    };

    onSaveSettings(updated);
    alert('System settings updated successfully!');
  };

  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpEmail('');
    setEmpUsername('');
    setEmpRole('CASHIER');
    setEmpModalError('');
    setEmpModalSuccess('');
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: UserProfile) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email || '');
    setEmpUsername(emp.username || '');
    setEmpRole(emp.role);
    setEmpModalError('');
    setEmpModalSuccess('');
    setIsEmpModalOpen(true);
  };

  const handleSaveEmpForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpModalError('');
    setEmpModalSuccess('');

    if (!empName.trim()) {
      setEmpModalError('Please enter a valid staff name.');
      return;
    }

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
      const verifyRes = await fetch(`/api/accounts/verify?identifier=${encodeURIComponent(empEmail.trim())}&tenantId=1`);
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
          tenantId: 1, // Store Owner Tenant ID
          email: empEmail.trim(),
          employeeEmail: empEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmpModalError(data.error || 'This Employee does not exist');
        setIsSubmittingInv(false);
        return;
      }

      if (data.invitation && data.invitation.token) {
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
      name: empName.trim(),
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


  // If Employee / Cashier Role: Simplify to ONLY Internal UI Personalization
  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 flex items-center justify-between">
          <div>
            <span className="bg-orange-50 text-orange-600 border border-orange-200/60 text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              Shift Preferences
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Palette className="w-6 h-6 text-orange-600" />
              Employee Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Customize your workstation UI theme preference for active shift counter operations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* THEME PERSONALIZATION (Single setting for Employee) */}
          <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-600" />
                  Internal UI Personalization
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select your preferred color accents for your active POS shift session
                </p>
              </div>
              {!isTier2Unlocked && (
                <span className="text-[10px] bg-amber-50 text-amber-800 font-extrabold px-3 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                  Tier 2 Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'orange', name: 'Marikina Warm Orange', hex: 'bg-orange-600' },
                { id: 'amber', name: 'Terracotta Amber', hex: 'bg-amber-600' },
                { id: 'emerald', name: 'Fresh Emerald', hex: 'bg-emerald-600' },
                { id: 'slate', name: 'Dark Slate Premium', hex: 'bg-slate-800' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (!isTier2Unlocked) {
                      alert('UI Theme Personalization requires SaaS Tier 2 (₱99/mo). Ask Store Owner to upgrade.');
                    } else {
                      setThemeColor(t.id as any);
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-center space-x-3 transition-all cursor-pointer ${
                    themeColor === t.id
                      ? 'border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/40 font-black'
                      : 'border-slate-200/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full shrink-0 ${t.hex}`} />
                  <span className="text-xs font-bold">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-full text-xs shadow-airmee-orange transition-all flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE PREFERENCES</span>
            </button>
          </div>
        </form>
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
              onClick={() => setOperationalMode('SINGLE_OPERATOR')}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${
                operationalMode === 'SINGLE_OPERATOR'
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
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${
                operationalMode === 'MULTI_TENANT'
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
              {staffAccounts
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
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                              isAccepted 
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

        {/* THEME PERSONALIZATION (Tier 2 feature) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-600" />
              Internal UI Personalization (Tier 2 Feature)
            </h3>
            {!isTier2Unlocked && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                Tier 2 Locked
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'orange', name: 'Marikina Warm Orange', hex: 'bg-orange-600' },
              { id: 'amber', name: 'Terracotta Amber', hex: 'bg-amber-600' },
              { id: 'emerald', name: 'Fresh Emerald', hex: 'bg-emerald-600' },
              { id: 'slate', name: 'Dark Slate Premium', hex: 'bg-slate-800' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (!isTier2Unlocked) {
                    alert('UI Theme Personalization requires SaaS Tier 2 (₱99/mo). Upgrade below.');
                    onUpgradeTier(2);
                  } else {
                    setThemeColor(t.id as any);
                  }
                }}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition ${
                  themeColor === t.id
                    ? 'border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${t.hex}`} />
                <span className="text-xs font-bold text-slate-800">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STORE METADATA & COMPLIANCE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Store className="w-4 h-4 text-orange-600" />
            Eatery Metadata & BPLO / BIR Official Receipts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eatery Trade Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch Identifier
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Physical Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone / Landline
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                BIR Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Marikina BPLO Permit Number
              </label>
              <input
                type="text"
                value={bploPermitNo}
                onChange={(e) => setBploPermitNo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEmpForm}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-[#E8E2DD]"
          >
            <h3 className="font-bold text-base text-[#2D241E] border-b border-[#E8E2DD] pb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-600" />
              <span>{editingEmp ? 'Edit Staff Account' : 'Issue Employee Invitation'}</span>
            </h3>

            {/* Compliance Info Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Secure Invitation Protocol Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 font-medium">
                Store Owners cannot set employee passwords directly. An invitation link & verification token will be sent to the employee's email address.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juana Dela Cruz (Cashier)"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Email Invitation Input Field (employeeEmail) *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. cashier@caricloud.ph"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Preferred Username (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. juana"
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Account Role
                </label>
                <select
                  value="CASHIER"
                  disabled={true}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                >
                  <option value="CASHIER">Employee / Cashier (Counter Shift - Sub-tier Role)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  🔒 Illegal Owner Account Prevention: Logged-in Owners (ADMIN) are strictly prohibited from selecting or creating another "Owner" (ADMIN) account role.
                </p>
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
