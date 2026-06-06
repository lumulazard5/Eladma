import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users, MapPin, Heart, Sparkles, BookOpen } from 'lucide-react';
import { Cooperative } from '../types';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

const COOPERATIVES: Cooperative[] = [
  {
    id: 'c1',
    name: 'Coopérative des Sculpteurs de Ngaza',
    location: 'Kananga (Ngaza), RDC',
    description: 'Maîtres de la sculpture sur bois et malachite.',
    story: 'Fondée en 1985, cette coopérative regroupe plus de 50 artisans talentueux qui se transmettent l\'art de la sculpture de génération en génération. Situé au cœur de Kananga, le quartier Ngaza est devenu le centre névralgique de cet artisanat. Chaque pièce raconte une histoire de la culture Luba, alliant force et spiritualité.',
    image: 'https://picsum.photos/seed/carving/1200/800',
    members: 52,
    specialty: 'Sculpture sur bois et pierres précieuses'
  },
  {
    id: 'c2',
    name: 'Les Tisseuses du Kasaï Central',
    location: 'Kananga-Camp Vangu, RDC',
    description: 'Spécialistes du tressage de fibres naturelles.',
    story: 'Cette coopérative de femmes courageuses a transformé l\'art traditionnel du tressage en un moteur économique pour des dizaines de familles. Utilisant des fibres locales de palmier-raphia, elles créent des paniers, des tapis et des objets de décoration mondialement reconnus pour leur finesse. Leur travail est un hymne à la patience et à la dignité.',
    image: 'https://picsum.photos/seed/weaving/1200/800',
    members: 38,
    specialty: 'Vannerie et Tissage Raphia'
  },
  {
    id: 'c3',
    name: 'Atelier de Forge de Katoka',
    location: 'Katoka, Kananga, RDC',
    description: 'Gardiens des métiers du fer et du cuivre.',
    story: 'À Katoka, les forgerons de cette guilde maintiennent vivant le feu ancestral. Ils produisent des outils agricoles pour les paysans locaux et des objets d\'art en métal recyclé. Leur philosophie repose sur la durabilité : "Rien ne se perd, tout se transforme en beauté".',
    image: 'https://picsum.photos/seed/forge/1200/800',
    members: 25,
    specialty: 'Métallurgie artisanale'
  }
];

interface CooperativeStoriesProps {
  onBack: () => void;
}

export const CooperativeStories: React.FC<CooperativeStoriesProps> = ({ onBack }) => {
  const [selectedCoop, setSelectedCoop] = useState<Cooperative | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [detailImageLoaded, setDetailImageLoaded] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {!selectedCoop ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-2">Nos Coopératives</h1>
              <p className="text-zinc-500 dark:text-zinc-400">Découvrez les visages et les histoires derrière l'artisanat du Congo.</p>
            </div>
            <button 
              onClick={() => {
                haptics.light();
                sounds.click();
                onBack();
              }}
              className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COOPERATIVES.map((coop) => (
              <motion.div
                key={coop.id}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-zinc-100 dark:bg-zinc-850">
                  {!loadedImages[coop.id] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    </div>
                  )}
                  <img 
                    src={coop.image} 
                    alt={coop.name} 
                    loading="lazy"
                    onLoad={() => setLoadedImages(prev => ({ ...prev, [coop.id]: true }))}
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${
                      loadedImages[coop.id] ? 'opacity-100' : 'opacity-0'
                    }`} 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => { 
                        haptics.medium();
                        sounds.ambientChime();
                        setSelectedCoop(coop); 
                        setDetailImageLoaded(false); 
                      }}
                      className="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Lire l'histoire
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {coop.location}
                  </div>
                  <h3 className="text-xl font-black mb-2 dark:text-white">{coop.name}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 line-clamp-2">{coop.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{coop.members} artisans</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-2xl"
        >
          <div className="relative h-[400px] bg-zinc-150 dark:bg-zinc-850">
            {!detailImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-150 to-zinc-250 dark:from-zinc-800 dark:to-zinc-900 animate-pulse flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              </div>
            )}
            <img 
              src={selectedCoop.image} 
              alt={selectedCoop.name} 
              loading="lazy"
              onLoad={() => setDetailImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-550 ${
                detailImageLoaded ? 'opacity-100' : 'opacity-0'
              }`} 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
            <div className="absolute top-8 left-8 flex gap-4">
              <button 
                onClick={() => {
                  haptics.light();
                  sounds.click();
                  setSelectedCoop(null);
                }}
                className="p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/30 transition-all border border-white/20"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute bottom-12 left-12 right-12 text-white">
              <div className="flex items-center gap-3 text-emerald-400 font-bold mb-4">
                <MapPin className="w-5 h-5" />
                {selectedCoop.location}
              </div>
              <h2 className="text-5xl md:text-6xl font-black mb-4">{selectedCoop.name}</h2>
              <div className="flex flex-wrap gap-6 text-emerald-100/80">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-bold text-white">{selectedCoop.members} artisans</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold text-white uppercase tracking-wider">{selectedCoop.specialty}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 p-8 md:p-16">
            <div className="lg:col-span-2 space-y-8">
              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-emerald-500" />
                  Notre Histoire
                </h3>
                <p className="text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed italic border-l-4 border-emerald-500 pl-8 mb-8">
                  {selectedCoop.story}
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Grâce à votre soutien via Eladma, ces artisans bénéficient d'un accès direct au marché mondial tout en conservant une plus grande partie de la valeur ajoutée au sein de la communauté de Kananga. Nous réduisons les intermédiaires pour garantir une rémunération équitable et pérenniser ces savoir-faire ancestraux.
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] p-8 space-y-8 border border-zinc-100 dark:border-zinc-800">
              <div className="text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto shadow-lg mb-4">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <h4 className="font-black text-xl mb-2">Impact Direct</h4>
                <p className="text-sm text-zinc-500">Votre achat finance l'éducation et la santé de {selectedCoop.members} familles.</p>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Certifications</h5>
                <div className="flex flex-col gap-3">
                  {['Sourcing Direct', 'Commerce Équitable', 'Empreinte Carbone Réduite'].map((cert) => (
                    <div key={cert} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 font-bold text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {cert}
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-emerald-950 dark:bg-emerald-500 text-white dark:text-emerald-950 font-black rounded-2xl shadow-xl shadow-emerald-500/10 active:scale-95 transition-all">
                Voir leurs créations
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
