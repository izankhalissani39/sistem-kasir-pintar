# Setup Database V3

1. Buat project Supabase.
2. Buka SQL Editor dan jalankan `supabase_schema.sql`.
3. Di Authentication > Users, buat akun kasir pertama (email + password).
4. Salin Project URL dan Publishable Key dari Connect panel.
5. Buat `.env.local` berdasarkan `.env.example`.
6. Jalankan `npm install` lalu `npm run dev`.
7. Login. Sistem otomatis membuat toko pertama untuk akun tersebut dan menyiapkan data demo jika database masih kosong.

## Hosting
Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di environment variables hosting. Jangan pernah memasukkan `service_role`/secret key ke frontend. Supabase merekomendasikan publishable key + RLS untuk aplikasi frontend.

## Multi-cabang
Skema V3 sudah memakai `stores` dan `store_members`, sehingga akses dapat dikembangkan menjadi beberapa cabang. Penambahan user ke cabang lain dilakukan dari admin/database dan tidak memerlukan perubahan struktur tabel.
