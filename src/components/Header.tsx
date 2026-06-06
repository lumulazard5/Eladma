import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, User, Menu, Sparkles, Moon, Sun, ArrowRight, Gift, BookOpen, Wifi, WifiOff, Globe, Coins, Heart, Mic, MicOff, Settings, Camera, Bell, Trash2, Check } from 'lucide-react';
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
  onOpenImageSearch
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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate('categories')} 
            className="lg:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:text-brand transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button onClick={onGoHome} className="flex items-center gap-2 group">
            <h1 className="text-2xl font-black tracking-tighter text-brand flex items-center gap-1 group-hover:scale-105 transition-transform">
              Eladma
            </h1>
            <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-95 shrink-0">
              RDC
            </span>
          </button>

          {/* Quick Simulated Live Exchange Rate Ticker Badge (Only on larger screens) */}
          <div className="hidden xl:flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 rounded-full px-2.5 py-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            <span>Marché RDC : 1 $ = {exchangeRates.usdToCdf} FC</span>
          </div>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl hidden md:flex relative group">
          <input
            type="text"
            value={query}
            placeholder={t.searchPlaceholder}
            className="w-full h-11 pl-5 pr-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-brand/20 focus:bg-white dark:focus:bg-zinc-950 transition-all outline-none text-sm dark:text-white shadow-inner"
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
          <button
            type="button"
            onClick={() => { haptics.heavy(); onOpenImageSearch?.(); }}
            className="absolute right-21 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-brand hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded-xl transition-all duration-300"
            title={language === 'en' ? "Search by image" : "Recherche par image"}
          >
            <Camera className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={toggleListening}
            className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500/50 scale-105'
                : 'text-zinc-400 hover:text-brand hover:bg-zinc-200 dark:hover:bg-zinc-850'
            }`}
            title={language === 'en' ? "Hands-free voice search" : "Recherche vocale mains libres"}
          >
            {isListening ? (
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <Mic className="relative w-4 h-4 text-white" />
              </span>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button 
            onClick={() => {
              haptics.heavy();
              onSearch(query);
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-brand text-white rounded-xl shadow-lg shadow-brand/20"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-2 z-[60]"
              >
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b dark:border-zinc-800 mb-2">
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
                    className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left group/item"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold dark:text-zinc-100 line-clamp-1 group-hover/item:text-brand transition-colors">{product.name}</p>
                      <p className="text-[10px] text-zinc-500">{product.category} • {formatPrice(product.price)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
                <div className="p-2 border-t dark:border-zinc-800 mt-2">
                  <button 
                    onClick={() => setShowSuggestions(false)}
                    className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-brand transition-colors flex items-center justify-center gap-2"
                  >
                    Voir tous les résultats pour "{query}"
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Globe className="w-3.5 h-3.5 text-zinc-500 font-bold" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="fr" className="bg-white dark:bg-zinc-900">FR</option>
              <option value="en" className="bg-white dark:bg-zinc-900">EN</option>
              <option value="ln" className="bg-white dark:bg-zinc-900">LN</option>
              <option value="sw" className="bg-white dark:bg-zinc-900">SW</option>
            </select>
          </div>

          {/* New Interactive Currency Selector Dropdown & Live Rates Board */}
          <div className="relative" ref={ratesPanelRef}>
            <button
              onClick={() => {
                haptics.light();
                sounds.click();
                setShowRatesPanel(!showRatesPanel);
              }}
              className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer text-xs font-black text-zinc-700 dark:text-zinc-300"
              title={language === 'fr' ? "Taux de change en temps réel d'Eladma" : "Eladma real-time exchange rates"}
            >
              <Coins className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-brand'}`} />
              <span>{currency} ({currency === 'CDF' ? 'FC' : currency === 'USD' ? '$' : '€'})</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            </button>

            <AnimatePresence>
              {showRatesPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 p-4 shadow-xl shadow-zinc-200/50 dark:shadow-black/70 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                        {language === 'fr' ? 'Devises & Flux Financier' : 'Currencies & Rates'}
                      </h4>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        {isLive 
                          ? (language === 'fr' ? '● API Directe Active' : '● Live API Feed')
                          : (language === 'fr' ? '● Simulation Locale Active' : '● Offline Simulator Feed')
                        }
                      </p>
                    </div>
                    {/* Refresh Button */}
                    <button
                      type="button"
                      disabled={isRefreshingRates}
                      onClick={async () => {
                        haptics.medium();
                        sounds.select();
                        setIsRefreshingRates(true);
                        try {
                          await refreshRates();
                          toast.success(
                            language === 'fr' 
                              ? "Taux de change en temps réel mis à jour !" 
                              : "Real-time exchange rates updated successfully!"
                          );
                        } catch {
                          toast.error("Erreur de synchronisation, fallback actif.");
                        } finally {
                          setTimeout(() => {
                            setIsRefreshingRates(false);
                          }, 600);
                        }
                      }}
                      className="p-1 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 font-black tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg
                        className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${isRefreshingRates ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {isRefreshingRates ? "..." : (language === 'fr' ? 'MAJ' : 'Sync')}
                    </button>
                  </div>

                  {/* Currencies Buttons Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['CDF', 'USD', 'EUR'] as const).map((curr) => {
                      const isActive = currency === curr;
                      const symbols = { CDF: 'FC', USD: '$', EUR: '€' };

                      return (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => {
                            haptics.medium();
                            sounds.click();
                            setCurrency(curr);
                          }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-brand/10 border-brand text-brand shadow-sm shadow-brand/5'
                              : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="text-sm font-black tracking-tight">{curr}</span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{symbols[curr]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed rates dashboard list */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] font-mono space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/20 p-2.5 rounded-xl">
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-bold">
                      <span>1 EUR (€)</span>
                      <span className="text-zinc-800 dark:text-zinc-100 font-black font-mono">
                        {(exchangeRates.eurToCdf).toLocaleString('fr-FR')} FC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-bold">
                      <span>1 USD ($)</span>
                      <span className="text-zinc-800 dark:text-zinc-100 font-black font-mono">
                        {(exchangeRates.usdToCdf).toLocaleString('fr-FR')} FC
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 font-bold">
                      <span>1 EUR (€)</span>
                      <span className="text-zinc-800 dark:text-zinc-100 font-black font-mono">
                        {exchangeRates.eurToUsd.toFixed(3)} $
                      </span>
                    </div>
                  </div>

                  {/* Status update stamp at bottom */}
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold flex items-center justify-between px-1 bg-white dark:bg-transparent pt-1">
                    <span>
                      {language === 'fr' ? 'Taux rafraîchis :' : 'Rates updated :'}
                    </span>
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-extrabold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {lastUpdated || (language === 'fr' ? 'Temps réel' : 'Real-time')}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => {
              haptics.medium();
              onOpenImageSearch?.();
            }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand transition-all duration-300 relative"
            title={language === 'en' ? "Search by image" : "Recherche par image"}
          >
            <Camera className="w-5 h-5" />
          </button>

          <button 
            onClick={() => {
              haptics.light();
              onToggleDarkMode();
            }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => {
              haptics.medium();
              onOpenSettings();
            }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand transition-colors"
            title="Paramètres d'accessibilité tactile & audio"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button 
            onClick={() => onNavigate('rewards')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors text-xs font-bold"
          >
            <Gift className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t.gifts}</span>
          </button>

          <button 
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-xs font-bold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t.catalog}</span>
          </button>

          <button 
            onClick={onOpenAI}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-brand/10 text-brand hover:bg-brand/20 transition-colors text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.assistant}</span>
          </button>
          
          {/* Price Tracking Alerts Bell Dropdown */}
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
              title="Notifications & Suivi des Prix"
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-amber-500 animate-swing' : ''}`} />
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key="unread-alerts-badge"
                  className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse"
                >
                  {unreadCount}
                </motion.span>
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
                  {/* Popover Header */}
                  <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
                      <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Alertes de Prix</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {alerts.length > 0 && (
                        <button 
                          onClick={() => { haptics.light(); clearAllAlerts(); }}
                          className="p-1 text-zinc-400 hover:text-rose-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                          title="Effacer l'historique"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 text-zinc-400 hover:text-zinc-650 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold font-mono px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Popover Content */}
                  <div className="max-h-[300px] overflow-y-auto py-2 divide-y divide-zinc-100 dark:divide-zinc-900">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2 stroke-[1.5]" />
                        <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-450">Aucune baisse de prix récente</h4>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[240px]">
                          Activez le suivi des prix (🔔) sur les fiches produits pour être notifié d'une baisse.
                        </p>
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const discount = Math.round(((alert.oldPrice - alert.newPrice) / alert.oldPrice) * 100);
                        return (
                          <div 
                            key={alert.id} 
                            className="flex items-start gap-3 p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 rounded-xl transition-colors relative text-left"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-900 relative">
                              <img src={alert.image} alt={alert.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-1 rounded-tl-md">
                                -{discount}%
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-150 truncate leading-tight">
                                  {alert.productName}
                                </h4>
                                <span className="text-[9px] text-zinc-400 shrink-0 font-mono">
                                  {alert.timestamp}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">
                                Grosse baisse ! Le prix est maintenant à <span className="text-emerald-650 dark:text-emerald-400 font-black">{formatPrice(alert.newPrice)}</span>
                              </p>
                              <p className="text-[9px] text-zinc-400 line-through">
                                Ancien prix : {formatPrice(alert.oldPrice)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Testing Console */}
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-900 text-left">
                    <div className="mb-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      🧪 Mode Démo &amp; Testeur
                    </div>
                    <button
                      onClick={() => {
                        haptics.heavy();
                        sounds.select();
                        // Trigger simulated price drop event
                        const randomTrackedId = trackedProductIds.length > 0 
                          ? trackedProductIds[Math.floor(Math.random() * trackedProductIds.length)]
                          : undefined;

                        window.dispatchEvent(new CustomEvent('eladma_trigger_baisse', { detail: { productId: randomTrackedId } }));
                      }}
                      className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                      <span>{trackedProductIds.length > 0 ? "Simuler baisse sur suivi" : "Simuler baisse (Aléatoire)"}</span>
                    </button>
                    <div className="mt-1.5 text-[8.5px] text-center text-zinc-400 dark:text-zinc-500 leading-normal">
                      {trackedProductIds.length > 0 
                        ? `Suivi actif sur ${trackedProductIds.length} produit(s). Cliquez pour forcer une alerte immédiate !`
                        : "Aucun produit dans votre suivi. Cliquez pour forcer une alerte sur un produit aléatoire."
                      }
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => {
              onNavigate('catalog');
              // Trigger event to toggle favoritesOnly filter dynamically
              const event = new CustomEvent('eladma_show_favorites');
              window.dispatchEvent(event);
            }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all relative" 
            title="Mes favoris"
          >
            <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {favorites.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key="favorites-count-badge"
                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
              >
                {favorites.length}
              </motion.span>
            )}
          </button>
          
          <button 
            onClick={() => {
              haptics.light();
              sounds.click();
              onNavigate('profile');
            }}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand hover:scale-110 active:scale-95 transition-all relative" 
            title={t.me}
          >
            <User className="w-5 h-5" />
          </button>
          
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
