# WiFiPay

Aplikasi manajemen WiFi untuk perangkat Android dan iOS. Proyek ini menggunakan Expo dan React Native; aplikasi tidak menyediakan target web.

## Menjalankan aplikasi

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Atur `EXPO_PUBLIC_API_URL` di file `.env` ke alamat API Laravel yang dapat dijangkau perangkat dan diakhiri `/api/v1`, misalnya `https://api.domainanda.com/api/v1`. Untuk Android fisik, `127.0.0.1` menunjuk ke ponsel, bukan komputer backend. Gunakan URL HTTPS publik atau alamat VPN yang dapat dijangkau ponsel.

   Build EAS profil `preview` mengizinkan HTTP agar dapat dipakai untuk pengujian di jaringan lokal tepercaya. HTTP tidak mengenkripsi login atau data; jangan gunakan konfigurasi HTTP untuk jaringan publik atau produksi. Untuk produksi, gunakan HTTPS dengan sertifikat valid dan set `EXPO_PUBLIC_API_URL` pada environment EAS `production`.

3. Jalankan aplikasi:

   ```bash
   npx expo start
   ```

   Buka melalui Expo Go atau development build di perangkat Android/iOS, atau jalankan `npm run android` maupun `npm run ios` untuk emulator yang tersedia.

## Fitur admin dan QR pelanggan

Admin dapat mengelola pelanggan, pegawai, paket, pengaduan, notifikasi, dan profil melalui menu dashboard. Laporan dibaca dari API admin. Verifikasi pembayaran tersedia untuk pembayaran berstatus menunggu verifikasi; tagihan yang belum memiliki pembayaran pelanggan tidak dapat disetujui sebelum pembayaran diajukan. Tagihan pelanggan menampilkan QR pembayaran dinamis dari API jika tersedia; jika tidak, aplikasi menampilkan QRIS statis di `assets/images/qr.jpeg` dan pelanggan perlu memasukkan nominal tagihan secara manual. Pembayaran tagihan yang sudah lunas ditampilkan di menu keuangan. Transaksi manual keuangan disimpan secara lokal per akun pada perangkat ini (tidak disinkronkan ke backend/perangkat lain); AsyncStorage tidak mengenkripsi data. QR data pelanggan dibuat dari menu **Data Pelanggan** admin dan memuat ID, nama, alamat pemasangan, paket, serta status pelanggan. QR dapat disimpan ke galeri atau dicetak dari dialog QR; izinkan akses galeri saat menyimpan. Pegawai dapat memindainya melalui tombol **Scan QR data pelanggan** pada menu Data Pelanggan; izinkan akses kamera saat diminta. QR memuat alamat pelanggan, jadi bagikan hanya kepada pihak yang berwenang.

## Integrasi API Laravel

**Autentikasi:** login harus mengembalikan token API. Aplikasi mengirim token tersebut sebagai header `Authorization: Bearer <token>` untuk request setelah login. Pastikan route data memakai middleware autentikasi yang menerima jenis token tersebut.

Aplikasi memakai `EXPO_PUBLIC_API_URL` sebagai URL dasar API (contoh: `https://api.domainanda.com/api/v1`). Token disimpan di memori aplikasi dan pengguna perlu login lagi setelah aplikasi dimulai ulang.

Path di tabel tidak menyertakan prefix `/api/v1`. Daftar ini dicocokkan dengan hasil `php artisan route:list` backend.

| Method | Path | Fungsi |
|---|---|---|
| POST | `/auth/login`, `/auth/logout` | Login dan logout |
| GET | `/admin/dashboard`, `/employee/dashboard`, `/customer/dashboard` | Dashboard sesuai role |
| GET, POST | `/admin/customers` | Daftar dan tambah pelanggan |
| GET, PATCH, DELETE | `/admin/customers/{id}` | Lihat, ubah, dan hapus pelanggan |
| GET | `/admin/employees` | Daftar pegawai |
| GET | `/employee/customers`, `/employee/customers/{id}` | Data pelanggan untuk pegawai |
| GET | `/admin/users` | Daftar pengguna (aplikasi menyaring pegawai) |
| POST | `/admin/users` | Tambah pengguna |
| GET, PATCH, DELETE | `/admin/users/{id}` | Lihat, ubah, dan hapus pengguna |
| PUT, PATCH | `/admin/users/{id}/role`, `/admin/users/{id}/status` | Ubah role atau status pengguna |
| GET, POST | `/admin/packages` | Daftar dan tambah paket |
| GET, PATCH, DELETE | `/admin/packages/{id}` | Lihat, ubah, dan hapus paket |
| GET, PATCH | `/admin/profile` | Lihat dan perbarui profil admin |
| GET, POST | `/admin/bills` | Daftar dan buat tagihan admin |
| GET, PUT, PATCH, DELETE | `/admin/bills/{id}` | Lihat, ubah, dan hapus tagihan |
| GET, POST | `/admin/payments` | Daftar dan buat pembayaran admin |
| GET, PUT, PATCH, DELETE | `/admin/payments/{id}` | Lihat, ubah, dan hapus pembayaran |
| POST | `/admin/payments/{id}/verify` | Verifikasi pembayaran oleh admin |
| GET | `/employee/payments`, `/employee/payments/{id}` | Daftar dan lihat pembayaran pegawai |
| POST | `/employee/payments/{id}/cash-confirm` | Konfirmasi pembayaran tunai pegawai (`nominal_diterima`, `catatan`) |
| POST | `/employee/payments/{id}/cash-confirm` | Konfirmasi pembayaran tunai pegawai (`nominal_diterima`, `catatan`) |
| GET | `/customer/bills` | Tagihan pelanggan |
| POST | `/customer/bills/{id}/payment` | Pembayaran dari sisi pelanggan |
| GET | `/invoices` | Route tagihan tambahan |
| GET | `/admin/issues`, `/admin/issues/{id}`, `/employee/issues`, `/customer/complaints` | Daftar/detail keluhan sesuai role |
| POST | `/customer/complaints` | Buat keluhan pelanggan |
| PATCH | `/admin/issues/{id}/status`, `/employee/issues/{id}/status` | Ubah status keluhan |
| GET | `/employee/visits`, `/employee/visits/{id}` | Riwayat aktivitas kunjungan pegawai |
| GET, PATCH | `/admin/profile`, `/employee/profile`, `/customer/profile` | Baca/perbarui profil sesuai role |
| GET | `/admin/reports` | Laporan admin |
| GET | `/admin/notifications`, `/employee/notifications`, `/customer/notifications`, `/notifications` | Daftar notifikasi |
| PATCH | `/admin/notifications/read-all`, `/employee/notifications/read-all`, `/customer/notifications/read-all` | Tandai semua notifikasi dibaca |
| PATCH | `/admin/notifications/{id}/read`, `/employee/notifications/{id}/read`, `/customer/notifications/{id}/read` | Tandai notifikasi dibaca |

Respons login boleh membungkus data dengan `data`; token dapat bernama `token`, `access_token`, atau `accessToken`. Role dibaca dari `user.role`, `user.role_name`, `user.user_type`, atau relasi `user.roles`; role seperti `Admin`, `employee`, dan `customer` dipetakan ke `admin`, `pegawai`, dan `pelanggan`.

Edit pelanggan mengirim `paket` dan `tagihan_jatuh_tempo` melalui `PATCH /admin/customers/{id}`. Saat foto rumah diganti, aplikasi mengirim `foto_rumah` sebagai multipart dengan method override `_method=PATCH`; pastikan backend menerima field tersebut. Riwayat kunjungan pegawai membaca data `waktu_kunjungan`, `status`, `catatan`, serta relasi `pelanggan` dan `pegawai` dari `/employee/visits`. Route API tidak mencantumkan endpoint khusus untuk transaksi keuangan manual, unggah foto rumah, perubahan status kunjungan, maupun ubah password admin/pegawai. Fitur tersebut belum dapat disimpan lewat API; aplikasi menampilkan pemberitahuan untuk aksi yang belum didukung. Route list hanya menunjukkan URL dan method, bukan aturan validasi atau bentuk payload/response. Jika backend memakai nama field berbeda, sesuaikan payload dengan validasi controller Laravel.

Laporan admin menggunakan data pembayaran, pengaduan, dan endpoint `/admin/reports`; filter tanggal/status diterapkan pada data yang dimuat. Ekspor PDF memakai dialog cetak/berbagi perangkat, sedangkan ekspor Excel menghasilkan CSV UTF-8 yang dapat dibuka di aplikasi spreadsheet.

## Pemeriksaan

```bash
npm run lint
npx tsc --noEmit
```
