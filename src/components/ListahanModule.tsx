import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  UserPlus, 
  History, 
  Phone, 
  MapPin,
  ShieldAlert,
  Edit,
  Eye,
  Lock,
  Filter,
  X,
  Receipt,
  UserCheck
} from 'lucide-react';
import { CustomerCredit, DebtPaymentRecord, Role } from '../types';

interface ListahanModuleProps {
  customers: CustomerCredit[];
  debtPayments: DebtPaymentRecord[];
  onSaveCustomer: (customer: CustomerCredit) => void;
  onRecordPayment: (customerId: string, amount: number, receivedBy: string, notes?: string) => void;
  receivedBy: string;
  currentUserRole?: Role;
}

export const ListahanModule: React.FC<ListahanModuleProps> = ({
  customers,
  debtPayments,
  onSaveCustomer,
  onRecordPayment,
  receivedBy,
  currentUserRole = 'ADMIN',
}) => {
  const isOwner = currentUserRole === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCredit | null>(null);

  // Dedicated Account Payment History Filter & Modal State
  const [historyCustomerFilter, setHistoryCustomerFilter] = useState<string>('ALL');
  const [customerHistoryModal, setCustomerHistoryModal] = useState<CustomerCredit | null>(null);

  // Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New/Edit Customer Form
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custLimit, setCustLimit] = useState<number>(1000);
  const [custApproved, setCustApproved] = useState<boolean>(true);
  const [custNotes, setCustNotes] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(100);
  const [payNotes, setPayNotes] = useState('');

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.includes(searchQuery)
  );

  const totalOutstandingUtang = customers.reduce((sum, c) => sum + c.currentDebt, 0);

  // Filtered Debt Payments for History Section
  const filteredDebtPayments = debtPayments.filter((p) => {
    if (historyCustomerFilter === 'ALL') return true;
    return p.customerId === historyCustomerFilter;
  });

  const totalCollectedInFilter = filteredDebtPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleOpenAddCustomer = () => {
    setEditingCustId(null);
    setCustName('');
    setCustContact('');
    setCustAddress('');
    setCustLimit(1000);
    setCustApproved(true);
    setCustNotes('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: CustomerCredit) => {
    setEditingCustId(c.id);
    setCustName(c.name);
    setCustContact(c.contact);
    setCustAddress(c.address || '');
    setCustLimit(c.creditLimit);
    setCustApproved(c.isApproved);
    setCustNotes(c.notes || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      alert('Please enter a customer name.');
      return;
    }

    const target = editingCustId ? customers.find((c) => c.id === editingCustId) : null;

    const newCustomer: CustomerCredit = {
      id: editingCustId || 'c-' + Date.now(),
      name: custName.trim(),
      contact: custContact.trim(),
      address: custAddress.trim() || undefined,
      creditLimit: custLimit,
      currentDebt: target ? target.currentDebt : 0,
      isApproved: custApproved,
      notes: custNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(newCustomer);
    setIsCustomerModalOpen(false);
  };

  const handleOpenPaymentModal = (c: CustomerCredit) => {
    setSelectedCustomer(c);
    setPayAmount(c.currentDebt);
    setPayNotes('Cash payment received');
    setIsPaymentModalOpen(true);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    onRecordPayment(selectedCustomer.id, payAmount, receivedBy, payNotes);
    setIsPaymentModalOpen(false);
    alert(`Payment of ₱${payAmount.toFixed(2)} recorded for ${selectedCustomer.name}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      {!isOwner && (
        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 text-xs text-emerald-950 font-medium flex items-center justify-between shadow-airmee">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>
              <strong>Employee Access Active:</strong> You can view suki credit accounts, record cash repayments, and inspect account payment history. Adding new accounts or modifying credit limits requires an Owner account.
            </span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 border border-emerald-200">
            Payments Enabled
          </span>
        </div>
      )}

      {/* Header Summary Bar */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="bg-orange-50 text-orange-600 border border-orange-200/60 text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
            Suki Credit Ledger
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-600" />
            Digital Customer Credit Ledger ("Listahan")
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Replaces paper notebook tracking for suki customers with authorized credit limits & payment collection.
          </p>
        </div>

        {/* Total Utang Balance Card */}
        <div className="flex items-center space-x-4 bg-orange-50/60 border border-orange-200/60 p-4 rounded-2xl w-full md:w-auto">
          <div>
            <span className="text-[10px] text-orange-800 font-extrabold uppercase tracking-wider block">
              Total Suki Outstanding Debt
            </span>
            <span className="text-2xl font-black text-orange-600">
              ₱{totalOutstandingUtang.toFixed(2)}
            </span>
          </div>
          {isOwner ? (
            <button
              onClick={handleOpenAddCustomer}
              className="ml-auto px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-full text-xs flex items-center gap-1.5 shadow-airmee-orange transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Suki</span>
            </button>
          ) : (
            <div className="ml-auto px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Suki by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 font-medium"
          />
        </div>
      </div>

      {/* Customer Credit Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((c) => {
          const isAtRisk = c.currentDebt >= c.creditLimit * 0.85;
          const usagePercent = Math.min(100, Math.round((c.currentDebt / c.creditLimit) * 100));

          return (
            <div
              key={c.id}
              className={`bg-white rounded-3xl border p-6 shadow-airmee transition-all flex flex-col justify-between ${
                isAtRisk ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80 hover:border-orange-400'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <span>{c.name}</span>
                      {!c.isApproved && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          SUSPENDED
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.contact}</span>
                    </p>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleOpenEditCustomer(c)}
                      className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
                      title="Edit Customer Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {c.address && (
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.address}</span>
                  </p>
                )}

                {/* Debt & Limit Meter */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Unsettled Balance:</span>
                    <span className="font-black text-slate-900">₱{c.currentDebt.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Approved Credit Limit:</span>
                    <span className="font-extrabold text-slate-700">₱{c.creditLimit.toFixed(2)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full transition-all rounded-full ${
                        usagePercent >= 90
                          ? 'bg-red-600'
                          : usagePercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-500 font-medium bg-slate-50/80 p-2.5 rounded-2xl italic border border-slate-100">
                    "{c.notes}"
                  </p>
                )}
              </div>

              {/* Action - Available to both Owner and Employee */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  disabled={c.currentDebt <= 0}
                  onClick={() => handleOpenPaymentModal(c)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-full text-xs flex items-center justify-center space-x-1 shadow-xs transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Record Cash Payment</span>
                </button>
                <button
                  onClick={() => setCustomerHistoryModal(c)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-full text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                  title="View Account Payment History"
                >
                  <History className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">History</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW DEDICATED SECTION: HISTORY OF EACH ACCOUNT'S CREDIT PAYMENT */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-600" />
              Suki Account Credit Payment History
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Detailed audit trail of all cash repayments collected per customer account
            </p>
          </div>

          {/* Account Filter Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={historyCustomerFilter}
              onChange={(e) => setHistoryCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Suki Accounts ({debtPayments.length} Payments)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment History Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                Total Repayments Collected
              </span>
              <span className="text-2xl font-black text-emerald-700">
                ₱{totalCollectedInFilter.toFixed(2)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
              ₱
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Total Repayment Entries
              </span>
              <span className="text-2xl font-black text-slate-900">
                {filteredDebtPayments.length} Logs
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-sm">
              #
            </div>
          </div>
        </div>

        {/* Detailed Payment Audit Logs Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
          {filteredDebtPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No cash repayments recorded for this filter selection.</p>
            </div>
          ) : (
            filteredDebtPayments.map((p) => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900 text-sm">{p.customerName}</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        CASH
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] font-medium flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Received by <strong className="text-slate-800">{p.receivedBy}</strong>
                      </span>
                      <span>•</span>
                      <span>{new Date(p.timestamp).toLocaleString()}</span>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-xl">
                        "{p.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-emerald-600 text-lg block">+₱{p.amount.toFixed(2)}</span>
                  <span className="text-slate-400 text-[10px] font-mono font-medium">Ref #{p.id.slice(-6)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* INDIVIDUAL CUSTOMER HISTORY MODAL */}
      {customerHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-airmee-hover max-w-lg w-full p-6 space-y-5 border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-600" />
                  Payment History: {customerHistoryModal.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Contact: {customerHistoryModal.contact} • Debt: ₱{customerHistoryModal.currentDebt.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setCustomerHistoryModal(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {debtPayments.filter((p) => p.customerId === customerHistoryModal.id).length === 0 ? (
                <p className="p-4 text-center text-slate-400 text-xs font-medium">
                  No payment history recorded for {customerHistoryModal.name} yet.
                </p>
              ) : (
                debtPayments
                  .filter((p) => p.customerId === customerHistoryModal.id)
                  .map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">₱{p.amount.toFixed(2)} Cash Repayment</span>
                        <span className="text-slate-500 text-[10px] font-medium block mt-0.5">
                          Received by {p.receivedBy} on {new Date(p.timestamp).toLocaleString()}
                        </span>
                        {p.notes && <span className="text-slate-500 text-[11px] italic block mt-1">"{p.notes}"</span>}
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full text-[10px]">
                        COMPLETED
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setCustomerHistoryModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full cursor-pointer shadow-airmee"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Suki Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCustomerForm}
            className="bg-white rounded-3xl shadow-airmee-hover max-w-md w-full p-6 space-y-5 border border-slate-100 animate-fadeIn"
          >
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              {editingCustId ? 'Edit Suki Account' : 'Register New Suki Customer'}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kapitan Mang Berting"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0917-555-1234"
                  value={custContact}
                  onChange={(e) => setCustContact(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Barangay / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brgy. San Roque, Marikina"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Credit Limit (₱)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={custLimit}
                    onChange={(e) => setCustLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={custApproved}
                      onChange={(e) => setCustApproved(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded-md focus:ring-orange-500"
                    />
                    <span>Approved for Credit</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Barangay official. Pays every Friday."
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-extrabold bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-airmee-orange cursor-pointer"
              >
                Save Suki Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExecutePayment}
            className="bg-white rounded-3xl shadow-airmee-hover max-w-md w-full p-6 space-y-5 border border-slate-100 animate-fadeIn"
          >
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              Record Cash Repayment - {selectedCustomer.name}
            </h3>

            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Current Debt Balance:</span>
                <span className="font-black text-slate-900">₱{selectedCustomer.currentDebt.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cash Amount Received (₱) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.currentDebt}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xl font-black text-emerald-700 px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Payment Notes / Receipt Ref
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xs cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
