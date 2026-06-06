import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove,
  onCheckout 
}) => {
  const { formatPrice } = useCurrency();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    onCheckout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl z-[70] flex flex-col border-l dark:border-zinc-800"
          >
            <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand" />
                <h2 className="text-lg font-bold dark:text-zinc-100">Votre Panier</h2>
              </div>
              <button 
                onClick={() => {
                  haptics.light();
                  sounds.click();
                  onClose();
                }} 
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors dark:text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p>Votre panier est vide</p>
                  <button 
                    onClick={onClose}
                    className="text-brand font-medium hover:underline"
                  >
                    Continuer vos achats
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border dark:border-zinc-800">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1 dark:text-zinc-200">{item.name}</h3>
                      <p className="text-brand font-bold mt-1">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1">
                          <button 
                            onClick={() => {
                              haptics.light();
                              sounds.click();
                              onUpdateQuantity(item.id, -1);
                            }}
                            className="p-1 hover:text-brand transition-colors dark:text-zinc-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center dark:text-zinc-200">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              haptics.light();
                              sounds.click();
                              onUpdateQuantity(item.id, 1);
                            }}
                            className="p-1 hover:text-brand transition-colors dark:text-zinc-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            haptics.warning();
                            sounds.warning();
                            onRemove(item.id);
                          }}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Sous-total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="dark:text-zinc-100">Total</span>
                  <span className="text-brand">{formatPrice(total)}</span>
                </div>
                <button 
                  onClick={() => {
                    haptics.heavy();
                    sounds.success();
                    handleCheckout();
                  }}
                  className="w-full py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                >
                  Passer la commande
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
