import React from 'react';
import { motion } from 'motion/react';
import { Shield, Truck, RefreshCw, Eye, Target, Compass, ArrowLeft, Zap, Award, Store, CheckCircle2, Loader2, Handshake, Megaphone, HelpCircle, ThumbsUp, ThumbsDown, Copy, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { askFaqAssistant } from '../services/gemini';
import { EladmaSecurity } from '../services/security';

export type LegalTab = 'mission' | 'privacy' | 'refund' | 'shipping' | 'terms' | 'cookies' | 'careers' | 'blog' | 'seller' | 'partners' | 'advertising' | 'faq';

interface LegalInfoProps {
  initialTab: LegalTab;
  onBack: () => void;
}

export const LegalInfo: React.FC<LegalInfoProps> = ({ initialTab, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab);
  const [showSellerForm, setShowSellerForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formStep, setFormStep] = React.useState(1);

  // FAQ smart state
  const [faqInput, setFaqInput] = React.useState('');
  const [isFaqLoading, setIsFaqLoading] = React.useState(false);
  const [faqAnswer, setFaqAnswer] = React.useState<string | null>(null);
  const [askedFaq, setAskedFaq] = React.useState<string>('');
  const [feedbackGiven, setFeedbackGiven] = React.useState<string | null>(null);
  const [faqHistory, setFaqHistory] = React.useState<{ question: string; answer: string }[]>(() => {
    try {
      const saved = localStorage.getItem('eladma-faq-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    setActiveTab(initialTab);
    if (initialTab !== 'seller') setShowSellerForm(false);
  }, [initialTab]);

  const saveFaqToHistory = (question: string, answer: string) => {
    const updated = [{ question, answer }, ...faqHistory.filter(h => h.question !== question)].slice(0, 10);
    setFaqHistory(updated);
    localStorage.setItem('eladma-faq-history', JSON.stringify(updated));
  };

  const clearFaqHistory = () => {
    setFaqHistory([]);
    localStorage.removeItem('eladma-faq-history');
    toast.success("Historique FAQ effacé.");
  };

  const handleAskFaq = async (questionToAsk: string) => {
    // 1. Anti-abuse rate limit check (max 8 requests per minute)
    if (!EladmaSecurity.checkRateLimit('ask_faq_ai', 8, 60000)) {
      return;
    }

    // 2. Sanitize raw text inputs
    const sanitizedQuestion = EladmaSecurity.sanitizeInput(questionToAsk).trim();

    if (!sanitizedQuestion) {
      toast.error("Veuillez saisir votre question.");
      return;
    }
    setIsFaqLoading(true);
    setAskedFaq(sanitizedQuestion);
    setFaqAnswer(null);
    setFeedbackGiven(null);
    try {
      const answer = await askFaqAssistant(sanitizedQuestion);
      setFaqAnswer(answer);
      saveFaqToHistory(sanitizedQuestion, answer);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion avec l'IA. Réponses locales appliquées.");
    } finally {
      setIsFaqLoading(false);
    }
  };

  const handleSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setFormStep(2);
      toast.success("Demande envoyée !", {
        description: "Un conseiller Eladma vous contactera sous 24h."
      });
    }, 1500);
  };

  const tabs = [
    { id: 'mission', label: 'Mission', icon: Target },
    { id: 'faq', label: 'FAQ IA', icon: HelpCircle },
    { id: 'privacy', label: 'Confidentialité', icon: Shield },
    { id: 'shipping', label: 'Livraison', icon: Truck },
    { id: 'refund', label: 'Retours', icon: RefreshCw },
    { id: 'terms', label: 'Conditions', icon: Eye },
    { id: 'seller', label: 'Vendre', icon: Zap },
    { id: 'partners', label: 'Partenaires', icon: Handshake },
    { id: 'advertising', label: 'Publicité', icon: Megaphone },
    { id: 'careers', label: 'Carrières', icon: Award },
    { id: 'blog', label: 'Blog', icon: Compass },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Retour à la boutique
      </button>

      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as LegalTab)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border dark:border-zinc-800 shadow-sm"
      >
        {activeTab === 'mission' && (
          <div className="prose dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Compass className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-0">Notre Mission & Vision</h1>
                <p className="text-zinc-500">L'ambition d'Eladma pour le commerce de demain.</p>
              </div>
            </div>

            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-brand" />
                Notre Mission
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Chez Eladma, notre mission est de démocratiser l'accès aux produits de qualité à travers le monde en utilisant l'intelligence artificielle pour simplifier l'expérience d'achat. Nous croyons que chaque client mérite une expérience personnalisée, transparente et efficace, quel que soit son budget ou sa localisation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand" />
                Notre Vision
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10">
                Nous aspirons à devenir la plateforme e-commerce la plus centrée sur l'humain et l'IA. Notre vision est de créer un écosystème où la technologie efface les barrières logistiques et linguistiques, permettant à un artisan local de vendre à un client à l'autre bout du monde aussi facilement qu'à son voisin de palier.
              </p>
            </section>

            <section className="pt-8 border-t dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" />
                Siège Social & Bureaux Provinciaux (RDC)
              </h2>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700 space-y-6">
                <div>
                  <p className="font-bold dark:text-zinc-100 mb-1 text-brand">Eladma International SAS — Siège Central</p>
                  <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                    Avenue Laurent Désiré Kabila, Quartier Ngaza, Commune de Kananga<br />
                    <strong>Kananga, Province du Kasaï-Central, République Démocratique du Congo</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h4 className="font-bold text-xs uppercase text-zinc-400 mb-1">Bureau d'Expansion - Kinshasa</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed">
                      Avenue de l'Équateur, Quartier Gombe, Commune de la Gombe<br />
                      <strong>Kinshasa, RDC</strong>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase text-zinc-400 mb-1">Bureau Logistique - Lubumbashi</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed">
                      Avenue de la Révolution, Quartier Golf, Commune de Lubumbashi<br />
                      <strong>Lubumbashi, Province du Haut-Katanga, RDC</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <p className="text-zinc-500">Email : <span className="text-brand font-bold">contact@eladma.com</span></p>
                    <p className="text-zinc-500">Presse : <span className="text-brand">press@eladma.com</span></p>
                  </div>
                  <div className="text-xs text-brand bg-brand/5 dark:bg-brand/10 border border-brand/10 px-3 py-1.5 rounded-xl font-bold">
                    Coverage : 26 provinces, communes & localités de la RDC.
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold dark:text-white">Foire Aux Questions IA</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Posez vos questions à notre assistant intelligent ou consultez nos réponses rapides.</p>
              </div>
            </div>

            {/* Quick Questions Grid */}
            <div>
              <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Questions Populaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { q: "Où se situe le siège social d'Eladma et comment nous contacter ?", label: "Siège & Contact" },
                  { q: "Comment fonctionne le processus de retour et sous combien de jours ?", label: "Politique de Retour" },
                  { q: "Quelles sont les conditions et tarifs pour la livraison ?", label: "Modes de Livraison" },
                  { q: "Quels sont les prérequis pour s'inscrire en tant que vendeur ?", label: "Devenir Vendeur" },
                  { q: "Comment l'IA certifie-t-elle le score de confiance (Trust Score) ?", label: "Certification & Score de Confiance" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFaqInput(item.q);
                      handleAskFaq(item.q);
                    }}
                    className="flex text-left items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-2xl transition-all border dark:border-zinc-800 group"
                  >
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-brand transition-colors">
                      {item.label}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Interroger <MessageSquare className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Entry Box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAskFaq(faqInput);
              }}
              className="space-y-3"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Saisissez votre question personnalisée
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={faqInput}
                    onChange={(e) => setFaqInput(e.target.value)}
                    placeholder="Ex: Vos livraisons vers l'Europe sont-elles disponibles ?"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-2xl py-4 pl-5 pr-32 outline-none focus:ring-2 focus:ring-brand dark:text-white text-sm"
                    maxLength={150}
                  />
                  <div className="absolute right-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isFaqLoading || !faqInput.trim()}
                      className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand/10 flex items-center gap-1.5"
                    >
                      {isFaqLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Poser à l'IA"
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1 text-[10px] text-zinc-400">
                  <span>Assistant intelligent Eladma FAQ</span>
                  <span>{faqInput.length}/150 caractères</span>
                </div>
              </div>
            </form>

            {/* AI Response Block */}
            {(isFaqLoading || faqAnswer) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl border border-brand/20 bg-brand/5 dark:bg-brand/5 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-brand/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-xs font-black uppercase text-brand tracking-widest">
                      Expert FAQ IA
                    </span>
                  </div>
                  {faqAnswer && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(faqAnswer);
                        toast.success("Réponse copiée dans le presse-papier !");
                      }}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isFaqLoading ? (
                  <div className="space-y-3 py-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 italic">
                      Question posée : &ldquo;{askedFaq}&rdquo;
                    </p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed font-semibold">
                      {faqAnswer}
                    </p>

                    <div className="flex justify-between items-center pt-3 border-t border-brand/10 text-xs">
                      <span className="text-zinc-400">Cette réponse vous a-t-elle aidé ?</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackGiven('positive');
                            toast.success("Merci ! Votre retour nous aide à améliorer l'IA.");
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-1 transition-all ${
                            feedbackGiven === 'positive' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20' 
                              : 'bg-white hover:bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                          }`}
                          disabled={feedbackGiven !== null}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Oui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackGiven('negative');
                            toast.success("Merci pour votre retour. Nous ajusterons l'assistant.");
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-1 transition-all ${
                            feedbackGiven === 'negative' 
                              ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20' 
                              : 'bg-white hover:bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                          }`}
                          disabled={feedbackGiven !== null}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Non</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* FAQ Search History */}
            {faqHistory.length > 0 && (
              <div className="pt-6 border-t dark:border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand" />
                    Historique de vos questions ({faqHistory.length})
                  </h3>
                  <button
                    type="button"
                    onClick={clearFaqHistory}
                    className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Effacer l'historique
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {faqHistory.map((historyItem, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl border dark:border-zinc-800 space-y-2 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFaqInput(historyItem.question);
                          setAskedFaq(historyItem.question);
                          setFaqAnswer(historyItem.answer);
                          setFeedbackGiven(null);
                          window.scrollTo({ top: 200, behavior: 'smooth' });
                        }}
                        className="text-left w-full text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-brand dark:hover:text-brand transition-colors block"
                      >
                        Q : &ldquo;{historyItem.question}&rdquo;
                      </button>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        R : {historyItem.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
            <p className="text-zinc-500 mb-8 italic">Dernière mise à jour : 20 Avril 2026</p>
            
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">1. Collecte des Données</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Nous collectons les informations nécessaires pour traiter vos commandes : nom, adresse, email et historique d'achats. Vos données de paiement sont traitées de manière sécurisée par nos partenaires certifiés et ne sont jamais stockées sur nos serveurs.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">2. Utilisation de l'IA</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Notre assistant IA analyse vos préférences de navigation pour vous suggérer les meilleurs produits. Ces données sont anonymisées et utilisées uniquement pour améliorer votre expérience utilisateur.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">3. Vos Droits</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment via notre formulaire de contact.</p>
            </section>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Politique de Livraison</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border dark:border-zinc-700">
                <h3 className="font-bold mb-2">Livraison Standard</h3>
                <p className="text-sm text-zinc-500">5-7 jours ouvrés. Gratuite dès 100€ d'achat.</p>
              </div>
              <div className="p-6 bg-brand/5 rounded-2xl border border-brand/20">
                <h3 className="font-bold mb-2 text-brand">Livraison Express</h3>
                <p className="text-sm text-zinc-500">2-3 jours ouvrés. Disponible pour les membres Eladma Rewards Or & Diamant.</p>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Zones de Livraison</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Eladma livre dans plus de 200 pays. Les frais de douane éventuels sont à la charge du client et dépendent de la législation locale en vigueur.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Suivi de Commande</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Dès l'expédition, vous recevrez un numéro de suivi par email. Vous pouvez également suivre votre colis en temps réel via l'onglet "Suivi" de notre application.</p>
            </section>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Politique de Remboursement</h1>
            
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Droit de Rétractation</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Vous disposez de 30 jours à compter de la réception de votre colis pour changer d'avis et nous retourner vos articles dans leur emballage d'origine.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Procédure de Retour</h2>
              <ol className="list-decimal pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
                <li>Contactez notre support via le formulaire de contact.</li>
                <li>Imprimez l'étiquette de retour générée.</li>
                <li>Déposez votre colis dans un point relais partenaire.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Remboursements</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Les remboursements sont effectués sous 7 à 10 jours ouvrés après réception et vérification de l'état des articles retournés, sur le mode de paiement initial.</p>
            </section>
          </div>
        )}
        {activeTab === 'terms' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Conditions d'Utilisation</h1>
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Acceptation des Conditions</h2>
              <p className="text-zinc-600 dark:text-zinc-400">En accédant au site Eladma, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-4">Licence d'Utilisation</h2>
              <p className="text-zinc-600 dark:text-zinc-400">Il est permis de télécharger temporairement une copie du matériel sur le site d'Eladma pour une visualisation transitoire personnelle et non commerciale uniquement.</p>
            </section>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Politique des Cookies</h1>
            <div className="space-y-6">
              <p className="text-zinc-600 dark:text-zinc-400">
                Eladma utilise des cookies pour améliorer votre navigation et nous permettre d'optimiser nos services. En utilisant notre plateforme, vous consentez à l'usage de ces traceurs.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border dark:border-zinc-700">
                  <h3 className="font-bold text-sm mb-1">Cookies Essentiels</h3>
                  <p className="text-xs text-zinc-500">Nécessaires pour la connexion, le panier et la sécurité des transactions.</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border dark:border-zinc-700">
                  <h3 className="font-bold text-sm mb-1">Cookies de Performance</h3>
                  <p className="text-xs text-zinc-500">Nous aident à comprendre comment vous utilisez le site (pages vues, temps passé) via des outils comme Google Analytics.</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border dark:border-zinc-700">
                  <h3 className="font-bold text-sm mb-1">Cookies Publicitaires</h3>
                  <p className="text-xs text-zinc-500">Utilisés pour vous proposer des publicités Eladma pertinentes sur d'autres sites web.</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500 italic">Vous pouvez désactiver les cookies non essentiels dans les réglages de votre navigateur.</p>
            </div>
          </div>
        )}

        {activeTab === 'careers' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Carrières chez Eladma</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Rejoignez l'équipe qui réinvente le e-commerce mondial. Chez Eladma, nous ne construisons pas juste un site, nous construisons un pont entre les cultures grâce à la technologie.
            </p>
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Pourquoi nous rejoindre ?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">✨</div>
                  <p><span className="font-bold">Innovation Pure :</span> Travaillez sur les dernières technos IA.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">🌍</div>
                  <p><span className="font-bold">Impact Global :</span> Touchez des millions d'utilisateurs.</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-zinc-900 text-white rounded-2xl">
                <h4 className="font-bold mb-4">Postes Actuellement Ouverts</h4>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>Lead Data Scientist</span>
                    <span className="text-xs opacity-60">Paris / Remote</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span>UX Designer E-commerce</span>
                    <span className="text-xs opacity-60">Kinshasa / Hybrid</span>
                  </li>
                </ul>
                <button 
                  onClick={() => toast.info("Postulez sur jobs@eladma.com")}
                  className="mt-6 w-full py-3 bg-brand rounded-xl font-bold"
                >
                  Postuler maintenant
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-6">Le Mag Eladma</h1>
            <p className="text-zinc-500 mb-10">Actualités, tendances et coulisses d'Eladma.</p>
            
            <div className="grid grid-cols-1 gap-8">
              <article className="group cursor-pointer">
                <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800 rounded-3xl mb-4 overflow-hidden">
                  <img src="https://picsum.photos/seed/ai-shopping/1200/800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="IA" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">Comment l'IA personnalise votre flux de produits</h3>
                <p className="text-zinc-500 text-sm mb-4">Par l'équipe Tech | 15 Avril 2026</p>
                <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">Plongez dans les algorithmes d'Eladma qui transforment votre expérience de découverte...</p>
              </article>

              <article className="group cursor-pointer">
                <div className="aspect-video w-full bg-zinc-100 dark:bg-zinc-800 rounded-3xl mb-4 overflow-hidden">
                  <img src="https://picsum.photos/seed/eco-shipping/1200/800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Logistique" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">Objectif Zéro Carbone : Nos nouveaux emballages</h3>
                <p className="text-zinc-500 text-sm mb-4">Par l'équipe Impact | 12 Avril 2026</p>
                <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">Nous sommes fiers de vous annoncer le passage à des matériaux 100% recyclables pour toutes nos expéditions.</p>
              </article>
            </div>
          </div>
        )}

        {activeTab === 'seller' && (
          <div className="prose dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-0">Vendre sur Eladma</h1>
                <p className="text-zinc-500">Rejoignez la révolution du commerce assisté par IA.</p>
              </div>
            </div>

            {!showSellerForm ? (
              <>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 font-bold text-lg leading-relaxed">
                  Élargissez votre horizon. Vendez vos produits à des millions de clients dans le monde entier avec la puissance de l'IA Eladma.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-center border dark:border-zinc-700">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">1</div>
                    <h4 className="font-bold mb-1">Inscrivez-vous</h4>
                    <p className="text-xs text-zinc-500 italic">Étape gratuite et sans engagement</p>
                  </div>
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-center border dark:border-zinc-700">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">2</div>
                    <h4 className="font-bold mb-1">Listez vos produits</h4>
                    <p className="text-xs text-zinc-500 italic">Vérification assistée par IA</p>
                  </div>
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-center border dark:border-zinc-700">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">3</div>
                    <h4 className="font-bold mb-1">Vendez !</h4>
                    <p className="text-xs text-zinc-500 italic">Paiements sécurisés garantis</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setShowSellerForm(true)}
                    className="flex-1 py-4 bg-brand text-white rounded-2xl font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand/20 active:scale-[0.98]"
                  >
                    Démarrer mon inscription gratuite
                  </button>
                  <button 
                    onClick={() => {
                      // This would normally be handled by App.tsx view state
                      window.dispatchEvent(new CustomEvent('change-view', { detail: 'supplier' }));
                    }}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    Déjà vendeur ? Dashboard
                  </button>
                </div>
              </>
            ) : formStep === 1 ? (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSellerSubmit} 
                className="space-y-6 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-3xl border dark:border-zinc-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nom Complet</label>
                    <input required type="text" placeholder="Prénom Nom" className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Professionnel</label>
                    <input required type="email" placeholder="email@vendeur.com" className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nom de la Boutique</label>
                    <input required type="text" placeholder="Ma Boutique Eladma" className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Catégorie de Produits</label>
                    <select className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand">
                      <option>Électronique</option>
                      <option>Mode & Vêtements</option>
                      <option>Maison & Jardin</option>
                      <option>Sports & Loisirs</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Décrivez brièvement vos produits</label>
                  <textarea rows={3} className="w-full bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="Ex: Produits artisanaux en cuir..."></textarea>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowSellerForm(false)}
                    className="flex-1 py-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl font-bold"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Soumettre ma demande
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100 dark:border-green-900/30"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">Demande Reçue !</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
                  Votre candidature a été transmise à notre équipe de modération IA. Un spécialiste vous contactera par email dans les 24 heures pour finaliser la création de votre store.
                </p>
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('change-view', { detail: 'supplier' }));
                  }}
                  className="px-8 py-3 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl font-bold"
                >
                  Accéder à mon Dashboard
                </button>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="prose dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Handshake className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-0">Partenariats</h1>
                <p className="text-zinc-500">Bâtissons ensemble le futur de la distribution.</p>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-3xl border dark:border-zinc-700 space-y-6">
              <h2 className="text-xl font-bold">Pourquoi devenir partenaire Eladma ?</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Eladma n'est pas seulement une plateforme de vente, c'est un écosystème en pleine croissance. Nous collaborons avec des logisticiens, des créateurs de contenu, et d'autres entreprises technologiques pour offrir la meilleure expérience utilisateur.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border dark:border-zinc-800">
                  <h4 className="font-bold mb-2">Partenaires Logistiques</h4>
                  <p className="text-xs text-zinc-500">Optimisez le dernier kilomètre avec notre IA.</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border dark:border-zinc-800">
                  <h4 className="font-bold mb-2">Affiliés & Influenceurs</h4>
                  <p className="text-xs text-zinc-500">Gagnez des commissions sur chaque vente parrainée.</p>
                </div>
              </div>
              <button 
                onClick={() => toast.success("Demande de partenariat envoyée !")}
                className="w-full py-4 bg-brand text-white rounded-xl font-bold transition-all active:scale-[0.98]"
              >
                Devenir Partenaire
              </button>
            </div>
          </div>
        )}

        {activeTab === 'advertising' && (
          <div className="prose dark:prose-invert max-w-none">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Megaphone className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-0">Publicité sur Eladma</h1>
                <p className="text-zinc-500">Boostez votre visibilité auprès d'une audience ciblée.</p>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-zinc-600 dark:text-zinc-400">
                Mettez vos produits en avant grâce à nos solutions publicitaires assistées par IA. Nous plaçons vos annonces là où vos clients potentiels sont les plus susceptibles de convertir.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Produits sponsorisés</span>
                    Apparaissez en tête des résultats de recherche pertinents.
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Bannières Display</span>
                    Occupez des emplacements stratégiques sur la home page et les catégories.
                  </div>
                </li>
              </ul>
              <div className="p-8 bg-brand text-white rounded-3xl text-center shadow-xl shadow-brand/20">
                <h3 className="text-2xl font-bold mb-2">Boostez votre trafic</h3>
                <p className="text-sm opacity-90 mb-6 max-w-md mx-auto">Nos algorithmes optimisent vos campagnes en temps réel pour maximiser votre ROI.</p>
                <button 
                  onClick={() => toast.success("Notre régie publicitaire vous contactera bientôt.")}
                  className="px-10 py-4 bg-white text-brand rounded-2xl font-bold hover:bg-zinc-50 transition-all active:scale-95"
                >
                  Contacter la régie régie publicitaire
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
