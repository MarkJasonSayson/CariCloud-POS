import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { StoreSettings } from '../types';

interface LandingPageProps {
  settings: StoreSettings;
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, onNavigateToLogin }) => {
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

  useEffect(() => {
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

  useEffect(() => {
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

  const triggerGateway = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateToLogin();
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] dark:bg-black text-[#111827] dark:text-slate-100 font-sans overflow-x-hidden selection:bg-[#E65100] selection:text-white">
      
      {/* 🌊 Ambient Colliding Mesh Background (5 Blobs with calc viewport bouncing) */}
      <div className="fixed top-0 left-0 w-[100vw] h-[100vh] overflow-hidden z-0 pointer-events-none bg-[#FAFAFA] dark:bg-black" aria-hidden="true">
        <style>{`
          .blob {
            position: absolute;
            border-radius: 50%;
            opacity: 0.55;
            filter: blur(100px);
            will-change: transform;
          }

          /* Blob 1: Top-Left to Bottom-Right */
          .blob-1 {
            width: 380px;
            height: 380px;
            background: #FFE0B2;
            top: 0;
            left: 0;
            animation: bounce1 24s infinite alternate ease-in-out;
          }
          @keyframes bounce1 {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(calc(100vw - 380px), calc(100vh - 380px)) scale(1.15); }
          }

          /* Blob 2: Bottom-Right to Top-Left */
          .blob-2 {
            width: 440px;
            height: 440px;
            background: #F57C00;
            bottom: 0;
            right: 0;
            animation: bounce2 28s infinite alternate ease-in-out;
          }
          @keyframes bounce2 {
            0% { transform: translate(0, 0) scale(1.1); }
            100% { transform: translate(calc(-100vw + 440px), calc(-100vh + 440px)) scale(0.95); }
          }

          /* Blob 3: Top-Right to Center-Left */
          .blob-3 {
            width: 320px;
            height: 320px;
            background: #E65100;
            top: 0;
            right: 0;
            animation: bounce3 22s infinite alternate ease-in-out;
          }
          @keyframes bounce3 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(calc(-70vw + 320px), calc(80vh - 320px)); }
          }

          /* Blob 4: Bottom-Left to Top-Center */
          .blob-4 {
            width: 360px;
            height: 360px;
            background: #FFB74D;
            bottom: 0;
            left: 0;
            animation: bounce4 26s infinite alternate ease-in-out;
          }
          @keyframes bounce4 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(calc(60vw - 360px), calc(-90vh + 360px)); }
          }

          /* Blob 5: Center Drift & Pulsing */
          .blob-5 {
            width: 500px;
            height: 500px;
            background: #FFF3E0;
            top: 50%;
            left: 50%;
            margin-top: -250px;
            margin-left: -250px;
            animation: bounce5 32s infinite alternate ease-in-out;
          }
          @keyframes bounce5 {
            0% { transform: translate(0, 0) scale(0.85); }
            50% { transform: translate(calc(20vw), calc(-20vh)) scale(1.1); }
            100% { transform: translate(calc(-25vw), calc(20vh)) scale(0.95); }
          }

          /* Staggered Entrance Keyframes */
          .reveal-item {
            opacity: 0;
            transform: translateY(24px);
            animation: entranceReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          @keyframes entranceReveal {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .delay-1 { animation-delay: 0.05s; }
          .delay-2 { animation-delay: 0.15s; }
          .delay-3 { animation-delay: 0.25s; }
          .delay-4 { animation-delay: 0.35s; }
          .delay-5 { animation-delay: 0.45s; }
          .delay-6 { animation-delay: 0.55s; }
        `}</style>
        
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>

      {/* 🖼️ Main Viewport Content Wrapper */}
      <div className="max-w-[1240px] mx-auto px-6 py-6 sm:px-8 sm:py-8 relative z-10">
        
        {/* Top Navigation */}
        <header className="flex justify-between items-center mb-14 reveal-item delay-1">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] bg-[#111827] dark:bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-xs">
              C
            </div>
            <div>
              <div className="text-[18px] tracking-tight text-[#111827] dark:text-white font-normal leading-tight">
                CariCloud<strong className="text-[#E65100] font-extrabold">POS</strong>
              </div>
              <span className="block text-[9px] tracking-[0.8px] text-[#6B7280] dark:text-slate-400 font-semibold uppercase">
                INTERNAL ENTERPRISE EDITION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Universal Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center shadow-xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            <button
              onClick={triggerGateway}
              className="bg-[#111827] hover:bg-[#1F2937] dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer"
            >
              Internal Gateway &rsaquo;
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <main className="text-center flex flex-col items-center">
          
          <div className="reveal-item delay-2 inline-flex items-center gap-1.5 bg-[#FFF3E0] dark:bg-orange-950/40 border border-[#FFE0B2] dark:border-orange-800/40 text-[#D9480F] dark:text-orange-400 text-[11px] font-bold px-4 py-1.5 rounded-full tracking-[0.5px] mb-7">
            <span>&#9889;</span> INTERNAL CAFETERIA MANAGEMENT SYSTEM
          </div>

          <h1 className="reveal-item delay-3 text-4xl sm:text-6xl md:text-[64px] leading-[1.08] tracking-[-2px] font-extrabold text-[#0F172A] dark:text-white mb-6 max-w-4xl">
            Total Control Over Your<br className="hidden sm:inline" /> Carinderia Operations.
          </h1>

          <p className="reveal-item delay-4 max-w-[680px] text-base sm:text-[17px] leading-[1.6] text-[#4B5563] dark:text-slate-300 mb-10">
            Replace manual paper notebooks and accelerate peak-hour counter throughput with an internal POS engineered specifically for Marikina's food micro-enterprises.
          </p>

          <div className="reveal-item delay-5 flex items-center justify-center mb-16">
            <button
              onClick={triggerGateway}
              className="bg-[#E65100] hover:bg-[#D84315] text-white text-sm font-bold px-7 py-3.5 rounded-xl tracking-[0.2px] shadow-[0_4px_14px_rgba(230,81,0,0.35)] transition-all duration-150 cursor-pointer hover:-translate-y-0.5"
            >
              LAUNCH POS GATEWAY &rarr;
            </button>
          </div>

        </main>

      </div>

      {/* Account Deletion Success Modal */}
      {showDeletedModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
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
