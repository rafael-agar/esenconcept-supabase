import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import { Filter, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Shop() {
  const { products, categories } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlySale, setShowOnlySale] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [sortOption, setSortOption] = useState<string>('default');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const filterParam = searchParams.get('filter');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }

    if (filterParam === 'sale') {
      setShowOnlySale(true);
    } else {
      setShowOnlySale(false);
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    const newParams: any = {};
    if (category) newParams.category = category;
    if (showOnlySale) newParams.filter = 'sale';
    setSearchParams(newParams);
  };

  const handleSaleToggle = () => {
    const nextSaleState = !showOnlySale;
    setShowOnlySale(nextSaleState);
    
    const newParams: any = {};
    if (selectedCategory) newParams.category = selectedCategory;
    if (nextSaleState) newParams.filter = 'sale';
    setSearchParams(newParams);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    const searchParam = searchParams.get('search');

    // Filter by Search
    if (searchParam) {
        const query = searchParam.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by Sale (OFERTA label or has sale price)
    if (showOnlySale) {
      result = result.filter(p => p.isSale || (p.salePrice !== undefined && p.salePrice > 0));
    }

    // Filter by Price
    result = result.filter(p => {
      const effectivePrice = (p.isSale && p.salePrice) ? p.salePrice : p.price;
      return effectivePrice >= priceRange.min && effectivePrice <= priceRange.max;
    });

    // Sort
    if (sortOption === 'price-asc') {
      result.sort((a, b) => {
        const priceA = (a.isSale && a.salePrice) ? a.salePrice : a.price;
        const priceB = (b.isSale && b.salePrice) ? b.salePrice : b.price;
        return priceA - priceB;
      });
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => {
        const priceA = (a.isSale && a.salePrice) ? a.salePrice : a.price;
        const priceB = (b.isSale && b.salePrice) ? b.salePrice : b.price;
        return priceB - priceA;
      });
    } else if (sortOption === 'newest') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return result;
  }, [products, searchParams, selectedCategory, showOnlySale, priceRange, sortOption]);

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold mb-4">Tienda</h1>
        <div className="w-12 h-0.5 bg-black mx-auto"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Mobile Filter Toggle */}
        <button 
          className="lg:hidden flex items-center justify-center gap-2 border border-black py-3 px-4 uppercase text-sm font-bold tracking-widest hover:bg-black hover:text-white transition-colors"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        >
          <Filter size={16} /> Filtros
        </button>

        {/* Sidebar Filters */}
        <aside className={`lg:w-1/4 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 space-y-8">
            {/* Categories */}
            <div>
              <h3 className="font-bold uppercase tracking-widest mb-4 text-sm border-b border-gray-200 pb-2">Cápsulas</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => handleCategoryChange(null)}
                    className={`text-sm hover:text-black transition-colors ${selectedCategory === null ? 'text-black font-bold' : 'text-gray-500'}`}
                  >
                    Ver Todo
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`text-sm hover:text-black transition-colors ${selectedCategory === cat.name ? 'text-black font-bold' : 'text-gray-500'}`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Special Filters */}
            <div>
              <h3 className="font-bold uppercase tracking-widest mb-4 text-sm border-b border-gray-200 pb-2">Ofertas</h3>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="sale-filter"
                  checked={showOnlySale}
                  onChange={handleSaleToggle}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <label htmlFor="sale-filter" className="text-sm cursor-pointer select-none">
                  Solo en Rebaja
                </label>
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-bold uppercase tracking-widest mb-4 text-sm border-b border-gray-200 pb-2">Precio</h3>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-bold uppercase tracking-widest mb-4 text-sm border-b border-gray-200 pb-2">Ordenar</h3>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 p-2 text-sm focus:outline-none focus:border-black bg-white"
              >
                <option value="default">Destacados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="newest">Lo Nuevo</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:w-3/4">
          <div className="mb-6 text-sm text-gray-500">
            Mostrando {filteredProducts.length} productos
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              No se encontraron productos con estos filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
