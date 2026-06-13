import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
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

const bucket = 'product-images';
const rootFolder = 'seed-products';
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getPublicUrl(objectPath) {
  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

async function replaceProductImageUrls(fromPath, toPath) {
  const fromUrl = getPublicUrl(fromPath);
  const toUrl = getPublicUrl(toPath);
  const { data: products, error } = await supabase
    .from('products')
    .select('id, image, images');

  if (error) throw error;

  for (const product of products ?? []) {
    const nextImage = product.image === fromUrl ? toUrl : product.image;
    const nextImages = Array.isArray(product.images)
      ? product.images.map((url) => (url === fromUrl ? toUrl : url))
      : product.images;

    if (nextImage !== product.image || JSON.stringify(nextImages) !== JSON.stringify(product.images)) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          image: nextImage,
          images: nextImages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;
      console.log(`Updated DB URLs for ${product.id}`);
    }
  }
}

const { data: rootItems, error: rootError } = await supabase.storage
  .from(bucket)
  .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

if (rootError) {
  console.error(rootError.message);
  process.exit(1);
}

for (const item of rootItems ?? []) {
  if (item.name === rootFolder) continue;
  if (item.name.includes('.')) continue;

  const productId = item.name;
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(productId, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

  if (listError) {
    console.error(`Could not list ${productId}: ${listError.message}`);
    process.exitCode = 1;
    continue;
  }

  for (const file of files ?? []) {
    if (!file.name || !file.name.includes('.')) continue;

    const fromPath = `${productId}/${file.name}`;
    const toPath = `${rootFolder}/${productId}/${file.name}`;
    const { error: moveError } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (moveError) {
      console.error(`Move failed ${fromPath} -> ${toPath}: ${moveError.message}`);
      process.exitCode = 1;
      continue;
    }

    await replaceProductImageUrls(fromPath, toPath);
    console.log(`Moved ${fromPath} -> ${toPath}`);
  }
}

if (process.exitCode) {
  console.error('Finished with errors.');
} else {
  console.log('Product image folders are normalized under seed-products/.');
}
