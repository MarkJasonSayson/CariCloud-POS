import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Store, 
  KeyRound, 
  AlertCircle,
  User,
  Users,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  CheckCircle2,
  ArrowLeft,
  Crown,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { UserProfile, StoreSettings, Role } from '../types';

interface LoginLandingPageProps {
  settings: StoreSettings;
  staffAccounts: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onUpdateStaffAccounts: (accounts: UserProfile[]) => void;
}

export const LoginLandingPage: React.FC<LoginLandingPageProps> = ({
  settings,
  staffAccounts,
  onLoginSuccess,
  onUpdateStaffAccounts,
}) => {
  // Portal Selection State: null = Landing Screen, 'ADMIN' = Owner Form, 'CASHIER' = Employee Form
  const [selectedPortal, setSelectedPortal] = useState<Role | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState<string>(''); // email or username
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Forgot Password Flow State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Email input, 2: Code verification, 3: New password
  const [resetEmail, setResetEmail] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');
  const [forgotSuccess, setForgotSuccess] = useState<string>('');
  const [targetResetUser, setTargetResetUser] = useState<UserProfile | null>(null);

  // Create Account State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regRole, setRegRole] = useState<Role>('ADMIN');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('1234');
  const [regError, setRegError] = useState<string>('');

  // Employee Invitation Acceptance Flow State
  const [isAcceptInvModalOpen, setIsAcceptInvModalOpen] = useState<boolean>(false);
  const [invStep, setInvStep] = useState<1 | 2>(1);
  const [invToken, setInvToken] = useState<string>('');
  const [invEmail, setInvEmail] = useState<string>('');
  const [invFullName, setInvFullName] = useState<string>('');
  const [invUsername, setInvUsername] = useState<string>('');
  const [invPassword, setInvPassword] = useState<string>('');
  const [invConfirmPassword, setInvConfirmPassword] = useState<string>('');
  const [invError, setInvError] = useState<string>('');
  const [isVerifyingInv, setIsVerifyingInv] = useState<boolean>(false);
  const [isSubmittingInvAccept, setIsSubmittingInvAccept] = useState<boolean>(false);

  const handleOpenAcceptInvitation = () => {
    setInvStep(1);
    setInvToken('');
    setInvEmail('');
    setInvFullName('');
    setInvUsername('');
    setInvPassword('');
    setInvConfirmPassword('');
    setInvError('');
    setIsAcceptInvModalOpen(true);
  };

  const handleVerifyInvToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvError('');
    const token = invToken.trim();

    if (!token) {
      setInvError('Please enter your invitation token.');
      return;
    }

    setIsVerifyingInv(true);

    try {
      const res = await fetch(`/api/invitations/verify/${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok) {
        setInvError(data.error || 'Invalid or expired invitation token.');
        setIsVerifyingInv(false);
        return;
      }

      if (data.valid && data.invitation) {
        setInvEmail(data.invitation.email || 'employee@caricloud.ph');
        setInvStep(2);
      } else {
        setInvError('Invitation token is invalid.');
      }
    } catch (err: any) {
      console.warn('Network issue verifying token, enabling offline token verification:', err.message);
      if (token.startsWith('inv_')) {
        setInvEmail('employee@caricloud.ph');
        setInvStep(2);
      } else {
        setInvError('Unable to verify token. Please check your token string.');
      }
    } finally {
      setIsVerifyingInv(false);
    }
  };

  const handleAcceptInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvError('');

    if (!invPassword || invPassword.length < 4) {
      setInvError('Password must be at least 4 characters long.');
      return;
    }

    if (invPassword !== invConfirmPassword) {
      setInvError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmittingInvAccept(true);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invToken.trim(),
          password: invPassword,
          username: invUsername.trim() || invEmail.split('@')[0],
          name: invFullName.trim() || 'Employee Staff',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Cross-Eatery Conflict Detection error (e.g. "This Employee is already operating for another Eatery")
        setInvError(data.error || 'Failed to accept invitation.');
        setIsSubmittingInvAccept(false);
        return;
      }

      const newEmployee: UserProfile = {
        id: data.user?.id || 'u-emp-' + Date.now(),
        name: invFullName.trim() || data.user?.name || 'Employee Staff',
        role: 'CASHIER',
        email: invEmail.trim(),
        username: invUsername.trim() || invEmail.split('@')[0],
        password: invPassword,
        parentOwnerId: data.user?.parentOwnerId || 1,
        invitationStatus: 'ACCEPTED',
        avatar: '👤',
      };

      const updatedAccounts = [...staffAccounts, newEmployee];
      onUpdateStaffAccounts(updatedAccounts);

      // Pre-fill login details for employee login portal
      setSelectedPortal('CASHIER');
      setIdentifier(newEmployee.username || newEmployee.email);
      setPassword(invPassword);

      alert(`Invitation accepted successfully!\nAccount activated for ${newEmployee.name}.\nYou can now log in under your Store Owner's eatery.`);
      setIsAcceptInvModalOpen(false);

    } catch (err: any) {
      console.warn('Network issue accepting invitation, performing local acceptance:', err.message);
      
      const newEmployee: UserProfile = {
        id: 'u-emp-' + Date.now(),
        name: invFullName.trim() || 'Employee Staff',
        role: 'CASHIER',
        email: invEmail.trim(),
        username: invUsername.trim() || invEmail.split('@')[0],
        password: invPassword,
        parentOwnerId: 1,
        invitationStatus: 'ACCEPTED',
        avatar: '👤',
      };

      const updatedAccounts = [...staffAccounts, newEmployee];
      onUpdateStaffAccounts(updatedAccounts);

      setSelectedPortal('CASHIER');
      setIdentifier(newEmployee.username || newEmployee.email);
      setPassword(invPassword);

      setIsAcceptInvModalOpen(false);
      alert(`Invitation accepted! Account activated for ${newEmployee.name}.`);
    } finally {
      setIsSubmittingInvAccept(false);
    }
  };

  const handleOpenCreateAccount = (role: Role) => {
    setRegRole(role);
    setRegName('');
    setRegEmail('');
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegPin('1234');
    setRegError('');
    setIsCreateModalOpen(true);
  };


  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError('Please enter a valid email address.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }

    if (selectedPortal === 'CASHIER' && regRole === 'ADMIN') {
      setRegError('Illegal Owner Account Prevention: Prohibited from creating or selecting an Owner (ADMIN) account role from the Employee portal.');
      return;
    }

    const emailQuery = regEmail.trim().toLowerCase();
    const usernameQuery = (regUsername.trim() || regEmail.split('@')[0]).toLowerCase();

    // Check if account with same email or username already exists
    const existing = staffAccounts.find(
      (acc) =>
        (acc.email && acc.email.toLowerCase() === emailQuery) ||
        (acc.username && acc.username.toLowerCase() === usernameQuery)
    );

    if (existing) {
      setRegError('An account with this email or username already exists.');
      return;
    }

    const newAccount: UserProfile = {
      id: 'usr-' + Date.now(),
      name: regName.trim(),
      role: regRole,
      email: regEmail.trim(),
      username: regUsername.trim() || regEmail.split('@')[0],
      password: regPassword,
      pin: regPin.trim() || '1234',
      avatar: regRole === 'ADMIN' ? '👑' : '👤',
    };

    const updatedAccounts = [...staffAccounts, newAccount];
    onUpdateStaffAccounts(updatedAccounts);

    // Pre-fill login
    setSelectedPortal(regRole);
    setIdentifier(newAccount.email || newAccount.username || newAccount.name);
    setPassword(regPassword);

    alert(`Account created successfully for ${newAccount.name} (${regRole === 'ADMIN' ? 'Store Owner' : 'Employee Cashier'})! You can now log in.`);
    setIsCreateModalOpen(false);
  };

  // Quick fill helper for testing demo accounts
  const handleQuickFill = (acc: UserProfile) => {
    setIdentifier(acc.email || acc.username || acc.name);
    setPassword(acc.password || 'password123');
    setErrorMsg('');
  };

  const handleSelectPortal = (portalRole: Role) => {
    setSelectedPortal(portalRole);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPortal) return;

    const query = identifier.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    // Find account by email, username, or name match
    const foundUser = staffAccounts.find((acc) => {
      const matchEmail = acc.email && acc.email.toLowerCase() === query;
      const matchUsername = acc.username && acc.username.toLowerCase() === query;
      const matchName = acc.name.toLowerCase().includes(query);
      return matchEmail || matchUsername || matchName;
    });

    if (!foundUser) {
      setErrorMsg('Account not found. Please check your username/email address.');
      return;
    }

    // ROLE VALIDATION CHECK
    if (selectedPortal === 'CASHIER' && foundUser.role === 'ADMIN') {
      setErrorMsg("This is an Owner's Account. Please input an Employee Account.");
      return;
    }

    if (selectedPortal === 'ADMIN' && foundUser.role === 'CASHIER') {
      setErrorMsg("This is an Employee's Account. Please input an Owner Account.");
      return;
    }

    // Check password
    const expectedPassword = foundUser.password || 'password123';
    if (password === expectedPassword) {
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Incorrect password. Please try again or click "Forgot Password?" to reset.');
    }
  };

  // --- FORGOT PASSWORD HANDLERS ---
  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const query = resetEmail.trim().toLowerCase();
    if (!query) {
      setForgotError('Please enter your registered email address or username.');
      return;
    }

    const found = staffAccounts.find((acc) => {
      const matchEmail = acc.email && acc.email.toLowerCase() === query;
      const matchUsername = acc.username && acc.username.toLowerCase() === query;
      return matchEmail || matchUsername;
    });

    if (!found) {
      setForgotError('No account registered under this email or username.');
      return;
    }

    // Generate random 6-digit confirmation code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setTargetResetUser(found);
    setForgotStep(2);
    setForgotSuccess(`Verification code sent! Simulated email code for ${found.email}: ${code}`);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (enteredCode.trim() !== generatedCode) {
      setForgotError('Invalid confirmation code. Please check the simulated email notice above.');
      return;
    }

    setForgotStep(3);
    setForgotError('');
    setForgotSuccess('Code confirmed! Please enter your new password.');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || newPassword.length < 4) {
      setForgotError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!targetResetUser) return;

    // Update account with new password
    const updatedUser: UserProfile = {
      ...targetResetUser,
      password: newPassword,
    };

    const updatedAccounts = staffAccounts.map((acc) =>
      acc.id === updatedUser.id ? updatedUser : acc
    );

    onUpdateStaffAccounts(updatedAccounts);

    // Pre-fill login
    setIdentifier(updatedUser.email || updatedUser.username || updatedUser.name);
    setPassword(newPassword);

    alert(`Password reset successful for ${updatedUser.name}! You can now log in.`);
    setIsForgotModalOpen(false);
    setForgotStep(1);
    setEnteredCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const filteredDemoAccounts = staffAccounts.filter((acc) => 
    selectedPortal === 'ADMIN' ? acc.role === 'ADMIN' : acc.role === 'CASHIER'
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col justify-between p-4 sm:p-8 md:p-12 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Top Brand Header - Airmee Style */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-airmee-orange">
            C
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              CariCloud POS
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Marikina Carinderia Operating System
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 px-4 py-2 rounded-full text-xs text-slate-600 font-bold flex items-center gap-2 shadow-airmee">
          <Store className="w-4 h-4 text-orange-600" />
          <span>{settings.storeName} ({settings.branchName})</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto w-full my-auto py-12">
        
        {/* LANDING PAGE: SELECT OWNER OR EMPLOYEE LOGIN */}
        {selectedPortal === null ? (
          <div className="space-y-10 text-center max-w-2xl mx-auto animate-fadeIn">
            
            <div className="space-y-4">
              <span className="bg-orange-50 text-orange-600 border border-orange-200/60 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                Account Access Portal
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome to CariCloud POS
              </h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
                Please select your login type below to access your designated Scandinavian-styled workspace.
              </p>
            </div>

            {/* Portal Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              
              {/* Option 1: Login as Owner */}
              <button
                type="button"
                onClick={() => handleSelectPortal('ADMIN')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-orange-500 transition-all duration-300 shadow-airmee hover:shadow-airmee-hover text-left flex flex-col justify-between space-y-8 cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Crown className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      Store Proprietor
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      Login as Owner
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium">
                      Access store management, menu pricing, BPLO tax relief tracking, and the complete Listahan (Utang) credit ledger.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-extrabold text-orange-600 group-hover:translate-x-1 transition-transform">
                  <span>CONTINUE TO OWNER LOGIN</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>

              {/* Option 2: Login as Employee */}
              <button
                type="button"
                onClick={() => handleSelectPortal('CASHIER')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-slate-800 transition-all duration-300 shadow-airmee hover:shadow-airmee-hover text-left flex flex-col justify-between space-y-8 cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <UserCheck className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Shift Staff / Cashier
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2">
                      Login as Employee
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium">
                      Access active POS register, counter ordering, receipt printouts, and view customer credit repayment history.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-extrabold text-slate-800 group-hover:translate-x-1 transition-transform">
                  <span>CONTINUE TO EMPLOYEE LOGIN</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>

            </div>

            {/* Quick Action Banners */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenCreateAccount('ADMIN')}
                className="px-6 py-3 bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 text-slate-700 hover:text-orange-600 text-xs font-extrabold rounded-full transition shadow-airmee flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-orange-600" />
                <span>Don't have an account yet? Create an Account</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAcceptInvitation}
                className="px-6 py-3 bg-orange-50 border border-orange-200/80 hover:border-orange-500 hover:bg-orange-100/60 text-orange-900 text-xs font-extrabold rounded-full transition shadow-airmee flex items-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-orange-600" />
                <span>Have an Employee Invitation? Accept Here</span>
              </button>
            </div>


          </div>
        ) : (
          /* LOGIN FORM SCREEN FOR SELECTED ROLE */
          <div className="max-w-md mx-auto w-full animate-fadeIn space-y-4">
            
            <button
              type="button"
              onClick={() => setSelectedPortal(null)}
              className="text-xs font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1.5 mb-2 cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Selection</span>
            </button>

            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-airmee space-y-6">
              
              <div className="text-center space-y-2">
                <span className={`text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block border ${
                  selectedPortal === 'ADMIN'
                    ? 'bg-orange-50 text-orange-600 border-orange-200/60'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {selectedPortal === 'ADMIN' ? 'OWNER LOGIN PORTAL' : 'EMPLOYEE LOGIN PORTAL'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedPortal === 'ADMIN' ? 'Owner Sign In' : 'Employee Sign In'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter your registered {selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'} username or email and password.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Username or Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {selectedPortal === 'ADMIN' ? 'Owner Username or Email' : 'Employee Username or Email'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder={selectedPortal === 'ADMIN' ? 'e.g. owner@caricloud.ph or atemaria' : 'e.g. cashier@caricloud.ph or juana'}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 bg-slate-50/50"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setForgotStep(1);
                        setForgotError('');
                        setForgotSuccess('');
                        if (identifier) setResetEmail(identifier);
                      }}
                      className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 bg-slate-50/50"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button - Airmee Pill Style */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-full text-sm shadow-airmee-orange transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>LOG IN AS {selectedPortal === 'ADMIN' ? 'OWNER' : 'EMPLOYEE'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Create an Account Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateAccount(selectedPortal)}
                    className="w-full py-3 bg-slate-100 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-slate-800 hover:text-orange-600 font-extrabold rounded-full text-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4 text-orange-600" />
                    <span>Create an Account ({selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'})</span>
                  </button>
                </div>

              </form>

              {/* Quick Demo Accounts Helper for the Selected Portal */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 block text-center uppercase tracking-wider">
                  Quick Demo Accounts ({selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'})
                </span>

                <div className="space-y-2">
                  {filteredDemoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="w-full p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-orange-500 text-left flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          {selectedPortal === 'ADMIN' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{acc.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {acc.email} • Pass: <code className="font-mono text-slate-800 font-bold">{acc.password || 'password123'}</code>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-orange-600">
                        Auto-Fill
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-airmee-hover max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Reset Password
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Step {forgotStep} of 3 • Email Code
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Enter your registered account email or username. A 6-digit verification code will be generated to verify your identity.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. owner@caricloud.ph or juana"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-airmee-orange cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reset Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify Code */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                
                {/* Simulated Email Notice */}
                <div className="p-3 bg-orange-50/80 border border-orange-200/60 rounded-2xl text-xs text-orange-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-orange-600" />
                    <span>Simulated Email Sent ({targetResetUser?.email})</span>
                  </div>
                  <p className="font-medium">
                    Code: <strong className="font-mono text-base text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200">{generatedCode}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Enter 6-Digit Email Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    className="w-full font-mono text-center tracking-widest text-2xl font-black px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-airmee-orange cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Enter new password for <strong>{targetResetUser?.name}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full shadow-airmee-orange cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SAVE NEW PASSWORD & LOGIN</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-airmee-hover max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Create New Account
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Register a new Store Owner or Employee Cashier
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Role Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Account Type / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={selectedPortal === 'CASHIER'}
                    onClick={() => {
                      if (selectedPortal === 'CASHIER') {
                        setRegError('Illegal Owner Account Prevention: Store Owner (ADMIN) role selection is hard-locked in Employee portal.');
                      } else {
                        setRegRole('ADMIN');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition border ${
                      selectedPortal === 'CASHIER'
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                        : regRole === 'ADMIN'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange cursor-pointer'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Store Owner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('CASHIER')}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                      regRole === 'CASHIER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-airmee'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Employee</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={regRole === 'ADMIN' ? 'e.g. Maria Santos (Owner)' : 'e.g. Juana Dela Cruz'}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@caricloud.ph"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Username (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mariasantos"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  4-Digit Security PIN (For quick counter access)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-28 font-mono text-center tracking-widest text-base font-extrabold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Error Banner */}
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full shadow-airmee-orange transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Accept Employee Invitation Modal */}
      {isAcceptInvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-airmee-hover max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Accept Employee Invitation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {invStep === 1 ? 'Step 1: Verify Invitation Token' : 'Step 2: Set Password & Activate Account'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAcceptInvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Enter & Verify Token */}
            {invStep === 1 && (
              <form onSubmit={handleVerifyInvToken} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Enter the invitation token provided by your Store Owner to activate your employee cashier account.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Invitation Token *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. inv_a1b2c3d4e5"
                    value={invToken}
                    onChange={(e) => setInvToken(e.target.value)}
                    className="w-full font-mono px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                {invError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{invError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAcceptInvModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingInv}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full shadow-airmee-orange transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{isVerifyingInv ? 'Verifying...' : 'Verify Token'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Set Password & Full Name */}
            {invStep === 2 && (
              <form onSubmit={handleAcceptInvSubmit} className="space-y-4">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <span>Invitation Verified</span>
                  </div>
                  <p className="mt-0.5 font-medium">
                    Target Email: <strong>{invEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juana Dela Cruz"
                    value={invFullName}
                    onChange={(e) => setInvFullName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Username (for Login)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. juana"
                    value={invUsername}
                    onChange={(e) => setInvUsername(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Set Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={invPassword}
                      onChange={(e) => setInvPassword(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={invConfirmPassword}
                      onChange={(e) => setInvConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {invError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{invError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInvStep(1)}
                    className="text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingInvAccept}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full shadow-airmee-orange transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingInvAccept ? 'Activating...' : 'Accept Invitation & Activate'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 pt-8 border-t border-slate-100 font-medium">
        <p>CariCloud POS System • Marikina City SME Ordinance No. 2026-018 Compliant</p>
      </div>

    </div>
  );
};

