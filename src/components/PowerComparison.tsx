import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Coins, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Cpu, 
  Check, 
  X, 
  ChevronRight, 
  ArrowLeftRight,
  Zap,
  HelpCircle
} from 'lucide-react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

type ProductType = 'automotive' | 'furniture' | 'decor' | 'electronics' | 'fashion';
type CityType = 'kinshasa' | 'lubumbashi' | 'goma' | 'kananga' | 'mbujimayi' | 'kisangani';

interface SimulationResult {
  payoutMethod: { global: string; eladma: string };
  shippingCost: { global: string; eladma: string };
  deliveryTime: { global: string; eladma: string };
  deliveryAddress: { global: string; eladma: string };
  authenticity: { global: string; eladma: string };
  powerRatio: { global: number; eladma: number };
  explanation: string;
}

export const PowerComparison: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('automotive');
  const [selectedCity, setSelectedCity] = useState<CityType>('kinshasa');
  const [activeTab, setActiveTab] = useState<'simulator' | 'infrastructure'>('simulator');

  const productsInfo = {
    automotive: { label: "Pièces de Rechange (Moto, Auto, Moulin)", weight: "Lourd/Technique", example: "Plaquettes de frein ou piston de moulin" },
    furniture: { label: "Mobilier & Meubles lourds", weight: "Trés Volumineux", example: "Lits, chaises ou fauteuils en wengé" },
    decor: { label: "Tableaux & Décorations fragiles", weight: "Fragile/Précieux", example: "Peintures sur toile ou masques d'artisanat" },
    electronics: { label: "Téléphones & Ordinateurs d'occasion", weight: "Léger/Précieux", example: "Smartphone local ou ordinateur portable" },
    fashion: { label: "Vêtements & Prêt-à-porter", weight: "Léger", example: "Vestes de pluie ou pagnes tressés" },
  };

  const citiesInfo = {
    kinshasa: { label: "Kinshasa", distance: "Hub Central", transport: "Livraison urbaine rapide" },
    lubumbashi: { label: "Lubumbashi", distance: "Sud de la RDC", transport: "Avion cargo / Train" },
    goma: { label: "Goma", distance: "Est de la RDC", transport: "Livraison Grands Lacs" },
    kananga: { label: "Kananga", distance: "Kasaï-Central", transport: "Connexion fluviale & pistes" },
    mbujimayi: { label: "Mbuji-Mayi", distance: "Kasaï-Oriental", transport: "Vols locaux & pistes" },
    kisangani: { label: "Kisangani", distance: "Nord/Fleuve Congo", transport: "Barge fluviale & Route" },
  };

  const simulation: SimulationResult = useMemo(() => {
    let globalCost = "$80 - $150";
    let eladmaCost = "$4 - $12";
    let globalTime = "25 - 45 jours";
    let eladmaTime = "24h - 72h max";
    let explanation = "";
    let globalScore = 18;
    let eladmaScore = 96;

    // Custom dynamics based on product and city values
    if (selectedProduct === 'automotive') {
      globalCost = "$110 - $250 (Frais d'importation excessifs)";
      eladmaCost = "$8 - $15 (Tarifa spécial quincaillerie)";
      globalTime = "35 - 50 jours (Retenu en douane)";
      eladmaTime = "36h à 48h";
      globalScore = 12;
      eladmaScore = 98;
      explanation = `Pour les pièces de rechange lourdes ou agricoles (moulin, moto), Amazon ou AliExpress imposent des frais d'avion cargo démentiels et exigent des formulaires douaniers complexes. Eladma, via ses quincailleries locales affiliées, utilise des stocks de proximité et les réseaux de transport fluviaux/aériens intérieurs déjà actifs de RDC.`;
    } else if (selectedProduct === 'furniture') {
      globalCost = "$350+ (Souvent non expédiable par colis postal)";
      eladmaCost = "$20 - $45 (Livraison fret de meuble par camion/barge)";
      globalTime = "Indéterminé (Refusé par les transporteurs)";
      eladmaTime = "3 à 5 jours";
      globalScore = 5;
      eladmaScore = 95;
      explanation = `Le mobilier lourd n'est tout simplement pas gérable par AliExpress ou Amazon vers les communes intérieures du Congo en raison du volume. Eladma permet aux artisans du Kasaï et aux menuisiers de Kinshasa d'expédier directement par wagons de fret de la SNCC ou camions locaux sécurisés avec un système d'assurance intégré.`;
    } else if (selectedProduct === 'decor') {
      globalCost = "$90 - $160 (Sensibilité casse élevée)";
      eladmaCost = "$5 - $10 (Optimisé)";
      globalTime = "20 - 35 jours (Risques d'humidité en transit maritime)";
      eladmaTime = "24h à 48h";
      globalScore = 20;
      eladmaScore = 97;
      explanation = `Les tableaux d'art et décorations en bois précieux exigent un conditionnement délicat. Un voyage maritime long via Amazon détériore les toiles. Eladma enveloppe localement vos objets dans des toiles de jute renforcées traditionnelles et les confie aux coursiers locaux qualifiés.`;
    } else if (selectedProduct === 'electronics') {
      globalCost = "$45 - $90 (Frais d'activation et taxes d'import)";
      eladmaCost = "$3 - $6";
      globalTime = "15 - 30 jours (Contrôles batteries strictes)";
      eladmaTime = "12h à 24h";
      globalScore = 32;
      eladmaScore = 99;
      explanation = `L'électronique sur AliExpress subit de fréquentes taxes d'import non déclarées à l'arrivée. Sur Eladma, la TAV (taxe inter-province) est calculée et payée directement lors du panier. Zéro surprise à l'arrivée dans votre commune.`;
    } else { // fashion
      globalCost = "$30 - $65";
      eladmaCost = "$2.5 - $5 max";
      globalTime = "18 - 30 jours (Perte de colis fréquente)";
      eladmaTime = "24h";
      globalScore = 28;
      eladmaScore = 96;
      explanation = `La mode africaine et les accessoires de créateurs locaux ne sont pas présents sur Amazon. AliExpress ne propose que de la confection synthétique de masse. Eladma réunit les coopératives textiles de artisanat congolais pour des vêtements uniques livrés demain matin chez vous.`;
    }

    // Adaptations based on selected city
    if (selectedCity === 'kananga' || selectedCity === 'mbujimayi') {
      globalCost = globalCost.replace(/\$(\d+)/g, (_, n) => `$${Math.round(parseInt(n) * 1.3)}`);
      eladmaCost = eladmaCost.replace(/\$(\d+)/g, (_, n) => `$${Math.round(parseInt(n) * 1.15)}`);
      globalTime = "45 - 60 jours ou non-livrable";
      eladmaTime = "48h à 72h max";
      globalScore = Math.max(5, globalScore - 8);
      eladmaScore = Math.min(99, eladmaScore + 1);
    } else if (selectedCity === 'goma') {
      globalTime = "40 - 55 jours (Transit compliqué par ports extérieurs)";
      eladmaTime = "24h à 48h (Stocks régionaux Gisenyi/Goma)";
      globalScore = Math.max(5, globalScore - 5);
    }

    return {
      payoutMethod: {
        global: "Cartes Visa/Mastercard, PayPal. Virement SWIFT vers banques occidentales (inexistant pour 90% des vendeurs et acheteurs en RDC).",
        eladma: "Paiements 100% Mobile Money (M-Pesa, Orange Money, Airtel Money) et comptes Rawbank/EquityBCDC. Aucun prérequis bancaire international.",
      },
      shippingCost: {
        global: globalCost,
        eladma: eladmaCost,
      },
      deliveryTime: {
        global: globalTime,
        eladma: eladmaTime,
      },
      deliveryAddress: {
        global: "Obligation de fournir un code postal international, numéro de rue exact et nom de boîte aux lettres.",
        eladma: "Repères visuels fluides (ex: 'Après l'église St-Alphonse, portail noir') + coordonnées WhatsApp GPS et coursiers mototaxis familiers des quartiers.",
      },
      authenticity: {
        global: "Politique de retour d'article inapplicable ou trop chère pour l'Afrique. Trop de copies d'appareils et pièces défectueuses.",
        eladma: "Scan photo IA (Gemini Engine) et Tiers de Confiance (Escrow) : l'argent du vendeur est séquestré jusqu'à vérification physique à la livraison.",
      },
      powerRatio: {
        global: globalScore,
        eladma: eladmaScore,
      },
      explanation,
    };
  }, [selectedProduct, selectedCity]);

  const handleInteract = () => {
    haptics.light();
    sounds.select();
  };

  return (
    <div id="eladma-power-comparison" className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[2.5rem] p-6 lg:p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand/[0.015] rounded-full blur-3xl pointer-events-none -ml-44 -mt-44" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/[0.015] rounded-full blur-3xl pointer-events-none -mr-44 -mb-44" />
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200/80 dark:border-zinc-800 pb-8 mb-8 relative z-10">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand/10 dark:bg-brand/20 text-brand rounded-full text-[10px] font-black uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Comparateur de Souveraineté
          </span>
          <h2 className="text-2xl lg:text-3.5xl font-black text-zinc-950 dark:text-white tracking-tight leading-none">
            Eladma <span className="text-brand">vs</span> Géants Internationaux
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            Amazon et AliExpress ont été pensés pour des infrastructures occidentales ou asiatiques avec adresses exactes et cartes de crédit. Eladma réinvente le commerce en s'adaptant à 100% de la réalité africaine.
          </p>
        </div>
        
        {/* Toggle Nav */}
        <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/80 rounded-2xl shrink-0 self-start lg:self-center border border-zinc-200/20">
          <button
            onClick={() => {
              setActiveTab('simulator');
              handleInteract();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'simulator' 
                ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm scale-100' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Simulateur d'Acheminement
          </button>
          <button
            onClick={() => {
              setActiveTab('infrastructure');
              handleInteract();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'infrastructure' 
                ? 'bg-white dark:bg-zinc-900 text-brand shadow-sm scale-100' 
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Infrastructures d'Afrique
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'simulator' ? (
          <motion.div
            key="simulator"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
          >
            {/* Input Side */}
            <div className="lg:col-span-4 space-y-6">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs">1</span>
                  Saisir le type d'article
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(productsInfo).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedProduct(key as ProductType);
                        handleInteract();
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        selectedProduct === key 
                          ? 'bg-brand/10 dark:bg-brand/20 border-brand/40 text-brand' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold text-xs tracking-tight">{info.label}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{info.example}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-805 rounded-md font-bold text-zinc-500 uppercase shrink-0">
                        {info.weight}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs">2</span>
                  Ville de Livraison en RDC
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(citiesInfo).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCity(key as CityType);
                        handleInteract();
                      }}
                      className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        selectedCity === key 
                          ? 'bg-brand/10 dark:bg-brand/20 border-brand/40 text-brand font-black' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                    >
                      <p className="text-xs font-black">{info.label}</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">{info.distance}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comparison Grid Results & Score */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Score Meter Banner */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/85 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm dark:text-white leading-tight">Indice d'Efficacité Réel d'Acheminement</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-sm">
                      Note estimée basée sur le coût de transport, la rapidité, le mode d'encaissement et l'accessibilité logistique.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-zinc-450 block mb-1">Eladma RDC</span>
                    <span className="text-3xl font-black text-emerald-500">{simulation.powerRatio.eladma}%</span>
                    <span className="block text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">Optimal</span>
                  </div>
                  <div className="w-px h-10 bg-zinc-250 dark:bg-zinc-800" />
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-zinc-450 block mb-1">AliExpress / AMZN</span>
                    <span className="text-3xl font-black text-rose-500">{simulation.powerRatio.global}%</span>
                    <span className="block text-[9px] text-rose-600 font-extrabold uppercase mt-0.5 tracking-wider">Inadapté</span>
                  </div>
                </div>
              </div>

              {/* Grid Side-by-Side Table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/85 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-zinc-100/50 dark:bg-zinc-950/40 border-b border-zinc-200/60 dark:border-zinc-800/80 p-4 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <div className="col-span-3">Critère Global</div>
                  <div className="col-span-4 text-rose-600 dark:text-rose-400">AMAZON / ALIEXPRESS</div>
                  <div className="col-span-5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ELADMA AFRICA <Sparkles className="w-3 h-3 text-brand" />
                  </div>
                </div>

                <div className="divide-y divide-zinc-150/50 dark:divide-zinc-850">
                  {/* Transport Cost */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-0 items-start">
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold dark:text-zinc-100">Coût d'envoi</span>
                    </div>
                    <div className="col-span-6 sm:col-span-4 pr-3">
                      <p className="text-xs font-black text-rose-500">{simulation.shippingCost.global}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Taxe douanière fixe.</p>
                    </div>
                    <div className="col-span-6 sm:col-span-5 bg-emerald-500/[0.02] -my-5 py-5 px-3 border-l border-emerald-500/10">
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> {simulation.shippingCost.eladma}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Négocié avec coopératives fluviales & motos.</p>
                    </div>
                  </div>

                  {/* Delay Time */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-0 items-start">
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold dark:text-zinc-100">Délai Réel</span>
                    </div>
                    <div className="col-span-6 sm:col-span-4 pr-3">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{simulation.deliveryTime.global}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Délai maritime / transit aérien lointain.</p>
                    </div>
                    <div className="col-span-6 sm:col-span-5 bg-emerald-500/[0.02] -my-5 py-5 px-3 border-l border-emerald-500/10 animate-pulse">
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> {simulation.deliveryTime.eladma}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Dépôts régionaux proches & vols intérieurs.</p>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-0 items-start">
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold dark:text-zinc-100">Paiement Vendeur</span>
                    </div>
                    <div className="col-span-12 sm:col-span-4 pr-3 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                      {simulation.payoutMethod.global}
                    </div>
                    <div className="col-span-12 sm:col-span-5 bg-emerald-500/[0.02] -my-5 py-5 px-3 border-l border-emerald-500/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold block mb-0.5">✓ 100% Souple & Immédiat</span>
                      {simulation.payoutMethod.eladma}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-0 items-start">
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold dark:text-zinc-100">Spécificité Adresse</span>
                    </div>
                    <div className="col-span-12 sm:col-span-4 pr-3 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                      {simulation.deliveryAddress.global}
                    </div>
                    <div className="col-span-12 sm:col-span-5 bg-emerald-500/[0.02] -my-5 py-5 px-3 border-l border-emerald-500/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold block mb-0.5">✓ Repérage Visuel & WhatsApp</span>
                      {simulation.deliveryAddress.eladma}
                    </div>
                  </div>

                  {/* Authentication Verification */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-0 items-start">
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold dark:text-zinc-100">Garantie Qualité</span>
                    </div>
                    <div className="col-span-12 sm:col-span-4 pr-3 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                      {simulation.authenticity.global}
                    </div>
                    <div className="col-span-12 sm:col-span-5 bg-emerald-500/[0.02] -my-5 py-5 px-3 border-l border-emerald-500/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold block mb-0.5">✓ Séquestre & IA Intelligents</span>
                      {simulation.authenticity.eladma}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic textual explanation */}
              <div className="p-5 rounded-2xl bg-zinc-200/40 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-850 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                  <strong>Notes de l'Expert Fluvial / Routier d'Eladma :</strong> {simulation.explanation}
                </p>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="infrastructure"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
          >
            {/* Tech Pillar 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
              <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <Coins className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-extrabold text-sm dark:text-white leading-tight">Système d'Escrow (Séquestre) Souple</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Sur Eladma, la confiance est codée par défaut. Quand un acheteur commande, l'argent en Mobile Money est temporairement séquestré chez Eladma. Le vendeur n'est payé que lorsque le coursier livre et que l'authenticité de l'article (pièces, de moulin, vêtements, tableaux) est confirmée de visu ou validée par l'application. Très rassurant pour éviter les contrefaçons !
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-brand uppercase tracking-wider block mb-1">MÉCANISME D'APPLICATIONS LOCAL EN DIRECT</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Intégration API de Rawbank et Airtel Money pour bloquer ou initier un versement automatique sans aucune complexité intermédiaire.
                </span>
              </div>
            </div>

            {/* Tech Pillar 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm dark:text-white leading-tight">Analyse d'Authenticité par IA</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Vous achetez une pièce automobile d'origine ou une malachite artisanale ? Notre assistant IA intégré basé sur Gemini permet d'historiser et de comparer l'objet en photo avec nos bases de données de contrefaçons connues. Le client prend en photo le colis et notre moteur d'IA classe instantanément la conformité. Toujours un grand pas devant l'anonymat d'AliExpress.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">AUDIT TECHNIQUE VISUEL D'ŒUVRE OU PIÈCE</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Analyseur visuel Gemini API activé en un clic lors de la soumission de litige ou contrôle colis auprès du livreur.
                </span>
              </div>
            </div>

            {/* Tech Pillar 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 p-6 rounded-[2rem] space-y-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm dark:text-white leading-tight">Logistique Routière & Fluviale</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Amazon n'a pas de flotte à Kinshasa ni de navires sur le fleuve Congo pour rallier Kisangani ou Kasaï. Eladma a créé un réseau maillé de piroguiers agréés et de conducteurs de mototaxis spécialisés appelés "Mek-Wewa". Ils s'échangent des colis de manière sécurisée en s'appuyant uniquement sur les géolocalisations mobiles et contacts WhatsApp.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">MÉTHODOLOGIE D'ACHEMINEMENT DIRECTE</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Optimisation par repères d'environnement visuel locaux sans code postal ou nom de rue goudronnée officiel.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
