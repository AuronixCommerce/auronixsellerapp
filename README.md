# Auronix Seller

Native iOS and Android workspace for Auronix Commerce sellers and support visitors.

## Included

- Firebase seller authentication with persistent native sessions
- Seller dashboard backed by `https://www.auronixcommerce.com/api/seller/workspace`
- Product and catalog creation/removal
- Application and account status overview
- Realtime seller notification inbox with read state
- Authenticated support ticket creation and history
- Public support ticket creation using the existing Firebase ticket collection
- Auronix AI support using the existing website chat API
- Responsive phone/tablet layouts, glass surfaces, tactile controls, and iPhone-style radial loading indicators

## Setup

1. Copy `.env.example` to `.env`.
2. Use the same `NEXT_PUBLIC_FIREBASE_*` values from the website, renamed to `EXPO_PUBLIC_FIREBASE_*`.
3. Run `npm install` and `npm start`.

The production API URL defaults to `https://www.auronixcommerce.com`. Set `EXPO_PUBLIC_API_URL` to a preview URL when testing backend changes.

## Builds

Run `eas build --platform android` or `eas build --platform ios`. The configured package identifiers are `com.auronixcommerce.seller`.

Do not commit `.env`, signing keys, service-account credentials, or store certificates.
