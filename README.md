# WiFiPay

Aplikasi manajemen WiFi untuk perangkat Android dan iOS. Proyek ini menggunakan Expo dan React Native; aplikasi tidak menyediakan target web.

## Menjalankan aplikasi

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Agar dashboard admin dapat memuat data, atur `EXPO_PUBLIC_API_URL` di file `.env` ke alamat backend yang dapat dijangkau perangkat, contohnya `http://192.168.1.10:8000`.

3. Jalankan aplikasi:

   ```bash
   npx expo start
   ```

   Buka melalui Expo Go atau development build di perangkat Android/iOS, atau jalankan `npm run android` maupun `npm run ios` untuk emulator yang tersedia.

## Fitur admin dan QR pelanggan

Admin dapat menambah, mengubah, dan menghapus data pelanggan, pegawai, serta transaksi keuangan. QR data pelanggan dibuat dari menu **Data Pelanggan** admin dan memuat ID, nama, alamat pemasangan, paket, serta status pelanggan. QR dapat disimpan ke galeri atau dicetak dari dialog QR; izinkan akses galeri saat menyimpan. Pegawai dapat memindainya melalui tombol **Scan QR data pelanggan** pada menu Data Pelanggan; izinkan akses kamera saat diminta. QR memuat alamat pelanggan, jadi bagikan hanya kepada pihak yang berwenang.

Data CRUD demo tersimpan selama aplikasi berjalan dan belum disinkronkan dengan backend.

## Pemeriksaan

```bash
npm run lint
npx tsc --noEmit
```
