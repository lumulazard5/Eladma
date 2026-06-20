import React, { useState } from 'react';
import { Category, ProductFilters, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, ChevronDown, Star, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface CategoryBarProps {
  activeCategory: Category;
  onSelect: (category: Category) => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  products?: Product[];
  onOpenAdvancedSearch?: () => void;
}

const categories: Category[] = ['All', 'Artisanat', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Furniture', 'Automotive'];

export const CategoryBar: React.FC<CategoryBarProps> = ({ 
  activeCategory, 
  onSelect, 
  filters, 
  onFiltersChange,
  products = [],
  onOpenAdvancedSearch
}) => {
  const { t, translateCategory } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const uniqueSellers = ['All', ...Array.from(new Set(products.map(p => p.seller).filter(Boolean))) as string[]];

  const toggleFilter = (key: keyof ProductFilters) => {
    if (typeof filters[key] === 'boolean') {
      onFiltersChange({ ...filters, [key]: !filters[key] });
    }
  };

  const setMinRating = (rating: number) => {
    onFiltersChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating });
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 sticky top-16 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6 h-full overflow-x-auto no-scrollbar flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                haptics.light();
                sounds.click();
                onSelect(cat);
              }}
              className={`text-sm font-medium whitespace-nowrap relative h-full flex items-center transition-colors ${
                activeCategory === cat ? 'text-brand' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {translateCategory(cat)}
              {activeCategory === cat && (
                <motion.div 
                  layoutId="activeCategory"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative ml-4 flex items-center gap-2">
          {onOpenAdvancedSearch && (
            <button
              onClick={() => {
                haptics.heavy();
                sounds.success();
                onOpenAdvancedSearch();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500/10 to-brand/10 hover:from-orange-500/20 hover:to-brand/20 text-brand border border-brand/20 dark:border-brand/35 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap"
              title="Accéder aux filtres de recherche avancée"
            >
              <span>Recherche Avancée</span>
              <span className="text-[10px]">⚡</span>
            </button>
          )}
          <button 
            onClick={() => {
              haptics.medium();
              sounds.open();
              setIsFilterOpen(!isFilterOpen);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isFilterOpen 
                ? 'bg-brand text-white' 
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{t.catalog}</span>
            {(filters.localOnly || filters.certifiedOnly || filters.minRating > 0 || filters.seller !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-6 z-50"
                >
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Disponibilité</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium dark:text-zinc-200 group-hover:text-brand transition-colors">{t.localCraft}</span>
                          <div 
                            onClick={() => {
                              haptics.light();
                              sounds.select();
                              toggleFilter('localOnly');
                            }}
                            className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                              filters.localOnly ? 'bg-brand border-brand' : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {filters.localOnly && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium dark:text-zinc-200 group-hover:text-brand transition-colors">{t.certifiedSeller}</span>
                          <div 
                            onClick={() => {
                              haptics.light();
                              sounds.select();
                              toggleFilter('certifiedOnly');
                            }}
                            className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                              filters.certifiedOnly ? 'bg-brand border-brand' : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {filters.certifiedOnly && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Note minimale</h4>
                      <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((star) => (
                           <button
                             key={star}
                             onClick={() => {
                               haptics.light();
                               sounds.select();
                               setMinRating(star);
                             }}
                             className={`p-1 transition-all hover:scale-110 ${
                               filters.minRating >= star ? 'text-amber-400' : 'text-zinc-200 dark:text-zinc-700'
                             }`}
                           >
                             <Star className={`w-6 h-6 ${filters.minRating >= star ? 'fill-current' : ''}`} />
                           </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">{t.sellerLabel}</h4>
                      <select
                        value={filters.seller}
                        onChange={(e) => {
                          haptics.light();
                          sounds.click();
                          onFiltersChange({ ...filters, seller: e.target.value });
                        }}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        {uniqueSellers.map((seller) => (
                          <option key={seller} value={seller}>
                            {seller === 'All' ? t.allProducts : seller}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Prix Max: {formatPrice(filters.priceRange[1])}</h4>
                      <input 
                        type="range"
                        min="0"
                        max="1000"
                        step="50"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          haptics.light();
                          onFiltersChange({ ...filters, priceRange: [0, parseInt(e.target.value)] });
                        }}
                        className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        haptics.warning();
                        sounds.warning();
                        onFiltersChange({
                          priceRange: [0, 1000],
                          minRating: 0,
                          localOnly: false,
                          certifiedOnly: false,
                          seller: 'All'
                        });
                        setIsFilterOpen(false);
                      }}
                      className="w-full py-3 text-xs font-bold text-zinc-500 hover:text-brand transition-colors uppercase tracking-widest border-t border-zinc-50 dark:border-zinc-800 mt-2"
                    >
                      {t.resetFilters}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
