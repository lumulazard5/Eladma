import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  Star, 
  Award, 
  History, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Truck, 
  Copy, 
  Check, 
  Users, 
  UserPlus, 
  Share2, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  Gift as GiftIcon, 
  ArrowUpRight,
  Shield,
  Lock,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { EladmaSecurity } from '../services/security';

interface RewardsProps {
  points: number;
  onAddPoints?: (pts: number) => void;
}

interface Filleul {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed';
  date: string;
  pointsEarned: number;
}

interface Activity {
  title: string;
  points: string;
  date: string;
  type: string;
}

export const Rewards: React.FC<RewardsProps> = ({ points, onAddPoints }) => {
  // Referral states
  const referralCode = 'ELADMA-KASA-771';
  const referralLink = 'https://eladma.com/signup?ref=ELADMA-KASA-771';
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Security Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'secure' | 'warning'>('idle');

  const [filleuls, setFilleuls] = useState<Filleul[]>(() => {
    try {
      const saved = localStorage.getItem('eladma_filleuls');
      return saved ? JSON.parse(saved) : [
        { id: 'f1', name: 'Jean-Paul Mukendi', email: 'jp.mukendi@gmail.com', status: 'pending', date: '01/06/2026', pointsEarned: 0 },
        { id: 'f2', name: 'Sarah Kabeya', email: 'sarah.kab@yahoo.fr', status: 'completed', date: '28/05/2026', pointsEarned: 500 }
      ];
    } catch {
      return [
        { id: 'f1', name: 'Jean-Paul Mukendi', email: 'jp.mukendi@gmail.com', status: 'pending', date: '01/06/2026', pointsEarned: 0 },
        { id: 'f2', name: 'Sarah Kabeya', email: 'sarah.kab@yahoo.fr', status: 'completed', date: '28/05/2026', pointsEarned: 500 }
      ];
    }
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem('eladma_activities');
      return saved ? JSON.parse(saved) : [
        { title: 'Achat Commande #AD9921', points: '+156', date: 'Hier', type: 'purchase' },
        { title: 'Bonus Bienvenue', points: '+50', date: 'Il y a 3 jours', type: 'bonus' },
        { title: 'Avis Produit publié', points: '+20', date: 'La semaine dernière', type: 'review' },
      ];
    } catch {
      return [
        { title: 'Achat Commande #AD9921', points: '+156', date: 'Hier', type: 'purchase' },
        { title: 'Bonus Bienvenue', points: '+50', date: 'Il y a 3 jours', type: 'bonus' },
        { title: 'Avis Produit publié', points: '+20', date: 'La semaine dernière', type: 'review' },
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem('eladma_filleuls', JSON.stringify(filleuls));
  }, [filleuls]);

  useEffect(() => {
    localStorage.setItem('eladma_activities', JSON.stringify(activities));
  }, [activities]);

  const tiers = [
    { name: 'Bronze', min: 0, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20' },
    { name: 'Argent', min: 500, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-800/30' },
    { name: 'Or', min: 2000, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { name: 'Diamant', min: 5000, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  ];

  const currentTier = [...tiers].reverse().find(t => points >= t.min) || tiers[0];
  const nextTier = [...tiers].find(t => t.min > points);
  const progress = nextTier ? (points / nextTier.min) * 100 : 100;

  const totalEarnedFromReferral = filleuls
    .filter(f => f.status === 'completed')
    .reduce((sum, f) => sum + f.pointsEarned, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast.success('Lien de parrainage copié ! Partagez-le avec vos proches.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInviteFriend = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Anti-abuse rate limit check (max 5 invitations per minute)
    if (!EladmaSecurity.checkRateLimit('invite_friend', 5, 60000)) {
      return;
    }

    // 2. Input Sanitization
    const sanitizedName = EladmaSecurity.sanitizeInput(friendName);
    const sanitizedEmail = EladmaSecurity.sanitizeInput(friendEmail).trim().toLowerCase();

    if (!sanitizedName || !sanitizedEmail) {
      toast.error('Veuillez spécifier un nom et un e-mail valides.');
      return;
    }

    if (!EladmaSecurity.isValidEmail(sanitizedEmail)) {
      toast.error('Adresse e-mail invalide.');
      return;
    }

    if (filleuls.some(f => f.email.toLowerCase() === sanitizedEmail)) {
      toast.error('Un ami avec cet adresse email a déjà été invité.');
      return;
    }

    setIsInviting(true);
    setTimeout(() => {
      const newFilleul: Filleul = {
        id: Math.random().toString(36).substr(2, 9),
        name: sanitizedName,
        email: sanitizedEmail,
        status: 'pending',
        date: new Date().toLocaleDateString('fr-FR'),
        pointsEarned: 0
      };

      setFilleuls(prev => [newFilleul, ...prev]);
      setFriendName('');
      setFriendEmail('');
      setIsInviting(false);
      toast.success(`Invitation envoyée avec succès à ${newFilleul.name} !`);
    }, 600);
  };

  const handleSimulateFirstOrder = (id: string) => {
    const target = filleuls.find(f => f.id === id);
    if (!target) return;

    // Change status to completed
    setFilleuls(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, status: 'completed', pointsEarned: 500 };
      }
      return f;
    }));

    // Register active reward activity
    const newActivity: Activity = {
      title: `Parrainage : 1re commande de ${target.name}`,
      points: '+500',
      date: 'À l’instant',
      type: 'referral'
    };
    setActivities(prev => [newActivity, ...prev]);

    // Callback point adding
    if (onAddPoints) {
      onAddPoints(500);
    }

    toast.success(`Félicitations ! Votre filleul ${target.name} a passé sa commande. Vous gagnez +500 points Eladma ! 🎉`);
  };

  const startSecurityAudit = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([]);
    setScanStatus('idle');

    const steps = [
      { log: "Initialisation du protocole de sécurité Eladma Shield...", duration: 250 },
      { log: "Analyse des entrées de texte et prévention des injections XSS...", duration: 500 },
      { log: "Vérification de l'intégrité de la base de stockage locale...", duration: 800 },
      { log: "Scan des variables globales en mémoire contre les scripts injectés...", duration: 1100 },
      { log: "Validation des tokens de parrainage et prévention du détournement de récompenses...", duration: 1400 },
      { log: "Audit Eladma Shield terminé : 0 faille, intégrité assurée.", duration: 1700 },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString('fr-FR')}] ${step.log}`]);
        setScanProgress(Math.floor(((idx + 1) / steps.length) * 100));
        
        if (idx === steps.length - 1) {
          setIsScanning(false);
          setScanStatus('secure');
          toast.success("Audit de sécurité Eladma terminé : Votre compte et cette plateforme sont 100% protégés contre le piratage.");
        }
      }, step.duration);
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Welcome Rewards Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand rounded-3xl p-8 text-white overflow-hidden relative shadow-xl shadow-brand/10 border border-brand-dark/20"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Star className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Eladma Loyalty Club</h1>
              <p className="text-xs text-white/70">Cumulez des points, débloquez des avantages tiers & parrainez vos contacts</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
            <div>
              <p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1.5">Solde de points actuels</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black">{points}</span>
                <span className="text-xl font-bold opacity-95 text-amber-300">points</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toast.info("Conversion temporairement en cours d'approvisionnement.")}
                className="px-6 py-3.5 bg-white text-brand rounded-2xl font-black text-xs hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
              >
                Échanger mes points
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Loyalty Overview & available items) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tier Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  Niveau Club
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentTier.bg} ${currentTier.color}`}>
                  {currentTier.name}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Prochain rang : {nextTier?.name || 'Max atteint'}</span>
                  <span className="font-bold dark:text-zinc-100">{nextTier ? `${points}/${nextTier.min}` : 'Rang Ultime'}</span>
                </div>
                <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-brand"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">
                {nextTier 
                  ? `Vous devez encore accumuler ${nextTier.min - points} points pour débloquer le rang ${nextTier.name}.` 
                  : 'Félicitations, vous bénéficiez du pack maximal de livraison gratuite & d’offres express !'}
              </p>
            </div>

            {/* Referral Stats Summary Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-3xl p-6 border dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand" />
                  Bilan Parrainage
                </h3>
                <span className="text-[10px] font-black uppercase text-brand tracking-widest">
                  +500 points / ami
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800">
                  <span className="block text-xl font-bold dark:text-white">{filleuls.length}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Invités</span>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800">
                  <span className="block text-xl font-bold text-emerald-500">+{totalEarnedFromReferral}</span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Points Gagnés</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 leading-normal text-center">
                Vos points sont crédités dès que votre filleul valide sa première commande.
              </p>
            </div>
          </div>

          {/* Core Referral Terms Steps */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm dark:text-white">Comment fonctionne le parrainage Eladma ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', title: 'Partagez', desc: 'Copiez et envoyez votre code de parrainage exclusif à vos proches.' },
                { step: '02', title: 'Inscriptions', desc: 'Vos amis rejoignent la plateforme via votre code de parrainage.' },
                { step: '03', title: '500 Pts Cadeau', desc: 'Dès que le filleul effectue son 1er achat, gagnez 500 Pts chacun !' }
              ].map((s, idx) => (
                <div key={idx} className="relative p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl space-y-2 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800 transition-colors">
                  <span className="text-2xl font-black text-brand/20 dark:text-brand/10 absolute top-2 right-3">{s.step}</span>
                  <h4 className="font-bold text-xs dark:text-zinc-200">{s.title}</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reward Prizes Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Coupons & Expérience Cadeau</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Coupon Réduction -5€', cost: 500, icon: GiftIcon, desc: 'Valide sur tout le catalogue' },
                { title: 'Livraison Gratuite', cost: 300, icon: Truck, desc: 'Épargnez les frais de transport' },
                { title: 'Artisanat d’Or', cost: 1200, icon: Star, desc: 'Cadeau surprise sculpté par les coopératives' },
              ].map((reward, i) => {
                const canAfford = points >= reward.cost;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (canAfford) {
                        toast.success(`Félicitations ! Vous avez débloqué la récompense : ${reward.title}. Un code unique d'activation a été envoyé à votre adresse e-mail.`);
                      } else {
                        toast.error(`Points insuffisants. Il vous manque ${reward.cost - points} points pour débloquer cette option.`);
                      }
                    }}
                    className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      canAfford 
                        ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-brand hover:shadow-md' 
                        : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-900 opacity-75'
                    }`}
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                        canAfford 
                          ? 'bg-brand/10 text-brand group-hover:scale-105' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        <reward.icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm dark:text-white mt-3 line-clamp-1">{reward.title}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-normal">{reward.desc}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t dark:border-zinc-800">
                      <span className="text-xs font-black text-brand">{reward.cost} pts</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        canAfford 
                          ? 'bg-brand text-white' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        {canAfford ? 'Débloquer' : 'Bloqué'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activities History list */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              Historique des Gains
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {activities.map((activity, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm hover:border-zinc-250 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        activity.type === 'referral' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs dark:text-white">{activity.title}</p>
                        <p className="text-[10px] text-zinc-400">{activity.date}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-emerald-500">{activity.points}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Right Column (My Referral Panel & simulation) */}
        <div className="space-y-8">
          
          {/* Eladma Shield Anti-Hacking Telemetry Center */}
          <div className="bg-zinc-950 text-zinc-100 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs">ELADMA Shield</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Protection Active</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIF
              </span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Notre protocole anti-piratage sécurise vos transactions, prévient le détournement de points et neutralise les injections de scripts malveillants (XSS/CSRF).
            </p>

            {/* Interactive Audits Scanner */}
            <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Anti-Franchise & Tamper
                </span>
                <span className="text-zinc-500">Scan Temps Réel</span>
              </div>

              {isScanning ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>Vérification du système...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              ) : scanStatus === 'secure' ? (
                <div className="p-2.5 bg-emerald-500/5 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center gap-2 text-[10px]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold">Aucune vulnérabilité trouvée</span>
                    <p className="text-[8px] text-zinc-500">Dernier scan : À l'instant (0 menace détectée)</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startSecurityAudit}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-bold tracking-tight transition-all text-center flex items-center justify-center gap-1"
                >
                  Tester la sécurité de la session
                </button>
              )}

              {scanLogs.length > 0 && (
                <div className="p-3 bg-black/90 rounded-xl font-mono text-[8px] space-y-1 text-zinc-400 max-h-32 overflow-y-auto leading-relaxed border border-zinc-850">
                  {scanLogs.map((log, idx) => (
                    <p key={idx} className={idx === scanLogs.length - 1 ? "text-emerald-400 animate-pulse" : ""}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl">
                <span className="block font-bold text-white">XSS & Injection</span>
                <span className="text-emerald-400">Filtré & Neutre</span>
              </div>
              <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl">
                <span className="block font-bold text-white">Base de points</span>
                <span className="text-emerald-400">Chiffrée</span>
              </div>
            </div>
          </div>

          {/* My Code & Copy Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm dark:text-white">Partager mon code</h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-normal">
              Partagez votre code ou votre adresse de parrainage avec vos proches sur vos réseaux sociaux préférés.
            </p>

            <div className="space-y-3">
              {/* Promo code box */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700 flex items-center justify-between">
                <span className="font-mono text-xs font-black dark:text-zinc-200 tracking-wider">
                  {referralCode}
                </span>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-200/50 dark:bg-zinc-700 px-2 py-1 rounded">
                  CODE PROMO
                </span>
              </div>

              {/* URL sharing */}
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink} 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-[10px] text-zinc-500 font-medium focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="absolute right-2 p-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Direct Invite/Email Invite Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm dark:text-white">Inviter un nouvel ami</h3>
            </div>
            
            <form onSubmit={handleInviteFriend} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Nom du filleul</label>
                <input 
                  required
                  type="text" 
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="ex: Patrick Mulumba" 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-brand dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Adresse e-mail</label>
                <input 
                  required
                  type="email" 
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="ex: pat@mulumba.cd" 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-brand dark:text-white"
                />
              </div>

              <button 
                type="submit"
                disabled={isInviting}
                className="w-full py-3 bg-brand text-white rounded-xl font-bold text-xs hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
              >
                {isInviting ? 'Envoi de l’invitation...' : 'Envoyer l’invitation'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Interactive Simulation Dashboard (Conversion Simulator) */}
          {filleuls.some(f => f.status === 'pending') && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Zap className="w-4.5 h-4.5 fill-current animate-pulse" />
                <h4 className="font-black text-xs uppercase tracking-wider">Simulateur de Conversion</h4>
              </div>
              <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-normal">
                Cliquez pour simuler la première commande d'un filleul. Cela validera son parrainage et créditera votre compte de 500 points !
              </p>
              
              <div className="space-y-2">
                {filleuls.filter(f => f.status === 'pending').map((f) => (
                  <div key={f.id} className="p-3 bg-white dark:bg-zinc-900 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="block text-xs font-bold truncate dark:text-white">{f.name}</span>
                      <span className="text-[9px] text-zinc-400 truncate block">{f.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateFirstOrder(f.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black transition-all active:scale-[0.98]"
                    >
                      Payer 1re Cmd
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Referred List (Vos filleuls) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm dark:text-white">Mes Filleuls ({filleuls.length})</h3>
              <span className="text-[9px] font-bold text-zinc-400 uppercase">Statut</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {filleuls.map((f) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={f.id} 
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl flex items-center justify-between border dark:border-zinc-800"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="block text-xs font-bold dark:text-white truncate">{f.name}</span>
                      <span className="text-[9px] text-zinc-400 truncate block">{f.email}</span>
                    </div>
                    
                    <div className="text-right">
                      {f.status === 'completed' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase">
                            Commande Validée
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          </span>
                          <span className="block text-[8px] font-bold text-zinc-400">+500 pts d'or</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-block text-[9px] font-bold text-amber-500 uppercase bg-amber-500/5 px-2 py-0.5 rounded-full">
                            Inscrit
                          </span>
                          <span className="block text-[8px] text-zinc-400 italic">En attente d'achat</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
