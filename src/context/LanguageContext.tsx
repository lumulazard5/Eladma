import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'ln' | 'sw';

export interface Translations {
  appName: string;
  searchPlaceholder: string;
  online: string;
  offline: string;
  gifts: string;
  catalog: string;
  assistant: string;
  me: string;
  categories: string;
  allProducts: string;
  noProductsFound: string;
  resetFilters: string;
  cart: string;
  cartEmpty: string;
  total: string;
  checkout: string;
  buyNow: string;
  addToCart: string;
  sellerLabel: string;
  localCraft: string;
  certifiedSeller: string;
  geoLocate: string;
  geoActive: string;
  dynamicShipping: string;
  deliveryInfo: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  selectCarrier: string;
  nextStep: string;
  back: string;
  orderSummary: string;
  payment: string;
  paymentMethod: string;
  confirmOrder: string;
  successTitle: string;
  successDesc: string;
  backHome: string;
  footerMission: string;
  footerCustomer: string;
  footerSeller: string;
  freeDelivery: string;
}

const translations: Record<Language, Translations> = {
  fr: {
    appName: "Eladma",
    searchPlaceholder: "Rechercher sur Eladma...",
    online: "En ligne",
    offline: "Hors ligne",
    gifts: "Cadeaux",
    catalog: "Catalogue",
    assistant: "Assistant AI",
    me: "Moi",
    categories: "Catégories",
    allProducts: "Tous les produits",
    noProductsFound: "Aucun produit trouvé",
    resetFilters: "Réinitialiser les filtres",
    cart: "Votre Panier",
    cartEmpty: "Votre panier est vide.",
    total: "Total",
    checkout: "Passer à la caisse",
    buyNow: "Acheter",
    addToCart: "Ajouter au panier",
    sellerLabel: "Vendeur",
    localCraft: "Artisanat Kasaïen",
    certifiedSeller: "Vendeur Certifié",
    geoLocate: "Géolocaliser l'adresse",
    geoActive: "Centre logistique ciblé",
    dynamicShipping: "Frais de livraison dynamiques",
    deliveryInfo: "Informations de livraison",
    firstName: "Prénom",
    lastName: "Nom de famille",
    phone: "Téléphone",
    address: "Adresse complète",
    city: "Ville / Territoire",
    zipCode: "Code postal",
    selectCarrier: "Sélectionner un transporteur partenaire",
    nextStep: "Continuer",
    back: "Retour",
    orderSummary: "Récapitulatif de votre commande",
    payment: "Paiement Sécurisé",
    paymentMethod: "Mode de paiement",
    confirmOrder: "Confirmer la commande",
    successTitle: "Achat Réussi !",
    successDesc: "Félicitations ! Votre commande a été enregistrée avec succès par nos partenaires en RDC.",
    backHome: "Retourner à la boutique",
    footerMission: "Notre mission & vision rurale en RDC",
    footerCustomer: "Service Client local",
    footerSeller: "Vendre sur Eladma RDC",
    freeDelivery: "Livraison Gratuite"
  },
  en: {
    appName: "Eladma",
    searchPlaceholder: "Search on Eladma...",
    online: "Online",
    offline: "Offline",
    gifts: "Rewards",
    catalog: "Catalog",
    assistant: "AI Assistant",
    me: "Me",
    categories: "Categories",
    allProducts: "All Products",
    noProductsFound: "No products found",
    resetFilters: "Reset filters",
    cart: "Your Cart",
    cartEmpty: "Your cart is empty.",
    total: "Total",
    checkout: "Proceed to Checkout",
    buyNow: "Buy Now",
    addToCart: "Add to cart",
    sellerLabel: "Seller",
    localCraft: "Kasaï Craftsmanship",
    certifiedSeller: "Certified Seller",
    geoLocate: "Geolocate Address",
    geoActive: "Targeted logistics center",
    dynamicShipping: "Dynamic shipping fee",
    deliveryInfo: "Delivery Information",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    address: "Full Address",
    city: "City / Territory",
    zipCode: "Zip Code",
    selectCarrier: "Select a partner carrier",
    nextStep: "Continue",
    back: "Back",
    orderSummary: "Order Summary",
    payment: "Secure Payment",
    paymentMethod: "Payment Method",
    confirmOrder: "Confirm Order",
    successTitle: "Order Success!",
    successDesc: "Congratulations! Your order was successfully saved by our partners in DR Congo.",
    backHome: "Back to shop",
    footerMission: "Our mission & rural vision in DRC",
    footerCustomer: "Local Customer Service",
    footerSeller: "Sell on Eladma DRC",
    freeDelivery: "Free Delivery"
  },
  ln: {
    appName: "Eladma",
    searchPlaceholder: "Luka biloko na Eladma...",
    online: "Na nsinga",
    offline: "Libanda",
    gifts: "Makabo",
    catalog: "Biteni",
    assistant: "Mosungi AI",
    me: "Ngai",
    categories: "Bilebo",
    allProducts: "Biloko nyonso",
    noProductsFound: "Eloko moko te emonani",
    resetFilters: "Bongisa lisusu bafiltere",
    cart: "Likanza na yo",
    cartEmpty: "Likunda na yo eza pamba.",
    total: "Talo nyonso",
    checkout: "Futela biloko",
    buyNow: "Somba sikoyo",
    addToCart: "Bakisa na likanza",
    sellerLabel: "Moteki",
    localCraft: "Misala ya Kasaï",
    certifiedSeller: "Moteki Ndimi",
    geoLocate: "Meka kozwa esika na GPS",
    geoActive: "Esika ya kotinda biloko",
    dynamicShipping: "Talo ya kotinda biloko dynamic",
    deliveryInfo: "Sango ya komema",
    firstName: "Kombo ya yambo",
    lastName: "Kombo ya libota",
    phone: "Nimero ya telefone",
    address: "Esika ofandi",
    city: "Mboka / Teritoire",
    zipCode: "Kod mpo na posita",
    selectCarrier: "Pona mutindeli moko ya mosala",
    nextStep: "Kende liboso",
    back: "Zonga sima",
    orderSummary: "Biloko osombi nyonso",
    payment: "Futa na bokengi",
    paymentMethod: "Ndenge ya kofuta",
    confirmOrder: "Ndimisa bosombi",
    successTitle: "Bosombi Elongi !",
    successDesc: "Melesi mingi! Bosombi na yo ekomami malamu mpenza na RDC.",
    backHome: "Zonga na wenzé",
    footerMission: "Mpo na biso mpe mbonge na RDC",
    footerCustomer: "Lisungi mpo na basombi",
    footerSeller: "Teka na Eladma RDC",
    freeDelivery: "Kotinda ya ofele"
  },
  sw: {
    appName: "Eladma",
    searchPlaceholder: "Tafuta kwenye Eladma...",
    online: "Mtandaoni",
    offline: "Nje ya mtandao",
    gifts: "Zawadi",
    catalog: "Vitengo",
    assistant: "Msaidizi AI",
    me: "Mimi",
    categories: "Vitengo vya bidhaa",
    allProducts: "Bidhaa zote",
    noProductsFound: "Hakuna bidhaa iliyopatikana",
    resetFilters: "Rudisha vichungi",
    cart: "Kikapu chako",
    cartEmpty: "Kikapu chako kiko wazi.",
    total: "Jumla",
    checkout: "Nenda kwenye malipo",
    buyNow: "Nunua sasa",
    addToCart: "Weka kwenye kikapu",
    sellerLabel: "Muuzaji",
    localCraft: "Sanaa ya Kasaï",
    certifiedSeller: "Muuzaji Aliyeidhinishwa",
    geoLocate: "Tafuta anwani kwa GPS",
    geoActive: "Kituo cha vifaa kilicholengwa",
    dynamicShipping: "Gharama ya usafirishaji wa nguvu",
    deliveryInfo: "Taarifa za Uwasilishaji",
    firstName: "Jina la kwanza",
    lastName: "Jina la ukoo",
    phone: "Nambari ya simu",
    address: "Anwani kamili",
    city: "Mji / Eneo",
    zipCode: "Nambari ya posta",
    selectCarrier: "Chagua msafirishaji mshirika",
    nextStep: "Endelea",
    back: "Rudi nyuma",
    orderSummary: "Muhtasari wa Agizo lako",
    payment: "Malipo salama",
    paymentMethod: "Njia ya Malipo",
    confirmOrder: "Thibitisha agizo",
    successTitle: "Agizo Limefanikiwa !",
    successDesc: "Hongera sana! Agizo lako limehifadhiwa vyema na washirika wetu katika RDC.",
    backHome: "Rudi kwenye duka",
    footerMission: "Dhamira yetu na maono katika RDC",
    footerCustomer: "Huduma kwa wateja wa ndani",
    footerSeller: "Uza kwenye Eladma RDC",
    freeDelivery: "Usafirishaji wa bure"
  }
};


export const categoryTranslations: Record<Language, Record<string, string>> = {
  fr: {
    'All': "Tous",
    'Artisanat': "Artisanat Kasaïen",
    'Electronics': "Électronique",
    'Fashion': "Mode & Prêt-à-porter",
    'Home': "Maison & Déco",
    'Furniture': "Mobilier & Meubles",
    'Automotive': "Pièces & Outillage",
    'Beauty': "Beauté & Soins",
    'Sports': "Sports & Loisirs"
  },
  en: {
    'All': "All",
    'Artisanat': "Local Crafts",
    'Electronics': "Electronics",
    'Fashion': "Fashion & Trends",
    'Home': "Home & Living",
    'Furniture': "Furniture & Decor",
    'Automotive': "Parts & Tools",
    'Beauty': "Beauty & Care",
    'Sports': "Sports & Outdoor"
  },
  ln: {
    'All': "Biloko nyonso",
    'Artisanat': "Misala ya maboko",
    'Electronics': "Kura na Masini",
    'Fashion': "Madusu ya kitoko",
    'Home': "Biloko ya Ndako",
    'Furniture': "Kofandela na Meubles",
    'Automotive': "Pièces ya Mutuka",
    'Beauty': "Kitoko na nzo",
    'Sports': "Masano na Kobongisa"
  },
  sw: {
    'All': "Zote",
    'Artisanat': "Sanaa za Kiasili",
    'Electronics': "Vifaa vya Umeme",
    'Fashion': "Mavazi na Mitindo",
    'Home': "Nyumbani na Mapambo",
    'Furniture': "Samani za Nyumbani",
    'Automotive': "Vipuri vya Magari & Mashine",
    'Beauty': "Utunzaji wa Mwili",
    'Sports': "Michezo na Mazoezi"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  translateCategory: (cat: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('eladma_language');
    if (saved) return saved as Language;

    // Detect browser language
    try {
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
      const primary = browserLang.slice(0, 2).toLowerCase();
      if (primary === 'fr') return 'fr';
      if (primary === 'en') return 'en';
      if (primary === 'ln' || primary === 'ng') return 'ln';
      if (primary === 'sw') return 'sw';
    } catch (e) {
      console.warn("Could not detect browser language:", e);
    }
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eladma_language', lang);
  };

  const t = translations[language];

  const translateCategory = (cat: string) => {
    return categoryTranslations[language][cat] || cat;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
