import React from 'react';
import { 
  Store, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert, 
  Sparkles, 
  LogOut,
  ChevronDown,
  Receipt,
  Moon,
  Sun
} from 'lucide-react';
import { StoreSettings, UserProfile, Role } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  currentUser: UserProfile;
  isOnline: boolean;
  pendingSyncCount: number;
  onSyncTrigger: () => void;
  onSwitchUser: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  isOnline,
  pendingSyncCount,
  onSyncTrigger,
  onSwitchUser,
  activeTab,
  setActiveTab,
}) => {
  const isOwner = currentUser.role === 'ADMIN';

  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const navItems = [
    { id: 'pos', label: 'POS Counter', badge: null },
    { 
      id: 'receipts', 
      label: 'Receipts Archive', 
      badge: 'Shared' 
    },
    { 
      id: 'menu', 
      label: 'Menu & Stock', 
      badge: !isOwner ? 'Read Only' : null 
    },
    { 
      id: 'listahan', 
      label: 'Credit Ledger', 
      badge: null
    },
    ...(isOwner ? [{ id: 'eod', label: 'EOD Audit', badge: null }] : []),
    ...(isOwner ? [{ 
      id: 'bplo', 
      label: 'Marikina Tax Relief', 
      tierLock: settings.activeTier < 3 ? 'Tier 3' : null 
    }] : []),
    ...(isOwner ? [{ id: 'subscription', label: 'Plans (SaaS)', badge: '₱49-₱199' }] : []),
    ...(isOwner ? [{ id: 'settings', label: 'Settings', badge: null }] : []),
  ];

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 dark:border-slate-800">
        
        {/* Brand Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-lg shadow-airmee-orange tracking-tight">
            C
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">CariCloud</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                {settings.storeName}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5 font-medium">
              <span>{settings.branchName}</span>
              <span>•</span>
              <span className="text-slate-400 dark:text-slate-500">BPLO: {settings.bploPermitNo}</span>
            </p>
          </div>
        </div>

        {/* Operational Status Controls */}
        <div className="flex items-center space-x-2.5 ml-auto sm:ml-0">
          
          {/* Offline Sync Status Badge */}
          <div className="flex items-center">
            {isOnline ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                Online
              </span>
            ) : (
              <button
                onClick={onSyncTrigger}
                className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition cursor-pointer"
                title="Click to attempt manual sync with CariCloud Server"
              >
                <WifiOff className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-pulse" />
                Offline ({pendingSyncCount} DB)
                <RefreshCw className="w-3 h-3 ml-1.5 opacity-80" />
              </button>
            )}
          </div>

          {/* SaaS Tier Badge */}
          <button 
            onClick={() => {
              if (isOwner) {
                setActiveTab('subscription');
              } else {
                alert('Access Restricted: Subscription Plans (SaaS) management is available for Store Owners only.');
              }
            }}
            className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50/80 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 px-3 py-1 rounded-full text-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-extrabold text-orange-600">Tier {settings.activeTier}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
              ({settings.activeTier === 1 ? '₱49' : settings.activeTier === 2 ? '₱99' : '₱199'})
            </span>
          </button>

          {/* Universal Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200/60 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* User Account & Operator Switcher */}
          <div className="flex items-center space-x-2 border-l border-slate-100 dark:border-slate-800 pl-3">
            <button
              onClick={onSwitchUser}
              className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer"
              title="Click to Switch Account or Sign Out"
            >
              <UserCheck className="w-3.5 h-3.5 text-orange-600" />
              <div className="text-left">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 leading-tight">
                  <span>{currentUser.name}</span>
                  <LogOut className="w-3 h-3 text-slate-400 ml-0.5" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentUser.role === 'ADMIN' ? 'Owner' : 'Cashier'}
                </div>
              </div>
            </button>
          </div>

        </div>

      </div>

      {/* Primary Navigation Tabs - Airmee Pill Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-airmee-orange scale-[1.02]'
                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.tierLock && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {item.tierLock}
                  </span>
                )}
                {item.badge && !item.tierLock && (
                  <span className={`text-[9px] px-2 py-0.2 rounded-full font-medium ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

