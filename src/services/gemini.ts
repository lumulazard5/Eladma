import { Product } from "../types";
import { Language } from "../context/LanguageContext";

// Fallback data in case the server fails or responds empty
const MOCK_PRODUCTS: Product[] = [
  {
    id: "l1",
    name: "Statue en Bois de Malachite",
    description: "Une pièce unique sculptée à la main par les artisans de Kananga. Symbolise la sagesse et la force pour décorer élégamment votre intérieur.",
    price: 45.00,
    category: "Artisanat",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 12,
    reviews: [],
    isLocal: true,
    seller: "Coopérative de Ngaza",
    brand: "Kasaï Craft"
  },
  {
    id: "l2",
    name: "Panier de Kassai Tressé",
    description: "Artisanat traditionnel de décoration du Kasai. Robuste, écologique et parfait pour agrémenter vos tables ou salons.",
    price: 25.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1531835551805-16d864c8d311?q=80&w=600&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 8,
    reviews: [],
    isLocal: true,
    seller: "Tisseuses du Kasaï",
    brand: "Kasaï Tissage"
  },
  {
    id: "dec_1",
    name: "Tableau \"Symétrie Royale Tshokwe\"",
    description: "Magnifique tableau de décoration alliant peinture acrylique contemporaine et motifs géométriques traditionnels Tshokwe. Réalisé sur toile de coton.",
    price: 85.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 14,
    reviews: [],
    isLocal: true,
    seller: "Galerie d'Art de Gombe",
    brand: "Atelier Royal"
  },
  {
    id: "dec_2",
    name: "Tableau Abstrait d'Impression Lulua",
    description: "Peinture de décoration de salon inspirée des tatouages rituels d'Afrique centrale. Couleurs riches terre de Sienne.",
    price: 120.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
    rating: 4.7,
    reviewCount: 9,
    reviews: [],
    isLocal: true,
    seller: "Atelier d'Art de Kananga",
    brand: "Artisanat Lulua"
  },
  {
    id: "furn_1",
    name: "Fauteuil Royal en Wengé du Bas-Congo",
    description: "Conçu entièrement en bois précieux de wengé massif. Un confort impérial associé à la robustesse absolue du mobilier haut de gamme congolais.",
    price: 350.00,
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 7,
    reviews: [],
    isLocal: true,
    seller: "Mobilier Prestige Kinshasa",
    brand: "Kinshasa Prestige"
  },
  {
    id: "furn_2",
    name: "Table Basse en Bois de Teck Master",
    description: "Table basse solide en teck avec finitions lisses à l'huile de lin naturelle. Équipée de tiroirs de rangement et de matériel métallique d'assemblage robuste.",
    price: 210.00,
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 11,
    reviews: [],
    isLocal: true,
    seller: "Atelier du Bois d'Ébène",
    brand: "TeckMaster"
  },
  {
    id: "auto_1",
    name: "Kit Piston Renforcé pour Moto Sanyo & Haojin",
    description: "Kit complet de piston et de segments de haute précision métrique, renforcé pour supporter les pistes rudes et garantir une longévité moteur inégalée.",
    price: 45.00,
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 22,
    reviews: [],
    sellerTrustScore: 95,
    isCertified: true,
    seller: "Quincaillerie Générale Victoire",
    brand: "Haojin"
  },
  {
    id: "auto_2",
    name: "Meule Abrasive pour Moulin de Maïs local",
    description: "Masse abrasive en acier trempé de remplacement universel, haute performance de broyage pour les moulins de quartiers de Mbuji-Mayi ou Kananga.",
    price: 115.00,
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 16,
    reviews: [],
    sellerTrustScore: 90,
    isCertified: true,
    seller: "Atelier Mécanique du Kasaï-Central",
    brand: "MecaCongo"
  },
  {
    id: "auto_3",
    name: "Plaquettes de Frein Carbone (Voitures)",
    description: "Jeu de plaquettes de frein avant de qualité premium pour route poussiéreuse, idéal pour Toyota Corolla ou Rav4 roulant à Kinshasa ou Lubumbashi.",
    price: 32.50,
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop",
    rating: 4.6,
    reviewCount: 19,
    reviews: [],
    sellerTrustScore: 94,
    isCertified: true,
    seller: "Pièces Auto Kin-Express",
    brand: "Toyota"
  },
  {
    id: "1",
    name: "Smartphone Eladma Elite",
    description: "Le dernier cri de la technologie, assisté par intelligence artificielle. Écran OLED et processeur ultra-rapide.",
    price: 799.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop",
    rating: 4.8,
    reviewCount: 45,
    reviews: [],
    sellerTrustScore: 98,
    isCertified: true,
    seller: "Eladma Tech",
    brand: "Eladma"
  },
  {
    id: "2",
    name: "Casques Audio Eladma Pro",
    description: "Une immersion sonore totale avec réduction de bruit active pour vos appels sur téléphone ou ordinateur.",
    price: 249.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    reviewCount: 32,
    reviews: [],
    sellerTrustScore: 95,
    isCertified: true,
    seller: "Eladma Audio",
    brand: "Eladma"
  },
  {
    id: "3",
    name: "Veste de Pluie Eladma Tech",
    description: "Élégance et protection maximale contre les éléments. Prêt-à-porter de créateur congolais.",
    price: 129.99,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
    rating: 4.6,
    reviewCount: 18,
    reviews: [],
    sellerTrustScore: 92,
    isCertified: true,
    seller: "Congo Fashion",
    brand: "Congo Mode"
  },
  {
    id: "4",
    name: "Montre Connectée Eladma V2",
    description: "Suivez votre santé, votre sport et vos notifications de téléphone avec style.",
    price: 199.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop",
    rating: 4.7,
    reviewCount: 56,
    reviews: [],
    sellerTrustScore: 88,
    isCertified: false,
    seller: "Congo High-Tech",
    brand: "Eladma"
  }
];

// Helper to filter mock products by category
const getFilteredFallback = (category: string): Product[] => {
  if (category === "General" || category === "All") return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
};

// Robust fetch helper with exponential backoff retries to handle transient restarts/failures
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    // If the server returns a server-side error (5xx) or rate limit (429), we can retry.
    if (!res.ok && (res.status >= 500 || res.status === 429) && retries > 0) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

// 1. Generate Products via server route
export const generateProducts = async (category: string = "General"): Promise<Product[]> => {
  try {
    const response = await fetchWithRetry("/api/gemini/generate-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : getFilteredFallback(category);
  } catch (e) {
    console.error("Client generateProducts Error, using local fallback:", e);
    return getFilteredFallback(category);
  }
};

// 2. Search Assistant Chat via server route
export const searchAssistant = async (query: string, products: Product[]): Promise<string> => {
  try {
    const response = await fetchWithRetry("/api/gemini/search-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, products }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.text || "Désolé, je n'ai pas pu traiter votre demande.";
  } catch (e) {
    console.error("Client searchAssistant Error:", e);
    return "Désolé, j'ai rencontré un problème technique de connexion avec le serveur d'assistance.";
  }
};

// Default mock FAQ answers when servers are offline
const getMockFaqAnswer = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes("siège") || q.includes("situe") || q.includes("adresse") || q.includes("congo") || q.includes("kananga")) {
    return "Eladma International SAS a son siège social à Kananga (Kasaï-Central, République Démocratique du Congo), plus précisément dans la commune de Kananga, quartier Ngaza. Nous opérons un modèle décentralisé pour connecter nos coopératives locales de tisseurs et sculpteurs à des acheteurs partout dans le monde.";
  }
  if (q.includes("vendre") || q.includes("conditions") || q.includes("fournisseur") || q.includes("artisan")) {
    return "Vendre sur Eladma est très simple et entièrement gratuit pour démarrer. Nous accueillons les artisans des coopératives de Ngaza, Katoka et du Camp Vangu, ainsi que des vendeurs certifiés. Vos produits passent par notre processus de certification assistée par IA (identification de confiance, score d'évaluation) afin d'assurer la meilleure expérience possible.";
  }
  return "Eladma est une plateforme e-commerce intelligente liant l'artisanat d'excellence et la technologie de pointe. Nous expédions dans plus de 200 pays à partir de nos coopératives basées au Kasaï (RDC) et ailleurs. Pour toute information complémentaire, écrivez-nous à contact@eladma.com.";
};

// 3. Ask FAQ Assistant via server route
export const askFaqAssistant = async (question: string): Promise<string> => {
  try {
    const response = await fetchWithRetry("/api/gemini/ask-faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.text || getMockFaqAnswer(question);
  } catch (e) {
    console.error("Client askFaqAssistant Error:", e);
    return getMockFaqAnswer(question);
  }
};

// Memory cache for translation objects
export const translationCache: Record<string, { name: string; description: string }> = {};

// 4. Batch Translate Products via server route
export const translateProductsBatch = async (
  products: Product[],
  targetLanguage: Language
): Promise<Product[]> => {
  if (targetLanguage === "fr" || products.length === 0) {
    return products;
  }
  try {
    const response = await fetchWithRetry("/api/gemini/translate-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, targetLanguage }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : products;
  } catch (e) {
    console.error("Client translateProductsBatch Error:", e);
    return products.map(p => ({
      ...p,
      name: `${p.name} (${targetLanguage.toUpperCase()})`,
      description: `${p.description} (Traduit automatiquement en ${targetLanguage.toUpperCase()})`
    }));
  }
};

export const translateProducts = async (
  products: Product[],
  targetLang: Language
): Promise<Product[]> => {
  if (targetLang === "fr" || products.length === 0) {
    return products;
  }

  const toTranslate: Product[] = [];
  const results: Product[] = [];

  for (const product of products) {
    const cacheKey = `${product.id}_${targetLang}`;
    if (translationCache[cacheKey]) {
      results.push({
        ...product,
        name: translationCache[cacheKey].name,
        description: translationCache[cacheKey].description
      });
    } else {
      toTranslate.push(product);
    }
  }

  if (toTranslate.length > 0) {
    try {
      const translatedBatch = await translateProductsBatch(toTranslate, targetLang);
      for (const tp of translatedBatch) {
        const cacheKey = `${tp.id}_${targetLang}`;
        translationCache[cacheKey] = {
          name: tp.name,
          description: tp.description
        };
      }
    } catch (e) {
      console.error("Failed to translate batch client side:", e);
    }
  }

  return products.map(product => {
    const cacheKey = `${product.id}_${targetLang}`;
    const cached = translationCache[cacheKey];
    if (cached) {
      return {
        ...product,
        name: cached.name,
        description: cached.description
      };
    }
    return product;
  });
};

export interface ImageSearchResult {
  identifiedItem: string;
  matches: Array<{
    productId: string;
    similarityScore: number;
    explanation: string;
  }>;
}

// 5. Search Products By Image via server route
export const searchProductsByImage = async (
  base64Image: string,
  products: Product[]
): Promise<ImageSearchResult> => {
  if (!base64Image) {
    throw new Error("Aucune image fournie pour la recherche.");
  }
  try {
    const response = await fetchWithRetry("/api/gemini/search-by-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, products }),
    });
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Client searchProductsByImage Error:", e);
    const matches = products.slice(0, 1).map(p => ({
      productId: p.id,
      similarityScore: 65,
      explanation: "Simulé: Similitude de catégorie générale de l'image (Hors Ligne)."
    }));
    return {
      identifiedItem: "Produit non identifié",
      matches
    };
  }
};
