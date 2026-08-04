# CariCloud POS — Marikina Carinderia Operating System

An airmee-themed Point-of-Sale (POS) counter operating system, digital customer credit ledger ("Listahan"), End-of-Day (EOD) food loss reconciler, and Marikina Municipal Tax Relief tracker (Ordinance No. 2026-018) for micro-eateries.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```
Access the application at `http://localhost:3000`.

---

## 📁 Directory Structure & Architecture

```
CariCloud-POS/
├── server.ts                       # Express REST API & Vite dev server middleware
├── package.json                    # Dependencies & build scripts
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript compiler configuration
├── index.html                      # Single Page Application HTML entry point
├── .env                            # Environment variables (Gemini API & PayMongo Key)
├── .env.example                    # Environment template
└── src/
    ├── main.tsx                    # React application bootstrap
    ├── App.tsx                     # Main layout, router, cart math & state manager
    ├── types.ts                    # TypeScript interfaces & data models
    ├── index.css                   # Tailwind CSS styling directives
    ├── services/
    │   └── db.ts                   # LocalStorage & IndexedDB offline-first service
    ├── data/
    │   └── initialData.ts          # Seed data (Menu, Customers, Accounts, EOD logs)
    └── components/
        ├── Header.tsx              # Airmee navigation header & multi-tenant role guards
        ├── LoginLandingPage.tsx    # Owner/Employee auth, registration & password reset
        ├── POSModule.tsx           # High-speed counter POS, portions, SC/PWD discount
        ├── CheckoutModal.tsx       # Settlement modal (Cash, PayMongo QR Ph, Listahan)
        ├── ReceiptModal.tsx        # Thermal receipt print simulation & auto-archiving
        ├── ReceiptsArchiveModule.tsx# Receipts log, filtering, search & reprint
        ├── MenuManagementModule.tsx# Menu dish CRUD, Canvas image compression & sold-out switch
        ├── ListahanModule.tsx      # Suki credit directory, debt limits & payment history
        ├── EODModule.tsx           # Cash drawer reconciliation & food wastage audit
        ├── BploTaxModule.tsx       # Marikina ₱250k tax relief tracker & BPLO sworn form
        ├── SettingsModule.tsx      # Multi-tenant settings, staff governance & UI themes
        └── SubscriptionModule.tsx  # SaaS tier governance (₱49, ₱99, ₱199/mo)
```

---

## 🔑 Key Features & Statutory Compliance

1. **High-Speed POS Counter**: Category filters, dish search, portion switching (Full vs. Half), real-time cart subtotal and line items.
2. **Philippine Statutory SC/PWD 20% Discount**: 12% VAT exemption followed by 20% Senior Citizen / PWD discount with mandatory OSCA/PWD ID validation.
3. **PayMongo QR Ph Dynamic Settlement**: Integrates live PayMongo API (`pk_live_u4PDUBWbMvWnQGiqdW2MYu46`) to generate scannable GCash/Maya QR codes, direct checkout gateway links, and live payment status checks.
4. **Digital Customer Listahan**: Suki credit limit authorization, debt balance tracking, cash repayments, and individual account payment history logs.
5. **End-of-Day (EOD) Reconciliation**: Physical cash drawer count, shortage/overage variance tracking, unsold food loss calibration, and net profit derivation.
6. **Marikina Ordinance No. 2026-018 Compliance**: Tracks ₱250,000 annual gross sales limit and outputs official printable sworn BPLO tax declaration forms.
7. **Multi-Tenant Security Governance**: Role guards restricting cashiers to POS and shift preferences while granting store owners full administrative control.