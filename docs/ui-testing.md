# Roomi UI testing

## One-time setup

1. Pastikan MongoDB lokal aktif.
2. Salin `.env.test.example` menjadi `.env.test` dan sesuaikan URI bila
   diperlukan.
3. Install browser Playwright:

   ```bash
   npm run ui:install
   ```

4. Siapkan fixture user, admin, dan room:

   ```bash
   npm run ui:seed
   ```

   Seeder juga menyiapkan satu booking selesai untuk review dan satu booking
   mendatang untuk menguji konflik availability.

Fixture memakai database `roomi_ui_test`, bukan database development atau
production. Credential di `.env.test` hanya untuk lokal dan tidak boleh
digunakan di deployment.

Build dan server dijalankan di terminal pertama:

```bash
npm run ui:build
npm run ui:serve
```

Kemudian jalankan test di terminal kedua:

```bash
npm run ui:test
npm run ui:test:headed
npm run ui:audit
npm run ui:capture
```

Playwright menguji server production-like di `http://127.0.0.1:3100` dengan
`.env.test`, menggunakan project Chromium desktop dan mobile. Trace,
screenshot, video, dan HTML report disimpan hanya ketika diperlukan oleh
konfigurasi Playwright. Audit Lighthouse menguji homepage, search, dan login;
laporan JSON lokalnya disimpan di `lighthouse-reports/` dan tidak di-commit.
Screenshot review desktop/mobile disimpan di `ui-review/` dan juga tidak
di-commit.

## Area review

- Fungsional: navigasi search, filter, login, booking, pembayaran test,
  booking history, invoice, profile, dan alur admin.
- Responsive/styling: viewport mobile, tablet, desktop; overflow; loading,
  empty, error, toast, modal, dan form state.
- Performa: Lighthouse pada homepage, search, detail room, dashboard, dan
  invoice; catat LCP, CLS, INP, ukuran image, request count, dan console
  error pada koneksi normal serta throttled 4G.

Authenticated flow membutuhkan fixture booking dan Stripe test session.
Jangan menjalankan skenario pembayaran atau email menggunakan credential
production.
