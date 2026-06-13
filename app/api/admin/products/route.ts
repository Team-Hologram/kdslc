import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/admin-supabase';
import { requireAdmin, errJson, okJson } from '@/lib/admin-auth';
import { createProductImageObjectPath, PRODUCT_IMAGES_BUCKET } from '@/lib/product-image-storage';

function getSaleFields(formData: FormData) {
  const isOnSale = formData.get('is_on_sale') === 'true';
  const salePercentRaw = formData.get('sale_percent') as string | null;
  const salePercent = salePercentRaw ? parseInt(salePercentRaw, 10) : 0;

  if (isOnSale && (!salePercent || salePercent < 1 || salePercent > 100)) {
    return { error: 'Sale discount must be between 1 and 100 percent' };
  }

  return { isOnSale, salePercent };
}

function productSaveError(message: string) {
  if (
    message.includes('is_featured') ||
    message.includes('hero_image') ||
    message.includes('schema cache')
  ) {
    return `${message}. Run this SQL in Supabase SQL Editor: ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false; ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_image TEXT;`;
  }

  return message;
}

export async function GET(req: NextRequest) {
  try { await requireAdmin(req); } catch { return errJson('Unauthorized', 401); }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';

  const supabase = createAdminSupabaseClient();
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });

  if (search) query = query.ilike('name', `%${search}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return errJson(productSaveError(error.message), 500);

  const ids = (data ?? []).map((product) => product.id);
  const { data: saleItems, error: saleError } = ids.length
    ? await supabase.from('sale_items').select('product_id, sale_percent, is_active, sort_order').in('product_id', ids)
    : { data: [], error: null };

  if (saleError) return errJson(saleError.message, 500);

  const saleMap = new Map((saleItems ?? []).map((item) => [item.product_id, item]));
  return okJson((data ?? []).map((product) => {
    const sale = saleMap.get(product.id);
    return {
      ...product,
      is_on_sale: Boolean(sale?.is_active),
      sale_percent: sale?.sale_percent ?? '',
      sale_item_sort_order: sale?.sort_order ?? 0,
    };
  }));
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);

  const formData = await req.formData();
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const price = formData.get('price') as string;
  const description = formData.get('description') as string;
  const tag = formData.get('tag') as string;
  
  const sizesRaw = formData.get('sizes') as string;
  const sizes = sizesRaw ? JSON.parse(sizesRaw) : [];
  
  const colorsRaw = formData.get('colors') as string;
  const colors = colorsRaw ? JSON.parse(colorsRaw) : [];
  const saleFields = getSaleFields(formData);
  if (saleFields.error) return errJson(saleFields.error);

  if (!name || !category || !price) return errJson('name, category, and price are required');

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
  const supabase = createAdminSupabaseClient();

  // Handle Image Uploads
  const uploadedUrls: string[] = [];
  const imageFiles = formData.getAll('images');
  
  for (const file of imageFiles) {
    if (file instanceof File) {
      const fileName = createProductImageObjectPath(id, file.name);
      
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) return errJson(`Image upload failed: ${uploadError.message}`, 500);

      const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);
      uploadedUrls.push(publicUrlData.publicUrl);
    }
  }

  // Fallback if there was an existing image passed as a string (not typical for new products but just in case)
  const existingImagesRaw = formData.get('existing_images') as string;
  const existingImages = existingImagesRaw ? JSON.parse(existingImagesRaw) : [];
  const finalImages = [...existingImages, ...uploadedUrls];
  if (finalImages.length === 0) return errJson('Upload at least one product image');

  let heroImageUrl = '';
  const heroImageFile = formData.get('hero_image');
  if (heroImageFile instanceof File) {
    const fileName = createProductImageObjectPath(id, `hero-${heroImageFile.name}`);
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, heroImageFile, { cacheControl: '3600', upsert: false });

    if (uploadError) return errJson(`Hero image upload failed: ${uploadError.message}`, 500);

    const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);
    heroImageUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      id,
      name,
      category,
      price: parseInt(price),
      price_formatted: `LKR ${parseInt(price).toLocaleString('en-LK')}`,
      description,
      image: finalImages.length > 0 ? finalImages[0] : null,
      hero_image: heroImageUrl || null,
      images: finalImages,
      sizes,
      colors,
      tag,
      is_active: true,
      is_featured: formData.get('is_featured') === 'true',
    })
    .select()
    .single();

  if (error) return errJson(productSaveError(error.message), 500);

  if (saleFields.isOnSale) {
    const { error: saleError } = await supabase.from('sale_items').upsert({
      product_id: id,
      sale_percent: saleFields.salePercent,
      is_active: true,
      sort_order: 0,
    }, { onConflict: 'product_id' });
    if (saleError) return errJson(saleError.message, 500);
  }

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId, action: 'create_product', entity: 'product', entity_id: id,
  });

  return okJson(data, 201);
}
