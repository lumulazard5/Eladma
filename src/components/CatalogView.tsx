import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, ProductFilters } from '../types';
import { ProductCard } from './ProductCard';
import { 
  ShoppingBag, 
  Search, 
  ChevronRight, 
  Grid, 
  List as ListIcon, 
  Star, 
  Heart, 
  Camera, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  History, 
  Trash2, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  FilterX,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

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

const CATEGORIES: Category[] = ['All', 'Artisanat', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Furniture', 'Automotive'];

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

  // Sorting State
  const [sortBy, setSortBy] = React.useState<'popular' | 'priceAsc' | 'priceDesc' | 'rating'>('popular');

  // Multi-level category menu visibility toggle (for mobile optimized drawer)
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Search history state persisted locally
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eladma-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dual Price Range temporary inputs
  const [priceMinInput, setPriceMinInput] = React.useState(String(filters.priceRange[0]));
  const [priceMaxInput, setPriceMaxInput] = React.useState(String(filters.priceRange[1]));

  // Sync temp inputs with real filter shifts (e.g. on reset)
  React.useEffect(() => {
    setPriceMinInput(String(filters.priceRange[0]));
    setPriceMaxInput(String(filters.priceRange[1]));
  }, [filters.priceRange]);

  // Extract dynamically unique values
  const uniqueSellers = React.useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.seller).filter(Boolean))) as string[]];
  }, [products]);

  const uniqueBrands = React.useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[]];
  }, [products]);

  // Handle saving search history
  const handleSaveSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecentSearches(prev => {
      const updated = [q, ...prev.filter(x => x !== q)].slice(0, 5);
      localStorage.setItem('eladma-recent-searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearSearches = () => {
    haptics.medium();
    sounds.select();
    localStorage.removeItem('eladma-recent-searches');
    setRecentSearches([]);
  };

  const handleApplyPrice = () => {
    const min = Math.max(0, parseInt(priceMinInput) || 0);
    const max = Math.max(min, parseInt(priceMaxInput) || 1000);
    haptics.medium();
    onFiltersChange({
      ...filters,
      priceRange: [min, max]
    });
  };

  const resetAllFilters = () => {
    haptics.heavy();
    sounds.success();
    onFiltersChange({
      priceRange: [0, 1000],
      minRating: 0,
      localOnly: false,
      certifiedOnly: false,
      seller: 'All',
      brand: 'All',
      favoritesOnly: false
    });
    onSearchQueryChange('');
    onSelectCategory('All');
  };

  // Helper counters for real-time counts across options
  const getCategoryCount = (cat: Category) => {
    return products.filter(p => {
      const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
      const matchesRating = p.rating >= filters.minRating;
      const matchesLocal = !filters.localOnly || p.isLocal;
      const matchesCertified = !filters.certifiedOnly || p.isCertified;
      const matchesSeller = filters.seller === 'All' || p.seller === filters.seller;
      const matchesBrand = !filters.brand || filters.brand === 'All' || p.brand === filters.brand;
      return matchesPrice && matchesRating && matchesLocal && matchesCertified && matchesSeller && matchesBrand && (cat === 'All' || p.category === cat);
    }).length;
  };

  const getBrandCount = (brand: string) => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
      const matchesRating = p.rating >= filters.minRating;
      const matchesLocal = !filters.localOnly || p.isLocal;
      const matchesCertified = !filters.certifiedOnly || p.isCertified;
      const matchesSeller = filters.seller === 'All' || p.seller === filters.seller;
      return matchesCategory && matchesPrice && matchesRating && matchesLocal && matchesCertified && matchesSeller && (brand === 'All' || p.brand === brand);
    }).length;
  };

  const getRatingCount = (stars: number) => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
      const matchesLocal = !filters.localOnly || p.isLocal;
      const matchesCertified = !filters.certifiedOnly || p.isCertified;
      const matchesSeller = filters.seller === 'All' || p.seller === filters.seller;
      const matchesBrand = !filters.brand || filters.brand === 'All' || p.brand === filters.brand;
      return matchesCategory && matchesPrice && matchesLocal && matchesCertified && matchesSeller && matchesBrand && p.rating >= stars;
    }).length;
  };

  // Sorting algorithm executed on the current collection
  const sortedProducts = React.useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'priceAsc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'priceDesc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    return list; // Relevance score / default order
  }, [filteredProducts, sortBy]);

  // Compute Active Filters list for instant microtag deletion
  const activeTags = React.useMemo(() => {
    const tags: Array<{ id: string; label: string; clear: () => void }> = [];

    if (activeCategory !== 'All') {
      tags.push({
        id: 'category',
        label: `Catégorie: ${translateCategory(activeCategory)}`,
        clear: () => { haptics.light(); onSelectCategory('All'); }
      });
    }

    if (searchQuery.trim()) {
      tags.push({
        id: 'search',
        label: `Recherche: "${searchQuery}"`,
        clear: () => { haptics.light(); onSearchQueryChange(''); }
      });
    }

    if (filters.brand && filters.brand !== 'All') {
      tags.push({
        id: 'brand',
        label: `Marque: ${filters.brand}`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, brand: 'All' }); }
      });
    }

    if (filters.seller !== 'All') {
      tags.push({
        id: 'seller',
        label: `Vendeur: ${filters.seller}`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, seller: 'All' }); }
      });
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      tags.push({
        id: 'price',
        label: `Budget: ${formatPrice(filters.priceRange[0])} - ${formatPrice(filters.priceRange[1])}`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, priceRange: [0, 1000] }); }
      });
    }

    if (filters.minRating > 0) {
      tags.push({
        id: 'rating',
        label: `Étoiles: ≥ ${filters.minRating}★`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, minRating: 0 }); }
      });
    }

    if (filters.localOnly) {
      tags.push({
        id: 'local',
        label: `Haut Local Kasaïen`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, localOnly: false }); }
      });
    }

    if (filters.certifiedOnly) {
      tags.push({
        id: 'certified',
        label: `Certifié Conforme`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, certifiedOnly: false }); }
      });
    }

    if (filters.favoritesOnly) {
      tags.push({
        id: 'favorites',
        label: `Favoris uniquement`,
        clear: () => { haptics.light(); onFiltersChange({ ...filters, favoritesOnly: false }); }
      });
    }

    return tags;
  }, [activeCategory, searchQuery, filters, formatPrice, translateCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header Banner */}
      <div className="mb-8 p-6 md:p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between overflow-hidden relative">
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <span className="text-[10px] bg-brand/10 text-brand font-black px-2.5 py-1 rounded-full uppercase tracking-widest inline-block select-none mb-1">
            Recherche Avancée Eladma
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Découvrez sans limites
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
            Trouvez les objets d'art, électroniques ou pièces certifiées en RDC avec notre algorithme de recherche phonétique et linguistique.
          </p>
        </div>
        
        {/* Real system indicator */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800 relative z-10 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <p className="font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest text-[9px]">Sovereign Server Live</p>
            <p className="text-[10px] text-zinc-400 font-medium">Requêtes traitées en temps réel</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Drawer / Sidebar Box */}
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
          
          {/* Main Intelligent Search Control */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Saisie intelligente</h3>
              <Sparkles className="w-4 h-4 text-brand animate-bounce" />
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSearch(searchQuery);
                    haptics.heavy();
                  }
                }}
                onChange={(e) => {
                  haptics.light();
                  onSearchQueryChange(e.target.value);
                }}
                className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => { haptics.heavy(); onOpenImageSearch?.(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-brand transition-colors p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                title="Déclencher une recherche par IA visuelle"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Recent Searches Subsystem */}
            {recentSearches.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase font-black tracking-wider">
                  <span className="flex items-center gap-1"><History className="w-3 h-3" /> Historique</span>
                  <button 
                    onClick={handleClearSearches}
                    className="hover:text-red-500 transition-colors inline-flex items-center gap-0.5"
                    title="Vider l'historique"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {recentSearches.map((queryText, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        haptics.medium();
                        sounds.click();
                        onSearchQueryChange(queryText);
                      }}
                      className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border dark:border-zinc-800 text-[10px] font-semibold rounded-lg text-zinc-600 dark:text-zinc-300 transition-all truncate max-w-[120px]"
                    >
                      {queryText}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Multi-level Categories */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-md space-y-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2">{t.categories}</h3>
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => {
                const count = getCategoryCount(cat);
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      haptics.medium();
                      sounds.select();
                      onSelectCategory(cat);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                      isSelected 
                        ? 'bg-brand text-white shadow-lg shadow-brand/25' 
                        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 dark:text-zinc-450'
                    }`}
                  >
                    <span className="truncate">{translateCategory(cat)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Advanced Multi-parameter Filter System */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-md space-y-6">
            <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-3">
              <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand" /> Paramètres avancés
              </span>
              <button 
                onClick={resetAllFilters} 
                className="text-[10px] text-zinc-400 hover:text-brand font-black uppercase tracking-wider"
              >
                Réinitialiser
              </button>
            </div>

            {/* Exact Dual Price Range Controller */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Gamme de Prix (USD)</span>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold block uppercase">Minimum</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={priceMinInput}
                      onChange={(e) => setPriceMinInput(e.target.value)}
                      onBlur={handleApplyPrice}
                      className="w-full pl-6 pr-2 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-lg text-zinc-800 dark:text-zinc-100 placeholder-zinc-450"
                      placeholder="0"
                    />
                    <span className="text-[10px] font-black text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2">$</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 font-bold block uppercase">Maximum</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={priceMaxInput}
                      onChange={(e) => setPriceMaxInput(e.target.value)}
                      onBlur={handleApplyPrice}
                      className="w-full pl-6 pr-2 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-lg text-zinc-800 dark:text-zinc-100 placeholder-zinc-450"
                      placeholder="1000"
                    />
                    <span className="text-[10px] font-black text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2">$</span>
                  </div>
                </div>
              </div>

              {/* Range Selector slider */}
              <input 
                type="range"
                min="0"
                max="1000"
                step="25"
                value={filters.priceRange[1]}
                onChange={(e) => {
                  const maxVal = parseInt(e.target.value);
                  setPriceMaxInput(String(maxVal));
                  onFiltersChange({ ...filters, priceRange: [filters.priceRange[0], maxVal] });
                }}
                className="w-full h-1 bg-zinc-150 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-brand"
              />

              {/* Fast presets buttons */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPriceMinInput("0");
                    setPriceMaxInput("50");
                    onFiltersChange({ ...filters, priceRange: [0, 50] });
                  }}
                  className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-[9px] font-black text-zinc-500 dark:text-zinc-400 border dark:border-zinc-800 rounded"
                >
                  &lt; 50$
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceMinInput("50");
                    setPriceMaxInput("250");
                    onFiltersChange({ ...filters, priceRange: [50, 250] });
                  }}
                  className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-[9px] font-black text-zinc-500 dark:text-zinc-400 border dark:border-zinc-800 rounded"
                >
                  50$ - 250$
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceMinInput("250");
                    setPriceMaxInput("1000");
                    onFiltersChange({ ...filters, priceRange: [250, 1000] });
                  }}
                  className="px-2 py-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 text-[9px] font-black text-zinc-500 dark:text-zinc-400 border dark:border-zinc-800 rounded"
                >
                  &gt; 250$
                </button>
              </div>
            </div>

            {/* Brands Dynamic Filtering */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Sélection de Marque</span>
              <select
                value={filters.brand || 'All'}
                onChange={(e) => {
                  haptics.light();
                  onFiltersChange({ ...filters, brand: e.target.value });
                }}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
              >
                {uniqueBrands.map((brand) => {
                  const count = getBrandCount(brand);
                  return (
                    <option key={brand} value={brand}>
                      {brand === 'All' ? 'Toutes les marques' : `${brand} (${count})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Merchant / Seller Filter */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">{t.sellerLabel}</span>
              <select
                value={filters.seller}
                onChange={(e) => {
                  haptics.light();
                  onFiltersChange({ ...filters, seller: e.target.value });
                }}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
              >
                {uniqueSellers.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller === 'All' ? 'Tous les vendeurs' : seller}
                  </option>
                ))}
              </select>
            </div>

            {/* Ratings stars interactive filter */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">Avis Clients</span>
              
              <div className="space-y-1.5">
                {[5, 4, 3].map((stars) => {
                  const count = getRatingCount(stars);
                  const isSelected = filters.minRating === stars;
                  return (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => {
                        haptics.light();
                        onFiltersChange({ ...filters, minRating: isSelected ? 0 : stars });
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-semibold transition-all ${
                        isSelected 
                          ? 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/25'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-650 dark:text-zinc-450 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-15">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < stars ? 'fill-current' : 'text-zinc-250 dark:text-zinc-700'}`} 
                            />
                          ))}
                        </div>
                        <span className="font-bold ml-1.5">{stars}.0 &amp; plus</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Solid Local Toggles / Origin Checks */}
            <div className="space-y-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition-colors">{t.localCraft}</span>
                <input 
                  type="checkbox"
                  checked={filters.localOnly}
                  onChange={() => {
                    haptics.light();
                    onFiltersChange({ ...filters, localOnly: !filters.localOnly });
                  }}
                  className="rounded text-brand focus:ring-brand w-4 h-4 border-zinc-300 cursor-pointer"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-brand transition-colors">{t.certifiedSeller}</span>
                <input 
                  type="checkbox"
                  checked={filters.certifiedOnly}
                  onChange={() => {
                    haptics.light();
                    onFiltersChange({ ...filters, certifiedOnly: !filters.certifiedOnly });
                  }}
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
                  onChange={() => {
                    haptics.light();
                    onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
                  }}
                  className="rounded text-brand focus:ring-brand w-4 h-4 border-zinc-300 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Main Products catalog core */}
        <main className="flex-1 space-y-6">
          
          {/* Sorting / Catalog Information bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand/10 text-brand select-none">
                  <Tag className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-black dark:text-white">
                  {activeCategory === 'All' ? translateCategory('All') : translateCategory(activeCategory)}
                </h2>
              </div>
              <p className="text-zinc-500 text-xs font-medium mt-1">
                {sortedProducts.length} {sortedProducts.length > 1 ? 'produits correspondants' : 'produit correspondant'}
              </p>
            </div>
            
            {/* Real Sorting feature */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Trier par</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  haptics.light();
                  setSortBy(e.target.value as any);
                }}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-extrabold text-zinc-700 dark:text-zinc-200 cursor-pointer outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="popular">Score de Pertinence</option>
                <option value="priceAsc">Prix : Croissant</option>
                <option value="priceDesc">Prix : Décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
          </header>

          {/* Active Filter Badges Grid with individual Cancel actions */}
          {activeTags.length > 0 && (
            <div className="bg-zinc-100/50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mr-1">Filtres Actifs:</span>
              <AnimatePresence>
                {activeTags.map((tag) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-zinc-900 text-[10px] font-black text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-lg group hover:border-brand dark:hover:border-brand/40 transition-colors shadow-sm"
                  >
                    <span>{tag.label}</span>
                    <button 
                      onClick={tag.clear}
                      className="text-zinc-400 group-hover:text-brand rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 p-0.5 transition-all text-xs"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                onClick={resetAllFilters}
                className="text-[10px] text-red-500 hover:text-red-700 font-extrabold flex items-center gap-1 ml-auto shrink-0 transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}

          {/* Catalog grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
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
            <div className="flex flex-col items-center justify-center py-24 text-center bg-zinc-50/70 dark:bg-zinc-900/30 rounded-[2.5rem] border border-zinc-150 dark:border-zinc-800/65 p-6">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                 <FilterX className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">{t.noProductsFound}</h3>
              <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed mb-6">
                Désolé, nous n'avons trouvé aucun produit correspondant à vos filtres complexes ou mot-clé de recherche actuels.
              </p>
              <button 
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all shadow-md shadow-brand/15"
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
