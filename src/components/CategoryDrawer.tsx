import React from 'react';
import { X, LayoutGrid, Smartphone, Shirt, Home, Sparkles, Trophy, ArrowRight, Palmtree, Armchair, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category } from '../types';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
}

const categoryItems = [
  { id: 'All', label: 'Tous les produits', icon: LayoutGrid, color: 'bg-zinc-100 text-zinc-900' },
  { id: 'Artisanat', label: 'Artisanat du Congo', icon: Palmtree, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'Electronics', label: 'Électronique', icon: Smartphone, color: 'bg-blue-50 text-blue-600' },
  { id: 'Fashion', label: 'Mode & Style', icon: Shirt, color: 'bg-pink-50 text-pink-600' },
  { id: 'Home', label: 'Maison & Déco', icon: Home, color: 'bg-orange-50 text-orange-600' },
  { id: 'Furniture', label: 'Mobilier & Meubles', icon: Armchair, color: 'bg-amber-55 text-amber-700' },
  { id: 'Automotive', label: 'Pièces & Outillage', icon: Wrench, color: 'bg-red-55 text-red-650' },
  { id: 'Beauty', label: 'Beauté & Soins', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
  { id: 'Sports', label: 'Sports & Loisirs', icon: Trophy, color: 'bg-green-50 text-green-600' },
];

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ isOpen, onClose, onSelectCategory }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-white dark:bg-zinc-950 z-[151] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold dark:text-white">Rayons Eladma</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors dark:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectCategory(item.id as Category);
                    onClose();
                  }}
                  className="w-full group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-brand/10 hover:bg-brand/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-zinc-100">{item.label}</h3>
                      <p className="text-xs text-zinc-500">Explorer la collection</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-brand transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>

            <div className="p-6 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-400 text-center mb-4">
                © 2024 Eladma - Le futur du shopping
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
