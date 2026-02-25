# ReMULA — Deep Clean Roadmap

**Tanggal Audit:** 25 Februari 2025  
**Scope:** Deep Scan seluruh codebase (app/, components/, lib/, stores/, contexts/), tanpa modifikasi kode.

---

## Ringkasan Temuan

| Area | Kritikal | Sedang | Ringan |
|------|----------|--------|--------|
| Security & Logic | 3 | 2 | 1 |
| State Management & Performance | 0 | 2 | 2 |
| Error Handling | 0 | 3 | 5 |
| Dead Code & Tech Debt | 1 | 4 | 8 |

---

## Phase 1 — Security & Logic Flaws (KRITIKAL)

### 1.1 Server Action: `upgradeToProLifetime` — Vulnerable to Free Pro Upgrade

**File:** `app/actions/subscription.ts`  
**Masalah:** Tombol "Get Lifetime Access - $19.99" di `PremiumModal.tsx` memanggil `upgradeToProLifetime(user.id)` tanpa verifikasi pembayaran. User yang login bisa jadi Pro gratis hanya dengan mengeklik tombol. RLS mencegah upgrade user lain, tetapi tidak ada validasi payment (webhook, receipt, dll).

**Tindakan:**
- Tambahkan gate/guard sebelum `isPro = true` — mis. hanya boleh di-set via webhook payment (Midtrans/Stripe) atau admin.
- Jangan izinkan client memanggil `upgradeToProLifetime` langsung dari UI tanpa bukti pembayaran.
- Jika fitur Pro belum berbayar, pertimbangkan: (a) nonaktifkan tombol dan tunjukkan "Coming soon", atau (b) flag feature untuk dev/test saja.

---

### 1.2 Server Action: `getProStatus` & `upgradeToProLifetime` — Trust Client-Side `userId`

**File:** `app/actions/subscription.ts`  
**Masalah:** Kedua fungsi menerima `userId: string` dari client. Meskipun RLS melindungi update/read untuk user lain, praktik ini tidak aman (trust client input). Source of truth untuk "siapa user saat ini" harus dari sesi server (`getServerUserId()`), bukan dari parameter.

**Pemanggil:**
- `SubscriptionSync.tsx` — `getProStatus(user.id)`
- `PremiumModal.tsx` — `upgradeToProLifetime(user.id)`

**Tindakan:**
- Refactor `getProStatus()` dan `upgradeToProLifetime()` agar tidak menerima `userId`.
- Di dalam action, panggil `getServerUserId()` — jika `null`, return error/`false`.
- Update pemanggil di client agar memanggil action tanpa argumen.

---

### 1.3 Auth Callback — Open Redirect Vulnerability

**File:** `app/auth/callback/route.ts`  
**Masalah:** Query param `next` dipakai langsung untuk redirect tanpa validasi:
```ts
const next = requestUrl.searchParams.get("next") ?? "/";
return NextResponse.redirect(new URL(next, requestUrl.origin));
```
Attacker bisa mengarahkan ke `?next=https://evil.com` sehingga user ter-redirect ke domain eksternal setelah login.

**Tindakan:**
- Validasi `next` agar hanya path relatif (mis. dimulai dengan `/`) dan tidak mengandung protocol/domain eksternal.
- Contoh: `if (!next.startsWith("/") || next.includes("//")) next = "/";`

---

### 1.4 Middleware — Route `/wallets` Tidak Punya Halaman

**File:** `middleware.ts`  
**Masalah:** `PROTECTED_PATHS` dan `matcher` memasukkan `/wallets`, tetapi tidak ada `app/wallets/page.tsx`. Route ini akan 404.

**Tindakan:**
- Hapus `/wallets` dari `PROTECTED_PATHS` dan `matcher`, atau
- Buat halaman `app/wallets/page.tsx` jika fitur wallets memang direncanakan.

---

### 1.5 Export Action — Input Validation Kurang

**File:** `app/actions/export.ts`  
**Masalah:** `startDate` dan `endDate` tidak divalidasi format (YYYY-MM-DD) dan rentang (mis. max range 1 tahun). Bisa berpotensi untuk query yang terlalu berat atau format tidak valid.

**Tindakan:**
- Validasi format tanggal (regex atau `Date.parse`).
- Batasi rentang maksimal (mis. 365 hari) untuk mencegah abuse.

---

## Phase 2 — State Management & UI Performance (SEDANG)

### 2.1 Duplikasi Halaman Home & Dashboard

**Files:**  
- `app/page.tsx`  
- `app/dashboard/page.tsx`

**Masalah:** Keduanya hampir identik (getWallets, getTransactionsThisYear, DashboardClient). DRY violation, maintenance berat.

**Tindakan:**
- Extract shared logic ke `lib/dashboard-data.ts` atau fungsi bersama.
- Pertimbangkan merge: Home = Dashboard (redirect `/dashboard` → `/`) atau sebaliknya, jika UI memang sama.

---

### 2.2 Cache Revalidation — Dashboard Tidak Ikut

**File:** `app/actions.ts`  
**Masalah:** `revalidateTransactionPaths()` memanggil `revalidatePath("/")` dan `/statistics`, `/transactions`, `/budget`, tetapi tidak `/dashboard`. Karena `app/page.tsx` dan `app/dashboard/page.tsx` keduanya `dynamic + revalidate: 0`, dampak terbatas, tetapi untuk konsistensi sebaiknya `revalidatePath("/dashboard")` ikut dipanggil.

**Tindakan:**
- Tambahkan `revalidatePath("/dashboard")` ke `revalidateTransactionPaths()`.

---

### 2.3 Context Value — Potensi Re-render

**File:** `contexts/SheetContext.tsx`  
**Masalah:** `value={{ isSheetOpen, setIsSheetOpen }}` selalu object baru per render. Setiap child yang pakai `useSheet` akan re-render saat SheetProvider re-render.

**Tindakan:**
- Wrap dengan `useMemo`: `value={useMemo(() => ({ isSheetOpen, setIsSheetOpen }), [isSheetOpen])}`.
- Atau split selector jika memungkinkan (mis. `useSheetOpen`, `useSetSheetOpen`).

---

### 2.4 NotificationsBadge — CreateBrowserClient Berulang

**File:** `components/NotificationsBadge.tsx`  
**Masalah:** Membuat `createBrowserClient` di dalam `useEffect` alih-alih memakai `supabaseClient` dari `@/lib/supabase-client`. Berpotensi inkonsistensi dan overhead.

**Tindakan:**
- Gunakan `supabaseClient` dari `lib/supabase-client.ts` untuk konsistensi dengan komponen lain.

---

## Phase 3 — Error Handling (SEDANG–RINGAN)

### 3.1 Server Action `upgradeToProLifetime` — Throw vs Return

**File:** `app/actions/subscription.ts`  
**Masalah:** `upgradeToProLifetime` melakukan `throw new Error(error.message)` sehingga error tidak dalam bentuk `{ success: false, error }`. Client di `PremiumModal` pakai try/catch, tetapi konsistensi dengan `notifications.ts` (pakai `ActionResult`) lebih baik.

**Tindakan:**
- Ubah ke return `{ success: false, error: error.message }` agar selaras dengan pattern `ActionResult<T>`.

---

### 3.2 EditTransactionSheet — Error Tidak Selalu ke User

**File:** `components/EditTransactionSheet.tsx`  
**Masalah:**  
- `fetchWallets` dan `fetchCategories`: `catch` hanya `console.error`, tidak ada `showToast`. User tidak tahu kalau fetch gagal.
- `handleSubmit`: error ditampilkan via `showToast` — ini sudah benar.

**Tindakan:**
- Tambahkan `showToast` di `fetchWallets` dan `fetchCategories` saat error (mis. "Gagal memuat data").

---

### 3.3 Beberapa Fetch Tanpa Try-Catch yang Jelas

**File:** `components/NotificationsBadge.tsx`  
**Masalah:** `checkUnread` punya try/catch, tetapi error hanya di-`console.error`. User tidak mendapat feedback.

**File:** `components/ProfileClient.tsx` (line 65)  
**Masalah:** Logout error hanya `console.error`, tidak ada toast/feedback.

**Tindakan:**
- Pastikan setiap async user-facing action punya try/catch dan feedback ke user (toast atau UI) saat gagal.

---

### 3.4 Export Date Range — Error Handling di Client

**File:** `components/settings/DataExport.tsx`  
**Masalah:** `catch (err)` memakai `TOAST_MESSAGES.ERROR.GENERIC`. Lebih baik menampilkan pesan lebih spesifik jika `getAllTransactionsForExport` mengembalikan `result.error`.

**Tindakan:**
- Prioritas tampilkan `result.error` dari server action; fallback ke `GENERIC` jika tidak ada.

---

### 3.5 Halaman Server — Error Hanya Return Empty Array

**Files:**  
- `app/page.tsx`, `app/dashboard/page.tsx`, `app/transactions/page.tsx`, `app/statistics/page.tsx`, `app/budget/page.tsx`, `app/settings/page.tsx`, `app/categories/page.tsx`

**Masalah:** Semua fetch di catch hanya `console.error` + return `[]`. User melihat halaman kosong tanpa tahu ada error.

**Tindakan:**
- Pertimbangkan: (a) error boundary untuk menampilkan pesan error, atau (b) set state error dan tampilkan UI error di halaman tersebut.

---

## Phase 4 — Dead Code & Tech Debt (RINGAN)

### 4.1 Missing File: `lib/rate-limiter.ts`

**Files yang mengimpor:**  
- `app/login/page.tsx`  
- `app/register/page.tsx`

**Masalah:** Keduanya mengimpor `isRateLimited` dan `getRemainingTime` dari `@/lib/rate-limiter`, tetapi file tersebut tidak ada. Build akan gagal.

**Tindakan:**
- Buat `lib/rate-limiter.ts` dengan `isRateLimited(key, limit, windowMs)` dan `getRemainingTime(key)` (mis. pakai `localStorage` + timestamp), atau
- Hapus import dan pemakaian rate limiting jika fitur belum siap (kurang disarankan untuk keamanan).

---

### 4.2 Duplikasi Halaman Auth: `/signup` vs `/register`

**File:** `app/signup/page.tsx`  
**Masalah:** Hanya berisi `redirect("/register")`. `/signup` redundant.

**Tindakan:**
- Pertahankan `app/signup/page.tsx` jika ada link eksternal ke `/signup`, atau
- Redirect semua referensi ke `/register` dan hapus `signup/page.tsx`, lalu update `middleware` dan link.

---

### 4.3 Console.log Tertinggal

**File:** `components/NotificationsBadge.tsx`  
- Line 34: `console.log("BADGE: User not ready yet...")`  
- Line 45: `console.log(\`BADGE: Found ${count} unread items...\`)`  
- Line 19–20: `debugStatus` di-set tetapi tidak ditampilkan di UI (dead state)

**File:** `app/actions/subscription.ts`  
- Line 19, 23: `console.error` dengan `userId` — berpotensi log PII di production.

**Tindakan:**
- Hapus `console.log` debug di `NotificationsBadge`.
- Hapus atau manfaatkan `debugStatus`; jika tidak dipakai, hapus.
- Di production, hindari log `userId`; gunakan logger yang bisa diatur level-nya.

---

### 4.4 Redundant `disabled={false}`

**File:** `components/AddTransactionSheet.tsx`  
**Masalah:** `disabled={false}` muncul berkali-kali (BaseSheet, CurrencyInput, Input, button). Tidak perlu karena `false` adalah default.

**Tindakan:**
- Hapus prop `disabled={false}` di semua pemanggilan tersebut.

---

### 4.5 Duplikasi Logic: getWallets & getTransactionsThisYear

**Files:**  
- `app/page.tsx`, `app/dashboard/page.tsx`

**Masalah:** Fungsi `getWallets` dan `getTransactionsThisYear` duplikat persis di kedua file.

**Tindakan:**
- Pindahkan ke `lib/dashboard-data.ts` atau `lib/server-queries.ts` dan import di kedua halaman.

---

### 4.6 CategoryManagement vs CategoryManager

**Files:**  
- `components/CategoryManagement.tsx` — dipakai di `app/categories/page.tsx`  
- `components/CategoryManager.tsx` — dipakai di `components/ProfileClient.tsx` (Settings)

**Masalah:** Kemungkinan overlap fitur CRUD kategori. Perlu dicek apakah bisa digabung atau dibagi tanggung jawab dengan jelas.

**Tindakan:**
- Audit isi kedua komponen: jika logic CRUD sama, extract ke hook/service bersama.
- Pisahkan responsibility (mis. Categories page vs Settings) dengan komponen wrapper yang memakai logic yang sama.

---

### 4.7 BottomNav — `/signup` Tidak Dianggap Auth Page

**File:** `components/BottomNav.tsx`  
**Masalah:** `isAuthPage` hanya cek `/login` dan `/register`, tidak `/signup`. Jika user di `/signup`, BottomNav tetap tampil (meski redirect ke `/register`).

**Tindakan:**
- Tambahkan `pathname === "/signup"` ke `isAuthPage` jika route `/signup` tetap digunakan.

---

### 4.8 Duplikasi Path di File System (Windows vs Unix)

**Catatan:** Beberapa file tampak duplikat karena path separator (`\` vs `/`), mis. `components\AddTransactionSheet.tsx` vs `components/AddTransactionSheet.tsx`. Pada Windows umumnya mengacu ke file yang sama.

**Tindakan:**
- Pastikan tidak ada file benar-benar duplikat (nama sama, isi beda). Jika ada, hapus salah satu dan perbaiki import.

---

## Prioritas Eksekusi

| Phase | Urutan | Estimasi | Dampak |
|-------|--------|----------|--------|
| Phase 1 | 1 | 1–2 hari | Keamanan & fungsionalitas |
| Phase 2 | 2 | 0.5–1 hari | Maintenance & UX |
| Phase 3 | 3 | 1 hari | UX & kebugaran error |
| Phase 4 | 4 | 0.5–1 hari | Kebersihan kode & build |

---

## Checklist Per Phase (untuk prompt lanjutan)

### Phase 1
- [ ] 1.1 — Gate payment untuk `upgradeToProLifetime`
- [ ] 1.2 — Refactor subscription actions pakai `getServerUserId()`
- [ ] 1.3 — Validasi `next` di auth callback
- [ ] 1.4 — Perbaiki `/wallets` di middleware atau buat halaman
- [ ] 1.5 — Validasi tanggal di export action

### Phase 2
- [ ] 2.1 — Extract shared dashboard logic
- [ ] 2.2 — Tambah `/dashboard` ke revalidate paths
- [ ] 2.3 — Optimasi SheetContext
- [ ] 2.4 — Pakai `supabaseClient` di NotificationsBadge

### Phase 3
- [ ] 3.1 — Standardisasi error return di subscription actions
- [ ] 3.2 — Toast error di EditTransactionSheet fetch
- [ ] 3.3 — Error feedback di NotificationsBadge & ProfileClient
- [ ] 3.4 — Error message lebih spesifik di DataExport
- [ ] 3.5 — Error UI/boundary di halaman server

### Phase 4
- [ ] 4.1 — Buat `lib/rate-limiter.ts` atau hapus penggunaan
- [ ] 4.2 — Konsolidasi signup/register
- [ ] 4.3 — Hapus console.log dan perbaiki log PII
- [ ] 4.4 — Hapus `disabled={false}` yang tidak perlu
- [ ] 4.5 — Extract getWallets & getTransactionsThisYear
- [ ] 4.6 — Audit CategoryManagement vs CategoryManager
- [ ] 4.7 — Update BottomNav isAuthPage
- [ ] 4.8 — Verifikasi duplikasi file

---

**Catatan:** Dokumen ini hanya berisi analisis dan rencana. Tidak ada perubahan kode yang dilakukan. Untuk eksekusi, gunakan prompt terpisah per item atau per phase.
