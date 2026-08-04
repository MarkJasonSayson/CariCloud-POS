import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Printer, 
  CreditCard, 
  Banknote, 
  UserCheck, 
  Clock, 
  FileCheck2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Transaction, StoreSettings } from '../types';

interface ReceiptsArchiveModuleProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onSelectReceipt: (tx: Transaction) => void;
}

export const ReceiptsArchiveModule: React.FC<ReceiptsArchiveModuleProps> = ({
  transactions,
  settings,
  onSelectReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'E_WALLET' | 'LISTAHAN_CREDIT'>('ALL');

  // Filter transactions
  const filteredTx = transactions.filter((tx) => {
    const matchesSearch = 
      tx.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.items.some((i) => i.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = paymentFilter === 'ALL' || tx.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Calculate high-level summary metrics
  const totalVolume = transactions.length;
  const totalGross = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const cashTotal = transactions.filter(t => t.paymentMethod === 'CASH').reduce((acc, t) => acc + t.totalAmount, 0);
  const ewalletTotal = transactions.filter(t => t.paymentMethod === 'E_WALLET').reduce((acc, t) => acc + t.totalAmount, 0);
  const creditTotal = transactions.filter(t => t.paymentMethod === 'LISTAHAN_CREDIT').reduce((acc, t) => acc + t.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Receipts Archive & Transaction History
              </h2>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Shared Access
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Every completed transaction is automatically archived here. Both store owner and employees can review or reprint official receipts anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-4 py-2.5 rounded-full shrink-0">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <span>{totalVolume} Receipts Archived</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-airmee">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Archived Volume</span>
            <Receipt className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalVolume} <span className="text-xs font-semibold text-slate-400">orders</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Total transactions logged</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-airmee">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Cash Transactions</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            ₱{cashTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Physical tender at counter</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-airmee">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>QR Ph / E-Wallets</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-700 mt-2">
            ₱{ewalletTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">PayMongo GCash / Maya</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-airmee">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Listahan Utang Credit</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-700 mt-2">
            ₱{creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Customer credit ledger</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, customer, cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-medium"
            />
          </div>

          {/* Payment Method Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setPaymentFilter('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                paymentFilter === 'ALL'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              All Receipts ({transactions.length})
            </button>
            <button
              onClick={() => setPaymentFilter('CASH')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                paymentFilter === 'CASH'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              Cash Only
            </button>
            <button
              onClick={() => setPaymentFilter('E_WALLET')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                paymentFilter === 'E_WALLET'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              QR Ph / E-Wallet
            </button>
            <button
              onClick={() => setPaymentFilter('LISTAHAN_CREDIT')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                paymentFilter === 'LISTAHAN_CREDIT'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              Listahan Utang
            </button>
          </div>

        </div>
      </div>

      {/* Receipts Table List */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 overflow-hidden">
        {filteredTx.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 mx-auto stroke-1 opacity-30 text-slate-400" />
            <h3 className="font-black text-slate-900 text-base">No Receipts Found</h3>
            <p className="text-xs text-slate-500 font-medium">
              {searchQuery || paymentFilter !== 'ALL'
                ? 'Try clearing search keywords or filter settings.'
                : 'Completed transactions will automatically accumulate here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Receipt No.</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Items Ordered</th>
                  <th className="py-4 px-6">Cashier</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6 text-right">Total Amount</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    
                    <td className="py-4 px-6 font-mono font-extrabold text-orange-600">
                      {tx.receiptNo}
                    </td>

                    <td className="py-4 px-6 text-slate-900">
                      <div className="font-extrabold">
                        {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-black text-slate-900 max-w-xs truncate">
                        {tx.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {tx.items.reduce((sum, i) => sum + i.quantity, 0)} total item(s)
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-800 font-bold">
                      {tx.cashierName}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        tx.paymentMethod === 'CASH'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                          : tx.paymentMethod === 'E_WALLET'
                          ? 'bg-blue-50 text-blue-800 border-blue-200/80'
                          : 'bg-purple-50 text-purple-800 border-purple-200/80'
                      }`}>
                        {tx.paymentMethod.replace('_', ' ')}
                      </span>
                      {tx.customerName && (
                        <div className="text-[10px] text-purple-800 font-bold mt-0.5">
                          Account: {tx.customerName}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                      ₱{tx.totalAmount.toFixed(2)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onSelectReceipt(tx)}
                        className="px-4 py-2 bg-slate-50 hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-extrabold rounded-full text-xs inline-flex items-center space-x-1.5 transition border border-slate-200/80 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
