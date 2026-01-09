import { supabase } from './supabase';
import { vapiService } from './vapi';

export class CartRecoveryService {
  
  // Extract phone number from various fields in the payload
  private extractPhoneNumber(payload: any): string | null {
    const phoneFields = [
      payload.phone,
      payload.customer?.phone,
      payload.customer?.default_address?.phone,
      payload.billing_address?.phone,
      payload.shipping_address?.phone,
      payload.sms_marketing_phone
    ];

    for (const phone of phoneFields) {
      if (phone && typeof phone === 'string' && phone.trim()) {
        return phone.trim();
      }
    }
    return null;
  }

  // Extract customer name from payload
  private extractCustomerName(payload: any): string {
    const firstName = payload.customer?.first_name || payload.billing_address?.first_name || '';
    const lastName = payload.customer?.last_name || payload.billing_address?.last_name || '';
    const fullName = payload.customer?.default_address?.name || payload.billing_address?.name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    if (fullName) {
      return fullName;
    }
    return 'Customer';
  }

  // Extract multiple product names from line items
  private extractProductNames(lineItems: any[]): string {
    if (!lineItems || lineItems.length === 0) {
      return 'Product';
    }
    return lineItems.map(item => item.title || item.presentment_title || 'Product').join(', ');
  }

  // Get all products from database
  private async getAllProducts(): Promise<string> {
    const { data: products } = await supabase
      .from('products')
      .select('title')
      .eq('status', 'active');
    
    if (!products || products.length === 0) {
      return 'No products available';
    }
    
    return products.map(p => p.title).join(', ');
  }

  // Process checkout webhook and save abandoned cart if it has phone number
  async processCheckoutWebhook(payload: any): Promise<void> {
    const phoneNumber = this.extractPhoneNumber(payload);
    
    if (!phoneNumber) {
      console.log('No phone number found in checkout, skipping cart recovery');
      return;
    }

    const abandonedCart = {
      checkout_id: payload.id,
      token: payload.token,
      customer_phone: phoneNumber,
      customer_email: payload.email || payload.customer?.email,
      customer_name: this.extractCustomerName(payload),
      total_price: parseFloat(payload.total_price || '0'),
      currency: payload.currency || 'USD',
      line_items: payload.line_items || [],
      abandoned_checkout_url: payload.abandoned_checkout_url,
      created_at: payload.created_at || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('abandoned_carts')
      .upsert(abandonedCart, { 
        onConflict: 'token',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error saving abandoned cart:', error);
      throw error;
    }

    console.log(`Saved abandoned cart with phone: ${phoneNumber}`);
  }

  // Process order webhook to mark cart as completed
  async processOrderWebhook(payload: any): Promise<void> {
    const checkoutToken = payload.checkout_token;
    
    // Always save order data to orders table
    const orderData = {
      order_id: payload.id,
      checkout_token: checkoutToken,
      customer_email: payload.email || payload.customer?.email,
      customer_phone: this.extractPhoneNumber(payload),
      total_price: parseFloat(payload.total_price || '0'),
      currency: payload.currency || 'USD',
      created_at: payload.created_at || new Date().toISOString(),
      payload: payload
    };

    const { error: orderError } = await supabase.from('orders').upsert(orderData, { onConflict: 'order_id' });
    
    if (orderError) {
      console.error('Error saving order:', orderError);
    } else {
      console.log(`Saved order ${payload.id} to database`);
    }

    // Only mark cart as completed if there's a checkout token
    if (!checkoutToken) {
      console.log('No checkout token in order, order saved but cart not marked as completed');
      return;
    }

    const { error } = await supabase
      .from('abandoned_carts')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('token', checkoutToken);

    if (error) {
      console.error('Error marking cart as completed:', error);
    } else {
      console.log(`Marked cart ${checkoutToken} as completed`);
    }
  }

  // Process all existing webhook_calls to find abandoned carts with phone numbers
  async processAllWebhookCalls(): Promise<void> {
    const { data: webhooks } = await supabase
      .from('webhook_calls')
      .select('*')
      .in('topic', ['checkouts/create', 'checkouts/update']);

    for (const webhook of webhooks || []) {
      const payload = webhook.payload;
      const phoneNumber = this.extractPhoneNumber(payload);
      
      if (!phoneNumber || !payload.token) continue;

      // Check if cart already exists
      const { data: existingCart } = await supabase
        .from('abandoned_carts')
        .select('id')
        .eq('token', payload.token)
        .single();

      if (existingCart) continue;

      // Create cart record
      const cartData = {
        checkout_id: payload.id,
        token: payload.token,
        customer_phone: phoneNumber,
        customer_email: payload.email || payload.customer?.email,
        customer_name: this.extractCustomerName(payload),
        total_price: parseFloat(payload.total_price || '0'),
        currency: payload.currency || 'USD',
        line_items: payload.line_items || [],
        abandoned_checkout_url: payload.abandoned_checkout_url,
        created_at: payload.created_at || webhook.created_at,
      };

      await supabase.from('abandoned_carts').insert(cartData);
      console.log(`Processed existing webhook for cart ${payload.token}`);
    }
  }
  async processScheduledCalls(): Promise<void> {
    const now = new Date();
    
    // Get all incomplete carts with phone numbers
    const { data: carts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('is_completed', false)
      .not('customer_phone', 'is', null);

    if (error) {
      console.error('Error fetching abandoned carts:', error);
      return;
    }

    console.log(`Found ${carts?.length || 0} abandoned carts to process`);

    for (const cart of carts || []) {
      console.log(`Processing cart ${cart.token}`);
      
      // Get existing call log for this cart
      let { data: callLog } = await supabase
        .from('call_logs')
        .select('*')
        .eq('abandoned_cart_id', cart.id)
        .single();

      if (!callLog) {
        console.log(`Creating call log for cart ${cart.token}`);
        const { data: newCallLog } = await supabase
          .from('call_logs')
          .insert({
            abandoned_cart_id: cart.id,
            phone_number: cart.customer_phone
          })
          .select()
          .single();
        callLog = newCallLog;
      }

      if (!callLog) continue;

      // Make first available call
      let callToMake = null;
      let hourField = null;
      
      if (callLog.call_2_hour === 0) {
        callToMake = '2_hour';
        hourField = 'call_2_hour';
      } else if (callLog.call_4_hour === 0) {
        callToMake = '4_hour';
        hourField = 'call_4_hour';
      } else if (callLog.call_8_hour === 0) {
        callToMake = '8_hour';
        hourField = 'call_8_hour';
      } else if (callLog.call_16_hour === 0) {
        callToMake = '16_hour';
        hourField = 'call_16_hour';
      } else if (callLog.call_24_hour === 0) {
        callToMake = '24_hour';
        hourField = 'call_24_hour';
      }

      if (callToMake && hourField) {
        console.log(`Making ${callToMake} call for cart ${cart.token}`);
        await this.makeRecoveryCall(cart, callLog, callToMake, hourField);
      } else {
        console.log(`No calls needed for cart ${cart.token}`);
      }
    }
  }

  // Make a recovery call for a specific cart
  private async makeRecoveryCall(cart: any, callLog: any, callType: string, hourField: string): Promise<void> {
    if (!cart.customer_phone) return;

    const productNames = this.extractProductNames(cart.line_items);
    const allProducts = await this.getAllProducts();
    
    console.log(`Making ${callType} call to ${cart.customer_phone} for cart ${cart.token}`);

    const callResult = await vapiService.makeCall(
      cart.customer_phone,
      cart.customer_name || 'Customer',
      cart.customer_email || '',
      productNames,
      cart.abandoned_checkout_url || '',
      allProducts
    );

    // Update call log with the result
    await supabase
      .from('call_logs')
      .update({
        [hourField]: 1,
        vapi_response: callResult,
        success: callResult.success
      })
      .eq('id', callLog.id);

    // Also update abandoned_carts table
    const updateTimeField = `call_${callType}_at`;
    
    await supabase
      .from('abandoned_carts')
      .update({
        [`call_${callType.replace('_hour', '_hour')}`]: true,
        [updateTimeField]: new Date().toISOString()
      })
      .eq('id', cart.id);

    console.log(`${callType} call ${callResult.success ? 'successful' : 'failed'} for cart ${cart.token}`);
  }

  // Get daily stats
  async getDailyStats(date?: string): Promise<any> {
    const { data: carts } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: calls } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });

    return {
      totalAbandoned: carts?.length || 0,
      totalCompleted: carts?.filter(c => c.is_completed).length || 0,
      totalCalls: calls?.length || 0,
      successfulCalls: calls?.filter(c => c.success).length || 0,
      carts: carts || [],
      calls: calls || []
    };
  }
}

export const cartRecoveryService = new CartRecoveryService();