import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const shopifyTopic = request.headers.get('x-shopify-topic')
    const productData = JSON.parse(body)

    console.log('Product webhook received:', {
      topic: shopifyTopic,
      productId: productData.id,
      title: productData.title
    })

    const product = {
      product_id: productData.id,
      title: productData.title,
      handle: productData.handle,
      description: productData.body_html,
      vendor: productData.vendor,
      product_type: productData.product_type,
      tags: productData.tags,
      status: productData.status,
      images: productData.images,
      variants: productData.variants,
      price: productData.variants?.[0]?.price || '0',
      created_at: productData.created_at,
      updated_at: productData.updated_at
    }

    if (shopifyTopic === 'products/delete') {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productData.id)
      
      if (error) throw error
      console.log(`Deleted product ${productData.id}`)
    } else {
      const { error } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'product_id' })
      
      if (error) throw error
      console.log(`Saved product ${productData.title}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}