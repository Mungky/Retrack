# Analisis: Kategori Tidak Muncul di Form Transaksi

## Gejala
Di form Add Transaction, bagian Kategori menampilkan: **"Belum ada kategori. Silakan tambahkan kategori terlebih dahulu."**

---

## Kemungkinan Penyebab

### 1. **Filter `type` terlalu ketat** (Paling mungkin)
- Kode memfilter kategori: Income form hanya tampilkan `type === 'income'`, Expense form hanya `type === 'expense'`
- Jika di database kolom `type` berisi:
  - `NULL` → tidak pernah match
  - String kosong `''` → tidak match
  - Format beda (`'Income'`, `'INCOME'`) → setelah `.toLowerCase()` harusnya ok, kecuali ada typo
- **Hasil:** `filteredCategories` kosong meski `categories` terisi

### 2. **Row Level Security (RLS) di Supabase**
- Jika tabel `categories` punya RLS policy yang membatasi:
  - Policy "user hanya bisa baca baris dimana user_id = auth.uid()" → query `user_id IS NULL` (kategori global) bisa return 0 baris
- **Cek di Supabase Dashboard:** Table Editor → categories → Policies

### 3. **Tabel memang kosong**
- Belum ada data kategori sama sekali
- **Cek:** Buka halaman `/categories` — jika di sana juga kosong, maka tabel kosong

### 4. **Error saat fetch**
- Salah satu query (personal atau global) error, lalu `setCategories([])` dipanggil
- **Cek:** Buka Developer Tools (F12) → Console, lihat apakah ada log error saat membuka form

---

## Langkah Debug

1. **Cek halaman Categories** (`/categories`)
   - Jika ada kategori → fetch berhasil, masalah di filter type
   - Jika kosong → masalah di fetch atau RLS

2. **Cek Supabase Table Editor**
   - Buka tabel `categories`, lihat apakah ada data
   - Pastikan kolom `type` terisi `'income'` atau `'expense'` (huruf kecil)

3. **Cek Console browser**
   - Buka form Add Transaction, lihat log error

---

## Perbaikan yang Diterapkan

1. **Relaksasi filter type**
   - Kategori dengan `type` null/kosong tetap ditampilkan (backward compat)
   - Hanya kategori dengan `type` yang salah (misal income di form expense) yang disaring

2. **Dua form terpisah**
   - FAB: "Tambah Pemasukan" dan "Tambah Pengeluaran" (bukan satu "Add Transaction")
   - QuickActionsRow: tombol Income dan Expense masing-masing buka form yang sudah fix type
   - Tidak ada toggle Income/Expense lagi

3. **Fetch lebih tahan error**
   - Jika query global (user_id null) gagal (mis. RLS), hasil query personal tetap dipakai
   - Console akan log warning jika salah satu query gagal
