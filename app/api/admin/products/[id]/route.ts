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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const { id } = await params;
  const formData = await req.formData();
  const saleFields = getSaleFields(formData);
  if (saleFields.error) return errJson(saleFields.error);
  
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  
  // Extract simple fields
  const fields = ['name', 'category', 'price', 'description', 'tag', 'is_active'];
  fields.forEach((f) => { 
    if (formData.has(f)) updates[f] = formData.get(f) as string; 
  });
  
  if (updates.price) {
    updates.price = parseInt(updates.price);
    updates.price_formatted = `LKR ${parseInt(updates.price).toLocaleString('en-LK')}`;
  }
  
  if (formData.has('sizes')) updates.sizes = JSON.parse(formData.get('sizes') as string);
  if (formData.has('colors')) updates.colors = JSON.parse(formData.get('colors') as string);
  if (formData.has('is_active')) updates.is_active = formData.get('is_active') === 'true';
  if (formData.has('is_featured')) updates.is_featured = formData.get('is_featured') === 'true';

  // Handle Image Uploads
  const supabase = createAdminSupabaseClient();
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

  const heroImageFile = formData.get('hero_image');
  if (heroImageFile instanceof File) {
    const fileName = createProductImageObjectPath(id, `hero-${heroImageFile.name}`);
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, heroImageFile, { cacheControl: '3600', upsert: false });

    if (uploadError) return errJson(`Hero image upload failed: ${uploadError.message}`, 500);

    const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);
    updates.hero_image = publicUrlData.publicUrl;
  } else if (formData.has('existing_hero_image')) {
    const existingHeroImage = formData.get('existing_hero_image') as string;
    updates.hero_image = existingHeroImage || null;
  }

  // Handle existing images
  if (formData.has('existing_images') || uploadedUrls.length > 0) {
    const existingImages = formData.has('existing_images')
      ? JSON.parse(formData.get('existing_images') as string)
      : [];
    const finalImages = [...existingImages, ...uploadedUrls];
    if (finalImages.length === 0) return errJson('Upload at least one product image');
    updates.images = finalImages;
    updates.image = finalImages[0];
  }

  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) return errJson(productSaveError(error.message), 500);

  if (saleFields.isOnSale) {
    const { error: saleError } = await supabase.from('sale_items').upsert({
      product_id: id,
      sale_percent: saleFields.salePercent,
      is_active: true,
      sort_order: 0,
    }, { onConflict: 'product_id' });
    if (saleError) return errJson(saleError.message, 500);
  } else {
    const { error: saleError } = await supabase
      .from('sale_items')
      .update({ is_active: false })
      .eq('product_id', id);
    if (saleError) return errJson(saleError.message, 500);
  }

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId, action: 'update_product', entity: 'product', entity_id: id,
  });

  return okJson(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req).catch(() => null);
  if (!admin) return errJson('Unauthorized', 401);
  const { id } = await params;

  const supabase = createAdminSupabaseClient();
  // Soft delete
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  if (error) return errJson(error.message, 500);

  await supabase.from('admin_activity_log').insert({
    admin_id: admin.adminId, action: 'delete_product', entity: 'product', entity_id: id,
  });

  return okJson({ success: true });
}
