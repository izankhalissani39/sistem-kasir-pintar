# V2 Modification Notes

Perubahan pada versi ini:

1. Tambah produk mendukung **Ambil Foto** langsung dari kamera HP dan **Pilih dari Galeri**.
2. Foto dikompres sebelum disimpan agar lebih hemat penyimpanan browser.
3. Kategori sekarang dinamis: dapat **ditambah** dan **dihapus** dari menu Inventori > Kategori.
4. Kategori yang masih dipakai produk tidak dapat dihapus agar data produk tetap aman.
5. Setelah pembayaran berhasil, aplikasi dipastikan tetap pada tab POS/Keranjang dan keranjang dikosongkan untuk transaksi berikutnya.
6. Laporan menampilkan **nama bulan dalam Bahasa Indonesia** pada periode laporan dan kolom ekspor CSV.
7. Laporan menambahkan kartu **Total Modal Penjualan** berdasarkan `costPrice` produk yang benar-benar terjual.
8. Produk paling laris diperluas dari 6 menjadi **25 menu**.
9. Tampilan/modal produk yang sudah ada tetap dipertahankan; perubahan foto dan kategori ditambahkan tanpa mengganti pola modal utama.
10. Data kategori ikut tersimpan di LocalStorage dan backup/restore JSON.
11. Dependensi runtime ditambahkan ke `package.json` agar proyek lebih siap untuk hosting/build Vite, sementara mode SPCK direct-run tetap didukung melalui import map di `index.html`.
