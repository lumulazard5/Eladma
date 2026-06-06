import React, { useState } from 'react';
import { Star, ShoppingCart, Plus, Zap, ShieldCheck, Heart, Bell, GitCompare } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePriceTracker } from '../context/PriceTrackerContext';
import { useCompare } from '../context/CompareContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onBuyNow, onOpenDetails }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isTracking, toggleTracking } = usePriceTracker();
  const { addToCompare, isComparing } = useCompare();
  const [imageLoaded, setImageLoaded] = useState(false);

  const isFav = isFavorite(product.id);
  const isTracked = isTracking(product.id);
  const isComp = isComparing(product.id);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.5)] hover:border-brand/20 dark:hover:border-brand/30 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden relative bg-zinc-100 dark:bg-zinc-800" onClick={() => onOpenDetails(product)}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 animate-pulse flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-700 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <img 
          src={product.image} 
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
        />
        {product.isLocal && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 z-10">
            <Zap className="w-2.5 h-2.5 fill-current" />
            {t.localCraft.toUpperCase()}
          </div>
        )}
        
        {/* Heart button for Favorites with LocalStorage support */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptics.light();
            sounds.select();
            toggleFavorite(product.id, product.name);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-zinc-100/10 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-zinc-400 dark:text-zinc-500 hover:text-red-500"
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={`w-4 h-4 transition-transform ${isFav ? 'fill-red-500 text-red-500 scale-110' : 'hover:scale-110'}`} />
        </button>

        {/* Bell button for Price Tracking */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTracking(product.id, product.name);
          }}
          className={`absolute top-11 right-2 z-10 w-8 h-8 rounded-full shadow-lg border backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all
            ${isTracked 
              ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-500' 
              : 'bg-white/95 dark:bg-zinc-900/95 border-zinc-100/10 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-amber-500'
            }`}
          title={isTracked ? "Annuler le suivi du prix" : "Suivre les baisses de prix"}
        >
          <Bell className={`w-4 h-4 transition-transform ${isTracked ? 'fill-amber-500 text-amber-500 scale-110' : 'hover:scale-110'}`} />
        </button>

        {/* Compare button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptics.light();
            sounds.select();
            addToCompare(product);
          }}
          className={`absolute top-20 right-2 z-10 w-8 h-8 rounded-full shadow-lg border backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all
            ${isComp 
              ? 'bg-brand/10 dark:bg-brand/20 border-brand/35 text-brand shadow-sm ring-1 ring-brand/20' 
              : 'bg-white/95 dark:bg-zinc-900/95 border-zinc-100/10 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-brand'
            }`}
          title={isComp ? "Retirer du comparateur" : "Comparer ce produit (max 3)"}
        >
          <GitCompare className={`w-4 h-4 transition-transform ${isComp ? 'text-brand rotate-180 scale-110' : 'hover:scale-110'}`} />
        </button>

        {product.isCertified && (
          <div className="absolute top-2 right-12 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-zinc-100/10 dark:border-zinc-800 flex items-center justify-center" title={`Vendeur Certifié - Score: ${product.sellerTrustScore}%`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            {product.sellerTrustScore && product.sellerTrustScore > 95 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              haptics.success();
              sounds.success();
              onAddToCart(product); 
            }}
            className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg text-brand hover:bg-brand hover:text-white transition-all scale-90 hover:scale-100"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              haptics.heavy();
              sounds.success();
              onBuyNow(product); 
            }}
            className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-all"
          >
            <Zap className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
      
      <div 
        className="p-4" 
        onClick={() => {
          haptics.light();
          sounds.open();
          onOpenDetails(product);
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs text-amber-500 cursor-pointer">
            <Star className="w-3 h-3 fill-current" />
            <span className="font-medium">{product.rating}</span>
            <span className="text-zinc-400 dark:text-zinc-500">({product.reviewCount})</span>
          </div>
          {product.seller && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-0.5 rounded-full font-semibold truncate max-w-[120px]" title={product.seller}>
              {product.seller}
            </span>
          )}
        </div>
        
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1 group-hover:text-brand transition-colors cursor-pointer">
          {product.name}
        </h3>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 h-8">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatPrice(product.price)}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {t.freeDelivery}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
