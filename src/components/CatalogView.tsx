import React from 'react';
import { motion } from 'motion/react';
import { Product, Category, ProductFilters } from '../types';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Search, ChevronRight, Grid, List as ListIcon, Star, Heart, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';

interface CatalogViewProps {
  products: Product[];
  filteredProducts: Product[];
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onOpenDetails: (p: Product) => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenImageSearch?: () => void;
}

const CATEGORIES: Category[] = ['All', 'Artisanat', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

export const CatalogView: React.FC<CatalogViewProps> = ({ 
  products,
  filteredProducts,
  activeCategory, 
  onSelectCategory,
  onAddToCart,
  onBuyNow,
  onOpenDetails,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchQueryChange,
  onOpenImageSearch
}) => {
  const { t, translateCategory } = useLanguage();
  const { formatPrice } = useCurrency();
  // Extract unique sellers from loaded products dynamically
  const uniqueSellers = ['All', ...Array.from(new Set(products.map(p => p.seller).filter(Boolean))) as string[]];

  const resetAllFilters = () => {
    onFiltersChange({
      priceRange: [0, 1000],
      minRating: 0,
      localOnly: false,
      certifiedOnly: false,
      seller: 'All',
      favoritesOnly: false
    });
    onSearchQueryChange('');
    onSelectCategory('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation & Search & Filters */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          {/* Keyword Search */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">{t.searchPlaceholder.split('...')[0]}</h3>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  haptics.light();
                  onSearchQueryChange(e.target.value);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-950 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => { haptics.heavy(); onOpenImageSearch?.(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand transition-colors p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850"
                title="Recherche par image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 px-2">{t.categories}</h3>
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <span>{translateCategory(cat)}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeCategory === cat ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </nav>
          </div>

          {/* Advanced Filter Box */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-6 shadow-sm">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{t.catalog}</h3>
            
            {/* Seller Filter */}
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-2">{t.sellerLabel}</span>
              <select
                value={filters.seller}
                onChange={(e) => onFiltersChange({ ...filters, seller: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-bold dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
              >
                {uniqueSellers.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller === 'All' ? t.allProducts : seller}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Prix Maximum</span>
                <span className="text-xs font-bold text-brand">{formatPrice(filters.priceRange[1])}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1000"
                step="25"
                value={filters.priceRange[1]}
                onChange={(e) => onFiltersChange({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>{formatPrice(0)}</span>
                <span>{formatPrice(1000)}</span>
              </div>
            </div>

            {/* Rating Filter range */}
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-2">Note minimale</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, minRating: filters.minRating === star ? 0 : star })}
                    className="p-1 transition-all hover:scale-125 focus:outline-none"
                    title={`Filtrer par note >= ${star} étoiles`}
                  >
                    <Star className={`w-5 h-5 ${
                      filters.minRating >= star ? 'text-amber-400 fill-current' : 'text-zinc-300 dark:text-zinc-700'
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Origin Toggles */}
            <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition-colors">{t.localCraft}</span>
                <input 
                  type="checkbox"
                  checked={filters.localOnly}
                  onChange={() => onFiltersChange({ ...filters, localOnly: !filters.localOnly })}
                  className="rounded text-brand focus:ring-brand w-4 h-4 border-zinc-300 cursor-pointer"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition-colors">{t.certifiedSeller}</span>
                <input 
                  type="checkbox"
                  checked={filters.certifiedOnly}
                  onChange={() => onFiltersChange({ ...filters, certifiedOnly: !filters.certifiedOnly })}
                  className="rounded text-brand focus:ring-brand w-4 h-4 border-zinc-300 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition-colors flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  Mes Favoris
                </span>
                <input 
                  type="checkbox"
                  checked={!!filters.favoritesOnly}
                  onChange={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                  className="rounded text-brand focus:ring-brand w-4 h-4 border-zinc-300 cursor-pointer"
                />
              </label>
            </div>

            {/* Reset Filter Button */}
            <button
              onClick={resetAllFilters}
              className="w-full py-3 bg-zinc-200 dark:bg-zinc-800 font-bold text-xs text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-brand hover:text-white dark:hover:bg-brand dark:hover:text-white transition-all uppercase tracking-widest shadow-sm"
            >
              {t.resetFilters}
            </button>
          </div>

          <div className="p-6 bg-gradient-to-br from-brand to-brand-dark rounded-[2rem] text-white overflow-hidden relative group shadow-lg shadow-brand/10">
            <div className="relative z-10">
              <h4 className="font-bold mb-2">{t.localCraft}</h4>
              <p className="text-xs text-white/80 mb-4 leading-relaxed">
                Abatandimi na bamilimo ya kisanii. Chaque achat autonome développe l'économie locale.
              </p>
              <button 
                onClick={() => {
                  onSelectCategory('Artisanat');
                  onFiltersChange({ ...filters, localOnly: true });
                }}
                className="w-full py-2 bg-white text-zinc-900 rounded-xl text-xs font-bold hover:scale-105 transition-transform"
              >
                Explorer la collection
              </button>
            </div>
            <ShoppingBag className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black dark:text-white">
                {activeCategory === 'All' ? translateCategory('All') : translateCategory(activeCategory)}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                {filteredProducts.length} {filteredProducts.length > 1 ? 'produits correspondants' : 'produit correspondant'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
               <button className="p-2 bg-white dark:bg-zinc-800 text-brand rounded-lg shadow-sm">
                  <Grid className="w-4 h-4" />
               </button>
               <button className="p-2 text-zinc-400 hover:text-zinc-600">
                  <ListIcon className="w-4 h-4" />
               </button>
            </div>
          </header>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <ProductCard 
                    product={product}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    onOpenDetails={onOpenDetails}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 p-6">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                 <Search className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">{t.noProductsFound}</h3>
              <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
                Désolé, nous n'avons trouvé aucun produit correspondant à vos filtres ou mot-clé de recherche actuels.
              </p>
              <button 
                onClick={resetAllFilters}
                className="mt-6 px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all shadow-md shadow-brand/10"
              >
                {t.resetFilters}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
