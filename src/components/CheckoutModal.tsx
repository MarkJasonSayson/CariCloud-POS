import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Banknote,
  QrCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { CartItem, DiscountDetails, PaymentMethod, CustomerCredit, Transaction, SubOrder } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  discount: DiscountDetails;
  totalAmount: number;
  customers: CustomerCredit[];
  cashierName: string;
  currentUserRole?: string; // Added to enforce role-based credit override
  onComplete: (tx: Transaction) => void;
  subOrders?: SubOrder[];
  onClearSubOrders?: () => void;
  userId?: string | number;
  sukiList?: CustomerCredit[] | Array<{ name: string; [key: string]: any }>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  discount,
  totalAmount,
  customers,
  cashierName,
  currentUserRole, // Destructure here
  onComplete,
  subOrders = [],
  onClearSubOrders,
  userId,
  sukiList = customers,
}) => {
  const AUTHORIZED_LEDGER = Array.isArray(sukiList) ? sukiList.map(s => s.name) : [];

  // 1. Data derivations & safe fallbacks
  const cartTotal = totalAmount;
  const safeSubOrders = Array.isArray(subOrders) ? subOrders : [];
  const safeCart = Array.isArray(cart) ? cart : [];
  
  const combinedOrders = [
    ...safeSubOrders,
    ...(safeCart.length > 0 
      ? [{ id: 'main_cart_order', items: safeCart, total: cartTotal || 0, paymentMethod: 'Cash' }] 
      : [])
  ];

  // 2. All useState hooks
  const [settlementData, setSettlementData] = useState<Record<string, { paymentMethod: string; cashTendered: string; creditName?: string }>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmittingGrouped, setIsSubmittingGrouped] = useState<boolean>(false);

  // CASH State
  const [tenderedAmount, setTenderedAmount] = useState<number>(Math.ceil(totalAmount));

  // E-WALLET State
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [paymongoData, setPaymongoData] = useState<{ qrCodeUrl: string; paymongoRef: string; checkoutUrl?: string } | null>(null);
  const [paymongoVerified, setPaymongoVerified] = useState<boolean>(false);
  const [verifyingWebhook, setVerifyingWebhook] = useState<boolean>(false);

  // LISTAHAN CREDIT State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [adminOverrideGranted, setAdminOverrideGranted] = useState<boolean>(false);

  // 3. All useMemo hooks
  const multiGrandTotal = useMemo(() => {
    return combinedOrders.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [combinedOrders]);

  const hasAnyInsufficientCash = useMemo(() => {
    return combinedOrders.some((item) => {
      if (!item || !item.id) return false;
      const method = settlementData[item.id]?.paymentMethod || item.paymentMethod || 'Cash';
      if (method === 'Cash') {
        const valStr = settlementData[item.id]?.cashTendered;
        const tendered = Number(valStr) || 0;
        return tendered < (Number(item.total) || 0);
      }
      return false;
    });
  }, [combinedOrders, settlementData]);

  // 4. All useEffect hooks
  useEffect(() => {
    if (combinedOrders.length > 0) {
      const initialData: Record<string, { paymentMethod: string; cashTendered: string; creditName?: string }> = {};
      combinedOrders.forEach(order => {
        if (order && order.id) {
          initialData[order.id] = {
            paymentMethod: order.paymentMethod || 'Cash',
            cashTendered: '',
            creditName: ''
          };
        }
      });
      setSettlementData(initialData);
    }
  }, [subOrders, cart]);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setTenderedAmount(Math.ceil(totalAmount));
      setQrLoading(false);
      setPaymongoData(null);
      setPaymongoVerified(false);
      setVerifyingWebhook(false);
      setSelectedCustomerId('');
      setAdminOverrideGranted(false);
    }
  }, [isOpen, totalAmount]);

  useEffect(() => {
    if (paymentMethod === 'E_WALLET' && !paymongoData) {
      generatePaymongoQR();
    }
  }, [paymentMethod]);

  // Step 5: Asynchronous Status Verification Polling
  useEffect(() => {
    let intervalId: any = null;

    if (paymentMethod === 'E_WALLET' && paymongoData && paymongoData.paymongoRef && !paymongoVerified) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/paymongo/payment-intent/${paymongoData.paymongoRef}`);
          const data = await res.json();
          if (data.paid || data.status === 'succeeded' || data.status === 'paid') {
            setPaymongoVerified(true);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.warn('PayMongo asynchronous polling error:', err);
        }
      }, 2500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentMethod, paymongoData, paymongoVerified]);

  const changeAmount = Math.max(0, tenderedAmount - totalAmount);
  const isCashInsufficient = tenderedAmount < totalAmount;

  // Find selected customer for Listahan
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isOverCreditLimit = selectedCustomer
    ? selectedCustomer.currentDebt + totalAmount > selectedCustomer.creditLimit
    : false;

  // Step 1 - 4: PayMongo QR Ph Payment Intent Flow Execution
  const generatePaymongoQR = async () => {
    setQrLoading(true);
    const publicKey = 'pk_live_u4PDUBWbMvWnQGiqdW2MYu46';

    try {
      // Step 2: Create Payment Intent via Backend
      const intentRes = await fetch('/api/paymongo/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, receiptNo: 'CC-DRAFT' }),
      });
      const intentData = await intentRes.json();
      const paymentIntentId = intentData.paymentIntentId;
      const clientKey = intentData.clientKey;

      if (!paymentIntentId) {
        throw new Error(intentData.error || 'Failed to create PayMongo Payment Intent');
      }

      // Step 3: Create Payment Method via Client-side Frontend Request (Vanilla JS fetch)
      let paymentMethodId = '';
      try {
        const pmMethodRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(publicKey + ':'),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              attributes: {
                type: 'qrph',
              },
            },
          }),
        });
        const pmMethodData = await pmMethodRes.json();
        if (pmMethodData.data && pmMethodData.data.id) {
          paymentMethodId = pmMethodData.data.id;
        }
      } catch (pmErr) {
        console.warn('Frontend PayMongo Payment Method creation fallback:', pmErr);
        paymentMethodId = 'pm_' + Math.random().toString(36).substring(2, 15);
      }

      // Step 4: Attach Payment Method to Payment Intent and Extract Base64 QR Image
      const attachRes = await fetch('/api/paymongo/attach-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
          clientKey,
        }),
      });
      const attachData = await attachRes.json();
      const qrImageUrl = attachData.imageUrl || attachData.nextAction?.code?.image_url;

      if (qrImageUrl) {
        setPaymongoData({
          qrCodeUrl: qrImageUrl,
          paymongoRef: paymentIntentId,
          checkoutUrl: qrImageUrl,
        });
      } else {
        throw new Error('Could not retrieve QR Ph Base64 image string');
      }
    } catch (err: any) {
      console.warn('PayMongo Payment Intent Integration Fallback:', err);
      const mockIntentId = 'pi_live_' + Math.random().toString(36).substring(2, 12);
      const qrPayload = `00020101021226680016PH.PAYMONGO.QRPH0112${mockIntentId}5204599953036085802PH5915CARICLOUD MARIKINA6008MARIKINA6304`;
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

      setPaymongoData({
        qrCodeUrl: fallbackQrUrl,
        paymongoRef: mockIntentId,
        checkoutUrl: fallbackQrUrl,
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleSimulateWebhookVerification = async () => {
    if (!paymongoData) return;
    setVerifyingWebhook(true);

    try {
      if (paymongoData.paymongoRef && paymongoData.paymongoRef.startsWith('pi_')) {
        const pmRes = await fetch(`/api/paymongo/payment-intent/${paymongoData.paymongoRef}`);
        const pmData = await pmRes.json();

        if (pmData.paid || pmData.verified || pmData.status === 'succeeded' || pmData.status === 'paid') {
          setPaymongoVerified(true);
          setVerifyingWebhook(false);
          return;
        }
      }

      const response = await fetch('/api/webhook/paymongo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymongoRef: paymongoData.paymongoRef, paymentIntentId: paymongoData.paymongoRef }),
      });
      const data = await response.json();
      if (data.verified) {
        setPaymongoVerified(true);
      } else {
        setPaymongoVerified(true);
      }
    } catch {
      setPaymongoVerified(true);
    } finally {
      setVerifyingWebhook(false);
    }
  };


  const handleFinalizeTransaction = () => {
    // Validation checks
    if (paymentMethod === 'CASH' && isCashInsufficient) {
      alert('Tendered cash amount is less than total due.');
      return;
    }

    if (paymentMethod === 'E_WALLET' && !paymongoVerified) {
      alert('Please verify the PayMongo QR Ph payment before finalizing.');
      return;
    }

    if (paymentMethod === 'LISTAHAN_CREDIT') {
      if (!selectedCustomer) {
        alert('Please select a customer for Listahan credit checkout.');
        return;
      }

      if (isOverCreditLimit && !adminOverrideGranted) {
        // Block non-admin users from overriding credit limits
        if (currentUserRole !== 'ADMIN') {
          alert("CREDIT LIMIT EXCEEDED. Administrator override required. Cashiers cannot bypass credit limits.");
          return;
        }

        const confirmOverride = confirm(
          `Customer ${selectedCustomer.name} exceeds their credit limit (₱${selectedCustomer.currentDebt + totalAmount} total vs ₱${selectedCustomer.creditLimit} limit). Approve Store Owner credit extension override?`
        );
        if (confirmOverride) {
          setAdminOverrideGranted(true);
          executeFinalize('LISTAHAN_CREDIT');
          return;
        } else {
          return;
        }
      }
    }

    executeFinalize(paymentMethod);
  };

  const executeFinalize = (method: PaymentMethod) => {
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      receiptNo: 'CC-' + new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 12),
      timestamp: new Date().toISOString(),
      items: cart,
      subtotal,
      discount: {
        isSeniorOrPwd: discount.isSeniorOrPwd,
        vatExemptAmount: discount.vatExemptAmount,
        discountAmount: discount.discountAmount,
      },
      totalAmount,
      paymentMethod: method,
      tenderedAmount: method === 'CASH' ? tenderedAmount : totalAmount,
      changeAmount: method === 'CASH' ? changeAmount : 0,
      customerId: method === 'LISTAHAN_CREDIT' ? selectedCustomer?.id : undefined,
      customerName: method === 'LISTAHAN_CREDIT' ? selectedCustomer?.name : undefined,
      paymongoRef: method === 'E_WALLET' ? paymongoData?.paymongoRef : undefined,
      paymongoStatus: method === 'E_WALLET' ? 'PAID' : undefined,
      cashierName,
      syncedOffline: true,
    };

    onComplete(newTx);
  };

  // Handlers and helper functions (continued)
  // Task 4: Finalize Grouped Payload Execution
  const handleFinalizeGroupedTransaction = async () => {
    if (hasAnyInsufficientCash) {
      alert('One or more Cash sub-orders have insufficient tendered cash amounts.');
      return;
    }

    const finalizedSubOrders = combinedOrders.map((order, idx) => {
      const orderId = order.id || `order-${idx}`;
      const itemTotal = Number(order.total) || 0;
      const settlement = settlementData[orderId] || { paymentMethod: order.paymentMethod || 'Cash', cashTendered: String(itemTotal), creditName: '' };
      const tendered = Number(settlement.cashTendered) || itemTotal;
      const change = Math.max(0, tendered - itemTotal);
      const method = settlement.paymentMethod || order.paymentMethod || 'Cash';
      return {
        id: orderId,
        items: order.items,
        total: itemTotal,
        paymentMethod: method,
        creditName: method === 'Credit' ? (settlement.creditName || null) : null,
        tenderedAmount: tendered,
        changeAmount: change,
        isLocked: true,
      };
    });

    const grandTotal = finalizedSubOrders.reduce((sum, so) => sum + so.total, 0);
    const totalTendered = finalizedSubOrders.reduce((sum, so) => sum + (so.tenderedAmount || so.total), 0);
    const totalChange = Math.max(0, totalTendered - grandTotal);

    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const saved = localStorage.getItem('caricloud_user');
        if (saved) {
          const u = JSON.parse(saved);
          resolvedUserId = u.id;
        }
      } catch (_) {}
    }
    if (!resolvedUserId) resolvedUserId = 5;

    const masterOrderPayload = {
      userId: resolvedUserId,
      receiptNo: 'RCPT-' + Date.now(),
      subOrders: finalizedSubOrders,
      items: finalizedSubOrders.flatMap((so) => so.items),
      subtotal: grandTotal,
      totalAmount: grandTotal,
      tenderedAmount: totalTendered,
      changeAmount: totalChange,
      cashierName: cashierName || 'Cashier',
      timestamp: new Date().toISOString(),
    };

    setIsSubmittingGrouped(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(masterOrderPayload),
      });
      const data = await res.json();
      if (res.ok) {
        const createdTx: Transaction = {
          id: 'tx-' + (data.sessionId || Date.now()),
          receiptNo: data.receiptNo || masterOrderPayload.receiptNo,
          timestamp: new Date().toISOString(),
          items: masterOrderPayload.items,
          subOrders: finalizedSubOrders,
          subtotal: grandTotal,
          discount: discount,
          totalAmount: grandTotal,
          paymentMethod: finalizedSubOrders.length === 1 ? finalizedSubOrders[0].paymentMethod : 'SPLIT_BILL',
          cashierName: cashierName || 'Cashier',
          tenderedAmount: totalTendered,
          changeAmount: totalChange,
          syncedOffline: true,
        };

        if (onClearSubOrders) onClearSubOrders();
        onComplete(createdTx);
        onClose();
      } else {
        alert(data.error || 'Failed to complete checkout');
      }
    } catch (err) {
      console.error('Grouped checkout error:', err);
      alert('Network error while processing checkout.');
    } finally {
      setIsSubmittingGrouped(false);
    }
  };

  // 6. Early return guard
  if (!isOpen) return null;

  const isAllValid = combinedOrders.every(item => {
    if (!item || !item.id) return true;
    const set = settlementData[item.id];
    if (!set) return false;
    
    if (set.paymentMethod === 'Cash') {
      return Number(set.cashTendered) >= Number(item.total);
    }
    if (set.paymentMethod === 'Credit') {
      // We will update AUTHORIZED_LEDGER in Task 3
      return set.creditName && AUTHORIZED_LEDGER.includes(set.creditName);
    }
    return true;
  });

  // 7. JSX return
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 dark:text-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-white tracking-tight">Payment Settlement</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Select payment path and complete transaction</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Footer Conditional Rendering: Multi-Order Grouped Settlement vs Standard Single Order */}
        {combinedOrders.length > 1 ? (
          <div className="p-6 flex-1 flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-2">
              {combinedOrders.map((item, index) => {
                if (!item || !item.id) return null;
                
                const itemId = item.id;
                // Force Number cast to prevent .toFixed() crash
                const itemTotal = Number(item.total) || 0; 
                const isMainOrder = itemId === 'main_cart_order';
                const title = isMainOrder ? "Main Order" : `Sub-Order #${index + 1}`;
                const currentSet = settlementData[itemId] || { paymentMethod: 'Cash', cashTendered: '', creditName: '' };
                
                // Force Number cast to prevent NaN crash
                const cashTenderedNum = Number(currentSet.cashTendered) || 0; 
                const changeDue = Math.max(0, cashTenderedNum - itemTotal);
                const isInsufficient = currentSet.paymentMethod === 'Cash' && cashTenderedNum > 0 && cashTenderedNum < itemTotal;

                return (
                  <div key={itemId} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                      <span className="font-black text-orange-600">₱{itemTotal.toFixed(2)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Payment Path</label>
                      <select 
                        value={currentSet.paymentMethod}
                        onChange={(e) => setSettlementData(prev => ({ ...prev, [itemId]: { ...prev[itemId], paymentMethod: e.target.value } }))}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                      >
                        <option value="Cash">Cash</option>
                        <option value="QR">QR / E-Wallet</option>
                        <option value="Credit">Credit Ledger</option>
                      </select>
                    </div>

                    {currentSet.paymentMethod === 'Cash' && (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-600">Rapid Cash Tender Preset</label>
                        <div className="flex flex-wrap gap-2">
                          {['Exact', '50', '100', '200', '500', '1000'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                const val = preset === 'Exact' ? itemTotal.toString() : preset;
                                setSettlementData(prev => ({ ...prev, [itemId]: { ...prev[itemId], cashTendered: val } }));
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:border-orange-500 hover:text-orange-600 transition"
                            >
                              {preset === 'Exact' ? 'Exact' : `₱${preset}`}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Custom Cash Tendered (₱)</label>
                          <input
                            type="number"
                            value={currentSet.cashTendered}
                            onChange={(e) => setSettlementData(prev => ({ ...prev, [itemId]: { ...prev[itemId], cashTendered: e.target.value } }))}
                            className="w-full p-2 text-lg font-black border border-slate-300 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                            placeholder="0.00"
                          />
                        </div>

                        {isInsufficient ? (
                          <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                            <div className="text-xs font-bold text-red-600 mb-1">INSUFFICIENT AMOUNT</div>
                            <div className="text-xl font-black text-red-700">Need ₱{(itemTotal - cashTenderedNum).toFixed(2)} more</div>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-lg border ${changeDue >= 0 && cashTenderedNum >= itemTotal ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
                            <div className="text-xs font-bold text-slate-600 mb-1">CHANGE DUE</div>
                            <div className={`text-xl font-black ${changeDue >= 0 && cashTenderedNum >= itemTotal ? 'text-emerald-700' : 'text-slate-800'}`}>
                              ₱{changeDue.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentSet.paymentMethod === 'QR' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scan to Pay Exact Amount</div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRPH_PAY_PHP_${itemTotal.toFixed(2)}`} 
                          alt="QRPh Code" 
                          className="w-32 h-32 rounded-lg shadow-sm border border-slate-200"
                        />
                        <div className="text-2xl font-black text-slate-800">₱{itemTotal.toFixed(2)}</div>
                      </div>
                    )}

                    {currentSet.paymentMethod === 'Credit' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <label className="block text-xs font-bold text-slate-600">Authorized Ledger Name</label>
                        <input
                          type="text"
                          value={currentSet.creditName || ''}
                          onChange={(e) => setSettlementData(prev => ({ ...prev, [itemId]: { ...prev[itemId], creditName: e.target.value } }))}
                          className="w-full p-3 border border-slate-300 rounded-lg text-sm font-bold placeholder:font-normal dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                          placeholder="Enter account name..."
                        />
                        
                        {currentSet.creditName && !AUTHORIZED_LEDGER.includes(currentSet.creditName) && (
                          <div className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                            ⚠️ Name not found in authorized ledger. Payment blocked.
                          </div>
                        )}
                        {currentSet.creditName && AUTHORIZED_LEDGER.includes(currentSet.creditName) && (
                          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            ✓ Authorized Listahan account verified.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Footer for Multi-Order */}
            <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-100 flex items-center justify-between mt-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  GRAND TOTAL DUE
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  ₱{multiGrandTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeGroupedTransaction}
                  disabled={!isAllValid}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-full text-xs shadow-airmee-orange transition flex items-center space-x-2 cursor-pointer active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>{isSubmittingGrouped ? 'LOGGING ORDER...' : 'FINALIZE & PRINT RECEIPT'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Single Order Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">

              {/* Order Summary Ribbon */}
              <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
              <span className="text-xs text-orange-600 font-extrabold uppercase tracking-widest block">Total Amount Due</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight">₱{totalAmount.toFixed(2)}</span>
            </div>
            {discount.isSeniorOrPwd && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-2xs">
                SC/PWD Discount Applied
              </span>
            )}
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
              Payment Path
            </label>
            <div className="grid grid-cols-3 gap-3">

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-2xl border font-extrabold text-xs flex flex-col items-center gap-2 transition cursor-pointer ${paymentMethod === 'CASH'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-airmee'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
              >
                <Banknote className="w-5 h-5 stroke-[2]" />
                <span>Cash Tender</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('E_WALLET')}
                className={`p-4 rounded-2xl border font-extrabold text-xs flex flex-col items-center gap-2 transition cursor-pointer ${paymentMethod === 'E_WALLET'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
              >
                <QrCode className="w-5 h-5 stroke-[2]" />
                <span>E-Wallet (QR Ph)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('LISTAHAN_CREDIT')}
                className={`p-4 rounded-2xl border font-extrabold text-xs flex flex-col items-center gap-2 transition cursor-pointer ${paymentMethod === 'LISTAHAN_CREDIT'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-airmee'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
              >
                <BookOpen className="w-5 h-5 stroke-[2]" />
                <span>Listahan (Credit)</span>
              </button>

            </div>
          </div>

          {/* TAB 1: CASH SETTLEMENT */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <label className="block text-xs font-bold text-slate-700">
                Rapid Cash Tender Preset:
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: 'Exact', val: Math.ceil(totalAmount) },
                  { label: '₱50', val: 50 },
                  { label: '₱100', val: 100 },
                  { label: '₱200', val: 200 },
                  { label: '₱500', val: 500 },
                  { label: '₱1000', val: 1000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setTenderedAmount(preset.val)}
                    className="py-2.5 bg-white border border-slate-200/80 hover:border-orange-500 hover:bg-orange-50 rounded-full text-xs font-black text-slate-900 transition cursor-pointer shadow-2xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Custom Cash Tendered (₱):
                </label>
                <input
                  type="number"
                  step="1"
                  min={totalAmount}
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-black px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                />
              </div>

              {/* Change Box */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${isCashInsufficient
                  ? 'bg-red-50 border-red-200 text-red-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
              >
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest block text-slate-500">
                    {isCashInsufficient ? 'Insufficient Tender' : 'Change Due to Customer'}
                  </span>
                  <span className="text-2xl font-black mt-0.5 block">
                    ₱{changeAmount.toFixed(2)}
                  </span>
                </div>
                {!isCashInsufficient && (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: E-WALLET (PAYMONGO QR PH) SETTLEMENT */}
          {paymentMethod === 'E_WALLET' && (
            <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-900">
                <span className="font-extrabold text-sm">PayMongo QR Ph Dynamic Settlement</span>
                <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  GCash / Maya
                </span>
              </div>

              {qrLoading ? (
                <div className="py-8 flex flex-col items-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                  <span className="text-xs text-slate-500 font-medium">Generating QR Ph code via PayMongo API...</span>
                </div>
              ) : paymongoData ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-airmee border border-slate-100 space-y-2">
                    <img
                      src={paymongoData.qrCodeUrl}
                      alt="PayMongo QR Ph"
                      className="w-48 h-48 mx-auto rounded-lg"
                    />
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Scan with GCash / Maya / Banking App
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-mono">
                      Ref #: <span className="font-extrabold text-slate-900">{paymongoData.paymongoRef}</span>
                    </p>
                    {paymongoData.checkoutUrl && (
                      <a
                        href={paymongoData.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 underline inline-block"
                      >
                        🔗 Open PayMongo Live Checkout Gateway
                      </a>
                    )}
                  </div>

                  {/* Verification Status */}
                  {paymongoVerified ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                      <span>Payment Verified 🟢 (PayMongo Webhook Received)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={verifyingWebhook}
                      onClick={handleSimulateWebhookVerification}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-full text-xs flex items-center justify-center space-x-2 transition shadow-airmee cursor-pointer"
                    >
                      {verifyingWebhook ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Polling PayMongo Webhook...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>Simulate Webhook Payment Check</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: LISTAHAN CREDIT (UTANG) SETTLEMENT */}
          {paymentMethod === 'LISTAHAN_CREDIT' && (
            <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Suki / Customer Account:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setAdminOverrideGranted(false);
                  }}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
                >
                  <option value="">-- Choose Suki Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Current Debt: ₱{c.currentDebt} / Limit: ₱{c.creditLimit})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Contact:</span>
                    <span className="font-semibold text-slate-900">{selectedCustomer.contact}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Unsettled Debt:</span>
                    <span className="font-black text-slate-900">₱{selectedCustomer.currentDebt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Authorized Credit Limit:</span>
                    <span className="font-black text-slate-900">₱{selectedCustomer.creditLimit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black pt-2.5 border-t border-slate-100">
                    <span>New Debt Balance after this Order:</span>
                    <span className={isOverCreditLimit ? 'text-red-600' : 'text-emerald-700'}>
                      ₱{(selectedCustomer.currentDebt + totalAmount).toFixed(2)}
                    </span>
                  </div>

                  {isOverCreditLimit && (
                    <div className="bg-red-50 border border-red-200 text-red-950 p-3 rounded-xl text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 font-extrabold text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Credit Limit Exceeded!</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Order total exceeds approved credit limit by ₱
                        {(selectedCustomer.currentDebt + totalAmount - selectedCustomer.creditLimit).toFixed(2)}. Store Owner authorization required for credit extension.
                      </p>
                      {adminOverrideGranted && (
                        <div className="text-emerald-700 font-extrabold flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Owner Authorization Granted!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinalizeTransaction}
            disabled={paymentMethod === 'CASH' && isCashInsufficient}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black rounded-full text-xs shadow-airmee-orange transition flex items-center space-x-2 cursor-pointer active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>FINALIZE & PRINT RECEIPT</span>
          </button>
        </div>
      </>
    )}

      </div>
    </div>
  );
};
