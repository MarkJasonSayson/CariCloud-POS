import React from 'react';
import { StoreSettings } from '../types';

interface LandingPageProps {
  settings: StoreSettings;
  onNavigateToLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ settings, onNavigateToLogin }) => {
  const triggerGateway = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateToLogin();
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#111827] font-sans overflow-x-hidden selection:bg-[#E65100] selection:text-white">
      
      {/* 🌊 Ambient Colliding Mesh Background (5 Blobs with calc viewport bouncing) */}
      <div className="fixed top-0 left-0 w-[100vw] h-[100vh] overflow-hidden z-0 pointer-events-none bg-[#FAFAFA]" aria-hidden="true">
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
            <div className="w-[38px] h-[38px] bg-[#111827] text-white rounded-full flex items-center justify-center font-bold text-lg">
              C
            </div>
            <div>
              <div className="text-[18px] tracking-tight text-[#111827] font-normal leading-tight">
                CariCloud<strong className="text-[#E65100] font-extrabold">POS</strong>
              </div>
              <span className="block text-[9px] tracking-[0.8px] text-[#6B7280] font-semibold uppercase">
                INTERNAL ENTERPRISE EDITION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-1.5 bg-white/90 backdrop-blur-xs border border-[#E5E7EB] px-3.5 py-1.5 rounded-full text-xs font-medium text-[#374151]">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
              Marikina SME Ordinance Compliant
            </span>
            <button
              onClick={triggerGateway}
              className="bg-[#111827] hover:bg-[#1F2937] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer"
            >
              Internal Gateway &rsaquo;
            </button>
          </div>
        </header>

        {/* Hero Content */}
        <main className="text-center flex flex-col items-center">
          
          <div className="reveal-item delay-2 inline-flex items-center gap-1.5 bg-[#FFF3E0] border border-[#FFE0B2] text-[#D9480F] text-[11px] font-bold px-4 py-1.5 rounded-full tracking-[0.5px] mb-7">
            <span>&#9889;</span> INTERNAL CAFETERIA MANAGEMENT SYSTEM
          </div>

          <h1 className="reveal-item delay-3 text-4xl sm:text-6xl md:text-[64px] leading-[1.08] tracking-[-2px] font-extrabold text-[#0F172A] mb-6 max-w-4xl">
            Total Control Over Your<br className="hidden sm:inline" /> Carinderia Operations.
          </h1>

          <p className="reveal-item delay-4 max-w-[680px] text-base sm:text-[17px] leading-[1.6] text-[#4B5563] mb-10">
            Replace manual paper notebooks and accelerate peak-hour counter throughput with an internal POS engineered specifically for Marikina's food micro-enterprises.
          </p>

          <div className="reveal-item delay-5 flex items-center gap-5 mb-16">
            <button
              onClick={triggerGateway}
              className="bg-[#E65100] hover:bg-[#D84315] text-white text-sm font-bold px-7 py-3.5 rounded-xl tracking-[0.2px] shadow-[0_4px_14px_rgba(230,81,0,0.35)] transition-all duration-150 cursor-pointer hover:-translate-y-0.5"
            >
              LAUNCH POS GATEWAY &rarr;
            </button>
            <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <span>&#128274;</span> Encrypted Multi-Tenant Hierarchy
            </div>
          </div>

          {/* Feature Teaser Grid */}
          <section className="reveal-item delay-6 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[1080px] text-left">
            <article className="bg-white/90 backdrop-blur-xs border border-[#F3F4F6] rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="text-lg mb-4">&#128214;</div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Digital "Listahan" Ledger</h3>
              <p className="text-xs leading-[1.5] text-[#6B7280]">
                Eliminate lost paper notes. Track customer credit limits and cash repayments with full operational audit trails.
              </p>
            </article>

            <article className="bg-white/90 backdrop-blur-xs border border-[#F3F4F6] rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="text-lg mb-4">&#9889;</div>
              <h3 className="text-base font-bold text-[#111827] mb-2">High-Speed Peak Counter</h3>
              <p className="text-xs leading-[1.5] text-[#6B7280]">
                Process full and half-portion dish orders in seconds with Senior/PWD statutory discount calculations.
              </p>
            </article>

            <article className="bg-white/90 backdrop-blur-xs border border-[#F3F4F6] rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="text-lg mb-4">&#128737;</div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Marikina BPLO Compliance</h3>
              <p className="text-xs leading-[1.5] text-[#6B7280]">
                Real-time gross annual revenue tracking against statutory tax relief thresholds (&#8369;250,000 exemption cap).
              </p>
            </article>
          </section>

        </main>

      </div>
    </div>
  );
};
