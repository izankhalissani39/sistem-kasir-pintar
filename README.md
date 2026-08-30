# Sistem Kasir Pintar POS V3 — SPCK Ready + Supabase Database

V3 mempertahankan tampilan POS V2 dan menambahkan lapisan database cloud yang opsional.

## Mode
- **Local mode:** jika `.env.local` belum diisi, aplikasi tetap berjalan memakai LocalStorage seperti V2.
- **Supabase mode:** jika `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` tersedia, aplikasi meminta login dan memakai PostgreSQL + Storage Supabase.

## Fitur database
- Produk, kategori, harga modal, harga jual, stok, dan foto.
- Foto produk dari kamera/galeri dapat diunggah ke Supabase Storage.
- Transaksi dan detail item.
- Checkout stok diproses atomik di database untuk mencegah overselling antar perangkat.
- Refund mengembalikan stok di server.
- Shift dan pesanan hold.
- Pengaturan toko.
- Refresh data antar perangkat setiap 10 detik.
- Struktur `stores` + `store_members` sudah disiapkan untuk multi-cabang.

## Setup Supabase
Lihat `DATABASE_SETUP.md` dan jalankan `supabase_schema.sql` di SQL Editor Supabase.

Jangan pernah memasukkan `service_role`/secret key ke frontend. Gunakan publishable key dengan RLS.
