export interface ProductVariant {
  id: string;
  productId: string;
  color: string;      // Nombre del color (ej: "Rojo")
  colorCode: string;  // Código Hex (ej: "#FF0000")
  size: string;       // Nombre de la talla (ej: "M")
  stock: number;
  price?: number;
  sku?: string;
  imageUrl?: string;
}

export interface Size {
  id: string;
  name: string;
  order: number;
}

export interface BundleItem {
  productId: string;
  variantId?: string; // Optional: if they want to bundle a specific variant
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  longDescription?: string;
  careInstructions?: string;
  price: number;
  salePrice?: number;
  stock?: number;
  image: string;
  images: string[];
  category: string;
  categoryId?: string;
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  variants?: ProductVariant[];
  isBundle?: boolean;
  bundleItems?: BundleItem[];
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

export const products: Product[] = [];
export const categories: Category[] = [];
