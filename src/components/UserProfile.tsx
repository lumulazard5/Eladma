import React, { useState } from 'react';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  ChevronRight, 
  Award, 
  Coins, 
  Settings, 
  User as UserIcon, 
  ArrowLeft, 
  Mail, 
  ShieldCheck, 
  MapPin, 
  Smartphone,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { toast } from 'sonner';

interface UserProfileProps {
  onBack: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  points: number;
}

interface MockOrder {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'In Transit' | 'Delivered' | 'Processing';
  statusFr: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  onBack, 
  products, 
  onAddToCart, 
  onOpenDetails,
  points
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { favorites, toggleFavorite, clearFavorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'orders' | 'settings'>('wishlist');

  // Find products that are in the user's wishlist/favorites
  const wishlistItems = products.filter(product => favorites.includes(product.id));

  // Determine loyalty rank based on points
  const getLoyaltyTier = (pts: number) => {
    if (pts >= 1000) return { name: 'Directeur Diamant', color: 'from-amber-400 via-yellow-500 to-amber-700', bg: 'bg-amber-500/10 text-amber-500' };
    if (pts >= 500) return { name: 'Ambassadeur Platine', color: 'from-blue-400 to-indigo-600', bg: 'bg-indigo-500/10 text-indigo-500' };
    if (pts >= 200) return { name: 'Artisan Or', color: 'from-yellow-400 to-amber-600', bg: 'bg-amber-400/15 text-amber-600 dark:text-amber-450' };
    return { name: 'Membre Initiative Bronze', color: 'from-orange-400 to-amber-800', bg: 'bg-orange-500/10 text-orange-600' };
  };

  const loyalty = getLoyaltyTier(points);

  // Mock Orders list for complete user account visualization
  const [mockOrders, setMockOrders] = useState<MockOrder[]>([
    {
      id: "EL-2026-9871s",
      date: "04/06/2026",
      items: [
        { name: "Saka Saka Frais & Bio", quantity: 2, price: 9.50 },
        { name: "Sac de Voyage Cuir Kasaï", quantity: 1, price: 129.00 }
      ],
      total: 148.00,
      status: "In Transit",
      statusFr: "En cours d'acheminement"
    },
    {
      id: "EL-2026-8342a",
      date: "28/05/2026",
      items: [
        { name: "Masque Royal Tshokwe", quantity: 1, price: 180.00 }
      ],
      total: 180.00,
      status: "Delivered",
      statusFr: "Livré en mains propres"
    }
  ]);

  const handleAddToCartFromWishlist = (product: Product) => {
    onAddToCart(product);
    toast.success(`${product.name} ajouté au panier depuis votre liste d'envies.`);
    sounds.success();
    haptics.success();
  };

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    toggleFavorite(productId, productName);
    sounds.click();
    haptics.light();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" id="user-profile-page">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            haptics.light();
            sounds.click();
            onBack();
          }}
          className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-brand dark:hover:text-brand transition-colors bg-white dark:bg-zinc-900 border dark:border-zinc-800 px-4 py-2.5 rounded-2xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backHome}</span>
        </button>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
          Espace Compte Eladma
        </span>
      </div>

      {/* Profile Info Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900 dark:bg-zinc-950 text-white p-8 md:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-tr from-brand to-orange-400 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg overflow-hidden border-2 border-white/20">
                LL
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-zinc-900" title="Identité vérifiée par KYC">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Lazar Lummu</h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-brand text-white shadow-sm`}>
                  Acheteur Vérifié
                </span>
              </div>
              <p className="text-sm text-zinc-400 font-medium mt-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-zinc-500" />
                lumulazard5@gmail.com
              </p>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-600" />
                Kananga, République Démocratique du Congo
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-5 py-4 bg-zinc-800/50 backdrop-blur rounded-2xl border border-zinc-700/30 flex items-center gap-3">
              <div className="p-2.5 bg-brand/10 text-brand rounded-xl">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Vos Points Eladma</p>
                <p className="text-xl font-black text-white">{points} pts</p>
              </div>
            </div>

            <div className="px-5 py-4 bg-zinc-800/50 backdrop-blur rounded-2xl border border-zinc-700/30 flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl">
                <Award className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Statut Fidélité</p>
                <span className="text-xs font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-transparent bg-clip-text">
                  {loyalty.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-2 shadow-sm flex items-center gap-2">
        <button // Wishlist Tab Button
          onClick={() => {
            setActiveTab('wishlist');
            sounds.select();
            haptics.light();
          }}
          className={`flex-1 py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'wishlist' 
              ? 'bg-brand text-white shadow-lg shadow-brand/10' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-805'
          }`}
          id="wishlist-tab-button"
        >
          <Heart className={`w-4 h-4 ${activeTab === 'wishlist' ? 'fill-white' : ''}`} />
          <span>Ma Liste d'Envies ({wishlistItems.length})</span>
        </button>

        <button // Orders Tab Button
          onClick={() => {
            setActiveTab('orders');
            sounds.select();
            haptics.light();
          }}
          className={`flex-1 py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'orders' 
              ? 'bg-brand text-white shadow-lg shadow-brand/10' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-805'
          }`}
          id="orders-tab-button"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Historique d'Achats ({mockOrders.length})</span>
        </button>

        <button // Settings Tab Button
          onClick={() => {
            setActiveTab('settings');
            sounds.select();
            haptics.light();
          }}
          className={`flex-1 py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'settings' 
              ? 'bg-brand text-white shadow-lg shadow-brand/10' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-805'
          }`}
          id="settings-tab-button"
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres Compte</span>
        </button>
      </div>

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="min-h-[400px]"
        >
          {activeTab === 'wishlist' && (
            <div className="space-y-6" id="wishlist-section">
              {wishlistItems.length === 0 ? (
                /* Empty Wishlist State */
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-12 md:p-16 text-center shadow-sm">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">Votre Liste d'envies est vide</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-8">
                    Parcourez nos superbes produits d'artisanat kasaïens et autres merveilles sur la plateforme Eladma, et cliquez sur le cœur pour les garder à portée de main !
                  </p>
                  <button 
                    onClick={() => {
                      sounds.click();
                      haptics.medium();
                      onBack();
                    }}
                    className="px-6 py-3 bg-brand text-white rounded-2xl font-bold text-sm shadow-md shadow-brand/15 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Explorer la boutique
                  </button>
                </div>
              ) : (
                /* Active Wishlist Grid with interactive controls */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((product) => (
                    <motion.div 
                      key={product.id}
                      layout
                      className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300"
                    >
                      {/* Product Thumbnail inside Wishlist */}
                      <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 cursor-pointer" onClick={() => onOpenDetails(product)}>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWishlist(product.id, product.name);
                          }}
                          className="absolute top-3 right-3 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur rounded-xl text-red-500 border dark:border-zinc-800 shadow hover:bg-red-50 dark:hover:bg-red-950/20 transition-all scale-90 hover:scale-100"
                          title="Retirer de ma liste"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-[9px] font-black bg-zinc-900/80 backdrop-blur text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          {product.category}
                        </span>
                      </div>

                      {/* Details / Management block */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="cursor-pointer" onClick={() => onOpenDetails(product)}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-zinc-950 dark:text-zinc-50 line-clamp-1 group-hover:text-brand transition-colors">
                              {product.name}
                            </h4>
                            <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-200">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        {/* Quick Add and Detail button */}
                        <div className="flex items-center gap-3 pt-2">
                          <button 
                            onClick={() => handleAddToCartFromWishlist(product)}
                            className="flex-1 py-3 bg-brand text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Ajouter au Panier</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              haptics.light();
                              sounds.open();
                              onOpenDetails(product);
                            }}
                            className="px-3.5 py-3 border dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 hover:bg-zinc-50 font-bold text-xs rounded-xl transition-all"
                            title="Voir la fiche"
                          >
                            Détails
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6" id="order-history-section">
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-lg dark:text-white mb-1">Mes Achats Récents</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Suivi logistique de vos transactions sur la zone de libre-échange agricole ou artisanale RDC.</p>
                
                <div className="space-y-5">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm text-brand">{order.id}</span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{order.date}</span>
                        </div>
                        
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <p key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                              {item.name} <span className="text-zinc-400">x{item.quantity}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Montant Payé</p>
                          <p className="text-base font-black dark:text-white">{formatPrice(order.total)}</p>
                        </div>
                        
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          order.status === 'Delivered' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                        }`}>
                          {order.status === 'Delivered' ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                          <span>{order.statusFr}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="settings-section">
              <div>
                <h3 className="font-bold text-lg dark:text-white mb-1">Paramètres Personnels</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Gérez vos infos, adresses par défaut et préférences de communication.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Adresse Mail Principale</label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700/50 p-4 rounded-xl">
                    <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800 truncate">lumulazard5@gmail.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Numéro de Téléphone Lié</label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700/50 p-4 rounded-xl">
                    <Smartphone className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">+243 892 456 789</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Zone de Livraison Préférée</label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700/50 p-4 rounded-xl">
                    <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">Commune de Kananga, Kasaï-Central</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Abonnement</label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700/50 p-4 rounded-xl">
                    <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">Inscrit depuis mai 2026</span>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-zinc-800 pt-6">
                <button 
                  onClick={() => {
                    sounds.click();
                    haptics.medium();
                    clearFavorites();
                  }}
                  className="px-5 py-3 border border-red-200 dark:border-red-950/40 hover:bg-red-500/10 text-red-500 dark:text-red-400 font-bold text-xs rounded-xl transition-all"
                >
                  Vider toute la liste d'envies (Wishlist)
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
