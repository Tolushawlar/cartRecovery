#!/bin/bash

# Cart Recovery Cron Job
# Add this to your crontab to run every hour:
# 0 * * * * /path/to/this/script.sh

# Configuration
APP_URL="http://localhost:3000"  # Change to your production URL
CRON_SECRET="your-secure-cron-secret-key"  # Must match .env.local

# Make the API call
curl -X POST "$APP_URL/api/recovery" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --silent \
  --show-error \
  --fail

if [ $? -eq 0 ]; then
    echo "$(date): Cart recovery calls processed successfully"
else
    echo "$(date): Failed to process cart recovery calls" >&2
fi