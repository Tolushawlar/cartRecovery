import { NextRequest, NextResponse } from 'next/server'
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
    
    console.log('Order webhook received:', {
      topic: shopifyTopic,
      hasSignature: !!signature,
      bodyLength: body.length
    })
    
    // Try to save webhook call to Supabase
    try {
      await saveWebhookCall(shopifyTopic || 'unknown', JSON.parse(body), {
        signature,
        topic: shopifyTopic
      })
    } catch (logError) {
      console.warn('Failed to log webhook call:', logError)
    }
    
    const orderData = JSON.parse(body)

    // Log detailed order information
    console.log('Order Details:', {
      id: orderData.id,
      order_number: orderData.order_number, 
      email: orderData.email,
      total_price: orderData.total_price,
      line_items: orderData.line_items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      })),
      customer: orderData.customer,
      created_at: orderData.created_at,
      financial_status: orderData.financial_status,
      fulfillment_status: orderData.fulfillment_status
    })
    
    // Process all order-related webhooks without verification for testing
    console.log('Processing order webhook:', shopifyTopic)
    await cartRecoveryService.processOrderWebhook(orderData)
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Order webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
