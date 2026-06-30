-- Speed up customer lookup by phone/email during checkout and discount checks.
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

CREATE INDEX IF NOT EXISTS idx_beta_customers_phone ON beta_customers (phone);
CREATE INDEX IF NOT EXISTS idx_beta_customers_email ON beta_customers (email);
