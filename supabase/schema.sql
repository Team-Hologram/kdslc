-- ============================================================
-- KDSL Clothing — Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  price_formatted TEXT,
  tag TEXT DEFAULT '',
  image TEXT,
  hero_image TEXT,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  details TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]',
  is_new BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart items (per authenticated user)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, size, color)
);

-- Watchlist (per authenticated user)
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders (created at checkout)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_fee INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'card',
  payment_status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Products: public read
CREATE POLICY "Products viewable by everyone" ON products FOR SELECT USING (true);

-- Cart: users own their rows
CREATE POLICY "Users manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Watchlist: users own their rows
CREATE POLICY "Users manage own watchlist" ON watchlist_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders: users can view their own; anyone can insert
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);

-- Newsletter: anyone can subscribe
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Contact: anyone can submit
CREATE POLICY "Anyone can submit contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- ============================================================
-- Seed Product Data
-- ============================================================

INSERT INTO products (id, name, category, price, price_formatted, tag, image, images, description, details, sizes, colors, is_new, is_best_seller, rating, reviews) VALUES
(
  'hoodie-001', 'Signature Oversized Hoodie', 'Hoodies', 8500, 'LKR 8,500', 'Best Seller',
  '/product-hoodie.jpg',
  ARRAY['/product-hoodie.jpg', '/lookbook-hero.jpg', '/brand-story.jpg'],
  'Our signature oversized hoodie is crafted from premium 380gsm French Terry fabric. Designed with a dropped shoulder silhouette and a relaxed, enveloping fit — this is the piece you''ll reach for every time.',
  ARRAY['380gsm French Terry cotton', 'Dropped shoulder silhouette', 'Embroidered KDSL logo', 'Ribbed cuffs and hem', 'Kangaroo pocket'],
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  '[{"name":"Jet Black","hex":"#111111"},{"name":"Ivory","hex":"#F2F0ED"},{"name":"Charcoal","hex":"#3A3A3A"}]'::jsonb,
  false, true, 4.9, 248
),
(
  'tee-001', 'Premium Minimal Tee', 'T-Shirts', 4200, 'LKR 4,200', 'New Arrival',
  '/product-tee.jpg',
  ARRAY['/product-tee.jpg', '/lookbook-2.jpg'],
  'The foundation of any refined wardrobe. Our premium tee is cut from 200gsm Supima cotton for a structured yet breathable fit that holds its shape wash after wash.',
  ARRAY['200gsm Supima cotton', 'Structured boxy fit', 'Reinforced seams', 'KDSL woven label', 'Pre-shrunk fabric'],
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  '[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#111111"},{"name":"Sand","hex":"#C8B99A"}]'::jsonb,
  true, false, 4.7, 124
),
(
  'tracksuit-001', 'Luxury Tracksuit Set', 'Sets', 14500, 'LKR 14,500', 'Limited Edition',
  '/product-tracksuit.jpg',
  ARRAY['/product-tracksuit.jpg', '/lookbook-2.jpg', '/brand-story.jpg'],
  'The epitome of elevated casual luxury. This co-ord tracksuit set features contrast stripe detailing and is made from our proprietary brushed fleece fabric.',
  ARRAY['Brushed fleece fabric', 'Contrast stripe detailing', 'Zip-through jacket', 'Tapered jogger pants', 'Adjustable waistband'],
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name":"Black/Cream","hex":"#111111"},{"name":"Navy/White","hex":"#1B2B4B"}]'::jsonb,
  false, false, 4.8, 89
),
(
  'jacket-001', 'Elite Leather Bomber', 'Jackets', 22000, 'LKR 22,000', 'Exclusive',
  '/product-jacket.jpg',
  ARRAY['/product-jacket.jpg', '/lookbook-hero.jpg'],
  'Commanding presence, uncompromising quality. Our Elite Leather Bomber is crafted from full-grain lamb leather, lined with pure silk, and finished with custom KDSL hardware.',
  ARRAY['Full-grain lamb leather', 'Silk lining', 'Custom KDSL hardware', 'Ribbed collar and cuffs', 'Two interior pockets'],
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name":"Jet Black","hex":"#111111"},{"name":"Deep Brown","hex":"#3D2B1F"}]'::jsonb,
  false, false, 5.0, 42
),
(
  'hoodie-002', 'KDSL Gradient Hoodie', 'Hoodies', 9500, 'LKR 9,500', 'New Arrival',
  '/product-hoodie.jpg',
  ARRAY['/product-hoodie.jpg'],
  'A bold statement piece. The KDSL Gradient Hoodie features our signature teal-to-purple gradient print across the back — a wearable piece of art.',
  ARRAY['380gsm cotton fleece', 'Gradient back print', 'Zip hood', 'Relaxed fit', 'Drop shoulder'],
  ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  '[{"name":"Black","hex":"#111111"}]'::jsonb,
  true, false, 4.6, 37
),
(
  'tee-002', 'Monochrome Drop Tee', 'T-Shirts', 4800, 'LKR 4,800', '',
  '/product-tee.jpg',
  ARRAY['/product-tee.jpg'],
  'Stripped back to essentials. The Monochrome Drop Tee is our most minimal offering — a blank canvas for self-expression.',
  ARRAY['220gsm jersey knit', 'Extended drop hem', 'Raw edge finishes', 'Oversized boxy cut', 'KDSL tonal print'],
  ARRAY['XS', 'S', 'M', 'L', 'XL'],
  '[{"name":"Black","hex":"#111111"},{"name":"White","hex":"#FFFFFF"}]'::jsonb,
  false, false, 4.5, 61
),
(
  'tracksuit-002', 'Essential Set', 'Sets', 12000, 'LKR 12,000', '',
  '/product-tracksuit.jpg',
  ARRAY['/product-tracksuit.jpg'],
  'Everyday luxury made effortless. The Essential Set is our entry-level co-ord — all the quality of KDSL at an accessible price point.',
  ARRAY['Loopback cotton', 'Clean minimal design', 'Elastic waistband', 'Ribbed details', 'Regular fit jacket'],
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name":"Black","hex":"#111111"},{"name":"Grey","hex":"#6B6B6B"}]'::jsonb,
  false, false, 4.4, 55
),
(
  'jacket-002', 'Urban Utility Jacket', 'Jackets', 18500, 'LKR 18,500', '',
  '/product-jacket.jpg',
  ARRAY['/product-jacket.jpg'],
  'Where function meets fashion. The Urban Utility Jacket brings premium technical fabrication into the streetwear space.',
  ARRAY['Technical ripstop fabric', '6 utility pockets', 'Adjustable hood and hem', 'YKK zippers', 'Waterproof coating'],
  ARRAY['S', 'M', 'L', 'XL'],
  '[{"name":"Black","hex":"#111111"},{"name":"Olive","hex":"#4A5240"}]'::jsonb,
  false, false, 4.7, 28
)
ON CONFLICT (id) DO NOTHING;
