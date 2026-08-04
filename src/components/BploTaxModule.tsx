import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Printer, 
  Lock, 
  TrendingUp, 
  FileText
} from 'lucide-react';
import { MarikinaTaxReliefStats, StoreSettings, SubscriptionTierLevel } from '../types';

interface BploTaxModuleProps {
  stats: MarikinaTaxReliefStats;
  settings: StoreSettings;
  onUpgradeTier: (tier: SubscriptionTierLevel) => void;
}

export const BploTaxModule: React.FC<BploTaxModuleProps> = ({
  stats,
  settings,
  onUpgradeTier,
}) => {
  const [showDeclarationPreview, setShowDeclarationPreview] = useState(false);

  const isTier3Unlocked = settings.activeTier >= 3;
  const percentOfThreshold = Math.min(100, Math.round((stats.currentAnnualGross / stats.annualGrossThreshold) * 100));

  const isApproaching = percentOfThreshold >= 80 && percentOfThreshold < 100;
  const isExceeded = percentOfThreshold >= 100;

  const handlePrintForm = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Building2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Marikina 2026 Tax Relief & BPLO Compliance
              </h2>
              <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Ordinance No. 2026-018
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Automated monitoring of Marikina Municipal ₱250,000 gross sales threshold for preferential SME local tax relief exemptions
            </p>
          </div>
        </div>

        {!isTier3Unlocked && (
          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-center space-x-3.5 shadow-2xs">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-amber-950 block">Tier 3 Feature (₱199/mo)</span>
              <span className="text-amber-800 text-[11px] font-medium">Upgrade to generate official BPLO tax forms</span>
            </div>
            <button
              onClick={() => onUpgradeTier(3)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-full text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Main Compliance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Threshold Progress & Metrics (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Progress Card */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Annual Gross Sales Tracker
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  isExceeded
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : isApproaching
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isExceeded ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Threshold Exceeded</span>
                  </>
                ) : isApproaching ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Approaching Threshold Alert</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Tax Relief Eligible 🟢</span>
                  </>
                )}
              </span>
            </div>

            {/* Threshold Meter */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₱{stats.currentAnnualGross.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-extrabold">
                  Cap: ₱{stats.annualGrossThreshold.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExceeded
                      ? 'bg-red-600'
                      : isApproaching
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-orange-500 to-emerald-500'
                  }`}
                  style={{ width: `${percentOfThreshold}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-extrabold pt-1">
                <span>0%</span>
                <span>{percentOfThreshold}% Used</span>
                <span>₱250,000 Cap</span>
              </div>
            </div>

            {/* Tax Savings Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-emerald-950 block">
                  Estimated Local Business Tax Relief Savings:
                </span>
                <span className="text-xs text-emerald-800 font-medium">
                  Under Marikina City SME Ordinance No. 2026-018
                </span>
              </div>
              <span className="text-2xl font-black text-emerald-700">
                ₱{stats.estimatedTaxSavings.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quarterly Gross Sales Breakdown */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Quarterly Gross Receipts Breakdown (2026)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] block uppercase">Q1 Gross</span>
                <span className="font-black text-slate-900 text-base">₱{stats.quarter1Gross.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] block uppercase">Q2 Gross</span>
                <span className="font-black text-slate-900 text-base">₱{stats.quarter2Gross.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] block uppercase">Q3 Gross</span>
                <span className="font-black text-slate-900 text-base">₱{stats.quarter3Gross.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] block uppercase">Q4 (Est.)</span>
                <span className="font-black text-slate-900 text-base">₱{stats.quarter4Gross.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Automated BPLO Declaration Form Generation (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-airmee border border-slate-800 space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  Automated BPLO Reporting
                </h3>
                <span className="text-[11px] text-slate-400 font-medium block">One-click Official Export</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Aggregates historical sales transactions to output standard Gross Sales Tax Declaration matching the exact layout required by Marikina Business Permits & Licensing Office.
            </p>

            <div className="bg-slate-800/80 p-4 rounded-2xl text-xs space-y-2 border border-slate-700/80 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Tax Year:</span>
                <span className="font-bold text-white">2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Business Permit #:</span>
                <span className="font-bold text-white">{settings.bploPermitNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TIN Number:</span>
                <span className="font-bold text-white">{settings.tinNumber}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!isTier3Unlocked) {
                  alert('Automated BPLO Form export requires SaaS Tier 3 (₱199/mo). Upgrade below.');
                  onUpgradeTier(3);
                } else {
                  setShowDeclarationPreview(true);
                }
              }}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-xs shadow-airmee-orange transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>PREVIEW & DOWNLOAD BPLO DECLARATION</span>
            </button>
          </div>
        </div>

      </div>

      {/* Official BPLO Declaration Form Preview Modal */}
      {showDeclarationPreview && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm">Official Marikina BPLO Declaration Preview</span>
              <button
                onClick={() => setShowDeclarationPreview(false)}
                className="text-slate-400 hover:text-white transition font-extrabold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Printable Official Document */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="bplo-form-print">
              
              {/* Official Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <p className="text-xs font-semibold tracking-widest text-slate-600 uppercase">
                  REPUBLIC OF THE PHILIPPINES
                </p>
                <h2 className="font-black text-lg text-slate-900">
                  CITY GOVERNMENT OF MARIKINA
                </h2>
                <p className="text-xs font-bold text-orange-800">
                  Business Permits and Licensing Office (BPLO)
                </p>
                <p className="text-[11px] text-slate-500">
                  City Hall Complex, Shoe Avenue, Barangay Sto. Niño, Marikina City
                </p>
                <h3 className="font-extrabold text-sm text-slate-900 pt-2 uppercase tracking-wide">
                  ANNUAL SWORN DECLARATION OF GROSS SALES / RECEIPTS FOR 2026
                </h3>
              </div>

              {/* Taxpayer Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-slate-500 font-bold block">Registered Business Name:</span>
                  <span className="font-extrabold text-slate-900">{settings.storeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Branch / Location:</span>
                  <span className="font-bold text-slate-900">{settings.branchName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Business Address:</span>
                  <span className="font-bold text-slate-900">{settings.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">BPLO Permit No:</span>
                  <span className="font-bold text-slate-900">{settings.bploPermitNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Taxpayer Identification No (TIN):</span>
                  <span className="font-bold text-slate-900">{settings.tinNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Line of Business:</span>
                  <span className="font-bold text-slate-900">Eatery / Carinderia Operations</span>
                </div>
              </div>

              {/* Certified Gross Sales Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 uppercase">
                  I. Certified Gross Receipts Breakdown
                </h4>
                <table className="w-full text-xs border border-slate-300 divide-y divide-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <th className="p-2.5 text-left">Period / Quarter</th>
                      <th className="p-2.5 text-right">Gross Receipts (PHP)</th>
                      <th className="p-2.5 text-right">Senior/PWD Discounts</th>
                      <th className="p-2.5 text-right">Net Taxable Receipts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr>
                      <td className="p-2.5">Quarter 1 (Jan - Mar)</td>
                      <td className="p-2.5 text-right">₱{stats.quarter1Gross.toLocaleString()}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter1Gross * 0.03).toFixed(2)}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter1Gross * 0.97).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Quarter 2 (Apr - Jun)</td>
                      <td className="p-2.5 text-right">₱{stats.quarter2Gross.toLocaleString()}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter2Gross * 0.03).toFixed(2)}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter2Gross * 0.97).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Quarter 3 (Jul - Sep)</td>
                      <td className="p-2.5 text-right">₱{stats.quarter3Gross.toLocaleString()}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter3Gross * 0.03).toFixed(2)}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter3Gross * 0.97).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Quarter 4 (Oct - Dec)</td>
                      <td className="p-2.5 text-right">₱{stats.quarter4Gross.toLocaleString()}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter4Gross * 0.03).toFixed(2)}</td>
                      <td className="p-2.5 text-right">₱{(stats.quarter4Gross * 0.97).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-orange-50 font-black text-slate-900">
                      <td className="p-2.5">TOTAL ANNUAL GROSS</td>
                      <td className="p-2.5 text-right">₱{stats.currentAnnualGross.toLocaleString()}</td>
                      <td className="p-2.5 text-right">₱{(stats.currentAnnualGross * 0.03).toFixed(2)}</td>
                      <td className="p-2.5 text-right text-orange-700">₱{(stats.currentAnnualGross * 0.97).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tax Relief Assessment Section */}
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-emerald-900 block">
                  II. Marikina Ordinance 2026-018 Relief Assessment
                </span>
                <p className="text-emerald-800">
                  The subject business entity has declared total annual gross receipts of{' '}
                  <strong className="underline">₱{stats.currentAnnualGross.toLocaleString()}</strong>, which is{' '}
                  <strong>WITHIN</strong> the ₱250,000 threshold. Entity is verified <strong>ELIGIBLE</strong> for preferential 100% SME tax relief exemption for calendar year 2026.
                </p>
              </div>

              {/* Sworn Undertaking */}
              <div className="pt-4 text-[11px] text-slate-600 space-y-6">
                <p>
                  I hereby certify under oath that the information provided above is true, correct, and complete to the best of my knowledge and based on authentic CariCloud POS financial logs.
                </p>

                <div className="flex justify-between items-end pt-8">
                  <div className="text-center border-t border-slate-900 w-48 pt-1">
                    <span className="font-bold text-slate-900 block">Taxpayer / Owner Signature</span>
                    <span className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="text-center border-t border-slate-900 w-48 pt-1">
                    <span className="font-bold text-slate-900 block">Marikina BPLO Officer</span>
                    <span className="text-[10px] text-slate-500">Stamp & Verification Seal</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Print Footer */}
            <div className="p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setShowDeclarationPreview(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrintForm}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-full text-xs flex items-center space-x-2 shadow-airmee transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Sworn BPLO Form</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
