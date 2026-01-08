-- Create webhook_calls table
CREATE TABLE webhook_calls (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_webhook_calls_topic ON webhook_calls(topic);
CREATE INDEX idx_webhook_calls_created_at ON webhook_calls(created_at);