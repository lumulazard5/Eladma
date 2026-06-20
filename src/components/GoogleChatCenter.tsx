import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, Plus, LogOut, ArrowRight, RefreshCw, 
  Sparkles, CheckCircle, Smartphone, Globe, Shield, MessagesSquare,
  AlertCircle, HelpCircle, User, MessageCircle
} from 'lucide-react';
import { 
  signInWithGoogleChat, initGoogleChatAuth, logoutGoogleChat, getGoogleAccessToken,
  fetchSpaces, createChatSpace, fetchMessages, sendChatMessage,
  ChatSpace, ChatMessage
} from '../services/googleChat';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { toast } from 'sonner';

interface GoogleChatCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onSelectSpace?: (space: ChatSpace | null) => void;
}

export const GoogleChatCenter: React.FC<GoogleChatCenterProps> = ({ 
  isOpen, 
  onClose,
  userName = 'Artisan',
  onSelectSpace
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor authorization state on load
  useEffect(() => {
    const unsubscribe = initGoogleChatAuth(
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

  // Fetch spaces when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadSpaces();
    }
  }, [isAuthenticated, token]);

  // Load spaces
  const loadSpaces = async (silent = false) => {
    if (!silent) setIsLoadingSpaces(true);
    try {
      const activeSpaces = await fetchSpaces();
      setSpaces(activeSpaces);
      
      // Select the first space or "Eladma Support" if it exists
      if (activeSpaces.length > 0 && !selectedSpace) {
        const supportSpace = activeSpaces.find(s => s.displayName.toLowerCase().includes('eladma'));
        const autoSelect = supportSpace || activeSpaces[0];
        setSelectedSpace(autoSelect);
        if (onSelectSpace) onSelectSpace(autoSelect);
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        toast.error('Erreur lors du chargement des espaces Google Chat', {
          description: err.message
        });
      }
    } finally {
      if (!silent) setIsLoadingSpaces(false);
    }
  };

  // Fetch messages when a space is selected
  useEffect(() => {
    if (selectedSpace) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedSpace]);

  // Auto-refresh messages loop helper
  useEffect(() => {
    let intervalId: any = null;
    if (selectedSpace && isAutoRefresh && isOpen) {
      intervalId = setInterval(() => {
        loadMessages(true);
      }, 7000); // refresh every 7s
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedSpace, isAutoRefresh, isOpen]);

  // Scroll to messages end
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (silent = false) => {
    if (!selectedSpace) return;
    if (!silent) setIsLoadingMessages(true);
    try {
      const chatMessages = await fetchMessages(selectedSpace.name);
      // Sort messages by createTime ascending
      const sorted = [...chatMessages].sort(
        (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      );
      setMessages(sorted);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    haptics.light();
    sounds.click();
    try {
      const result = await signInWithGoogleChat();
      if (result) {
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
        toast.success('Connecté à Google Chat avec succès !', {
          description: 'Vous pouvez maintenant lister vos espaces et envoyer des messages.'
        });
      }
    } catch (err: any) {
      toast.error('La connexion Google Chat a échoué', {
        description: err.message
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    haptics.light();
    sounds.click();
    if (window.confirm('Voulez-vous vous déconnecter de Google Chat ?')) {
      await logoutGoogleChat();
      setSelectedSpace(null);
      if (onSelectSpace) onSelectSpace(null);
      setSpaces([]);
      setMessages([]);
      toast.info('Déconnecté de Google Chat');
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    haptics.medium();
    setIsCreatingSpace(true);
    try {
      const created = await createChatSpace(newSpaceName.trim());
      toast.success(`Espace créé : "${created.displayName}"`);
      setNewSpaceName('');
      await loadSpaces();
      setSelectedSpace(created);
      if (onSelectSpace) onSelectSpace(created);
    } catch (err: any) {
      toast.error('Impossible de créer l’espace de discussion', {
        description: err.message
      });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedSpace) return;

    haptics.light();
    setIsSendingMessage(true);
    const textToSend = newMessageText.trim();
    setNewMessageText(''); // Clear input

    try {
      const sent = await sendChatMessage(selectedSpace.name, textToSend);
      // Append message instantly for responsiveness
      setMessages(prev => [...prev, sent]);
    } catch (err: any) {
      toast.error('Échec de l’envoi du message', {
        description: err.message
      });
      setNewMessageText(textToSend); // Restore if failed
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!selectedSpace) return;
    haptics.success();
    try {
      const text = `🚀 **Alerte Élémentaire Eladma RDC** \nBonjour ${user?.displayName || userName}! Ceci est un test de notification du module Google Chat d’Eladma RDC. \n💬 Votre canal de communication est actif et prêt pour la commande !`;
      await sendChatMessage(selectedSpace.name, text);
      toast.success('Notification test envoyée à Google Chat !');
      loadMessages(true);
    } catch (err: any) {
      toast.error('Erreur d’envoi de notification', {
        description: err.message
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Panel body */}
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
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <MessageSquare className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Centre Google Chat</h2>
                <p className="text-xs text-zinc-500">Intégration d'espaces collaboratifs</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
            >
              Sur l'App
            </button>
          </div>

          {/* Main area */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-50/20 dark:bg-zinc-950">
            {!isAuthenticated ? (
              /* Authentication State */
              <div className="flex-1 flex flex-col justify-center items-center px-8 text-center space-y-6 py-12">
                <div className="w-20 h-20 rounded-3xl bg-brand/5 dark:bg-brand/10 border border-brand/10 flex items-center justify-center text-brand mb-2 shadow-inner">
                  <MessagesSquare className="w-10 h-10 text-orange-500" />
                </div>
                
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-bold text-xl text-zinc-900 dark:text-white">Activer Google Chat</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Connectez votre compte Google pour créer des canaux de discussion directes avec les coopératives et artisans du Kasaï.
                  </p>
                </div>

                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-2xl p-4 text-xs text-orange-700 dark:text-orange-400 text-left max-w-sm space-y-2">
                  <p className="font-medium flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 shrink-0 text-orange-500" />
                    Bénéfices de l'intégration :
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Communication directe avec <strong>Tisseuses de Vangu</strong>, <strong>Sculpteurs de Ngaza</strong>.</li>
                    <li>Notifications de commande envoyées en temps réel sur vos salons de clavardage Google Chat.</li>
                    <li>Suivi client unifié de Kananga à Kinshasa.</li>
                  </ul>
                </div>

                {/* Google Sign In button wrapper conforming to system rules */}
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
                      {isLoggingIn ? 'Connexion en cours...' : 'Se connecter avec Google'}
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              /* Authenticated Chat View */
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Connected User Profile summary */}
                <div className="p-4 bg-zinc-100/50 dark:bg-zinc-900/40 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2.5">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Google User" className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        <User className="w-4.5 h-4.5" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{user?.displayName}</p>
                      <p className="text-[10px] text-zinc-500">{user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    title="Déconnexion de Google Chat"
                    className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-red-600 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Spaces Configuration Area */}
                <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Vos salons Google Chat ({spaces.length})
                    </label>
                    <button 
                      onClick={() => loadSpaces()}
                      title="Actualiser les espaces"
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedSpace?.name || ''}
                      onChange={(e) => {
                        const target = spaces.find(s => s.name === e.target.value);
                        setSelectedSpace(target || null);
                        if (onSelectSpace) onSelectSpace(target || null);
                      }}
                      className="flex-1 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm border-none focus:ring-1 focus:ring-orange-500/35 outline-none dark:text-white px-2.5"
                    >
                      {spaces.length === 0 ? (
                        <option value="">-- Aucun Espace Trouvé --</option>
                      ) : (
                        spaces.map(s => (
                          <option key={s.name} value={s.name}>
                            💬 {s.displayName || s.name}
                          </option>
                        ))
                      )}
                    </select>

                    <button
                      onClick={handleSendTestNotification}
                      disabled={!selectedSpace}
                      className="whitespace-nowrap px-3 h-9 rounded-lg text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Test Alerte
                    </button>
                  </div>

                  {/* Create space toggler */}
                  <form onSubmit={handleCreateSpace} className="flex gap-2 pt-1 border-t border-zinc-100/50 dark:border-zinc-900/40">
                    <input 
                      type="text" 
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      placeholder="Nom de l'Espace ou du Projet..."
                      className="flex-1 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs px-2.5 outline-none dark:text-white dark:placeholder-zinc-600 focus:ring-1 focus:ring-zinc-200"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingSpace || !newSpaceName.trim()}
                      className="h-8 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black hover:scale-101 active:scale-99 transition-all font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      {isCreatingSpace ? 'Création...' : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Créer
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Message Threads area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3 bg-zinc-50/10 dark:bg-zinc-950/20">
                  {selectedSpace ? (
                    isLoadingMessages && messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs py-8 space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
                        <p>Chargement des messages de Google Chat...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs py-12 text-center space-y-2 max-w-xs mx-auto">
                        <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Aucun message dans cet espace</p>
                        <p className="text-[11px] text-zinc-500 leading-normal">
                          Envoyez votre tout premier message pour initier la discussion avec l'intégration Google Workspace !
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {messages.map((msg, i) => {
                          const isMe = msg.sender?.email === user?.email || msg.sender?.displayName === user?.displayName;
                          return (
                            <div 
                              key={msg.name || i} 
                              className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                  {msg.sender?.displayName || 'Support Eladma'}
                                </span>
                                <span className="text-[9px] text-zinc-400">
                                  {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                                isMe 
                                  ? 'bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-500/10' 
                                  : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800/80 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-xs py-12 text-center space-y-2 max-w-xs mx-auto">
                      <HelpCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Veuillez sélectionner un salon</p>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Choisissez ou créez un espace ci-dessus pour converser directement ou recevoir des alertes.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer and message input bar */}
                <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input 
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      disabled={!selectedSpace || isSendingMessage}
                      placeholder={selectedSpace ? `Parlez dans #${selectedSpace.displayName || 'espace'}...` : "Sélectionnez un espace d'abord"}
                      className="flex-1 h-11 px-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-sm outline-none border-none dark:text-white dark:placeholder-zinc-600 focus:ring-1 focus:ring-orange-500 placeholder-zinc-400"
                    />
                    <button
                      type="submit"
                      disabled={!newMessageText.trim() || !selectedSpace || isSendingMessage}
                      className="w-11 h-11 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 disabled:text-zinc-300 text-white cursor-pointer hover:scale-102 active:scale-98 transition-all flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between mt-2.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">Synchronisation active (Node API)</span>
                    </div>

                    <label className="flex items-center gap-1.5 select-none cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isAutoRefresh}
                        onChange={(e) => setIsAutoRefresh(e.target.checked)}
                        className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 bg-zinc-50 dark:bg-zinc-900" 
                      />
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Auto-Refresh</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
