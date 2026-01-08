import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' }
  }
})

export interface CartRecord {
  id: string
  cart_id: string
  user_phone?: string
  user_email?: string
  cart_token: string
  line_items: any[]
  status: 'active' | 'abandoned' | 'recovered'
  call_sent: boolean
  created_at: string
  updated_at: string
}

export async function saveCart(cartData: any) {
  const { data, error } = await supabase
    .from('carts')
    .upsert({
      cart_id: cartData.id,
      user_phone: cartData.phone,
      user_email: cartData.email,
      cart_token: cartData.token,
      line_items: cartData.line_items,
      status: 'active',
      call_sent: false,
      updated_at: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data
}

export async function markCartAbandoned(cartId: string) {
  const { error } = await supabase
    .from('carts')
    .update({ status: 'abandoned' })
    .eq('cart_id', cartId)

  if (error) throw error
}

export async function markCallSent(cartId: string) {
  const { error } = await supabase
    .from('carts')
    .update({ call_sent: true })
    .eq('cart_id', cartId)

  if (error) throw error
}

export async function saveWebhookCall(topic: string, payload: any, headers: any) {
  const { data, error } = await supabase
    .from('webhook_calls')
    .insert({
      topic,
      payload,
      headers,
      created_at: new Date().toISOString()
    })
    .select()

  if (error) throw error
  return data
}

export async function getStats() {
  // Return mock data if Supabase not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { totalCarts: 8, abandonedCarts: 4, callsSent: 4, recoveryRate: 100 }
  }

  const { data, error } = await supabase
    .from('carts')
    .select('status, call_sent')

  if (error) throw error

  const totalCarts = data.length
  const abandonedCarts = data.filter((cart: any) => cart.status === 'abandoned').length
  const callsSent = data.filter((cart: any) => cart.call_sent).length
  const recoveryRate = abandonedCarts > 0 ? Math.round((callsSent / abandonedCarts) * 100) : 0

  return { totalCarts, abandonedCarts, callsSent, recoveryRate }
}