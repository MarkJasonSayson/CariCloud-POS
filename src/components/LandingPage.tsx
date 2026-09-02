import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Store, 
  Lock,
  ChevronRight
} from 'lucide-react';
import { StoreSettings } from '../types';

interface LandingPageProps {
  settings: StoreSettings;
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, onNavigateToLogin }) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col selection:bg-orange-600 selection:text-white relative overflow-hidden">
      
      {/* 🎨 CSS-Only Animations: Staggered Y-Axis Text Reveal & Ambient Fluid Mesh Gradient */}
      <style>{`
        /* 1. Hero Staggered Y-Axis Text Reveal Keyframes */
        @keyframes staggerYReveal {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-stagger-1 {
          animation: staggerYReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          opacity: 0;
        }

        .animate-stagger-2 {
          animation: staggerYReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
          opacity: 0;
        }

        .animate-stagger-3 {
          animation: staggerYReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }

        .animate-stagger-4 {
          animation: staggerYReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
          opacity: 0;
        }

        .animate-stagger-5 {
          animation: staggerYReveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
          opacity: 0;
        }

        /* 2. Fluid Mesh Gradient (Lava Lamp Blob Movement) Keyframes */
        @keyframes fluidBlob1 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(140px, 90px) scale(1.15);
          }
          66% {
            transform: translate(-80px, 160px) scale(0.9);
          }
          100% {
            transform: translate(100px, -50px) scale(1.05);
          }
        }

        @keyframes fluidBlob2 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(-160px, -110px) scale(0.85);
          }
          66% {
            transform: translate(90px, -130px) scale(1.2);
          }
          100% {
            transform: translate(-110px, 70px) scale(0.95);
          }
        }

        @keyframes fluidBlob3 {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(100px, -120px) scale(1.1);
          }
          66% {
            transform: translate(-120px, 80px) scale(0.92);
          }
          100% {
            transform: translate(70px, 130px) scale(1.08);
          }
        }

        .animate-fluid-blob-1 {
          animation: fluidBlob1 18s ease-in-out infinite alternate;
        }

        .animate-fluid-blob-2 {
          animation: fluidBlob2 22s ease-in-out infinite alternate;
        }

        .animate-fluid-blob-3 {
          animation: fluidBlob3 20s ease-in-out infinite alternate;
        }
      `}</style>

      {/* 🌊 Ambient Fluid Mesh Gradient Container (Lava Lamp Effect) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Blob 1: Soft Amber / Cream Base */}
        <div 
          className="absolute -top-24 -left-20 w-[550px] h-[550px] rounded-full opacity-30 blur-[120px] animate-fluid-blob-1"
          style={{ backgroundColor: '#FFF3E0' }}
        />
        
        {/* Blob 2: Vibrant Secondary Orange */}
        <div 
          className="absolute top-1/4 -right-28 w-[600px] h-[600px] rounded-full opacity-25 blur-[140px] animate-fluid-blob-2"
          style={{ backgroundColor: '#F57C00' }}
        />

        {/* Blob 3: Deep Brand Orange Accent */}
        <div 
          className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full opacity-20 blur-[130px] animate-fluid-blob-3"
          style={{ backgroundColor: '#E65100' }}
        />
      </div>

      {/* 🖌️ Airmee-Inspired Minimalist Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
              CariCloud<span className="text-orange-600">POS</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
              Internal Enterprise Edition
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 backdrop-blur-xs text-slate-600 rounded-full text-xs font-semibold border border-slate-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Marikina SME Ordinance Compliant
          </span>
          <button
            onClick={onNavigateToLogin}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span>Internal Gateway</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 🖼️ Hero Section with Massive Negative Space & Airmee Typography */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 pt-12 pb-24 z-10 text-center relative">
        
        {/* Stagger 1: Operational Badge */}
        <div className="animate-stagger-1 inline-flex items-center justify-center space-x-2 mx-auto mb-8 bg-orange-50/90 border border-orange-200/80 backdrop-blur-xs px-4 py-1.5 rounded-full">
          <Zap className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="text-xs font-bold text-orange-800 tracking-wide uppercase">
            Internal Cafeteria Management System
          </span>
        </div>

        {/* Stagger 2: Oversized Hero Headline */}
        <h1 className="animate-stagger-2 text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-8 max-w-4xl mx-auto">
          Total Control Over Your Carinderia Operations.
        </h1>

        {/* Stagger 3: Internal Operations Focused Copy */}
        <p className="animate-stagger-3 text-base sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          Replace manual paper notebooks and accelerate peak-hour counter throughput with an internal POS engineered specifically for Marikina’s food micro-enterprises.
        </p>

        {/* Stagger 4: Primary CTA Button Group (Brand Orange Accent) */}
        <div className="animate-stagger-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto px-8 py-4 bg-[#E65100] hover:bg-[#FF6D00] text-white font-extrabold text-sm rounded-2xl transition-all duration-300 shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>LAUNCH POS GATEWAY</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted Multi-Tenant Hierarchy</span>
          </div>
        </div>

        {/* Stagger 5: Clean Feature Cards (Minimalist Airmee Palette) */}
        <div className="animate-stagger-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1.5">
              Digital "Listahan" Ledger
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Eliminate lost paper notes. Track customer credit limits and cash repayments with full operational audit trails.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1.5">
              High-Speed Peak Counter
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Process full and half-portion dish orders in seconds with Senior/PWD statutory discount calculations.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-1.5">
              Marikina BPLO Compliance
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Real-time gross annual revenue tracking against statutory tax relief thresholds (₱250,000 exemption cap).
            </p>
          </div>

        </div>

      </main>

      {/* 🦶 Minimalist Footer */}
      <footer className="w-full border-t border-slate-200/60 bg-white/80 backdrop-blur-xs py-8 px-6 mt-auto text-xs text-slate-400 font-medium z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-slate-400" />
            <span>CariCloud POS Engine • Marikina City SME Ordinance No. 2026-018</span>
          </div>
          <div>
            <span>Internal Enterprise Operations System</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
