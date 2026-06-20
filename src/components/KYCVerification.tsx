import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCcw, Check, ShieldCheck, X, AlertCircle, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KYCVerificationProps {
  onComplete: (photo: string) => void;
  onCancel: () => void;
}

export const KYCVerification: React.FC<KYCVerificationProps> = ({ onComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraReady(true);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Accès caméra refusé ou non disponible par l'environnement. Veuillez utiliser l'importation de fichier.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setPhoto(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         if (typeof reader.result === 'string') {
           setPhoto(reader.result);
           setError(null);
         }
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setPhoto(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-xl">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black dark:text-white">Vérification Faciale</h3>
              <p className="text-xs text-zinc-500">Sécurité Eladma AI-Identity</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden mb-6 border-4 border-zinc-50 dark:border-zinc-800 shadow-inner">
            <input 
              type="file" 
              ref={fileInputRef} 
              id="selfie-file"
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <AnimatePresence mode="wait">
              {!photo ? (
                <motion.div 
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {!isCameraReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCcw className="w-8 h-8 text-brand animate-spin" />
                    </div>
                  )}
                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-800">
                      <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                      <p className="text-xs font-bold text-zinc-650 dark:text-zinc-300 mb-4">{error}</p>
                      <div className="flex gap-3">
                        <button onClick={startCamera} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-650 text-zinc-800 dark:text-white rounded-xl text-xs font-black">Réessayer</button>
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-brand/10">
                          <Upload className="w-3.5 h-3.5" />
                          Importer
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="photo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <img src={photo} className="w-full h-full object-cover" alt="Selfie" />
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-3 rounded-2xl border border-emerald-500/20">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Identité Détectée par l'IA</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="space-y-4">
            <p className="text-sm text-zinc-500 text-center px-4">
              Placez votre visage au centre du cadre. Vous pouvez également importer directement une photo d'identité si votre appareil ne possède pas d'appareil photo fonctionnel.
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                {!photo ? (
                  <>
                    <button 
                      onClick={takePhoto}
                      disabled={!isCameraReady}
                      className="flex-1 py-4 bg-brand text-white rounded-2xl font-black text-lg shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      Prendre la photo
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="py-4 px-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      Importer
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={retake}
                      className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className="w-5 h-5" />
                      Refaire
                    </button>
                    <button 
                      onClick={() => onComplete(photo)}
                      className="flex-1 py-4 bg-brand text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand/20"
                    >
                      <Check className="w-6 h-6" />
                      Valider
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
