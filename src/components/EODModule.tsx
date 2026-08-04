import React, { useState, useMemo } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Sparkles,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { EODRecord, MenuItem, Transaction, UnsoldItemLoss } from '../types';

interface EODModuleProps {
  transactions: Transaction[];
  menuItems: MenuItem[];
  eodLogs: EODRecord[];
  closedBy: string;
  onSaveEODRecord: (record: EODRecord) => void;
}

export const EODModule: React.FC<EODModuleProps> = ({
  transactions,
  menuItems,
  eodLogs,
  closedBy,
  onSaveEODRecord,
}) => {
  const getLocalDateStr = (dateObj: Date | string = new Date()) => {
    const d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  // Today's completed transactions
  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDateStr = getLocalDateStr(tx.timestamp);
      return txDateStr === todayStr || tx.timestamp.startsWith(todayStr);
    });
  }, [transactions, todayStr]);

  const expectedGrossSales = useMemo(() => {
    return todayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
  }, [todayTransactions]);

  const cashSales = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.paymentMethod === 'CASH')
      .reduce((sum, tx) => sum + tx.totalAmount, 0);
  }, [todayTransactions]);

  const eWalletSales = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.paymentMethod === 'E_WALLET')
      .reduce((sum, tx) => sum + tx.totalAmount, 0);
  }, [todayTransactions]);

  const creditSales = useMemo(() => {
    return todayTransactions
      .filter((tx) => tx.paymentMethod === 'LISTAHAN_CREDIT')
      .reduce((sum, tx) => sum + tx.totalAmount, 0);
  }, [todayTransactions]);

  // Form States for Close of Day
  const [actualCashInBox, setActualCashInBox] = useState<number>(Math.round(cashSales));
  const [unsoldItemsList, setUnsoldItemsList] = useState<UnsoldItemLoss[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [unsoldQty, setUnsoldQty] = useState<number>(1);
  const [auditNotes, setAuditNotes] = useState<string>('');

  const cashVariance = actualCashInBox - cashSales;

  const totalWastageValue = useMemo(() => {
    return unsoldItemsList.reduce((sum, item) => sum + item.totalLoss, 0);
  }, [unsoldItemsList]);

  const netSales = useMemo(() => {
    return todayTransactions.reduce((sum, tx) => {
      const txNet = tx.discount?.isSeniorOrPwd
        ? tx.totalAmount
        : Math.round((tx.totalAmount / 1.12) * 100) / 100;
      return sum + txNet;
    }, 0);
  }, [todayTransactions]);

  const netProfit = Math.max(0, netSales - totalWastageValue);

  const handleAddUnsoldItem = () => {
    if (!selectedDishId) return;
    const dish = menuItems.find((m) => m.id === selectedDishId);
    if (!dish) return;

    const lossItem: UnsoldItemLoss = {
      menuItemId: dish.id,
      dishName: dish.name,
      quantityUnsold: unsoldQty,
      unitPrice: dish.price,
      totalLoss: dish.price * unsoldQty,
    };

    setUnsoldItemsList((prev) => [...prev, lossItem]);
    setSelectedDishId('');
    setUnsoldQty(1);
  };

  const handleRemoveUnsoldItem = (idx: number) => {
    setUnsoldItemsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFinalizeEOD = () => {
    const record: EODRecord = {
      id: 'eod-' + todayStr,
      date: todayStr,
      closedAt: new Date().toISOString(),
      closedBy,
      expectedGrossSales,
      actualCashInBox,
      cashVariance,
      eWalletSales,
      creditSales,
      unsoldLosses: unsoldItemsList,
      totalWastageValue,
      netSales,
      netProfit,
      totalTransactionsCount: todayTransactions.length,
      notes: auditNotes || 'Daily cash audit completed.',
    };

    onSaveEODRecord(record);
    alert(`End-of-Day Audit for ${todayStr} finalized successfully!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Title Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Calculator className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              End-of-Day Financial Reconciliation & Food Loss Audit
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Audit daily cash count, calibrate leftover food wastage, and derive net profit margins
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-full text-right">
          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Auditing Date</span>
          <span className="text-sm font-black text-orange-600">{todayStr}</span>
        </div>
      </div>

      {/* Main Reconciliation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Input Daily Cash & Food Wastage (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* STEP 1: Cash Box Count Input */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                1
              </span>
              Actual Physical Cash Box Drawer Count
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-xs text-slate-400 font-bold block mb-1">Expected Cash Sales</span>
                <span className="text-2xl font-black text-slate-900">₱{cashSales.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Actual Physical Cash Counted (₱)
                </label>
                <input
                  type="number"
                  step="1"
                  value={actualCashInBox}
                  onChange={(e) => setActualCashInBox(parseFloat(e.target.value) || 0)}
                  className="w-full text-xl font-black text-emerald-800 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Variance indicator */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${cashVariance === 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : cashVariance < 0
                  ? 'bg-red-50/80 border-red-200 text-red-950'
                  : 'bg-blue-50/80 border-blue-200 text-blue-950'
                }`}
            >
              <div>
                <span className="font-bold block text-slate-600">
                  Cash Variance (Shortage / Overage)
                </span>
                <span className="text-lg font-black mt-0.5 block">
                  {cashVariance >= 0 ? `+₱${cashVariance.toFixed(2)}` : `-₱${Math.abs(cashVariance).toFixed(2)}`}
                </span>
              </div>

              {cashVariance === 0 ? (
                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  BALANCED 🟢
                </span>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5 stroke-[2]" />
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Unsold Dishes Wastage Logger */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                2
              </span>
              Log Unsold Leftover Food Wastage
            </h3>

            {/* Dish selector & Qty */}
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unsold Dish
                </label>
                <select
                  value={selectedDishId}
                  onChange={(e) => setSelectedDishId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-orange-500 font-medium text-slate-900"
                >
                  <option value="">-- Choose Unsold Dish --</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₱{m.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-28">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Qty Unsold
                </label>
                <input
                  type="number"
                  min="1"
                  value={unsoldQty}
                  onChange={(e) => setUnsoldQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-orange-500 font-bold text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={handleAddUnsoldItem}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-full text-xs flex items-center justify-center space-x-1.5 shadow-airmee transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Wastage</span>
              </button>
            </div>

            {/* Wastage Table */}
            {unsoldItemsList.length > 0 && (
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {unsoldItemsList.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <span className="font-extrabold text-slate-900">{item.dishName}</span>
                      <span className="text-slate-400 text-[11px] font-medium ml-2">
                        {item.quantityUnsold} pcs @ ₱{item.unitPrice}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-red-600">-₱{item.totalLoss.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveUnsoldItem(idx)}
                        className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="p-3.5 bg-red-50 text-red-950 font-extrabold flex justify-between">
                  <span>Total Calibrated Food Wastage Value:</span>
                  <span className="font-black">-₱{totalWastageValue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Audit Notes */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              End-of-Day Audit Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Lunch rush peak performance. Minor leftover Pinakbet recorded."
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-slate-900 font-medium"
            />
          </div>

        </div>

        {/* RIGHT COLUMN: Computed Financial Dashboard (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl shadow-airmee p-6 space-y-5 border border-slate-800 sticky top-20">
            <h3 className="font-black text-base text-orange-400 border-b border-slate-800 pb-3 uppercase tracking-wider">
              Financial Summary & Net Profit
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Completed Orders Count:</span>
                <span className="font-bold text-white">{todayTransactions.length} txns</span>
              </div>

              <div className="flex justify-between">
                <span>Gross Revenue:</span>
                <span className="font-bold text-white">₱{expectedGrossSales.toFixed(2)}</span>
              </div>

              <div className="pl-3 border-l-2 border-slate-800 space-y-1.5 text-[11px] text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>• Cash Sales:</span>
                  <span className="text-slate-300 font-semibold">₱{cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• E-Wallet (PayMongo):</span>
                  <span className="text-slate-300 font-semibold">₱{eWalletSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Listahan Credit:</span>
                  <span className="text-slate-300 font-semibold">₱{creditSales.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-amber-300 pt-2 border-t border-slate-800 font-bold">
                <span>Unsold Food Wastage Loss:</span>
                <span>-₱{totalWastageValue.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                    NET MARGIN / PROFIT
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Less Tax & Food Wastage</span>
                </div>
                <span className="text-3xl font-black text-emerald-400">
                  ₱{netProfit.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalizeEOD}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-sm shadow-airmee-orange transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>FINALIZE EOD AUDIT REPORT</span>
            </button>
          </div>

          {/* Historical EOD Logs */}
          <div className="bg-white rounded-3xl p-6 shadow-airmee border border-slate-100 space-y-4">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">
              Recent EOD Audits
            </h4>

            <div className="space-y-2.5 max-h-52 overflow-y-auto">
              {eodLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{log.date}</span>
                    <span className="text-[10px] text-slate-400 font-medium">By {log.closedBy}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 block">₱{log.netProfit.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{log.totalTransactionsCount} txns</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
