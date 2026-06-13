-- ============================================================
-- KDSL Clothing — Migration: Site Settings + Offers Enhancements
-- Run AFTER migration_offers.sql
-- ============================================================

-- ── site_settings: global key-value config ─────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);

-- Seed default settings
INSERT INTO site_settings (key, value, description)
VALUES
  ('free_shipping_threshold', '7500', 'Minimum order value in LKR for free shipping'),
  ('shipping_fee',            '350',  'Flat shipping fee in LKR when below threshold'),
  ('free_shipping_badge_text','Free shipping today', 'Text on the flash sale free-shipping badge. Leave empty to hide badge.')
ON CONFLICT (key) DO NOTHING;

-- ── Add free_shipping_enabled toggle to flash_sales ────────────
-- If this column already exists, this will error safely.
ALTER TABLE flash_sales ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN DEFAULT false;

-- Enable free shipping on the current active flash sale
UPDATE flash_sales SET free_shipping_enabled = true WHERE is_active = true;
