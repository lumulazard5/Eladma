import React, { useState, useMemo } from 'react';
import { X, Star, ShoppingCart, ShieldCheck, Truck, Zap, TrendingUp, TrendingDown, Heart, Bell, MessageSquare, Share2, Leaf, Scale, Coins, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Product, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency } from '../context/CurrencyContext';
import { useFavorites } from '../context/FavoritesContext';
import { useLanguage } from '../context/LanguageContext';
import { usePriceTracker } from '../context/PriceTrackerContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onAddReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart, onBuyNow, onAddReview }) => {
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language } = useLanguage();
  const { isTracking, toggleTracking } = usePriceTracker();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [newReview, setNewReview] = useState({ user: '', rating: 5, comment: '' });
  const [showTaxCalc, setShowTaxCalc] = useState(false);
  const [taxDestination, setTaxDestination] = useState('rdc');

  const isTracked = product ? isTracking(product.id) : false;

  // Dynamic design parameters for carbon footprint savings
  const carbonDetails = useMemo(() => {
    if (!product) return { carbonSavedPercent: 0, carbonStandard: 0, carbonLocal: 0, carbonSaved: 0 };
    
    // Deterministic footprint calculation based on product attributes
    let seedValue = 0;
    for (let i = 0; i < product.id.length; i++) {
      seedValue += product.id.charCodeAt(i);
    }
    
    const carbonSavedPercent = 85 + (seedValue % 11); // e.g. 85% to 95%
    const weightFactor = ((product.price + seedValue) % 7) + 1.2; // e.g. 1.2kg to 8.2kg equivalents
    const carbonStandard = weightFactor * 4.5;
    const carbonLocal = carbonStandard * (1 - carbonSavedPercent / 100);
    const carbonSaved = carbonStandard - carbonLocal;
    
    return { carbonSavedPercent, carbonStandard, carbonLocal, carbonSaved };
  }, [product]);

  // Dynamic taxes and customs calculations
  const taxesBreakdown = useMemo(() => {
    if (!product) return { basePrice: 0, customs: 0, vat: 0, total: 0 };
    
    const price = product.price;
    let customsPercent = 0;
    let vatPercent = 0.16; // 16% standard TVA
    
    if (taxDestination === 'rdc') {
      customsPercent = 0.05; // 5% domestic transport tax & transit handling
    } else {
      customsPercent = 0.15; // 15% international import customs clearance
      vatPercent = 0.20; // 20% international VAT rate
    }

    const basePrice = price / (1 + customsPercent + vatPercent);
    const customs = basePrice * customsPercent;
    const vat = basePrice * vatPercent;
    
    return {
      basePrice: Math.round(basePrice * 100) / 100,
      customs: Math.round(customs * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      total: price
    };
  }, [product, taxDestination]);

  // Génération déterministe de l'historique des prix sur 30 jours
  const priceHistory = useMemo(() => {
    if (!product) return [];
    
    let seed = 0;
    for (let i = 0; i < product.id.length; i++) {
      seed += product.id.charCodeAt(i);
    }
    
    const pseudoRandom = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    const days = 30;
    const history = [];
    let tempPrice = product.price;

    for (let i = days - 1; i >= 0; i--) {
      // Fluctuations légères entre -2.5% et +2.5%
      const fluctuation = (pseudoRandom(i) * 5 - 2.5) / 100;
      // Tendence globale (certains produits montent, d'autres baissent)
      const overallTrend = (pseudoRandom(seed) > 0.5 ? 0.04 : -0.04) / days;
      
      if (i > 0) {
        tempPrice = tempPrice * (1 - (fluctuation + overallTrend));
      } else {
        tempPrice = product.price; // Aujourd'hui correspond exactement au prix actuel
      }

      const label = i === 0 ? "Auj." : `J-${i}`;
      
      history.unshift({
        name: label,
        price: Math.round(tempPrice * 10) / 10,
      });
    }

    history[history.length - 1].price = product.price;
    return history;
  }, [product?.id, product?.price]);

  // Métriques de tendance des prix
  const priceStats = useMemo(() => {
    if (!product || priceHistory.length === 0) {
      return { minPrice: 0, maxPrice: 0, priceDiffStr: '0%', isRising: false };
    }
    
    const prices = priceHistory.map(h => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const initialPrice = priceHistory[0].price;
    const currentPrice = product.price;
    const priceDiffPercent = ((currentPrice - initialPrice) / initialPrice) * 100;
    const priceDiffStr = priceDiffPercent >= 0 
      ? `+${priceDiffPercent.toFixed(1)}%` 
      : `${priceDiffPercent.toFixed(1)}%`;
    const isRising = priceDiffPercent >= 0;
    
    return { minPrice, maxPrice, priceDiffStr, isRising };
  }, [priceHistory, product?.price]);

  if (!product) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(language === 'fr' 
          ? "Lien du produit copié dans le presse-papiers !" 
          : "Product link copied to clipboard!"
        );
      })
      .catch(() => {
        toast.error(language === 'fr' 
          ? "Échec de la copie du lien." 
          : "Failed to copy link."
        );
      });
  };

  const handleShare = async () => {
    haptics.medium();
    sounds.select();

    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    const shareTitle = product.name;
    const shareText = language === 'fr' 
      ? `Découvrez "${product.name}" sur Eladma ! Excellence et authenticité de l'artisanat du Congo.`
      : `Discover "${product.name}" on Eladma! Excellence and authenticity of Congolese craftsmanship.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success(language === 'fr' ? "Produit partagé avec succès !" : "Product shared successfully!");
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const handleShareWhatsApp = () => {
    haptics.medium();
    sounds.select();

    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    const formattedPrice = formatPrice(product.price);
    
    // Nettoyer et limiter la description
    const cleanDesc = product.description.length > 120 
      ? product.description.slice(0, 117) + "..." 
      : product.description;

    const message = language === 'fr'
      ? `🛍️ *${product.name}*\n\n💰 *Prix :* ${formattedPrice}\n📝 *Description :* ${cleanDesc}\n\n👉 Découvrez ce produit sur Eladma :\n🔗 ${shareUrl}`
      : `🛍️ *${product.name}*\n\n💰 *Price :* ${formattedPrice}\n📝 *Description :* ${cleanDesc}\n\n👉 Discover this product on Eladma :\n🔗 ${shareUrl}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success(language === 'fr' ? "Redirection vers WhatsApp..." : "Redirecting to WhatsApp...");
  };

  const handleShareFacebook = () => {
    haptics.medium();
    sounds.select();

    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    toast.success(language === 'fr' ? "Redirection vers Facebook..." : "Redirecting to Facebook...");
  };


  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userTrimmed = newReview.user.trim();
    const commentTrimmed = newReview.comment.trim();
    const ratingNum = Number(newReview.rating);

    if (!userTrimmed) {
      toast.error(language === 'fr' ? "Veuillez saisir votre nom pour l'avis." : "Please enter your name for the review.");
      return;
    }

    if (!commentTrimmed) {
      toast.error(language === 'fr' ? "Le commentaire de l'avis ne peut pas être vide." : "Review comment cannot be empty.");
      return;
    }

    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      toast.error(language === 'fr' ? "La note doit être comprise entre 1 et 5." : "Rating must be between 1 and 5.");
      return;
    }

    haptics.success();
    sounds.success();
    onAddReview(product.id, {
      user: userTrimmed,
      rating: ratingNum,
      comment: commentTrimmed
    });
    setIsReviewOpen(false);
    setNewReview({ user: '', rating: 5, comment: '' });
    toast.success(language === 'fr' ? "Merci ! Votre avis a été enregistré avec succès." : "Thank you! Your review has been submitted successfully.");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptics.light();
            sounds.click();
            onClose();
          }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        >
          <button 
            onClick={() => {
              haptics.light();
              sounds.click();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors dark:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Info Section */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-widest">{product.category}</span>
                <h2 className="text-3xl font-bold dark:text-white mt-1">{product.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                    ))}
                    <span className="ml-1 font-bold text-zinc-900 dark:text-zinc-100">{product.rating}</span>
                  </div>
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">{product.reviewCount} avis clients</span>
                </div>
              </div>

              {/* Section prix avec détail de taxes et dédouanement */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <div className="text-2xl font-black text-brand">{formatPrice(product.price)}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Taxes & Dédouanement Inclus</div>
                    </div>
                    
                    {/* Sparkline mini-graphique d'évolution */}
                    <div className="hidden sm:flex flex-col justify-center w-28 h-10 relative group/spark cursor-pointer" title="Historique de prix (30j)">
                      <div className="w-full h-7">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={priceHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <defs>
                              <linearGradient id="colorSparkPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={priceStats.isRising ? "#EF4444" : "#10B981"} stopOpacity={0.25}/>
                                <stop offset="95%" stopColor={priceStats.isRising ? "#EF4444" : "#10B981"} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke={priceStats.isRising ? "#EF4444" : "#10B981"} 
                              strokeWidth={1.5} 
                              dot={false}
                              fillOpacity={1}
                              fill="url(#colorSparkPrice)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <span className="text-[8px] font-black tracking-wider text-zinc-400 uppercase mt-0.5 inline-flex items-center gap-1 group-hover/spark:text-brand transition-colors">
                        Tendance : <span className={priceStats.isRising ? "text-rose-500 font-bold" : "text-emerald-500 font-black"}>{priceStats.priceDiffStr}</span>
                      </span>
                    </div>
                  </div>
                  {product.seller && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
                      <span className="block text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">Vendeur certifié</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md inline-block mt-1 font-mono text-xs">{product.seller}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                  <button 
                    type="button"
                    onClick={() => {
                      haptics.light();
                      sounds.click();
                      setShowTaxCalc(!showTaxCalc);
                    }}
                    className="flex items-center justify-between w-full text-left font-bold text-xs text-zinc-600 dark:text-zinc-300 hover:text-brand dark:hover:text-[#FF4F01] transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-sans">
                      <Scale className="w-4 h-4 text-brand dark:text-[#FF4F01]" />
                      {language === 'fr' ? 'Détails des taxes & dédouanement' : 'Tax & Customs Breakdown'}
                    </span>
                    <span className="text-[10px] bg-zinc-200 dark:bg-zinc-750 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full hover:bg-brand/10 hover:text-brand font-black transition-colors">
                      {showTaxCalc ? (language === 'fr' ? 'Masquer' : 'Hide') : (language === 'fr' ? 'Afficher' : 'View')}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showTaxCalc && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-2 mt-3"
                      >
                        <div className="flex items-center gap-2.5 p-1 px-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
                          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-zinc-400" /> Destination :
                          </span>
                          <select 
                            value={taxDestination} 
                            onChange={(e) => {
                              haptics.light();
                              sounds.select();
                              setTaxDestination(e.target.value);
                            }}
                            className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 border-none outline-none flex-1 py-1 cursor-pointer font-sans"
                          >
                            <option value="rdc" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">RDC (Kananga, Kinshasa, Lubumbashi...)</option>
                            <option value="int" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">International (Afrique, Europe, Amériques, Asie)</option>
                          </select>
                        </div>

                        <div className="text-[11px] space-y-2 border-t border-zinc-100 dark:border-zinc-800/45 pt-2.5 font-mono">
                          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Prix de l'article (HT) :</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatPrice(taxesBreakdown.basePrice)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Frais d'importation & dédouanement :</span>
                            <span className="font-bold text-brand dark:text-[#FF4F01]">{formatPrice(taxesBreakdown.customs)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                            <span>Taxes de transaction & TVA locale :</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatPrice(taxesBreakdown.vat)}</span>
                          </div>
                          <div className="flex justify-between text-zinc-700 dark:text-zinc-300 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                            <span className="font-extrabold text-xs">{language === 'fr' ? 'Prix d\'achat Total (TTC) :' : 'Total Purchase Price (TTC) :'}</span>
                            <span className="font-black text-brand dark:text-[#FF4F01] text-xs">{formatPrice(taxesBreakdown.total)}</span>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-2 rounded-xl flex items-start gap-2 mt-1.5 leading-snug">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                          <span>{language === 'fr' 
                            ? "Garantie Transparence Eladma : Pas de frais cachés ou de taxes imprévues lors de la livraison. Tout est réglé de bout en bout." 
                            : "Eladma Transparency Guarantee: No hidden fees or unexpected taxes at delivery. Everything is cleared from start to end."}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>
                {language !== 'fr' && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 font-medium select-none bg-zinc-55 dark:bg-zinc-800/30 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
                    </span>
                    <span>
                      {language === 'en' ? 'Translated automatically by Gemini AI' :
                       language === 'ln' ? 'Ebongolami na automatique na Gemini AI' :
                       'Imetafsiriwa kiotomatiki na Gemini AI'}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-brand" />
                  <div className="text-xs">
                    <p className="font-bold dark:text-zinc-100">Livraison Gratuite</p>
                    <p className="text-zinc-500">Sous 3-5 jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                  <div className="text-xs">
                    <p className="font-bold dark:text-zinc-100">Garantie 2 ans</p>
                    <p className="text-zinc-500">Sécurité Eladma</p>
                  </div>
                </div>
              </div>

              {product.isCertified && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                    <div className="relative">
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-800 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Vendeur Certifié Eladma</p>
                    <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">Gold</span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${product.sellerTrustScore}%` }}
                            className="h-full bg-emerald-500" 
                          />
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase">{product.sellerTrustScore}% Trust</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">Vérifié par AI-Scan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Badge Éco-Responsable Carbon Footprint */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/20 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-555 dark:bg-emerald-600 text-emerald-600 dark:text-emerald-355 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0">
                    <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider">
                        {language === 'fr' ? '🌱 Éco-Responsable' : '🌱 Eco-Responsible'}
                      </h4>
                      <span className="bg-emerald-500 text-white text-[9px] font-mono px-2 py-0.5 rounded-full font-black uppercase animate-pulse">
                        -{carbonDetails.carbonSavedPercent}% CO₂
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-0.5 leading-snug">
                      {language === 'fr' 
                        ? "Logistique locale optimisée par rapport au transport international" 
                        : "Optimized local logistics compared to international shipping"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed space-y-2 border-t border-emerald-100 dark:border-emerald-950/40 pt-2.5">
                  <p>
                    {language === 'fr' 
                      ? "En centralisant et distribuant ce produit directement depuis nos hubs physiques locaux d'Eladma (Kananga Ngaza, ou nos points d'appui de Kinshasa Galiema et Lubumbashi route Kasenga), nous limitons drastiquement l'effet de serre induit par le fret aérien international classique."
                      : "By centralizing and distributing this product directly from Eladma's regional hubs (Kananga Ngaza, Kinshasa Galiema facilities, and Lubumbashi route Kasenga stations), we drastically reduce high-altitude aviation greenhouse gas emissions."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-white/70 dark:bg-zinc-900/60 p-2 rounded-xl text-center border border-emerald-100/50 dark:border-emerald-950/20 font-mono">
                    <div>
                      <p className="text-[8px] text-zinc-400 dark:text-zinc-500 uppercase font-black">{language === 'fr' ? 'Cargo Standard' : 'Regular Cargo'}</p>
                      <p className="text-xs font-extrabold text-rose-500">{carbonDetails.carbonStandard.toFixed(1)} kg CO₂</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-emerald-500 uppercase font-black">{language === 'fr' ? 'Hub Local Eladma' : 'Eladma Local Hub'}</p>
                      <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{carbonDetails.carbonLocal.toFixed(1)} kg CO₂</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold p-2 rounded-xl">
                    <span>🌍 {language === 'fr' ? 'Économie d\'empreinte :' : 'Carbon footprint savings :'}</span>
                    <span className="font-black text-xs font-mono text-emerald-600 dark:text-emerald-400">-{carbonDetails.carbonSaved.toFixed(1)} kg</span>
                    <span>CO₂ {language === 'fr' ? 'sauvés !' : 'saved!'}</span>
                  </div>
                </div>
              </div>

              {/* Graphique de suivi de l'évolution des prix sur 30 jours */}
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 px-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                      priceStats.isRising 
                        ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20'
                    }`}>
                      {priceStats.isRising ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {priceStats.priceDiffStr}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Suivi des prix</h4>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">30 derniers jours</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-white dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Min</p>
                    <p className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">{formatPrice(priceStats.minPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Max</p>
                    <p className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">{formatPrice(priceStats.maxPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-semibold">Tendance</p>
                    <p className={`text-[10px] font-extrabold flex items-center justify-center gap-0.5 ${priceStats.isRising ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {priceStats.isRising ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {priceStats.isRising ? 'Hausse' : 'Saison basse'}
                    </p>
                  </div>
                </div>

                {/* Bloc Graphique Recharts */}
                <div className="w-full h-40 mt-2 select-none font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={priceHistory}
                      margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4F01" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#FF4F01" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:hidden opacity-40" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" className="hidden dark:block opacity-40" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false}
                        fontSize={9}
                        tick={{ fill: '#888888', fontWeight: 500 }}
                        interval={4}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false}
                        fontSize={9}
                        tick={{ fill: '#888888', fontWeight: 500 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => formatPrice(v).split(',')[0]}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-900 border border-zinc-800 text-white p-2 rounded-xl text-xs shadow-xl font-sans">
                                <p className="text-[9px] text-zinc-400 font-bold mb-0.5">
                                  {payload[0].payload.name === 'Auj.' ? "Aujourd'hui" : `Il y a ${30 - parseFloat(payload[0].payload.name.replace('J-', ''))} jours`}
                                </p>
                                <p className="font-extrabold text-[#FF4F01]">{formatPrice(payload[0].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#FF4F01" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      haptics.heavy();
                      sounds.success();
                      onBuyNow(product);
                    }}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Zap className="w-5 h-5 fill-current" />
                    Acheter maintenant
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="px-5 py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    title={language === 'fr' ? "Plus d'options de partage" : "More share options"}
                    id="product-share-btn"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs">
                      {language === 'fr' ? "Lien" : "Link"}
                    </span>
                  </button>
                </div>

                {/* Groupe de partage réseaux sociaux direct */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <Share2 className="w-3.5 h-3.5 text-brand" /> {language === 'fr' ? "Partager sur vos réseaux" : "Share details on socials"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Partager sur WhatsApp */}
                    <button
                      onClick={handleShareWhatsApp}
                      className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      title={language === 'fr' ? "Partager sur WhatsApp avec description et prix" : "Share on WhatsApp with description and price"}
                    >
                      <svg className="w-4 h-4 fill-current shrink-0 text-emerald-500" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.022-.08-.124-.132-.262-.202-.138-.07-1.182-.583-1.365-.649-.182-.065-.315-.1-.45.1-.133.197-.52.65-.637.785-.117.135-.235.15-.472.03-.237-.12-1.002-.37-1.91-1.18-.707-.63-1.183-1.41-1.322-1.649-.14-.238-.015-.367.104-.486.108-.107.237-.275.355-.412.12-.138.16-.23.237-.384.077-.154.038-.288-.02-.407-.058-.12-.45-1.085-.615-1.485-.162-.392-.325-.34-.45-.348-.117-.008-.25-.01-.382-.01-.133 0-.35.05-.533.25-.183.2-.7 0 .685-.7 1.705 0 .17.3 1.13 0 .43.2 0 .52.04.66.19c.14.15.54.85.58.91c.04.06.07.13.06.2c-.02.07-.15.22-.24.33-.1.11-.2.24-.31.35c-.12.12-.24.25-.1.49c.14.24.63 1.03 1.34 1.66c.92.8 1.7 1.05 1.94 1.17c.24.12.38.1.52-.06c.14-.17.6-.7.76-.94c.16-.24.32-.2.54-.12c.22.08 1.4.66 1.64.78c.24.12.39.18.45.28c.06.1.06.57-.16 1.2c-.22.63-1.28 1.24-1.78 1.29c-.5.05-1.1.02-3.1-1.06c-2.4-1.3-3.9-3.75-4-3.95c-.1-.2-1.7-2.25-1.7-4.3c0-2.05 1.05-3.05 1.45-3.45c.4-.4.8-.5 1-.5c.2 0 .4 0 .58.01c.18.01.4-.07.63.15c.23.22.88 2.15.96 2.3c.08.15.08.33-.02.5c-.1.17-.2.28-.35.45c-.15.17-.3.38-.43.5c-.15.15-.3.32-.12.63c.18.3 1.2 1.95 2.6 3.1c1.3 1.05 2.45 1.35 2.8 1.5c.35.15.55.12.75-.1c.2-.23.85-.98 1.08-1.3c.23-.33.45-.28.75-.16H17.472zM12 2C6.478 2 2 6.478 2 12c0 1.91.5 3.71 1.45 5.28L2.1 21.9l4.75-1.25C8.29 21.55 10.1 22 12 22c5.522 0 10-4.478 10-10S17.522 2 12 2z"/>
                      </svg>
                      <span>WhatsApp</span>
                    </button>

                    {/* Partager sur Facebook */}
                    <button
                      onClick={handleShareFacebook}
                      className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      title={language === 'fr' ? "Partager sur Facebook" : "Share on Facebook"}
                    >
                      <svg className="w-4 h-4 fill-current shrink-0 text-blue-500" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      haptics.success();
                      sounds.success();
                      onAddToCart(product);
                    }}
                    className="flex-1 py-4 bg-brand/10 text-brand rounded-xl font-bold hover:bg-brand/20 transition-all flex items-center justify-center gap-3"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Ajouter au panier
                  </button>

                  <button 
                    onClick={() => {
                      haptics.light();
                      sounds.select();
                      toggleFavorite(product.id, product.name);
                    }}
                    className={`px-5 py-4 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isFavorite(product.id)
                        ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                    title={isFavorite(product.id) ? "Retirer de ma liste d'envies" : "Ajouter à ma liste d'envies"}
                    id="wishlist-toggle-modal-btn"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="hidden sm:inline text-xs">
                      {isFavorite(product.id) ? "Dans ma liste" : "Liste d'envies"}
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      toggleTracking(product.id, product.name);
                    }}
                    className={`px-5 py-4 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                      isTracked
                        ? 'border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                    title={isTracked ? "Arrêter de suivre le prix" : "Suivre les baisses de prix"}
                    id="price-tracker-toggle-modal-btn"
                  >
                    <Bell className={`w-5 h-5 ${isTracked ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span className="text-xs">
                      {isTracked ? "Suivi actif" : "Suivre le prix"}
                    </span>
                  </button>
                </div>

                {/* Leave a review button */}
                <button 
                  onClick={() => {
                    haptics.medium();
                    sounds.open();
                    setIsReviewOpen(true);
                    setTimeout(() => {
                      const reviewsSection = document.getElementById('reviews-section');
                      if (reviewsSection) {
                        reviewsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="w-full py-3.5 border border-dashed border-zinc-300 dark:border-zinc-700/80 text-zinc-650 dark:text-zinc-300 hover:text-brand hover:border-brand dark:hover:text-[#FF4F01] dark:hover:border-[#FF4F01]/70 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
                  id="leave-review-main-btn"
                >
                  <MessageSquare className="w-4 h-4 text-brand dark:text-[#FF4F01]" />
                  Laisser un avis sur cet article
                </button>
              </div>
              <div className="mt-10" id="reviews-section">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold dark:text-white">Avis des clients</h3>
                  <button 
                    onClick={() => {
                      haptics.medium();
                      sounds.open();
                      setIsReviewOpen(!isReviewOpen);
                    }}
                    className="text-sm font-bold text-brand hover:underline"
                  >
                    Laisser un avis
                  </button>
                </div>

                <AnimatePresence>
                  {isReviewOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-8"
                    >
                      <form onSubmit={handleSubmitReview} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Votre nom"
                            value={newReview.user}
                            onChange={(e) => setNewReview({...newReview, user: e.target.value})}
                            required
                            className="bg-white dark:bg-zinc-900 border-none rounded-xl h-10 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand/20"
                          />
                          <select 
                            value={newReview.rating}
                            onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                            className="bg-white dark:bg-zinc-900 border-none rounded-xl h-10 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand/20"
                          >
                            {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Étoiles</option>)}
                          </select>
                        </div>
                        <textarea 
                          placeholder="Votre avis sur ce produit..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                          required
                          rows={3}
                          className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl p-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                        ></textarea>
                        <button className="w-full py-2 bg-brand text-white font-bold rounded-xl text-sm">
                          Publier l'avis
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-6">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm dark:text-zinc-100">{review.user}</div>
                        <div className="text-[10px] text-zinc-400">{review.date}</div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
