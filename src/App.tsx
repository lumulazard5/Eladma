import React, { useState, useEffect, Suspense } from 'react';
import { Header } from './components/Header';
import { ImageSearchModal } from './components/ImageSearchModal';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { BottomNav } from './components/BottomNav';
import type { LegalTab } from './components/LegalInfo';
import { CategoryDrawer } from './components/CategoryDrawer';
import { LocalCraftsmanship } from './components/LocalCraftsmanship';
import { PowerComparison } from './components/PowerComparison';
import { CustomerTestimonials } from './components/CustomerTestimonials';
import { Breadcrumbs } from './components/Breadcrumbs';
import { ComparePanel } from './components/ComparePanel';
import { Product, CartItem, Category, Review, ProductFilters } from './types';
import { generateProducts, translateProducts } from './services/gemini';
import { useLanguage } from './context/LanguageContext';
import { SettingsPanel } from './components/SettingsPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowRight, Zap, Globe, ShieldCheck, ShoppingBag, FilterX, BookOpen, Heart, Shield, Check, X, Sparkles, Cpu, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from './context/FavoritesContext';
import { usePriceTracker } from './context/PriceTrackerContext';
import { EladmaSecurity } from './services/security';
import { haptics } from './services/haptics';

// Lazy load heavy components for high-speed low-bandwidth mobile performance
const AIAssistant = React.lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })));
const ContactForm = React.lazy(() => import('./components/ContactForm').then(m => ({ default: m.ContactForm })));
const OrderTracking = React.lazy(() => import('./components/OrderTracking').then(m => ({ default: m.OrderTracking })));
const Checkout = React.lazy(() => import('./components/Checkout').then(m => ({ default: m.Checkout })));
const Rewards = React.lazy(() => import('./components/Rewards').then(m => ({ default: m.Rewards })));
const LegalInfo = React.lazy(() => import('./components/LegalInfo').then(m => ({ default: m.LegalInfo })));
const SupplierDashboard = React.lazy(() => import('./components/SupplierDashboard').then(m => ({ default: m.SupplierDashboard })));
const CooperativeStories = React.lazy(() => import('./components/CooperativeStories').then(m => ({ default: m.CooperativeStories })));
const CatalogView = React.lazy(() => import('./components/CatalogView').then(m => ({ default: m.CatalogView })));
const SecurityConsole = React.lazy(() => import('./components/SecurityConsole').then(m => ({ default: m.SecurityConsole })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));

const LazyLoadingSpinner = () => (
  <div className="h-[450px] w-full flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-500">
    <Loader2 className="w-10 h-10 animate-spin text-brand" />
    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 animate-pulse">Chargement optimisé Eladma...</span>
  </div>
);

export default function App() {
  const { isFavorite } = useFavorites();
  const { language } = useLanguage();
  const { trackedProductIds, addPriceAlert } = usePriceTracker();
  const [products, setProducts] = useState<Product[]>([]);
  const [translatedProducts, setTranslatedProducts] = useState<Product[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    priceRange: [0, 1000],
    minRating: 0,
    localOnly: false,
    certifiedOnly: false,
    seller: 'All',
    favoritesOnly: false
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isSecurityConsoleOpen, setIsSecurityConsoleOpen] = useState(false);
  const [blockedThreatsCount, setBlockedThreatsCount] = useState(0);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = EladmaSecurity.subscribeToThreats((threats) => {
      setBlockedThreatsCount(threats.length);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const translate = async () => {
      if (language === 'fr' || products.length === 0) {
        setTranslatedProducts(products);
        setIsTranslating(false);
        return;
      }
      
      setIsTranslating(true);
      try {
        const translated = await translateProducts(products, language);
        if (isMounted) {
          setTranslatedProducts(translated);
        }
      } catch (err) {
        console.error("Translation failed:", err);
        if (isMounted) {
          setTranslatedProducts(products);
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };
    
    translate();
    
    return () => {
      isMounted = false;
    };
  }, [products, language]);
  const [view, setView] = useState<'home' | 'catalog' | 'contact' | 'tracking' | 'checkout' | 'rewards' | 'legal' | 'supplier' | 'cooperatives' | 'profile'>('home');
  const [legalTab, setLegalTab] = useState<LegalTab>('mission');
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('eladma_rewards_points');
    const parsed = saved ? parseInt(saved, 10) : 245;
    return EladmaSecurity.validateAndFetchPoints(parsed);
  });

  useEffect(() => {
    EladmaSecurity.initConsoleBanner();
    // Monitor abnormal DevTools access during the shopping session
    EladmaSecurity.detectDebugger(() => {
      // Just log internally or toast once
      console.warn("⚠️ Inspecteur d'éléments ouvert : Contrôles de sécurité Eladma actifs.");
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('eladma_rewards_points', points.toString());
  }, [points]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('eladma-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const handleViewChange = (e: any) => {
      if (e.detail) setView(e.detail);
    };
    const handleShowFavorites = () => {
      setView('catalog');
      setFilters(prev => ({ ...prev, favoritesOnly: true }));
    };
    window.addEventListener('change-view', handleViewChange);
    window.addEventListener('eladma_show_favorites', handleShowFavorites);
    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('eladma_show_favorites', handleShowFavorites);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('eladma-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Price Drop Simulator Function
  const triggerPriceDropSimulation = (specificProductId?: string) => {
    let targetProduct: Product | undefined;

    if (specificProductId) {
      targetProduct = products.find(p => p.id === specificProductId);
    }

    if (!targetProduct) {
      if (trackedProductIds.length > 0) {
        const randomTrackedId = trackedProductIds[Math.floor(Math.random() * trackedProductIds.length)];
        targetProduct = products.find(p => p.id === randomTrackedId);
      }
    }

    if (!targetProduct && products.length > 0) {
      targetProduct = products[Math.floor(Math.random() * products.length)];
    }

    if (!targetProduct) return;

    const targetId = targetProduct.id;
    const oldPrice = targetProduct.price;
    const dropPercentage = Math.floor(Math.random() * 21) + 15; // 15% - 35%
    const newPrice = Math.max(1, Math.round(oldPrice * (1 - dropPercentage / 100)));

    if (newPrice >= oldPrice) return;

    // Update state for absolute sync
    setProducts(prev => prev.map(p => p.id === targetId ? { ...p, price: newPrice } : p));
    setTranslatedProducts(prev => prev.map(p => p.id === targetId ? { ...p, price: newPrice } : p));

    // Register Price alert in context
    addPriceAlert(targetId, targetProduct.name, oldPrice, newPrice, targetProduct.image);
  };

  // Listen to manual triggers (like from the developer/test panel inside notifications dropdown)
  useEffect(() => {
    const handleManualBaisse = (e: Event) => {
      const customEvent = e as CustomEvent;
      const specificProductId = customEvent.detail?.productId;
      triggerPriceDropSimulation(specificProductId);
    };

    window.addEventListener('eladma_trigger_baisse', handleManualBaisse);
    return () => window.removeEventListener('eladma_trigger_baisse', handleManualBaisse);
  }, [products, trackedProductIds]);

  // Handle automatic background price drops on tracked products periodically
  useEffect(() => {
    if (products.length === 0) return;

    const intervalId = setInterval(() => {
      const trackingChance = trackedProductIds.length > 0 ? 0.4 : 0.15;
      if (Math.random() < trackingChance) {
        const targetId = trackedProductIds.length > 0
          ? trackedProductIds[Math.floor(Math.random() * trackedProductIds.length)]
          : undefined;
        triggerPriceDropSimulation(targetId);
      }
    }, 45000);

    return () => clearInterval(intervalId);
  }, [products, trackedProductIds]);

  useEffect(() => {
    if (view === 'home') {
      loadProducts();
    }
  }, [activeCategory, view]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateProducts(activeCategory === 'All' ? 'General' : activeCategory);
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError("Désolé, nous n'avons pas pu charger les produits. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReview = (productId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const updatedReviews = [newReview, ...p.reviews];
        const newAvgRating = updatedReviews.length > 0
          ? Number((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1))
          : p.rating;
        
        const updatedProduct = {
          ...p,
          reviews: updatedReviews,
          reviewCount: updatedReviews.length,
          rating: newAvgRating
        };

        if (selectedProduct?.id === productId) {
          setSelectedProduct(updatedProduct);
        }
        return updatedProduct;
      }
      return p;
    }));

    toast.success('Merci pour votre avis !', {
      description: 'Votre commentaire a été publié avec succès.'
    });
  };

  const addToCart = (product: Product) => {
    haptics.success();
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product);
    setSelectedProduct(null);
    setView('checkout');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const filteredProducts = translatedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.seller && p.seller.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
    const matchesRating = p.rating >= filters.minRating;
    const matchesLocal = !filters.localOnly || p.isLocal;
    const matchesCertified = !filters.certifiedOnly || p.isCertified;
    const matchesSeller = filters.seller === 'All' || p.seller === filters.seller;
    const matchesFavorites = !filters.favoritesOnly || isFavorite(p.id);

    return matchesSearch && matchesPrice && matchesRating && matchesLocal && matchesCertified && matchesSeller && matchesFavorites;
  });

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <Header 
        onSearch={setSearchQuery} 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onGoHome={() => setView('home')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        products={translatedProducts}
        onSelectProduct={(product) => {
          setView('home');
          setSelectedProduct(product);
        }}
        onNavigate={(v) => {
          if (v === 'categories') setIsCategoryMenuOpen(true);
          else setView(v);
        }}
        onOpenImageSearch={() => setIsImageSearchOpen(true)}
      />

      <Breadcrumbs 
        view={view}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        onNavigate={setView}
        onSelectCategory={setActiveCategory}
        onClearSearch={() => setSearchQuery('')}
      />
      
      {view === 'home' && (
        <CategoryBar 
          activeCategory={activeCategory} 
          onSelect={setActiveCategory} 
          filters={filters}
          onFiltersChange={setFilters}
          products={translatedProducts}
        />
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense fallback={<LazyLoadingSpinner />}>
          {error ? (
          <div className="h-96 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 rotate-180" />
            </div>
            <h2 className="text-xl font-bold dark:text-white mb-2">Oups ! Quelque chose s'est mal passé</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={() => loadProducts()}
              className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
            >
              Réessayer le chargement
            </button>
          </div>
        ) : view === 'catalog' ? (
          <CatalogView 
            products={translatedProducts}
            filteredProducts={filteredProducts}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            onAddToCart={addToCart}
            onBuyNow={handleBuyNow}
            onOpenDetails={setSelectedProduct}
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onOpenImageSearch={() => setIsImageSearchOpen(true)}
          />
        ) : view === 'contact' ? (
          <ContactForm />
        ) : view === 'profile' ? (
          <UserProfile 
            onBack={() => setView('home')} 
            products={translatedProducts}
            onAddToCart={addToCart}
            onOpenDetails={setSelectedProduct}
            points={points}
          />
        ) : view === 'tracking' ? (
          <OrderTracking />
        ) : view === 'rewards' ? (
          <Rewards points={points} onAddPoints={(pts) => setPoints(prev => prev + pts)} />
        ) : view === 'legal' ? (
          <LegalInfo initialTab={legalTab} onBack={() => setView('home')} />
        ) : view === 'supplier' ? (
          <SupplierDashboard onBack={() => setView('home')} />
        ) : view === 'cooperatives' ? (
          <CooperativeStories onBack={() => setView('home')} />
        ) : view === 'checkout' ? (
          <Checkout 
            cart={cart}
            onBack={() => setView('home')}
            onClearCart={() => setCart([])}
            onOrderSuccess={(orderId) => {
              const earnedPoints = Math.floor(cart.reduce((s, i) => s + i.price * i.quantity, 0));
              setPoints(prev => prev + earnedPoints);
              setCart([]);
              setView('home');
              toast.success('Commande réussie !', {
                description: `Commande ${orderId || ''} enregistrée. +${earnedPoints} points Eladma !`
              });
            }}
          />
        ) : (
          <>
            {/* Hero Section */}
            {activeCategory === 'All' && !searchQuery && (
              <>
                <section className="mb-12 relative rounded-3xl overflow-hidden bg-zinc-900 text-white p-8 md:p-16">
                  <div className="absolute inset-0 opacity-40">
                    <img 
                      src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=2070" 
                      alt="Hero" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-6"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Saison Sèche : Offres Spéciales en RDC
                    </motion.div>
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight"
                    >
                      Le premier marché souverain de la <span className="text-brand">RDC</span>
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-zinc-300 text-sm md:text-base mb-6 max-w-xl leading-relaxed font-semibold text-zinc-100"
                    >
                      Propulsez votre quotidien grâce à l'infrastructure de commerce souverain unifiée de la RDC. De Kinshasa à Lubumbashi, Eladma fédère les forces productives locales et garantit un acheminement sécurisé des produits d'excellence.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl border-t border-white/10 pt-6 text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="p-1 px-1.5 rounded-md bg-brand/20 text-brand text-[9px] font-black uppercase tracking-wider mt-0.5 shrink-0 select-none">
                          KNS • KNG • MBM
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Artisanat, Bois & Outillage</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 font-medium leading-relaxed">
                            Ameublements massifs d'exception, confections locales et pièces de rechange industrielles.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="p-1 px-1.5 rounded-md bg-brand/20 text-brand text-[9px] font-black uppercase tracking-wider mt-0.5 shrink-0 select-none">
                          LSH • GMA • GMB
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Technologie & Mode</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 font-medium leading-relaxed">
                            Électronique de pointe, énergies solaires autonomes et haute couture congolaise de prestige.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.button 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => {
                        const grid = document.querySelector('#product-grid');
                        grid?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-8 py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all flex items-center gap-2 group"
                    >
                      Acheter maintenant
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </section>

                <LocalCraftsmanship 
                  products={translatedProducts}
                  onAddToCart={addToCart}
                  onBuyNow={handleBuyNow}
                  onOpenDetails={setSelectedProduct}
                  onExplore={() => setView('cooperatives')}
                />
              </>
            )}

        {/* Eladma vs Global Giants State-of-the-Art Interactive Comparison */}
        <section className="mb-16">
          <PowerComparison />
        </section>

        {/* Features banner of protection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Globe, title: "Liaisons Nationales & Mondiales", desc: "Expédition dans toutes les provinces de RDC et vers l'international" },
            { icon: ShieldCheck, title: "Protection Souveraine", desc: "Normes bancaires cryptées BCC de la Banque Centrale" },
            { icon: Zap, title: "Intelligence Artificielle en Ligne", desc: "Calcul intelligent des taxes de transport provinciaux" },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-brand">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{feature.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Grid */}
        <div id="product-grid" className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">
            {searchQuery ? `Résultats pour "${searchQuery}"` : activeCategory === 'All' ? 'Produits Recommandés' : activeCategory}
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>{filteredProducts.length} {filteredProducts.length > 1 ? 'produits trouvés' : 'produit trouvé'}</span>
            {isTranslating && (
              <span className="flex items-center gap-1 text-xs text-brand bg-brand/5 dark:bg-brand/10 border border-brand/10 dark:border-brand/20 px-2.5 py-0.5 rounded-full select-none">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Traductions Gemini...</span>
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-brand" />
            <p className="animate-pulse">Génération des meilleurs produits pour vous...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={addToCart} 
                  onBuyNow={(p) => {
                    addToCart(p);
                    setView('checkout');
                  }}
                  onOpenDetails={setSelectedProduct}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 mb-12">
            <FilterX className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Aucun produit ne correspond à vos filtres.</p>
            <button 
              onClick={() => setFilters({
                priceRange: [0, 1000],
                minRating: 0,
                localOnly: false,
                certifiedOnly: false,
                seller: 'All'
              })}
              className="mt-4 text-brand font-bold hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Customer Testimonials Section */}
        <CustomerTestimonials />

        {/* Newsletter Section */}
        <section className="mb-12 bg-brand rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShoppingBag className="w-64 h-64 rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Rejoignez la révolution Eladma</h2>
            <p className="text-white/80 mb-8">
              Inscrivez-vous à notre newsletter pour recevoir des offres exclusives, 
              des avant-premières sur les nouveaux produits et des conseils de notre assistant IA.
            </p>
            <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="votre@email.com" 
                className="flex-1 px-6 py-4 rounded-xl bg-white text-zinc-900 outline-none focus:ring-4 focus:ring-white/20 transition-all"
                required
              />
              <button className="px-8 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-black transition-all">
                S'inscrire
              </button>
            </form>
            <p className="mt-4 text-xs text-white/60">
              En vous inscrivant, vous acceptez nos <span className="underline cursor-pointer" onClick={() => { setView('legal'); setLegalTab('mission'); }}>conditions d'utilisation</span> et notre <span className="underline cursor-pointer" onClick={() => { setView('legal'); setLegalTab('privacy'); }}>politique de confidentialité</span>.
            </p>
          </div>
        </section>

          </>
        )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-12 mb-16 md:mb-0">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold mb-4 dark:text-zinc-100">À propos d'Eladma</h3>
              <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('catalog'); }}>Consulter le Catalogue</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('mission'); }}>Notre mission & vision</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('careers'); }}>Carrières</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('blog'); }}>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 dark:text-zinc-100">Service Client</h3>
              <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="cursor-pointer hover:text-brand transition-colors" onClick={() => setView('contact')}>Centre d'aide</li>
                <li className="cursor-pointer hover:text-brand transition-colors" onClick={() => { setView('legal'); setLegalTab('refund'); }}>Retours & Remboursements</li>
                <li className="cursor-pointer hover:text-brand transition-colors" onClick={() => setView('tracking')}>Suivi de commande</li>
                <li className="cursor-pointer hover:text-brand transition-colors" onClick={() => { setView('legal'); setLegalTab('shipping'); }}>Politique de livraison</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 dark:text-zinc-100">Vendre sur Eladma</h3>
              <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('supplier'); }}>Dashboard Vendeur</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('cooperatives'); }}>Histoires des Coopératives</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('partners'); }}>Partenariats</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('advertising'); }}>Publicité</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 dark:text-zinc-100">Légal</h3>
              <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('terms'); }}>Conditions d'utilisation</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('privacy'); }}>Confidentialité</li>
                <li className="hover:text-brand cursor-pointer transition-colors" onClick={() => { setView('legal'); setLegalTab('cookies'); }}>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400 dark:text-zinc-500">
            <div className="flex flex-col gap-1">
              <p>© 2024 Eladma Inc. Tous droits réservés.</p>
              <p className="text-[10px] opacity-70">Siège Social : Kananga (Quartier Ngaza) • Bureaux Provinciaux : Lubumbashi & Kinshasa • République Démocratique du Congo</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Français (EUR)
              </span>
              <span>contact@eladma.com</span>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setView('checkout')}
      />

      <ComparePanel 
        onAddToCart={addToCart}
        onOpenDetails={setSelectedProduct}
      />

      <Suspense fallback={null}>
        <AIAssistant 
          isOpen={isAIOpen} 
          onClose={() => setIsAIOpen(false)} 
          products={translatedProducts}
        />
      </Suspense>

      <ProductModal 
        product={selectedProduct ? (translatedProducts.find(p => p.id === selectedProduct.id) || selectedProduct) : null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onBuyNow={(product) => {
          addToCart(product);
          setSelectedProduct(null);
          setView('checkout');
        }}
        onAddReview={handleAddReview}
      />

      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        products={translatedProducts}
        onSelectProduct={setSelectedProduct}
        onAddToCart={addToCart}
      />

      <BottomNav 
        currentView={view} 
        onViewChange={(newView) => {
          if (newView === 'categories') setIsCategoryMenuOpen(true);
          else setView(newView);
        }} 
      />

      <CategoryDrawer 
        isOpen={isCategoryMenuOpen}
        onClose={() => setIsCategoryMenuOpen(false)}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          setView('home');
          // Scroll to product grid if needed
          setTimeout(() => {
            document.querySelector('#product-grid')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Floating Eladma Guard Badge & Controller hidden for cleaner consumer marketplace page */}

      {/* Security Telemetry Console Overlay */}
      <AnimatePresence>
        {isSecurityConsoleOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl"
            >
              <Suspense fallback={<LazyLoadingSpinner />}>
                <SecurityConsole onClose={() => setIsSecurityConsoleOpen(false)} />
              </Suspense>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onOpenSecurityConsole={() => setIsSecurityConsoleOpen(true)} 
      />
    </div>
  );
}
