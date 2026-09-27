# Roomi

Roomi supports hostname-based multi-tenant storefronts from a single deployment. See [Multi-tenant architecture and onboarding](docs/multi-tenant.md) for tenant isolation, migration, DNS, channels, and merchant provisioning.

Roomi adalah aplikasi booking kamar full-stack berbasis Next.js App Router.
Aplikasi ini menggunakan TypeScript, MongoDB/Mongoose, NextAuth, Redux
Toolkit, Stripe, Cloudinary, Mapbox, Nodemailer, Bootstrap, Chart.js, dan
jsPDF.

## Menjalankan secara lokal

Prasyarat:

- Node.js 24.x
- npm
- MongoDB lokal atau MongoDB Atlas

Install dependency dan siapkan environment:

```bash
npm install
cp .env.example .env.local
```

Windows PowerShell:

```powershell
npm install
Copy-Item .env.example .env.local
```

Isi `.env.local` sesuai layanan yang digunakan. Minimal untuk login dan data
lokal, siapkan `DB_LOCAL_URI`, `NEXTAUTH_URL`, dan `NEXTAUTH_SECRET`.
Jangan commit `.env.local` atau nilai secret ke repository.

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Perintah project

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript tanpa emit
npm run build      # Production build
npm run verify     # lint + typecheck + test + build
npm run audit:prod # Audit dependency production
npm run ui:install # Install Chromium untuk UI test
npm run ui:seed    # Seed fixture ke database UI test
npm run ui:test    # Jalankan UI test desktop dan mobile
```

Seeder menggunakan `DB_LOCAL_URI` pada mode development dan `DB_URI` pada
mode production:

```bash
npm run seeder
```

## Environment variables

Template lengkap tersedia di [.env.example](.env.example). Secret server
seperti database, NextAuth, Stripe, Cloudinary, SMTP, geocoder, dan token
revalidation harus disediakan melalui environment deployment. Hanya token
yang memang bersifat publik, seperti `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, yang
boleh digunakan di client.

Untuk pembayaran, konfigurasi endpoint Stripe webhook ke:

```text
https://<host>/api/payment/webhook
```

## Checklist deployment

1. Jalankan `npm ci` lalu `npm run verify`.
2. Isi seluruh secret production melalui secret manager provider.
3. Rotasi secret yang pernah terekspos sebelum deployment.
4. Pastikan URL `API_URL`, `NEXTAUTH_URL`, dan Stripe webhook memakai host
   production.
5. Gunakan rate limiter terdistribusi pada deployment multi-instance.
6. Pantau webhook Stripe, email SMTP, koneksi MongoDB, dan error server.

`npm run audit:prod` masih melaporkan vulnerability yang memerlukan migrasi
major Next.js dan pembaruan dependency indirect; migrasi tersebut sengaja
dipisahkan dari patch fase sebelumnya.

## UI testing

Panduan lengkap untuk test fungsional, responsive styling, dan review performa
tersedia di [docs/ui-testing.md](docs/ui-testing.md). UI test menggunakan
`.env.test`, database `roomi_ui_test`, dan credential lokal khusus test.

Panduan bootstrap platform owner dan checklist verifikasi manual tersedia di
[docs/platform-console-manual-testing.md](docs/platform-console-manual-testing.md).
