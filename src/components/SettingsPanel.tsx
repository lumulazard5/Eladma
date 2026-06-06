import React, { useState, useEffect } from 'react';
import { X, Sliders, Volume2, VolumeX, Smartphone, Trash2, Database, Wifi, WifiOff, Sparkles, Check, Play, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { toast } from 'sonner';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSecurityConsole: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, onOpenSecurityConsole }) => {
  const [hapticsEnabled, setHapticsEnabled] = useState(haptics.getStatus());
  const [soundsEnabled, setSoundsEnabled] = useState(sounds.getStatus());
  const [vibrationPreset, setVibrationPreset] = useState<'soft' | 'medium' | 'heavy'>('medium');
  const [isDemoOnline, setIsDemoOnline] = useState(true);
  const [cacheSizeKb, setCacheSizeKb] = useState(0);

  useEffect(() => {
    // Calculate simulated cache size from localStorage for user statistics transparency
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalChars += (localStorage.getItem(key) || '').length;
      }
    }
    setCacheSizeKb(Math.round((totalChars * 2) / 102.4) / 10);
  }, [isOpen]);

  const handleToggleHaptics = () => {
    const nextVal = haptics.toggle();
    setHapticsEnabled(nextVal);
    if (nextVal) {
      haptics.success();
      toast.success('Vibrations haptiques activées', {
        description: 'L\'immersion tactile est prête.',
        duration: 2000
      });
    } else {
      toast.info('Vibrations haptiques désactivées');
    }
  };

  const handleToggleSounds = () => {
    const nextVal = sounds.toggle();
    setSoundsEnabled(nextVal);
    if (nextVal) {
      sounds.success();
      toast.success('Retours audio activés', {
        description: 'Fréquences sonores activées pour chaque action.',
        duration: 2000
      });
    } else {
      toast.info('Retours audio désactivés');
    }
  };

  const handleVibrateTest = (type: 'light' | 'medium' | 'heavy' | 'sucess' | 'warn' | 'err') => {
    sounds.click();
    switch (type) {
      case 'light':
        haptics.light();
        toast.info('Test d\'impulsion légère (15ms)');
        break;
      case 'medium':
        haptics.medium();
        toast.info('Test d\'impulsion moyenne (30ms)');
        break;
      case 'heavy':
        haptics.heavy();
        toast.info('Test d\'impulsion forte (60ms)');
        break;
      case 'sucess':
        haptics.success();
        sounds.success();
        toast.success('Test du signal de succès tactile & audio');
        break;
      case 'warn':
        haptics.warning();
        sounds.warning();
        toast.warning('Test de l\'alerte d\'attention');
        break;
      case 'err':
        haptics.error();
        sounds.error();
        toast.error('Test de l\'impulsion d\'erreur / blocage');
        break;
    }
  };

  const handleClearPersistence = () => {
    haptics.warning();
    sounds.warning();
    toast.info('Êtes-vous sûr de vouloir vider le cache local ?', {
      action: {
        label: 'Confirmer',
        onClick: () => {
          localStorage.clear();
          // Restore basic preferences after wipe
          localStorage.setItem('eladma_haptics', hapticsEnabled ? 'true' : 'false');
          localStorage.setItem('eladma_sounds', soundsEnabled ? 'true' : 'false');
          setCacheSizeKb(0);
          haptics.success();
          sounds.success();
          toast.success('Cache local vidé avec succès');
        }
      },
      duration: 5000
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop screen filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[120]"
          />

          {/* Drawer body Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed top-0 bottom-0 right-0 w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800/80 z-[130] flex flex-col overflow-hidden"
          >
            {/* Header section */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand/10 text-brand rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    Paramètres Accessibilité
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">Recommandations & Retours Eladma</p>
                </div>
              </div>
              <button
                onClick={() => {
                  haptics.light();
                  sounds.click();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Informative text */}
              <div className="bg-brand/5 dark:bg-brand/10 border border-brand/15 rounded-2xl p-4">
                <p className="text-xs text-brand leading-relaxed font-semibold">
                  🌿 <strong>Recommandation majeure implémentée</strong>: Nous avons configuré des retours physiques immersifs et des signaux audio synthétisés en temps réel. Cette technologie réduit la latence perçue lors de connexions à faible bande passante (RDC / zones rurales) et améliore fortement l'accessibilité.
                </p>
              </div>

              {/* Haptic controls widget */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Retour Haptique (Vibrations)</h4>
                  </div>
                  <button
                    onClick={handleToggleHaptics}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      hapticsEnabled ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        hapticsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {hapticsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-4 rounded-2xl"
                  >
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Intensité par défaut</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['soft', 'medium', 'heavy'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            setVibrationPreset(preset);
                            if (preset === 'soft') haptics.light();
                            if (preset === 'medium') haptics.medium();
                            if (preset === 'heavy') haptics.heavy();
                            sounds.click();
                          }}
                          className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                            vibrationPreset === preset
                              ? 'bg-brand/10 border-brand text-brand shadow-sm shadow-brand/10'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {preset === 'soft' ? 'Douce' : preset === 'medium' ? 'Normale' : 'Forte'}
                        </button>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold text-zinc-400 block mb-2">Tester les modèles physiques :</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleVibrateTest('light')}
                          className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" /> Léger
                        </button>
                        <button
                          onClick={() => handleVibrateTest('medium')}
                          className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" /> Moyen
                        </button>
                        <button
                          onClick={() => handleVibrateTest('heavy')}
                          className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" /> Fort
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sound settings widget */}
              <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-900 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-brand" />
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Sons Synthétisés</h4>
                  </div>
                  <button
                    onClick={handleToggleSounds}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      soundsEnabled ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        soundsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {soundsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-4 rounded-2xl"
                  >
                    <label className="text-xs font-bold text-zinc-400 block mb-2">Tester les modèles audio :</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleVibrateTest('sucess')}
                        className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-emerald-600 rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5" /> Succès
                      </button>
                      <button
                        onClick={() => handleVibrateTest('warn')}
                        className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-amber-600 rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5" /> Alerte
                      </button>
                      <button
                        onClick={() => handleVibrateTest('err')}
                        className="py-1.5 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-[10px] font-bold text-red-500 rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5" /> Erreur
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Administration & Security console access */}
              <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-900 pt-6">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 rounded bg-zinc-100 dark:bg-zinc-900 text-brand text-[10px] font-black uppercase tracking-wider">Console</span>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Contrôle Cyber-Sécurité Guard</h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                  Surveillez les requêtes bloquées, l'état du pare-feu d'Eladma et les performances du serveur d'arrière-plan de l'API.
                </p>
                <button
                  onClick={() => {
                    haptics.heavy();
                    onOpenSecurityConsole();
                    onClose();
                  }}
                  className="w-full py-3 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-brand fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Lancer la Console de Télémétrie</span>
                </button>
              </div>

              {/* Storage and cache stats */}
              <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-900 pt-6">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand" />
                  <h4 className="text-sm font-extrabold text-zinc-905 dark:text-zinc-100">Persistance & Cache Local</h4>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Données mémorisées</p>
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-200">{cacheSizeKb} Kb</p>
                  </div>
                  <button
                    onClick={handleClearPersistence}
                    disabled={cacheSizeKb === 0}
                    className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                    title="Vider le cache complet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer banner */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
                Eladma v1.2 • Conçu pour la RDC
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
