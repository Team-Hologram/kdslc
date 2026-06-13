import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');

if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bucket = 'product-images';
const seedImages = [
  { id: 'hoodie-001', file: 'product-hoodie.jpg' },
  { id: 'hoodie-002', file: 'product-hoodie.jpg' },
  { id: 'tee-001', file: 'product-tee.jpg' },
  { id: 'tee-002', file: 'product-tee.jpg' },
  { id: 'tracksuit-001', file: 'product-tracksuit.jpg' },
  { id: 'tracksuit-002', file: 'product-tracksuit.jpg' },
  { id: 'set-001', file: 'product-tracksuit.jpg' },
  { id: 'jacket-001', file: 'product-jacket.jpg' },
  { id: 'jacket-002', file: 'product-jacket.jpg' },
];

const contentTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

for (const item of seedImages) {
  const localPath = path.join(root, 'public', item.file);
  if (!existsSync(localPath)) {
    console.warn(`Skipped ${item.id}: missing ${localPath}`);
    continue;
  }

  const objectPath = `seed-products/${item.id}/${item.file}`;
  const buffer = await readFile(localPath);
  const contentType = contentTypes[path.extname(item.file).toLowerCase()] ?? 'application/octet-stream';

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      cacheControl: '31536000',
      contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error(`Upload failed for ${item.id}: ${uploadError.message}`);
    process.exitCode = 1;
    continue;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from('products')
    .update({
      image: publicUrl,
      images: [publicUrl],
      updated_at: new Date().toISOString(),
    })
    .eq('id', item.id);

  if (updateError) {
    console.error(`Database update failed for ${item.id}: ${updateError.message}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`Updated ${item.id} -> ${publicUrl}`);
}

if (process.exitCode) {
  console.error('Finished with errors.');
} else {
  console.log('Product seed images are now stored in Supabase Storage.');
}
