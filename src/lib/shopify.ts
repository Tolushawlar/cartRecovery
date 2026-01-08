import axios from 'axios'
import { saveCart, markCartAbandoned, markCallSent } from './supabase'

interface CartItem {
  id: string
  quantity: number
  variant_id: string
  product_id: string
}

interface Cart {
  id: string
  token: string
  line_items: CartItem[]
  created_at: string
  updated_at: string
  abandoned_checkout_url?: string
  phone?: string
  email?: string
}

export async function processCartWebhook(cartData: Cart) {
  console.log('Processing cart webhook:', cartData.id)
  
  // Save cart to Supabase
  await saveCart(cartData)

  // Check if cart has items but no checkout started
  if (cartData.line_items.length > 0 && !cartData.abandoned_checkout_url) {
    setTimeout(() => {
      checkCartAbandonment(cartData)
    }, 30 * 60 * 1000) // Check after 30 minutes
  }
}

async function checkCartAbandonment(cart: Cart) {
  // Mark cart as abandoned in database
  await markCartAbandoned(cart.id)
  
  // Generate persistent cart link
  const cartLink = await generateCartLink(cart.token)
  
  if (cartLink && (cart.phone || cart.email)) {
    await sendVapiCall(cart, cartLink)
  }
}

async function generateCartLink(cartToken: string): Promise<string | null> {
  try {
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN
    return `https://${shopDomain}/cart/${cartToken}`
  } catch (error) {
    console.error('Error generating cart link:', error)
    return null
  }
}

async function sendVapiCall(cart: Cart, cartLink: string) {
  try {
    const vapiResponse = await axios.post('https://api.vapi.ai/call', {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: cart.phone
      },
      assistant: {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo"
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        firstMessage: `Hi! You left some items in your cart. Complete your purchase here: ${cartLink}`
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    // Mark call as sent in database
    await markCallSent(cart.id)

    console.log('Vapi call initiated:', vapiResponse.data)
  } catch (error) {
    console.error('Error sending Vapi call:', error)
  }
}