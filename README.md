# Jennifer & Vincent — wedding website + admin + API

This project keeps the existing React/Vite/Tailwind website and adds a mobile/tablet video invitation, an Express + MongoDB API, an admin dashboard, photo uploads, registry management, RSVP management, and Flutterwave checkout support for Nigerian naira (NGN) and British pounds (GBP).

## Requirements

- Node.js 20 or newer
- Yarn 4 (the project declares Yarn 4.13.0)
- MongoDB running locally or a MongoDB Atlas connection string
- A Flutterwave account and API secret key to enable real payments

## Install with Yarn only

Run all commands from the main project folder:

```bash
yarn install
```

Terminal 1 — website:

```bash
yarn dev
```

Terminal 2 — API server:

```bash
yarn server:dev
```

Optional registry seed (run once, after MongoDB is configured):

```bash
yarn server:seed
```

Production server command:

```bash
yarn server:start
```

Website: http://localhost:5173  
Admin: http://localhost:5173/admin  
API health check: http://localhost:5000/api/health

## Environment setup

1. Copy root `.env.example` to `.env` (frontend variables).
2. Copy `backend/.env.example` to `backend/.env` (API variables).
3. Make sure MongoDB is running and the `MONGODB_URI` points to your database.
4. Start the website and server in separate terminals.

The requested local admin credentials are prefilled in `backend/.env.example`:

```dotenv
ADMIN_EMAIL=admin@jjveey4ever.com
ADMIN_PASSWORD=Miracle
```

**Security:** `Miracle` is a weak password. It is included only to make local setup convenient because you explicitly requested it. Before putting the site online, change it to a long, unique password and use a strong random `JWT_SECRET`. Never commit `backend/.env` or publish production secrets.

## Invitation video behaviour

The video is stored at `public/videos/wedding-invitation.mp4`. On mobile phones and tablets (1024px wide or narrower), the invitation cover and wax seal appear. Tapping the seal starts the video; when it ends, the website is revealed. On desktop/laptop screens wider than 1024px, the invitation is skipped. Resizing across the breakpoint updates the view.

## Admin dashboard

Open `/admin` and sign in with the configured environment credentials. It includes:

- **Overview:** RSVP totals, expected guests, pending gifts, and paid totals split into NGN and GBP.
- **Guest RSVPs:** Search, guest details, attendance/status management, and CSV export.
- **Payments & Gifts:** Donor, email/contact, gift type, currency, amount, provider reference, verified transaction ID, date, and status.
- **Gift Registry:** Add/edit/delete items, descriptions, NGN and GBP prices, display order, visibility, and item photos.
- **Photos & Gallery:** Upload and delete public gallery photographs; new gallery images appear on the public website.

Images must be JPG, PNG, WebP, or AVIF and are limited to 8 MB each. In this starter, uploaded files are stored in `backend/uploads`. For deployment, use persistent object storage (such as S3 or Cloudinary) because some hosts use ephemeral filesystems.

## Payments: NGN and GBP

The gift forms call the backend to create a Flutterwave hosted checkout. Supported currency choices are NGN and GBP; each payment record is saved to MongoDB as pending, and the backend marks it paid only after server-side transaction verification. A signed Flutterwave webhook route is also provided.

To enable live/test checkout, fill these fields in `backend/.env` using values from your Flutterwave dashboard:

```dotenv
FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_SECRET_HASH=your_flutterwave_webhook_secret_hash
CLIENT_PUBLIC_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:5000/api
```

Configure the Flutterwave webhook URL as `https://YOUR-API-DOMAIN/api/payments/webhook`, and set the same webhook secret in `FLW_SECRET_HASH`. Update `CLIENT_PUBLIC_URL`, `API_PUBLIC_URL`, and `CLIENT_ORIGIN` to the correct deployed URLs before launch. Flutterwave must enable the currency/payment methods for your merchant account; availability can vary by account and country. Test in Flutterwave's test mode before accepting real money.

Flutterwave documentation:
- Standard checkout: https://developer.flutterwave.com/docs/flutterwave-standard-1
- Supported payment currencies: https://flutterwave.com/gb/support/general/what-are-the-currencies-accepted-on-flutterwave
- Webhook/payment methods: https://developer.flutterwave.com/docs/payment-methods

## Notes before production

- This bundle is a source project, not a deployed site. It requires environment setup, a live MongoDB database, and payment-provider credentials.
- Test the complete checkout callback and webhook with Flutterwave test credentials before taking real payments.
- Do not treat a browser redirect alone as proof of payment; the backend verifies the transaction with Flutterwave.
- Admin image uploads currently use local disk storage. Configure persistent cloud storage for production hosting.
- The admin has manual payment-status controls for reconciliation. Use these only after checking the payment provider dashboard.
- The public RSVP endpoint and admin routes are rate-limited, and admin access uses an HTTP-only session cookie.
