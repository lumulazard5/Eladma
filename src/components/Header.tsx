import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, User, Menu, Sparkles, Moon, Sun, ArrowRight, Gift, BookOpen, Wifi, WifiOff, Globe, Coins, Heart, Mic, MicOff, Settings, Camera, Bell, Trash2, Check, ShieldCheck, ChevronDown, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Product } from '../types';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePriceTracker } from '../context/PriceTrackerContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface HeaderProps {
  onSearch: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAI: () => void;
  onGoHome: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: any) => void;
  onOpenImageSearch?: () => void;
  onOpenGoogleChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  cartCount, 
  onOpenCart, 
  onOpenAI, 
  onGoHome, 
  isDarkMode, 
  onToggleDarkMode,
  onOpenSettings,
  products,
  onSelectProduct,
  onNavigate,
  onOpenImageSearch,
  onOpenGoogleChat
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, formatPrice, exchangeRates, isLive, lastUpdated, refreshRates } = useCurrency();
  const { favorites } = useFavorites();
  const { alerts, unreadCount, markAllAlertsAsRead, clearAllAlerts, trackedProductIds } = usePriceTracker();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRatesPanel, setShowRatesPanel] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const ratesPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (ratesPanelRef.current && !ratesPanelRef.current.contains(event.target as Node)) {
        setShowRatesPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      const langMap: Record<string, string> = {
        fr: 'fr-FR',
        en: 'en-US',
        ln: 'fr-CD',
        sw: 'sw-CD'
      };
      
      rec.lang = langMap[language] || 'fr-FR';

      rec.onstart = () => {
        setIsListening(true);
        haptics.medium();
        toast.info(language === 'en' ? "Voice search activated" : "Recherche vocale activée", {
          description: language === 'en' ? "Speak into your microphone..." : "Parlez maintenant dans votre microphone...",
          duration: 3000
        });
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          haptics.success();
          setQuery(transcript);
          onSearch(transcript);
          setShowSuggestions(true);
          toast.success(language === 'en' ? `Searching for: "${transcript}"` : `Recherche de : "${transcript}"`, {
            icon: '🎙️'
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        haptics.error();
        if (event.error === 'not-allowed') {
          toast.error(language === 'en' ? "Permission denied" : "Permission refusée", {
            description: language === 'en' ? "Please allow microphone access in your browser." : "Veuillez autoriser l'accès au microphone dans votre navigateur."
          });
        } else if (event.error === 'no-speech') {
          toast.error(language === 'en' ? "No speech detected" : "Aucun mot détecté", {
            description: language === 'en' ? "We did not hear anything. Please try again." : "Nous n'avons pas capté votre voix. Veuillez réessayer."
          });
        } else {
          toast.error(language === 'en' ? "Speech recognition error" : "Erreur de reconnaissance vocale", {
            description: `${event.error}`
          });
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language, onSearch]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      haptics.error();
      toast.error(language === 'en' ? "Feature unavailable" : "Fonctionnalité indisponible", {
        description: language === 'en' ? "Speech recognition is not supported by your current browser." : "La reconnaissance vocale n'est pas supportée par votre navigateur actuel."
      });
      return;
    }

    haptics.light();
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        try {
          recognitionRef.current?.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (e) {
          toast.error(language === 'en' ? "Failed to start listening" : "Impossible de lancer l'écoute", {
            description: language === 'en' ? "Please try again." : "Veuillez réessayer."
          });
        }
      }
    }
  };

  const suggestions = query.length >= 2 
    ? products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (val: string) => {
    haptics.light();
    setQuery(val);
    onSearch(val);
    setShowSuggestions(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-sm">
      {/* LEVEL 1: TOP BAR (UTILITY & MARKET DATA) */}
      <div className="w-full bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 py-2">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Market Status Ticker */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 whitespace-nowrap bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              Marché RDC : 1 $ = {exchangeRates.usdToCdf} FC
            </span>
            <span className="hidden md:inline opacity-30 select-none">|</span>
            <span className="hidden md:inline whitespace-nowrap text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">
              ⚡ Sourcing Direct de Kananga (Ngaza, Camp Vangu, Katoka)
            </span>
          </div>

          {/* Quick Utility Tools */}
          <div className="flex items-center gap-4 shrink-0 justify-center sm:justify-end">
            {/* Language Selection */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 rounded-lg border border-zinc-200/40 dark:border-zinc-800/60">
              <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border-none text-[10px] font-black text-zinc-600 dark:text-zinc-350 focus:outline-none cursor-pointer hover:text-brand transition-colors"
              >
                <option value="fr" className="bg-white dark:bg-zinc-900">FR (Français)</option>
                <option value="en" className="bg-white dark:bg-zinc-900">EN (English)</option>
                <option value="ln" className="bg-white dark:bg-zinc-900">LN (Lingala)</option>
                <option value="sw" className="bg-white dark:bg-zinc-900">SW (Swahili)</option>
              </select>
            </div>

            {/* Accessibility Settings Cog */}
            <button 
              onClick={() => { haptics.medium(); onOpenSettings(); }}
              className="hover:text-brand text-zinc-400 dark:text-zinc-550 transition-colors"
              title="Paramètres d'accessibilité tactile & audio"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Dark Mode Theme Toggle */}
            <button 
              onClick={() => { haptics.light(); onToggleDarkMode(); }}
              className="p-1 hover:text-brand text-zinc-400 dark:text-zinc-550 transition-colors"
              title={language === 'en' ? "Toggle Dark/Light Mode" : "Basculer mode sombre/clair"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* LEVEL 2: MAIN BRAND HEADER, SEARCH & NAVIGATION */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Core Branding */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('categories')} 
            className="lg:hidden p-2 -ml-2 text-zinc-650 dark:text-zinc-400 hover:text-brand transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <button onClick={onGoHome} className="flex items-center gap-2 group shrink-0">
            <h1 className="text-2xl font-black tracking-tighter text-brand flex items-center gap-1 group-hover:scale-[1.03] transition-transform">
              Eladma
            </h1>
            <span className="text-[9px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-95 shrink-0">
              RDC
            </span>
          </button>
        </div>

        {/* Major Horizontal Navigation Tabs (Hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-1">
          <button 
            onClick={onGoHome}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-zinc-650 dark:text-zinc-350 hover:text-brand hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </button>
          <button 
            onClick={() => onNavigate('catalog')}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-zinc-650 dark:text-zinc-350 hover:text-brand hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
          >
            {t.catalog}
          </button>
          <button 
            onClick={() => onNavigate('cooperatives')}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-zinc-650 dark:text-zinc-350 hover:text-brand hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all"
          >
            {language === 'en' ? 'Cooperatives' : 'Coopératives'}
          </button>
          <button 
            onClick={() => onNavigate('rewards')}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-zinc-650 dark:text-zinc-350 hover:text-brand hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{t.gifts}</span>
          </button>
          <button 
            onClick={onOpenAI}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-brand/90 hover:text-brand hover:bg-brand/5 dark:hover:bg-brand/10 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{t.assistant}</span>
          </button>
          <button 
            onClick={() => {
              onNavigate('admin');
              toast.success(language === 'en' ? "Portail Admin Activated" : "Sécurité & Contrôles d'Administration active", {
                description: "Vérifications de conformité et inspection active de l'AntiCloningSentinel."
              });
            }}
            className="px-3.5 py-1.5 text-xs font-black tracking-wider uppercase text-zinc-950 dark:text-brand hover:text-white hover:bg-brand dark:hover:text-white dark:hover:bg-brand border border-zinc-200 dark:border-brand/20 rounded-xl transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Portail Admin</span>
          </button>
        </nav>

        {/* Integrated Search Box */}
        <div ref={searchRef} className="flex-1 max-w-sm hidden md:flex relative group">
          <input
            type="text"
            value={query}
            placeholder={t.searchPlaceholder}
            className="w-full h-10 pl-4 pr-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-zinc-950 transition-all outline-none text-xs dark:text-white shadow-inner"
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                haptics.heavy();
                onSearch(query);
                setShowSuggestions(false);
              }
            }}
          />
          {/* Camera Search Button */}
          <button
            type="button"
            onClick={() => { haptics.heavy(); onOpenImageSearch?.(); }}
            className="absolute right-16 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-brand hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded-lg transition-all"
            title={language === 'en' ? "Search by image" : "Recherche par image"}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          {/* Hands Free Voice Search Button */}
          <button 
            type="button"
            onClick={toggleListening}
            className={`absolute right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-zinc-400 hover:text-brand hover:bg-zinc-250 dark:hover:bg-zinc-855'
            }`}
            title={language === 'en' ? "Hands-free voice search" : "Recherche vocale mains libres"}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
          {/* Search Trigger */}
          <button 
            onClick={() => {
              haptics.heavy();
              onSearch(query);
              setShowSuggestions(false);
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-brand text-white rounded-lg shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-2 z-[60]"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-450 uppercase tracking-widest border-b dark:border-zinc-800 mb-1.5">
                  Suggestions de produits
                </div>
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      setShowSuggestions(false);
                      setQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left group/item"
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-zinc-100">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-zinc-100 truncate group-hover/item:text-brand transition-colors">{product.name}</p>
                      <p className="text-[10px] text-zinc-500">{product.category} • {formatPrice(product.price)}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary Interactive Cart, Profile, Coins, & Notifications Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Real-Time Coins & Rates Dropdown */}
          <div className="relative" ref={ratesPanelRef}>
            <button
              onClick={() => {
                haptics.light();
                sounds.click();
                setShowRatesPanel(!showRatesPanel);
              }}
              className="flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
              title={language === 'fr' ? "Marchés et devises RDC" : "USD/CDF/EUR exchange rates"}
            >
              <Coins className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-brand'}`} />
              <span className="text-[11px] font-black">{currency}</span>
              <ChevronDown className="w-3 h-3 text-zinc-450" />
            </button>

            <AnimatePresence>
              {showRatesPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xl z-50 space-y-3 text-left"
                >
                  <div className="flex items-center justify-between border-b border-zinc-101 dark:border-zinc-800/80 pb-2.5">
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-805 dark:text-zinc-100">
                        {language === 'fr' ? 'Devises & Flux Financier' : 'Currencies & Rates'}
                      </h4>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        {isLive ? '● API En Direct' : '● Mode Simulation'}
                      </p>
                    </div>
                    {/* Synchronize Button */}
                    <button
                      type="button"
                      disabled={isRefreshingRates}
                      onClick={async () => {
                        haptics.medium();
                        sounds.select();
                        setIsRefreshingRates(true);
                        try {
                          await refreshRates();
                          toast.success(language === 'fr' ? "Taux mis à jour !" : "Rates updated!");
                        } catch {
                          toast.error("Échec de synchronisation.");
                        } finally {
                          setTimeout(() => setIsRefreshingRates(false), 600);
                        }
                      }}
                      className="p-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-[9px] text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer animate-pulse"
                    >
                      {isRefreshingRates ? "..." : "Sync"}
                    </button>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['CDF', 'USD', 'EUR'] as const).map((curr) => {
                      const isActive = currency === curr;
                      const symbols = { CDF: 'FC', USD: '$', EUR: '€' };
                      return (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => { haptics.medium(); sounds.click(); setCurrency(curr); }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-brand/10 border-brand text-brand font-black'
                              : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/40 border-zinc-205 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350'
                          }`}
                        >
                          <span className="text-xs font-black">{curr}</span>
                          <span className="text-[8px] font-bold text-zinc-400">{symbols[curr]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Rates Board */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono space-y-1.5 bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-xl">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>1 USD ($)</span>
                      <span className="text-zinc-850 dark:text-zinc-150 font-black">
                        {(exchangeRates.usdToCdf).toLocaleString('fr-FR')} FC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500">
                      <span>1 EUR (€)</span>
                      <span className="text-zinc-850 dark:text-zinc-150 font-black">
                        {(exchangeRates.eurToCdf).toLocaleString('fr-FR')} FC
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Image search camera shortcut */}
          <button 
            onClick={() => { haptics.medium(); onOpenImageSearch?.(); }}
            className="md:hidden p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand"
            title="Recherche par image"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Favorites Heart Icon */}
          <button 
            onClick={() => {
              onNavigate('catalog');
              window.dispatchEvent(new CustomEvent('eladma_show_favorites'));
            }}
            className="p-1.5 text-zinc-650 dark:text-zinc-400 hover:text-red-550 hover:scale-110 active:scale-95 transition-all relative"
            title="Mes favoris"
          >
            <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Price Drop Notification Bell Trigger */}
          <div ref={notificationsRef} className="relative flex items-center">
            <button 
              onClick={() => {
                haptics.medium();
                sounds.open();
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  markAllAlertsAsRead();
                }
              }}
              className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-500 hover:scale-110 active:scale-95 transition-all relative"
              title="Alertes Prix & Notifications"
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-550 animate-swing' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[70] p-1 text-left"
                >
                  <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-500" />
                      <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Alertes de Prix</h3>
                    </div>
                    {alerts.length > 0 && (
                      <button 
                        onClick={() => { haptics.light(); clearAllAlerts(); }}
                        className="p-1 text-zinc-400 hover:text-rose-500 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-[200px] overflow-y-auto py-2 divide-y divide-zinc-105 dark:divide-zinc-900">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mb-2" />
                        <h4 className="text-xs font-bold text-zinc-650 dark:text-zinc-450">Aucune baisse de prix</h4>
                        <p className="text-[9px] text-zinc-400 mt-1 max-w-[200px]">Activez le suivi par cloche (🔔) sur les produits.</p>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const discount = Math.round(((alert.oldPrice - alert.newPrice) / alert.oldPrice) * 100);
                        return (
                          <div key={alert.id} className="flex items-start gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-xl transition-colors">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 relative">
                              <img src={alert.image} alt={alert.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[7px] font-black px-1 rounded-tl-md">
                                -{discount}%
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-150 truncate leading-tight">{alert.productName}</h4>
                                <span className="text-[9px] text-zinc-400 font-mono">{alert.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">Le prix est à <span className="text-emerald-500 font-black">{formatPrice(alert.newPrice)}</span></p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Demo Tool Block */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-101 dark:border-zinc-900 text-left">
                    <button
                      onClick={() => {
                        haptics.heavy();
                        sounds.select();
                        const randomTrackedId = trackedProductIds.length > 0 ? trackedProductIds[Math.floor(Math.random() * trackedProductIds.length)] : undefined;
                        window.dispatchEvent(new CustomEvent('eladma_trigger_baisse', { detail: { productId: randomTrackedId } }));
                      }}
                      className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center gap-1 shadow-md shadow-amber-500/10 transition-all uppercase tracking-wide cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 fill-current" />
                      <span>{trackedProductIds.length > 0 ? "Forcer baisse sur suivi" : "Simuler baisse prix"}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Google Chat Center Toggle */}
          <button 
            onClick={onOpenGoogleChat}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand hover:scale-105 transition-all relative"
            title="Centre de Discussion Google Chat"
          >
            <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
          </button>

          {/* User Profile Shortcut Icon */}
          <button 
            onClick={() => { haptics.light(); sounds.click(); onNavigate('profile'); }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand hover:scale-105 transition-all"
            title="Mon Profil & Commandes"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Shopping Cart Drawer Badge Trigger */}
          <button 
            onClick={onOpenCart}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
