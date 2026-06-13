-- ============================================================
-- KDSL Clothing — Migration: DB-driven Offers System
-- Run in Supabase SQL Editor → SQL Editor → New Query → Run
-- ============================================================

-- ── 1. Flash Sales (countdown timer) ──────────────────────────
-- One row = one active flash sale event.
-- 'ends_at' drives the live countdown on the offers page.
-- Set is_active=false to hide the urgency strip instantly.
CREATE TABLE IF NOT EXISTS flash_sales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'Flash Sale — Ends Soon',
  ends_at    TIMESTAMPTZ NOT NULL,
  badge_text TEXT DEFAULT 'Free shipping today',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Promo Codes ────────────────────────────────────────────
-- Add/remove rows to control what codes appear on the page.
-- Set is_active=false or expires_at to a past date to hide a code.
CREATE TABLE IF NOT EXISTS promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,           -- e.g. '10% Off'
  description    TEXT,                    -- e.g. 'On orders above LKR 5,000'
  discount_type  TEXT DEFAULT 'percentage', -- 'percentage' | 'fixed' | 'shipping'
  discount_value INTEGER DEFAULT 0,       -- percentage or LKR amount
  min_order      INTEGER DEFAULT 0,       -- minimum order value (LKR)
  color          TEXT DEFAULT 'teal',     -- 'teal' | 'purple' | 'amber'
  is_active      BOOLEAN DEFAULT true,
  expires_at     TIMESTAMPTZ,             -- NULL = never expires
  sort_order     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Bundle Deals ───────────────────────────────────────────
-- 'product_ids' is an array of product IDs from the products table.
CREATE TABLE IF NOT EXISTS bundle_deals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  saving_label TEXT,                      -- e.g. 'Save LKR 2,000'
  badge        TEXT,                      -- e.g. 'Best Value'
  product_ids  TEXT[] DEFAULT '{}',       -- array of product IDs
  color        TEXT DEFAULT 'teal',       -- 'teal' | 'purple'
  is_active    BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Sale Items ─────────────────────────────────────────────
-- Links a product to a discount. Products.price is original price.
-- Displayed sale price = price * (1 - sale_percent/100).
CREATE TABLE IF NOT EXISTS sale_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_percent INTEGER NOT NULL CHECK (sale_percent > 0 AND sale_percent <= 100),
  is_active    BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id)
);

-- ── Row Level Security (public read — managed via Supabase dashboard) ──
ALTER TABLE flash_sales  ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read flash_sales"  ON flash_sales  FOR SELECT USING (true);
CREATE POLICY "Public read promo_codes"  ON promo_codes  FOR SELECT USING (true);
CREATE POLICY "Public read bundle_deals" ON bundle_deals FOR SELECT USING (true);
CREATE POLICY "Public read sale_items"   ON sale_items   FOR SELECT USING (true);

-- ============================================================
-- Seed initial data (safe to re-run — uses ON CONFLICT)
-- ============================================================

-- Flash sale: ends 48 hours from now (update ends_at anytime in Supabase)
INSERT INTO flash_sales (title, ends_at, badge_text, is_active)
VALUES (
  'Flash Sale — Ends Soon',
  NOW() + INTERVAL '48 hours',
  'Free shipping today',
  true
);

-- Promo codes
INSERT INTO promo_codes (code, label, description, discount_type, discount_value, min_order, color, sort_order)
VALUES
  ('KDSL10',    '10% Off',       'On all orders above LKR 5,000',      'percentage', 10, 5000, 'teal',   1),
  ('NEWMEMBER', '15% Off',       'For new members — first order only',  'percentage', 15,    0, 'purple', 2),
  ('FREESHIP',  'Free Shipping', 'On any order, any value',             'shipping',    0,    0, 'amber',  3)
ON CONFLICT (code) DO NOTHING;

-- Bundle deals
INSERT INTO bundle_deals (title, description, saving_label, badge, product_ids, color, sort_order)
VALUES
  ('The Essential Pack', 'Hoodie + Tee + Free Shipping', 'Save LKR 2,000', 'Best Value', ARRAY['hoodie-001','tee-001'],       'teal',   1),
  ('The Street Set',     'Tracksuit + Bomber Jacket',    'Save LKR 4,500', 'Limited',    ARRAY['tracksuit-001','jacket-001'], 'purple', 2)
ON CONFLICT DO NOTHING;

-- Sale items (products.price = full/original price; sale_percent = discount)
INSERT INTO sale_items (product_id, sale_percent, sort_order)
VALUES
  ('hoodie-001',    20, 1),
  ('tee-001',       15, 2),
  ('tracksuit-001', 20, 3),
  ('hoodie-002',    15, 4),
  ('jacket-001',    10, 5),
  ('tee-002',       15, 6)
ON CONFLICT (product_id) DO NOTHING;
