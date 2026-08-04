import React from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { SubscriptionTierLevel } from '../types';

interface SubscriptionModuleProps {
  activeTier: SubscriptionTierLevel;
  onSelectTier: (tier: SubscriptionTierLevel) => void;
}

export const SubscriptionModule: React.FC<SubscriptionModuleProps> = ({
  activeTier,
  onSelectTier,
}) => {
  const plans = [
    {
      level: 1 as SubscriptionTierLevel,
      name: 'Core Eatery POS',
      price: '₱49',
      period: '/ month',
      description: 'Essential high-speed carinderia counter operations for solo owners and micro-eateries.',
      badge: 'Starter Micro-Plan',
      highlight: false,
      features: [
        { text: '3-Tap High-Speed POS Counter', included: true },
        { text: 'Standard End-of-Day (EOD) Reconciliation', included: true },
        { text: 'Statutory 20% Senior & PWD Discount + VAT Exemption', included: true },
        { text: 'Digital Customer Listahan (Utang Ledger)', included: true },
        { text: 'IndexedDB Offline Transaction Sync', included: true },
        { text: 'Custom UI Theme Personalization', included: false },
        { text: 'Marikina ₱250k Tax Relief Tracker', included: false },
        { text: 'Automated BPLO Sales Form Generation', included: false },
      ],
    },
    {
      level: 2 as SubscriptionTierLevel,
      name: 'Custom Pro Brand',
      price: '₱99',
      period: '/ month',
      description: 'Adds store layout personalization, custom brand colors, and multi-tenant cashier profile controls.',
      badge: 'Most Popular for Eateries',
      highlight: true,
      features: [
        { text: 'Everything in Tier 1 (Core POS & Listahan)', included: true },
        { text: 'Internal UI Personalization (Themes: Orange, Amber, Emerald, Slate)', included: true },
        { text: 'Custom Store Branding & Receipt Header Personalization', included: true },
        { text: 'Multi-Tenant Cashier Role & PIN Security Governance', included: true },
        { text: 'IndexedDB Offline Transaction Sync', included: true },
        { text: 'Marikina ₱250k Tax Relief Tracker', included: false },
        { text: 'Automated BPLO Sales Form Generation', included: false },
      ],
    },
    {
      level: 3 as SubscriptionTierLevel,
      name: 'Marikina Tax Complete',
      price: '₱199',
      period: '/ month',
      description: 'Full operational suite including Marikina municipal tax relief compliance tracking and BPLO declaration generator.',
      badge: 'Legal & Compliance Ready',
      highlight: false,
      features: [
        { text: 'Everything in Tier 1 & Tier 2', included: true },
        { text: 'Marikina ₱250,000 Municipal Tax Relief Tracker', included: true },
        { text: 'Automated Sworn BPLO Sales Tax Declaration Generator', included: true },
        { text: 'Official Printable BPLO Forms matching City Hall Specs', included: true },
        { text: 'Priority PayMongo QR Ph Webhook Verification Engine', included: true },
        { text: 'Full Multi-Tenant Security Governance', included: true },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          SaaS Tier Governance
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Flexible Pricing for Marikina Micro-Eateries
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          Select a subscription tier suited for your eatery. Upgrade or switch plans instantly.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = activeTier === plan.level;

          return (
            <div
              key={plan.level}
              className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                plan.highlight
                  ? 'border-2 border-orange-500 shadow-airmee-orange'
                  : 'border border-slate-100 shadow-airmee hover:shadow-airmee-hover'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-black text-[10px] uppercase px-4 py-1 rounded-full shadow-airmee-orange tracking-widest whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Tier {plan.level}
                  </span>
                  {isCurrent && (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active Plan
                    </span>
                  )}
                </div>

                <h3 className="font-black text-slate-900 text-xl tracking-tight">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[2.5rem] leading-relaxed font-medium">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="py-4 border-y border-slate-100 my-4 flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                  <span className="text-slate-400 font-extrabold text-xs">{plan.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 text-xs text-slate-700">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start space-x-2.5">
                      {f.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                          <X className="w-3 h-3 stroke-[2]" />
                        </div>
                      )}
                      <span className={f.included ? 'font-medium text-slate-800' : 'text-slate-400 line-through'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectTier(plan.level)}
                  className={`w-full py-3.5 rounded-full font-black text-xs transition flex items-center justify-center space-x-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-800 border border-slate-200/80 cursor-default'
                      : plan.highlight
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-airmee-orange active:scale-[0.98]'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-airmee active:scale-[0.98]'
                  }`}
                >
                  <span>{isCurrent ? 'Current Active Tier' : `Select Tier ${plan.level} (${plan.price})`}</span>
                  {!isCurrent && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
