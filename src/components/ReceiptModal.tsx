import React from 'react';
import { Printer, CheckCircle2, X, ArrowRight, BookmarkCheck } from 'lucide-react';
import { Transaction, StoreSettings } from '../types';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePrintAndNewOrder = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Transaction Complete!</span>
              <span className="text-[10px] text-slate-400 font-medium">Auto-archived to Receipts Section</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close & Start New Order"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto Archive Notice Banner */}
        <div className="bg-orange-50/80 border-b border-orange-100 px-5 py-2.5 flex items-center justify-between text-xs font-bold text-orange-950">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-orange-600" />
            <span>Receipt saved in system archive</span>
          </div>
          <span className="text-[10px] text-slate-400 font-extrabold">Owner & Employee Access</span>
        </div>

        {/* Receipt Printable Container */}
        <div className="p-6 overflow-y-auto font-mono text-slate-900 text-xs space-y-4 bg-slate-50/50" id="printable-receipt">

          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
            <h2 className="font-sans font-black text-xl text-slate-900 tracking-tight">
              {settings.storeName}
            </h2>
            <p className="text-xs font-sans text-slate-500 font-bold">{settings.branchName}</p>
            <p className="text-[10px] text-slate-400 font-medium">{settings.address}</p>
            <div className="text-[10px] text-slate-400 font-medium pt-1">
              <span>TIN: {settings.tinNumber}</span> | <span>BPLO: {settings.bploPermitNo}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Contact: {settings.contactNumber}</p>
          </div>

          {/* Transaction Metadata */}
          <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-extrabold text-orange-600">{transaction.receiptNo}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Date/Time:</span>
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Cashier:</span>
              <span className="font-bold text-slate-900">{transaction.cashierName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Path:</span>
              <span className="font-extrabold uppercase text-slate-900">{transaction.paymentMethod}</span>
            </div>

            {transaction.discount.isSeniorOrPwd && (
              <div className="flex justify-between text-amber-950 font-extrabold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                <span>SC/PWD ID:</span>
                <span>{transaction.discount.idNumber || 'Verified'}</span>
              </div>
            )}

            {transaction.customerName && (
              <div className="flex justify-between text-purple-950 font-extrabold bg-purple-50 p-2 rounded-xl border border-purple-200 mt-1">
                <span>Listahan Account:</span>
                <span>{transaction.customerName}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 text-[11px]">
              <span>QTY & DISH ITEM</span>
              <span>AMOUNT</span>
            </div>

            {transaction.items.map((item) => (
              <div key={item.cartItemId} className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">
                    {item.quantity}x {item.menuItem.name}
                    {item.isHalfOrder && ' (HALF)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    @ ₱{item.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div className="font-black text-slate-900">₱{item.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Math & Totals Breakdown */}
          <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Gross Order Subtotal:</span>
              <span className="font-bold text-slate-900">₱{transaction.subtotal.toFixed(2)}</span>
            </div>

            {transaction.discount.isSeniorOrPwd && (
              <>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Less 12% VAT Exemption:</span>
                  <span>-₱{transaction.discount.vatExemptAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Less 20% SC/PWD Discount:</span>
                  <span>-₱{transaction.discount.discountAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-2">
              <span>TOTAL DUE:</span>
              <span className="text-orange-600">₱{transaction.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Settlement Details */}
          <div className="space-y-1.5 text-[11px]">
            {transaction.paymentMethod === 'CASH' && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Tendered:</span>
                  <span className="font-bold text-slate-900">₱{(transaction.tenderedAmount || transaction.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900">
                  <span>Change Due:</span>
                  <span className="text-emerald-700">₱{(transaction.changeAmount || 0).toFixed(2)}</span>
                </div>
              </>
            )}

            {transaction.paymentMethod === 'E_WALLET' && (
              <div className="flex justify-between font-extrabold text-sky-900 bg-sky-50 p-2 rounded-xl border border-sky-200">
                <span>PayMongo Ref #:</span>
                <span>{transaction.paymongoRef}</span>
              </div>
            )}

            {transaction.paymentMethod === 'LISTAHAN_CREDIT' && (
              <div className="text-center font-extrabold text-purple-950 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                Logged to {transaction.customerName}'s Listahan Account
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[10px] text-slate-400 font-sans space-y-0.5">
            <p className="font-extrabold text-slate-900 text-xs">Mamingaw at Masarap na Kain!</p>
            <p className="font-medium">Thank you for dining at {settings.storeName}</p>
            <p className="text-[9px] text-slate-400 pt-1">Powered by CariCloud POS Marikina</p>
          </div>

        </div>

        {/* Action Buttons Panel */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Direct Start New Order (WITHOUT printing) */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-900 hover:text-orange-600 font-extrabold rounded-full text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs cursor-pointer"
          >
            <span>Start New Order (Skip Print)</span>
            <ArrowRight className="w-4 h-4 text-orange-500" />
          </button>

          {/* Print & Start New Order */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold rounded-full text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              title="Print receipt without closing modal"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Only</span>
            </button>

            <button
              onClick={handlePrintAndNewOrder}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-full text-xs flex items-center justify-center space-x-1.5 transition shadow-airmee-orange cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print & New Order</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
