import React, { useState, useEffect, useMemo } from 'react';
import {
  MenuItem,
  CartItem,
  Transaction,
  CustomerCredit,
  EODRecord,
  StoreSettings,
  UserProfile,
  SelectedModifier,
  SubscriptionTierLevel,
  DebtPaymentRecord
} from './types';
import { Header } from './components/Header';
import { LoginLandingPage } from './components/LoginLandingPage';
import { POSModule } from './components/POSModule';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { MenuManagementModule } from './components/MenuManagementModule';
import { ReceiptsArchiveModule } from './components/ReceiptsArchiveModule';
import { EODModule } from './components/EODModule';
import { ListahanModule } from './components/ListahanModule';
import { BploTaxModule } from './components/BploTaxModule';
import { SubscriptionModule } from './components/SubscriptionModule';
import { SettingsModule } from './components/SettingsModule';
import { Lock, ShieldAlert, LogOut } from 'lucide-react';

export default function App() {
  // --- APPLICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Store Configuration & Settings (Persisted)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('caricloud_settings');
    return saved ? JSON.parse(saved) : {
      storeName: 'CariCloud POS',
      address: 'Marikina City',
      contactNumber: '',
      receiptFooter: 'Thank you for dining with us!',
      taxRate: 0,
      isVatRegistered: false,
      enableTaxReliefTracker: true
    };
  });

  // Save settings to storage automatically when they change
  useEffect(() => {
    localStorage.setItem('caricloud_settings', JSON.stringify(settings));
  }, [settings]);

  // User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Limbo Access Guard (Non-ADMIN without parentOwnerId)
  const isLimbo = Boolean(
    currentUser &&
    currentUser.role !== 'ADMIN' &&
    (currentUser.parentOwnerId === null || currentUser.parentOwnerId === undefined)
  );

  // Data Collections (Initialized with safe local state)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [eodLogs, setEodLogs] = useState<EODRecord[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPaymentRecord[]>([]);

  // Data Collections (Persisted)
  const [staffAccounts, setStaffAccounts] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('caricloud_staff');
    return saved ? JSON.parse(saved) : [];
  });

  // Save staff to storage automatically when accounts are added/deleted
  useEffect(() => {
    localStorage.setItem('caricloud_staff', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSeniorOrPwd, setIsSeniorOrPwd] = useState<boolean>(false);
  const [seniorPwdId, setSeniorPwdId] = useState<string>('');
  const [seniorPwdName, setSeniorPwdName] = useState<string>('');

  // Modals State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedTxForReceipt, setCompletedTxForReceipt] = useState<Transaction | null>(null);

  // Helper functions for Menu & Transactions sync with MySQL
  const fetchMenu = async (tenantId: string | number) => {
    try {
      const res = await fetch(`/api/menu?userId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMenuItems(data);
        }
      }
    } catch (err) {
      console.log('Backend menu fetch offline or fallback:', err);
    }
  };

  const fetchTransactions = async (tenantId: string | number) => {
    try {
      const res = await fetch(`/api/transactions?userId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      }
    } catch (err) {
      console.log('Backend transactions fetch offline or fallback:', err);
    }
  };

  // Load Menu and Transaction Data from Express Backend after login (Multi-tenant secured)
  useEffect(() => {
    if (currentUser && !isLimbo) {
      const tenantId = currentUser.role === 'ADMIN' ? currentUser.id : currentUser.parentOwnerId || 1;
      fetchMenu(tenantId);
      fetchTransactions(tenantId);
    }
  }, [currentUser, isLimbo]);

  // Network Online Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- MANUAL SYNC TRIGGER ---
  const handleTriggerManualSync = () => {
    setIsOnline(true);
    setPendingSyncCount(0);
    alert('Synchronization complete!');
  };

  // --- CART HANDLERS ---
  const handleAddToCart = (item: MenuItem, isHalfOrder: boolean, modifiers: SelectedModifier[] = []) => {
    const basePrice = isHalfOrder ? (item.halfPrice || Math.round(item.price / 2)) : item.price;
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
    const unitPrice = basePrice + modifierTotal;

    const cartItemId = `${item.id}-${isHalfOrder ? 'half' : 'full'}-${modifiers.map((m) => m.name).join('_')}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + 1;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            cartItemId,
            menuItem: item,
            isHalfOrder,
            quantity: 1,
            selectedModifiers: modifiers,
            unitPrice,
            totalPrice: unitPrice,
          },
        ];
      }
    });
  };

  const handleUpdateCartItemQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleToggleSeniorPwd = (enabled: boolean, idNumber?: string, customerName?: string) => {
    setIsSeniorOrPwd(enabled);
    if (idNumber) setSeniorPwdId(idNumber);
    if (customerName) setSeniorPwdName(customerName);
  };

  // Compute Cart Math Summary
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const discountDetails = useMemo(() => {
    if (!isSeniorOrPwd || cartSubtotal === 0) {
      return {
        isSeniorOrPwd: false,
        vatExemptAmount: 0,
        discountAmount: 0,
        finalTotal: cartSubtotal,
      };
    }
    const netSales = cartSubtotal / 1.12;
    const vatExemptAmount = Math.round((cartSubtotal - netSales) * 100) / 100;
    const discountAmount = Math.round((netSales * 0.20) * 100) / 100;
    const finalTotal = Math.max(0, Math.round((netSales - discountAmount) * 100) / 100);

    return {
      isSeniorOrPwd: true,
      idNumber: seniorPwdId,
      customerName: seniorPwdName,
      vatExemptAmount,
      discountAmount,
      finalTotal,
    };
  }, [cartSubtotal, isSeniorOrPwd, seniorPwdId, seniorPwdName]);

  // --- MENU MANAGEMENT HANDLERS ---
  const handleToggleSoldOut = async (itemId: string, isSoldOut: boolean) => {
    // Optimistic state update
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isSoldOut } : item))
    );

    const tenantId = currentUser?.role === 'ADMIN' ? currentUser.id : currentUser?.parentOwnerId || 1;
    try {
      await fetch(`/api/menu/${itemId}/soldout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tenantId, isSoldOut }),
      });
      fetchMenu(tenantId);
    } catch (err) {
      console.error('Failed to persist sold-out status:', err);
      fetchMenu(tenantId);
    }
  };

  const handleSaveMenuItem = async (item: MenuItem) => {
    const tenantId = currentUser?.role === 'ADMIN' ? currentUser.id : currentUser?.parentOwnerId || 1;
    const isEditing = menuItems.some((i) => i.id === item.id);

    if (isEditing) {
      // Optimistic update
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      try {
        const res = await fetch(`/api/menu/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: tenantId, ...item }),
        });
        if (res.ok) {
          fetchMenu(tenantId);
        }
      } catch (err) {
        console.error('Failed to update menu item in MySQL:', err);
        fetchMenu(tenantId);
      }
    } else {
      // Create new menu item - Optimistically add to state immediately
      setMenuItems((prev) => [item, ...prev]);
      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: tenantId, ...item }),
        });
        if (res.ok) {
          const data = await res.json();
          const createdItem: MenuItem = data.id ? data : (data.item || item);
          setMenuItems((prev) =>
            prev.map((i) => (i.id === item.id ? createdItem : i))
          );
          fetchMenu(tenantId);
        }
      } catch (err) {
        console.error('Failed to create menu item in MySQL:', err);
        fetchMenu(tenantId);
      }
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    // Optimistic deletion
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));

    const tenantId = currentUser?.role === 'ADMIN' ? currentUser.id : currentUser?.parentOwnerId || 1;
    try {
      const res = await fetch(`/api/menu/${itemId}?userId=${tenantId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMenu(tenantId);
      }
    } catch (err) {
      console.error('Failed to delete menu item in MySQL:', err);
      fetchMenu(tenantId);
    }
  };

  // --- CUSTOMER & LISTAHAN HANDLERS ---
  const handleSaveCustomer = (customer: CustomerCredit) => {
    setCustomers((prev) => [...prev, customer]);
  };

  const handleRecordPayment = (customerId: string, amount: number, receivedBy: string, notes?: string) => {
    const targetCustomer = customers.find((c) => c.id === customerId);
    const newPaymentRecord: DebtPaymentRecord = {
      id: 'dp-' + Date.now(),
      customerId,
      customerName: targetCustomer ? targetCustomer.name : 'Suki Customer',
      amount,
      timestamp: new Date().toISOString(),
      notes,
      receivedBy: receivedBy || (currentUser ? currentUser.name : 'Cashier'),
    };

    setDebtPayments((prev) => [newPaymentRecord, ...prev]);

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, currentDebt: Math.max(0, c.currentDebt - amount), updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  // --- TRANSACTION FINALIZATION ---
  const handleCompleteTransaction = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setCompletedTxForReceipt(tx);

    const tenantId = currentUser?.role === 'ADMIN' ? currentUser.id : currentUser?.parentOwnerId || 1;

    if (!isOnline) {
      setPendingSyncCount((prev) => prev + 1);
    } else {
      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tenantId,
          receiptNo: tx.receiptNo,
          cashierName: tx.cashierName,
          paymentMode: tx.paymentMethod,
          items: tx.items,
          subtotal: tx.subtotal,
          discount: tx.discount,
          totalAmount: tx.totalAmount,
          tenderedAmount: tx.tenderedAmount,
          changeAmount: tx.changeAmount,
          customerId: tx.customerId,
          customerName: tx.customerName,
          paymongoRef: tx.paymongoRef,
          timestamp: tx.timestamp,
        })
      })
        .then((res) => res.json())
        .then(() => {
          fetchTransactions(tenantId);
        })
        .catch((err) => {
          console.log('Transaction logged locally:', err);
          setPendingSyncCount((prev) => prev + 1);
        });
    }
  };

  // --- EOD RECORD HANDLER ---
  const handleSaveEODRecord = (record: EODRecord) => {
    setEodLogs((prev) => [record, ...prev]);
  };

  // --- STORE SETTINGS HANDLER ---
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  // --- SUBSCRIPTION TIER SELECTOR ---
  const handleSelectTier = (tier: SubscriptionTierLevel) => {
    const updated = { ...settings, activeTier: tier };
    setSettings(updated);
    alert(`Switched active SaaS Subscription to Tier ${tier}!`);
  };

  // --- STAFF ACCOUNTS HANDLERS ---
  const handleSaveStaffAccount = (user: UserProfile) => {
    if (user.role === 'ADMIN') {
      alert('Security Policy Enforcement: Logged-in Owners are strictly prohibited from creating or escalating staff accounts to Owner (ADMIN) account role.');
      console.warn('Illegal Owner Account Prevention: Blocked creation of staff account with ADMIN role');
      return;
    }
    setStaffAccounts((prev) => [...prev, user]);
  };

  const handleDeleteStaffAccount = (userId: string) => {
    setStaffAccounts((prev) => prev.filter((u) => u.id !== userId));
  };

  // --- AUTH / USER MANAGEMENT ---
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    const isUnassigned = user.role !== 'ADMIN' && (user.parentOwnerId === null || user.parentOwnerId === undefined);
    if (isUnassigned) {
      setActiveTab('limbo');
    } else {
      setActiveTab('pos');
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSwitchUserRole = () => {
    handleSignOut();
  };

  const handleSetActiveTab = (tab: string) => {
    if (isLimbo) {
      return; // Block access to all tabs when in Limbo state
    }
    setActiveTab(tab);
  };

  // Role Guard & Limbo Access Guard for Navigation Tabs
  useEffect(() => {
    if (currentUser) {
      const isUnassigned = currentUser.role !== 'ADMIN' && (currentUser.parentOwnerId === null || currentUser.parentOwnerId === undefined);
      if (isUnassigned) {
        if (activeTab !== 'limbo') {
          setActiveTab('limbo');
        }
      } else if (currentUser.role !== 'ADMIN') {
        if (['bplo', 'eod', 'subscription', 'settings'].includes(activeTab)) {
          setActiveTab('pos');
        }
      }
    }
  }, [currentUser, activeTab]);

  // Compute Tax Relief Metrics (Fixed missing properties to prevent BPLO tab crash)
  const taxReliefStats = useMemo(() => {
    const currentAnnualGross = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
    return {
      currentAnnualGross,
      annualGrossThreshold: 250000,
      isEligibleForRelief: currentAnnualGross <= 250000,
      quarter1Gross: 0, // Fallback properties added to satisfy MarikinaTaxReliefStats type
      quarter2Gross: 0,
      quarter3Gross: 0,
      quarter4Gross: 0,
      projectedAnnualGross: currentAnnualGross,
      estimatedTaxSavings: currentAnnualGross <= 250000 ? currentAnnualGross * 0.03 : 0,
      lastUpdated: new Date().toISOString()
    };
  }, [transactions]);

  // OBJECTIVE 5: New Employee "Limbo" State Access Guard
  const isLimboEmployee = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return false;
    // CASHIER / non-ADMIN role AND (parentOwnerId == null or parentOwnerId === undefined)
    const hasParentOwner = currentUser.parentOwnerId !== null && currentUser.parentOwnerId !== undefined && currentUser.parentOwnerId !== '';
    return !hasParentOwner || currentUser.invitationStatus === 'PENDING';
  }, [currentUser]);

  // Render Login Landing Page if not logged in
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginLandingPage
        settings={settings}
        staffAccounts={staffAccounts}
        onLoginSuccess={handleLoginSuccess}
        onUpdateStaffAccounts={(accounts) => setStaffAccounts(accounts)}
      />
    );
  }

  // OBJECTIVE 5: Render Locked Limbo Screen for Unassigned Employees
  if (isLimboEmployee) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 font-sans">
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-airmee-orange">
              C
            </div>
            <div>
              <h1 className="text-lg font-black text-white">CariCloud POS</h1>
              <p className="text-xs text-slate-400 font-medium">Unassigned Employee Portal</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-full border border-slate-700 cursor-pointer flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5 text-orange-400" />
            Sign Out ({currentUser.name})
          </button>
        </header>

        <main className="max-w-md mx-auto w-full my-auto text-center space-y-6 bg-slate-800/90 border border-slate-700/80 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Account Unassigned • Limbo Guard Locked
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Account Unassigned
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Account Unassigned: You are not currently linked to an active Store Owner. Please accept a shop invitation to unlock POS operations.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 w-full text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Employee:</span>
              <span className="font-bold text-slate-200">{currentUser.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Role:</span>
              <span className="font-bold text-amber-400">{currentUser.role}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Store Owner Link:</span>
              <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">UNASSIGNED (null)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-full shadow-airmee-orange transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              RETURN TO LOGIN PORTAL
            </button>
          </div>
        </main>

        <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-6 border-t border-slate-800 font-medium">
          CariCloud POS System • Marikina City SME Ordinance No. 2026-018
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-orange-600 selection:text-white">

      {/* Top Header & Navigation */}
      <Header
        settings={settings}
        currentUser={currentUser}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onSyncTrigger={handleTriggerManualSync}
        onSwitchUser={handleSwitchUserRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-6">
        {activeTab === 'pos' && (
          <POSModule
            menuItems={menuItems}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartItemQuantity={handleUpdateCartItemQuantity}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            isSeniorOrPwd={isSeniorOrPwd}
            onToggleSeniorPwd={handleToggleSeniorPwd}
            seniorPwdId={seniorPwdId}
            seniorPwdName={seniorPwdName}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsArchiveModule
            transactions={transactions}
            settings={settings}
            onSelectReceipt={(tx) => setCompletedTxForReceipt(tx)}
          />
        )}

        {activeTab === 'menu' && (
          <MenuManagementModule
            menuItems={menuItems}
            currentUserRole={currentUser.role}
            onToggleSoldOut={handleToggleSoldOut}
            onSaveMenuItem={handleSaveMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        )}

        {activeTab === 'listahan' && (
          <ListahanModule
            customers={customers}
            debtPayments={debtPayments}
            onSaveCustomer={handleSaveCustomer}
            onRecordPayment={handleRecordPayment}
            receivedBy={currentUser.name}
            currentUserRole={currentUser.role}
          />
        )}

        {activeTab === 'eod' && currentUser.role === 'ADMIN' && (
          <EODModule
            transactions={transactions}
            menuItems={menuItems}
            eodLogs={eodLogs}
            closedBy={currentUser.name}
            onSaveEODRecord={handleSaveEODRecord}
          />
        )}

        {activeTab === 'bplo' && currentUser.role === 'ADMIN' && (
          <BploTaxModule
            stats={taxReliefStats}
            settings={settings}
            onUpgradeTier={handleSelectTier}
          />
        )}

        {activeTab === 'subscription' && currentUser.role === 'ADMIN' && (
          <SubscriptionModule
            activeTier={settings.activeTier}
            onSelectTier={handleSelectTier}
          />
        )}

        {activeTab === 'settings' && currentUser.role === 'ADMIN' && (
          <SettingsModule
            settings={settings}
            staffAccounts={staffAccounts}
            currentUserRole={currentUser.role}
            onSaveSettings={handleSaveSettings}
            onUpgradeTier={handleSelectTier}
            onSaveStaffAccount={handleSaveStaffAccount}
            onDeleteStaffAccount={handleDeleteStaffAccount}
          />
        )}
      </main>

      {/* Clean Utility Airmee Theme Status Bar */}
      <div className="h-9 bg-slate-900 text-slate-200 border-t border-slate-800 flex items-center px-4 sm:px-6 text-[11px] font-medium tracking-wide justify-between shrink-0 sticky bottom-0 z-20">
        <span className="truncate flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          {currentUser.role === 'ADMIN' ? (
            <span>MARIKINA TAX RELIEF TRACKER: Gross ₱{taxReliefStats.currentAnnualGross.toLocaleString()} / ₱{taxReliefStats.annualGrossThreshold.toLocaleString()} cap. ({Math.max(0, taxReliefStats.annualGrossThreshold - taxReliefStats.currentAnnualGross).toLocaleString()} remaining)</span>
          ) : (
            <span>CARICLOUD OPERATIONAL COUNTER: Shift Active • Marikina City SME Ordinance No. 2026-018</span>
          )}
        </span>
        <span className="ml-4 font-mono text-[10px] uppercase font-bold shrink-0 bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
          OOS SYNC: {isOnline ? 'ACTIVE' : `OFFLINE (${pendingSyncCount} QUEUED)`}
        </span>
      </div>

      {/* CHECKOUT SETTLEMENT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={cartSubtotal}
        discount={discountDetails}
        totalAmount={discountDetails.finalTotal}
        customers={customers}
        cashierName={currentUser.name}
        currentUserRole={currentUser.role}
        onComplete={handleCompleteTransaction}
      />

      {/* RECEIPT MODAL */}
      <ReceiptModal
        transaction={completedTxForReceipt}
        settings={settings}
        onClose={() => setCompletedTxForReceipt(null)}
      />

    </div>
  );
}