import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Sparkles, RefreshCw, AlertCircle, ShoppingCart, ArrowRight, Eye, QrCode } from 'lucide-react';
import { toast } from 'sonner';
// @ts-ignore
import jsQR from 'jsqr';
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
  
  const [activeTab, setActiveTab] = useState<'camera' | 'qr' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // QR Code Scanner States
  const [qrResult, setQrResult] = useState<Product | null>(null);
  const [scannedCodeText, setScannedCodeText] = useState<string | null>(null);
  const [isScanningQR, setIsScanningQR] = useState(false);

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
    if (isOpen && (activeTab === 'camera' || activeTab === 'qr') && !previewImage && !qrResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, previewImage, qrResult]);

  // QR Code detection loop
  useEffect(() => {
    let animationFrameId: number;
    let isMounted = true;

    const tick = () => {
      if (!isMounted) return;
      if (activeTab === 'qr' && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !qrResult) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            if (code && code.data) {
              handleQRDetected(code.data);
              return; // Halt scanner animation frame loop when code is read
            }
          } catch (e) {
            console.error("QR Code scanner error during canvas frame decode:", e);
          }
        }
      }
      if (activeTab === 'qr' && !qrResult) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isOpen && activeTab === 'qr' && !qrResult) {
      setIsScanningQR(true);
      const timer = setTimeout(() => {
        animationFrameId = requestAnimationFrame(tick);
      }, 400);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        cancelAnimationFrame(animationFrameId);
        setIsScanningQR(false);
      };
    }
  }, [isOpen, activeTab, qrResult]);

  // Parser and Resolver of scanned QR content
  const handleQRDetected = (codeData: string) => {
    haptics.heavy();
    sounds.success();
    setScannedCodeText(codeData);

    // Try finding the product:
    // 1. Direct ID match
    let found = products.find(p => p.id.toLowerCase() === codeData.trim().toLowerCase());
    
    // 2. URL parsing: e.g. "https://eladma.cd/product/p4" -> "p4", or parameters ?id=p1
    if (!found) {
      const matchUrl = codeData.match(/(?:id=|product\/|products\/|#|product=)([a-zA-Z0-9_-]+)/i);
      if (matchUrl && matchUrl[1]) {
        const extractedId = matchUrl[1].toLowerCase();
        found = products.find(p => p.id.toLowerCase() === extractedId);
      }
    }

    // 3. Match by exact/partial case-insensitive name
    if (!found) {
      found = products.find(p => p.name.toLowerCase().includes(codeData.toLowerCase()) || codeData.toLowerCase().includes(p.name.toLowerCase()));
    }

    // 4. Case-insensitive fallback against product description or category
    if (!found) {
      found = products.find(p => p.description.toLowerCase().includes(codeData.toLowerCase()));
    }

    if (found) {
      setQrResult(found);
      toast.success(language === 'fr' ? "Code QR produit détecté !" : "QR Tag match found!", {
        description: `Produit : ${found.name}`
      });
    } else {
      // Unrecognized external barcode or URL tag
      setQrResult({
        id: 'external-qr',
        name: language === 'fr' ? 'Tag / Code inconnu' : 'Unknown Tag/Code',
        description: codeData,
        price: 0,
        category: 'Artisanat',
        image: 'https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&q=80&w=400',
        rating: 4.0,
        reviewCount: 0,
        reviews: []
      });
      toast.warning(language === 'fr' ? "Tag scanné sans correspondance" : "Scanned unrecognized tag", {
        description: `Contenu : "${codeData.slice(0, 40)}${codeData.length > 40 ? '...' : ''}"`
      });
    }
  };

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
    setQrResult(null);
    setScannedCodeText(null);
    setIsAnalyzing(false);
    if (activeTab === 'camera' || activeTab === 'qr') {
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
            {!previewImage && !qrResult && (
              <>
                {/* Mode Selector Tabs (only if camera didn't crash) */}
                {!cameraError && (
                  <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800/80">
                    <button
                      onClick={() => { haptics.light(); setActiveTab('camera'); resetSearch(); }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'camera'
                          ? 'bg-brand text-white shadow-md'
                          : 'text-zinc-450 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Recherche IA' : 'AI Visual'}</span>
                    </button>
                    <button
                      onClick={() => { haptics.light(); setActiveTab('qr'); resetSearch(); }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'qr'
                          ? 'bg-brand text-white shadow-md'
                          : 'text-zinc-450 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Scanner QR</span>
                    </button>
                    <button
                      onClick={() => { haptics.light(); setActiveTab('upload'); resetSearch(); }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'upload'
                          ? 'bg-brand text-white shadow-md'
                          : 'text-zinc-450 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer</span>
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
                        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg shadow-brand/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{t.capture}</span>
                      </button>
                    </div>
                  </div>
                ) : activeTab === 'qr' && !cameraError ? (
                  <div className="relative aspect-video rounded-2xl bg-black border border-zinc-800 overflow-hidden group">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    
                    {/* QR Viewfinder scan target overlays */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-brand/65 rounded-2xl flex items-center justify-center relative bg-black/10">
                        {/* Animated Laser Scanning Line */}
                        <motion.div 
                          className="absolute left-3 right-3 h-0.5 bg-brand pointer-events-none shadow-[0_0_10px_#ff6400]"
                          animate={{ top: ['10%', '90%', '10%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                        
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand rounded-br-lg"></div>
                      </div>
                    </div>

                    <div className="absolute top-4 inset-x-0 flex justify-center">
                      <span className="bg-black/80 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-full border border-zinc-800 backdrop-blur uppercase tracking-wider animate-pulse">
                        {language === 'fr' ? 'Présentez un code QR ou code barre...' : 'Place a QR tag in front...'}
                      </span>
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

            {/* Scanned QR Product success panels */}
            {qrResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header Badge */}
                <div className="p-5 rounded-3xl bg-brand/10 border border-brand/20 flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-brand/25 rounded-full text-brand animate-pulse">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {qrResult.id === 'external-qr' 
                        ? (language === 'fr' ? 'Code QR détecté avec succès !' : 'QR Tag parsed!')
                        : (language === 'fr' ? 'Produit identifié par QR code !' : 'QR Product Tag matched!')
                      }
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {qrResult.id === 'external-qr' 
                        ? (language === 'fr' ? `Contenu brut scanné : ${scannedCodeText}` : `Raw tag content: ${scannedCodeText}`)
                        : (language === 'fr' ? `Numéro de série du catalogue : ${qrResult.id}` : `Catalog tag ID: ${qrResult.id}`)
                      }
                    </p>
                  </div>
                </div>

                {/* Match Product representation */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row gap-5 items-center justify-between">
                  <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-850 border border-zinc-800 flex-shrink-0">
                      <img 
                        src={qrResult.image} 
                        alt={qrResult.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className="text-[9px] px-2 py-0.5 bg-brand text-white font-black uppercase rounded-full tracking-wider">
                          {qrResult.category}
                        </span>
                        {qrResult.isLocal && (
                          <span className="text-[9px] px-2 py-0.5 bg-zinc-850 text-zinc-300 font-bold rounded-full">
                            {language === 'fr' ? 'Sourcing Local' : 'Local'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-white text-base mt-2">{qrResult.name}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 max-w-sm">{qrResult.description}</p>
                      {qrResult.price > 0 && (
                        <p className="text-sm font-black text-brand mt-2">
                          {formatPrice(qrResult.price)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 shadow-sm shrink-0">
                    {qrResult.id !== 'external-qr' ? (
                      <>
                        <button
                          onClick={() => {
                            haptics.medium();
                            onSelectProduct(qrResult);
                            onClose();
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{t.viewDetails}</span>
                        </button>
                        <button
                          onClick={() => {
                            haptics.heavy();
                            sounds.click();
                            onAddToCart(qrResult);
                            toast.success(language === 'fr' ? "Ajouté au panier" : "Added to cart", {
                              description: `${qrResult.name} est dans votre panier.`
                            });
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-brand/10"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{t.addToCart}</span>
                        </button>
                      </>
                    ) : (
                      <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 font-bold max-w-xs leading-relaxed">
                        💡 {language === 'fr' 
                          ? "Ce code n'est pas associé à un produit Eladma, mais vous pouvez chercher ce terme dans la barre principale." 
                          : "This code isn't registered to an Eladma product, but you can try searching for this tag."
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    onClick={resetSearch}
                    className="flex items-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{language === 'fr' ? 'Scanner un autre produit' : 'Scan another product'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Preview image and analysis processing / results */}
            {previewImage && !qrResult && (
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
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{t.viewDetails}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      haptics.heavy();
                                      sounds.click();
                                      onAddToCart(matchedProduct);
                                      toast.success(language === 'fr' ? "Ajouté au panier" : "Added to cart", {
                                        description: `${matchedProduct.name} est dans votre panier.`
                                      });
                                    }}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
                          <AlertCircle className="w-8 h-8 text-zinc-650" />
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
