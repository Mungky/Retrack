# Re-Start — Dokumentasi Workflow Lengkap

Dokumen ini menjelaskan workflow aplikasi **Re-Start** (Premium Personal Finance Tracker) secara menyeluruh untuk keperluan pembelajaran dan pemeliharaan.

---

## Daftar Isi

1. [Ringkasan Arsitektur](#1-ringkasan-arsitektur)
2. [Stack Teknologi](#2-stack-teknologi)
3. [Struktur Folder](#3-struktur-folder)
4. [Alur Autentikasi](#4-alur-autentikasi)
5. [Database & Schema](#5-database--schema)
6. [Data Flow (Server ↔ Client)](#6-data-flow-server--client)
7. [Context Providers & Hierarchy](#7-context-providers--hierarchy)
8. [State Management (Zustand)](#8-state-management-zustand)
9. [Routing & Navigasi](#9-routing--navigasi)
10. [Halaman & Fitur per Route](#10-halaman--fitur-per-route)
11. [Alur Transaksi (Add/Edit/Delete)](#11-alur-transaksi-addeditdelete)
12. [Optimistic Updates](#12-optimistic-updates)
13. [Fitur Premium (Pro)](#13-fitur-premium-pro)
14. [Tema & Theming](#14-tema--theming)
15. [Event System](#15-event-system)
16. [Hooks & Utilities](#16-hooks--utilities)
17. [Revalidasi Cache](#17-revalidasi-cache)
18. [Diagram Alur Utama](#18-diagram-alur-utama)

---

## 1. Ringkasan Arsitektur

Re-Start adalah **Next.js 16 App Router** dengan pola:

- **Server Components** untuk fetch data awal (wallets, transactions, categories, dll)
- **Client Components** untuk interaktivitas, form, dan state
- **Supabase** untuk auth (Supabase Auth) dan database (PostgreSQL)
- **Zustand** untuk state global (optimistic, subscription, premium modal)
- **React Context** untuk Auth, Toast, dan Sheet
- **PWA** (Progressive Web App) via `@ducanh2912/next-pwa`

---

## 2. Stack Teknologi

| Kategori | Teknologi |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| State | Zustand, React Context |
| Form | react-hook-form |
| Chart | Recharts |
| Animasi | Framer Motion |
| PWA | @ducanh2912/next-pwa |
| Font | Inter, Playfair Display |

---

## 3. Struktur Folder

```
app/                    # Halaman (App Router)
├── actions.ts          # revalidateTransactionPaths (Server Action)
├── actions/
│   ├── subscription.ts # getProStatus, upgradeToProLifetime
│   ├── export.ts       # Export data ke CSV
│   └── categories.ts   # CRUD kategori
├── auth/callback/      # OAuth callback (exchangeCodeForSession)
├── layout.tsx          # Root layout + provider hierarchy
├── page.tsx            # Landing (redirect jika login)
├── login/              # Halaman login
├── register/           # Halaman register
├── signup/             # Alias register
├── dashboard/          # Home dashboard
├── transactions/      # Daftar transaksi
├── statistics/         # Statistik & chart
├── budget/             # Budget per kategori
├── categories/         # Kelola kategori
├── settings/           # Pengaturan (ProfileClient)
├── terms/              # Syarat & ketentuan
└── privacy/            # Kebijakan privasi

components/             # Komponen UI
├── AppShell.tsx        # Layout: Sidebar + BottomNav + children
├── Sidebar.tsx         # Nav desktop (hidden di landing/auth)
├── BottomNav.tsx       # Nav mobile (hidden di landing/auth)
├── FloatingActionButton.tsx  # FAB untuk Add Income/Expense
├── QuickActionsRow.tsx # Income, Expense, Transfer, Tally
├── AddTransactionSheet.tsx
├── EditTransactionSheet.tsx
├── QuickTransferSheet.tsx
├── CalculatorDialog.tsx
├── BalanceCard.tsx
├── DashboardWallets.tsx
├── DashboardSummary.tsx
├── TransactionsList.tsx
├── TransactionItem.tsx
├── BudgetClient.tsx
├── CategoryManagement.tsx
├── ProfileClient.tsx
├── WalletManagement.tsx
├── CategoryManager.tsx
├── SubscriptionSync.tsx
├── premium/PremiumModal.tsx
├── landing/            # Landing page components
├── shared/             # BaseSheet, CategoryIconDisplay, ConfirmDialog
├── settings/           # DataManagementCard, DataExport
└── ui/                 # Button, Input, Card, Dialog, Select, dll

contexts/
├── AuthContext.tsx     # user, loading, signOut
├── ToastContext.tsx    # showToast
└── SheetContext.tsx    # isSheetOpen, setIsSheetOpen

stores/
├── optimisticTransactionStore.ts  # Optimistic transactions + walletDeltas
├── subscriptionStore.ts           # isPro, checkLimit
└── premiumModalStore.ts           # open/close Premium modal

lib/
├── supabase-client.ts  # Browser client (createBrowserClient)
├── supabase-server.ts  # Server client (createServerClient + cookies)
├── auth-helpers.ts     # getServerUser, getServerUserId, requireAuth
├── app-events.ts       # REFRESH_CATEGORIES_EVENT
├── date-range.ts       # DateRangeKey, getDateRange, filterTransactionsByRange
├── transaction-calc.ts # calculateTotals, aggregateByDate, dll
├── currency.ts         # formatCurrency
├── toast-messages.ts   # TOAST_MESSAGES
├── form-themes.ts      # Tema form (emerald, rose, blue)
├── constants.ts        # APP_VERSION, dll
└── ...

hooks/
├── useHaptic.ts        # Haptic feedback (lightTap, successVibrate)
└── useNetworkStatus.ts # Deteksi online/offline

supabase/migrations/   # SQL migrations
types/index.ts         # Wallet, Transaction, Category, Budget, User, dll
```

---

## 4. Alur Autentikasi

### 4.1 Entry Point

```
User buka app
    ↓
Middleware (middleware.ts) jalan
    ↓
Cek supabase.auth.getUser() via cookie
    ↓
Routing decision
```

### 4.2 Middleware Logic

| Kondisi | Aksi |
|---------|------|
| Protected path (`/dashboard`, `/transactions`, dll) + **tidak** login | Redirect ke `/login` |
| `/login` + **sudah** login | Redirect ke `/dashboard` |
| `/register` atau auth path lain + **sudah** login | Redirect ke `/dashboard` |
| Lainnya | Lanjut (NextResponse.next) |

**Protected paths:** `/dashboard`, `/transactions`, `/statistics`, `/settings`, `/categories`, `/budget`

**Auth paths:** `/login`, `/register`, `/signup`

### 4.3 Landing Page (`/`)

- Server: `getServerUserId()` — cek session via Supabase server client
- Jika **ada userId** → `redirect("/dashboard")`
- Jika **tidak** → render `<LandingPage />`

### 4.4 Login Page (`/login`)

- Client: `useAuth()` — user, loading
- Jika `!loading && user` → `window.location.replace("/dashboard")`
- Form submit → `supabaseClient.auth.signInWithPassword({ email, password })`
- Sukses → `window.location.replace("/dashboard")`
- Error → tampilkan pesan (rate limit, invalid credentials, email not confirmed)

### 4.5 Register Page (`/register`)

- Mirip login, pakai `signUp` + redirect ke dashboard jika sukses

### 4.6 Auth Callback (`/auth/callback`)

- Dipanggil saat OAuth (magic link, dll)
- Query: `code`, `next` (redirect path)
- `supabase.auth.exchangeCodeForSession(code)` untuk tukar kode ke session
- Redirect ke `next` (default `/`)

### 4.7 AuthContext (Client)

- `getSession()` saat mount
- `onAuthStateChange` untuk listen login/logout
- Timeout 1 detik (`MAX_LOADING_MS`) agar UI tidak blokir terlalu lama
- Expose: `user`, `loading`, `sessionCheckComplete`, `signOut`

### 4.8 Logout

- `signOut()` dari AuthContext → `supabase.auth.signOut()`
- Component (ProfileClient) handle redirect: `window.location.href = "/login"`

---

## 5. Database & Schema

### 5.1 Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `public.users` | Profil user (sync dari auth.users). Kolom: id, email, raw_user_meta_data, is_pro |
| `wallets` | Dompet (bank, ewallet, cash). Kolom: id, name, balance, initial_balance, type, user_id |
| `transactions` | Transaksi. Kolom: id, amount, type, date, description, category_id, source_wallet_id, destination_wallet_id, user_id |
| `categories` | Kategori (income/expense). Kolom: id, user_id, name, type, icon, color, is_custom |
| `budgets` | Budget per kategori. Kolom: id, user_id, category_id, amount |
| `notifications` | Notifikasi. Kolom: id, user_id, type, title, message, is_read, created_at |

### 5.2 Trigger & Fungsi Penting

**1. Sync auth.users → public.users**

- Trigger: `on_auth_user_created_sync` (AFTER INSERT ON auth.users)
- Fungsi: `handle_new_user_sync()` — insert/update ke `public.users`

**2. Seed kategori default untuk user baru**

- Trigger: `on_public_user_created_seed_categories` (AFTER INSERT ON public.users)
- Fungsi: `seed_default_categories()` — copy kategori template (user_id IS NULL) ke user baru

**3. Recalculate wallet balance**

- Trigger: `trg_transactions_recalc_wallets` (AFTER INSERT/UPDATE/DELETE ON transactions)
- Fungsi: `trigger_recalc_wallets_on_transaction()` — panggil `recalculate_wallet_balance()` untuk source & destination wallet

**4. Recalculate saat initial_balance diubah**

- Trigger: `trg_wallets_recalc_on_initial` (AFTER UPDATE OF initial_balance ON wallets)
- Fungsi: `trigger_recalc_wallet_on_initial_balance()`

**5. Set balance saat wallet baru**

- Trigger: `trg_wallet_insert_balance` (BEFORE INSERT ON wallets)
- Fungsi: `trigger_wallet_insert_set_balance()` — set balance = initial_balance

### 5.3 Rumus Saldo Wallet

```
balance = initial_balance 
        + SUM(income dari source_wallet) 
        - SUM(expense dari source_wallet) 
        + SUM(transfer masuk ke destination_wallet) 
        - SUM(transfer keluar dari source_wallet)
```

---

## 6. Data Flow (Server ↔ Client)

### 6.1 Pola Umum

```
Page (Server Component)
    → getServerUserId()
    → createClient() (Supabase server)
    → fetch data (wallets, transactions, categories, dll)
    → pass ke Client Component sebagai props
```

### 6.2 Per Halaman

| Halaman | Data yang di-fetch | Client Component |
|---------|--------------------|------------------|
| Dashboard | wallets, transactions (tahun ini) | DashboardClient |
| Transactions | transactions (dengan join category, wallets) | TransactionsList |
| Statistics | transactions (tahun ini), categories | StatisticsTabs |
| Budget | budgets+category, categories, expenses bulan ini, income bulan ini | BudgetClient |
| Categories | categories | CategoryManagement |
| Settings | wallets, categories | ProfileClient |

### 6.3 Supabase Client

- **Server:** `createClient()` di `lib/supabase-server.ts` — pakai cookies untuk session
- **Client:** `supabaseClient` di `lib/supabase-client.ts` — `createBrowserClient`

---

## 7. Context Providers & Hierarchy

Urutan wrapper di `app/layout.tsx`:

```
<html>
  <body>
    ThemeProvider (next-themes, data-theme)
      AuroraBackground
      AuthProvider
        SubscriptionSync
        ToastProvider
          SheetProvider
            AppShell
              {children}
            PremiumModal
```

| Provider | Fungsi |
|----------|--------|
| ThemeProvider | Tema (default, sultan, forest), storageKey: remula-theme |
| AuthProvider | user, loading, sessionCheckComplete, signOut |
| SubscriptionSync | Sync isPro dari DB ke subscriptionStore, ThemeGuard |
| ToastProvider | showToast(message, type) |
| SheetProvider | isSheetOpen, setIsSheetOpen — kontrol tampilan BottomNav saat sheet terbuka |

---

## 8. State Management (Zustand)

### 8.1 optimisticTransactionStore

- **transactions:** Transaksi sementara (ID prefix `opt-`)
- **walletDeltas:** Perubahan saldo per wallet (walletId → delta)
- **addOptimistic(tx, deltas):** Tambah transaksi optimistik + delta
- **removeOptimistic(tempId):** Hapus dan revert delta

### 8.2 subscriptionStore

- **isPro:** Status Pro dari DB
- **proStatusSettled:** Sudah selesai fetch
- **setProStatus, setProStatusSettled**
- **upgrade(), downgrade()**
- **checkLimit(currentCount, limit):** true jika Pro atau currentCount < limit

### 8.3 premiumModalStore

- **isOpen, open(), close()** — kontrol PremiumModal

---

## 9. Routing & Navigasi

### 9.1 AppShell

- **Sidebar:** Desktop (hidden di landing/auth)
- **BottomNav:** Mobile (hidden di landing/auth)
- **children:** Konten halaman
- **FloatingActionButton:** Di dashboard/transactions (via QuickActionsRow atau FAB)

### 9.2 Sidebar & BottomNav

Nav items: Home (`/dashboard`), Stats (`/statistics`), Budget (`/budget`), Transactions (`/transactions`), Settings (`/settings`)

- **BottomNav:** Sembunyikan saat `isSheetOpen` (SheetContext) agar tidak menutupi sheet

### 9.3 Semua Route

| Path | Tipe | Keterangan |
|------|------|------------|
| `/` | Public | Landing atau redirect ke dashboard |
| `/login` | Auth | Login |
| `/register` | Auth | Register |
| `/signup` | Auth | Alias register |
| `/dashboard` | Protected | Home |
| `/transactions` | Protected | Daftar transaksi |
| `/statistics` | Protected | Statistik |
| `/budget` | Protected | Budget |
| `/categories` | Protected | Kelola kategori |
| `/settings` | Protected | Pengaturan |
| `/terms` | Public | Syarat & ketentuan |
| `/privacy` | Public | Kebijakan privasi |
| `/auth/callback` | - | OAuth callback |

---

## 10. Halaman & Fitur per Route

### 10.1 Dashboard (`/dashboard`)

- **BalanceCard:** Total saldo (server + optimistic), profil user
- **DateRangeFilter:** Pilih periode (Pro: semua; Free: this_month saja)
- **DashboardSummary:** Income, Expense, Net, chart kumulatif
- **QuickActionsRow:** Income, Expense, Transfer, Tally (Calculator)
- **DashboardWallets:** Daftar wallet + saldo (termasuk optimistic delta)

### 10.2 Transactions (`/transactions`)

- **TransactionsList:** Daftar transaksi dengan search, grup per tanggal (Hari Ini, Kemarin, dll)
- **TransactionItem:** Tiap item dengan menu Edit/Delete
- **EditTransactionSheet:** Edit transaksi
- **DeleteConfirmDialog:** Konfirmasi hapus

### 10.3 Statistics (`/statistics`)

- **StatisticsTabs:** Tab untuk Trend, Cashflow, Category breakdown
- Data transaksi tahun ini + categories

### 10.4 Budget (`/budget`)

- **BudgetClient:** Budget per kategori, progress vs expense bulan ini
- Data: budgets, categories, expenses bulan ini, income bulan ini

### 10.5 Categories (`/categories`)

- **CategoryManagement:** Daftar kategori, tambah/edit (Pro only untuk custom)

### 10.6 Settings (`/settings`)

- **ProfileClient:** Profil user, Manage Wallets, Manage Categories, Theme, Export Data, Logout
- **WalletManagement:** CRUD wallet
- **CategoryManager:** CRUD kategori
- **DataManagementCard:** Export CSV
- **ThemeSwitcher:** Pilih tema (default, sultan, forest)

---

## 11. Alur Transaksi (Add/Edit/Delete)

### 11.1 Add Transaction (Income/Expense)

**Entry:** FAB → Add Income/Expense, atau QuickActionsRow → Income/Expense

1. Buka `AddTransactionSheet` dengan `transactionType`: "income" | "expense"
2. Fetch wallets & categories (client, `supabaseClient`)
3. User isi: amount, description, category, wallet, date
4. Submit:
   - `addOptimistic(tx, deltas)` — tampilkan langsung
   - Insert ke `transactions` via Supabase
   - Sukses: `revalidateTransactionPaths()`, `removeOptimistic(tempId)`, toast, close
   - Gagal: `removeOptimistic(tempId)`, toast error

### 11.2 Add Transfer

**Entry:** QuickActionsRow → Transfer

1. Buka `QuickTransferSheet`
2. Pilih from wallet, to wallet, amount
3. Submit: sama seperti Add Transaction, type = "transfer"

### 11.3 Tally (Calculator)

**Entry:** QuickActionsRow → Tally

1. Buka `CalculatorDialog`
2. User input angka, hitung total
3. Save → pilih Income/Expense → buka `AddTransactionSheet` dengan `initialData: { amount, description }`

### 11.4 Edit Transaction

**Entry:** TransactionItem → menu → Edit

1. Buka `EditTransactionSheet` dengan `transaction`
2. Pre-fill form
3. Submit: Update via Supabase → `revalidateTransactionPaths()` → close

### 11.5 Delete Transaction

**Entry:** TransactionItem → menu → Delete

1. Buka `DeleteConfirmDialog`
2. Konfirmasi → Delete via Supabase → `revalidateTransactionPaths()` → close

---

## 12. Optimistic Updates

### 12.1 Tujuan

Agar UI terasa cepat: transaksi langsung tampil tanpa menunggu response server.

### 12.2 Mekanisme

1. **addOptimistic(tx, deltas):**
   - `tx` punya id sementara (`opt-xxx`)
   - `deltas`: `{ walletId: change }` (positif/negatif)
   - Merge ke `transactions` dan `walletDeltas` di store

2. **Merge di DashboardClient:**
   - `mergedTransactions = [...transactions, ...optimisticTx]` (sorted by date)
   - `totalBalance = serverTotal + sum(walletDeltas)`
   - `DashboardWallets` pakai `baseBalance + (walletDeltas[id] ?? 0)`

3. **removeOptimistic(tempId):**
   - Hapus dari transactions
   - Revert walletDeltas berdasarkan type (income/expense/transfer)

### 12.3 Offline Handling

- `useNetworkStatus()` — deteksi online/offline
- Saat offline, form bisa tampilkan pesan (mis. "No connection")

---

## 13. Fitur Premium (Pro)

### 13.1 Sumber Kebenaran

- **Database:** `users.is_pro`
- **SubscriptionSync:** Fetch `getProStatus()` saat login & window focus
- **subscriptionStore.isPro:** State di client

### 13.2 Batasan Free vs Pro

| Fitur | Free | Pro |
|-------|------|-----|
| Date range filter | this_month only | Semua (today, week, month, dll) |
| Tema | default only | default, sultan, forest |
| Custom categories | Terbatas | Full |
| Export CSV | - | ✓ |
| Budget | Terbatas | Unlimited |

### 13.3 ThemeGuard

- Di `SubscriptionSync`: jika user non-Pro memakai tema premium (sultan, forest) → paksa ke default
- Retry `getProStatus` jika user punya premium theme di localStorage (session mungkin belum siap)

### 13.4 Premium Modal

- Dipanggil via `usePremiumModal().open()` saat user mencoba fitur Pro
- Tombol Unlock → `upgradeToProLifetime()` (Server Action) → update `users.is_pro` → `subscriptionStore.upgrade()`

---

## 14. Tema & Theming

### 14.1 Tema Tersedia

- **default:** Dark
- **sultan:** Premium
- **forest:** Premium (light, hijau)

### 14.2 Implementasi

- **ThemeProvider:** `next-themes`, `attribute="data-theme"`, `storageKey="remula-theme"`
- **globals.css:** CSS variables per tema (`[data-theme="default"]`, dll)
- **Tailwind:** Token semantic (`bg-background`, `text-foreground`, `text-primary`)

### 14.3 Form Themes

- `formThemes` di `lib/form-themes.ts`: emerald (income), rose (expense), blue (transfer)
- Dipakai di AddTransactionSheet, EditTransactionSheet, QuickTransferSheet

---

## 15. Event System

### 15.1 REFRESH_CATEGORIES_EVENT

- **Event:** `"refresh-categories"`
- **Trigger:** Saat kategori ditambah/diubah (mis. di CategoryManager)
- **Listener:** AddTransactionSheet, EditTransactionSheet — refetch categories

---

## 16. Hooks & Utilities

| Hook/Util | Fungsi |
|-----------|--------|
| `useAuth()` | user, loading, signOut |
| `useToast()` | showToast(message, type) |
| `useSheet()` | isSheetOpen, setIsSheetOpen |
| `useHaptic()` | lightTap, mediumClick, successVibrate |
| `useNetworkStatus()` | Online/offline |
| `getDateRange(range)` | { start, end } Date |
| `filterTransactionsByRange(transactions, range)` | Filter transaksi |
| `calculateTotals(transactions)` | { income, expense, net } |
| `formatCurrency(amount)` | Format mata uang |

---

## 17. Revalidasi Cache

### 17.1 revalidateTransactionPaths()

**Lokasi:** `app/actions.ts`

**Dipanggil setelah:** Add, Edit, Delete transaksi

**Path yang di-revalidate:**
- `/`
- `/statistics`
- `/transactions`
- `/budget`

Ini memastikan saat user navigasi, data yang ditampilkan sudah terbaru.

---

## 18. Diagram Alur Utama

### 18.1 Alur Aplikasi (High Level)

```
[User] → [Middleware] → Cek Auth
    ↓
[Landing / Login / Dashboard]
    ↓
[AuthContext] ← getSession, onAuthStateChange
    ↓
[SubscriptionSync] ← getProStatus → [subscriptionStore]
    ↓
[AppShell] → Sidebar, BottomNav, {children}
```

### 18.2 Alur Tambah Transaksi

```
[User] klik Add Income/Expense
    ↓
[AddTransactionSheet] buka
    ↓
Fetch wallets, categories (client)
    ↓
User submit
    ↓
addOptimistic(tx, deltas) → UI update instant
    ↓
Supabase insert
    ↓
Sukses: revalidateTransactionPaths, removeOptimistic, toast, close
Gagal: removeOptimistic, toast error
```

### 18.3 Alur Data Dashboard

```
[Dashboard Page] (Server)
    getWallets(), getTransactionsThisYear()
    ↓
[DashboardClient] (props: wallets, transactions)
    ↓
Merge dengan optimisticTransactionStore
    ↓
BalanceCard(totalBalance), DashboardSummary(mergedTransactions), DashboardWallets(wallets, walletDeltas)
```

---

## Penutup

Dokumen ini mencakup workflow Re-Start dari entry point, auth, database, data flow, state, routing, fitur per halaman, transaksi, optimistic updates, premium, tema, event, hooks, dan revalidasi. Untuk detail implementasi, lihat kode di file yang dirujuk.
