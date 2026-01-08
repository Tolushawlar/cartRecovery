import { NextRequest, NextResponse } from 'next/server'
import { processCartWebhook } from '@/lib/shopify'
import { saveWebhookCall } from '@/lib/supabase'
import { cartRecoveryService } from '@/lib/cart-recovery'
import crypto from 'crypto'

function verifyWebhook(body: string, signature: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return false
  
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const shopifyTopic = request.headers.get('x-shopify-topic')
    
    // Try to save webhook call to Supabase (don't fail if this errors)
    try {
      await saveWebhookCall(shopifyTopic || 'unknown', JSON.parse(body), {
        signature,
        topic: shopifyTopic
      })
    } catch (logError) {
      console.warn('Failed to log webhook call:', logError)
    }
    
    // Verify webhook authenticity
    if (!signature || !verifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const webhookData = JSON.parse(body)
    
    // Handle checkout webhooks (abandoned carts)
    if (shopifyTopic === 'checkouts/create' || shopifyTopic === 'checkouts/update') {
      console.log('Processing checkout webhook:', shopifyTopic)
      await cartRecoveryService.processCheckoutWebhook(webhookData)
      return NextResponse.json({ success: true })
    }
    
    // Handle order webhooks (completed purchases)
    if (shopifyTopic === 'orders/create' || shopifyTopic === 'orders/paid') {
      console.log('Processing order webhook:', shopifyTopic)
      await cartRecoveryService.processOrderWebhook(webhookData)
      return NextResponse.json({ success: true })
    }
    
    // Legacy cart webhook support
    if (shopifyTopic === 'carts/create' || shopifyTopic === 'carts/update') {
      const cartData = JSON.parse(body)
      console.log('Processing legacy cart webhook')
      await processCartWebhook(cartData)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid webhook topic' }, { status: 400 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}