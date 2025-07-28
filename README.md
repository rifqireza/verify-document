# Secure QR-Based Document Verification

Aplikasi ini digunakan untuk menyematkan QR Code terenkripsi pada dokumen PDF dan memverifikasi keasliannya.

---

## Cara Instalasi dan Menjalankan Aplikasi

Pastikan Node.js sudah terpasang di sistem Anda. Kemudian jalankan perintah berikut di terminal:

```bash
git clone https://github.com/rifqireza/verify-document.git
cd verify-document
npm install && npm run dev
```

Setelah itu buka aplikasi di browser:
```
http://localhost:5173
```

---

## Cara Menggunakan

- **Embed QR Code**: Upload file PDF dan masukkan kunci rahasia, lalu klik **"Embed QR & Download"** untuk mengunduh PDF dengan QR terenkripsi.
- **Verifikasi**: Upload PDF yang sudah memiliki QR dan masukkan kunci yang sama, lalu klik **"Verify"** untuk memverifikasi keasliannya.
