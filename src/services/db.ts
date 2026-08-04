import { MenuItem, CustomerCredit, StoreSettings, EODRecord, Transaction, DebtPaymentRecord, MarikinaTaxReliefStats, UserProfile } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_CUSTOMERS, INITIAL_STORE_SETTINGS, INITIAL_RECENT_TRANSACTIONS, INITIAL_EOD_LOGS, INITIAL_STAFF_ACCOUNTS } from '../data/initialData';

const STORAGE_KEYS = {
  MENU: 'caricloud_menu_v1',
  CUSTOMERS: 'caricloud_customers_v1',
  TRANSACTIONS: 'caricloud_transactions_v1',
  SETTINGS: 'caricloud_settings_v1',
  EOD: 'caricloud_eod_v1',
  DEBT_PAYMENTS: 'caricloud_debt_payments_v1',
  SYNC_QUEUE: 'caricloud_sync_queue_v1',
  IS_ONLINE: 'caricloud_is_online_v1',
  STAFF: 'caricloud_staff_v1',
};

// IndexedDB database setup
class LocalStorageDatabase {
  private dbName = 'CariCloudDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;
    
    return new Promise<void>((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('menu')) {
          db.createObjectStore('menu', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        console.warn('IndexedDB fallback to LocalStorage');
        resolve();
      };
    });
  }

  // --- MENU STORAGE ---
  getMenu(): MenuItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU);
    if (!raw) {
      this.saveMenu(INITIAL_MENU_ITEMS);
      return INITIAL_MENU_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  }

  private safeSetItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage quota limit reached for key: ${key}`, e);
    }
  }

  saveMenu(items: MenuItem[]) {
    this.safeSetItem(STORAGE_KEYS.MENU, JSON.stringify(items));
  }

  toggleSoldOut(itemId: string, isSoldOut: boolean): MenuItem[] {
    const items = this.getMenu();
    const updated = items.map((item) => (item.id === itemId ? { ...item, isSoldOut } : item));
    this.saveMenu(updated);
    return updated;
  }

  saveMenuItem(item: MenuItem): MenuItem[] {
    const items = this.getMenu();
    const index = items.findIndex((i) => i.id === item.id);
    let updated: MenuItem[];
    if (index >= 0) {
      updated = [...items];
      updated[index] = item;
    } else {
      updated = [item, ...items];
    }
    this.saveMenu(updated);
    return updated;
  }

  deleteMenuItem(itemId: string): MenuItem[] {
    const items = this.getMenu().filter((i) => i.id !== itemId);
    this.saveMenu(items);
    return items;
  }

  // --- CUSTOMERS & LISTAHAN CREDIT ---
  getCustomers(): CustomerCredit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      this.saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  saveCustomers(customers: CustomerCredit[]) {
    this.safeSetItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  saveCustomer(customer: CustomerCredit): CustomerCredit[] {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    let updated: CustomerCredit[];
    if (idx >= 0) {
      updated = [...customers];
      updated[idx] = { ...customer, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...customer, updatedAt: new Date().toISOString() }, ...customers];
    }
    this.saveCustomers(updated);
    return updated;
  }

  recordCustomerCreditDebt(customerId: string, addDebtAmount: number): CustomerCredit | null {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx < 0) return null;

    const target = customers[idx];
    const updatedCustomer: CustomerCredit = {
      ...target,
      currentDebt: Math.max(0, target.currentDebt + addDebtAmount),
      lastTransactionDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    customers[idx] = updatedCustomer;
    this.saveCustomers(customers);
    return updatedCustomer;
  }

  recordCustomerPayment(customerId: string, amountPaid: number, receivedBy: string, notes?: string): { customer: CustomerCredit; paymentRecord: DebtPaymentRecord } | null {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx < 0) return null;

    const target = customers[idx];
    const newDebt = Math.max(0, target.currentDebt - amountPaid);
    const updatedCustomer: CustomerCredit = {
      ...target,
      currentDebt: newDebt,
      updatedAt: new Date().toISOString(),
    };
    customers[idx] = updatedCustomer;
    this.saveCustomers(customers);

    const paymentRecord: DebtPaymentRecord = {
      id: 'pay-' + Date.now(),
      customerId,
      customerName: target.name,
      amount: amountPaid,
      timestamp: new Date().toISOString(),
      notes: notes || 'Cash Payment on Account',
      receivedBy,
    };

    const existingPayments = this.getDebtPayments();
    this.safeSetItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify([paymentRecord, ...existingPayments]));

    return { customer: updatedCustomer, paymentRecord };
  }

  getDebtPayments(): DebtPaymentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBT_PAYMENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // --- TRANSACTIONS ---
  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      this.saveTransactions(INITIAL_RECENT_TRANSACTIONS);
      return INITIAL_RECENT_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RECENT_TRANSACTIONS;
    }
  }

  saveTransactions(transactions: Transaction[]) {
    this.safeSetItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  addTransaction(tx: Transaction, isOnline: boolean): Transaction {
    const all = this.getTransactions();
    const updatedTx = { ...tx, syncedOffline: isOnline };
    const newList = [updatedTx, ...all];
    this.saveTransactions(newList);

    if (!isOnline) {
      this.addToSyncQueue({ id: tx.id, type: 'ADD_TRANSACTION', payload: updatedTx, createdAt: new Date().toISOString() });
    }

    // If paid via Listahan credit, adjust debt
    if (tx.paymentMethod === 'LISTAHAN_CREDIT' && tx.customerId) {
      this.recordCustomerCreditDebt(tx.customerId, tx.totalAmount);
    }

    return updatedTx;
  }

  // --- END OF DAY LOGS ---
  getEODLogs(): EODRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EOD);
    if (!raw) {
      this.saveEODLogs(INITIAL_EOD_LOGS);
      return INITIAL_EOD_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EOD_LOGS;
    }
  }

  saveEODLogs(logs: EODRecord[]) {
    this.safeSetItem(STORAGE_KEYS.EOD, JSON.stringify(logs));
  }

  addEODRecord(record: EODRecord): EODRecord[] {
    const logs = this.getEODLogs();
    const updated = [record, ...logs];
    this.saveEODLogs(updated);
    return updated;
  }

  // --- STORE SETTINGS & TIERS ---
  getSettings(): StoreSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      this.saveSettings(INITIAL_STORE_SETTINGS);
      return INITIAL_STORE_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  }

  saveSettings(settings: StoreSettings) {
    this.safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- STAFF & ACCOUNTS MANAGEMENT ---
  getStaffAccounts(): UserProfile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      this.saveStaffAccounts(INITIAL_STAFF_ACCOUNTS);
      return INITIAL_STAFF_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STAFF_ACCOUNTS;
    }
  }

  saveStaffAccounts(staff: UserProfile[]) {
    this.safeSetItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }

  saveStaffAccount(user: UserProfile): UserProfile[] {
    const staff = this.getStaffAccounts();
    const idx = staff.findIndex((s) => s.id === user.id);
    let updated: UserProfile[];
    if (idx >= 0) {
      updated = [...staff];
      updated[idx] = user;
    } else {
      updated = [...staff, user];
    }
    this.saveStaffAccounts(updated);
    return updated;
  }

  deleteStaffAccount(userId: string): UserProfile[] {
    const staff = this.getStaffAccounts().filter((s) => s.id !== userId);
    this.saveStaffAccounts(staff);
    return staff;
  }

  // --- MARIKINA TAX RELIEF CALCULATOR ---
  getTaxReliefStats(): MarikinaTaxReliefStats {
    const transactions = this.getTransactions();
    // Annual gross sales calculations (summing all completed transactions)
    const currentAnnualGross = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0) + 148500; // Adding historical sales baseline for Marikina demo
    const annualGrossThreshold = 250000; // Marikina Municipal Ordinance 2026

    // Estimated quarterly breakdown
    const q1 = Math.round(currentAnnualGross * 0.28);
    const q2 = Math.round(currentAnnualGross * 0.32);
    const q3 = Math.round(currentAnnualGross * 0.24);
    const q4 = Math.round(currentAnnualGross * 0.16);

    const isEligibleForRelief = currentAnnualGross <= annualGrossThreshold;
    // Estimated tax savings at 1.5% local business tax rate
    const estimatedTaxSavings = isEligibleForRelief ? currentAnnualGross * 0.015 : 0;

    return {
      annualGrossThreshold,
      currentAnnualGross,
      quarter1Gross: q1,
      quarter2Gross: q2,
      quarter3Gross: q3,
      quarter4Gross: q4,
      projectedAnnualGross: Math.round(currentAnnualGross * 1.15),
      isEligibleForRelief,
      estimatedTaxSavings,
      lastUpdated: new Date().toISOString(),
    };
  }

  // --- OFFLINE SYNC QUEUE ---
  getSyncQueue(): Array<{ id: string; type: string; payload: any; createdAt: string }> {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  addToSyncQueue(item: { id: string; type: string; payload: any; createdAt: string }) {
    const queue = this.getSyncQueue();
    this.safeSetItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([...queue, item]));
  }

  clearSyncQueue() {
    this.safeSetItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
  }
}

export const db = new LocalStorageDatabase();
