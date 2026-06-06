import React from 'react';
import { motion } from 'motion/react';
import { Palmtree, MapPin, Sparkles, ChevronRight, Truck } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface LocalCraftsmanshipProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onOpenDetails: (p: Product) => void;
  onExplore: () => void;
}

export const LocalCraftsmanship: React.FC<LocalCraftsmanshipProps> = ({ 
  products, 
  onAddToCart, 
  onBuyNow, 
  onOpenDetails,
  onExplore
}) => {
  const localProducts = products.filter(p => p.isLocal);

  if (localProducts.length === 0) return null;

  return (
    <section className="my-16">
      <div className="bg-emerald-950 dark:bg-emerald-900 rounded-[3rem] p-8 md:p-12 overflow-hidden relative shadow-2xl">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold mb-6">
              <MapPin className="w-4 h-4" />
              Sourcing Direct : Kananga & Kasai
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              L'Artisanat du Congo <span className="text-emerald-400">en Direct</span> de la RDC
            </h2>
            <p className="text-emerald-100/70 text-lg mb-8 leading-relaxed">
              Découvrez des pièces uniques, sculptées et tressées à la main par nos coopératives partenaires. En achetant local, vous soutenez l'économie de Kananga et réduisez l'impact écologique.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-400 font-bold uppercase">Livraison</p>
                  <p className="text-sm font-bold">Ultra-Rapide</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white bg-white/5 p-4 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-amber-400 font-bold uppercase">Qualité</p>
                  <p className="text-sm font-bold">Patrimoine</p>
                </div>
              </div>
            </div>

            <button 
              onClick={onExplore}
              className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-950 rounded-2xl font-black transform hover:scale-105 transition-all shadow-xl active:scale-95"
            >
              Tout découvrir
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            {localProducts.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
