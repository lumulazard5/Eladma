import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitCompare, X, Trash2, ShoppingCart, Zap, Check, Star, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Product } from '../types';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

export const ComparePanel: React.FC<{ 
  onAddToCart: (p: Product) => void;
  onOpenDetails: (p: Product) => void;
}> = ({ onAddToCart, onOpenDetails }) => {
  const { language } = useLanguage();
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const { formatPrice } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(false);

  if (compareProducts.length === 0) return null;

  // Localized general texts for the compare widget
  const translations = {
    fr: {
      barTitle: "Comparatif de Produits",
      barSubtitle: "Sélectionnez jusqu'à 3 produits pour analyser les différences.",
      compareBtn: "Comparer",
      clearBtn: "Vider",
      closeBtn: "Fermer",
      hidePanel: "Réduire le comparateur",
      headSpecifications: "Caractéristiques",
      headEcoBadges: "Engagement Écologique",
      headSeller: "Artisan & Vendeur",
      trustScore: "Indice de confiance",
      localOrigin: "Provenance Locale",
      originLabel: "Origine",
      materialLabel: "Matériaux",
      guaranteeLabel: "Garantie de réparation",
      durabilityLabel: "Cycle de vie",
      emptySlot: "Ajoutez un autre produit pour comparer",
      actionsHead: "Actions et achat",
      buyBtn: "Ajouter au panier",
      viewBtn: "Fiche produit",
      ecoScoreLabel: "Score Bio / Éthique",
    },
    en: {
      barTitle: "Product Comparison",
      barSubtitle: "Select up to 3 products to evaluate specs side-by-side.",
      compareBtn: "Compare Now",
      clearBtn: "Clear All",
      closeBtn: "Close",
      hidePanel: "Hide comparator",
      headSpecifications: "Specifications",
      headEcoBadges: "Green & Ethical Badges",
      headSeller: "Artisan & Seller",
      trustScore: "Seller Trust Score",
      localOrigin: "Local Heritage",
      originLabel: "Origin",
      materialLabel: "Materials used",
      guaranteeLabel: "Repair Guarantee",
      durabilityLabel: "Product Lifecycle",
      emptySlot: "Add another product to compare",
      actionsHead: "Actions",
      buyBtn: "Add to cart",
      viewBtn: "View product",
      ecoScoreLabel: "Eco-Ethical Rating",
    },
    ln: {
      barTitle: "Komekisa Biloko",
      barSubtitle: "Poná biloko tii 3 mpo na kotala bokeseni na yango.",
      compareBtn: "Komekisa",
      clearBtn: "Longola nionso",
      closeBtn: "Kanga",
      hidePanel: "Kanga komekisa",
      headSpecifications: "Bizaleli ya eloko",
      headEcoBadges: "Makambo ya bomoyi malamu",
      headSeller: "Moteki & Mosali",
      trustScore: "Talon d'élites",
      localOrigin: "Mosala ya Mboka",
      originLabel: "Mboka ewuti",
      materialLabel: "Biloko basali na yango",
      guaranteeLabel: "Garantie ya bobongisi",
      durabilityLabel: "Bomoyi ya sika",
      emptySlot: "Bakisa eloko mosusu mpo na komekisa",
      actionsHead: "Misala",
      buyBtn: "Koma na panier",
      viewBtn: "Tala eloko",
      ecoScoreLabel: "Talon ya mboka",
    },
    sw: {
      barTitle: "Ulinganisho wa Bidhaa",
      barSubtitle: "Chagua hadi bidhaa 3 ili kutathmini tofauti zao kwa pamoja.",
      compareBtn: "Linganisha Sasa",
      clearBtn: "Sura Zote",
      closeBtn: "Funga",
      hidePanel: "Ficha ulinganishaji",
      headSpecifications: "Vigezo vya Bidhaa",
      headEcoBadges: "Beji za Kiikolojia",
      headSeller: "Muuzaji & Fundi",
      trustScore: "Alama ya uaminifu",
      localOrigin: "Asili ya Kienyeji",
      originLabel: "Mahali ilipo",
      materialLabel: "Nyenzo zilizotumika",
      guaranteeLabel: "Udhamini wa ukarabati",
      durabilityLabel: "Mzunguko wa maisha",
      emptySlot: "Ongeza bidhaa nyingine ili kulinganisha",
      actionsHead: "Hatua",
      buyBtn: "Weka kwenye kikapu",
      viewBtn: "Angalia bidhaa",
      ecoScoreLabel: "Alama ya Kiikolojia",
    }
  };

  const t = translations[language as keyof typeof translations] || translations.fr;

  // Derive realistic high-end specs for a product dynamically
  const getProductSpecs = (product: Product) => {
    const isArtisanat = product.category?.toLowerCase().includes('artisan') || product.isLocal;
    const isElec = product.category?.toLowerCase().includes('elec') || product.category?.toLowerCase().includes('phone') || product.category?.toLowerCase().includes('head');
    const isFashion = product.category?.toLowerCase().includes('fash') || product.category?.toLowerCase().includes('mod') || product.category?.toLowerCase().includes('veste');

    if (isArtisanat) {
      return {
        material: language === 'fr' ? "Malachite pure & Bois d'ébène" : "Natural Malachite & Ebony Wood",
        durability: language === 'fr' ? "Fait main, durable à vie" : "Handcrafted, lifetime durability",
        guarantee: language === 'fr' ? "Soutien réparation locale" : "Local artisan repairs supported",
        origin: product.seller || (language === 'fr' ? "Kananga, Kasaï-Central" : "Kananga, DRC")
      };
    } else if (isElec) {
      return {
        material: language === 'fr' ? "Métaux nobles, aluminium recyclé" : "Noble metals & recycled aluminum",
        durability: language === 'fr' ? "Énergie économe A+" : "Highly energy-efficient A+",
        guarantee: language === 'fr' ? "Garantie 2 ans, pièces disponibles" : "2 years warranty, local parts",
        origin: "Eladma Hub Kinshasa"
      };
    } else if (isFashion) {
      return {
        material: language === 'fr' ? "100% coton bio & Teintures naturelles" : "100% Organic cotton, herbal dyes",
        durability: language === 'fr' ? "Fibre résistante renforcée" : "Reinforced heavy-duty premium fiber",
        guarantee: language === 'fr' ? "Garanti sans micro-plastiques" : "Guaranteed micro-plastic free",
        origin: language === 'fr' ? "Ateliers d'art éthique, Kinshasa" : "Ethical Art studio, Kinshasa"
      };
    }

    // Default general
    return {
      material: language === 'fr' ? "Eco-conçu durable" : "Eco-designed durable content",
      durability: language === 'fr' ? "Haute qualité & Recyclable" : "High longevity & Recyclable",
      guarantee: language === 'fr' ? "Garantie sérénité Eladma" : "Eladma official backing",
      origin: product.seller || "République Démocratique du Congo"
    };
  };

  // Eco badges builder
  const getEcoBadges = (product: Product) => {
    const badges: string[] = [];
    if (product.isLocal) {
      badges.push(language === 'fr' ? "🌍 Zéro Pollution Importation" : "🌍 Low-carbon Transport");
      badges.push(language === 'fr' ? "🤝 Commerce 100% Équitable" : "🤝 100% Direct Fair-trade");
    } else {
      badges.push(language === 'fr' ? "📦 Emballage Sans Plastique" : "📦 Plastic-free Packaging");
    }

    // Category specifics
    const isArtisanat = product.category?.toLowerCase().includes('artisan') || product.isLocal;
    const isElec = product.category?.toLowerCase().includes('elec') || product.category?.toLowerCase().includes('phone') || product.category?.toLowerCase().includes('head');

    if (isArtisanat) {
      badges.push(language === 'fr' ? "🌱 100% Biodégradable" : "🌱 100% Biodegradable");
      badges.push(language === 'fr' ? "🎨 Fait main traditionnel" : "🎨 Ancestral craftsmanship");
    } else if (isElec) {
      badges.push(language === 'fr' ? "🔋 Consommation faible" : "🔋 Ultra Low standby energy");
      badges.push(language === 'fr' ? "🛠️ Indice de réparabilité 9/10" : "🛠️ Repair index 9/10");
    } else {
      badges.push(language === 'fr' ? "🌻 Teinture végétale saine" : "🌻 Eco organic dye safe");
    }

    return badges;
  };

  return (
    <>
      {/* 1. FLOATING MINI BAR (Visible when items selected, but not expanded) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-[72px] md:bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-zinc-900/95 dark:bg-zinc-950/98 backdrop-blur-md text-white px-5 py-4 rounded-3xl flex items-center justify-between gap-4 shadow-2xl shadow-black/40 border border-zinc-850 z-[80]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand rounded-xl shadow-md flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-100 flex items-center gap-1.5 leading-none">
                  {t.barTitle}
                  <span className="bg-brand text-white px-1.5 py-0.5 rounded-full text-[10px] font-black font-sans leading-none">
                    {compareProducts.length}
                  </span>
                </h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 hidden sm:block">
                  {t.barSubtitle}
                </p>
              </div>
            </div>

            {/* Selected items mini thumbnails */}
            <div className="flex items-center gap-1.5">
              {compareProducts.map(p => (
                <div key={p.id} className="relative group/mini w-9 h-9 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-800/85">
                  <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  <button
                    onClick={() => {
                      haptics.light();
                      sounds.click();
                      removeFromCompare(p.id);
                    }}
                    className="absolute inset-0 bg-red-650/80 flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-opacity"
                    title="Retirer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}

              {Array.from({ length: 3 - compareProducts.length }).map((_, index) => (
                <div key={index} className="w-9 h-9 rounded-lg border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-650">
                  <span className="text-[11px] font-black">+</span>
                </div>
              ))}
            </div>

            {/* Actions for mini-bar */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  haptics.medium();
                  sounds.select();
                  setIsExpanded(true);
                }}
                className="bg-brand hover:bg-brand-dark hover:scale-103 transition-all px-4 h-9 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-brand/20 flex items-center gap-1.5 text-white"
              >
                <span>{t.compareBtn}</span>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  clearCompare();
                }}
                className="p-2 px-3 text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
              >
                {t.clearBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAJESTIC EXPANDED FULL COMPARE WINDOW BOARD OVERLAY */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md z-[110] overflow-y-auto p-4 md:p-8 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-5xl bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-150 dark:border-zinc-850 overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[90vh]"
            >
              {/* Overlay Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      {t.barTitle}
                      <span className="bg-[#FF4F01] text-white px-2 py-0.5 rounded-full text-xs font-black font-sans">
                        {compareProducts.length}/3
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                      {t.barSubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      haptics.light();
                      clearCompare();
                      setIsExpanded(false);
                    }}
                    className="p-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:border-red-500/20 dark:hover:text-red-500 transition-all cursor-pointer"
                  >
                    {t.clearBtn}
                  </button>
                  <button
                    onClick={() => {
                      haptics.light();
                      sounds.click();
                      setIsExpanded(false);
                    }}
                    className="p-2.5 bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-zinc-600 dark:text-zinc-300"
                    title={t.closeBtn}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Side-by-side Comparative Table Scroll View */}
              <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800">
                      {/* First column reserved for row headers */}
                      <th className="w-1/4 pb-6 text-left text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none">
                        {translations[language as keyof typeof translations]?.headSpecifications || translations.fr.headSpecifications}
                      </th>

                      {/* Side by side product head item structures */}
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) {
                          return (
                            <th key={`empty-head-${idx}`} className="w-1/4 px-4 pb-6 text-center text-xs text-zinc-300 dark:text-zinc-700 font-bold select-none border-l border-zinc-100 dark:border-zinc-900">
                              <div className="border-2 border-dashed border-zinc-250 dark:border-zinc-850/80 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[140px]">
                                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 font-bold text-xs mb-2">+</div>
                                <span className="max-w-[120px] leading-relaxed text-[11px] block text-zinc-400 dark:text-zinc-600">{t.emptySlot}</span>
                              </div>
                            </th>
                          );
                        }

                        return (
                          <th key={product.id} className="w-1/4 px-4 pb-6 text-left border-l border-zinc-150 dark:border-zinc-850/80 relative">
                            <div className="space-y-3 relative group">
                              {/* Remove button */}
                              <button
                                onClick={() => {
                                  haptics.light();
                                  sounds.click();
                                  removeFromCompare(product.id);
                                }}
                                className="absolute top-0 right-0 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                title="Retirer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Thumbnail preview */}
                              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                                <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={product.name} />
                              </div>

                              <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-snug line-clamp-2 uppercase">
                                  {product.name}
                                </h3>
                                <p className="text-[10px] bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 text-zinc-600 px-2 py-0.5 rounded-md inline-block font-sans font-extrabold mt-1 tracking-wider">
                                  {product.category}
                                </p>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {/* ROW: PRICE RANGE */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">
                        Prix
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 font-mono">
                            <div className="text-lg font-black text-brand tracking-tight">
                              {formatPrice(product.price)}
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none font-sans font-bold">
                              {language === 'fr' ? 'Livraison gratuite RDC' : 'Free local delivery'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: RATINGS & SATISFACTION */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">
                        Évaluation
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-sm font-black">{product.rating}</span>
                              </div>
                              <span className="text-zinc-400 text-xs font-semibold">({product.reviewCount} {language === 'fr' ? 'avis' : 'reviews'})</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: SELLER & TRUST */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        {t.headSeller}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 space-y-1.5">
                            <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                              {product.seller || "Partenaire Eladma"}
                              {product.isCertified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                            </div>
                            
                            {product.sellerTrustScore ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
                                  <span>{t.trustScore}</span>
                                  <span className="text-emerald-500 font-mono font-black">{product.sellerTrustScore}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${product.sellerTrustScore}%` }} />
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold italic leading-none">
                                {language === 'fr' ? 'Artisan d\'excellence locale' : 'Certified local handcraft'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: SPECIFICATION 1: MATERIALS */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-snug">
                        {t.materialLabel}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        const specs = getProductSpecs(product);
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 text-xs font-bold text-zinc-750 dark:text-zinc-350">
                            {specs.material}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: SPECIFICATION 2: ORIGIN */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">
                        {t.originLabel}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        const specs = getProductSpecs(product);
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 text-xs font-bold text-zinc-750 dark:text-zinc-350 flex items-center gap-1">
                            {product.isLocal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}
                            <span>{specs.origin}</span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: SPECIFICATION 3: CYCLE LIFE */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-snug">
                        {t.durabilityLabel}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        const specs = getProductSpecs(product);
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 text-xs font-bold text-zinc-750 dark:text-zinc-350">
                            {specs.durability}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: ECO RESPONSIBLE / GREEN ENGAGEMENTS */}
                    <tr className="border-b border-zinc-150 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        {t.headEcoBadges}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-4 border-l border-zinc-100 dark:border-zinc-900" />;
                        const bList = getEcoBadges(product);
                        return (
                          <td key={product.id} className="py-4 px-4 border-l border-zinc-150 dark:border-zinc-850 text-xs font-bold space-y-1.5">
                            {bList.map((badge, bIdx) => (
                              <div key={bIdx} className="inline-flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/25 text-emerald-850 dark:text-emerald-355 p-1.5 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider select-none leading-none w-full border border-emerald-500/20">
                                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{badge}</span>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>

                    {/* ROW: ACTIONS (BUYING & CARTING) */}
                    <tr>
                      <td className="py-6 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                        {t.actionsHead}
                      </td>
                      {Array.from({ length: 3 }).map((_, idx) => {
                        const product = compareProducts[idx];
                        if (!product) return <td key={idx} className="py-6 border-l border-zinc-100 dark:border-zinc-900" />;
                        return (
                          <td key={product.id} className="py-6 px-4 border-l border-zinc-150 dark:border-zinc-850">
                            <div className="flex flex-col gap-2.5">
                              <button
                                onClick={() => {
                                  haptics.heavy();
                                  sounds.success();
                                  onAddToCart(product);
                                }}
                                className="w-full h-11 bg-brand hover:bg-brand-dark hover:scale-[1.02] transform transition-all text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand/20 cursor-pointer"
                              >
                                <ShoppingCart className="w-4 h-4 text-white" />
                                <span>{t.buyBtn}</span>
                              </button>
                              <button
                                onClick={() => {
                                  haptics.light();
                                  sounds.open();
                                  onOpenDetails(product);
                                }}
                                className="w-full h-10 border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{t.viewBtn}</span>
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Window Footer summary info */}
              <div className="p-4 px-8 border-t border-zinc-150 dark:border-zinc-850/80 bg-zinc-50/50 dark:bg-zinc-900/30 text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider flex flex-col md:flex-row items-center justify-between gap-2.5">
                <span>
                  {language === 'fr' 
                    ? "⚖️ Analyse impartiale certifiée par l'algorithme d'Eladma Intelligence" 
                    : "⚖️ Unbiased side-by-side analysis certified by Eladma Intelligence engine"}
                </span>
                <span className="flex items-center gap-1 bg-brand/5 dark:bg-brand/10 border border-brand/10 px-2.5 py-1 rounded-full text-brand tracking-widest text-[9px] font-black font-mono">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  Congo-Green Commerce Ethos
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
