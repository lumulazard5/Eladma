import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Settings, 
  Plus, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Link,
  RefreshCcw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Box,
  FileText,
  Upload,
  AlertCircle,
  Building2,
  Fingerprint,
  CreditCard,
  MapPin,
  PenTool,
  Camera,
  UserCheck,
  Check,
  Lock,
  Unlock,
  Eye,
  FileX,
  Scale,
  Calendar,
  Sparkles,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { orderManager, supplierService, Order } from '../services/orderService';
import { SignaturePad } from './SignaturePad';
import { AnimatePresence } from 'motion/react';
import { generateContractPDF } from '../services/pdfService';
import { KYCVerification } from './KYCVerification';
import { useCurrency } from '../context/CurrencyContext';
import { EladmaSecurity } from '../services/security';
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

export interface SupplierProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  status: 'active' | 'inactive';
  image: string;
}

interface SupplierDashboardProps {
  onBack: () => void;
}

type VerificationStatus = 'unregistered' | 'pending' | 'verified';

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ onBack }) => {
  const { formatPrice, currency } = useCurrency();
  const [salesPeriod, setSalesPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState('2026-05-28');
  const [customEndDate, setCustomEndDate] = useState('2026-06-04');

  const activeSalesData = useMemo(() => {
    let startStr = customStartDate;
    let endStr = customEndDate;

    if (salesPeriod === '7d') {
      startStr = '2026-05-28';
      endStr = '2026-06-04';
    } else if (salesPeriod === '30d') {
      startStr = '2026-05-06';
      endStr = '2026-06-04';
    } else if (salesPeriod === '90d') {
      startStr = '2026-03-06';
      endStr = '2026-06-04';
    }

    const dates: Date[] = [];
    let start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [];
    }

    // Limit range to max 180 days to avoid performance issues
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 180) {
      start = new Date(end);
      start.setDate(end.getDate() - 150); // limit to 150 days
    }

    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates.map(d => {
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const formattedName = `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}`;
      
      const dayOfWeek = d.getDay();
      const dayBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? 350 : 0;
      const base = 480 + Math.sin(day * 0.35 + month) * 190 + dayBonus;
      const noise = (day % 2 === 0 ? 40 : -20) + (day % 7 === 0 ? 120 : 0);
      const sales = Math.max(100, Math.round(base + noise));

      return {
        name: formattedName,
        sales,
        fullDateStr: d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      };
    });
  }, [salesPeriod, customStartDate, customEndDate]);

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(() => {
    const saved = localStorage.getItem('eladma-supplier-status');
    return (saved as VerificationStatus) || 'unregistered';
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'api' | 'payout'>('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(() => {
    const saved = localStorage.getItem('eladma-supplier-products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      { id: '1', name: 'Smart Watch V2 - Noir Metal', category: 'Électronique', price: 129.00, stock: 45, threshold: 10, status: 'active', image: 'https://picsum.photos/seed/p1/100/100' },
      { id: '2', name: 'Sac à dos de randonnée Pro', category: 'Sports', price: 79.50, stock: 3, threshold: 5, status: 'active', image: 'https://picsum.photos/seed/p2/100/100' },
      { id: '3', name: 'Robe d\'été Fleurie', category: 'Fashion', price: 45.00, stock: 12, threshold: 15, status: 'active', image: 'https://picsum.photos/seed/p3/100/100' },
      { id: '4', name: 'Tasse en céramique artisanale', category: 'Artisanat', price: 18.00, stock: 1, threshold: 5, status: 'active', image: 'https://picsum.photos/seed/p4/100/100' }
    ];
  });
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [orders, setOrders] = useState<Order[]>(orderManager.getOrders());

  // Real-time new order simulator with detailed toasts
  const simulateNewOrder = React.useCallback(() => {
    const customers = [
      { name: 'Mireille Kankolongo', address: 'Avenue de la Gombe, Kinshasa, RDC' },
      { name: 'Ferdinand Mukendi', address: 'Quartier Mbumba, Tshikapa, Kasaï, RDC' },
      { name: 'Coopérative de Luiza', address: 'Route Principale, Secteur Luiza, RDC' },
      { name: 'Jean-Pierre Tshilumba', address: 'Quartier Ngaza, Kananga, Kasaï-Central, RDC' },
      { name: 'Clara Bakaswa', address: 'Avenue Lumumba, Lubumbashi, RDC' },
      { name: 'Sébastien Nzaji', address: 'Commune de Katoka, Kananga, RDC' }
    ];
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    // Pick from current list of products or fallback
    const selectedProducts = supplierProducts.length > 0 ? supplierProducts : [
      { id: '1', name: 'Smart Watch V2 - Noir Metal', price: 129.00 },
      { id: '2', name: 'Sac à dos de randonnée Pro', price: 79.50 },
      { id: '4', name: 'Tasse en céramique artisanale', price: 18.00 }
    ];
    
    const shuffled = [...selectedProducts].sort(() => 0.5 - Math.random());
    const itemCount = Math.min(shuffled.length, Math.floor(Math.random() * 2) + 1);
    
    const items = Array.from({ length: itemCount }, (_, idx) => {
      const prod = shuffled[idx];
      const qty = Math.floor(Math.random() * 2) + 1;
      return {
        productId: prod.id,
        name: prod.name,
        quantity: qty,
        price: prod.price
      };
    });
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newOrder = orderManager.createOrder({
      customerId: 'cust_' + Math.floor(Math.random() * 1000),
      customerName: customer.name,
      items,
      total,
      status: 'pending',
      shippingAddress: customer.address
    });
    
    // Update local state to trigger rerender & stats updates
    setOrders([...orderManager.getOrders()]);
    
    // Play sounds & haptics
    sounds.success();
    haptics.success();
    
    // Toast Alert notification in French matching local platform aesthetic
    toast.success(
      <div className="flex flex-col gap-2 p-1 text-sm select-none">
        <div className="flex items-center gap-2 text-rose-500 font-black">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs uppercase tracking-wider">Alerte : Nouvelle Commande Client ! 🔔</span>
        </div>
        <div>
          <p className="text-zinc-850 dark:text-zinc-200 text-xs font-bold leading-relaxed w-full">
            <span className="text-brand font-black">{customer.name}</span> vient d'acheter{" "}
            {items.map(item => `${item.quantity}x « ${item.name} »`).join(' et ')} pour un total de{" "}
            <span className="text-brand font-black">{formatPrice(total)}</span>.
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 italic">
            📍 Expédier vers : {customer.address}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button 
            onClick={() => {
              setActiveTab('orders');
              haptics.medium();
              sounds.click();
            }}
            className="text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 px-3 py-1.5 rounded-lg active:scale-95 hover:opacity-90 transition-all font-sans"
          >
            Afficher la Commande 📦
          </button>
        </div>
      </div>,
      {
        duration: 9000,
        position: 'top-right'
      }
    );
  }, [supplierProducts, formatPrice]);

  useEffect(() => {
    if (verificationStatus !== 'verified') return;

    // Simulate first order after 22 seconds, then every 45 seconds
    const initialTimer = setTimeout(() => {
      simulateNewOrder();
    }, 22000);

    const interval = setInterval(() => {
      simulateNewOrder();
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [verificationStatus, simulateNewOrder]);
  const [signature, setSignature] = useState<string | null>(() => localStorage.getItem('eladma-supplier-signature'));
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('eladma-supplier-company') || '');
  const [location, setLocation] = useState(() => localStorage.getItem('eladma-supplier-location') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKYC, setShowKYC] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(() => localStorage.getItem('eladma-supplier-selfie'));
  const [rejectionReason, setRejectionReason] = useState<string | null>(() => localStorage.getItem('eladma-supplier-rejection-reason'));

  // payout details configuration
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'bank'>(() => {
    return (localStorage.getItem('eladma-payout-method') as 'momo' | 'bank') || 'momo';
  });
  const [momoProvider, setMomoProvider] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-momo-provider') || 'M-Pesa';
  });
  const [momoPhone, setMomoPhone] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-momo-phone') || '';
  });
  const [momoHolder, setMomoHolder] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-momo-holder') || '';
  });
  const [bankName, setBankName] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-bank-name') || 'Rawbank';
  });
  const [bankAccount, setBankAccount] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-bank-account') || '';
  });
  const [bankSwift, setBankSwift] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-bank-swift') || '';
  });
  const [bankHolder, setBankHolder] = useState<string>(() => {
    return localStorage.getItem('eladma-payout-bank-holder') || '';
  });

  const isPayoutConfigured = useMemo(() => {
    if (payoutMethod === 'momo') {
      return !!momoPhone && momoPhone.trim().length > 3 && !!momoHolder && momoHolder.trim().length > 2;
    } else {
      return !!bankAccount && bankAccount.trim().length > 5 && !!bankHolder && bankHolder.trim().length > 2;
    }
  }, [payoutMethod, momoPhone, momoHolder, bankAccount, bankHolder]);

  const handleSavePayoutDetails = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!EladmaSecurity.checkRateLimit('save_payout', 10, 60000)) {
       return;
    }

    const cleanMomoPhone = EladmaSecurity.sanitizeInput(momoPhone);
    const cleanMomoHolder = EladmaSecurity.sanitizeInput(momoHolder);
    const cleanBankAccount = EladmaSecurity.sanitizeInput(bankAccount);
    const cleanBankSwift = EladmaSecurity.sanitizeInput(bankSwift);
    const cleanBankHolder = EladmaSecurity.sanitizeInput(bankHolder);

    localStorage.setItem('eladma-payout-method', payoutMethod);
    localStorage.setItem('eladma-payout-momo-provider', momoProvider);
    localStorage.setItem('eladma-payout-momo-phone', cleanMomoPhone || '');
    localStorage.setItem('eladma-payout-momo-holder', cleanMomoHolder || '');
    localStorage.setItem('eladma-payout-bank-name', bankName);
    localStorage.setItem('eladma-payout-bank-account', cleanBankAccount || '');
    localStorage.setItem('eladma-payout-bank-swift', cleanBankSwift || '');
    localStorage.setItem('eladma-payout-bank-holder', cleanBankHolder || '');

    sounds.success();
    haptics.success();
    toast.success("🏦 Coordonnées financières mises à jour avec succès !", {
      description: "Vos futurs versements de ventes seront envoyés à ces coordonnées."
    });
  };

  // Doc inspection state for administrative validation simulation
  const [inspectingDoc, setInspectingDoc] = useState<{ title: string; content: string; file: string } | null>(null);
  const [rejectReasonSelection, setRejectReasonSelection] = useState<string>('');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const filteredProducts = supplierProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchProductQuery.toLowerCase());
    if (lowStockFilter) {
      return matchesSearch && p.stock <= p.threshold;
    }
    return matchesSearch;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-abuse rate limit check to prevent registration flooding
    if (!EladmaSecurity.checkRateLimit('supplier_registration', 5, 60000)) {
      return;
    }

    // 2. Input Sanitization to avoid XSS elements in pdf service and stored fields
    const sanitizedCompany = EladmaSecurity.sanitizeInput(companyName);
    const sanitizedLoc = EladmaSecurity.sanitizeInput(location);

    if (!sanitizedCompany || !sanitizedLoc) {
      toast.error("⚠️ Sécurité : Caractères interdits ou scripts XSS interceptés dans le formulaire.");
      return;
    }

    if (!signature) {
      toast.error("Signature requise", {
        description: "Veuillez signer le contrat de partenariat pour continuer."
      });
      return;
    }

    if (!selfie) {
      setShowKYC(true);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Génération du contrat et envoi par email...");

    try {
      // Simulate real process
      const pdfBlob = await generateContractPDF({
        companyName: sanitizedCompany,
        location: sanitizedLoc,
        date: new Date().toLocaleDateString('fr-FR'),
        signature
      });

      // In a real app, we would send this blob to the backend or an email API
      // Here we simulate the delay
      await new Promise(r => setTimeout(r, 2000));

      setVerificationStatus('pending');
      localStorage.setItem('eladma-supplier-status', 'pending');
      localStorage.setItem('eladma-supplier-signature', signature);
      localStorage.setItem('eladma-supplier-selfie', selfie || '');
      localStorage.setItem('eladma-supplier-company', sanitizedCompany);
      localStorage.setItem('eladma-supplier-location', sanitizedLoc);
      localStorage.removeItem('eladma-supplier-rejection-reason');
      setRejectionReason(null);
      
      toast.success("Tout est en ordre !", {
        id: toastId,
        description: "Documents, contrat et vérification faciale validés."
      });

      // Provide a way to view/download for the demo
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrat_Eladma_${sanitizedCompany.replace(/\s+/g, '_')}.pdf`;
      // We don't auto-click for the user unless intended, but it's good for demo
      // link.click(); 

    } catch (error) {
      toast.error("Erreur lors de la génération du contrat", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSyncing(false);
    toast.success("Synchronisation avec les APIs fournisseurs terminée !");
  };

  const handleFulfill = async (orderId: string) => {
    try {
      await orderManager.fulfillOrder(orderId, 'ali_01');
      setOrders([...orderManager.getOrders()]);
      toast.success("Commande envoyée au fournisseur externe !");
    } catch (e) {
      toast.error("Erreur de synchronisation.");
    }
  };

  const handleAddSupplierProduct = (name: string, price: number, stock: number, threshold: number, category: string, desc: string) => {
    const newProd: SupplierProduct = {
      id: Date.now().toString(),
      name,
      category: category || 'Électronique',
      price,
      stock,
      threshold,
      status: 'active',
      image: `https://picsum.photos/seed/p${Math.floor(Math.random() * 100)}/100/100`
    };
    const updated = [newProd, ...supplierProducts];
    saveSupplierProducts(updated);
    haptics.success();
    sounds.success();
  };

  const saveSupplierProducts = (newProducts: SupplierProduct[]) => {
    setSupplierProducts(newProducts);
    localStorage.setItem('eladma-supplier-products', JSON.stringify(newProducts));
  };

  const handleUpdateProductStockAndThreshold = (id: string, stock: number, threshold: number) => {
    const updated = supplierProducts.map(p => p.id === id ? { ...p, stock, threshold } : p);
    saveSupplierProducts(updated);
    haptics.success();
    sounds.success();
    toast.success("Informations du produit mises à jour !");
  };

  const deleteSupplierProduct = (id: string) => {
    const updated = supplierProducts.filter(p => p.id !== id);
    saveSupplierProducts(updated);
    haptics.warning();
    sounds.warning();
    toast.success("Produit supprimé !");
  };

  const lowStockProductsCount = supplierProducts.filter(p => p.stock <= p.threshold).length;

  // Mock stats
  const stats = [
    { label: 'Ventes Totales', value: formatPrice(4250), icon: DollarSign, trend: '+12%', color: 'text-emerald-500' },
    { label: 'Produits Actifs', value: '18', icon: Package, trend: '+2', color: 'text-blue-500' },
    { label: 'Commandes', value: orders.length.toString(), icon: ShoppingBag, trend: '+5', color: 'text-purple-500' },
    { label: 'Clients', value: '38', icon: Users, trend: '+8%', color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-24">
        {verificationStatus === 'unregistered' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto py-12"
          >
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour boutique
            </button>

            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border dark:border-zinc-800 p-8 md:p-12 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black dark:text-white">Devenir Vendeur Eladma</h2>
                  <p className="text-zinc-500">Validation de votre compte en 48h</p>
                </div>
              </div>

              {/* GUIDE DE DÉMARRAGE RAPIDE / GETTING STARTED ONBOARDING */}
              <div id="supplier-onboarding-guide" className="mb-10 p-6 md:p-8 bg-brand/[0.03] dark:bg-brand/[0.02] border border-brand/20 dark:border-brand/15 rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 text-brand rounded-xl">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Guide de Démarrage : Rejoindre Eladma</h4>
                    <p className="text-xs text-zinc-500">Tout ce que vous devez savoir pour commencer à vendre</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">
                        Pas de site internet ? Aucun problème !
                      </h5>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-full text-[10px] font-black uppercase tracking-wider mt-1.5 mb-2.5">
                        ✨ Aucun site web requis
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Le grand avantage d'Eladma est que <strong>vous n'avez absolument PAS besoin de posséder votre propre site Internet</strong> pour vendre votre artisanat, votre mode ou vos produits technologiques. 
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2">
                        Eladma gère et fournit toute l'infrastructure complexe à votre place :
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span> Boutique hébergée publique gratuite
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span> Paiements sécurisés intégrés (M-Pesa, etc.)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span> Génération & Synchro de catalogue par IA
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold">✓</span> URL unique à partager sur vos réseaux
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand" />
                    Le parcours de votre inscription en 4 étapes
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { 
                        step: "01", 
                        title: "Informations d'Activité", 
                        desc: "Renseignez le nom de votre commerce/coopérative et l'adresse de votre siège social." 
                      },
                      { 
                        step: "02", 
                        title: "Justificatifs Réglementaires", 
                        desc: "Déposez votre Pièce d'identité, Registre de commerce (RCCM) et Attestation fiscale." 
                      },
                      { 
                        step: "03", 
                        title: "Signature Contractuelle", 
                        desc: "Validez et signez le contrat officiel de partenariat directement sur notre bloc de signature tactile." 
                      },
                      { 
                        step: "04", 
                        title: "Vérification Faciale IA", 
                        desc: "Prenez un selfie rapide pour que l'IA confirme la correspondance de votre identité légale." 
                      }
                    ].map((item) => (
                      <div key={item.step} className="bg-white/40 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-150/50 dark:border-zinc-800/60 flex gap-3 hover:border-brand/35 dark:hover:border-brand/20 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <h6 className="font-bold text-xs text-zinc-850 dark:text-white leading-tight">{item.title}</h6>
                          <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {rejectionReason && (
                <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex gap-4 text-sm text-zinc-800 dark:text-zinc-300">
                  <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <h4 className="font-bold text-base text-rose-950 dark:text-rose-200">Demande d'activation rejetée par un administrateur</h4>
                    <p className="mt-1 text-xs opacity-90 leading-relaxed text-zinc-500">
                      Votre dossier d'inscription a été examiné par notre équipe de modération rurale et n'a pas pu être validé :
                    </p>
                    <p className="mt-2 text-xs font-bold bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-rose-200 dark:border-rose-950 font-mono text-rose-600 dark:text-rose-400">
                      « {rejectionReason} »
                    </p>
                    <p className="mt-3 text-[11px] text-zinc-400 leading-relaxed">
                      Veuillez modifier les informations incorrectes, re-téléverser des fichiers valides, re-signer le contrat de partenariat et soumettre de nouveau le formulaire pour réévaluation.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-3 h-3" />
                      Nom de l'entreprise
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white" 
                      placeholder="ex: Coopérative de Ngaza" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      Siège Social
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white" 
                      placeholder="Kananga, RDC" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand" />
                    Documents Requis
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'id', label: 'Pièce d\'identité du gérant', desc: 'CNI ou Passeport' },
                      { id: 'reg', label: 'Registre de Commerce (RCCM)', desc: 'Document officiel' },
                      { id: 'tax', label: 'Attestation Fiscale', desc: 'Preuve de régularité' },
                    ].map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl group hover:border-brand/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-brand transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold dark:text-white">{doc.label}</p>
                            <p className="text-xs text-zinc-500">{doc.desc}</p>
                          </div>
                        </div>
                        <input type="file" className="hidden" id={`file-${doc.id}`} />
                        <label htmlFor={`file-${doc.id}`} className="px-4 py-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-brand hover:text-white transition-all shadow-sm">
                          Choisir
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-brand/5 rounded-2xl border border-brand/20 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-brand shrink-0" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    En soumettant ces documents et en signant le contrat, vous certifiez leur authenticité. Eladma se réserve le droit de geler les fonds en cas de fraude ou de non-conformité constatée.
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-brand" />
                    Contrat de Partenariat
                  </h3>
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 leading-loose h-48 overflow-y-auto font-serif">
                    <p className="font-bold mb-4 text-center text-sm dark:text-white">CONTRAT DE DISTRIBUTION ELADMA v1.4</p>
                    <p className="mb-4">Entre la plateforme ELADMA INC. et le Prestataire désigné ci-dessus, il est convenu ce qui suit :</p>
                    <p className="mb-4">1. OBJET : Le Prestataire souhaite utiliser les services d'Eladma pour la vente et la distribution de ses produits.</p>
                    <p className="mb-4">2. COMMISSIONS : Eladma prélève une commission de 8% sur chaque vente finalisée, incluant les frais de gestion de plateforme et d'IA.</p>
                    <p className="mb-4">3. LOGISTIQUE : Le Prestataire s'engage à expédier les commandes locales sous 24h ouvrées. Pour l'artisanat du Kasaï, Eladma assure la collecte via son centre de Kananga.</p>
                    <p className="mb-4">4. CONFORMITÉ : Le Prestataire garantit l'origine licite des produits et le respect des normes de qualité Eladma.</p>
                    <p className="mb-4">5. RÉSILIATION : Chaque partie peut mettre fin au présent contrat avec un préavis de 30 jours, sous réserve du traitement des commandes en cours.</p>
                    <p className="italic mt-8 text-center">Fait à Kananga, pour valoir ce que de droit.</p>
                  </div>
                  <SignaturePad 
                    onSign={setSignature} 
                    onClear={() => setSignature(null)} 
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-brand" />
                    Vérification d'Identité IA
                  </h3>
                  
                  {selfie ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-lg group">
                      <img src={selfie} className="w-full h-full object-cover scale-x-[-1]" alt="Selfie de vérification" />
                      <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                          <Check className="w-4 h-4" />
                          Identité Validée par l'IA
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelfie(null)}
                        className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-zinc-900/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowKYC(true)}
                      className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-brand/40 hover:bg-brand/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-brand group-hover:scale-110 transition-all">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold dark:text-white">Démarrer la vérification faciale</p>
                        <p className="text-xs text-zinc-500">Requis pour l'activation du compte</p>
                      </div>
                    </button>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-brand text-white rounded-2xl font-black text-lg shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? 'Traitement...' : 'Signer et Soumettre'}
                </button>
              </form>
            </div>
          </motion.div>
        ) : verificationStatus === 'pending' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Top Navigation Row in Pending Screen */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-colors group text-sm font-bold"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Retour à la boutique
                </button>
                <h2 className="text-3xl font-black dark:text-white mt-2">Dossier en attente d'approbation</h2>
                <p className="text-zinc-500 text-sm">Réf : ELD-2026-RDC • Soumis pour examen réglementaire</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Le Portail Marchand (Pour le vendeur) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border dark:border-zinc-800 p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-8 border-b dark:border-zinc-800 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white">Votre Espace Candidat</h3>
                        <p className="text-xs text-zinc-500">Statut actuel du traitement</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                      Examen en cours
                    </span>
                  </div>

                  {/* Operational Timeline */}
                  <div className="space-y-6 mb-8 relative before:absolute before:left-[1.125rem] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100 dark:before:bg-zinc-800">
                    {[
                      { 
                        title: "Dépôt des pièces d'activité", 
                        desc: "Les documents RCCM, d'identité du gérant et certifications fiscales ont été chiffrés et transmis.", 
                        status: "complete", 
                        time: "Aujourd'hui" 
                      },
                      { 
                        title: "Signature contractuelle effectuée", 
                        desc: "Le contrat de distribution v1.4 a été validé et signé électroniquement par l'entreprise.", 
                        status: "complete", 
                        time: "Aujourd'hui" 
                      },
                      { 
                        title: "Vérification d'identité IA", 
                        desc: "Le selfie d'identification biométrique a été comparé avec la CNI avec succès (Match 98%).", 
                        status: "complete", 
                        time: "Aujourd'hui" 
                      },
                      { 
                        title: "Audit Human-in-the-Loop Administrateur", 
                        desc: "Un modérateur Eladma authentifié à Kananga/C vérifie la validité légale des pièces fournies.", 
                        status: "pending", 
                        time: "En attente" 
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-zinc-900 ${
                          step.status === 'complete' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-amber-500/20 text-amber-500 animate-pulse'
                        }`}>
                          {step.status === 'complete' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm dark:text-white">{step.title}</h4>
                            <span className="text-[10px] text-zinc-400 whitespace-nowrap">{step.time}</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary of submitted data */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800/20 p-2 rounded-lg inline-block">Informations du dossier</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                        <span className="text-zinc-500 block mb-1">Nom de l'entreprise</span>
                        <strong className="dark:text-white break-words">{companyName || "Non spécifié"}</strong>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl">
                        <span className="text-zinc-500 block mb-1">Siège principal</span>
                        <strong className="dark:text-white">{location || "Non spécifié"}</strong>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs text-zinc-500 block">Fichiers transmis pour certification</span>
                      {[
                        { 
                          id: 'id', 
                          name: 'CNI_Gerant_Officiel.pdf', 
                          size: '1.2 MB', 
                          title: "Pièce d'identité du gérant", 
                          content: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO\nCARTE D'ÉLECTEUR / D'IDENTITÉ PROVISOIRE\n\nN° National : RDC-903423-H\nNom : TOUT-VENANT\nPrénom : MARCHANT\nNationalité : Congolaise\nLieu de naissance : Kananga\n\n[Statut : Vérifié avec succès par comparaison faciale Eladma AI-Identity (Score de similitude: 98.4%)]` 
                        },
                        { 
                          id: 'reg', 
                          name: 'Registre_RCCM_Validation_Eladma.pdf', 
                          size: '2.4 MB', 
                          title: "Registre de Commerce (RCCM)", 
                          content: companyName ? `GREFFE DU TRIBUNAL DE COMMERCE DE KANANGA\nREGISTRE DU COMMERCE ET DU CRÉDIT MOBILIER (RCCM)\n\nNuméro d'immatriculation : CD/KAN/RCCM/26-B-0421\n\nDénomination sociale : ${companyName}\nForme juridique : Société Coopérative\nAdresse du siège : ${location || 'Kananga, RDC'}\nActivité : Commerce général, artisanat régional et distribution numérique.` : `Structure d'enregistrement légale en RDC non confirmée.` 
                        },
                        { 
                          id: 'tax', 
                          name: 'Attestation_Fiscale_2026.pdf', 
                          size: '850 KB', 
                          title: "Attestation Fiscale", 
                          content: `DIRECTION GÉNÉRALE DES IMPÔTS (DGI)\nCENTRE DES IMPÔTS SYNTHÉTIQUES DE KANANGA\n\nATTESTATION DE RÉGULARITÉ FISCALE\nN° ARF/DGI/KAN/2026/0291\n\nIl est certifié que le contribuable immatriculé au RCCM sous le numéro CD/KAN/RCCM/26-B-0421 est en règle de ses obligations déclaratives et de paiement pour l'exercice fiscal en cours.` 
                        }
                      ].map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-brand" />
                            <div>
                              <p className="text-xs font-bold dark:text-white">{doc.title}</p>
                              <p className="text-[10px] text-zinc-400">{doc.name} • {doc.size}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setInspectingDoc({ title: doc.title, content: doc.content, file: doc.name })}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border dark:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Visualiser
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={onBack}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs hover:bg-zinc-200 transition-all text-center"
                    >
                      Retourner au magasin
                    </button>
                    {signature && (
                      <button 
                        onClick={() => {
                          generateContractPDF({
                            companyName: companyName || "Vendeur Eladma",
                            location: location || "Kananga",
                            date: new Date().toLocaleDateString('fr-FR'),
                            signature: signature
                          }).then(blob => {
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Contrat_Eladma_Signe_${(companyName || 'Vendeur').replace(/\s+/g, '_')}.pdf`;
                            link.click();
                            toast.success("Téléchargement du contrat lancé");
                          });
                        }}
                        className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 dark:border-zinc-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-805 transition-all text-center"
                      >
                        <FileText className="w-4 h-4 text-brand" />
                        Obtenir Contrat PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Le Portail d'Administration Eladma RDC (Pour la Modération administrative) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                    <Scale className="w-48 h-48 rotate-12" />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6 border-b border-zinc-800/80 pb-6 relative z-10">
                    <div className="w-10 h-10 bg-brand/20 text-brand rounded-xl flex items-center justify-center border border-brand/50">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wide uppercase text-brand">Vérification Documents</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Backoffice d'approbation administrative RDC</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Cette console interne simule l'interface confidentielle d'approbation d'un inspecteur d'Eladma à Kananga. Vous pouvez valider les justificatifs du candidat ou rejeter le dossier en expliquant les motifs.
                  </p>

                  {/* Candidate overview cards */}
                  <div className="space-y-4 mb-8 bg-zinc-950/60 p-5 border border-zinc-800/80 rounded-3xl">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-brand" />
                      Candidat à auditer
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-500">Raison sociale :</span>
                        <span className="font-bold text-zinc-200">{companyName || "Coopérative Eladma"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-500">Siège social :</span>
                        <span className="text-zinc-300">{location || "Kananga, RDC"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-500">Identité IA-Match :</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">✔ CONFORME (98%)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-500">Contrat :</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">✔ SIGNÉ</span>
                      </div>
                    </div>

                    {/* Previews side by side */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 block">Photo Biométrique :</span>
                        {selfie ? (
                          <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                            <img src={selfie} className="w-full h-full object-cover scale-x-[-1]" alt="Identité" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-zinc-900 rounded-xl border border-zinc-800 border-dashed flex items-center justify-center text-zinc-650 text-[10px]">
                            Aucun selfie
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 block">Signature validée :</span>
                        {signature ? (
                          <div className="aspect-square bg-white rounded-xl border border-zinc-800 p-2 flex items-center justify-center">
                            <img src={signature} className="max-w-full max-h-full object-contain" alt="Signature" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-zinc-900 rounded-xl border border-zinc-800 border-dashed flex items-center justify-center text-zinc-650 text-[10px]">
                            Aucune signature
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    {!showRejectForm ? (
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => {
                            setVerificationStatus('verified');
                            localStorage.setItem('eladma-supplier-status', 'verified');
                            toast.success("Validation administrative accomplie !", {
                              description: `Le compte de « ${companyName || 'votre coopérative'} » est désormais actif et vérifié !`
                            });
                          }}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-650 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all uppercase tracking-widest"
                        >
                          <ShieldCheck className="w-4 h-4 fill-current" />
                          Approuver et Activer le compte
                        </button>
                        <button 
                          onClick={() => setShowRejectForm(true)}
                          className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 text-rose-400 font-bold text-[11px] rounded-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                        >
                          <FileX className="w-4 h-4" />
                          Rejeter les pièces justificatives
                        </button>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 bg-zinc-950/80 p-5 border border-rose-500/20 rounded-3xl text-xs"
                      >
                        <h4 className="font-extrabold text-sm text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <FileX className="w-4 h-4" />
                          Motif de non-conformité
                        </h4>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Sélectionnez le motif réglementaire :</label>
                          <select 
                            value={rejectReasonSelection}
                            onChange={(e) => {
                              setRejectReasonSelection(e.target.value);
                              if (e.target.value !== 'Autre') {
                                setCustomRejectReason('');
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl p-3 outline-none text-zinc-300 focus:ring-1 focus:ring-rose-500 text-xs"
                          >
                            <option value="">-- Choisir un motif --</option>
                            <option value="Pièce d'identité lisible exigée. Le document fourni (CNI / Passeport) est flou ou hors de validité.">Pièce d'identité illisible / expirée</option>
                            <option value="Numéro d'immatriculation CD/KAN/RCCM non valide sur le greffe officiel de Kananga.">Numéro RCCM erroné ou introuvable</option>
                            <option value="Défaut d'attestation fiscale de la DGI ou document fourni ne correspondant pas à l'année courante.">Attestation Fiscale invalide</option>
                            <option value="Signature contractuelle incomplète. Veuillez apposer une signature claire lisible sur le pavé tactile.">Signature non conforme ou incomplète</option>
                            <option value="Vérification faciale biométrique suspecte. Le selfie ne correspond pas à l'identité du gérant.">Vérification faciale IA rejetée</option>
                            <option value="Autre">Autre motif personnalisé...</option>
                          </select>
                        </div>

                        {(rejectReasonSelection === 'Autre' || rejectReasonSelection === '') && (
                          <div className="space-y-2">
                            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Spécifiez le motif :</label>
                            <textarea 
                              value={customRejectReason}
                              onChange={(e) => setCustomRejectReason(e.target.value)}
                              placeholder="Veuillez décrire précisément les éléments manquants ou à corriger..."
                              rows={3}
                              className="w-full bg-zinc-900 border border-zinc-855 rounded-xl p-3 outline-none text-zinc-300 focus:ring-1 focus:ring-rose-500 text-xs resize-none"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectReasonSelection('');
                              setCustomRejectReason('');
                            }}
                            className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-750 text-[10px] uppercase tracking-wider transition-all"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={() => {
                              const finalReason = rejectReasonSelection === 'Autre' ? customRejectReason : rejectReasonSelection;
                              if (!finalReason || finalReason.trim() === '') {
                                toast.error("Veuillez renseigner un motif de rejet.");
                                return;
                              }
                              // Set back to unregistered, store rejection reason in localStorage
                              setVerificationStatus('unregistered');
                              localStorage.setItem('eladma-supplier-status', 'unregistered');
                              localStorage.setItem('eladma-supplier-rejection-reason', finalReason);
                              setRejectionReason(finalReason);
                              
                              // Clear temporarily loaded docs to force resubmission
                              localStorage.removeItem('eladma-supplier-signature');
                              localStorage.removeItem('eladma-supplier-selfie');
                              setSignature(null);
                              setSelfie(null);

                              setShowRejectForm(false);
                              setRejectReasonSelection('');
                              setCustomRejectReason('');

                              toast.error("Dossier rejeté avec succès", {
                                description: "L'utilisateur est prévenu du motif de rejet administratif."
                              });
                            }}
                            className="flex-1 py-2.5 bg-rose-650 hover:bg-rose-700 text-white font-black rounded-xl text-[10px] uppercase tracking-wider transition-all"
                          >
                            Valider le Rejet
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-brand mb-2 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour boutique
            </button>
            <h1 className="text-3xl font-bold dark:text-white">Tableau de Bord Vendeur</h1>
            <p className="text-zinc-500">Bienvenue sur votre espace Eladma Business</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={simulateNewOrder}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 text-red-650 dark:text-rose-400 border border-red-200/40 dark:border-rose-900/40 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-sm group"
              title="Simuler la réception d'une commande client en temps réel"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Simuler Commande 🔔</span>
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl font-bold dark:text-white hover:bg-zinc-50 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sync...' : 'Sync API'}
            </button>
            <button 
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nouveau produit
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-2xl w-fit mb-8 overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
            { id: 'products', label: 'Produits', icon: Package },
            { id: 'orders', label: 'Commandes', icon: ShoppingBag },
            { id: 'payout', label: "Mode de versement", icon: CreditCard },
            { id: 'api', label: 'Intégration API', icon: Link },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                haptics.light();
                sounds.click();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap relative ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-zinc-800 text-brand shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'products' && lowStockProductsCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                  {lowStockProductsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* INDICATEUR DE STATUT DE PAIEMENT & VALIDATION DE COMPTE */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2.5rem] p-6 md:p-8 shadow-sm overflow-hidden relative"
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/[0.02] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 lg:block hidden" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-150/60 dark:border-zinc-850 pb-6 mb-6">
                <div>
                  <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                    Statut de Validation & Flux de Versement
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
                    Suivi de vos accréditations de vendeur et de votre canal de paiement automatique
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Status pills based on state */}
                  {verificationStatus === 'verified' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" /> Compte Validé
                    </span>
                  ) : verificationStatus === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider animate-pulse">
                      <Clock className="w-4 h-4" /> Validation Administrative
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 rounded-xl text-xs font-black uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" /> Profil Incomplet
                    </span>
                  )}

                  {isPayoutConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" /> Versement Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-black uppercase tracking-wider animate-pulse">
                      <AlertCircle className="w-4 h-4" /> Saisie Compte Requise
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identity Validation Status Pillar */}
                <div className="flex gap-4 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-150/40 dark:border-zinc-850/50">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
                    verificationStatus === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {verificationStatus === 'verified' ? <UserCheck className="w-5 h-5" /> :
                     verificationStatus === 'pending' ? <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" /> : <Fingerprint className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm dark:text-white leading-tight">Vérification du Compte Eladma</h4>
                    {verificationStatus === 'verified' ? (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed md:max-w-md">
                        Votre identité légale d'artisan/vendeur est <strong>entièrement validée et signée contractuellement</strong> en conformité avec nos partenaires financiers. Vous pouvez vendre sans limites.
                      </p>
                    ) : verificationStatus === 'pending' ? (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed md:max-w-md">
                        Dossier en cours d'examen par la direction d'Eladma et Rawbank (sous 24h). <strong>Rassurez-vous: votre boutique est déjà utilisable et vos gains de ventes actuels s'accumulent en toute sécurité.</strong>
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed md:max-w-md">
                        Vous devez compléter les étapes d'identité et de contrat dans notre formulaire d'inscription pour débloquer toutes les fonctionnalités et lever les restrictions d'activité.
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial Payout Status Pillar */}
                <div className="flex gap-4 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-150/40 dark:border-zinc-850/50">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isPayoutConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-sm dark:text-white leading-tight">Configuration des Versements Directs</h4>
                    {isPayoutConfigured ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          La liaison est <strong>active et opérationnelle</strong> vers votre compte de destination :{' '}
                          <strong className="text-zinc-800 dark:text-zinc-200">
                            {payoutMethod === 'momo' ? `Mobile Money ${momoProvider} (${momoPhone})` : `Bancaire RDC (${bankName})`}
                          </strong>.
                        </p>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-black uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Transfert direct de vos gains de ventes garanti chaque lundi à 08h30.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          ⚠️ <strong>Attention :</strong> Aucun compte financier/Mobile Money n'est configuré pour recevoir vos transferts d'articles vendus.
                        </p>
                        <button
                          onClick={() => {
                            setActiveTab('payout');
                            haptics.medium();
                            sounds.open();
                          }}
                          className="px-3 py-1.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Renseigner mon compte <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Low stock critical alerts banner */}
            {lowStockProductsCount > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/45 dark:border-amber-900/40 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                    <AlertCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-base">
                      Alerte de Stock Faible ({lowStockProductsCount} {lowStockProductsCount > 1 ? 'produits critiques' : 'produit critique'})
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                      Certains de vos produits clés ont presque épuisé leur stock. Veuillez réapprovisionner ou ajuster vos alertes pour éviter les ruptures de vente.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    haptics.medium();
                    sounds.open();
                    setActiveTab('products');
                    setLowStockFilter(true);
                  }}
                  className="px-5 py-2.5 bg-amber-650 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 shadow-md shadow-amber-600/10"
                >
                  Voir les alertes
                </button>
              </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-zinc-500 text-sm font-medium">{stat.label}</h3>
                  <p className="text-2xl font-bold dark:text-white mt-1">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales Chart with Recharts */}
              <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">Performance des ventes</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Analyse dynamique de l'évolution des commandes
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {salesPeriod === 'custom' && (
                      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 rounded-xl border dark:border-zinc-700/50">
                        <Calendar className="w-3.5 h-3.5 text-brand" />
                        <input 
                          type="date" 
                          value={customStartDate}
                          max={customEndDate} 
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            haptics.light();
                            sounds.click();
                          }}
                          className="bg-transparent border-none text-xs outline-none text-zinc-800 dark:text-zinc-200 font-bold max-w-[115px] cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase mx-1">au</span>
                        <input 
                          type="date" 
                          value={customEndDate}
                          min={customStartDate}
                          max="2026-12-31" 
                          onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            haptics.light();
                            sounds.click();
                          }}
                          className="bg-transparent border-none text-xs outline-none text-zinc-800 dark:text-zinc-200 font-bold max-w-[115px] cursor-pointer"
                        />
                      </div>
                    )}
                    <select 
                      value={salesPeriod}
                      onChange={(e) => {
                        const val = e.target.value as '7d' | '30d' | '90d' | 'custom';
                        setSalesPeriod(val);
                        haptics.medium();
                        sounds.click();
                      }}
                      className="bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700/50 rounded-xl text-sm px-4 py-2 outline-none dark:text-white cursor-pointer font-bold shrink-0 shadow-sm"
                    >
                      <option value="7d">Option: 7 derniers jours</option>
                      <option value="30d">Option: 30 derniers jours</option>
                      <option value="90d">Option: 90 derniers jours</option>
                      <option value="custom">📅 Plage personnalisée</option>
                    </select>
                  </div>
                </div>
                <div className="h-64 select-none font-sans mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeSalesData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
                        fontSize={11}
                        tick={{ fill: '#888888', fontWeight: 500 }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false}
                        fontSize={11}
                        tickFormatter={(v) => formatPrice(v).split(',')[0]}
                        tick={{ fill: '#888888', fontWeight: 500 }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-2xl text-xs shadow-xl font-sans">
                                <p className="font-bold text-zinc-400 capitalize mb-1">
                                  {payload[0].payload.fullDateStr || payload[0].payload.name}
                                </p>
                                <p className="font-extrabold text-brand text-sm">
                                  {formatPrice(Number(payload[0].value))} de ventes
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#FF4F01" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm flex flex-col">
                <h3 className="text-xl font-bold dark:text-white mb-6">Dernières Commandes</h3>
                <div className="space-y-6 flex-1">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between group cursor-pointer" onClick={() => setActiveTab('orders')}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm dark:text-white">{order.id}</p>
                          <p className="text-xs text-zinc-500">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm dark:text-white">{formatPrice(order.total)}</p>
                        <span className={`text-[10px] font-bold uppercase ${
                          order.status === 'delivered' ? 'text-emerald-500' : 
                          order.status === 'pending' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          {order.status === 'delivered' ? 'Livré' : order.status === 'pending' ? 'En attente' : 'Expédié'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="mt-8 w-full py-3 text-sm font-bold text-brand hover:underline flex items-center justify-center gap-2"
                >
                  Gérer toutes les commandes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-xl font-bold dark:text-white">Gestionnaire de Commandes</h3>
                <div className="flex gap-2">
                   <button onClick={handleSync} className="p-2 text-zinc-500 hover:text-brand"><RefreshCcw className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="px-8 py-4">ID Commande</th>
                      <th className="px-6 py-4">Client / Adresse</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Fournisseur Externe</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <td className="px-8 py-4">
                          <p className="font-bold text-sm dark:text-white">{order.id}</p>
                          <p className="text-xs text-zinc-500">{order.date}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm dark:text-white">{order.customerName}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{order.shippingAddress}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                            order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {order.status === 'delivered' ? 'Livré' : order.status === 'pending' ? 'En attente' : 'Expédié'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {order.externalOrderId ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold dark:text-zinc-300">Sync Alibaba</span>
                              <span className="text-[10px] text-zinc-500">{order.externalOrderId}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Non synchronisé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!order.externalOrderId && order.status === 'pending' ? (
                            <button 
                              onClick={() => handleFulfill(order.id)}
                              className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2 ml-auto"
                            >
                              <Zap className="w-3 h-3 fill-current" />
                              Fulfillment Auto
                            </button>
                          ) : (
                            <button className="p-2 text-zinc-400 hover:text-brand">
                              <ExternalLink className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">AliExpress / Alibaba</h3>
                  <p className="text-xs text-zinc-500">Intégration Stock & Sourcing Global</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Statut de connexion</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Connecté
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Dernière Sync</span>
                  <span className="dark:text-zinc-300">Il y a 12 min</span>
                </div>
              </div>
              <button className="w-full py-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-bold dark:text-white hover:bg-zinc-50 transition-all">
                Configurer les Webhooks
              </button>
            </div>

            <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">CJ Dropshipping</h3>
                  <p className="text-xs text-zinc-500">Auto-Fulfillment & Warehousing</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Statut de connexion</span>
                  <span className="text-zinc-400 font-bold">Non configuré</span>
                </div>
              </div>
              <button 
                onClick={() => toast.info("Entrez votre clé API CJ Dropshipping dans les réglages.")}
                className="w-full py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl font-bold hover:opacity-90 transition-all"
              >
                Connecter mon compte CJ
              </button>
            </div>

            <div className="md:col-span-2 p-8 bg-brand/5 border-2 border-dashed border-brand/20 rounded-3xl">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-brand shadow-xl">
                        <RefreshCcw className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold dark:text-white">Comment fonctionne l'automatisation Eladma ?</h3>
                        <p className="text-sm text-zinc-500 max-w-md">Dès qu'un client paye sur Eladma, nous transmettons les détails aux fournisseurs via API pour une expédition immédiate.</p>
                     </div>
                  </div>
                  <button className="px-8 py-4 bg-brand text-white rounded-2xl font-bold flex items-center gap-2 group">
                     Documentation API
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Payout Tab */}
        {activeTab === 'payout' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            {/* Reassuring header status bar */}
            <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isPayoutConfigured && verificationStatus === 'verified' 
                ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-zinc-850 dark:text-zinc-200' 
                : 'bg-amber-500/[0.03] border-amber-500/20 text-zinc-850 dark:text-zinc-200'
            }`}>
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isPayoutConfigured && verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm leading-tight flex items-center gap-1.5 dark:text-white">
                    {isPayoutConfigured && verificationStatus === 'verified' 
                      ? "Fonds & Configuration Financière Sécurisés ✓" 
                      : "Canal financier en cours de finalisation"}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                    {isPayoutConfigured && verificationStatus === 'verified'
                      ? "Votre compte est validé et lié. Vos futurs gains d'articles seront transférés automatiquement sur votre compte sélectionné."
                      : "Saisissez vos coordonnées ci-dessous pour activer le flux de versement automatique du lundi matin."}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  isPayoutConfigured ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                }`}>
                  {isPayoutConfigured ? "✓ Versement Configuré" : "⚠️ Versement Non Configuré"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Side */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border dark:border-zinc-800 p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b dark:border-zinc-800">
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-inner">
                      <CreditCard className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">Coordonnées de Versement</h3>
                      <p className="text-xs text-zinc-500">Configurez votre compte Mobile Money ou compte bancaire</p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePayoutDetails} className="space-y-6">
                    {/* Payment Method Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">Type de compte de destination</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPayoutMethod('momo');
                            haptics.medium();
                            sounds.click();
                          }}
                          className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 cursor-pointer ${
                            payoutMethod === 'momo'
                              ? 'border-brand bg-brand/[0.04] dark:bg-brand/[0.02]'
                              : 'border-zinc-200 dark:border-zinc-805 hover:border-zinc-300 bg-transparent'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            payoutMethod === 'momo' ? 'bg-brand/10 text-brand' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            <Zap className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm dark:text-white leading-tight">Mobile Money</p>
                            <p className="text-[10px] text-zinc-400 mt-1">M-Pesa, Orange, Airtel</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPayoutMethod('bank');
                            haptics.medium();
                            sounds.click();
                          }}
                          className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 cursor-pointer ${
                            payoutMethod === 'bank'
                              ? 'border-brand bg-brand/[0.04] dark:bg-brand/[0.02]'
                              : 'border-zinc-200 dark:border-zinc-805 hover:border-zinc-300 bg-transparent'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            payoutMethod === 'bank' ? 'bg-brand/10 text-brand' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm dark:text-white leading-tight">Virement Bancaire</p>
                            <p className="text-[10px] text-zinc-400 mt-1">Rawbank, EquityBCDC, TMB</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Conditional Input Fields */}
                    {payoutMethod === 'momo' ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Opérateur Mobile Money</label>
                          <select
                            value={momoProvider}
                            onChange={(e) => setMomoProvider(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand text-sm dark:text-white font-bold cursor-pointer"
                          >
                            <option value="M-Pesa">Vodacom M-Pesa 🔴 (Recommandé)</option>
                            <option value="Orange Money">Orange Money 🟠</option>
                            <option value="Airtel Money">Airtel Money 🔴</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Numéro de Téléphone Mobile Money</label>
                          <input
                            type="text"
                            required
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            placeholder="ex: +243 812 345 678"
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Nom complet du Titulaire</label>
                          <input
                            type="text"
                            required
                            value={momoHolder}
                            onChange={(e) => setMomoHolder(e.target.value)}
                            placeholder="ex: Papa Lazard Lumu"
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Établissement Bancaire en RDC</label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand text-sm dark:text-white font-bold cursor-pointer"
                          >
                            <option value="Rawbank">Rawbank 🏦</option>
                            <option value="EquityBCDC">EquityBCDC 🏦</option>
                            <option value="TMB">Trust Merchant Bank (TMB) 🏦</option>
                            <option value="Ecobank">Ecobank RDC 🏦</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Numéro de compte officiel</label>
                          <input
                            type="text"
                            required
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            placeholder="ex: CD01 0010 1000 1234 5678 9012"
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Code SWIFT (BIC)</label>
                            <input
                              type="text"
                              required
                              value={bankSwift}
                              onChange={(e) => setBankSwift(e.target.value)}
                              placeholder="ex: RAWBCDKI"
                              className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white font-mono uppercase"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-500 uppercase">Titulaire officiel du compte</label>
                            <input
                              type="text"
                              required
                              value={bankHolder}
                              onChange={(e) => setBankHolder(e.target.value)}
                              placeholder="ex: Luiza Coopérative SARL"
                              className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand dark:text-white font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-zinc-855 flex gap-3 text-xs text-zinc-500 leading-relaxed">
                      <Lock className="w-5 h-5 text-brand shrink-0" />
                      <p>
                        Vos coordonnées de versement sont chiffrées de bout en bout et protégées selon les normes de conformité bancaire de la Banque Centrale du Congo (BCC).
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-5 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-brand/20 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Mettre à jour et valider
                    </button>
                  </form>
                </div>
              </div>

              {/* Status and Summary Side */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-8 bg-zinc-900 border border-zinc-800 text-white rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                    <DollarSign className="w-48 h-48" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-brand tracking-wide uppercase">Votre Solde Eladma</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Avoirs et versements automatiques</p>
                  </div>

                  <div className="bg-zinc-950/60 p-6 border border-zinc-800/80 rounded-3xl space-y-4">
                    <div>
                      <span className="text-xs text-zinc-500 block">Gains en attente de versement</span>
                      <strong className="text-3xl font-black text-white">{formatPrice(1425.50)}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Prochain virement prévu : Lundi à 08:30 (Synchro auto)
                    </div>

                    <div className="border-t border-zinc-900 pt-3 flex justify-between text-xs text-zinc-400">
                      <span>Fréquence d'expédition</span>
                      <span className="font-bold text-zinc-200">Hebdomadaire (Gratuite)</span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Destination configurée</span>
                      <span className="font-bold text-zinc-200 truncate max-w-[190px]">
                        {payoutMethod === 'momo' ? `${momoProvider} (${momoPhone || 'À renseigner'})` : `${bankName} (${bankAccount ?  bankAccount.substring(0, 8) + '...' : 'À renseigner'})`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Derniers virements effectués</h5>
                    <div className="space-y-3">
                      {[
                        { date: '30 Mai 2026', ref: 'TX-92041-M', amount: 890.00, method: 'M-Pesa/Momo', status: 'virement effectué' },
                        { date: '23 Mai 2026', ref: 'TX-89032-B', amount: 1250.00, method: 'Rawbank / DGI', status: 'virement effectué' },
                        { date: '16 Mai 2026', ref: 'TX-84903-M', amount: 685.50, method: 'OrangeMoney', status: 'virement effectué' }
                      ].map((tx, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                          <div>
                            <p className="text-xs font-bold text-zinc-205">{tx.method} • {formatPrice(tx.amount)}</p>
                            <p className="text-[10px] text-zinc-550">{tx.date} • Réf : {tx.ref}</p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase">
                            Succès
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-500/[0.04] dark:bg-emerald-550/[0.02] border border-emerald-500/20 dark:border-emerald-500/15 rounded-[2rem] space-y-4">
                  <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Pas besoin de site web personnel !
                  </h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Vous vendez directement sur votre vitrine hébergée clé en main par Eladma. Dès qu'un client achète l'un de vos articles, notre plateforme assure la gestion logistique et le paiement. Vos fonds sont reversés en direct sur votre compte financier désigné ci-contre.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products List Placeholder */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input 
                    type="text" 
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    placeholder="Rechercher dans mes produits (nom, catégorie)..." 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white font-medium"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      haptics.medium();
                      sounds.click();
                      setLowStockFilter(!lowStockFilter);
                    }}
                    className={`px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                      lowStockFilter 
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400' 
                        : 'bg-zinc-50 border-zinc-150 text-zinc-650 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-current" />
                    <span>Stock Critique {lowStockProductsCount > 0 ? `(${lowStockProductsCount})` : ''}</span>
                  </button>

                  {lowStockFilter && (
                    <button 
                      onClick={() => {
                        haptics.light();
                        sounds.click();
                        setLowStockFilter(false);
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline font-semibold"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th className="px-8 py-4">Produit</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4">Prix</th>
                      <th className="px-6 py-4">Niveau de Stock</th>
                      <th className="px-6 py-4">Seuil d'Alerte</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-zinc-800">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-16 text-center text-zinc-500 font-medium">
                          <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                          <p className="text-zinc-700 dark:text-zinc-300 font-bold">Aucun produit trouvé</p>
                          <p className="text-xs text-zinc-400 mt-1">Insérez de nouveaux produits ou ajustez le filtre pour l'afficher.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isLowStock = p.stock <= p.threshold;
                        const isOutOfStock = p.stock === 0;

                        return (
                          <tr key={p.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all ${isLowStock ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.01]' : ''}`}>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <img src={p.image} className="w-12 h-12 rounded-xl object-cover border dark:border-zinc-800 shrink-0" referrerPolicy="no-referrer" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm dark:text-white">{p.name}</p>
                                    {isLowStock && (
                                      <span className="p-1 rounded-md bg-rose-500/10 text-rose-500" title="Alerte stock faible !">
                                        <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-400 dark:text-zinc-500">ID: #{p.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 px-2.5 py-1 rounded-lg text-zinc-650">
                                {p.category}
                              </span>
                            </td>
                            <td className="px-6 py-5 font-bold dark:text-white">{formatPrice(p.price)}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                {isOutOfStock ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 text-xs font-black uppercase tracking-wider">
                                    En rupture
                                  </span>
                                ) : isLowStock ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold animate-pulse">
                                    Critique ({p.stock})
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold dark:text-zinc-300 text-zinc-700">
                                    {p.stock} unités
                                  </span>
                                )}

                                {/* Inline Stock adjustment tools */}
                                <div className="flex items-center border dark:border-zinc-800 rounded-lg overflow-hidden shrink-0 ml-2">
                                  <button 
                                    onClick={() => {
                                      const nextStock = Math.max(0, p.stock - 1);
                                      handleUpdateProductStockAndThreshold(p.id, nextStock, p.threshold);
                                    }}
                                    className="p-1 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-r dark:border-zinc-850 text-zinc-500 font-bold text-xs hover:text-zinc-800 transition-colors"
                                    title="Retirer 1 unité"
                                  >
                                    -
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const nextStock = p.stock + 1;
                                      handleUpdateProductStockAndThreshold(p.id, nextStock, p.threshold);
                                    }}
                                    className="p-1 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 font-bold text-xs hover:text-zinc-800 transition-colors"
                                    title="Ajouter 1 unité"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm dark:text-zinc-400 font-bold">
                              {p.threshold} unités
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <button 
                                  onClick={() => {
                                    haptics.medium();
                                    sounds.open();
                                    setEditingProduct(p);
                                  }}
                                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl transition-all"
                                  title="Modifier le seuil d'alerte"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Voulez-vous supprimer "${p.name}" ?`)) {
                                      deleteSupplierProduct(p.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 rounded-xl transition-all"
                                  title="Supprimer"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>

      {/* Add Product Modal (Simplified) */}
      {showAddProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddProduct(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Nouveau Produit</h2>
             <form className="space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const fData = new FormData(e.currentTarget);
              const prodName = fData.get('productName') as string || '';
              const prodPrice = Number(fData.get('productPrice') as string || '0');
              const prodStock = Number(fData.get('productStock') as string || '0');
              const prodThreshold = Number(fData.get('productThreshold') as string || '5');
              const prodCategory = fData.get('productCategory') as string || 'Électronique';
              const prodDesc = fData.get('productDesc') as string || '';

              const cleanName = EladmaSecurity.sanitizeInput(prodName);
              const cleanDesc = EladmaSecurity.sanitizeInput(prodDesc);

              if (!cleanName || !cleanDesc) {
                toast.error("⚠️ Sécurité : Caractères interdits détectés dans les informations du produit.");
                return;
              }

              handleAddSupplierProduct(cleanName, prodPrice, prodStock, prodThreshold, prodCategory, cleanDesc);
              toast.success(`Produit "${cleanName}" ajouté et publié en direct !`);
              setShowAddProduct(false);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">Nom du Produit</label>
                  <input required name="productName" type="text" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white" placeholder="ex: Casque Bluetooth..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">Prix de vente ({currency})</label>
                  <input required name="productPrice" type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">Catégorie</label>
                  <select name="productCategory" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white font-bold cursor-pointer">
                    <option value="Electronics">Électronique (Téléphone, Ordinateur, etc.)</option>
                    <option value="Furniture">Mobilier & Matériel des meubles (Chaises, Lits, etc.)</option>
                    <option value="Automotive">Pièces & Outillage (Voitures, Moto, Moulin)</option>
                    <option value="Fashion">Vêtements & Accessoires (Mode)</option>
                    <option value="Home">Maison, Déco & Tableaux</option>
                    <option value="Artisanat">Artisanat Kasaïen</option>
                    <option value="Beauty">Beauté & Soins</option>
                    <option value="Sports">Sports & Loisirs</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">Stock Initial</label>
                  <input name="productStock" required min="0" type="number" defaultValue="10" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-500 uppercase">Seuil d'Alerte Stock</label>
                  <input name="productThreshold" required min="0" type="number" defaultValue="5" className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase">Description IA</label>
                <textarea name="productDesc" required rows={4} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white resize-none" placeholder="Décrivez votre produit, notre IA optimisera le texte pour la vente."></textarea>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-[2] py-4 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20">Publier le produit</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Stock & Threshold Alert Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold dark:text-white">Ajuster Stock & Alerte</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Pour {editingProduct.name}</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fData = new FormData(e.currentTarget);
              const nStock = Number(fData.get('editStock') as string);
              const nThreshold = Number(fData.get('editThreshold') as string);

              handleUpdateProductStockAndThreshold(editingProduct.id, nStock, nThreshold);
              setEditingProduct(null);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Stock Actuel (unités)</label>
                <input 
                  type="number" 
                  min="0" 
                  name="editStock" 
                  defaultValue={editingProduct.stock} 
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white font-bold text-lg" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Seuil d'alerte critique</label>
                  <span className="text-[10px] text-brand bg-brand/10 px-2 py-0.5 font-bold rounded">Seuil</span>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  name="editThreshold" 
                  defaultValue={editingProduct.threshold} 
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-brand dark:text-white font-bold text-lg" 
                />
                <p className="text-xs text-zinc-500">Si le niveau de stock est inférieur ou égal à ce nombre, une alerte visuelle sera générée.</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* KYC Modal */}
      {showKYC && (
        <KYCVerification 
          onComplete={(photoData) => {
            setSelfie(photoData);
            setShowKYC(false);
            toast.success("Vérification faciale terminée !");
          }}
          onCancel={() => setShowKYC(false)}
        />
      )}

      {/* Document Viewer Modal for Administrative simulation */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setInspectingDoc(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border dark:border-zinc-800"
          >
            <div className="flex items-center justify-between pb-4 border-b dark:border-zinc-850 mb-6 font-sans">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand" />
                <div>
                  <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest">{inspectingDoc.title}</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Visualiseur de fichiers chiffrés Eladma</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingDoc(null)}
                className="px-3 py-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border dark:border-zinc-850 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed h-[360px] overflow-y-auto shadow-inner">
              {inspectingDoc.content}
            </div>

            <div className="mt-6 flex justify-end font-sans">
              <button 
                onClick={() => setInspectingDoc(null)}
                className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md uppercase tracking-wider"
              >
                C'est compris
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
