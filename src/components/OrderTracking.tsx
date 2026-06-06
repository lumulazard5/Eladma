import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, Bell, Play, Pause, ChevronRight, Activity, MapPin, Compass, Navigation, Locate, Globe, Milestone, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { orderManager } from '../services/orderService';
import { useLanguage } from '../context/LanguageContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface OrderStatus {
  id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
  items: string[];
  location: string;
}

const trackingTranslations: Record<string, any> = {
  fr: {
    title: "Suivi de colis en temps réel",
    subtitle: "Entrez votre numéro de commande pour suivre son avancement.",
    searchBtn: "Suivre",
    placeholder: "Ex: ELADMA-9928",
    details: "Détails du colis",
    lastUpdate: "Dernière mise à jour",
    estDate: "Date estimée de livraison",
    simulationTitle: "Outil de test : Simulation de transit RDC",
    simulationDesc: "Simuler la progression physique du colis par les transporteurs locaux en temps réel.",
    statusAlert: "Mise à jour de la commande",
    status_pending: "Votre commande a été passée avec succès et est en cours d'enregistrement.",
    status_processing: "Votre colis est actuellement en cours de préparation par le vendeur local.",
    status_shipped: "Votre colis est en transit (En cours de livraison) !",
    status_delivered: "Votre colis a été livré au point de retrait avec succès !",
    step_pending: "Commande reçue",
    step_processing: "En préparation",
    step_shipped: "En transit (Livraison)",
    step_delivered: "Livré",
    statusChangeToast: "Statut de livraison mis à jour !",
    transitLoc_pending: "Entrepôt central de Kananga, RDC",
    transitLoc_processing: "Centre de tri provincial, Kasaï-Central",
    transitLoc_shipped: "En cours d'acheminement par transporteur local",
    transitLoc_delivered: "Point de retrait certifié, Kananga RDC",
    autoSimulateOn: "Lecture automatique du transit",
    autoSimulateOff: "Pause de la simulation",
    nextStatusBtn: "Transit vers étape suivante",
    preloadedTip: "Astuce démo : Vous pouvez rechercher et suivre la commande par défaut « ELADMA-9928 »",
    notFound: "Aucune commande trouvée avec cet identifiant.",
    hubMapTitle: "Logistique locale Eladma & Hubs Physiques",
    hubMapSubtitle: "Sélectionnez votre position ou activez votre GPS pour localiser le hub d'appui Eladma le plus proche et visualiser les corridors de livraison.",
    useGpsBtn: "Géolocaliser ma position",
    gpsActive: "GPS Activé",
    chooseCityLabel: "Sélectionner ou simuler une ville en RDC :",
    closestHubLabel: "Votre hub Eladma de rattachement",
    distanceLabel: "Distance de livraison estimée",
    carbonSavingsTitle: "Bilan Éco-Responsable locale",
    coorLabel: "Vos Coordonnées"
  },
  en: {
    title: "Real-time Order Tracking",
    subtitle: "Enter your order number to track its progress in real-time.",
    searchBtn: "Track",
    placeholder: "E.g., ELADMA-9928",
    details: "Package Details",
    lastUpdate: "Last Update",
    estDate: "Estimated Delivery Date",
    simulationTitle: "Testing Tool: DRC Transit Simulation",
    simulationDesc: "Simulate physical shipping progress by local carriers in real-time.",
    statusAlert: "Order Status Updated",
    status_pending: "Your order has been placed successfully and is pending registration.",
    status_processing: "Your package is currently being prepared by the local seller.",
    status_shipped: "Your package is in transit (Out for Delivery)!",
    status_delivered: "Your package was successfully delivered to the pickup point!",
    step_pending: "Order Received",
    step_processing: "Processing",
    step_shipped: "In Transit",
    step_delivered: "Delivered",
    statusChangeToast: "Delivery status updated!",
    transitLoc_pending: "Kananga Central Hub, DRC",
    transitLoc_processing: "Kasaï-Central Sorting Center",
    transitLoc_shipped: "In transit via local courier",
    transitLoc_delivered: "Secure distribution point, Kananga DRC",
    autoSimulateOn: "Auto-play Transit",
    autoSimulateOff: "Pause Simulation",
    nextStatusBtn: "Advance Cargo",
    preloadedTip: "Demo Tip: You can query and track the default order « ELADMA-9928 »",
    notFound: "No command or package found with this identifier.",
    hubMapTitle: "Eladma Local Logistics & Hubs",
    hubMapSubtitle: "Select your position or turn on GPS to locate the nearest supporting Eladma hub and view geographic delivery corridors.",
    useGpsBtn: "Geolocate My Position",
    gpsActive: "GPS Active",
    chooseCityLabel: "Select or simulate city in DRC:",
    closestHubLabel: "Your closest supporting operations hub",
    distanceLabel: "Estimated delivery distance",
    carbonSavingsTitle: "Local Eco-Responsible savings",
    coorLabel: "Your Coordinates"
  },
  ln: {
    title: "Bolandi olandeli biloko na mabelé",
    subtitle: "Koma nimero ya wenzé mpo na kolanda.",
    searchBtn: "Landa",
    placeholder: "Ndé: ELADMA-9928",
    details: "Makambo ya biloko",
    lastUpdate: "Sango ya nsuka",
    estDate: "Mokolo ya kozua biloko",
    simulationTitle: "Esaleli ya komeka: Komeka kotinda biloko",
    simulationDesc: "Meka lolenge biloko ezali kotambola na bamasini.",
    statusAlert: "Mbongwana ya sango ya biloko",
    status_pending: "Wenzé na yo ekoti malamu. Tozali kozela.",
    status_processing: "Moteki azali kobongisa biloko na yo sikoyo.",
    status_shipped: "Biloko na yo ezali na nzela ya koya !",
    status_delivered: "Biloko na yo ekómi na esika ya kozwela yango !",
    step_pending: "Wenzé ekoti",
    step_processing: "Koyekola",
    step_shipped: "Na nzela",
    step_delivered: "Ekómi",
    statusChangeToast: "Sango ya komema biloko ebongwami !",
    transitLoc_pending: "Entrepôt ya Kananga, RDC",
    transitLoc_processing: "Esika ya kokabola biloko na Kasaï-Central",
    transitLoc_shipped: "Ezali kotambola na motuka",
    transitLoc_delivered: "Esika ya kimia mpo na kozua biloko, Kananga RDC",
    autoSimulateOn: "Tia nzela o komani",
    autoSimulateOff: "Tia pause na komeka",
    nextStatusBtn: "Tinda biloko oboso",
    preloadedTip: "Sango: Okoki kolanda nzela ya wenzé tina oyo « ELADMA-9928 »",
    notFound: "Ezwi wenzé moko té na nkombo wana.",
    hubMapTitle: "Logistique ya bandako Eladma RDC",
    hubMapSubtitle: "Pona esika ozali to banzela mpo na komona esika ya Eladma oyo ezali pembeni gola mpenza na yo.",
    useGpsBtn: "Fungola GPS na ngai",
    gpsActive: "GPS Eza active",
    chooseCityLabel: "Pona engumba moko na kati ya RDC :",
    closestHubLabel: "Esika ya kobatela biloko pembeni yo",
    distanceLabel: "Kilometre ti esika na yo",
    carbonSavingsTitle: "Sango ya kotika gaz carbone mingi te",
    coorLabel: "Coordonnes na yo"
  },
  sw: {
    title: "Ufuatiliaji wa agizo kwa wakati halisi",
    subtitle: "Ingiza nambari yako ya agizo ili kufuatilia maendeleo.",
    searchBtn: "Fuatilia",
    placeholder: "Mfano: ELADMA-9928",
    details: "Maelezo ya Kifurushi",
    lastUpdate: "Sasisho la Mwisho",
    estDate: "Tarehe ya makadirio ya kuwasili",
    simulationTitle: "Zana ya Majaribio: Uigaji wa Usafirishaji vya DRC",
    simulationDesc: "Kuiga maendeleo ya usafirishaji na wasafirishaji wa ndani.",
    statusAlert: "Hali ya agizo imesasishwa",
    status_pending: "Agizo lako limewekwa kwa mafanikio na linasubiri.",
    status_processing: "Kifurushi chako kinaandaliwa kwa sasa na muuzaji wa ndani.",
    status_shipped: "Kifurushi chako kiko njiani (Kinasafirishwa) !",
    status_delivered: "Kifurushi chako kimewasilishwa kwa mafanikio !",
    step_pending: "Agizo limepokelewa",
    step_processing: "Inatayarishwa",
    step_shipped: "Njiani",
    step_delivered: "Imewasilishwa",
    statusChangeToast: "Hali ya utoaji imesasishwa !",
    transitLoc_pending: "Ghala kuu la Kananga, DRC",
    transitLoc_processing: "Kituo cha uainishaji cha Kasaï-Central",
    transitLoc_shipped: "Inasafirishwa na msafirishaji wa ndani",
    transitLoc_delivered: "Kituo salama cha usambazaji, Kananga RDC",
    autoSimulateOn: "Endesha Usafirishaji",
    autoSimulateOff: "Sitisha Uigaji",
    nextStatusBtn: "Sogeza mbele",
    preloadedTip: "Dondoo: Unaweza kutafuta na kufuata agizo la hila « ELADMA-9928 »",
    notFound: "Hakuna agizo lililopatikana kwa kitambulisho hicho kabisa.",
    hubMapTitle: "Vituo vya Usafirishaji vya Eladma RDC",
    hubMapSubtitle: "Chagua eneo lako au washa GPS ili kupata kituo cha karibu cha Eladma cha vifaa vya ndani.",
    useGpsBtn: "Washa GPS yangu sasa",
    gpsActive: "GPS Imewashwa",
    chooseCityLabel: "Chagua mji wako nchini DRC:",
    closestHubLabel: "Kituo chako cha karibu zaidi cha vifaa",
    distanceLabel: "Makadirio ya umbali wa kufika",
    carbonSavingsTitle: "Uokoaji wa kaboni katika mazingira",
    coorLabel: "Kuratibu kwako"
  }
};

// Locations of Eladma physical hubs in DRC
const LOGISTICS_HUBS = [
  { id: 'kananga', name: "Hub Central - Kananga Ngaza", city: "Kananga", lat: -5.8962, lng: 22.4166, address: "Quartier Ngaza, Kananga, RDC", description: "Collecte, tri & expédition internationale des artisans du Kasaï-Central", color: "#FF4F01" },
  { id: 'kinshasa', name: "Transit Ouest - Kinshasa Galiema", city: "Kinshasa", lat: -4.3250, lng: 15.3118, address: "Avenue Kasa-Vubu, Galiema, Kinshasa", description: "Hub de distribution ouest & dédouanement fluvial/aéroportuaire", color: "#3B82F6" },
  { id: 'lubumbashi', name: "Relais Sud - Lubumbashi Kasenga", city: "Lubumbashi", lat: -11.6608, lng: 27.4794, address: "Route Kasenga, Lubumbashi, RDC", description: "Point d'éclatement logistique Katanga & Afrique Australe", color: "#10B981" }
];

// Major cities for manual coordinates simulation
const CITIES_LIST = [
  { name: 'Kananga', lat: -5.8962, lng: 22.4166, label: 'Kananga (Kasaï-Central)' },
  { name: 'Kinshasa', lat: -4.3250, lng: 15.3118, label: 'Kinshasa (Gombe, Galiema...)' },
  { name: 'Lubumbashi', lat: -11.6608, lng: 27.4794, label: 'Lubumbashi (Haut-Katanga)' },
  { name: 'Goma', lat: -1.6792, lng: 29.2228, label: 'Goma (Nord-Kivu)' },
  { name: 'Mbuji-Mayi', lat: -6.1333, lng: 23.6000, label: 'Mbuji-Mayi (Kasaï-Oriental)' },
  { name: 'Kisangani', lat: 0.5163, lng: 25.2012, label: 'Kisangani (Tshopo)' },
  { name: 'Bukavu', lat: -2.5088, lng: 28.8608, label: 'Bukavu (Sud-Kivu)' },
  { name: 'Bandundu', lat: -3.3147, lng: 17.3783, label: 'Bandundu (Kwilu)' }
];

// Haversine formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// DRC bounding coordinate projections
const drcMinLng = 11.0;
const drcMaxLng = 31.5;
const drcMinLat = 5.5;   // Top
const drcMaxLat = -13.5; // Bottom

const getXPercent = (lng: number) => {
  const clamped = Math.max(drcMinLng, Math.min(drcMaxLng, lng));
  return ((clamped - drcMinLng) / (drcMaxLng - drcMinLng)) * 100;
};

const getYPercent = (lat: number) => {
  const clamped = Math.max(drcMaxLat, Math.min(drcMinLat, lat));
  return ((drcMinLat - clamped) / (drcMinLat - drcMaxLat)) * 100;
};

export const OrderTracking: React.FC = () => {
  const { language } = useLanguage();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const prevStatusRef = useRef<string | null>(null);
  const trans = trackingTranslations[language] || trackingTranslations.fr;

  const [clientCoords, setClientCoords] = useState({
    lat: -5.8962,
    lng: 22.4166,
    city: 'Kananga',
    isGps: false
  });

  const closestHubLocator = useMemo(() => {
    let minDistance = Infinity;
    let closest = LOGISTICS_HUBS[0];
    
    LOGISTICS_HUBS.forEach(hub => {
      const dist = getDistance(clientCoords.lat, clientCoords.lng, hub.lat, hub.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = hub;
      }
    });
    
    return {
      hub: closest,
      distance: minDistance
    };
  }, [clientCoords]);

  const handleActivateGps = () => {
    haptics.medium();
    sounds.select();
    if (!navigator.geolocation) {
      toast.error(language === 'fr' ? "La géolocalisation n'est pas supportée par votre navigateur." : "Geolocation is not supported by your browser.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setClientCoords({
          lat: latitude,
          lng: longitude,
          city: 'Position GPS',
          isGps: true
        });
        toast.success(language === 'fr' ? "Coordonnées GPS synchronisées !" : "GPS coordinates synchronized!");
      },
      (error) => {
        toast.warning(language === 'fr' 
          ? "Impossible d'accéder au GPS. Veuillez sélectionner une ville pour simuler vos coordonnées." 
          : "Could not access GPS. Please select a city to simulate your coordinates."
        );
        console.warn("GPS Access Denied/Error:", error);
      }
    );
  };

  const steps = [
    { title: trans.step_pending, key: 'pending', icon: Clock },
    { title: trans.step_processing, key: 'processing', icon: Package },
    { title: trans.step_shipped, key: 'shipped', icon: Truck },
    { title: trans.step_delivered, key: 'delivered', icon: CheckCircle2 },
  ];

  // Monitor status changes and fire real-time toast updates
  useEffect(() => {
    if (order && prevStatusRef.current !== null && prevStatusRef.current !== order.status) {
      const statusTitle = trans[`step_${order.status}`] || order.status;
      const statusDesc = trans[`status_${order.status}`] || '';

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
            <strong className="text-[10px] font-black uppercase tracking-wider text-brand">{trans.statusAlert}</strong>
          </div>
          <p className="text-xs font-bold text-zinc-950 dark:text-zinc-50 mt-0.5">
            {order.id} : {statusTitle}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
            {statusDesc}
          </p>
        </div>,
        {
          id: `status-update-${order.id}`, // override matches to avoid spamming alerts
          duration: 4500,
        }
      );
    }
    if (order) {
      prevStatusRef.current = order.status;
    } else {
      prevStatusRef.current = null;
    }
  }, [order?.status, language]);

  // Automatic transition simulator effect (advances cargo steps dynamically)
  useEffect(() => {
    if (!order || !isAutoSimulating) return;

    const interval = setInterval(() => {
      const idx = steps.findIndex(s => s.key === order.status);
      if (idx !== -1 && idx < steps.length - 1) {
        const nextStatus = steps[idx + 1].key as OrderStatus['status'];
        updateLocalAndGlobalStatus(nextStatus);
      } else {
        // If it reaches 'delivered', turn off play simulation
        setIsAutoSimulating(false);
      }
    }, 7000); // Progress steps automatic every 7 seconds

    return () => clearInterval(interval);
  }, [order, isAutoSimulating]);

  const updateLocalAndGlobalStatus = (newStatus: OrderStatus['status']) => {
    if (!order) return;

    // Fetch corresponding transit location using current localized strings
    const nextLocation = trans[`transitLoc_${newStatus}`] || order.location;

    haptics.success();
    sounds.success();

    setOrder(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: newStatus,
        location: nextLocation
      };
    });

    // Mirror status change locally in order manager to support application-wide cohesion
    orderManager.updateOrderStatus(order.id, newStatus);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    haptics.light();
    sounds.click();
    setIsSearching(true);
    // Simulate lookup action
    setTimeout(() => {
      const normalizedQuery = orderId.trim().toUpperCase();
      const realOrder = orderManager.getOrders().find(o => o.id.toUpperCase() === normalizedQuery);

      haptics.medium();
      sounds.open();

      if (realOrder) {
        setOrder({
          id: realOrder.id,
          status: realOrder.status as OrderStatus['status'],
          date: realOrder.date,
          items: realOrder.items.map(item => `${item.name} (x${item.quantity})`),
          location: trans[`transitLoc_${realOrder.status}`] || trans.transitLoc_pending
        });
      } else {
        // Mock a dynamically created new order or generic search for non-registered codes
        setOrder({
          id: normalizedQuery,
          status: 'pending',
          date: new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US'),
          items: ['Artisanat Kasaïen de Mushenge (x1)', 'Panier de Raphia Tressé (x2)'],
          location: trans.transitLoc_pending
        });
      }
      setIsSearching(false);
    }, 900);
  };

  const currentStepIndex = steps.findIndex(s => s.key === order?.status);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight dark:text-white">{trans.title}</h1>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto">{trans.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input 
            type="text" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={trans.placeholder}
            className="flex-1 h-12 px-6 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all outline-none font-mono dark:text-white"
            required
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="px-8 bg-brand hover:scale-[1.02] active:scale-95 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : trans.searchBtn}
          </button>
        </form>
        <p className="text-[11px] text-zinc-400 font-medium">
          💡 {trans.preloadedTip}
        </p>
      </div>

      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Status Steps Tracker Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    className="h-full bg-brand transition-all duration-1000"
                  />
               </div>
               
               <div className="flex justify-between items-start pt-4">
                 {steps.map((step, idx) => {
                   const Icon = step.icon;
                   const isActive = idx <= currentStepIndex;
                   const isCurrent = idx === currentStepIndex;
                   
                   return (
                     <div key={step.key} className="flex flex-col items-center gap-3 w-1/4 text-center">
                       <button 
                         onClick={() => updateLocalAndGlobalStatus(step.key as OrderStatus['status'])}
                         className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative cursor-pointer ${
                           isActive ? 'bg-brand text-white shadow-lg shadow-brand/10' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                         } ${isCurrent ? 'ring-4 ring-brand/20 scale-110' : ''}`}
                       >
                         {isCurrent && (
                           <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full animate-ping" />
                         )}
                         <Icon className="w-5 h-5" />
                       </button>
                       <div className="space-y-1 px-1">
                         <p className={`text-xs font-black leading-tight ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'}`}>
                           {step.title}
                         </p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Simulated Real-Time Console Panel */}
            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-150 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest">{trans.simulationTitle}</h4>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5 leading-tight">{trans.simulationDesc}</p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      haptics.medium();
                      sounds.click();
                      setIsAutoSimulating(!isAutoSimulating);
                    }}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
                      isAutoSimulating 
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50' 
                        : 'bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {isAutoSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current animate-pulse" />
                        {trans.autoSimulateOff} (7s)
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {trans.autoSimulateOn}
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      haptics.heavy();
                      sounds.select();
                      const nextIdx = currentStepIndex + 1;
                      if (nextIdx < steps.length) {
                        updateLocalAndGlobalStatus(steps[nextIdx].key as OrderStatus['status']);
                      } else {
                        // Reset to first
                        updateLocalAndGlobalStatus('pending');
                      }
                    }}
                    className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <span>{trans.nextStatusBtn}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Logistics Map & Geo-closest Hub finder */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-black/15 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-150 dark:border-zinc-800/80 pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand animate-ping" />
                    <h3 className="text-base font-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Compass className="w-5 h-5 text-brand" />
                      {trans.hubMapTitle}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold max-w-xl leading-relaxed">
                    {trans.hubMapSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    type="button"
                    onClick={handleActivateGps}
                    className={`h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${
                      clientCoords.isGps
                        ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Locate className="w-4 h-4" />
                    {clientCoords.isGps ? trans.gpsActive : trans.useGpsBtn}
                  </button>

                  <div className="relative">
                    <select
                      value={clientCoords.city}
                      onChange={(e) => {
                        const cityOpt = CITIES_LIST.find(c => c.name === e.target.value);
                        if (cityOpt) {
                          haptics.light();
                          sounds.click();
                          setClientCoords({
                            lat: cityOpt.lat,
                            lng: cityOpt.lng,
                            city: cityOpt.name,
                            isGps: false
                          });
                        }
                      }}
                      className="h-10 pl-4 pr-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors border-none text-[11px] font-bold outline-none cursor-pointer appearance-none"
                    >
                      {CITIES_LIST.map((city) => (
                        <option key={city.name} value={city.name} className="bg-white dark:bg-zinc-950 font-sans">
                          {city.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Grid content containing Interactive SVG projection Map on the left and closest hub details card on the right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Visual Projection Map Panel (Congo Map + Coordinates Indicators) */}
                <div className="lg:col-span-7 bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between relative overflow-hidden aspect-[4/3] min-h-[300px]">
                  {/* Backdrop network grid vector */}
                  <svg className="absolute inset-0 w-full h-full text-zinc-200 dark:text-zinc-900 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Stylized DR Congo silhouette bounds representation */}
                  <div className="absolute inset-4 flex items-center justify-center opacity-90">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-brand/5 dark:text-brand/10 stroke-zinc-250 dark:stroke-zinc-850" strokeWidth="0.8" fill="currentColor">
                      {/* Generative polygonal representational coordinates for Congo borders */}
                      <polygon points="15,-4 32,-3 35,5 45,5 58,-1 75,5 88,30 92,45 80,68 85,75 75,90 60,94 48,80 30,85 10,65 18,50 8,30 5,15" />
                      {/* Main winding Congo River vector */}
                      <path d="M 15,-4 Q 30,10 32,32 T 20,55 T 45,60 T 60,40 T 80,30 T 92,45" fill="none" stroke="#2563EB" strokeWidth="0.5" strokeOpacity="0.15" />
                    </svg>
                  </div>

                  {/* Live SVG Dynamic Routing Vector Line */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                      {/* Active line tracking closest hub to client coordinates */}
                      <line
                        x1={`${getXPercent(clientCoords.lng)}%`}
                        y1={`${getYPercent(clientCoords.lat)}%`}
                        x2={`${getXPercent(closestHubLocator.hub.lng)}%`}
                        y2={`${getYPercent(closestHubLocator.hub.lat)}%`}
                        stroke="#FF4F01"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        style={{ animation: 'dash 2s linear infinite' }}
                        opacity="0.8"
                      />
                      {/* Background glow line */}
                      <line
                        x1={`${getXPercent(clientCoords.lng)}%`}
                        y1={`${getYPercent(clientCoords.lat)}%`}
                        x2={`${getXPercent(closestHubLocator.hub.lng)}%`}
                        y2={`${getYPercent(closestHubLocator.hub.lat)}%`}
                        stroke="#FF4F01"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.15"
                      />
                    </svg>
                  </div>

                  {/* Ploting Hub markers */}
                  {LOGISTICS_HUBS.map((hub) => {
                    const isTarget = hub.id === closestHubLocator.hub.id;
                    const hX = getXPercent(hub.lng);
                    const hY = getYPercent(hub.lat);

                    return (
                      <div
                        key={hub.id}
                        style={{ left: `${hX}%`, top: `${hY}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                      >
                        <div className="relative flex items-center justify-center">
                          {isTarget ? (
                            <>
                              <span className="absolute w-8 h-8 rounded-full bg-[#FF4F01]/30 animate-ping" />
                              <span className="absolute w-12 h-12 rounded-full bg-[#FF4F01]/10 animate-pulse" />
                            </>
                          ) : (
                            <span className="absolute w-6 h-6 rounded-full bg-zinc-300/30 dark:bg-zinc-800/30 group-hover:scale-125 transition-transform" />
                          )}
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg cursor-pointer ${
                              isTarget ? 'bg-[#FF4F01]' : 'bg-zinc-400 dark:bg-zinc-600'
                            }`}
                          >
                            <MapPin className="w-2.5 h-2.5 text-white" />
                          </div>
                          
                          {/* Tooltip detail on hover */}
                          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] font-bold p-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider font-mono shadow-xl pointer-events-none border border-zinc-700 z-50">
                            {hub.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Ploting Subscriber client location marker */}
                  <div
                    style={{
                      left: `${getXPercent(clientCoords.lng)}%`,
                      top: `${getYPercent(clientCoords.lat)}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping" />
                      <span className="absolute w-12 h-12 rounded-full bg-blue-300/20 animate-pulse" />
                      <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-xl">
                        <Navigation className="w-2.5 h-2.5 text-white fill-current rotate-[45deg]" />
                      </div>
                    </div>
                  </div>

                  {/* Ambient mini coordinate layout at footer */}
                  <div className="flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 px-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 text-[9px] font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0 select-none shadow-sm shadow-black/5 z-30 font-sans">
                    <span className="flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      {clientCoords.city} : {clientCoords.lat.toFixed(4)}°, {clientCoords.lng.toFixed(4)}°
                    </span>
                    <span className="h-2.5 w-px bg-zinc-250 dark:bg-zinc-800 mx-2" />
                    <span className="flex items-center gap-1 text-[#FF4F01] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F01] animate-pulse" />
                      {closestHubLocator.hub.city}
                    </span>
                  </div>
                </div>

                {/* Logistics nearest details block */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                        <Milestone className="w-3.5 h-3.5 text-brand" />
                        {trans.closestHubLabel}
                      </div>

                      <div className="mt-2.5">
                        <h4 className="text-sm font-black text-zinc-850 dark:text-zinc-100 flex items-center gap-1.5">
                          {closestHubLocator.hub.name}
                        </h4>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed font-semibold">
                          {closestHubLocator.hub.address}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl text-xs text-zinc-650 dark:text-zinc-400 mt-3.5 leading-relaxed">
                        {closestHubLocator.hub.description}
                      </div>
                    </div>

                    <div className="border-t border-zinc-200/50 dark:border-zinc-800 pt-3">
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                        {trans.distanceLabel}
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-brand tracking-tight font-mono">
                          {closestHubLocator.distance.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-xs font-black uppercase text-zinc-400">km</span>
                      </div>
                    </div>
                  </div>

                  {/* Ecological Footprint Carbon Counter Box */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                    <h5 className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      {trans.carbonSavingsTitle}
                    </h5>
                    <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal">
                      {language === 'fr' 
                        ? `En livrant de façon groupée depuis le hub logistique de ${closestHubLocator.hub.city} situé à ${closestHubLocator.distance.toFixed(1)} km, Eladma économise environ 85% d'empreinte carbone par rapport aux services de colis individuels directs.`
                        : `By shipping consolidate freights via the regional logistics hub of ${closestHubLocator.hub.city} (${closestHubLocator.distance.toFixed(1)} km away), Eladma offsets average 85% carbon footprint emissions compared to direct flight express operations.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package details & update columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider dark:text-zinc-100">
                  <Package className="w-4 h-4 text-brand" />
                  {trans.details}
                </h3>
                <div className="space-y-2.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-650 dark:text-zinc-350 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl leading-relaxed">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand shrink-0"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider dark:text-zinc-100">
                  <AlertCircle className="w-4 h-4 text-brand" />
                  {trans.lastUpdate}
                </h3>
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 border-dashed">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{trans.lastUpdate} :</span>
                    <p className="text-xs font-extrabold dark:text-zinc-200 mt-1 break-words leading-relaxed">{order.location}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-semibold">{trans.estDate} :</span>
                    <strong className="text-zinc-900 dark:text-zinc-150">{order.date}</strong>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

