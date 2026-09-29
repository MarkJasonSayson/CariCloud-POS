import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  UserPlus,
  Moon,
  Sun
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
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { accountDeleted?: boolean; deletedUserId?: string } | null;

  const [showDeletedModal, setShowDeletedModal] = useState<boolean>(false);
  const [deletedUserId, setDeletedUserId] = useState<string>('');

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      window.document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      window.document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  React.useEffect(() => {
    if (locationState?.accountDeleted) {
      setShowDeletedModal(true);
      setDeletedUserId(locationState.deletedUserId || '');
    }
  }, [locationState]);

  const handleConfirmDeleted = () => {
    setShowDeletedModal(false);
    navigate(location.pathname, { replace: true, state: {} });
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

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
  const [otp, setOtp] = useState<string>('');
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


  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

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

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: regEmail, password: regPassword, role: regRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || data.message || 'Registration failed.');
        return;
      }

      alert(data.message || 'Account created successfully! You can now log in.');
      setIsCreateModalOpen(false);
      setRegError('');
      setSelectedPortal(regRole);
      setIdentifier(regEmail);
      setPassword('');
    } catch (err: any) {
      console.error('Registration error:', err);
      setRegError(err.message || 'Failed to connect to registration server. Please try again.');
    }
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedPortal) return;

    const query = identifier.trim().toLowerCase();
    if (!query || !password) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }

    try {
      // Send login data to our real Node.js backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: query,
          password: password,
          portal: selectedPortal
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      // Success! Pass the real database user back to the app
      onLoginSuccess(data.user);

    } catch (err: any) {
      console.error('Login request failed:', err);
      setErrorMsg('Network error. Failed to connect to the server.');
    }
  };

  // --- FORGOT PASSWORD HANDLERS (EXPRESS API & NODEMAILER INTEGRATED) ---
  const [isForgotLoading, setIsForgotLoading] = useState<boolean>(false);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const query = resetEmail.trim().toLowerCase();
    if (!query) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: query }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Failed to dispatch verification email.');
        setIsForgotLoading(false);
        return;
      }

      setOtp('');
      setForgotStep(2);
      setForgotSuccess(data.message || 'If this email exists, a verification code has been sent.');
    } catch (err: any) {
      console.error('Nodemailer / Network Error:', err);
      setForgotError('Failed to send verification email. Please check server mail configuration or try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const inputCode = otp.trim();
    if (!inputCode || inputCode.length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setForgotError('Password must be at least 4 characters long.');
      return;
    }

    setIsForgotLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: inputCode,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Invalid or expired verification code.');
        setIsForgotLoading(false);
        return;
      }

      // Update local state if user is found in staffAccounts
      const found = staffAccounts.find(
        (acc) => acc.email?.toLowerCase() === resetEmail.trim().toLowerCase() || acc.username?.toLowerCase() === resetEmail.trim().toLowerCase()
      );
      if (found) {
        const updatedAccounts = staffAccounts.map((acc) =>
          acc.id === found.id ? { ...acc, password: newPassword } : acc
        );
        onUpdateStaffAccounts(updatedAccounts);
      }

      // Pre-fill login credentials
      setIdentifier(resetEmail.trim());
      setPassword(newPassword);

      alert('Password reset successful! You can now log in with your new password.');
      setIsForgotModalOpen(false);
      setForgotStep(1);
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setForgotError('Failed to reset password. Please check your connection and try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const filteredDemoAccounts = staffAccounts.filter((acc) =>
    selectedPortal === 'ADMIN' ? acc.role === 'ADMIN' : acc.role === 'CASHIER'
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 md:p-12 font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">

      {/* Top Brand Header - Airmee Style */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-airmee-orange">
            C
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              CariCloud POS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Marikina Carinderia Operating System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Universal Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center shadow-airmee"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 px-4 py-2 rounded-full text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2 shadow-airmee">
            <Store className="w-4 h-4 text-orange-600" />
            <span>{settings.storeName} ({settings.branchName})</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto w-full my-auto py-12">

        {/* LANDING PAGE: SELECT OWNER OR EMPLOYEE LOGIN */}
        {selectedPortal === null ? (
          <div className="space-y-10 text-center max-w-2xl mx-auto animate-fadeIn">

            <div className="space-y-4">
              <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block">
                Account Access Portal
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Welcome to CariCloud POS
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
                Please select your login type below to access your designated Scandinavian-styled workspace.
              </p>
            </div>

            {/* Portal Choice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">

              {/* Option 1: Login as Owner */}
              <button
                type="button"
                onClick={() => handleSelectPortal('ADMIN')}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-300 shadow-airmee hover:shadow-airmee-hover text-left flex flex-col justify-between space-y-8 cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Crown className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-3 py-1 rounded-full uppercase tracking-wider">
                      Store Proprietor
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                      Login as Owner
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                      Access store management, menu pricing, BPLO tax relief tracking, and the complete Listahan (Utang) credit ledger.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-extrabold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
                  <span>CONTINUE TO OWNER LOGIN</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>

              {/* Option 2: Login as Employee */}
              <button
                type="button"
                onClick={() => handleSelectPortal('CASHIER')}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 hover:border-slate-800 dark:hover:border-slate-600 transition-all duration-300 shadow-airmee hover:shadow-airmee-hover text-left flex flex-col justify-between space-y-8 cursor-pointer hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold group-hover:bg-slate-900 dark:group-hover:bg-slate-700 group-hover:text-white transition-colors">
                    <UserCheck className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                      Shift Staff / Cashier
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                      Login as Employee
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 font-medium">
                      Access active POS register, counter ordering, receipt printouts, and view customer credit repayment history.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:translate-x-1 transition-transform">
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
                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-extrabold rounded-full transition shadow-airmee flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Don't have an account yet? Create an Account</span>
              </button>
            </div>


          </div>
        ) : (
          /* LOGIN FORM SCREEN FOR SELECTED ROLE */
          <div className="max-w-md mx-auto w-full animate-fadeIn space-y-4">

            <button
              type="button"
              onClick={() => setSelectedPortal(null)}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-1.5 mb-2 cursor-pointer transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Selection</span>
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-airmee space-y-6">

              <div className="text-center space-y-2">
                <span className={`text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block border ${selectedPortal === 'ADMIN'
                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/60'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}>
                  {selectedPortal === 'ADMIN' ? 'OWNER LOGIN PORTAL' : 'EMPLOYEE LOGIN PORTAL'}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedPortal === 'ADMIN' ? 'Owner Sign In' : 'Employee Sign In'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Enter your registered {selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'} username or email and password.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">

                {/* Username or Email Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
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
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-400"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setForgotStep(1);
                        setOtp('');
                        setNewPassword('');
                        setForgotError('');
                        setForgotSuccess('');
                        if (identifier) setResetEmail(identifier);
                      }}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
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
                      className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-400"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
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
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 hover:border-orange-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 font-extrabold rounded-full text-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span>Create an Account ({selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'})</span>
                  </button>
                </div>

              </form>

              {/* Quick Demo Accounts Helper for the Selected Portal */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block text-center uppercase tracking-wider">
                  Quick Demo Accounts ({selectedPortal === 'ADMIN' ? 'Owner' : 'Employee'})
                </span>

                <div className="space-y-2">
                  {filteredDemoAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="w-full p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-orange-500 dark:hover:border-orange-500 text-left flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                          {selectedPortal === 'ADMIN' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">{acc.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {acc.email} • Pass: <code className="font-mono text-slate-800 dark:text-slate-200 font-bold">{acc.password || 'password123'}</code>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-orange-600 dark:text-orange-400">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-airmee-hover max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 dark:border-slate-800 animate-fadeIn">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <RefreshCw className={`w-4 h-4 ${isForgotLoading ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Password Recovery
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {forgotStep === 1 ? 'View A: Request 6-Digit Verification OTP' : 'View B: Enter OTP & New Password'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* VIEW A: Input field for account email address */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Enter your registered account email. A secure 6-digit verification code will be sent to your email inbox (expires in 15 minutes).
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Account Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. owner@caricloud.ph or cashier@caricloud.ph"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-2xl text-xs font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-airmee-orange cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isForgotLoading ? 'Sending...' : 'SEND 6-DIGIT OTP'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* VIEW B: Two input fields for 6-digit OTP & new password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Please check your inbox. Enter the 6-digit verification code sent to your email.
                </p>

                {/* 1. 6-Digit OTP Code Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    6-Digit Verification Code (OTP) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full font-mono text-center tracking-[8px] text-2xl font-black px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* 2. New Password Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    New Account Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 4 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setOtp('');
                    }}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-airmee-orange cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isForgotLoading ? 'Resetting...' : 'RESET PASSWORD & LOGIN'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-airmee-hover max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-100 dark:border-slate-800 animate-fadeIn max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Create New Account
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Register a new Store Owner or Employee Cashier
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">

              {/* Role Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
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
                    className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition border ${selectedPortal === 'CASHIER'
                      ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                      : regRole === 'ADMIN'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange cursor-pointer'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Store Owner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('CASHIER')}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer border ${regRole === 'CASHIER'
                      ? 'bg-slate-900 dark:bg-orange-600 text-white border-slate-900 dark:border-orange-600 shadow-airmee'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Employee</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={regRole === 'ADMIN' ? 'e.g. Maria Santos (Owner)' : 'e.g. Juana Dela Cruz'}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@caricloud.ph"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Username (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mariasantos"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                  />
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  4-Digit Security PIN (For quick counter access)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value)}
                  className="w-28 font-mono text-center tracking-widest text-base font-extrabold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400"
                />
              </div>

              {/* Error Banner */}
              {regError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
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



      {/* Footer Info */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 dark:text-slate-500 pt-8 border-t border-slate-100 dark:border-slate-800 font-medium">
        <p>CariCloud POS System • Marikina City SME Ordinance No. 2026-018 Compliant</p>
      </div>

      {/* Account Deletion Success Modal */}
      {showDeletedModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              Account for {deletedUserId} deleted.
            </p>
            <button
              type="button"
              onClick={handleConfirmDeleted}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-xs"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

