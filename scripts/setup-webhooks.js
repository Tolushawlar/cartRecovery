const axios = require('axios')
require('dotenv').config({ path: '.env.local' })

async function setupWebhooks() {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
  const webhookUrl = 'https://your-ngrok-id.ngrok.io/api/webhook' // Replace with your ngrok URL
  
  const webhooks = [
    {
      webhook: {
        topic: 'carts/create',
        address: webhookUrl,
        format: 'json'
      }
    },
    {
      webhook: {
        topic: 'carts/update', 
        address: webhookUrl,
        format: 'json'
      }
    }
  ]

  for (const webhookData of webhooks) {
    try {
      const response = await axios.post(
        `https://${shopDomain}/admin/api/2024-01/webhooks.json`,
        webhookData,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      )
      console.log(`Webhook created: ${webhookData.webhook.topic}`, response.data.webhook.id)
    } catch (error) {
      console.error(`Error creating webhook ${webhookData.webhook.topic}:`, error.response?.data || error.message)
    }
  }
}

setupWebhooks()