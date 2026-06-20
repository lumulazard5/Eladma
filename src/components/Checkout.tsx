import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CartItem } from '../types';
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Navigation, 
  Compass, 
  MapPin, 
  RefreshCw, 
  Plane, 
  Ship, 
  HelpCircle,
  Smartphone,
  Phone,
  Wallet,
  Lock,
  Send,
  Delete
} from 'lucide-react';
import { toast } from 'sonner';

import { EladmaSecurity } from '../services/security';
import { orderManager } from '../services/orderService';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { translationCache } from '../services/gemini';
import { getGoogleAccessToken } from '../services/googleChat';

interface CheckoutProps {
  cart: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
  onOrderSuccess: (orderId?: string) => void;
}

const PARTNERS = [
  {
    id: 'kasai_trans',
    name: 'Connexions Kasaï Trans',
    description: 'Routier sécurisé Kasaïen de proximité',
    basePrice: 3.5,
    pricePerKm: 0.05,
    minDays: 1,
    maxDays: 3,
    icon: Truck
  },
  {
    id: 'eladma_express',
    name: 'Eladma Express Air',
    description: 'Fret aérien prioritaire provincial & national',
    basePrice: 12.5,
    pricePerKm: 0.09,
    minDays: 1,
    maxDays: 2,
    icon: Plane
  },
  {
    id: 'congo_fluvial',
    name: 'Congolaise Fluviale & Terrestre',
    description: 'Transport fluvial écologique et cargo routier',
    basePrice: 1.9,
    pricePerKm: 0.02,
    minDays: 4,
    maxDays: 8,
    icon: Ship
  }
];

function calculateDistanceInKm(lat: number, lon: number) {
  const kLat = -5.8958; // Kananga Hub Coordinates
  const kLon = 22.4167;
  const R = 6371; 
  const dLat = (lat - kLat) * Math.PI / 180;
  const dLon = (lon - kLon) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(kLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export const RDC_PROVINCES = [
  { name: 'Kasaï-Central', chefLieu: 'Kananga', tag: 'Siège Eladma', lat: -5.8958, lon: 22.4167 },
  { name: 'Kinshasa', chefLieu: 'Kinshasa', tag: 'Expansion Gombe', lat: -4.325, lon: 15.3222 },
  { name: 'Haut-Katanga', chefLieu: 'Lubumbashi', tag: 'Logistique Sud', lat: -11.6608, lon: 27.4794 },
  { name: 'Kasaï-Oriental', chefLieu: 'Mbuji-Mayi', tag: 'Relais Distribution', lat: -6.15, lon: 23.6 },
  { name: 'Kongo-Central', chefLieu: 'Matadi', tag: 'Relais maritime', lat: -5.8167, lon: 13.45 },
  { name: 'Sud-Kivu', chefLieu: 'Bukavu', tag: 'Artisanat Lacustre', lat: -2.5, lon: 28.8667 },
  { name: 'Nord-Kivu', chefLieu: 'Goma', tag: 'Relais Est', lat: -1.6792, lon: 29.2228 },
  { name: 'Tshopo', chefLieu: 'Kisangani', tag: 'Relais Fluvial', lat: 0.5167, lon: 25.2 },
  { name: 'Lualaba', chefLieu: 'Kolwezi', tag: 'Relais Distribution', lat: -10.7167, lon: 25.4667 },
  { name: 'Ituri', chefLieu: 'Bunia', tag: 'Relais Nord-Est', lat: 1.5625, lon: 30.2458 },
  { name: 'Kasaï', chefLieu: 'Tshikapa', tag: 'Artisanat local', lat: -6.4167, lon: 20.8 },
  { name: 'Kwilu', chefLieu: 'Bandundu', tag: 'Fluvial rural', lat: -4.4167, lon: 17.5 },
  { name: 'Lomami', chefLieu: 'Kabinda', tag: 'Relais local', lat: -6.1333, lon: 24.4833 },
  { name: 'Maniema', chefLieu: 'Kindu', tag: 'Fluvial Est', lat: -2.95, lon: 25.95 },
  { name: 'Sankuru', chefLieu: 'Lusambo', tag: 'Territoire forestier', lat: -4.9667, lon: 23.4333 },
  { name: 'Tanganyika', chefLieu: 'Kalemie', tag: 'Relais lacustre', lat: -5.9333, lon: 29.1833 },
  { name: 'Équateur', chefLieu: 'Mbandaka', tag: 'Relais Éco-fluvial', lat: 0.0483, lon: 18.2603 },
  { name: 'Tshuapa', chefLieu: 'Boende', tag: 'Relais forestier', lat: -0.2167, lon: 20.8667 },
  { name: 'Mongala', chefLieu: 'Lisala', tag: 'Relais local', lat: 2.15, lon: 21.5167 },
  { name: 'Nord-Ubangi', chefLieu: 'Gbadolite', tag: 'Secteur Nord', lat: 4.2833, lon: 21.0167 },
  { name: 'Sud-Ubangi', chefLieu: 'Gemena', tag: 'Relais agricole', lat: 3.25, lon: 19.7833 },
  { name: 'Bas-Uele', chefLieu: 'Buta', tag: 'Relais local', lat: 2.8, lon: 24.7333 },
  { name: 'Haut-Uele', chefLieu: 'Isiro', tag: 'Relais local', lat: 2.7667, lon: 27.6167 },
  { name: 'Haut-Lomami', chefLieu: 'Kamina', tag: 'Relais local', lat: -8.7333, lon: 24.9833 },
  { name: 'Kwango', chefLieu: 'Kenge', tag: 'Relais local', lat: -4.8333, lon: 17.0333 },
  { name: 'Mai-Ndombe', chefLieu: 'Inongo', tag: 'Relais local', lat: -1.95, lon: 18.2833 }
];

const getProvinceZip = (province: string) => {
  switch (province) {
    case 'Kinshasa': return '10001';
    case 'Kongo-Central': return '20001';
    case 'Haut-Katanga': return '30001';
    case 'Lualaba': return '31001';
    case 'Kasaï-Central': return '86001';
    case 'Kasaï-Oriental': return '85001';
    default: return '80001';
  }
};

export function calculateDistanceBetweenCoordinates(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  commune: string;
  quartier: string;
  zipCode: string;
  lat: number;
  lon: number;
}

export const ELADMA_PICKUP_POINTS: PickupPoint[] = [
  { id: 'hub_kananga_central', name: 'Hub Central Kananga', address: '24, Avenue Laurent Désiré Kabila', city: 'Kananga', province: 'Kasaï-Central', commune: 'Kananga', quartier: 'Ngaza', zipCode: '86001', lat: -5.8958, lon: 22.4167 },
  { id: 'hub_kinshasa_gombe', name: 'Bureau Expansion Gombe', address: 'Avenue de l\'Équateur', city: 'Kinshasa', province: 'Kinshasa', commune: 'Gombe', quartier: 'Gombe', zipCode: '10001', lat: -4.325, lon: 15.3222 },
  { id: 'hub_lubumbashi_golf', name: 'Bureau Logistique Lubumbashi', address: 'Avenue de la Révolution', city: 'Lubumbashi', province: 'Haut-Katanga', commune: 'Lubumbashi', quartier: 'Golf', zipCode: '30001', lat: -11.6608, lon: 27.4794 },
  { id: 'hub_mbuji_mayi', name: 'Relais Mbuji-Mayi', address: 'Avenue Kalonji', city: 'Mbuji-Mayi', province: 'Kasaï-Oriental', commune: 'Moya', quartier: 'Centre-Ville', zipCode: '85001', lat: -6.15, lon: 23.6 },
  { id: 'hub_goma', name: 'Relais Est Goma', address: 'Avenue du Lac', city: 'Goma', province: 'Nord-Kivu', commune: 'Goma', quartier: 'Himbi', zipCode: '80001', lat: -1.6792, lon: 29.2228 },
  { id: 'hub_kisangani', name: 'Relais Fluvial Kisangani', address: 'Avenue de l\'Hôtel', city: 'Kisangani', province: 'Tshopo', commune: 'Makiso', quartier: 'Makiso', zipCode: '80001', lat: 0.5167, lon: 25.2 },
  { id: 'hub_matadi', name: 'Relais Maritime Matadi', address: 'Route de la Corniche, Port de Matadi', city: 'Matadi', province: 'Kongo-Central', commune: 'Matadi', quartier: 'Port', zipCode: '20001', lat: -5.8167, lon: 13.45 },
  { id: 'hub_kolwezi', name: 'Relais Distrib Kolwezi', address: 'Avenue de la Mine', city: 'Kolwezi', province: 'Lualaba', commune: 'Dilala', quartier: 'Dilala', zipCode: '31001', lat: -10.7167, lon: 25.4667 }
];

const localTranslations: Record<string, Record<string, string>> = {
  fr: {
    backToCart: "Retour au panier",
    deliveryMode: "Mode de livraison en RDC",
    homeDelivery: "Livraison à domicile",
    gpsCalculated: "Frais calculés via GPS",
    pickupRelay: "Retrait Point Relais",
    freeLogistics: "Coût logistique : 0 $",
    nearestRelays: "Points de retrait les plus proches (RDC)",
    sortedByDistance: "Triés par distance",
    closest: "Plus proche",
    recalculatedGps: "Les distances sont recalculées en temps réel selon la méthode de re-calcul GPS (Hub de Kananga, Kinshasa, Lubumbashi...). Cliquez sur un relais pour l'affecter.",
    rdcProvince: "Province de la RDC",
    provinceListDesc: "sélectionnez l'une des 26 provinces",
    town: "Ville / Chef-lieu",
    zipCode: "Code Postal ou ID Zone",
    commune: "Commune / Territoire",
    quartier: "Quartier / Avenue",
    landmark: "Localité / Point de repère",
    landmarkPlaceholder: "Optionnel (Ex: Près de l'église, Marché...)",
    streetAddress: "Adresse physique (Numéro / Rue)",
    previous: "Précédent",
    continueSummary: "Continuer vers le récapitulatif",
    confirmPay: "Confirmer et payer",
    finalizePayment: "Finaliser le paiement de",
    summary: "Récapitulatif",
    subtotal: "Sous-total",
    delivery: "Livraison",
    free: "Gratuite",
    total: "Total",
    paymentRequiredCdf: "Paiement requis en CDF",
    currencyNotice: "* La monnaie de paiement acceptée sur Eladma est le Franc Congolais (CDF). Votre montant est converti automatiquement.",
    paymentSecure: "Paiement Sécurisé",
    momoOperatorTitle: "Opérateur Mobile de confiance",
    rdcPhoneNumber: "Numéro de Téléphone RDC",
    momoPhoneDesc: "Saisissez votre numéro actif lié à votre compte Mobile Money pour la transaction de secours.",
    momoProtectionTitle: "Protection USSD Eladma Security",
    momoProtectionDesc: "Une simulation interactive sécurisée d'accord Pin USSD de virement s'affichera au déclenchement. Aucune carte bancaire requise.",
    creditCardTitle: "Paiement par Carte de Crédit",
    cardNumber: "Numéro de Carte",
    validity: "Validité",
    cvv: "CVV",
    encryptionNotice: "Vos informations sont chiffrées et sécurisées par Eladma Pay.",
    emptyCartTitle: "Votre panier est vide",
    backShopping: "Retour aux achats",
    processingOrder: "Traitement de votre commande...",
    backToShop: "Retourner à la boutique",
    directHubDelivery: "Livraison Hub Direct Eladma",
    directHubDesc: "Votre commande sera acheminée de manière sécurisée directement au relais.",
    freeLabel: "Gratuit",
    directHubDelay: "Délai de mise à disposition : 1 à 3 jours ouvrés.",
    shippedTo: "Expédié à",
    shippingMethod: "Méthode de livraison",
    items: "Articles",
    totalToPay: "Total à payer",
    conversionRequired: "Conversion requise en Franc Congolais (CDF)",
    verifyNotice: "Veuillez vérifier vos informations avant de passer au paiement sécurisé.",
    ussdActiveService: "Service USSD Actif",
    ussdPinTitle: "Paiement Mobile RDC",
    ussdPinConfirmDesc: "Confirmez le transfert de",
    ussdPinConvertDesc: "(Montant original de {amount} converti en Francs Congolais en raison de l'acceptation exclusive du CDF sur Eladma)",
    ussdPinInputText: "Saisissez votre PIN",
    secWarning: "⚠️ Sécurité : Caractères interdits ou scripts malveillants interceptés dans le formulaire.",
    secEmailFormat: "⚠️ Sécurité : Format d'adresse e-mail invalide.",
    secRateWarning: "Trop de tentatives. Veuillez patienter.",
    successTitleOrder: "Commande réussie !",
    successDescOrder: "Commande enregistrée. Points de récompense ajoutés !",
    deliveryHomeDesc: "Frais calculés via GPS",
    deliveryPickupDesc: "Frais logistiques offerts",
    recalculatedHint: "Calculé pour %km km du distributeur",
  },
  en: {
    backToCart: "Back to cart",
    deliveryMode: "Delivery Mode in DRC",
    homeDelivery: "Home Delivery",
    gpsCalculated: "Fees calculated via GPS",
    pickupRelay: "Pickup Relay",
    freeLogistics: "Logistics cost: 0 $",
    nearestRelays: "Nearest Pick-up Points (DRC)",
    sortedByDistance: "Sorted by distance",
    closest: "Closest",
    recalculatedGps: "Distances are recalculated in real time based on GPS calculation (Kananga Hub, Kinshasa, Lubumbashi...). Click on a relay to assign it.",
    rdcProvince: "Province of DRC",
    provinceListDesc: "select one of the 26 provinces",
    town: "City / Town",
    zipCode: "Zip Code or Zone ID",
    commune: "Commune / Territory",
    quartier: "Quartier / Avenue",
    landmark: "Location / Landmark",
    landmarkPlaceholder: "Optional (e.g. Near church, Market...)",
    streetAddress: "Physical Address (Number / Street)",
    previous: "Previous",
    continueSummary: "Continue to summary",
    confirmPay: "Confirm and pay",
    finalizePayment: "Finalize payment of",
    summary: "Summary",
    subtotal: "Subtotal",
    delivery: "Delivery",
    free: "Free",
    total: "Total",
    paymentRequiredCdf: "Payment required in CDF",
    currencyNotice: "* The accepted payment currency on Eladma is the Congolese Franc (CDF). Your amount is converted automatically.",
    paymentSecure: "Secure Payment",
    momoOperatorTitle: "Trusted Mobile Operator",
    rdcPhoneNumber: "DRC Phone Number",
    momoPhoneDesc: "Enter your active number linked to your Mobile Money account for the backup transaction.",
    momoProtectionTitle: "USSD Protection Eladma Security",
    momoProtectionDesc: "A secure interactive simulation of USSD transfer agreement PIN will be displayed when triggered. No bank card required.",
    creditCardTitle: "Payment by Credit Card",
    cardNumber: "Card Number",
    validity: "Validity",
    cvv: "CVV",
    encryptionNotice: "Your details are encrypted and secured by Eladma Pay.",
    emptyCartTitle: "Your cart is empty",
    backShopping: "Back to shopping",
    processingOrder: "Processing your order...",
    backToShop: "Back to shop",
    directHubDelivery: "Eladma Direct Hub Delivery",
    directHubDesc: "Your order will be securely routed directly to the relay.",
    freeLabel: "Free",
    directHubDelay: "Availability time: 1 to 3 business days.",
    shippedTo: "Shipped to",
    shippingMethod: "Shipping Method",
    items: "Items",
    totalToPay: "Total to pay",
    conversionRequired: "Required conversion in Congolese Franc (CDF)",
    verifyNotice: "Please verify your information before proceeding to secure payment.",
    ussdActiveService: "Active USSD Service",
    ussdPinTitle: "RDC Mobile Payment",
    ussdPinConfirmDesc: "Confirm transfer of",
    ussdPinConvertDesc: "(Original amount of {amount} converted to Congolese Francs due to exclusive acceptance of CDF on Eladma)",
    ussdPinInputText: "Enter your PIN",
    secWarning: "⚠️ Security: Forbidden characters or malicious scripts intercepted in the form.",
    secEmailFormat: "⚠️ Security: Invalid email address format.",
    secRateWarning: "Too many attempts. Please wait.",
    successTitleOrder: "Order successful!",
    successDescOrder: "Order saved successfully. Reward points added!",
    deliveryHomeDesc: "Fees calculated via GPS",
    deliveryPickupDesc: "Free logistics",
    recalculatedHint: "Calculated for %km km from distributor",
  },
  ln: {
    backToCart: "Zonga na likanza",
    deliveryMode: "Ndenge ya kozwa biloko na RDC",
    homeDelivery: "Koya na ndaku ndako",
    gpsCalculated: "Talo na kotala GPS",
    pickupRelay: "Kozwela na Point Relais",
    freeLogistics: "Talo ya motamboli : 0 $",
    nearestRelays: "Mabesé ya kozwela penepene (RDC)",
    sortedByDistance: "Na molongo ya penepene",
    closest: "Penepene koleka",
    recalculatedGps: "Bokaboli eponami lisusu na mbala moko na nsinga ya GPS (Kananga, Kinshasa, Lubumbashi...). Finá mabelé moko mpo na kopona.",
    rdcProvince: "Etuka ya Congo (RDC)",
    provinceListDesc: "poná etuka moko na nkama mibale na motoba",
    town: "Mboka-mokonzi / Etuka",
    zipCode: "Kod mpo ya posita to ID Zone",
    commune: "Komini / Teritware",
    quartier: "Karié / Avenue",
    landmark: "Esika to Elembo ya ndako",
    landmarkPlaceholder: "Ofandeli mpembeni (Pene na ndako ya Nzambe, Wenzé...)",
    streetAddress: "Nimero mpe Nzela ofandi",
    previous: "Zonga sima",
    continueSummary: "Kende na kosukisa",
    confirmPay: "Ndimisa mpe futá",
    finalizePayment: "Silisa bofuti ya",
    summary: "Kosukisa nyonso",
    subtotal: "Sous-total",
    delivery: "Motamboli",
    free: "Ofele",
    total: "Talo nyonso",
    paymentRequiredCdf: "Bofuti na Franc Congolais (CDF)",
    currencyNotice: "* Mbongo ya ndimo na Eladma eza Franc Congolais (CDF). Mbongo na yo ebongwani mbala moko.",
    paymentSecure: "Bofuti na bokengi",
    momoOperatorTitle: "Motandoli ya bokengi ya telefone",
    rdcPhoneNumber: "Nimero ya telefone RDC",
    momoPhoneDesc: "Komá nimero na yo ya telefone mpo ya bofuti ya Mobile Money.",
    momoProtectionTitle: "Bokengi ya kode USSD na Eladma",
    momoProtectionDesc: "Lisano ya bosembo ya kokoma PIN USSD ekoya mbala moko na ndambo ya bofuti. Karte ya banki esengeli te.",
    creditCardTitle: "Bofuti na Karte ya Banki",
    cardNumber: "Nimero ya Karte",
    validity: "Mikolo ya bokengi",
    cvv: "CVV",
    encryptionNotice: "Sango na yo ebombami malamu mpenza na Eladma Pay.",
    emptyCartTitle: "Likanza na yo eza pamba",
    backShopping: "Zonga kosomba biloko",
    processingOrder: "Azali boye kosala bosombi...",
    backToShop: "Zonga na wenzé",
    directHubDelivery: "Motindeli ya mbala moko ya Eladma",
    directHubDesc: "Bosombi na yo ekotindama na bokengi mpenza na Point Relais.",
    freeLabel: "Ofele",
    directHubDelay: "Ekozala mpo ya kozwa: mikolo 1 tii 3.",
    shippedTo: "Etindami epai ya",
    shippingMethod: "Ndenge ya komema",
    items: "Biloko",
    totalToPay: "Talo ya kofuta",
    conversionRequired: "Kobongola esengeli na Franc Congolais (CDF)",
    verifyNotice: "Meka kotala sango na yo malamu yambo otia motema na kofuta.",
    ussdActiveService: "Kode USSD ezali kosala",
    ussdPinTitle: "Bofuti na Telefone na RDC",
    ussdPinConfirmDesc: "Ndimisa kotinda mbongo ya",
    ussdPinConvertDesc: "(Talo ya yambo {amount} ebongwani na Franc Congolais mpo eladma emelaka kaka CDF)",
    ussdPinInputText: "Komá PIN na yo",
    secWarning: "⚠️ Bokengi : Makambo ekangami to biloko mabe emonani na formulaire.",
    secEmailFormat: "⚠️ Bokengi : Email eza malamu te.",
    secRateWarning: "Omezi mbala mingi. Zila moke.",
    successTitleOrder: "Bosombi elongi !",
    successDescOrder: "Bosombi ekomami malamu. Matabisi ebakisami !",
    deliveryHomeDesc: "Talo etangami na GPS",
    deliveryPickupDesc: "Mosala ya motamboli ofele",
    recalculatedHint: "Etangami mpo ya kilomẹtɛ %km",
  },
  sw: {
    backToCart: "Rudi kwenye kikapu",
    deliveryMode: "Njia ya Uwasilishaji katika RDC",
    homeDelivery: "Kufikishwa nyumbani",
    gpsCalculated: "Gharama zilizohesabiwa kupitia GPS",
    pickupRelay: "Kuchukulia Point Relais",
    freeLogistics: "Gharama ya usafirishaji : 0 $",
    nearestRelays: "Vituo vya karibu vya kuchukulia bidhaa (RDC)",
    sortedByDistance: "Kupangwa kwa umbali",
    closest: "Karibu zaidi",
    recalculatedGps: "Umbali unahesabiwa tena kwa wakati halisi kulingana na njia ya GPS (Kananga Hub, Kinshasa, Lubumbashi...). Bonyeza kwenye kituo ili kuchagua.",
    rdcProvince: "Mkoa wa RDC",
    provinceListDesc: "chagua mkoa mmoja kati ya 26",
    town: "Mji / Makao Maku",
    zipCode: "Nambari ya Posta au ID ya Eneo",
    commune: "Wilaya / Eneo",
    quartier: "Mtaa / Njia",
    landmark: "Mahali / Alama ya karibu",
    landmarkPlaceholder: "Hiari (Mfano: Karibu na canisa, Soko...)",
    streetAddress: "Anwani ya kawaida (Nambari / Barabara)",
    previous: "Rudi nyuma",
    continueSummary: "Endelea kwenye muhtasari",
    confirmPay: "Thibitisha na ulipe",
    finalizePayment: "Kumaliza malipo ya",
    summary: "Muhtasari",
    subtotal: "Nusu-jumla",
    delivery: "Usafirishaji",
    free: "Bure",
    total: "Jumla",
    paymentRequiredCdf: "Malipo yanahitajika kwa CDF",
    currencyNotice: "* Sarafu ya malipo inayokubalika kwenye Eladma ni Franc ya DRC (CDF). Kiasi chako kinabadilishwa kiotomatiki.",
    paymentSecure: "Malipo salama",
    momoOperatorTitle: "Mwendeshaji wa Mtandao wa simu wa kuaminika",
    rdcPhoneNumber: "Nambari ya Simu ya RDC",
    momoPhoneDesc: "Weka nambari yako inayofanya kazi inayohusishwa na akaunti yako ya Mobile Money kwa malipo ya dharura.",
    momoProtectionTitle: "Ulinzi wa USSD Eladma Security",
    momoProtectionDesc: "Uigaji salama shirikishi wa PIN ya makubaliano ya kuhamisha USSD utaonyeshwa ukianzishwa. Hakuna kadi ya benki inahitajika.",
    creditCardTitle: "Malipo kwa Kadi ya Mkopo",
    cardNumber: "Nambari ya Kadi",
    validity: "Muda wa Kazi",
    cvv: "CVV",
    encryptionNotice: "Maelezo yako yamesimbwa kwa njia fiche na kulindwa na Eladma Pay.",
    emptyCartTitle: "Kikapu chako kiko wazi",
    backShopping: "Rudi kwenye ununuzi",
    processingOrder: "Inashughulikia agizo lako...",
    backToShop: "Rudisha kwenye duka",
    directHubDelivery: "Uwasilishaji wa kituo cha moja kwa moja cha Eladma",
    directHubDesc: "Agizo lako litatumwa kwa usalama moja kwa moja kwenye kituo cha kuchukulia.",
    freeLabel: "Bure",
    directHubDelay: "Muda wa kupatikana: Siku 1 hadi 3 za kazi.",
    shippedTo: "Kutunukiwa kwa",
    shippingMethod: "Njia ya usafirishaji",
    items: "Bidhaa",
    totalToPay: "Jumla ya kulipa",
    conversionRequired: "Mabadilike ya lazima kwa Franc ya Kongo (CDF)",
    verifyNotice: "Tafadhali thibitisha maelezo yako kabla ya kuendelea na malipo salama.",
    ussdActiveService: "Huduma ya USSD Inafanya Kazi",
    ussdPinTitle: "Malipo ya Simu ya RDC",
    ussdPinConfirmDesc: "Thibitisha uhamisho wa",
    ussdPinConvertDesc: "(Kiasi cha asili cha {amount} kimebadilishwa kuwa Francs za Kongo kutokana na kukubali CDF pekee kwenye Eladma)",
    ussdPinInputText: "Weka PIN yako",
    secWarning: "⚠️ Usalama: Herufi zilizopigwa marufuku au hati hasidi zimezuiliwa kwenye fomu.",
    secEmailFormat: "⚠️ Usalama: Anwani ya barua pepe isiyo sahihi.",
    secRateWarning: "Majaribio mengi sana. Tafadhali subiri.",
    successTitleOrder: "Agizo limefanikiwa!",
    successDescOrder: "Agizo limehifadhiwa vizuri. Pointi za zawadi zimeongezwa!",
    deliveryHomeDesc: "Gharama zilizohesabiwa kupitia GPS",
    deliveryPickupDesc: "Gharama za usafirishaji za bure",
    recalculatedHint: "Imehesabiwa kwa km %km kutoka kwa mtoaji",
  }
};

export const Checkout: React.FC<CheckoutProps> = ({ cart, onBack, onClearCart, onOrderSuccess }) => {
  const { t, language } = useLanguage();
  const lt = localTranslations[language] || localTranslations['fr'];
  const { formatPrice, currency, exchangeRates } = useCurrency();
  const [step, setStep] = useState(1);
  const [notifyChat, setNotifyChat] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: 'Kananga',
    zipCode: '86001',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [selectedProvince, setSelectedProvince] = useState('Kasaï-Central');
  const [commune, setCommune] = useState('');
  const [quartier, setQuartier] = useState('');
  const [localite, setLocalite] = useState('');

  // Geolocation Coordinates & Pickup points state
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number}>({ lat: -5.8958, lon: 22.4167 });
  const [deliveryType, setDeliveryType] = useState<'home' | 'pickup'>('home');
  const [selectedPickupPointId, setSelectedPickupPointId] = useState<string>('hub_kananga_central');

  const handleProvinceChange = (provinceName: string) => {
    setSelectedProvince(provinceName);
    const foundProv = RDC_PROVINCES.find(p => p.name === provinceName);
    if (foundProv) {
      setUserCoords({ lat: foundProv.lat, lon: foundProv.lon });
      const d = calculateDistanceInKm(foundProv.lat, foundProv.lon);
      setDistance(Math.round(d) || 12); // Fallback minimum distance
      setDetectedZone(`Province du ${foundProv.name} (${foundProv.tag || 'Relais RDC'})`);
      setDistanceState('success');
      setFormData(prev => ({
        ...prev,
        city: foundProv.chefLieu,
        zipCode: getProvinceZip(provinceName)
      }));
    }
  };

  const handleSelectPickupPoint = (pointId: string) => {
    setSelectedPickupPointId(pointId);
    const point = ELADMA_PICKUP_POINTS.find(p => p.id === pointId);
    if (point) {
      setSelectedProvince(point.province);
      setCommune(point.commune);
      setQuartier(point.quartier);
      setLocalite("Point de Retrait Officiel Eladma Hub");
      setFormData(prev => ({
        ...prev,
        city: point.city,
        zipCode: point.zipCode,
        address: point.address
      }));
      toast.success(`Point de retrait sélectionné : ${point.name} (${point.city}). L'adresse du relais a été configurée.`);
    }
  };

  const handleDeliveryTypeChange = (type: 'home' | 'pickup') => {
    setDeliveryType(type);
    if (type === 'pickup') {
      const point = ELADMA_PICKUP_POINTS.find(p => p.id === selectedPickupPointId) || ELADMA_PICKUP_POINTS[0];
      handleSelectPickupPoint(point.id);
    } else {
      const foundProv = RDC_PROVINCES.find(p => p.name === selectedProvince) || RDC_PROVINCES[0];
      setCommune('');
      setQuartier('');
      setLocalite('');
      setFormData(prev => ({
        ...prev,
        city: foundProv.chefLieu,
        zipCode: getProvinceZip(foundProv.name),
        address: ''
      }));
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('momo');
  const [momoOperator, setMomoOperator] = useState<'mpesa' | 'orange' | 'airtel'>('mpesa');
  const [momoPhone, setMomoPhone] = useState('');
  const [isUssdOpen, setIsUssdOpen] = useState(false);
  const [ussdPin, setUssdPin] = useState('');

  const [distance, setDistance] = useState<number>(35); // Default estimated distance in km
  const [distanceState, setDistanceState] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [detectedZone, setDetectedZone] = useState<string>('Estimation standard du Hub Kananga');
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('kasai_trans');

  const selectedCarrier = PARTNERS.find(p => p.id === selectedCarrierId) || PARTNERS[0];

  // Recalculate and sort pickup points based on current userCoords
  const sortedPickupPoints = ELADMA_PICKUP_POINTS.map(point => {
    const d = calculateDistanceBetweenCoordinates(
      userCoords.lat,
      userCoords.lon,
      point.lat,
      point.lon
    );
    return { ...point, distanceToUser: Math.round(d) };
  }).sort((a, b) => a.distanceToUser - b.distanceToUser);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = deliveryType === 'pickup'
    ? 0.0 // Standard free handling at Eladma Hub pick points
    : selectedCarrier.basePrice + (distance * selectedCarrier.pricePerKm);
  const total = subtotal + shipping;

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas prise en charge par votre navigateur.");
      return;
    }
    setDistanceState('detecting');
    toast.info("Demande d'autorisation GPS en cours pour cibler le centre logistique le plus proche...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lon: longitude });
        const d = calculateDistanceInKm(latitude, longitude);
        
        let calculatedDist = Math.round(d);
        let zone = "Zone Kasaï Centrale (Local)";
        let city = "Kananga";
        let zipCode = "86001";
        let address = "Avenue Laurent Désiré Kabila";

        if (d > 1000) {
          calculatedDist = Math.round(d / 12); 
          zone = "Lien Direct de Fret National (Kinshasa Hub)";
          city = "Kinshasa";
          zipCode = "10001";
          address = "Avenue de l'Equateur, Gombe";
        } else {
          if (d < 15) {
            zone = "Kananga Hub Principal (Livraison Ultra-Locale)";
            city = "Kananga";
            zipCode = "86010";
            address = "Quartier Katoka, Rue des Artisans";
          } else if (d < 100) {
            zone = "Zone périphérique de Demba / Kasaï-Occidental";
            city = "Demba";
            zipCode = "86025";
            address = "Route Nationale 1 Est";
          }
        }

        setDistance(calculatedDist);
        setDetectedZone(zone);
        setDistanceState('success');
        setFormData(prev => ({
          ...prev,
          city: city,
          zipCode: zipCode,
          address: address
        }));
        toast.success(`Position localisée ! Distributeur trouvé à ${calculatedDist} km (${zone}).`);
      },
      (error) => {
        console.error(error);
        // Sane fallback simulation using Kananga coordinates
        setTimeout(() => {
          const fakeDist = 18;
          setUserCoords({ lat: -5.8958, lon: 22.4167 });
          setDistance(fakeDist);
          setDetectedZone("Kananga Centre (Simulation GPS Connectée)");
          setDistanceState('success');
          setFormData(prev => ({
            ...prev,
            city: "Kananga",
            zipCode: "86012",
            address: "Avenue de la Paix, Quartier Nganza"
          }));
          toast.success("Simulation GPS de secours : Position calculée au Centre de Tri à 18 km.");
        }, 1500);
      },
      { timeout: 8000 }
    );
  };

  const executeFinalOrder = () => {
    const sanitizedCardName = EladmaSecurity.sanitizeInput(formData.name);
    const finalAddress = `${formData.address}${quartier ? `, Q. ${quartier}` : ''}${commune ? `, C. ${commune}` : ''}${localite ? `, Localité ${localite}` : ''}, ${formData.city}, Province de ${selectedProvince}, RDC`;

    // Create real order in manager
    const newOrder = orderManager.createOrder({
      customerId: 'guest_user',
      customerName: sanitizedCardName || formData.name,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: total,
      status: 'pending',
      shippingAddress: finalAddress
    });

    // Google Chat Order Notification dispatch logic
    if (notifyChat) {
      const chatToken = getGoogleAccessToken();
      if (chatToken) {
        (async () => {
          try {
            const { fetchSpaces, sendChatMessage } = await import('../services/googleChat');
            const spaces = await fetchSpaces();
            if (spaces && spaces.length > 0) {
              const targetSpace = spaces.find(s => s.displayName.toLowerCase().includes('eladma')) || spaces[0];
              const itemsText = cart.map(item => `   • ${item.name} (x${item.quantity})`).join('\n');
              const finalCostText = currency === 'USD' ? `$${total.toFixed(2)}` : `${(total * 2850).toLocaleString()} FC`;

              const notificationText = `🛍️ **Nouvelle commande sur Eladma RDC !**\n\n` +
                `🔔 **Commande :** #${newOrder.id}\n` +
                `👤 **Client :** ${formData.name}\n` +
                `📍 **Livraison :** ${finalAddress}\n\n` +
                `🛒 **Articles de la commande :**\n${itemsText}\n\n` +
                `💰 **Montant total :** **${finalCostText}**\n` +
                `🚚 **Statut :** En attente de livraison (${selectedProvince})`;

              await sendChatMessage(targetSpace.name, notificationText);
              toast.success('Notification de commande envoyée à votre salon Google Chat !');
            }
          } catch (chatErr: any) {
            console.error('Failed to notify Google Chat:', chatErr);
          }
        })();
      }
    }

    // Simulate order processing
    const loadingToast = toast.loading('Traitement de votre commande...');
    setTimeout(() => {
      toast.dismiss(loadingToast);
      haptics.success();
      sounds.success();
      onOrderSuccess(newOrder.id);
    }, 2000);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-abuse rate limit check to prevent automated checkout loops
    if (!EladmaSecurity.checkRateLimit('checkout_navigation', 10, 60000)) {
      return;
    }

    if (step === 1) {
      // 2. Real-time suspicious behavior checks for SQL injection & Cross-Site Scripting (XSS)
      if (!EladmaSecurity.checkSuspiciousBehavior(formData.name, "Nom complet") ||
          !EladmaSecurity.checkSuspiciousBehavior(formData.email, "E-mail") ||
          !EladmaSecurity.checkSuspiciousBehavior(formData.address, "Adresse de livraison") ||
          !EladmaSecurity.checkSuspiciousBehavior(formData.city, "Ville") ||
          !EladmaSecurity.checkSuspiciousBehavior(formData.zipCode, "Code postal")) {
        return; // Malicious input blocked and logged as a threat in real-time
      }

      // 3. Strict sanitization of client address and name elements (prevents injection/XSS payloads)
      const sanitizedName = EladmaSecurity.sanitizeInput(formData.name);
      const sanitizedEmail = EladmaSecurity.sanitizeInput(formData.email).trim().toLowerCase();
      const sanitizedAddress = EladmaSecurity.sanitizeInput(formData.address);
      const sanitizedCity = EladmaSecurity.sanitizeInput(formData.city);
      const sanitizedZip = EladmaSecurity.sanitizeInput(formData.zipCode);

      if (!sanitizedName || !sanitizedEmail || !sanitizedAddress || !sanitizedCity || !sanitizedZip) {
        toast.error("⚠️ Sécurité : Caractères interdits ou scripts malveillants interceptés dans le formulaire.");
        return;
      }

      if (!EladmaSecurity.isValidEmail(sanitizedEmail)) {
        toast.error("⚠️ Sécurité : Format d'adresse e-mail invalide.");
        return;
      }

      // Update state with clean sanitized values
      setFormData(prev => ({
        ...prev,
        name: sanitizedName,
        email: sanitizedEmail,
        address: sanitizedAddress,
        city: sanitizedCity,
        zipCode: sanitizedZip
      }));
    }

    if (step < 3) {
      haptics.light();
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (paymentMethod === 'card') {
        // 4. Secure Payment Validation: verify card info fields in real-time with Eladma PaymentGuard
        const formEl = e.currentTarget as HTMLFormElement;
        const htmlFormData = new FormData(formEl);
        const cardNum = htmlFormData.get('cardNumber') as string || '';
        const cardExp = htmlFormData.get('cardExpiry') as string || '';
        const cardCvc = htmlFormData.get('cardCvc') as string || '';
        const cardHolder = formData.name;

        if (!EladmaSecurity.PaymentGuard.validatePaymentInputs(cardNum, cardExp, cardCvc, cardHolder)) {
          haptics.error();
          return; // Suspicious pattern, malformed card details, or flooding attempt blocked!
        }

        // 5. Limit rapid final orders (max 2 per minute from the same UI instance)
        if (!EladmaSecurity.checkRateLimit('place_final_order', 2, 60000)) {
          haptics.warning();
          return;
        }

        executeFinalOrder();
      } else {
        // Mobile money flow
        if (!momoPhone || momoPhone.length < 8) {
          haptics.error();
          sounds.error();
          toast.error("Veuillez saisir un numéro de téléphone Mobile Money valide.");
          return;
        }

        // 5. Limit rapid final orders
        if (!EladmaSecurity.checkRateLimit('place_final_order', 2, 60000)) {
          haptics.warning();
          return;
        }

        // Open the USSD PIN simulation overlay
        haptics.medium();
        sounds.warning();
        setIsUssdOpen(true);
      }
    }
  };

  if (cart.length === 0 && step !== 4) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Truck className="w-10 h-10 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white mb-4">{lt.emptyCartTitle}</h2>
        <button 
          onClick={onBack}
          className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-dark transition-all"
        >
          {lt.backShopping}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-brand mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {lt.backToCart}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-brand' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
          </div>

          <form onSubmit={handleNext} className="space-y-8">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold">1</div>
                    <h2 className="text-xl font-bold dark:text-white">{t.deliveryInfo}</h2>
                  </div>
                  
                  <button
                    type="button"
                    onClick={locateUser}
                    disabled={distanceState === 'detecting'}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-brand-dark dark:text-brand rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm"
                  >
                    {distanceState === 'detecting' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>{t.geoLocate}</span>
                  </button>
                </div>

                {distanceState === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-brand/10 border border-brand/20 dark:border-brand/30 rounded-xl flex items-start gap-2 text-xs text-brand-dark dark:text-brand"
                  >
                    <Compass className="w-4 h-4 mt-0.5 shrink-0 animate-pulse text-brand" />
                    <div>
                      <p className="font-bold">{t.geoActive} : {detectedZone}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Distance : <strong className="text-brand">{distance} km</strong>. {t.dynamicShipping}.
                      </p>
                    </div>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t.firstName} & {t.lastName}</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                    <input 
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                    />
                  </div>
                </div>

                {/* Delivery Type Selector */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-wider block">{lt.deliveryMode}</label>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-100 dark:bg-zinc-800/60 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50">
                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange('home')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                        deliveryType === 'home'
                          ? 'bg-white dark:bg-zinc-800 text-brand shadow-md border border-zinc-200/10'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Truck className="w-4 h-4 shrink-0" />
                      <div className="text-center sm:text-left">
                        <span className="block text-xs font-bold">{lt.homeDelivery}</span>
                        <span className="block text-[9px] font-normal opacity-70">{lt.gpsCalculated}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeliveryTypeChange('pickup')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                        deliveryType === 'pickup'
                          ? 'bg-white dark:bg-zinc-800 text-brand shadow-md border border-zinc-200/10'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      <div className="text-center sm:text-left">
                        <span className="block text-xs font-bold font-semibold">{lt.pickupRelay}</span>
                        <span className="block text-[9px] font-normal text-brand opacity-90">{lt.freeLogistics}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Nearest Pickup Points Display */}
                {deliveryType === 'pickup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand animate-bounce" />
                        <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{lt.nearestRelays}</h3>
                      </div>
                      <span className="text-[10px] bg-brand/10 border border-brand/25 text-brand font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {lt.sortedByDistance}
                      </span>
                    </div>
 
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       {sortedPickupPoints.slice(0, 3).map((point, index) => {
                         const isSelected = selectedPickupPointId === point.id;
                         return (
                           <div
                             key={point.id}
                             onClick={() => handleSelectPickupPoint(point.id)}
                             className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-full relative ${
                               isSelected
                                 ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm'
                                 : 'border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                             }`}
                           >
                             {index === 0 && (
                               <div className="absolute -top-2.5 -right-2 bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                 {lt.closest}
                               </div>
                             )}
                             <div>
                               <div className="flex items-center gap-1.5 mb-1.5">
                                 <span className="text-[10px] font-bold text-zinc-450 font-mono">#{index + 1}</span>
                                 <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 line-clamp-1">{point.name}</h4>
                               </div>
                               <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                                 {point.address}, {point.city}
                               </p>
                             </div>
                             <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-auto flex items-center justify-between">
                               <span className="text-[10px] font-black text-brand bg-brand/5 px-2 py-0.5 rounded-md font-mono shrink-0">
                                 {point.distanceToUser} km
                               </span>
                               <span className="text-[9px] text-zinc-400 uppercase font-semibold">
                                 {point.city}
                               </span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
 
                     <div className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-brand/5 dark:bg-brand/10 border border-brand/5 p-2.5 rounded-xl leading-relaxed flex items-center gap-2">
                       <Compass className="w-3.5 h-3.5 text-brand shrink-0" />
                       <span>
                         {lt.recalculatedGps}
                       </span>
                     </div>
                   </motion.div>
                 )}
 
                 {/* RDC Province Selector */}
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide flex justify-between">
                     <span>{lt.rdcProvince}</span>
                     <span className="text-[10px] text-brand lowercase font-normal">{lt.provinceListDesc}</span>
                   </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white font-medium"
                  >
                    {RDC_PROVINCES.map((prov) => (
                      <option key={prov.name} value={prov.name} className="dark:bg-zinc-950 dark:text-white">
                        {prov.name} {prov.tag ? `(${prov.tag})` : ''} — Chef-lieu: {prov.chefLieu}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{lt.town}</label>
                    <input 
                      type="text" required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                      placeholder="Ex: Kananga, Kinshasa, Lubumbashi..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{lt.zipCode}</label>
                    <input 
                      type="text" required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                      placeholder="Ex: 86001, 10001..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{lt.commune}</label>
                    <input 
                      type="text" required
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                      placeholder="Ex: Katoka, Gombe, Golf..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{lt.quartier}</label>
                    <input 
                      type="text" required
                      value={quartier}
                      onChange={(e) => setQuartier(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                      placeholder="Ex: Ngaza, Macampagne..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{lt.landmark}</label>
                    <input 
                      type="text"
                      value={localite}
                      onChange={(e) => setLocalite(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white font-medium placeholder:font-normal"
                      placeholder={lt.landmarkPlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">{lt.streetAddress}</label>
                  <input 
                    type="text" required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white"
                    placeholder="Ex: 24, Avenue Laurent Désiré Kabila..."
                  />
                </div>

                 {/* Dynamic Carrier Section */}
                 <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                   {deliveryType === 'pickup' ? (
                     <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/55 dark:border-emerald-900/40 p-4 rounded-xl flex items-start gap-3">
                       <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                         <MapPin className="w-5 h-5 animate-pulse" />
                       </div>
                       <div>
                         <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-450 flex items-center gap-2">
                           <span>{lt.directHubDelivery}</span>
                           <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{lt.freeLabel}</span>
                         </h4>
                         <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                           {lt.directHubDesc} <strong>{ELADMA_PICKUP_POINTS.find(p => p.id === selectedPickupPointId)?.name}</strong>.
                         </p>
                         <p className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-1.5 font-semibold">
                           {lt.directHubDelay}
                         </p>
                       </div>
                     </div>
                   ) : (
                     <>
                       <div className="flex items-center gap-2 mb-3">
                         <Truck className="w-4 h-4 text-brand" />
                         <h3 className="text-sm font-bold dark:text-zinc-200">{t.selectCarrier}</h3>
                       </div>

                       <div className="space-y-3">
                         {PARTNERS.map((carrier) => {
                           const CostIcon = carrier.icon;
                           const carrierCost = carrier.basePrice + (distance * carrier.pricePerKm);
                           const isSelected = selectedCarrierId === carrier.id;

                           const carrierDescs: Record<string, Record<string, string>> = {
                             fr: {
                               kasai_trans: 'Routier sécurisé Kasaïen de proximité',
                               eladma_express: 'Fret aérien prioritaire provincial & national',
                               congo_fluvial: 'Transport fluvial écologique et cargo routier',
                             },
                             en: {
                               kasai_trans: 'Secure regional road transport in Kasaï',
                               eladma_express: 'Priority provincial & national air cargo',
                               congo_fluvial: 'Eco-friendly river & road cargo transport',
                             },
                             ln: {
                               kasai_trans: 'Nzela ya motuka ya bokengi na Kasaï',
                               eladma_express: 'Mpepo ya makasi ya bituka',
                               congo_fluvial: 'Bwato ya tshuapa na mituka ya mabelé',
                             },
                             sw: {
                               kasai_trans: 'Usafirishaji salama wa barabara Kasaï',
                               eladma_express: 'Mizigo ya anga ya kipaumbele mkoani na kitaifa',
                               congo_fluvial: 'Usafirishaji wa mto wa ikolojia na barabara',
                             }
                           };

                           const localizedDescription = carrierDescs[language]?.[carrier.id] || carrier.description;
                           const delayLabel = {
                             fr: 'Délai',
                             en: 'Est. Delivery',
                             ln: 'Sango ya mikolo',
                             sw: 'Muda'
                           }[language] || 'Délai';

                           const basedOnDistanceLabel = {
                             fr: 'jours • Basé sur distance de',
                             en: 'days • Based on distance of',
                             ln: 'mikolo • Na kotala kilomẹtɛ',
                             sw: 'siku • Kulingana na umbali wa'
                           }[language] || 'jours • Basé sur';

                           const estCostLabel = {
                             fr: 'Coût estimé',
                             en: 'Est. Cost',
                             ln: 'Talo emani',
                             sw: 'Gharama'
                           }[language] || 'Coût estimé';

                           return (
                             <div
                               key={carrier.id}
                               onClick={() => setSelectedCarrierId(carrier.id)}
                               className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                 isSelected
                                   ? 'border-brand bg-brand/5 dark:bg-brand/10'
                                   : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'
                               }`}
                             >
                               <div className="flex items-center gap-3">
                                 <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                   <CostIcon className="w-5 h-5" />
                                 </div>
                                 <div>
                                   <p className="text-sm font-bold dark:text-white">{carrier.name}</p>
                                   <p className="text-[11px] text-zinc-500 line-clamp-1">{localizedDescription}</p>
                                   <p className="text-[10px] text-brand font-semibold mt-0.5">
                                     {delayLabel} : {carrier.minDays}-{carrier.maxDays} {basedOnDistanceLabel} {distance} km
                                   </p>
                                 </div>
                               </div>
                               
                               <div className="text-right pl-3">
                                 <span className="text-sm font-black text-brand">{formatPrice(carrierCost)}</span>
                                 <div className="text-[9px] text-zinc-400">{estCostLabel}</div>
                                </div>
                              </div>
                           );
                         })}
                       </div>
                     </>
                   )}
                 </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold">2</div>
                  <h2 className="text-xl font-bold dark:text-white">{t.orderSummary}</h2>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{lt.shippedTo}</h4>
                      <p className="font-bold dark:text-white">{formData.name}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                        {lt.streetAddress} : {formData.address}<br />
                        {quartier && <span>{lt.quartier} : Q. {quartier}</span>} {commune && <span> • {lt.commune} : C. {commune}</span>}<br />
                        {localite && <span>{lt.landmark} : {localite} </span>} {formData.zipCode && <span> • B.P : {formData.zipCode}</span>}<br />
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{lt.town} : {formData.city} • {lt.rdcProvince} : {selectedProvince} (RDC)</span>
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{formData.email}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{lt.shippingMethod}</h4>
                      {deliveryType === 'pickup' ? (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl items-start">
                          <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0 animate-pulse" />
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">{lt.pickupRelay}</p>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold mt-0.5">
                              {ELADMA_PICKUP_POINTS.find(p => p.id === selectedPickupPointId)?.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">{language === 'en' ? 'Free pickup' : language === 'ln' ? 'Zonga ofele' : language === 'sw' ? 'Kusanya bure' : 'Collecte libre & Gratuite'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-brand/5 dark:bg-brand/10 rounded-xl items-start">
                          {React.createElement(selectedCarrier.icon, { className: "w-5 h-5 text-brand mt-0.5 shrink-0" })}
                          <div>
                            <p className="text-sm font-bold dark:text-white">{selectedCarrier.name}</p>
                            <p className="text-xs text-brand font-semibold">{language === 'en' ? 'Est.' : language === 'ln' ? 'Sango' : language === 'sw' ? 'Muda' : 'Estimé'} : {selectedCarrier.minDays}-{selectedCarrier.maxDays} {language === 'en' ? 'days' : language === 'ln' ? 'mikolo' : language === 'sw' ? 'siku' : 'jours'}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{language === 'en' ? 'Calculated for' : language === 'ln' ? 'Mpo ya' : language === 'sw' ? 'Imehesabiwa kwa' : 'Calculé pour'} {distance} km {language === 'en' ? 'from hub' : language === 'ln' ? 'na hub' : language === 'sw' ? 'kutoka kituo' : 'du distributeur'} ({detectedZone})</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t dark:border-zinc-800">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">{lt.items}</h4>
                    <div className="space-y-4">
                      {cart.map((item) => {
                        const cacheKey = `${item.id}_${language}`;
                        const translatedName = translationCache[cacheKey]?.name || item.name;
                        return (
                          <div key={item.id} className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                              <img src={item.image} alt={translatedName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold dark:text-white line-clamp-1">{translatedName}</p>
                              <p className="text-xs text-zinc-500">{item.quantity} x {formatPrice(item.price)}</p>
                            </div>
                            <p className="text-sm font-bold dark:text-white">{formatPrice(item.quantity * item.price)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-6 border-t dark:border-zinc-800">
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold dark:text-white">{lt.totalToPay}</span>
                        <span className="text-xl font-bold text-brand">{formatPrice(total)}</span>
                      </div>
                      {currency !== 'CDF' && (
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-250/55 dark:border-zinc-700 text-xs font-semibold text-zinc-500">
                          <span>{lt.conversionRequired}</span>
                          <span className="text-sm font-black text-brand">
                            {`${Math.round(total * (exchangeRates.eurToCdf || 3100)).toLocaleString('fr-FR')} FC`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    {lt.verifyNotice}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold">3</div>
                  <h2 className="text-xl font-bold dark:text-white">{lt.paymentSecure}</h2>
                </div>

                {/* Payment method selector */}
                <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { haptics.light(); sounds.click(); setPaymentMethod('momo'); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'momo'
                        ? 'bg-white dark:bg-zinc-800 text-brand shadow-md border border-zinc-200/20'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Mobile Money (RDC)
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptics.light(); sounds.click(); setPaymentMethod('card'); }}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'card'
                        ? 'bg-white dark:bg-zinc-800 text-brand shadow-md border border-zinc-200/20'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {language === 'en' ? 'Credit Card' : language === 'ln' ? 'Kati ya mbongo' : language === 'sw' ? 'Kadi ya benki' : 'Carte Bancaire'}
                  </button>
                </div>

                {paymentMethod === 'momo' ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-3">{lt.momoOperatorTitle}</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => { haptics.light(); sounds.select(); setMomoOperator('mpesa'); }}
                          className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                            momoOperator === 'mpesa'
                              ? 'border-red-500 bg-red-500/5 text-red-600 dark:text-red-400'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span>M-Pesa RDC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { haptics.light(); sounds.select(); setMomoOperator('orange'); }}
                          className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                            momoOperator === 'orange'
                              ? 'border-orange-500 bg-orange-500/5 text-orange-600 dark:text-orange-400'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          <span>Orange Money</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { haptics.light(); sounds.select(); setMomoOperator('airtel'); }}
                          className={`p-3 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                            momoOperator === 'airtel'
                              ? 'border-rose-600 bg-rose-600/5 text-rose-600 dark:text-rose-400'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                          <span>Airtel Money</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">{lt.rdcPhoneNumber}</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="tel" 
                          placeholder="082 345 6789 ou +243..." 
                          required={paymentMethod === 'momo'}
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-zinc-400 text-sm font-medium"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        {lt.momoPhoneDesc}
                      </p>
                    </div>

                    <div className="p-3 bg-brand/5 dark:bg-brand/10 border border-brand/10 rounded-xl flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        <strong>{lt.momoProtectionTitle}</strong> : {lt.momoProtectionDesc}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 text-brand mb-2">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-bold text-sm">{lt.creditCardTitle}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase">{lt.cardNumber}</label>
                      <input 
                        type="text" placeholder="0000 0000 0000 0000" required={paymentMethod === 'card'} name="cardNumber"
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-zinc-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">{lt.validity}</label>
                        <input 
                          type="text" placeholder="MM/YY" required={paymentMethod === 'card'} name="cardExpiry"
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-zinc-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase">{lt.cvv}</label>
                        <input 
                          type="text" placeholder="000" required={paymentMethod === 'card'} name="cardCvc"
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand/20 dark:text-white placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {getGoogleAccessToken() && (
                  <label className="flex items-center gap-3 p-3.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={notifyChat} 
                      onChange={(e) => setNotifyChat(e.target.checked)}
                      className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-4 h-4 bg-white dark:bg-zinc-950" 
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-orange-800 dark:text-orange-400">🔔 Notifier via Google Chat</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Le résumé complet de votre commande sera automatiquement envoyé sur votre salon de discussion actif.</p>
                    </div>
                  </label>
                )}

                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-medium">{lt.encryptionNotice}</span>
                </div>
              </motion.div>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <button 
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-4 border-2 border-zinc-100 dark:border-zinc-800 dark:text-white rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-sm"
                >
                  {lt.previous}
                </button>
              )}
              <button 
                type="submit"
                className="flex-[2] py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 text-sm"
              >
                {step === 1 ? lt.continueSummary : step === 2 ? lt.confirmPay : `${lt.finalizePayment} ${currency === 'CDF' ? formatPrice(total) : `${Math.round(total * (exchangeRates.eurToCdf || 3100)).toLocaleString('fr-FR')} FC`}`}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl p-6 sticky top-24">
            <h3 className="font-bold dark:text-white mb-6">Récapitulatif</h3>
            
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-bold dark:text-zinc-100 line-clamp-1">{item.name}</p>
                    <p className="text-zinc-500">x{item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm dark:text-zinc-100">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t dark:border-zinc-800">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Livraison</span>
                <span>{shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold dark:text-white pt-2">
                <span>Total</span>
                <span className="text-brand">{formatPrice(total)}</span>
              </div>
              {currency !== 'CDF' && (
                <div className="mt-3 p-3 bg-brand/5 border border-brand/20 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-bold text-brand">
                    <span>Paiement requis en CDF</span>
                    <span>{`${Math.round(total * (exchangeRates.eurToCdf || 3100)).toLocaleString('fr-FR')} FC`}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    * La monnaie de paiement acceptée sur Eladma est le Franc Congolais (CDF). Votre montant est converti automatiquement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* USSD overlay PIN simulation */}
      {isUssdOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 text-zinc-100 font-mono shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse" />
            
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-green-500">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                <span>{lt.ussdActiveService}</span>
              </div>
              <span className="font-semibold">Dial: *111# / *150#</span>
            </div>

            <div className="text-center py-2 space-y-3">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-1 border border-green-500/20">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{lt.ussdPinTitle}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-[250px] mx-auto">
                {lt.ussdPinConfirmDesc} <strong className="text-brand font-black">{`${Math.round(total * (exchangeRates.eurToCdf || 3100)).toLocaleString('fr-FR')} FC`}</strong> à <span className="text-green-400 font-bold">ELADMA SARL</span> via <span className="uppercase text-white font-bold">{momoOperator}</span> :
              </p>
              {currency !== 'CDF' && (
                <p className="text-[10px] text-zinc-400 max-w-[250px] mx-auto opacity-80 italic mt-1 leading-normal">
                  {lt.ussdPinConvertDesc.replace('{amount}', formatPrice(total))}
                </p>
              )}
            </div>

            {/* Simulated PIN input screen indicator */}
            <div className="my-6 bg-black/50 border border-zinc-800 rounded-xl p-4 text-center">
              <span className="text-xs text-zinc-500 block mb-2 uppercase tracking-widest font-black">{lt.ussdPinInputText}</span>
              <div className="flex justify-center gap-3.5 my-1.5 h-6">
                {[0, 1, 2, 3].map((idx) => {
                  const hasDigit = ussdPin.length > idx;
                  return (
                    <div 
                      key={idx} 
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        hasDigit 
                          ? 'bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-500/30' 
                          : 'border-zinc-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Custom PIN Keypad */}
            <div className="grid grid-cols-3 gap-2.5 my-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (ussdPin.length < 4) {
                      haptics.light();
                      sounds.click();
                      setUssdPin(prev => prev + num);
                    }
                  }}
                  className="py-3 bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-95 transition-all text-white text-lg font-bold rounded-xl border border-zinc-700/10"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  haptics.warning();
                  sounds.warning();
                  setUssdPin('');
                }}
                className="py-3 bg-zinc-800/40 hover:bg-zinc-700/40 text-rose-500 text-xs font-black rounded-xl border border-zinc-700/10 transition-all uppercase"
              >
                Reset
              </button>
              <button
                key={0}
                type="button"
                onClick={() => {
                  if (ussdPin.length < 4) {
                    haptics.light();
                    sounds.click();
                    setUssdPin(prev => prev + '0');
                  }
                }}
                className="py-3 bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-95 transition-all text-white text-lg font-bold rounded-xl border border-zinc-700/10"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ussdPin.length > 0) {
                    haptics.light();
                    sounds.click();
                    setUssdPin(prev => prev.slice(0, -1));
                  }
                }}
                className="py-3 bg-zinc-800/40 hover:bg-zinc-700/40 text-amber-500 text-xs font-black rounded-xl border border-zinc-700/10 transition-all uppercase flex items-center justify-center whitespace-nowrap"
              >
                {language === 'en' ? 'Clear' : language === 'ln' ? 'Popolo' : language === 'sw' ? 'Futa' : 'Effacer'}
              </button>
            </div>

            {/* USSD Dialog Control buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60 mt-5">
              <button
                type="button"
                onClick={() => {
                  haptics.warning();
                  sounds.warning();
                  setIsUssdOpen(false);
                  setUssdPin('');
                }}
                className="py-3 bg-transparent border border-zinc-700 text-zinc-400 hover:text-white rounded-xl font-bold text-xs transition-colors"
              >
                {language === 'en' ? 'CANCEL' : language === 'ln' ? 'KOBOMA' : language === 'sw' ? 'GHAHIRI' : 'ANNULER'}
              </button>
              <button
                type="button"
                disabled={ussdPin.length < 4}
                onClick={() => {
                  if (ussdPin.length === 4) {
                    setIsUssdOpen(false);
                    setUssdPin('');
                    executeFinalOrder();
                  }
                }}
                className="py-3 bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-green-600/10 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {language === 'en' ? 'SEND PIN' : language === 'ln' ? 'TINDA PIN' : language === 'sw' ? 'TUMA PIN' : 'ENVOYER PIN'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
