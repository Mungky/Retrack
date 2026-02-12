# Step-by-Step: Database Setup untuk Wallet Balance Logic

Dokumen ini menjelaskan cara menerapkan migrasi database agar perhitungan saldo wallet didasarkan pada **initial_balance + transaksi**.

---

## Ringkasan Perubahan

| Sebelum | Sesudah |
|---------|---------|
| `balance` di-overwrite manual | `balance` = `initial_balance` + efek transaksi (dihitung DB) |
| Income/Expense tidak update wallet | Trigger otomatis update wallet |
| Edit "saldo" = hard overwrite | Edit "saldo awal" = recalculate |

---

## Prasyarat

- Akses ke **Supabase Dashboard** (SQL Editor)
- Atau CLI: `supabase db push` (jika Supabase CLI terkonfigurasi)

---

## Step 1: Backup Data (Opsional tapi Disarankan)

Sebelum migrasi, backup tabel `wallets` dan `transactions`:

1. Buka **Supabase Dashboard** → **Table Editor**
2. Export `wallets` dan `transactions` (atau gunakan `pg_dump` jika akses DB langsung)

---

## Step 2: Jalankan Migrasi SQL

### Opsi A: Via Supabase Dashboard

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Buat **New query**
3. Copy-paste isi file:
   ```
   supabase/migrations/20250212120000_wallet_balance_logic.sql
   ```
4. Klik **Run**

### Opsi B: Via Supabase CLI

```bash
# Dari root project
supabase db push
```

Atau jalankan file migrasi secara manual:

```bash
psql $DATABASE_URL -f supabase/migrations/20250212120000_wallet_balance_logic.sql
```

---

## Step 3: Verifikasi Migrasi

Jalankan query berikut di SQL Editor untuk memastikan semuanya benar:

```sql
-- 1. Cek kolom initial_balance ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND column_name = 'initial_balance';

-- 2. Cek function ada
SELECT proname FROM pg_proc WHERE proname = 'recalculate_wallet_balance';

-- 3. Cek trigger ada
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'transactions'::regclass 
AND tgname = 'trg_transactions_recalc_wallets';
```

---

## Step 4: Tes Manual (Opsional)

### Tes 1: Buat wallet baru

```sql
INSERT INTO wallets (name, initial_balance, balance, type, user_id)
VALUES ('Test Wallet', 1000, 1000, 'cash', 'YOUR_USER_ID')
RETURNING *;
```

Pastikan `balance` = `initial_balance`.

### Tes 2: Tambah income

```sql
INSERT INTO transactions (amount, type, date, source_wallet_id, user_id)
VALUES (500, 'income', CURRENT_DATE, 'WALLET_ID_DARI_TES_1', 'YOUR_USER_ID');
```

Cek wallet:

```sql
SELECT id, name, initial_balance, balance FROM wallets WHERE id = 'WALLET_ID';
```

Harusnya `balance` = 1500 (1000 + 500).

### Tes 3: Edit initial_balance

```sql
UPDATE wallets SET initial_balance = 0 WHERE id = 'WALLET_ID';
```

Cek lagi: `balance` harus = 500 (0 + 500 income).

---

## Step 5: Deprecation / Rollback (Jika Diperlukan)

Jika ingin kembali ke perilaku lama:

```sql
-- Hapus trigger
DROP TRIGGER IF EXISTS trg_transactions_recalc_wallets ON transactions;
DROP TRIGGER IF EXISTS trg_wallets_recalc_on_initial ON wallets;
DROP TRIGGER IF EXISTS trg_wallet_insert_balance ON wallets;

-- Hapus function
DROP FUNCTION IF EXISTS recalculate_wallet_balance(UUID);
DROP FUNCTION IF EXISTS trigger_recalc_wallets_on_transaction();
DROP FUNCTION IF EXISTS trigger_recalc_wallet_on_initial_balance();
DROP FUNCTION IF EXISTS trigger_wallet_insert_set_balance();

-- (Opsional) Hapus kolom initial_balance
-- ALTER TABLE wallets DROP COLUMN IF EXISTS initial_balance;
```

---

## Troubleshooting

### Error: "column initial_balance does not exist"
Pastikan Step 2 selesai tanpa error. Cek lagi apakah migrasi berhasil dijalankan.

### Error: "function ... does not exist"
Jalankan ulang seluruh file migrasi. Urutan pembuatan function dan trigger harus benar.

### Saldo tidak berubah setelah tambah transaksi
1. Cek trigger: `SELECT * FROM pg_trigger WHERE tgrelid = 'transactions'::regclass;`
2. Panggil manual: `SELECT recalculate_wallet_balance('WALLET_ID');`
3. Cek tipe transaksi: pastikan `type` lowercase ('income', 'expense', 'transfer')

### PostgreSQL versi lama (EXECUTE PROCEDURE)
Jika error `EXECUTE FUNCTION` tidak dikenali, ganti dengan `EXECUTE PROCEDURE` di file migrasi.
