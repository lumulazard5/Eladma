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
  ArrowLeftRight,
  Zap,
  Globe,
  BookOpen
} from 'lucide-react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

type ProductType = 'automotive' | 'furniture' | 'decor' | 'electronics' | 'fashion';
type CityType = 'kinshasa' | 'lubumbashi' | 'goma' | 'kananga' | 'mbujimayi' | 'kisangani';

interface SimulationResult {
  payoutMethod: string;
  shippingCost: string;
  deliveryTime: string;
  deliveryAddress: string;
  authenticity: string;
  powerRatio: number;
  explanation: string;
}

export const PowerComparison: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>('automotive');
  const [selectedCity, setSelectedCity] = useState<CityType>('kinshasa');
  const [activeTab, setActiveTab] = useState<'simulator' | 'infrastructure'>('simulator');

  const productsInfo = {
    automotive: { label: "Pièces de Rechange (Moto, Auto, Moulin)", weight: "Lourd/Technique", example: "Plaquettes de frein ou piston de moulin" },
    furniture: { label: "Mobilier & Meubles lourds", weight: "Très Volumineux", example: "Lits, chaises ou fauteuils en wengé" },
    decor: { label: "Tableaux & Décorations fragiles", weight: "Fragile/Précieux", example: "Peintures sur toile ou masques d'artisanat" },
    electronics: { label: "Téléphones & Ordinateurs", weight: "Léger/Précieux", example: "Smartphone ou ordinateur portable" },
    fashion: { label: "Vêtements & Prêt-à-porter", weight: "Léger", example: "Vestes de pluie ou pagnes tissés" },
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
    let eladmaCost = "$4 - $12";
    let eladmaTime = "24h - 72h max";
    let explanation = "";
    let eladmaScore = 96;

    if (selectedProduct === 'automotive') {
      eladmaCost = "$8 - $15 (Tarif spécial quincaillerie)";
      eladmaTime = "36h à 48h";
      eladmaScore = 98;
      explanation = `Pour les pièces de rechange lourdes ou agricoles (moulin, moto), Eladma, via ses quincailleries locales affiliées, utilise des stocks de proximité et les réseaux de transport fluviaux ou routiers intérieurs déjà actifs pour assurer une livraison ultra-rapide.`;
    } else if (selectedProduct === 'furniture') {
      eladmaCost = "$20 - $45 (Livraison fret de meuble par camion/barge)";
      eladmaTime = "3 à 5 jours d'expédition";
      eladmaScore = 95;
      explanation = `Le transport de mobilier volumineux est opéré via des wagons de fret nationaux ou des camions locaux affiliés. Les artisans et menuisiers de la région disposent d'un protocole sécurisé assurant la protection physique des bois précieux d'artisanat.`;
    } else if (selectedProduct === 'decor') {
      eladmaCost = "$5 - $10 (Optimisé)";
      eladmaTime = "24h à 48h";
      eladmaScore = 97;
      explanation = `Les objets précieux et toiles d'art nécessitent un conditionnement rigoureux. Nos coursiers locaux qualifiés emballent soigneusement les œuvres d'art dans des toiles renforcées protectrices et mènent un transport direct à destination.`;
    } else if (selectedProduct === 'electronics') {
      eladmaCost = "$3 - $6";
      eladmaTime = "12h à 24h";
      eladmaScore = 99;
      explanation = `Le matériel technologique et électronique bénéficie d'un suivi très rigoureux. La taxe de transport inter-province (TAV) est calculée et intégrée directement au panier dès la validation, supprimant tout imprévu logistique et frais cachés durant l'acheminement.`;
    } else { // fashion
      eladmaCost = "$2.5 - $5 max";
      eladmaTime = "24h";
      eladmaScore = 96;
      explanation = `Les confections de créateurs et ateliers textiles locaux sont regroupées au sein de coopératives de proximité, ce qui assure une réactivité optimale et des liaisons directes quotidiennes entre ateliers de fabrication et points de retrait urbains.`;
    }

    if (selectedCity === 'kananga' || selectedCity === 'mbujimayi') {
      eladmaCost = eladmaCost.replace(/\$(\d+)/g, (_, n) => `$${Math.round(parseFloat(n) * 1.15)}`);
      eladmaTime = "48h à 72h max";
      eladmaScore = Math.min(99, eladmaScore + 1);
    } else if (selectedCity === 'goma') {
      eladmaTime = "24h à 48h (Stocks régionaux locaux)";
    }

    return {
      payoutMethod: "Paiements mobiles intégrés (M-Pesa, Orange Money, Airtel Money) et comptes Rawbank/EquityBCDC. Solution financière fluide, de proximité et sans contrainte bancaire internationale.",
      shippingCost: eladmaCost,
      deliveryTime: eladmaTime,
      deliveryAddress: "Repérage fluide par points d'intérêt visuels locaux (églises, carrefours, écoles) combiné avec coordonnées géographiques numériques (GPS) et messagerie directe avec les livreurs agréés.",
      authenticity: "Système de tiers de confiance (séquestre) et inspection visuelle intelligente : le déblocage des fonds vers le vendeur n'intervient qu'après la vérification physique et l'acceptation de l'article à la livraison.",
      powerRatio: eladmaScore,
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
            <Scale className="w-3.5 h-3.5" /> Souveraineté Logistique
          </span>
          <h2 className="text-2xl lg:text-3.5xl font-black text-zinc-950 dark:text-white tracking-tight leading-none">
            L'Infrastructure Innovante d'Eladma
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
            Une architecture logistique nationale conçue de A à Z pour s'adapter parfaitement aux réalitées locales, aux réseaux routiers/fluviaux et aux configurations géographiques de la RDC.
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
            Estimation d'Acheminement
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
            Infrastructures d'Eladma
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
                  Sélectionner un type d'article
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

            {/* Results & Score Panel */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Score Meter Banner */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/85 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm dark:text-white leading-tight">Indice d'Adéquation Logistique d'Eladma</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-sm">
                      Évaluation d'adéquation et de fluidité basée sur la couverture locale, le coût optimisé et l'intégration mobile.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center min-w-[120px]">
                    <span className="text-[10px] font-black uppercase text-zinc-450 block mb-1">Score d'Adéquation</span>
                    <span className="text-3xl font-black text-emerald-500">{simulation.powerRatio}%</span>
                    <span className="block text-[9px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">Couverture Optimale</span>
                  </div>
                </div>
              </div>

              {/* Grid Specifications Cards */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/85 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="bg-zinc-100/50 dark:bg-zinc-950/40 border-b border-zinc-200/60 dark:border-zinc-800/80 p-4 text-[10px] font-black uppercase tracking-wider text-brand flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>Fiche Logistique d'Acheminement National</span>
                </div>

                <div className="divide-y divide-zinc-150/50 dark:divide-zinc-850">
                  {/* Transport Cost */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-2 items-start">
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black dark:text-zinc-105">Coût d'envoi estimé</span>
                    </div>
                    <div className="col-span-12 sm:col-span-8 bg-emerald-500/[0.015] py-3.5 px-4 rounded-2xl border border-emerald-500/10">
                      <p className="text-sm font-black text-emerald-650 dark:text-emerald-400 flex items-center gap-1.5 leading-none">
                        <Check className="w-4 h-4 stroke-[3]" /> {simulation.shippingCost}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Tarification juste négociée en direct avec notre maillage d'acteurs de fret locaux, transporteurs inter-pro et mototaxis.
                      </p>
                    </div>
                  </div>

                  {/* Delay Time */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-2 items-start">
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black dark:text-zinc-105">Période de livraison</span>
                    </div>
                    <div className="col-span-12 sm:col-span-8 bg-emerald-500/[0.015] py-3.5 px-4 rounded-2xl border border-emerald-500/10">
                      <p className="text-sm font-black text-emerald-650 dark:text-emerald-400 flex items-center gap-1.5 leading-none">
                        <Check className="w-4 h-4 stroke-[3]" /> {simulation.deliveryTime}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Acheminement accéléré s'appuyant sur des plateformes de stockage avancées et l'optimisation des flux régionaux de RDC.
                      </p>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-2 items-start">
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black dark:text-zinc-105">Solutions financières</span>
                    </div>
                    <div className="col-span-12 sm:col-span-8 py-1">
                      <span className="text-emerald-650 dark:text-emerald-405 font-bold text-xs flex items-center gap-1 mb-1">
                        ✓ Intégration Bancaire & Mobile Money locale
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                        {simulation.payoutMethod}
                      </p>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-2 items-start">
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black dark:text-zinc-105">Système d'adressage</span>
                    </div>
                    <div className="col-span-12 sm:col-span-8 py-1">
                      <span className="text-emerald-650 dark:text-emerald-405 font-bold text-xs flex items-center gap-1 mb-1">
                        ✓ Flexibilité & Guidage de proximité
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                        {simulation.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  {/* Authentication Verification */}
                  <div className="grid grid-cols-12 p-5 gap-3 sm:gap-2 items-start">
                    <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black dark:text-zinc-105">Garanties & Confiance</span>
                    </div>
                    <div className="col-span-12 sm:col-span-8 py-1">
                      <span className="text-emerald-650 dark:text-emerald-405 font-bold text-xs flex items-center gap-1 mb-1">
                        ✓ Séquestre & Contrôle IA d'authenticité
                      </span>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                        {simulation.authenticity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic expert logs note */}
              <div className="p-5 rounded-2xl bg-zinc-200/40 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-850 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">
                  <strong>Notes de l'Expert d'Acheminement Eladma :</strong> {simulation.explanation}
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
                Sur Eladma, la confiance est intégrée par défaut. Lorsqu'une commande est validée, le règlement en Mobile Money est temporairement séquestré. Le versement final vers le vendeur intervient uniquement après livraison et inspection de l'article par l'acheteur. Un moyen fluide d'assurer la sérénité des échanges.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-brand uppercase tracking-wider block mb-1">MÉCANISME D'APPLICATIONS LOCAL EN DIRECT</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Intégration d'API locales et Mobile Money pour provisionner ou dénouer une transaction automatiquement dès confirmation de la livraison.
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
                Qu'il s'agisse de piéces mécaniques, d'équipements ou de créations artisanales complexes, notre IA intégrée vous offre un moyen d'historiser et de certifier l’état de l'article en photo. L'IA compare l'état visuel du produit, facilitant ainsi la levée de doute et l'authenticité de vos biens.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">AUDIT TECHNIQUE VISUEL DE BIENS</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Outil d'analyse d'image Gemini API intégré, activable en un geste pour attester l'intégrité de la pièce lors du contrôle de livraison.
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
                Pour assurer la fluidité de livraison sur l'axe Kinshasa, le fleuve Congo ou vers les régions de l'intérieur, Eladma s'appuie sur une flotte nationale maillée d'artisans livreurs routiers, d'exploitants fluviaux et de transporteurs de confiance collaborant en continu.
              </p>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">MÉTHODOLOGIE D'ACHEMINEMENT DIRECTE</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 block font-semibold leading-relaxed">
                  ✓ Dispatching intelligent basé sur des repères, les coordonnées GPS actuelles et les communications instantanées de proximité.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
