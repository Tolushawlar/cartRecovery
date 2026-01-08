# Cart Recovery System Setup

This system automatically tracks abandoned Shopify checkouts with phone numbers and makes recovery calls at scheduled intervals (2h, 4h, 8h, 16h, 24h).

## Database Setup

1. Run the database schema:
```sql
-- Execute the contents of cart-recovery-schema.sql in your Supabase database
```

## Environment Variables

Update your `.env.local` file with the VAPI configuration:

```env
# VAPI Configuration
VAPI_API_KEY=1e4134cc-db21-4cb4-81df-fe3dd174898d
VAPI_ASSISTANT_ID=44628362-1c4a-4009-959f-24c652caf121
VAPI_TWILIO_PHONE_NUMBER=+2347059762355
VAPI_TWILIO_ACCOUNT_SID=AC4a888eb0ea2fe684249dbf08324355fd
VAPI_TWILIO_AUTH_TOKEN=2977bf22a32440ead5e560c8cba313f6

# Cron job security
CRON_SECRET=your-secure-cron-secret-key
```

## Shopify Webhook Setup

Configure these webhooks in your Shopify admin:

1. **Checkout webhooks** (for abandoned carts):
   - `checkouts/create` → `https://yourdomain.com/api/webhook`
   - `checkouts/update` → `https://yourdomain.com/api/webhook`

2. **Order webhooks** (for completed purchases):
   - `orders/create` → `https://yourdomain.com/api/webhook`
   - `orders/paid` → `https://yourdomain.com/api/webhook`

## Automated Calling Setup

### Option 1: Cron Job (Recommended)

1. Make the script executable:
```bash
chmod +x scripts/recovery-cron.sh
```

2. Edit the script with your domain and secret:
```bash
nano scripts/recovery-cron.sh
# Update APP_URL and CRON_SECRET
```

3. Add to crontab to run every hour:
```bash
crontab -e
# Add this line:
0 * * * * /path/to/shopify-cart-recovery/scripts/recovery-cron.sh
```

### Option 2: Manual Trigger

Use the dashboard "Trigger Manual Run" button or call the API directly:

```bash
curl -X POST "https://yourdomain.com/api/recovery" \
  -H "Authorization: Bearer your-secure-cron-secret-key"
```

## How It Works

1. **Webhook Processing**: 
   - Checkout webhooks save abandoned carts with phone numbers to `abandoned_carts` table
   - Order webhooks mark carts as completed in the database

2. **Phone Number Detection**:
   - Checks multiple fields: `phone`, `customer.phone`, `customer.default_address.phone`, `billing_address.phone`, `shipping_address.phone`, `sms_marketing_phone`
   - Only processes carts that have at least one phone number

3. **Scheduled Calls**:
   - Runs hourly via cron job
   - Checks cart age and makes calls at: 2h, 4h, 8h, 16h, 24h intervals
   - Skips calls if cart is already completed (order exists)
   - Logs all call attempts in `call_logs` table

4. **Call Content**:
   - Uses customer name from various fields
   - Uses first product name from line items
   - Configurable via VAPI assistant settings

## Dashboard Features

- View daily statistics
- See abandoned carts with call status
- Monitor call success rates
- Trigger manual recovery runs
- Filter by date

## API Endpoints

- `POST /api/webhook` - Shopify webhook handler
- `POST /api/recovery` - Trigger recovery calls (requires auth)
- `GET /api/recovery?date=YYYY-MM-DD` - Get daily stats

## Monitoring

Check the dashboard at `https://yourdomain.com` to monitor:
- Total abandoned carts
- Completed orders
- Call success rates
- Recent activity

## Troubleshooting

1. **No calls being made**: Check cron job is running and VAPI credentials are correct
2. **Webhooks not received**: Verify Shopify webhook URLs and secrets
3. **Database errors**: Ensure Supabase connection and schema are correct
4. **Call failures**: Check VAPI API key and Twilio configuration