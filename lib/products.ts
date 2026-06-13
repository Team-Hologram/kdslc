export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  priceFormatted: string;
  tag: string;
  image: string;
  heroImage: string;
  images: string[];
  description: string;
  details: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
}

export type ProductRow = {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  price?: number | null;
  priceFormatted?: string | null;
  price_formatted?: string | null;
  tag?: string | null;
  image?: string | null;
  heroImage?: string | null;
  hero_image?: string | null;
  images?: string[] | null;
  description?: string | null;
  details?: string[] | null;
  sizes?: string[] | null;
  colors?: unknown;
  isNew?: boolean | null;
  is_new?: boolean | null;
  isBestSeller?: boolean | null;
  is_best_seller?: boolean | null;
  isFeatured?: boolean | null;
  is_featured?: boolean | null;
  rating?: number | null;
  reviews?: number | null;
};

const fmtLKR = (price: number) => `LKR ${price.toLocaleString('en-LK')}`;

export function normalizeProduct(row: ProductRow): Product {
  const image = row.image ?? '';
  const heroImage = row.heroImage ?? row.hero_image ?? image;
  const images = Array.isArray(row.images) && row.images.length > 0
    ? row.images.filter(Boolean)
    : image
      ? [image]
      : [];

  return {
    id: row.id ?? '',
    name: row.name ?? '',
    category: row.category ?? '',
    price: row.price ?? 0,
    priceFormatted: row.priceFormatted ?? row.price_formatted ?? fmtLKR(row.price ?? 0),
    tag: row.tag ?? '',
    image,
    heroImage,
    images,
    description: row.description ?? '',
    details: Array.isArray(row.details) ? row.details : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : [],
    colors: Array.isArray(row.colors) ? row.colors as Product['colors'] : [],
    isNew: row.isNew ?? row.is_new ?? false,
    isBestSeller: row.isBestSeller ?? row.is_best_seller ?? false,
    isFeatured: row.isFeatured ?? row.is_featured ?? false,
    rating: row.rating ?? 0,
    reviews: row.reviews ?? 0,
  };
}

export function normalizeProducts(rows: ProductRow[] | null | undefined): Product[] {
  return (rows ?? []).map(normalizeProduct).filter((product) => product.id);
}

export const products: Product[] = [
  {
    id: 'hoodie-001',
    name: 'Signature Oversized Hoodie',
    category: 'Hoodies',
    price: 8500,
    priceFormatted: 'LKR 8,500',
    tag: 'Best Seller',
    image: '/product-hoodie.jpg',
    heroImage: '/product-hoodie.jpg',
    images: ['/product-hoodie.jpg', '/lookbook-hero.jpg', '/brand-story.jpg'],
    description: 'Our signature oversized hoodie is crafted from premium 380gsm French Terry fabric. Designed with a dropped shoulder silhouette and a relaxed, enveloping fit — this is the piece you\'ll reach for every time.',
    details: ['380gsm French Terry cotton', 'Dropped shoulder silhouette', 'Embroidered KDSL logo', 'Ribbed cuffs and hem', 'Kangaroo pocket'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Jet Black', hex: '#111111' }, { name: 'Ivory', hex: '#F2F0ED' }, { name: 'Charcoal', hex: '#3A3A3A' }],
    isNew: false,
    isBestSeller: true,
    isFeatured: false,
    rating: 4.9,
    reviews: 248,
  },
  {
    id: 'tee-001',
    name: 'Premium Minimal Tee',
    category: 'T-Shirts',
    price: 4200,
    priceFormatted: 'LKR 4,200',
    tag: 'New Arrival',
    image: '/product-tee.jpg',
    heroImage: '/product-tee.jpg',
    images: ['/product-tee.jpg', '/lookbook-2.jpg'],
    description: 'The foundation of any refined wardrobe. Our premium tee is cut from 200gsm Supima cotton for a structured yet breathable fit that holds its shape wash after wash.',
    details: ['200gsm Supima cotton', 'Structured boxy fit', 'Reinforced seams', 'KDSL woven label', 'Pre-shrunk fabric'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#111111' }, { name: 'Sand', hex: '#C8B99A' }],
    isNew: true,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.7,
    reviews: 124,
  },
  {
    id: 'tracksuit-001',
    name: 'Luxury Tracksuit Set',
    category: 'Sets',
    price: 14500,
    priceFormatted: 'LKR 14,500',
    tag: 'Limited Edition',
    image: '/product-tracksuit.jpg',
    heroImage: '/product-tracksuit.jpg',
    images: ['/product-tracksuit.jpg', '/lookbook-2.jpg', '/brand-story.jpg'],
    description: 'The epitome of elevated casual luxury. This co-ord tracksuit set features contrast stripe detailing and is made from our proprietary brushed fleece fabric — impossibly soft, impeccably tailored.',
    details: ['Brushed fleece fabric', 'Contrast stripe detailing', 'Zip-through jacket', 'Tapered jogger pants', 'Adjustable waistband'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black/Cream', hex: '#111111' }, { name: 'Navy/White', hex: '#1B2B4B' }],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.8,
    reviews: 89,
  },
  {
    id: 'jacket-001',
    name: 'Elite Leather Bomber',
    category: 'Jackets',
    price: 22000,
    priceFormatted: 'LKR 22,000',
    tag: 'Exclusive',
    image: '/product-jacket.jpg',
    heroImage: '/product-jacket.jpg',
    images: ['/product-jacket.jpg', '/lookbook-hero.jpg'],
    description: 'Commanding presence, uncompromising quality. Our Elite Leather Bomber is crafted from full-grain lamb leather, lined with pure silk, and finished with custom KDSL hardware.',
    details: ['Full-grain lamb leather', 'Silk lining', 'Custom KDSL hardware', 'Ribbed collar and cuffs', 'Two interior pockets'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Jet Black', hex: '#111111' }, { name: 'Deep Brown', hex: '#3D2B1F' }],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    rating: 5.0,
    reviews: 42,
  },
  {
    id: 'hoodie-002',
    name: 'KDSL Gradient Hoodie',
    category: 'Hoodies',
    price: 9500,
    priceFormatted: 'LKR 9,500',
    tag: 'New Arrival',
    image: '/product-hoodie.jpg',
    heroImage: '/product-hoodie.jpg',
    images: ['/product-hoodie.jpg'],
    description: 'A bold statement piece. The KDSL Gradient Hoodie features our signature teal-to-purple gradient print across the back — a wearable piece of art.',
    details: ['380gsm cotton fleece', 'Gradient back print', 'Zip hood', 'Relaxed fit', 'Drop shoulder'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Black', hex: '#111111' }],
    isNew: true,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.6,
    reviews: 37,
  },
  {
    id: 'tee-002',
    name: 'Monochrome Drop Tee',
    category: 'T-Shirts',
    price: 4800,
    priceFormatted: 'LKR 4,800',
    tag: '',
    image: '/product-tee.jpg',
    heroImage: '/product-tee.jpg',
    images: ['/product-tee.jpg'],
    description: 'Stripped back to essentials. The Monochrome Drop Tee is our most minimal offering — a blank canvas for self-expression with a perfectly weighted drape.',
    details: ['220gsm jersey knit', 'Extended drop hem', 'Raw edge finishes', 'Oversized boxy cut', 'KDSL tonal print'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black', hex: '#111111' }, { name: 'White', hex: '#FFFFFF' }],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.5,
    reviews: 61,
  },
  {
    id: 'tracksuit-002',
    name: 'Essential Set',
    category: 'Sets',
    price: 12000,
    priceFormatted: 'LKR 12,000',
    tag: '',
    image: '/product-tracksuit.jpg',
    heroImage: '/product-tracksuit.jpg',
    images: ['/product-tracksuit.jpg'],
    description: 'Everyday luxury made effortless. The Essential Set is our entry-level co-ord — all the quality of KDSL at an accessible price point.',
    details: ['Loopback cotton', 'Clean minimal design', 'Elastic waistband', 'Ribbed details', 'Regular fit jacket'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black', hex: '#111111' }, { name: 'Grey', hex: '#6B6B6B' }],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.4,
    reviews: 55,
  },
  {
    id: 'jacket-002',
    name: 'Urban Utility Jacket',
    category: 'Jackets',
    price: 18500,
    priceFormatted: 'LKR 18,500',
    tag: '',
    image: '/product-jacket.jpg',
    heroImage: '/product-jacket.jpg',
    images: ['/product-jacket.jpg'],
    description: 'Where function meets fashion. The Urban Utility Jacket brings premium technical fabrication into the streetwear space with a range of purposeful pockets and adjustable features.',
    details: ['Technical ripstop fabric', '6 utility pockets', 'Adjustable hood and hem', 'YKK zippers', 'Waterproof coating'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'Black', hex: '#111111' }, { name: 'Olive', hex: '#4A5240' }],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    rating: 4.7,
    reviews: 28,
  },
];

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getRelatedProducts = (id: string, category: string): Product[] =>
  products.filter((p) => p.id !== id && p.category === category).slice(0, 4);

// Billboard featured products (first 4)
export const billboardProducts = products.slice(0, 4);
