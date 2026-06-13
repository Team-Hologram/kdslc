-- ============================================================
-- KDSL Admin Panel Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Admin Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',  -- 'super_admin' | 'admin' | 'viewer'
  totp_secret   TEXT,
  totp_enabled  BOOLEAN DEFAULT false,
  totp_verified BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_login    TIMESTAMPTZ
);

-- ── Admin Activity Log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Email Campaigns ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  sent_count  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'draft',  -- 'draft' | 'sent'
  sent_at     TIMESTAMPTZ,
  created_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Products Table (admin-managed) ──────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  price         INTEGER NOT NULL,
  price_formatted TEXT,
  description   TEXT,
  image         TEXT,
  hero_image    TEXT,
  images        TEXT[] DEFAULT '{}',
  sizes         TEXT[] DEFAULT '{}',
  colors        JSONB DEFAULT '[]',
  tag           TEXT,
  rating        FLOAT DEFAULT 4.5,
  reviews       INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Seed products from static data
INSERT INTO products (id, name, category, price, price_formatted, description, image, sizes, colors, tag, rating, reviews) VALUES
  ('hoodie-001', 'Signature Oversized Hoodie', 'Hoodies', 8500, 'LKR 8,500',
   'Our signature oversized hoodie is crafted from premium 380gsm French Terry fabric. Designed with a relaxed fit, ribbed cuffs and hem, and an interior drawstring hood.',
   'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
   ARRAY['XS','S','M','L','XL','XXL'],
   '[{"name":"Jet Black","hex":"#111111"},{"name":"Ivory","hex":"#F2F0ED"},{"name":"Charcoal","hex":"#3A3A3A"}]',
   'BEST SELLER', 4.9, 128),

  ('tee-001', 'Premium Minimal Tee', 'T-Shirts', 4200, 'LKR 4,200',
   'The foundation of any refined wardrobe. Our premium tee is cut from 200gsm Supima cotton for an elevated base layer.',
   'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
   ARRAY['XS','S','M','L','XL'],
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#111111"},{"name":"Sand","hex":"#C8B99A"}]',
   'NEW ARRIVAL', 4.8, 94),

  ('tracksuit-001', 'Luxury Tracksuit Set', 'Sets', 14500, 'LKR 14,500',
   'A matching tracksuit set crafted from our proprietary moisture-wicking fabric blend.',
   'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
   ARRAY['S','M','L','XL'],
   '[{"name":"Black/Cream","hex":"#111111"},{"name":"Navy/White","hex":"#1B2B4B"}]',
   'LIMITED EDITION', 4.7, 67),

  ('jacket-001', 'Premium Leather Jacket', 'Jackets', 22000, 'LKR 22,000',
   'Crafted from full-grain Italian leather, this jacket develops a unique patina over time.',
   'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
   ARRAY['S','M','L','XL'],
   '[{"name":"Jet Black","hex":"#111111"},{"name":"Deep Brown","hex":"#3D2B1F"}]',
   'EXCLUSIVE', 4.9, 42),

  ('hoodie-002', 'Essential Pullover Hoodie', 'Hoodies', 7200, 'LKR 7,200',
   'A versatile everyday hoodie with our signature comfort-weight fleece.',
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
   ARRAY['XS','S','M','L','XL','XXL'],
   '[{"name":"Slate Grey","hex":"#6B7280"},{"name":"Cream","hex":"#F5F0E8"},{"name":"Black","hex":"#111111"}]',
   null, 4.6, 89),

  ('tee-002', 'Graphic Statement Tee', 'T-Shirts', 3800, 'LKR 3,800',
   'Bold graphic design on premium cotton. A statement piece for the modern wardrobe.',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
   ARRAY['XS','S','M','L','XL'],
   '[{"name":"White","hex":"#FFFFFF"},{"name":"Washed Black","hex":"#2A2A2A"}]',
   'NEW ARRIVAL', 4.5, 55),

  ('set-001', 'Co-ord Linen Set', 'Sets', 11500, 'LKR 11,500',
   'Breathable linen co-ord set, perfect for warm weather styling.',
   'https://images.unsplash.com/photo-1594938298603-c8148c4b4ab7?w=800',
   ARRAY['XS','S','M','L','XL'],
   '[{"name":"Natural","hex":"#D4B896"},{"name":"Sage","hex":"#8FAF8C"}]',
   null, 4.7, 34),

  ('jacket-002', 'Bomber Jacket', 'Jackets', 16500, 'LKR 16,500',
   'Classic bomber silhouette with a modern KDSL twist. Premium nylon shell.',
   'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800',
   ARRAY['S','M','L','XL'],
   '[{"name":"Olive","hex":"#556B2F"},{"name":"Black","hex":"#111111"}]',
   'EXCLUSIVE', 4.8, 71)

ON CONFLICT (id) DO NOTHING;

-- ── Orders: add extra columns ────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history  JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status  TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMPTZ;

-- ── Products: add extra columns ──────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── Newsletter: add name + active flag ──────────────────────
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name      TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ── RLS: admin tables are service-role only (no public policies) ─
ALTER TABLE admin_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;

-- Allow public read on products (customer site can use this later)
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true);

-- Orders: allow admin update (service role bypasses RLS anyway)
CREATE POLICY "Service role manages orders" ON orders USING (true) WITH CHECK (true);
