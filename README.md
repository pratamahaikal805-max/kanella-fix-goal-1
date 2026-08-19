# Kedai Order

Website order F&B lewat QR code per meja. Customer scan QR → pilih menu →
checkout → bayar online → dapur lihat pesanan masuk real-time.

Dibangun dengan Next.js 14 (App Router) + Prisma + Midtrans Snap.

## Kenapa Midtrans?

Untuk payment gateway, kode ini pakai **Midtrans Snap**, dengan pertimbangan:
- Salah satu payment gateway paling banyak dipakai bisnis F&B/retail di Indonesia,
  sudah tersertifikasi **PCI-DSS** (standar keamanan kartu pembayaran).
- Satu integrasi mendukung banyak metode sekaligus: **QRIS, GoPay, ShopeePay,
  Virtual Account (BCA/BNI/BRI/Permata), kartu kredit/debit**.
- Ada mode **sandbox gratis** untuk testing sebelum transaksi asli.
- Popup pembayaran (Snap) di-load langsung dari server Midtrans, jadi ringan dan
  tidak bikin website utama lag.

Alternatif lain yang sekelas: **Xendit**. Kalau nanti mau pindah, cukup ganti isi
`lib/midtrans.ts` dengan SDK Xendit — struktur order & database tidak perlu berubah.

## Keamanan pembayaran yang sudah diterapkan

- **Harga tidak pernah dipercaya dari browser.** Saat checkout, server menghitung
  ulang harga dari database (`app/api/orders/route.ts`), jadi customer tidak bisa
  memanipulasi harga lewat DevTools.
- **Status "sudah dibayar" hanya bisa diubah lewat webhook resmi Midtrans**
  (`app/api/payment/notification/route.ts`), dengan dua lapis verifikasi:
  1. Cocokkan `signature_key` (hash SHA-512 dari server key).
  2. Query ulang status transaksi langsung ke server Midtrans — bukan asal percaya
     data yang dikirim ke webhook.
- **Server key Midtrans tidak pernah dikirim ke browser** — hanya dipakai di API
  routes sisi server (`lib/midtrans.ts`). Yang dikirim ke browser cuma `snapToken`.
- Password admin disimpan sebagai **httpOnly cookie**, tidak bisa dibaca lewat
  JavaScript di browser (mencegah pencurian sesi lewat XSS).

## Menjalankan di lokal

Butuh Node.js 18+ terinstal di komputer kamu.

```bash
# 1. Install dependency
npm install

# 2. Salin file environment lalu isi
cp .env.example .env
# edit .env — minimal isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY (sandbox dulu)

# 3. Buat struktur database & isi menu contoh
npm run db:push
npm run db:seed

# 4. Jalankan
npm run dev
```

Buka `http://localhost:3000`:
- `/table/A1` — simulasi customer di Meja A1
- `/admin` — dashboard dapur (login pakai `ADMIN_PASSWORD` di `.env`)
- `/admin/qr` — generate & cetak QR semua meja

## Setup akun Midtrans (sandbox → live)

1. Daftar di https://dashboard.midtrans.com (gratis).
2. Ambil **Server Key** & **Client Key** sandbox dari menu *Settings > Access Keys*,
   isi ke `.env`.
3. Di menu *Settings > Configuration*, isi **Payment Notification URL** dengan:
   `https://domain-kamu.com/api/payment/notification`
   (wajib domain publik dengan HTTPS — waktu masih di lokal, pakai tool seperti
   `ngrok` untuk testing webhook).
4. Coba alur order sampai bayar pakai [kartu simulasi sandbox Midtrans](https://docs.midtrans.com/docs/testing-payment-on-sandbox).
5. Kalau sudah siap terima uang asli: aktivasi akun Live di dashboard Midtrans
   (perlu dokumen bisnis/legalitas), ganti key di `.env` ke key production, dan
   set `MIDTRANS_IS_PRODUCTION="true"`.

## Menambah/mengubah menu

Paling gampang lewat Prisma Studio (GUI database):
```bash
npm run db:studio
```
Buka tabel `MenuItem` untuk tambah/edit/nonaktifkan item, atau `Category` untuk
kategori menu. Bisa juga edit langsung `prisma/seed.ts` lalu jalankan ulang
`npm run db:seed` (catatan: seed akan reset data order demo).

## Menambah meja

Tambah baris baru di tabel `Table` lewat Prisma Studio (`code` harus unik, mis.
`C1`), lalu buka `/admin/qr` untuk generate & cetak QR-nya.

## Deploy ke production

1. Deploy paling gampang ke **Vercel** (gratis untuk skala kecil-menengah):
   `vercel deploy`, lalu set semua environment variable dari `.env` di dashboard
   Vercel.
2. Ganti `DATABASE_URL` ke database PostgreSQL (Supabase/Neon/Railway punya tier
   gratis) — SQLite tidak disarankan untuk production karena hanya baca/tulis
   dari satu file. Ubah `provider = "sqlite"` jadi `"postgresql"` di
   `prisma/schema.prisma`, lalu `npm run db:push`.
3. Set `NEXT_PUBLIC_BASE_URL` ke domain asli, dan update Payment Notification URL
   di dashboard Midtrans.
4. Ganti `ADMIN_PASSWORD` ke password kuat, dan `MIDTRANS_IS_PRODUCTION="true"`
   dengan key live.

## Struktur proyek singkat

```
app/table/[tableId]/         → halaman menu customer per meja
app/table/[tableId]/checkout → review order + trigger Midtrans Snap
app/admin/                   → dashboard dapur & generator QR (dilindungi password)
app/api/orders/               → buat order, hitung ulang harga di server
app/api/payment/create        → buat transaksi Snap
app/api/payment/notification  → webhook Midtrans (sumber kebenaran status bayar)
prisma/schema.prisma          → struktur database
```
