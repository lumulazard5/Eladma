import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  X, 
  Sparkles, 
  ThumbsUp, 
  Quote, 
  Lock,
  UserCheck
} from 'lucide-react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { toast } from 'sonner';

type CityType = 'all' | 'Kinshasa' | 'Lubumbashi' | 'Goma' | 'Kananga' | 'Mbuji-Mayi';

interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  date: string;
  productBought: string;
  text: string;
  verified: boolean;
  avatarSeed: string;
  category: string;
  advantage: string;
}

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Mukendi Sylvain",
    city: "Kananga",
    rating: 5,
    date: "Il y a 3 jours",
    productBought: "Piston pour Moulin Agricole",
    text: "Trouver des pièces de rechange de qualité à Kananga relevait du miracle. Normalement, j'attendais 1 mois d'importation depuis la Chine avec d'immenses risques de casse. Sur Eladma, commandé lundi matin, livré jeudi après-midi par notre Wewa agréé. Époustouflant et ultra robuste !",
    verified: true,
    avatarSeed: "sylvain",
    category: "Pièces & Outillage",
    advantage: "Acheminement Local FIABLE"
  },
  {
    id: "t2",
    name: "Kapinga Dorcas",
    city: "Kinshasa",
    rating: 5,
    date: "Il y a 1 semaine",
    productBought: "Tableau d'Art Masque Kasaïen",
    text: "En tant que galeriste à Gombe, la sécurité est de rigueur. La transaction en Escrow d'Eladma est géniale. Mon argent est resté bloqué en toute sécurité et n'a été versé à l'artisan que lorsque j'ai inspecté la toile et certifié l'œuvre. Une révolution de confiance en RDC !",
    verified: true,
    avatarSeed: "dorcas",
    category: "Artisanat & Déco",
    advantage: "Tiers de Confiance Escrow"
  },
  {
    id: "t3",
    name: "Bahati Emmanuel",
    city: "Goma",
    rating: 5,
    date: "Il y a 2 semaines",
    productBought: "Ordinateur ThinkPad Reconditionné",
    text: "Sur AliExpress ou Amazon, pas de Mobile Money M-Pesa. Pour Eladma, j'ai tout réglé instantanément avec mon solde Orange Money. Le prix final intégrait déjà les frais de vol cargo intérieur. La transparence totale, sans taxe surprise au dépôt de Goma.",
    verified: true,
    avatarSeed: "emmanuel",
    category: "Électronique",
    advantage: "Paiement 100% Mobile Money"
  },
  {
    id: "t4",
    name: "Mbuyi Clarisse",
    city: "Mbuji-Mayi",
    rating: 4,
    date: "Il y a 5 jours",
    productBought: "Lit Double en Bois Royal Wengé",
    text: "Acheter un meuble massif de cette taille en ligne me paraissait fou. Eladma a un système d'expédition par fret de camion ultra-organisé. Le livreur m'a aidé à le monter chez moi à Mbuji-Mayi. Le service client est irréprochable et parle lingala et tchilo.",
    verified: true,
    avatarSeed: "clarisse",
    category: "Mobilier & Logement",
    advantage: "Livraison Volume Lourd"
  },
  {
    id: "t5",
    name: "Ilunga Joseph",
    city: "Lubumbashi",
    rating: 5,
    date: "Il y a 8 jours",
    productBought: "Générateur Solaire 300W",
    text: "La fonction de recherche par photo d'Eladma est incroyable. J'ai scanné une photo du générateur d'un ami, l'IA d'Eladma l'a trouvé immédiatement au meilleur tarif à Lubumbashi. Le système de points cadeaux Eladma Guard m'a même offert $10 de réduction.",
    verified: true,
    avatarSeed: "joseph",
    category: "Électronique",
    advantage: "Recherche par Image IA"
  }
];

export const CustomerTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [selectedCity, setSelectedCity] = useState<CityType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, number>>({});

  // Form states
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('Kinshasa');
  const [newRating, setNewRating] = useState(5);
  const [newProduct, setNewProduct] = useState('');
  const [newCategory, setNewCategory] = useState('Pièces & Outillage');
  const [newText, setNewText] = useState('');
  const [newAdvantage, setNewAdvantage] = useState('Paiement Local');

  const filteredTestimonials = useMemo(() => {
    if (selectedCity === 'all') return testimonials;
    return testimonials.filter(t => t.city === selectedCity);
  }, [testimonials, selectedCity]);

  const handleLike = (id: string) => {
    haptics.light();
    sounds.select();
    setLikes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    toast.success("Merci pour votre vote d'authenticité !");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.heavy();
    sounds.select();

    if (!newName.trim() || !newProduct.trim() || !newText.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const newTestimonialItem: Testimonial = {
      id: Math.random().toString(),
      name: newName,
      city: newCity,
      rating: newRating,
      date: "À l'instant",
      productBought: newProduct,
      text: newText,
      verified: true, // Auto-verified for simplicity in simulation
      avatarSeed: newName.toLowerCase().replace(/\s+/g, ''),
      category: newCategory,
      advantage: newAdvantage
    };

    setTestimonials(prev => [newTestimonialItem, ...prev]);
    setIsModalOpen(false);

    // Reset Form
    setNewName('');
    setNewProduct('');
    setNewText('');
    setNewRating(5);

    toast.success("Votre témoignage vérifié a été ajouté sur Eladma !");
  };

  return (
    <div id="customer-testimonials" className="my-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 dark:bg-brand/20 text-brand rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" /> AVIS ET VÉRIFICATIONS SOUVERAINS
          </span>
          <h2 className="text-2.5xl sm:text-3.5xl font-black text-zinc-900 dark:text-white tracking-tight">
            Ce que disent nos <span className="text-brand">Acheteurs Vérifiés</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed">
            Découvrez des témoignages d'artisans, d'entrepreneurs et de familles qui utilisent Eladma quotidiennement à travers toutes les provinces de la RDC.
          </p>
        </div>

        {/* Add Testimonial Action */}
        <button
          onClick={() => {
            haptics.medium();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-white font-bold rounded-2xl text-xs hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white stroke-[3]" />
          <span>Rédiger un Avis Vérifié</span>
        </button>
      </div>

      {/* Filter by City pill selection */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {(['all', 'Kinshasa', 'Lubumbashi', 'Goma', 'Kananga', 'Mbuji-Mayi'] as CityType[]).map((city) => (
          <button
            key={city}
            onClick={() => {
              haptics.light();
              setSelectedCity(city);
            }}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              selectedCity === city
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm'
                : 'bg-white dark:bg-zinc-90 w-max text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250 border border-zinc-200/50 dark:border-zinc-800'
            }`}
          >
            {city === 'all' ? 'Toutes les provinces' : city}
          </button>
        ))}
      </div>

      {/* Testimonials Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTestimonials.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-[2rem] flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Backquote styling watermark */}
              <div className="absolute top-4 right-6 text-zinc-100 dark:text-zinc-850 select-none pointer-events-none">
                <Quote className="w-12 h-12 stroke-[4]" />
              </div>

              <div>
                {/* Meta details Header */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Avatar bubble */}
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-black uppercase tracking-wide border border-brand/20">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs dark:text-white flex items-center gap-1.5">
                      {t.name}
                      {t.verified && (
                        <span className="text-[10px] inline-flex items-center gap-0.5 text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-full select-none">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 stroke-[3]" /> vérifié
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" /> {t.city}, RDC • <span className="italic">{t.date}</span>
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} 
                    />
                  ))}
                  <span className="text-[10px] bg-brand/5 dark:bg-brand/15 text-brand px-1.5 py-0.5 rounded-md font-bold ml-1.5">
                    {t.category}
                  </span>
                </div>

                {/* Subtext Product */}
                <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-805 p-2 rounded-xl mb-3 border border-zinc-100 dark:border-zinc-800/60">
                  Article acheté : <span className="text-brand">{t.productBought}</span>
                </p>

                {/* Main feedback text */}
                <p className="text-[11px] text-zinc-650 dark:text-zinc-300 leading-relaxed font-medium mb-4 italic">
                  "{t.text}"
                </p>
              </div>

              {/* Bottom badge advantage & feedback interactions */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/50 pt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-brand bg-brand/5 dark:bg-brand/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> {t.advantage}
                </span>

                <button
                  onClick={() => handleLike(t.id)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-brand dark:hover:text-brand bg-zinc-50 dark:bg-zinc-805 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800 cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Utile ({likes[t.id] || 0})</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTestimonials.length === 0 && (
          <div className="col-span-full h-48 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] flex flex-col items-center justify-center text-zinc-400 gap-3">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-xs font-bold">Aucun témoignage de filtre pour la région de {selectedCity}.</p>
            <button
              onClick={() => setSelectedCity('all')}
              className="text-brand text-xs font-black hover:underline cursor-pointer"
            >
              Voir toutes les provinces
            </button>
          </div>
        )}
      </div>

      {/* Modern Dialog/Modal Backdrop & Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/70 dark:bg-zinc-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => {
                  haptics.light();
                  setIsModalOpen(false);
                }}
                className="absolute top-5 right-5 p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand uppercase tracking-wider bg-brand/10 dark:bg-brand/20 px-3 py-1 rounded-full mb-2">
                  <Star className="w-3.5 h-3.5 fill-brand text-brand" /> GARANTIE CONSCIENCE SOUVERAINE
                </span>
                <h3 className="text-xl font-black dark:text-white leading-tight">Partager votre Expérience Eladma</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 leading-relaxed">
                  Votre avis sera certifié et partagé pour valoriser le commerce local et rassurer les nouveaux acheteurs au Congo.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Nom & Prénom</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sylvain Mukendi"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-none rounded-xl p-3 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Ville de résidence</label>
                    <select
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-none rounded-xl p-3 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-bold cursor-pointer"
                    >
                      <option value="Kinshasa">Kinshasa</option>
                      <option value="Lubumbashi">Lubumbashi</option>
                      <option value="Goma">Goma</option>
                      <option value="Kananga">Kananga</option>
                      <option value="Mbuji-Mayi">Mbuji-Mayi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Article acheté</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Lit Wengé, Piston, Pagne"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-none rounded-xl p-3 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Catégorie d'achat</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-none rounded-xl p-3 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-bold cursor-pointer"
                    >
                      <option value="Pièces & Outillage">Pièces & Outillage</option>
                      <option value="Mobilier & Logement">Mobilier & Logement</option>
                      <option value="Artisanat & Déco">Artisanat & Déco</option>
                      <option value="Électronique">Électronique</option>
                      <option value="Vêtements & Mode">Vêtements & Mode</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Avantage Majeur ressenti</label>
                    <select
                      value={newAdvantage}
                      onChange={(e) => setNewAdvantage(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-805 border-none rounded-xl p-3 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-bold cursor-pointer"
                    >
                      <option value="Paiement 100% Mobile Money">Paiement 100% Mobile Money</option>
                      <option value="Tiers de Confiance Escrow">Tiers de Confiance Escrow</option>
                      <option value="Acheminement Local FIABLE">Acheminement Local FIABLE</option>
                      <option value="Livraison Volume Lourd">Livraison Volume Lourd</option>
                      <option value="Recherche par Image IA">Recherche par Image IA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Note finale (1 à 5)</label>
                    <div className="flex items-center gap-1.5 h-10 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            haptics.light();
                            setNewRating(star);
                          }}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-250 dark:text-zinc-800'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Votre témoignage complet</label>
                  <textarea
                    required
                    placeholder="Racontez votre expérience, comment s'est faite la livraison et votre avis sur l'utilité du paiement local par Mobile money..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={4}
                    maxLength={350}
                    className="w-full bg-zinc-50 dark:bg-zinc-80s border-none rounded-2xl p-4 outline-none text-xs focus:ring-2 focus:ring-brand dark:text-white font-medium resize-none leading-relaxed"
                  />
                  <div className="text-right text-[9px] text-zinc-400 font-bold">
                    {newText.length}/350 caractères maximum
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-brand text-white font-black rounded-2xl text-xs hover:bg-brand-hover tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>Publier mon Avis Sécurisé</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
