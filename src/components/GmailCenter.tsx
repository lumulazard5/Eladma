import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Send, Plus, LogOut, ArrowRight, RefreshCw, 
  Sparkles, CheckCircle, AlertCircle, HelpCircle, User, 
  Search, ArrowLeft, Inbox, PenTool, Calendar, Info, ShieldCheck
} from 'lucide-react';
import { 
  signInWithGmail, initGmailAuth, logoutGmail, getGmailAccessToken,
  fetchGmailMessages, fetchGmailMessageDetails, sendGmailMessage,
  GmailMessageHeader, GmailMessageDetails
} from '../services/gmail';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { toast } from 'sonner';

interface GmailCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const GmailCenter: React.FC<GmailCenterProps> = ({ 
  isOpen, 
  onClose,
  userName = 'Artisan'
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Lists and searching
  const [messages, setMessages] = useState<GmailMessageHeader[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');

  // Details
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Composing
  const [toInput, setToInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // Monitor authorization state on load
  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (googleUser, googleToken) => {
        setUser(googleUser);
        setToken(googleToken);
        setIsAuthenticated(true);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch messages when authenticated
  useEffect(() => {
    if (isAuthenticated && token && isOpen) {
      loadMessages();
    }
  }, [isAuthenticated, token, isOpen]);

  // Load messages
  const loadMessages = async (silent = false) => {
    if (!silent) setIsLoadingMessages(true);
    try {
      const msgs = await fetchGmailMessages(searchQuery);
      setMessages(msgs);
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        toast.error('Erreur lors du chargement de la boîte Gmail', {
          description: err.message
        });
      }
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages();
  };

  const handleSelectMessage = async (msgId: string) => {
    haptics.light();
    sounds.click();
    setIsLoadingDetails(true);
    try {
      const details = await fetchGmailMessageDetails(msgId);
      setSelectedMessage(details);
    } catch (err: any) {
      toast.error('Impossible de charger le contenu de l‘email', {
        description: err.message
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    haptics.light();
    sounds.click();
    try {
      const result = await signInWithGmail();
      if (result) {
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
        toast.success('Connecté à Gmail avec succès !', {
          description: 'Votre messagerie est maintenant synchronisée en temps réel.'
        });
      }
    } catch (err: any) {
      toast.error('La connexion Google Gmail a échoué', {
        description: err.message
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    haptics.light();
    sounds.click();
    if (window.confirm('Voulez-vous vous déconnecter de Gmail ?')) {
      await logoutGmail();
      setMessages([]);
      setSelectedMessage(null);
      setActiveTab('inbox');
      toast.info('Déconnecté de Gmail');
    }
  };

  // Triggers verification modal first (System Mandate for sending mail)
  const triggerSendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toInput.trim() || !subjectInput.trim() || !bodyInput.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    haptics.medium();
    setShowConfirmSend(true);
  };

  const handleConfirmAndSend = async () => {
    setShowConfirmSend(false);
    setIsSending(true);
    haptics.success();
    sounds.select();

    try {
      await sendGmailMessage(toInput.trim(), subjectInput.trim(), bodyInput.trim());
      toast.success('Email envoyé avec succès !');
      // Reset compose state
      setToInput('');
      setSubjectInput('');
      setBodyInput('');
      setActiveTab('inbox');
      // Refresh inbox
      loadMessages(true);
    } catch (err: any) {
      toast.error('Échec de l‘envoi du message', {
        description: err.message
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Panel body slide-out */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col z-10 border-l border-zinc-200 dark:border-zinc-800"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/10 dark:bg-orange-600/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Mail className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Centre Messagerie Gmail</h2>
                <p className="text-xs text-zinc-500">Flux d'échanges avec vos fournisseurs</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors text-sm font-semibold"
            >
              Fermer
            </button>
          </div>

          {/* Main workspace container */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-50/20 dark:bg-zinc-950">
            {!isAuthenticated ? (
              /* Welcome Page (Not Authenticated) */
              <div className="flex-1 flex flex-col justify-center items-center px-8 text-center space-y-6 py-12">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-orange-600 mb-2 shadow-inner">
                  <Mail className="w-10 h-10" />
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Activer Gmail RDC</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Liezer officiellement votre messagerie Gmail pour coordonner la logistique d'expédition d'Eladma de Kananga vers Kinshasa et l'international.
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-4 text-xs text-zinc-600 dark:text-zinc-400 text-left max-w-sm space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-zinc-850 dark:text-zinc-200">
                    <ShieldCheck className="w-4.5 h-4.5 shrink-0 text-orange-500 animate-pulse" />
                    Bénéfices de votre synchronisation :
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Communication instantanée par email avec les coopératives locales.</li>
                    <li>Génération et envoi direct de factures proforma & devis.</li>
                    <li>Confirmation automatique de réception de matière première.</li>
                  </ul>
                </div>

                {/* Google Sign In button conforming to style specs */}
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button w-full max-w-xs justify-center flex hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-zinc-200/50 dark:shadow-none hover:shadow-xl dark:hover:shadow-none transition-all cursor-pointer"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents text-sm font-semibold">
                      {isLoggingIn ? 'Synchronisation...' : 'Se connecter avec Google'}
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              /* Synchronized User Inbox */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Profile Overview banner */}
                <div className="px-5 py-3 bg-zinc-100/50 dark:bg-zinc-900/40 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2.5">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-250 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{user?.displayName}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    title="Déconnecter mon profil Gmail"
                    className="p-1.5 rounded-lg hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Switch Tabs (Inbox vs. Compose) */}
                <div className="flex border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-2 gap-2">
                  <button
                    onClick={() => { setSelectedMessage(null); setActiveTab('inbox'); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'inbox' && !selectedMessage
                        ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                        : 'text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" /> Boîte de réception ({messages.length})
                  </button>
                  <button
                    onClick={() => { setSelectedMessage(null); setActiveTab('compose'); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'compose' 
                        ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                        : 'text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" /> Rédiger un email
                  </button>
                </div>

                {/* Switch Workspace layout content */}
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                  {selectedMessage ? (
                    /* Detailed Email Reading View */
                    <div className="p-5 space-y-4 flex-1 flex flex-col bg-white dark:bg-zinc-950">
                      {/* Back to Inbox trigger */}
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="inline-flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline mb-2 self-start"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux messages
                      </button>

                      <div className="border-b border-zinc-100 dark:border-zinc-900 pb-4 space-y-2">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-snug">
                          {selectedMessage.subject}
                        </h3>
                        <div className="flex justify-between text-xs text-zinc-500">
                          <div>
                            <p><strong>De :</strong> {selectedMessage.from}</p>
                            {selectedMessage.to && <p><strong>À :</strong> {selectedMessage.to}</p>}
                          </div>
                          <span className="text-right whitespace-nowrap">{selectedMessage.date ? new Date(selectedMessage.date).toLocaleDateString() : ''}</span>
                        </div>
                      </div>

                      {/* Display content frame */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {selectedMessage.body ? (
                          selectedMessage.body.includes('<div') || selectedMessage.body.includes('<p') ? (
                            <div 
                              className="text-sm dark:text-zinc-200 leading-relaxed max-w-none prose dark:prose-invert break-words overflow-x-hidden"
                              dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
                            />
                          ) : (
                            <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed select-text dark:text-zinc-200 break-words overflow-x-hidden">
                              {selectedMessage.body}
                            </pre>
                          )
                        ) : (
                          <p className="text-sm text-zinc-400 italic">Aucun contenu textuel dans ce message.</p>
                        )}
                      </div>
                    </div>
                  ) : activeTab === 'inbox' ? (
                    /* Inbox messages listing pane */
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Search box header */}
                      <form onSubmit={handleSearchSubmit} className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 flex gap-2">
                        <div className="flex-1 relative">
                          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                          <input 
                            type="text" 
                            placeholder="Rechercher des emails ou partenaires..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs pl-9 pr-3 outline-none dark:text-white"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={isLoadingMessages}
                          className="h-9 px-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black font-semibold text-xs rounded-lg flex items-center gap-1"
                        >
                          {isLoadingMessages ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Filtrer'}
                        </button>
                      </form>

                      {/* Messages loop */}
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {isLoadingMessages ? (
                          <div className="h-full flex flex-col justify-center items-center text-xs py-12 text-zinc-400 space-y-2">
                            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                            <p>Lecture des emails Eladma RDC...</p>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="h-full flex flex-col justify-center items-center text-xs py-16 text-center max-w-xs mx-auto space-y-2">
                            <Mail className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                            <p className="font-bold text-zinc-700 dark:text-zinc-300">Aucun message trouvé</p>
                            <p className="text-[11px] text-zinc-500 max-w-xs">
                              Aucun courriel ne correspond à vos filtres de recherche. Veuillez rafraîchir ou ajuster vos critères.
                            </p>
                            <button 
                              onClick={() => loadMessages()}
                              className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Actualiser
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-105/50 dark:divide-zinc-900/50">
                            {messages.map((msg) => (
                              <button
                                key={msg.id}
                                onClick={() => handleSelectMessage(msg.id)}
                                className="w-full text-left p-4 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-colors flex flex-col gap-1.5 relative border-none outline-none focus:bg-zinc-100/60"
                              >
                                {isLoadingDetails && selectedMessage?.id === msg.id && (
                                  <div className="absolute inset-0 bg-white/50 dark:bg-zinc-950/50 flex items-center justify-center z-1">
                                    <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                                  </div>
                                )}
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[70%]">
                                    {msg.from.split('<')[0].replace(/"/g, '').trim()}
                                  </span>
                                  <span className="text-[9px] text-zinc-400">
                                    {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                                  {msg.subject}
                                </p>
                                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                                  {msg.snippet}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Compose email pane */
                    <form onSubmit={triggerSendVerification} className="p-5 space-y-4 flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Destinataire (Fournisseur ou Artisan)</label>
                        <input 
                          type="email" 
                          placeholder="cooperative.vangu@eladma.cd"
                          required
                          value={toInput}
                          onChange={(e) => setToInput(e.target.value)}
                          className="w-full h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none outline-none text-xs px-3 dark:text-white focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sujet de l'échange</label>
                        <input 
                          type="text" 
                          placeholder="Devis d'achat - Sculptures et Brocarts de Vangu"
                          required
                          value={subjectInput}
                          onChange={(e) => setSubjectInput(e.target.value)}
                          className="w-full h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none outline-none text-xs px-3 dark:text-white focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      <div className="flex-1 flex flex-col space-y-1.5 min-h-0">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Message (Format HTML ou Texte)</label>
                        <textarea
                          placeholder="Bonjour coopérative locale, nous souhaitons commander 10 pièces..."
                          required
                          value={bodyInput}
                          onChange={(e) => setBodyInput(e.target.value)}
                          className="flex-1 w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border-none outline-none text-xs p-3.5 dark:text-white focus:ring-1 focus:ring-orange-500 min-h-[150px] resize-none"
                        />
                      </div>

                      {/* Trigger confirmation modal form button */}
                      <button
                        type="submit"
                        disabled={isSending || !toInput || !subjectInput || !bodyInput}
                        className="w-full h-11 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/10 active:scale-99 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Envoi sécurisé
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* System safety mandatory verification modal overlay */}
        <AnimatePresence>
          {showConfirmSend && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5"
              >
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Confirmer l'envoi de l'email</h4>
                    <p className="text-[10px] text-zinc-500">MANDAT DE SÉCURITÉ GOOGLE WORKSPACE</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-4.5 rounded-xl border border-zinc-100 dark:border-zinc-900 select-text">
                  <p><strong>Destinataire :</strong> {toInput}</p>
                  <p><strong>Sujet :</strong> {subjectInput}</p>
                  <p className="line-clamp-3 italic opacity-85">"{bodyInput}"</p>
                </div>

                <p className="text-[11px] text-zinc-500 leading-normal">
                  Cette action transmettra un courriel réel sur internet depuis votre adresse email personnelle. Voulez-vous continuer ?
                </p>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowConfirmSend(false)}
                    className="flex-1 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-white text-xs font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmAndSend}
                    className="flex-1 h-9 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                  >
                    Confirmer l'envoi
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
