# Shopify Cart Recovery with Vapi

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
- SHOPIFY_SHOP_DOMAIN
- SHOPIFY_ACCESS_TOKEN
- VAPI_API_KEY
- VAPI_PHONE_NUMBER_ID

3. Set up Shopify webhook:
- URL: `https://yourdomain.com/api/webhook`
- Events: `carts/create`, `carts/update`

4. Run development server:
```bash
npm run dev
```

## Features

- Dashboard with cart abandonment stats
- Shopify webhook handler for cart events
- Vapi integration for automated calls/SMS
- Persistent cart link generation

## Webhook Flow

1. Cart created/updated → Webhook fired
2. Server processes cart data
3. After 30min delay, check if cart abandoned
4. Generate cart recovery link
5. Send Vapi call with cart link