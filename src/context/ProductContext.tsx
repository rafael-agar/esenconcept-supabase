import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, Size } from '../data/products';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  sizes: Size[];
  isLoading: boolean;
  refreshProducts: () => Promise<void>;
  updateProduct: (updatedProduct: Product, imageFile?: File, additionalImages?: File[]) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>, imageFile?: File, additionalImages?: File[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  addSize: (name: string, orderIndex: number) => Promise<void>;
  updateSize: (id: string, name: string, orderIndex: number) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>, imageFile?: File) => Promise<void>;
  updateCategory: (category: Category, imageFile?: File) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Starting robust fetchData...');
      
      // 1. Fetch Categories
      const { data: catsData, error: catsError } = await supabase
        .from('categories')
        .select('*')
        .range(0, 999);
      
      if (catsError) {
        console.error('Categories Fetch Error:', catsError);
      }
      const categoriesList = catsData || [];
      setCategories(categoriesList.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image_url
      })));

      // 2. Fetch Sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('sizes')
        .select('*')
        .order('order_index', { ascending: true })
        .range(0, 999);
      
      if (sizesError) {
        console.error('Sizes Fetch Error:', sizesError);
      }
      setSizes((sizesData || []).map(s => ({
        id: s.id,
        name: s.name,
        orderIndex: s.order_index
      })));

      // 3. Fetch Products
      const { data: prodsData, error: prodsError } = await supabase
        .from('products')
        .select('*')
        .range(0, 9999);

      if (prodsError) {
        console.error('Products Fetch Error:', prodsError);
        throw prodsError;
      }

      // 4. Fetch Variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .range(0, 9999);
      
      if (variantsError) {
        console.error('Variants Fetch Error:', variantsError);
      }

      // 5. Fetch Additional Images
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .range(0, 9999);
      
      if (imagesError) {
        console.error('Images Fetch Error:', imagesError);
      }

      console.log(`Fetched: ${prodsData?.length} products, ${variantsData?.length} variants, ${imagesData?.length} images`);

      const formattedProducts = (prodsData || []).map(p => {
        const productVariants = (variantsData || []).filter(v => v.product_id === p.id);
        const productImages = (imagesData || []).filter(img => img.product_id === p.id);
        const category = categoriesList.find(c => c.id === p.category_id);

        // Calculate total stock from variants if they exist
        const totalVariantStock = productVariants.length > 0 
          ? productVariants.reduce((sum, v) => sum + (v.stock || 0), 0) 
          : p.stock;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          stock: totalVariantStock,
          image: p.image_url || 'https://via.placeholder.com/400',
          images: productImages.sort((a, b) => a.order_index - b.order_index).map(img => img.image_url),
          category: category?.name || 'Sin categoría',
          categoryId: p.category_id,
          isNew: !!p.is_new,
          isSale: !!p.is_sale,
          salePrice: p.sale_price ? Number(p.sale_price) : undefined,
          isFeatured: !!p.is_featured,
          isActive: p.is_active !== false,
          variants: productVariants.map(v => ({
            id: v.id,
            productId: v.product_id,
            color: v.color,
            colorCode: v.color_code,
            size: v.size,
            stock: v.stock,
            price: v.price ? Number(v.price) : undefined,
            sku: v.sku,
            imageUrl: v.image_url
          }))
        };
      });

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error in robust fetchData:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>, imageFile?: File, additionalImages?: File[]) => {
    try {
      let imageUrl = product.image;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Calculate total stock if variants exist
      const calculatedStock = product.variants && product.variants.length > 0
        ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : (product.stock || 0);

      // 1. Insert product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          slug: slug,
          description: product.description,
          price: product.price,
          stock: calculatedStock,
          image_url: imageUrl,
          category_id: product.categoryId || null,
          is_featured: product.isFeatured || false,
          is_new: product.isNew || false,
          is_sale: product.isSale || false,
          sale_price: product.salePrice || null,
          is_active: true
        }])
        .select()
        .single();

      if (productError) throw productError;

      // 2. Insert additional images if any
      if (additionalImages && additionalImages.length > 0) {
        const uploadPromises = additionalImages.map(file => uploadImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        const validUrls = uploadedUrls.filter(url => url !== null) as string[];

        if (validUrls.length > 0) {
          const imagesToInsert = validUrls.map((url, index) => ({
            product_id: productData.id,
            image_url: url,
            order_index: index
          }));

          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imagesToInsert);

          if (imagesError) throw imagesError;
        }
      }

      // 3. Insert variants if any
      if (product.variants && product.variants.length > 0) {
        const variantsToInsert = product.variants.map(v => ({
          product_id: productData.id,
          color: v.color,
          color_code: v.colorCode,
          size: v.size,
          stock: v.stock,
          price: v.price || null,
          sku: v.sku || null,
          image_url: v.imageUrl || null
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      await fetchData(); // Refresh list
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (updatedProduct: Product, imageFile?: File, additionalImages?: File[]) => {
    try {
      let imageUrl = updatedProduct.image;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      // Calculate total stock if variants exist
      const calculatedStock = updatedProduct.variants && updatedProduct.variants.length > 0
        ? updatedProduct.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : updatedProduct.stock;

      // 1. Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          price: updatedProduct.price,
          sale_price: updatedProduct.salePrice || null,
          is_sale: updatedProduct.isSale || false,
          is_new: updatedProduct.isNew || false,
          stock: calculatedStock,
          is_featured: updatedProduct.isFeatured,
          is_active: updatedProduct.isActive !== false,
          description: updatedProduct.description,
          category_id: updatedProduct.categoryId,
          image_url: imageUrl
        })
        .eq('id', updatedProduct.id);

      if (productError) throw productError;

      // 2. Handle additional images
      // If additionalImages is provided, we replace all additional images
      if (additionalImages) {
        // Delete existing additional images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', updatedProduct.id);

        // Upload and insert new ones
        if (additionalImages.length > 0) {
          const uploadPromises = additionalImages.map(file => uploadImage(file));
          const uploadedUrls = await Promise.all(uploadPromises);
          const validUrls = uploadedUrls.filter(url => url !== null) as string[];

          if (validUrls.length > 0) {
            const imagesToInsert = validUrls.map((url, index) => ({
              product_id: updatedProduct.id,
              image_url: url,
              order_index: index
            }));

            const { error: imagesError } = await supabase
              .from('product_images')
              .insert(imagesToInsert);

            if (imagesError) throw imagesError;
          }
        }
      } else if (updatedProduct.images) {
        // If no new files but images array is provided, we might want to sync order/removals
        // For now, if images is provided, we assume it's the current set of URLs
        // This part is tricky because some might be existing URLs and some might be new
        // For simplicity, we'll only replace if additionalImages (Files) are provided
      }

      // 3. Handle variants
      // For simplicity in this step, we'll delete and re-insert if variants are provided
      if (updatedProduct.variants) {
        // Delete existing variants
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', updatedProduct.id);

        // Insert new variants
        if (updatedProduct.variants.length > 0) {
          const variantsToInsert = updatedProduct.variants.map(v => ({
            product_id: updatedProduct.id,
            color: v.color,
            color_code: v.colorCode,
            size: v.size,
            stock: v.stock,
            price: v.price || null,
            sku: v.sku || null,
            image_url: v.imageUrl || null
          }));

          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);

          if (variantsError) throw variantsError;
        }
      }
      
      await fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteFileFromStorage = async (url: string) => {
    try {
      if (!url) return;
      const parts = url.split('/product-images/');
      if (parts.length < 2) return;
      const path = parts[1];
      await supabase.storage.from('product-images').remove([path]);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      // 1. Get product data to find images
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching product for deletion:', fetchError);
      }

      // 2. Get additional images
      const { data: additionalImages } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', id);

      // 3. Get variant images
      const { data: variantImages } = await supabase
        .from('product_variants')
        .select('image_url')
        .eq('product_id', id);

      // 4. Delete all images from storage
      const imagesToDelete = [
        product?.image_url,
        ...(additionalImages?.map(img => img.image_url) || []),
        ...(variantImages?.map(v => v.image_url) || [])
      ].filter(Boolean) as string[];

      // Execute deletions in parallel
      await Promise.all(imagesToDelete.map(url => deleteFileFromStorage(url)));

      // 5. Hard delete product (Cascades to variants and product_images)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addSize = async (name: string, orderIndex: number) => {
    try {
      const { error } = await supabase
        .from('sizes')
        .insert([{ name, order_index: orderIndex }]);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding size:', error);
      throw error;
    }
  };

  const updateSize = async (id: string, name: string, orderIndex: number) => {
    try {
      const { error } = await supabase
        .from('sizes')
        .update({ name, order_index: orderIndex })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating size:', error);
      throw error;
    }
  };

  const deleteSize = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sizes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting size:', error);
      throw error;
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>, imageFile?: File) => {
    try {
      let imageUrl = category.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          slug: slug,
          description: category.description,
          image_url: imageUrl
        }]);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category, imageFile?: File) => {
    try {
      let imageUrl = category.image;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          slug: slug,
          description: category.description,
          image_url: imageUrl
        })
        .eq('id', category.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // 1. Get category data to find image
      const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching category for deletion:', fetchError);
      }

      // 2. Delete image from storage
      if (category?.image_url) {
        await deleteFileFromStorage(category.image_url);
      }

      // 3. Delete category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      categories, 
      sizes,
      isLoading, 
      refreshProducts: fetchData,
      updateProduct,
      addProduct,
      deleteProduct,
      uploadImage,
      addSize,
      updateSize,
      deleteSize,
      addCategory,
      updateCategory,
      deleteCategory
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
