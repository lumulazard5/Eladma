import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Sparkles, RefreshCw, AlertCircle, ShoppingCart, ArrowRight, Eye } from 'lucide-react';
import { Product } from '../types';
import { searchProductsByImage, ImageSearchResult } from '../services/gemini';
import { useLanguage } from '../context/LanguageContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { useCurrency } from '../context/CurrencyContext';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onAddToCart
}) => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Internationalization text
  const t = {
    title: language === 'fr' ? 'Recherche par Image IA' : 'AI Visual Search',
    subtitle: language === 'fr' 
      ? 'Prenez une photo ou importez une image pour trouver des articles similaires' 
      : 'Snap a photo or upload an image to discover similar items',
    cameraTab: language === 'fr' ? 'Caméra en direct' : 'Live Camera',
    uploadTab: language === 'fr' ? 'Importer un fichier' : 'Upload File',
    capture: language === 'fr' ? 'Prendre la photo' : 'Capture Photo',
    recap: language === 'fr' ? 'Nouvelle analyse' : 'Scan Again',
    dragDrop: language === 'fr' 
      ? 'Glissez et déposez votre image ici, ou cliquez pour parcourir' 
      : 'Drag & drop your image here, or click to browse',
    formats: language === 'fr' ? 'Formats acceptés : PNG, JPG, WEBP' : 'Accepted formats: PNG, JPG, WEBP',
    analyzing: language === 'fr' ? 'Analyse de l\'objet en cours par l\'IA d\'Eladma...' : 'AI is identifying your item...',
    identifiedTitle: language === 'fr' ? 'Objet détecté par l\'IA :' : 'AI Identified Object:',
    matchesTitle: language === 'fr' ? 'Correspondances trouvées :' : 'Perfect Matches Found:',
    similarity: language === 'fr' ? 'Similitude' : 'Similarity',
    viewDetails: language === 'fr' ? 'Voir l\'article' : 'View Product',
    addToCart: language === 'fr' ? 'Ajouter' : 'Add to Cart',
    permissionErr: language === 'fr' 
      ? 'Accès caméra refusé ou indisponible. Veuillez utiliser l\'importation de fichiers.' 
      : 'Camera access denied or unavailable. Please use the file uploader instead.',
    noMatches: language === 'fr' 
      ? 'Aucun produit similaire n\'a été identifié dans le catalogue.' 
      : 'No similar products found in the catalog.',
  };

  // Turn on camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(t.permissionErr);
      setActiveTab('upload');
    }
  };

  // Turn off camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Manage camera based on tab and modal state
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !previewImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, previewImage]);

  // Capture current frame from video stream
  const capturePhoto = () => {
    if (videoRef.current) {
      haptics.heavy();
      sounds.click();
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreviewImage(dataUrl);
        stopCamera();
        analyzePhoto(dataUrl);
      }
    }
  };

  // Start analyzer call
  const analyzePhoto = async (imageB64: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const searchResult = await searchProductsByImage(imageB64, products);
      setResult(searchResult);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle uploaded files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    haptics.medium();
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setPreviewImage(b64);
      analyzePhoto(b64);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Clean / reset search details
  const resetSearch = () => {
    haptics.light();
    setPreviewImage(null);
    setResult(null);
    setIsAnalyzing(false);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="image-search-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal panel container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header section */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand/10 border border-brand/20">
                <Camera className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {t.title}
                  <span className="text-[9px] bg-brand/20 text-brand font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">{t.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!previewImage && (
              <>
                {/* Mode Selector Tabs (only if camera didn't crash) */}
                {!cameraError && (
                  <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800/80">
                    <button
                      onClick={() => { haptics.light(); setActiveTab('camera'); }}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === 'camera'
                          ? 'bg-brand text-white shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{t.cameraTab}</span>
                    </button>
                    <button
                      onClick={() => { haptics.light(); setActiveTab('upload'); }}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        activeTab === 'upload'
                          ? 'bg-brand text-white shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{t.uploadTab}</span>
                    </button>
                  </div>
                )}

                {/* Tabs contents */}
                {activeTab === 'camera' && !cameraError ? (
                  <div className="relative aspect-video rounded-2xl bg-black border border-zinc-800 overflow-hidden group">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    
                    {/* Viewfinder Overlay */}
                    <div className="absolute inset-0 border-2 border-dashed border-zinc-600/35 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60"></div>
                    </div>

                    <div className="absolute bottom-4 inset-x-0 flex justify-center">
                      <button
                        onClick={capturePhoto}
                        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg shadow-brand/20 active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t.capture}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ${
                      dragActive
                        ? 'border-brand bg-brand/5'
                        : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4 text-zinc-400 group-hover:text-brand transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-zinc-200 px-4">{t.dragDrop}</p>
                    <p className="text-xs text-zinc-500 mt-2">{t.formats}</p>
                  </div>
                )}
              </>
            )}

            {/* Preview image and analysis processing / results */}
            {previewImage && (
              <div className="space-y-6">
                <div className="relative aspect-video rounded-2xl border border-zinc-800 overflow-hidden bg-black/40 flex items-center justify-center">
                  <img
                    src={previewImage}
                    alt="Captured preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  
                  {isAnalyzing && (
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-brand/10 overflow-hidden">
                      <div className="w-full h-full bg-brand animate-pulse origin-left"></div>
                    </div>
                  )}

                  {/* Redone scan button */}
                  {!isAnalyzing && (
                    <button
                      onClick={resetSearch}
                      className="absolute top-4 right-4 flex items-center gap-2 bg-black/80 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-full border border-zinc-800 hover:border-zinc-700 backdrop-blur transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.recap}</span>
                    </button>
                  )}
                </div>

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-zinc-800 border-t-brand rounded-full animate-spin"></div>
                      <Sparkles className="w-5 h-5 text-brand absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{t.analyzing}</p>
                      <p className="text-xs text-zinc-500 mt-1">Modèle Gemini 3.5 Flash d'analyse oculaire</p>
                    </div>
                  </div>
                )}

                {/* Finished Visual Search results rendering */}
                {!isAnalyzing && result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Detected details card */}
                    <div className="p-4 rounded-2xl bg-brand/5 border border-brand/10 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-brand uppercase block">{t.identifiedTitle}</span>
                        <span className="text-base font-bold text-white">{result.identifiedItem}</span>
                      </div>
                    </div>

                    {/* Similitude items catalog checklist */}
                    <div>
                      <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">{t.matchesTitle}</h4>
                      {result.matches && result.matches.length > 0 ? (
                        <div className="grid gap-4">
                          {result.matches.map(({ productId, similarityScore, explanation }) => {
                            const matchedProduct = products.find(p => p.id === productId);
                            if (!matchedProduct) return null;

                            return (
                              <div
                                key={productId}
                                className="p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 transition-all duration-305 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative group"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                                    <img 
                                      src={matchedProduct.image} 
                                      alt={matchedProduct.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-sm text-white group-hover:text-brand transition-colors">{matchedProduct.name}</h5>
                                      <span className="text-xs font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                                        {matchedProduct.price ? formatPrice(matchedProduct.price) : ''}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-medium line-clamp-2">{explanation}</p>
                                    
                                    {/* Similarity indicator bar */}
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-[10px] font-bold text-zinc-500">{t.similarity} :</span>
                                      <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-brand rounded-full" 
                                          style={{ width: `${similarityScore}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-black text-brand">{similarityScore}%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions widgets */}
                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      haptics.medium();
                                      onSelectProduct(matchedProduct);
                                      onClose();
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{t.viewDetails}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      haptics.heavy();
                                      sounds.click();
                                      onAddToCart(matchedProduct);
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-colors"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>{t.addToCart}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-zinc-400 flex flex-col items-center justify-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-zinc-600" />
                          <p className="text-sm font-bold">{t.noMatches}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
