import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

export default function App() {
  // --- APPLICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Store Configuration & Settings
  const [settings, setSettings] = useState<StoreSettings>(() => db.getSettings());

  // User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Data Collections
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => db.getMenu());
  const [customers, setCustomers] = useState<CustomerCredit[]>(() => db.getCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => db.getTransactions());
  const [eodLogs, setEodLogs] = useState<EODRecord[]>(() => db.getEODLogs());
  const [debtPayments, setDebtPayments] = useState<DebtPaymentRecord[]>(() => db.getDebtPayments());
  const [staffAccounts, setStaffAccounts] = useState<UserProfile[]>(() => db.getStaffAccounts());

  // Cart & POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSeniorOrPwd, setIsSeniorOrPwd] = useState<boolean>(false);
  const [seniorPwdId, setSeniorPwdId] = useState<string>('');
  const [seniorPwdName, setSeniorPwdName] = useState<string>('');

  // Modals State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [completedTxForReceipt, setCompletedTxForReceipt] = useState<Transaction | null>(null);

  // Network Online Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);
    setPendingSyncCount(db.getSyncQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- MANUAL SYNC TRIGGER ---
  const handleTriggerManualSync = () => {
    setIsOnline(true);
    db.clearSyncQueue();
    setPendingSyncCount(0);
    alert('Synchronization complete! All local IndexedDB records synced with server.');
  };

  // --- CART HANDLERS ---
  const handleAddToCart = (item: MenuItem, isHalfOrder: boolean, modifiers: SelectedModifier[] = []) => {
    const basePrice = isHalfOrder && item.halfPrice ? item.halfPrice : item.price;
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
  const handleToggleSoldOut = (itemId: string, isSoldOut: boolean) => {
    const updated = db.toggleSoldOut(itemId, isSoldOut);
    setMenuItems(updated);
  };

  const handleSaveMenuItem = (item: MenuItem) => {
    const updated = db.saveMenuItem(item);
    setMenuItems(updated);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    const updated = db.deleteMenuItem(itemId);
    setMenuItems(updated);
  };

  // --- CUSTOMER & LISTAHAN HANDLERS ---
  const handleSaveCustomer = (customer: CustomerCredit) => {
    const updated = db.saveCustomer(customer);
    setCustomers(updated);
  };

  const handleRecordPayment = (customerId: string, amount: number, receivedBy: string, notes?: string) => {
    const result = db.recordCustomerPayment(customerId, amount, receivedBy, notes);
    if (result) {
      setCustomers(db.getCustomers());
      setDebtPayments(db.getDebtPayments());
    }
  };

  // --- TRANSACTION FINALIZATION ---
  const handleCompleteTransaction = (tx: Transaction) => {
    const savedTx = db.addTransaction(tx, isOnline);
    setTransactions(db.getTransactions());
    setCustomers(db.getCustomers()); // Refresh debt if credit
    setCart([]);
    setIsCheckoutOpen(false);
    setCompletedTxForReceipt(savedTx);
  };

  // --- EOD RECORD HANDLER ---
  const handleSaveEODRecord = (record: EODRecord) => {
    const updated = db.addEODRecord(record);
    setEodLogs(updated);
  };

  // --- STORE SETTINGS HANDLER ---
  const handleSaveSettings = (newSettings: StoreSettings) => {
    db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // --- SUBSCRIPTION TIER SELECTOR ---
  const handleSelectTier = (tier: SubscriptionTierLevel) => {
    const updated = { ...settings, activeTier: tier };
    db.saveSettings(updated);
    setSettings(updated);
    alert(`Switched active SaaS Subscription to Tier ${tier}!`);
  };

  // --- STAFF ACCOUNTS HANDLERS ---
  const handleSaveStaffAccount = (user: UserProfile) => {
    const updated = db.saveStaffAccount(user);
    setStaffAccounts(updated);
  };

  const handleDeleteStaffAccount = (userId: string) => {
    const updated = db.deleteStaffAccount(userId);
    setStaffAccounts(updated);
  };

  // --- AUTH / USER MANAGEMENT ---
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActiveTab('pos');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSwitchUserRole = () => {
    handleSignOut();
  };

  // Role Guard for Tab Access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      if (['bplo', 'eod', 'subscription'].includes(activeTab)) {
        setActiveTab('pos');
      }
    }
  }, [currentUser, activeTab]);

  // Compute Tax Relief Metrics
  const taxReliefStats = useMemo(() => {
    return db.getTaxReliefStats();
  }, [transactions]);

  // Render Login Landing Page if not logged in
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginLandingPage
        settings={settings}
        staffAccounts={staffAccounts}
        onLoginSuccess={handleLoginSuccess}
        onUpdateStaffAccounts={(accounts) => {
          db.saveStaffAccounts(accounts);
          setStaffAccounts(accounts);
        }}
      />
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

        {activeTab === 'eod' && (
          <EODModule
            transactions={transactions}
            menuItems={menuItems}
            eodLogs={eodLogs}
            closedBy={currentUser.name}
            onSaveEODRecord={handleSaveEODRecord}
          />
        )}

        {activeTab === 'bplo' && (
          <BploTaxModule
            stats={taxReliefStats}
            settings={settings}
            onUpgradeTier={handleSelectTier}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionModule
            activeTier={settings.activeTier}
            onSelectTier={handleSelectTier}
          />
        )}

        {activeTab === 'settings' && (
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
          <span>MARIKINA TAX RELIEF TRACKER: Gross ₱{taxReliefStats.currentAnnualGross.toLocaleString()} / ₱{taxReliefStats.annualGrossThreshold.toLocaleString()} cap. ({Math.max(0, taxReliefStats.annualGrossThreshold - taxReliefStats.currentAnnualGross).toLocaleString()} remaining)</span>
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
