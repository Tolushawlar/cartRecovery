-- Enhanced webhook_calls table (if not exists)
CREATE TABLE IF NOT EXISTS webhook_calls (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create abandoned_carts table for tracking carts with phone numbers
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id SERIAL PRIMARY KEY,
  checkout_id BIGINT UNIQUE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  total_price DECIMAL(10,2),
  currency VARCHAR(3),
  line_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_2_hour BOOLEAN DEFAULT FALSE,
  call_4_hour BOOLEAN DEFAULT FALSE,
  call_8_hour BOOLEAN DEFAULT FALSE,
  call_16_hour BOOLEAN DEFAULT FALSE,
  call_24_hour BOOLEAN DEFAULT FALSE,
  call_2_hour_at TIMESTAMP WITH TIME ZONE,
  call_4_hour_at TIMESTAMP WITH TIME ZONE,
  call_8_hour_at TIMESTAMP WITH TIME ZONE,
  call_16_hour_at TIMESTAMP WITH TIME ZONE,
  call_24_hour_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create orders table for tracking completed orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL,
  checkout_token VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  total_price DECIMAL(10,2),
  currency VARCHAR(3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB
);

-- Create call_logs table with separate hour fields
CREATE TABLE IF NOT EXISTS call_logs (
  id SERIAL,
  abandoned_cart_id INTEGER NULL,
  phone_number VARCHAR(20) NOT NULL,
  call_2_hour INTEGER DEFAULT 0,
  call_4_hour INTEGER DEFAULT 0,
  call_8_hour INTEGER DEFAULT 0,
  call_16_hour INTEGER DEFAULT 0,
  call_24_hour INTEGER DEFAULT 0,
  vapi_response JSONB NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT call_logs_abandoned_cart_id_fkey FOREIGN KEY (abandoned_cart_id) REFERENCES abandoned_carts (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_calls_topic ON webhook_calls(topic);
CREATE INDEX IF NOT EXISTS idx_webhook_calls_created_at ON webhook_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_token ON abandoned_carts(token);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_phone ON abandoned_carts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_token ON orders(checkout_token);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_cart_id ON call_logs(abandoned_cart_id);