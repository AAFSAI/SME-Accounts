# SME Accounts

A React + Vite progressive web app prototype for small business bookkeeping.

## Deployment Target

- Primary domain: `flintzoo.com`
- App URL: `https://flintzoo.com/sme-accounts/`
- General contact email: `info@flintzoo.com`
- Hosting provider: Hostinger

## Included

- Main public web page with registration and payment-reference capture
- System admin page for customer onboarding and payment clearance
- Private system admin access for app-level onboarding and payment clearance
- Accountant setup page for business, bank, GST, and invoice email settings
- Editable chart of accounts with account type, GST code, report group, and active status
- Supplier invoice screen for manual entry, scan/photo proof, CSV import, and AI-assisted email extraction
- IndexedDB persistence through Dexie for offline-capable PWA behaviour
- Basic income statement, trial balance, quarterly GST, salary, deductions, and super summaries

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

This is a front-end PWA prototype. The current database is browser IndexedDB. The production version should add secure authentication, tenant-separated cloud storage, payment provider webhooks, bank feeds, email API integration, document OCR, audit logs, and accountant role permissions.

## Prototype Admin Access

The SME Accounts system admin view is hidden behind a prototype private access code:

`FLINTZOO-ADMIN`

Replace this with real authentication before production release.
