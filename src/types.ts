export type Role = 'ADMIN' | 'CASHIER';

export type OperationalMode = 'SINGLE_OPERATOR' | 'MULTI_TENANT';

export type SubscriptionTierLevel = 1 | 2 | 3;

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  email?: string;
  username?: string;
  password?: string;
  avatar?: string;
  pin?: string;
  parentOwnerId?: string | number;
  invitationStatus?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitationToken?: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface EmployeeInvitation {
  invitation_id: number | string;
  tenant_id: number | string;
  email: string;
  token: string;
  status: InvitationStatus;
  created_at: string;
  expires_at?: string;
}


export type Category = 'Ulam' | 'Rice' | 'Drinks' | 'Snacks' | 'Specials';

export interface MenuItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  halfPrice?: number;
  isSoldOut: boolean;
  description?: string;
  image?: string;
  allowHalfOrder: boolean;
}

export interface SelectedModifier {
  name: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  isHalfOrder: boolean;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'E_WALLET' | 'LISTAHAN_CREDIT';

export interface DiscountDetails {
  isSeniorOrPwd: boolean;
  idNumber?: string;
  customerName?: string;
  vatExemptAmount: number;
  discountAmount: number;
}

export interface Transaction {
  id: string;
  receiptNo: string;
  timestamp: string; // ISO String
  items: CartItem[];
  subtotal: number;
  discount: DiscountDetails;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  tenderedAmount?: number;
  changeAmount?: number;
  customerId?: string; // For Listahan
  customerName?: string;
  paymongoRef?: string;
  paymongoStatus?: 'PENDING' | 'PAID' | 'FAILED';
  cashierName: string;
  syncedOffline: boolean;
}

export interface CustomerCredit {
  id: string;
  name: string;
  contact: string;
  address?: string;
  creditLimit: number;
  currentDebt: number;
  isApproved: boolean;
  notes?: string;
  lastTransactionDate?: string;
  updatedAt: string;
}

export interface DebtPaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  timestamp: string;
  notes?: string;
  receivedBy: string;
}

export interface UnsoldItemLoss {
  menuItemId: string;
  dishName: string;
  quantityUnsold: number;
  unitPrice: number;
  totalLoss: number;
}

export interface EODRecord {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO string
  closedBy: string;
  expectedGrossSales: number;
  actualCashInBox: number;
  cashVariance: number; // actualCashInBox - expectedCash
  eWalletSales: number;
  creditSales: number;
  unsoldLosses: UnsoldItemLoss[];
  totalWastageValue: number;
  netSales: number; // Gross - Vat - Discount
  netProfit: number; // Net Sales - Wastage Value
  totalTransactionsCount: number;
  notes?: string;
}

export interface MarikinaTaxReliefStats {
  annualGrossThreshold: number; // 250000 PHP
  currentAnnualGross: number;
  quarter1Gross: number;
  quarter2Gross: number;
  quarter3Gross: number;
  quarter4Gross: number;
  projectedAnnualGross: number;
  isEligibleForRelief: boolean;
  estimatedTaxSavings: number;
  lastUpdated: string;
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  address: string;
  tinNumber: string;
  bploPermitNo: string;
  contactNumber: string;
  operationalMode: OperationalMode;
  themeColor: 'orange' | 'amber' | 'emerald' | 'slate';
  activeTier: SubscriptionTierLevel;
}
