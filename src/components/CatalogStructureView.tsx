import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  ChevronRight, 
  Search, 
  User, 
  Sparkles, 
  Database, 
  Sliders, 
  Check, 
  Tag, 
  Cpu, 
  HelpCircle, 
  ArrowLeft,
  Filter,
  Info
} from 'lucide-react';
import { Product, Category } from '../types';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface CatalogStructureViewProps {
  products: Product[];
  onBack: () => void;
  onSelectProduct?: (product: Product) => void;
}

// Full Taxonomy Definition for Eladma's sovereign marketplace
interface TaxonomyCategory {
  id: Category;
  labelFr: string;
  labelLocal: string;
  description: string;
  icon: string;
  subcategories: {
    name: string;
    description: string;
    keywords: string[];
  }[];
}

const TAXONOMY: TaxonomyCategory[] = [
  {
    id: 'Artisanat',
    labelFr: "Artisanat d'Art & Patrimoine",
    labelLocal: 'Misala ya Maboko',
    description: "Chef-d'œuvres sculptés, objets traditionnels et reliques culturelles créés par nos coopératives locales (Ngaza, Katoka, Camp Vangu).",
    icon: '🎨',
    subcategories: [
      { name: "Sculptures & Malachite", description: "Bustes, statues et objets taillés dans le bois de wengé ou la malachite pure.", keywords: ["statue", "malachite", "bois", "sculpté", "kananga", "artisanat"] },
      { name: "Vannerie & Paniers Royaux", description: "Paniers de Kassai tressés à la main avec fibres naturelles et teintures organiques.", keywords: ["panier", "kasai", "tressé", "panier", "teinture", "sac"] },
      { name: "Peintures Traditionnelles", description: "Toiles contemporaines inspirées des motifs ancestraux Tshokwe ou Lulua.", keywords: ["tableau", "toile", "peinture", "acrylique", "tshokwe", "lulua"] }
    ]
  },
  {
    id: 'Home',
    labelFr: "Maison, Décoration & Standing",
    labelLocal: 'Ndako na Bolamu',
    description: "Aménagement d'intérieur de prestige, pièces artistiques de salon et linge de maison raffiné.",
    icon: '🏠',
    subcategories: [
      { name: "Décoration Murale", description: "Toiles et ornements muraux s'intégrant dans les espaces de haut standing.", keywords: ["tableau", "peinture", "décoration", "salon", "mur", "cadre"] },
      { name: "Art de la Table", description: "Pichets, bols de présentation et corbeilles tissées élégantes.", keywords: ["panier", "plat", "pichet", "table", "céramique"] },
      { name: "Luminaires & Éclairage", description: "Créations locales alliant fer forgé artisanal et abat-jours traditionnels.", keywords: ["lampe", "luminaire", "applique", "bougie"] }
    ]
  },
  {
    id: 'Furniture',
    labelFr: "Mobilier Prestige Congolais",
    labelLocal: 'Biloko ya Ndako',
    description: "Meubles massifs d'exception conçus en bois précieux de la forêt équatoriale (Wengé, Ébène, Teck) à haute durabilité.",
    icon: '🛋️',
    subcategories: [
      { name: "Chaises & Fauteuils Royaux", description: "Assises impériales sculptées offrant un confort haut de gamme aux salons.", keywords: ["fauteuil", "chaise", "royal", "wenge", "ebene"] },
      { name: "Tables de Salon & Bureaux", description: "Tables basses et tables de conférence aux finitions naturelles cirées.", keywords: ["table", "teck", "bureau", "basse", "bois"] },
      { name: "Rangements d'Exception", description: "Armoires et buffets robustes assemblés sans vis chimiques selon des joints artisanaux.", keywords: ["armoire", "buffet", "étagère", "commode"] }
    ]
  },
  {
    id: 'Automotive',
    labelFr: "Composants mécaniques, Auto & Industrie",
    labelLocal: 'Mituka na Bikolo',
    description: "Pièces de rechange robustes adaptées aux routes exigeantes, motocycles, et outillages de minoterie agricole.",
    icon: '⚙️',
    subcategories: [
      { name: "Moteurs & Pistons", description: "Kits de motorisation renforcés pour deux-roues et moteurs stationnaires.", keywords: ["piston", "segment", "joint", "culasse", "filtre", "moteur"] },
      { name: "Pièces de Broyage & Moulins", description: "Meules abrasives rustiques en acier trempé pour moulins de maïs et de manioc.", keywords: ["meule", "moulin", "abrasive", "broyeur", "maïs", "acier"] },
      { name: "Suspensions & Freinage", description: "Plaquettes de frein carbone, amortisseurs renforcés pour pistes poussiéreuses.", keywords: ["frein", "plaquettes", "amortisseur", "disque", "roue", "corolla"] }
    ]
  },
  {
    id: 'Electronics',
    labelFr: "Électronique & Énergies Autonomes",
    labelLocal: 'Mayele ya Sika',
    description: "Technologie moderne, smartphones d'élite certifiés et infrastructure solaire souveraine.",
    icon: '📱',
    subcategories: [
      { name: "Smartphones & Accessoires", description: "Smartphones fluides, écouteurs à réduction de bruit et chargeurs rapides.", keywords: ["téléphone", "smartphone", "elite", "casque", "audio", "écouteurs", "montre"] },
      { name: "Énergies Solaires", description: "Kits de panneaux photovoltaïques et batteries domestiques à longue durée de vie.", keywords: ["solaire", "panneau", "batterie", "générateur", "onduleur"] },
      { name: "Objets Connectés", description: "Montres de suivi de santé et capteurs environnementaux intelligents.", keywords: ["montre", "connectée", "sport", "rythme", "bracelet"] }
    ]
  },
  {
    id: 'Fashion',
    labelFr: "Confection & Haute Couture Congolaise",
    labelLocal: 'Molato ya Kitoko',
    description: "Vêtements de créateurs, pièces urbaines et prêt-à-porter de prestige conjuguant modernité et esthétique africaine.",
    icon: '👔',
    subcategories: [
      { name: "Vestes & Manteaux de Créateurs", description: "Vêtements d'extérieur stylisés et vestes hautement résistantes aux intempéries.", keywords: ["veste", "manteau", "blouson", "créateur", "pluie"] },
      { name: "Robes & Ensembles d'Événements", description: "Robes de haute couture en Wax premium, lin africain et soies assemblées.", keywords: ["robe", "ensemble", "wax", "pagne", "lin"] },
      { name: "Accessoires & Sacs de Luxe", description: "Sacs de cuir avec finitions en tressage de raphia ou de malachite.", keywords: ["sac", "ceinture", "chapeau", "pochette"] }
    ]
  }
];

// Levenshtein Distance Algorithm (Fuzzy Match tool)
function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Custom Scoring Algorithms for the Demo Sandbox
export type AlgorithmType = 'keyword' | 'levenshtein' | 'phonetic_custom' | 'hybrid_weighted';

export const CatalogStructureView: React.FC<CatalogStructureViewProps> = ({ 
  products, 
  onBack,
  onSelectProduct 
}) => {
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'playground' | 'algorithms'>('taxonomy');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  
  // Search state
  const [searchWord, setSearchWord] = useState('');
  const [activeAlgo, setActiveAlgo] = useState<AlgorithmType>('hybrid_weighted');
  
  // Weights (tweakable by the owner/developer!)
  const [weightName, setWeightName] = useState(0.5);
  const [weightSeller, setWeightSeller] = useState(0.3);
  const [weightKeywords, setWeightKeywords] = useState(0.2);

  // Play haptic feedback on tab select
  const handleTabChange = (tab: 'taxonomy' | 'playground' | 'algorithms') => {
    haptics.medium();
    sounds.click();
    setActiveTab(tab);
  };

  // Predefined sellers derived from products, augmented with structured sample data
  const sellersList = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.seller).filter(Boolean))) as string[];
    return list.length > 0 ? list : ['Coopérative de Ngaza', 'Tisseuses du Kasaï', 'Galerie d\'Art de Gombe', 'Atelier d\'Art de Kananga', 'Mobilier Prestige Kinshasa', 'Quincaillerie Générale Victoire'];
  }, [products]);

  // Simulated search results based on chosen search algorithm
  const searchResults = useMemo(() => {
    if (!searchWord.trim()) return [];

    const query = searchWord.toLowerCase().trim();

    return products.map(product => {
      let score = 0;
      let breakdown = '';
      
      const pName = product.name.toLowerCase();
      const pDesc = product.description.toLowerCase();
      const pSeller = (product.seller || '').toLowerCase();
      const pCategory = product.category.toLowerCase();

      // Find subcategory tag or keywords
      const matchedTax = TAXONOMY.find(t => t.id === product.category);
      let subKeywords: string[] = [];
      if (matchedTax) {
        matchedTax.subcategories.forEach(sub => {
          subKeywords = [...subKeywords, ...sub.keywords];
        });
      }

      if (activeAlgo === 'keyword') {
        // Simple word occurrence scoring
        let count = 0;
        if (pName.includes(query)) count += 10;
        if (pDesc.includes(query)) count += 3;
        if (pSeller.includes(query)) count += 5;
        if (pCategory.includes(query)) count += 4;
        
        score = count;
        breakdown = `${count > 0 ? 'Correspondance mot-clé simple.' : 'Aucune correspondance directe.'} Score brut : ${count}`;
      } 
      else if (activeAlgo === 'levenshtein') {
        // Check Levenshtein distances for name, seller or category
        const tokenize = (str: string) => str.split(/\s+/).filter(s => s.length > 2);
        const queryTokens = tokenize(query);
        const targetTokens = [...tokenize(pName), ...tokenize(pSeller)];
        
        let minDistance = 999;
        let matchedWord = '';

        queryTokens.forEach(qT => {
          targetTokens.forEach(tT => {
            const dist = calculateLevenshtein(qT, tT);
            if (dist < minDistance) {
              minDistance = dist;
              matchedWord = tT;
            }
          });
        });

        // Similarity score scaling (0-100)
        // If distance is 0 -> perfect. If 1 -> high score. If > 3 -> insignificant
        if (minDistance <= 3) {
          score = Math.max(0, 100 - (minDistance * 25));
        } else {
          score = 0;
        }

        breakdown = minDistance <= 3 
          ? `Distance de Levenshtein minimale de ${minDistance} entre "${query}" et "${matchedWord}".`
          : `Aucune proximité typographique significative (Distance: ${minDistance}).`;
      } 
      else if (activeAlgo === 'phonetic_custom') {
        // Soundex/Bantu phonetic matching rule-of-thumb:
        // Sound approximation rules: K ≈ Q ≈ C, G ≈ K, L ≈ R, Z ≈ S, B ≈ V
        const getPhoneticCode = (str: string) => {
          return str.toLowerCase()
            .replace(/ph/g, 'f')
            .replace(/qu/g, 'k')
            .replace(/ch/g, 'sh')
            .replace(/c/g, 'k')
            .replace(/y/g, 'i')
            .replace(/h/g, '')
            .replace(/g/g, 'k')
            .replace(/r/g, 'l')
            .replace(/s/g, 'z')
            .replace(/v/g, 'b');
        };

        const queryPhonetic = getPhoneticCode(query);
        const nameTokens = pName.split(/\s+/).map(getPhoneticCode);
        const sellerTokens = pSeller.split(/\s+/).map(getPhoneticCode);
        
        let phMatch = false;
        let matchedPhoneticWord = '';
        
        nameTokens.forEach((t, idx) => {
          if (t.includes(queryPhonetic) || queryPhonetic.includes(t)) {
            phMatch = true;
            matchedPhoneticWord = pName.split(/\s+/)[idx];
          }
        });

        sellerTokens.forEach((t, idx) => {
          if (t.includes(queryPhonetic) || queryPhonetic.includes(t)) {
            phMatch = true;
            matchedPhoneticWord = pSeller.split(/\s+/)[idx];
          }
        });

        if (phMatch) {
          score = 80;
          breakdown = `Correspondance phonétique détectée (Congo-Soundex) de "${query}" avec "${matchedPhoneticWord}".`;
        } else {
          score = 0;
          breakdown = "Aucune similitude acoustique détectée.";
        }
      } 
      else {
        // Hybrid Weighted Engine
        // Combines Weighted Fields + Levenshtein fuzzy matching
        let nameMatchMultiplier = pName.includes(query) ? 1.0 : (1.0 - Math.min(3, calculateLevenshtein(query, pName)) / 4);
        if (calculateLevenshtein(query, pName) > 3 && !pName.includes(query)) nameMatchMultiplier = 0;

        let sellerMatchMultiplier = pSeller.includes(query) ? 1.0 : (1.0 - Math.min(3, calculateLevenshtein(query, pSeller)) / 4);
        if (calculateLevenshtein(query, pSeller) > 3 && !pSeller.includes(query)) sellerMatchMultiplier = 0;

        let kwMatchCount = subKeywords.filter(kw => query.includes(kw) || kw.includes(query)).length;
        let kwMultiplier = kwMatchCount > 0 ? Math.min(1.0, kwMatchCount * 0.4) : 0;

        const calculatedScore1 = nameMatchMultiplier * weightName * 100;
        const calculatedScore2 = sellerMatchMultiplier * weightSeller * 100;
        const calculatedScore3 = kwMultiplier * weightKeywords * 100;

        score = Math.round(calculatedScore1 + calculatedScore2 + calculatedScore3);
        
        breakdown = `Nom (Poids ×${weightName}): ${Math.round(calculatedScore1)}% • Vendeur (Poids ×${weightSeller}): ${Math.round(calculatedScore2)}% • Mots-clés (Poids ×${weightKeywords}): ${Math.round(calculatedScore3)}%`;
      }

      return {
        product,
        score,
        breakdown
      };
    })
    .filter(res => res.score > 10)
    .sort((a, b) => b.score - a.score);

  }, [searchWord, activeAlgo, products, weightName, weightSeller, weightKeywords]);

  return (
    <div id="catalog-structure-wrapper" className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Header */}
      <button 
        onClick={() => { haptics.light(); sounds.click(); onBack(); }}
        className="inline-flex items-center gap-2 mb-6 text-zinc-500 hover:text-brand transition-colors text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 px-3.5 py-2 rounded-xl cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au Marché
      </button>

      {/* Hero Header Banner */}
      <div className="bg-zinc-900 dark:bg-zinc-950 text-white rounded-[2rem] p-8 md:p-12 mb-8 border border-zinc-500/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Database className="w-64 h-64 rotate-12 text-brand" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 border border-brand/20">
            <Cpu className="w-3.5 h-3.5" />
            Spécifications Souveraines Éladma
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight uppercase">
            Ingénierie du Catalogue &amp; Moteur de Recherche
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-semibold">
            Modèle de structuration sémantique de l'offre commerciale en République Démocratique du Congo. 
            Découvrez nos catégories géolocalisées, notre moteur de recherche multi-critères, et testez les algorithmes développés pour éliminer les barrières acoustiques et orthographiques de nos provinces.
          </p>
        </div>
      </div>

      {/* Secondary Custom Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 bg-zinc-50 dark:bg-zinc-900/40 p-1.5 rounded-2xl gap-2 max-w-2xl">
        <button
          onClick={() => handleTabChange('taxonomy')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'taxonomy' 
              ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-800' 
              : 'text-zinc-505 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800/40'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Folder className="w-3.5 h-3.5" />
            Taxonomie &amp; Branches
          </span>
        </button>
        <button
          onClick={() => handleTabChange('playground')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'playground' 
              ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-800' 
              : 'text-zinc-505 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800/40'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Sandbox Recherche
          </span>
        </button>
        <button
          onClick={() => handleTabChange('algorithms')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'algorithms' 
              ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-800' 
              : 'text-zinc-505 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800/40'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            Spécifications Algo
          </span>
        </button>
      </div>

      {/* TAB 1: TAXONOMY PANEL */}
      {activeTab === 'taxonomy' && (
        <div id="taxonomy-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Tree List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2 mb-4">
              Catégories Mères (6 Branches Souveraines)
            </h3>
            {TAXONOMY.map((cat) => {
              const countInProducts = products.filter(p => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => { haptics.light(); sounds.select(); setSelectedCat(selectedCat === cat.id ? null : cat.id); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex items-start justify-between cursor-pointer ${
                    selectedCat === cat.id 
                      ? 'bg-brand/5 border-brand/35 text-brand shadow-sm' 
                      : 'bg-white dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800 text-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="text-2xl mt-0.5 leading-none select-none">{cat.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold tracking-tight uppercase">{cat.labelFr}</span>
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                          {cat.labelLocal}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 lines-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black">
                      {countInProducts} Art.
                    </span>
                    <ChevronRight className={`w-4 h-4 ml-auto mt-2 transition-transform ${selectedCat === cat.id ? 'rotate-90' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Subcategory Details Map */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedCat ? (
                (() => {
                  const currentCategory = TAXONOMY.find(c => c.id === selectedCat)!;
                  const associatedProducts = products.filter(p => p.category === selectedCat);

                  return (
                    <motion.div
                      key={selectedCat}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm"
                    >
                      {/* Sub-Header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{currentCategory.icon}</span>
                          <div>
                            <h2 className="text-lg font-black dark:text-white uppercase tracking-tight">{currentCategory.labelFr}</h2>
                            <p className="text-xs text-zinc-500">Nom officiel régional : <strong className="text-brand font-black uppercase text-[11px]">{currentCategory.labelLocal}</strong></p>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Categories Tree Grid */}
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Sous-Catégories &amp; Thésaurus de Mots-clés</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {currentCategory.subcategories.map((sub, i) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900 space-y-2.5">
                              <h5 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
                                {sub.name}
                              </h5>
                              <p className="text-[10.5px] text-zinc-500 leading-normal font-medium">
                                {sub.description}
                              </p>
                              {/* Keywords tags badge */}
                              <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                                {sub.keywords.map((kw, idx) => (
                                  <span key={idx} className="text-[8.5px] font-bold bg-white dark:bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-150/50 dark:border-zinc-800">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sample products classified in this branch */}
                      <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Produits Courants Mappés</h4>
                        {associatedProducts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {associatedProducts.map(p => (
                              <div key={p.id} className="flex gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/60 rounded-xl items-center">
                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-white shrink-0" referrerPolicy="no-referrer" />
                                <div className="min-w-0">
                                  <h6 className="text-[11.5px] font-black text-zinc-900 dark:text-white truncate">{p.name}</h6>
                                  <p className="text-[10px] text-zinc-550 dark:text-zinc-500 truncate">Vendeur: {p.seller || 'Inconnu'}</p>
                                  <p className="text-[10px] text-brand font-extrabold mt-0.5">{p.price.toFixed(2)} $</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl text-zinc-400 text-xs">
                            Aucun produit n'est actuellement en ligne pour cette catégorie dans la base de test.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <div className="bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center h-full flex flex-col items-center justify-center text-zinc-400">
                  <Folder className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4 stroke-[1.25]" />
                  <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-sm uppercase tracking-wide">Branche Non Sélectionnée</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                    Veuillez cliquer sur une catégorie mère à gauche pour afficher son thésaurus de synonymes, ses sous-catégories et les produits s'y rattachant.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SEARCH PLAYGROUND */}
      {activeTab === 'playground' && (
        <div id="search-playground" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Configuration Parameters Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/65 dark:border-zinc-800 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-brand" />
                Moteur de Recherche Sandbox
              </h3>

              {/* Dynamic query input */}
              <div>
                <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block mb-1.5">
                  Mot ou Phrase de Recherche (Recherche par Mot-Clé, Nom, Vendeur)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: aladma, ngaza, statue sanyo, panier..."
                    value={searchWord}
                    onChange={(e) => { haptics.light(); setSearchWord(e.target.value); }}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold rounded-xl focus:ring-2 focus:ring-brand text-zinc-900 dark:text-white"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Algorithm select */}
              <div>
                <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block mb-1.5">
                  Algorithme de Correspondance Active
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'hybrid_weighted', label: '1. Moteur Hybride Pondéré (Recommandé)', desc: 'Combine les champs avec des coefficients personnalisés et tolère les fautes.' },
                    { id: 'levenshtein', label: '2. Distance de Levenshtein (Fuzzy)', desc: 'Recherche floue tolérant les fautes de frappe de 1 à 3 caractères.' },
                    { id: 'phonetic_custom', label: '3. Heuristique Phonétique (Congo-Soundex)', desc: 'Associe acoustiquement les mots selon les phonèmes africains.' },
                    { id: 'keyword', label: '4. Occurrences de mots-clés simples', desc: 'Comptabilise la présence littérale des termes saisis.' },
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => { haptics.medium(); sounds.select(); setActiveAlgo(algo.id as AlgorithmType); }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${
                        activeAlgo === algo.id 
                          ? 'bg-zinc-900 dark:bg-zinc-800 text-white border-zinc-950' 
                          : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-850'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{algo.label}</span>
                        {activeAlgo === algo.id && <Check className="w-3.5 h-3.5 text-brand" />}
                      </div>
                      <p className={`text-[9.5px] mt-1 leading-normal font-normal ${activeAlgo === algo.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {algo.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for Hybrid weights */}
              {activeAlgo === 'hybrid_weighted' && (
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ajustement des coefficients</h4>
                  
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span>Poids Nom Produit</span>
                      <span className="text-brand">{(weightName * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1" value={weightName}
                      onChange={(e) => setWeightName(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-850 rounded accent-brand"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span>Poids Nom Vendeur</span>
                      <span className="text-brand">{(weightSeller * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1" value={weightSeller}
                      onChange={(e) => setWeightSeller(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-850 rounded accent-brand"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span>Poids Thésaurus / Mots-clés</span>
                      <span className="text-brand">{(weightKeywords * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="1" step="0.1" value={weightKeywords}
                      onChange={(e) => setWeightKeywords(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-200 dark:bg-zinc-850 rounded accent-brand"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time search output sandbox */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 md:p-8 rounded-[2rem] space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-805 pb-3">
                <h3 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-tight">
                  Résultats &amp; Métriques en temps réel
                </h3>
                <span className="text-xs bg-zinc-100 dark:bg-zinc-950 font-mono px-2.5 py-1 rounded-lg text-zinc-500 font-bold">
                  {searchResults.length} {searchResults.length > 1 ? 'milli-indices correspondants' : 'milli-indice correspondant'}
                </span>
              </div>

              {!searchWord.trim() ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col justify-center items-center">
                  <Search className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-3 animate-pulse" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Ajustez les termes pour faire correspondre de la donnée</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                    Tapez des mots liés aux produits d'Eladma, ses vendeurs ("Ngaza", "Kasaï") ou ses catégories pour analyser le comportement des différents modèles d'interrogation.
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map(({ product, score, breakdown }) => (
                    <div 
                      key={product.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-900 gap-4 hover:border-brand/30 transition-all"
                    >
                      {/* Product Thumbnail Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-zinc-900 dark:text-white truncate">{product.name}</h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-black uppercase text-brand tracking-wider">
                              Catégorie: {product.category}
                            </span>
                            <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
                            <span className="text-[9px] font-bold text-zinc-505 dark:text-zinc-400">
                              Vendeur: <strong className="text-zinc-700 dark:text-zinc-200">{product.seller || 'Inconnu'}</strong>
                            </span>
                          </div>
                          {/* Scoring criteria explanation */}
                          <p className="text-[10px] text-zinc-400 mt-1.5 font-mono bg-white dark:bg-zinc-900/80 p-1.5 rounded border border-zinc-150/40 dark:border-zinc-800">
                            {breakdown}
                          </p>
                        </div>
                      </div>

                      {/* Score Value badge */}
                      <div className="text-right shrink-0 flex md:flex-col items-center justify-between md:justify-center gap-2">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block md:hidden">Scoring</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden hidden md:block">
                            <div className="h-full bg-brand" style={{ width: `${Math.min(100, score)}%` }}></div>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                            score >= 80 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : score >= 50 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-955 dark:text-amber-300' 
                                : 'bg-zinc-150 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}>
                            {score} Pts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-zinc-400 flex flex-col justify-center items-center">
                  <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mb-3" />
                  <p className="text-xs font-extrabold uppercase text-zinc-500">Aucun résultat ne satisfait les contraintes de filtrage</p>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-sm leading-relaxed">
                    Essayez d'utiliser un autre algorithme de recherche. Par exemple, la recherche floue de Levenshtein tolère des variations orthographiques.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPECIFICATIONS / RECOMMENDATIONS */}
      {activeTab === 'algorithms' && (
        <div id="algo-recos" className="space-y-6">
          {/* Card containing algorithmic suggestions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850 p-6 md:p-8 rounded-[2rem] shadow-sm">
            <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Cpu className="text-brand w-5 h-5" />
              Rapport d'Architecture &amp; Algorithmes de Recherche Suggérés pour Aladma / Eladma
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Technical Constraints of Congolese Market */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-brand uppercase tracking-widest">
                  1. Défis de saisie et Contraintes du Congo (Locale DRC)
                </h4>
                <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                  Le e-commerce en République Démocratique du Congo fait face à des obstacles acoustiques et orthographiques uniques :
                </p>
                <ul className="space-y-3 text-xs text-zinc-655 dark:text-zinc-400 leading-normal list-disc pl-4">
                  <li>
                    <strong>Multilinguisme phonétique (Français, Lingala, Swahili) :</strong> De multiples vendeurs retranscrivent phonétiquement des mots (ex: <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-red-500">Aladma</code> au lieu d' <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-emerald-500">Eladma</code>, <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-red-500">Sanio</code> pour <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-emerald-500">Sanyo</code>). Les moteurs de recherche binaire stricts écrasent ces commandes.
                  </li>
                  <li>
                    <strong>Saisie Vocale Récurrente :</strong> Du fait de la dactylographie sur écrans tactiles ou de l'analphabétisme partiel, la recherche vocale locale engendre des distorsions de dactylographie mécanique qu'un traducteur phonétique classique français ne résout pas.
                  </li>
                  <li>
                    <strong>Double Terme Régional :</strong> Les produits artisanaux possèdent des dénominations doubles (Ex: <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-zinc-600">Panier de Kassai</code> équivaut à <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded text-zinc-605">Kinkete</code> ou thésaurus locaux).
                  </li>
                </ul>
              </div>

              {/* Recommended Algorithms Grid mapping */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-brand uppercase tracking-widest">
                  2. Solutions algorithmiques recommandées
                </h4>
                <div className="space-y-3.5">
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900/60 flex items-start gap-3">
                    <div className="p-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 text-xs text-brand font-black shrink-0">A</div>
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Distance de Levenshtein &amp; Damerau</h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                        Idéal pour corriger les fautes d'inattention de frappe. Calcule le nombre minimal d'insertions, suppressions et substitutions. Seuil optimal : distance &le; 2.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900/60 flex items-start gap-3">
                    <div className="p-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 text-xs text-brand font-black shrink-0">B</div>
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Phonétique Soundex / Metaphone Adapté au Congo</h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                        Les voyelles sont souvent interchangeables dans la phonologie lingala/swahili. Un algorithme de réduction consonantique (Double Metaphone) appliqué aux syllabes bantoues assure des résultats solides.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900/60 flex items-start gap-3">
                    <div className="p-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 text-xs text-brand font-black shrink-0">C</div>
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Indexation Inverse Tokenisée (TF-IDF &amp; BM25)</h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                        Rend les recherches immédiates. Analyse la fréquence des termes de recherche dans les fiches produits par rapport au catalogue global pour attribuer un poids statistique pertinent aux vendeurs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic sovereign architecture suggestion section */}
            <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand animate-spin" />
                Durable souverain : Recherche Sémantique Hybride &amp; Embeddings IA
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-4xl">
                Pour une implémentation optimale et ultra-performante à l'échelle de millions de produits, la meilleure approche pour <strong>Eladma</strong> est une architecture <strong>hybride</strong> :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/45 dark:border-zinc-900 rounded-2xl">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Étape 1 : Vecteurs de dense embedding</span>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Convertir les fiches produits en coordonnées vectorielles sémantiques en utilisant l'API <strong>Gemini Flash text-embedding-004</strong>. Les synonymes sont connectés sémantiquement à 100% de similarité cosinus sans thésaurus manuel.
                  </p>
                </div>
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/45 dark:border-zinc-900 rounded-2xl">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Étape 2 : Recouvrement Lexical (BM25)</span>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Exécuter en parallèle une recherche textuelle classique pour garantir la précision exacte sur les références techniques de pièces (par ex., un filtre de piston auto à numéro de série précis "auto_1").
                  </p>
                </div>
                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150/45 dark:border-zinc-900 rounded-2xl">
                  <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Étape 3 : Reranking Multi-critères</span>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    Fusionner les deux ensembles de résultats à l'aide de la méthode <strong>RRF (Reciprocal Rank Fusion)</strong>, et ordonner selon le score de confiance du vendeur (Trust Score) pour propulser l'excellence certifiée en tête de liste.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
