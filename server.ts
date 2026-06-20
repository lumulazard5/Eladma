import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload size limit to support large base64 image searches
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GenAI on the server with correct telemetry headers
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined on the server.");
}

const ai = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for retries on Gemini API calls
async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// In-Memory Circuit Breaker for Gemini API Quota Limits
let geminiQuotaExhaustedUntil = 0;
const BREAKER_COOLDOWN_MS = 60 * 1000; // block API calls for 1 minute if a quota error is hit

function checkGeminiActive(): boolean {
  if (Date.now() < geminiQuotaExhaustedUntil) {
    return false;
  }
  return true;
}

function handleGeminiError(endpoint: string, err: any) {
  const errMsg = err instanceof Error ? err.message : String(err);
  const isQuota = errMsg.includes("429") || 
                  errMsg.includes("quota") || 
                  errMsg.includes("RESOURCE_EXHAUSTED") || 
                  errMsg.includes("limit: 20") ||
                  errMsg.includes("Rate limit");
  
  if (isQuota) {
    geminiQuotaExhaustedUntil = Date.now() + BREAKER_COOLDOWN_MS;
    console.warn(`[Gemini Circuit Breaker] Rate limit/quota exceeded in endpoint '${endpoint}'. Activated circuit breaker for 60s.`);
  } else {
    console.warn(`[Gemini Warning] Error in endpoint '${endpoint}': ${errMsg.substring(0, 150)}`);
  }
}

// ---------------- SERVER COPIED BACKUP PRODUCTS ----------------
const MOCK_PRODUCTS = [
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
    sellerTrustScore: 97,
    isCertified: true,
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
    sellerTrustScore: 92,
    isCertified: true,
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
    sellerTrustScore: 94,
    isCertified: true,
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
    sellerTrustScore: 89,
    isCertified: false,
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
    sellerTrustScore: 96,
    isCertified: true,
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
    sellerTrustScore: 91,
    isCertified: true,
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
    isLocal: false,
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
    isLocal: false,
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
    isLocal: false,
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
    isLocal: false,
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
    isLocal: false,
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
    isLocal: true,
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
    isLocal: false,
    sellerTrustScore: 88,
    isCertified: false,
    seller: "Congo High-Tech",
    brand: "Eladma"
  }
];

const getFilteredFallback = (category: string) => {
  if (!category || category === "General" || category === "All") return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
};

const getMockFaqAnswer = (question: string): string => {
  const q = (question || "").toLowerCase();
  if (q.includes("siège") || q.includes("situe") || q.includes("adresse") || q.includes("congo") || q.includes("kananga")) {
    return "Eladma International SAS a son siège social à Kananga (Kasaï-Central, République Démocratique du Congo), plus précisément dans la commune de Kananga, quartier Ngaza. Nous opérons un modèle décentralisé pour connecter nos coopératives locales de tisseurs et sculpteurs à des acheteurs partout dans le monde.";
  }
  if (q.includes("vendre") || q.includes("conditions") || q.includes("fournisseur") || q.includes("artisan")) {
    return "Vendre sur Eladma est très simple et entièrement gratuit pour démarrer. Nous accueillons les artisans des coopératives de Ngaza, Katoka et du Camp Vangu, ainsi que des vendeurs certifiés. Vos produits passent par notre processus de certification assistée par IA (identification de confiance, score d'évaluation) afin d'assurer la meilleure expérience possible.";
  }
  return "Eladma est une plateforme e-commerce intelligente liant l'artisanat d'excellence et la technologie de pointe. Nous expédions dans plus de 200 pays à partir de nos coopératives basées au Kasaï (RDC) et ailleurs. Pour toute information complémentaire, écrivez-nous à contact@eladma.com.";
};

// ---------------- API ENDPOINTS FOR GEMINI PROXYING ----------------

// Route 1: Generate Products
app.post("/api/gemini/generate-products", async (req, res) => {
  const { category } = req.body;
  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY" || !checkGeminiActive()) {
      return res.json(getFilteredFallback(category));
    }

    const response = await retry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate 8 realistic e-commerce products for the category: ${category || "General"}. 
        Context: Eladma is an AI-powered platform based in Kananga, RDC. 
        If the category is 'Artisanat', generate unique handmade items from the Kasai region (Congo).
        Include name, a detailed description, a price between 10 and 1000, and a category.
        Set 'isLocal' to true if the item is traditional Congolese craftsmanship.
        Include a 'sellerTrustScore' (0-100) and 'isCertified' (boolean) based on simulated seller verification.
        Set a 'seller' name representing the merchant (e.g. "Coopérative de Ngaza", "Aladma Labs", "Kasaï Bijoux", "Congo Mode").
        Set a 'brand' representing the brand name (e.g. "Sanyo", "Toyota", "Eladma", "Samsung", "Congo Style", "Atelier Local").
        Use high-quality placeholder image URLs from picsum.photos.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                price: { type: Type.NUMBER },
                category: { type: Type.STRING },
                image: { type: Type.STRING },
                rating: { type: Type.NUMBER },
                reviewCount: { type: Type.NUMBER },
                sellerTrustScore: { type: Type.NUMBER },
                isCertified: { type: Type.BOOLEAN },
                seller: { type: Type.STRING },
                brand: { type: Type.STRING },
                reviews: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      user: { type: Type.STRING },
                      rating: { type: Type.NUMBER },
                      comment: { type: Type.STRING },
                      date: { type: Type.STRING }
                    }
                  }
                }
              },
              required: [
                "id", "name", "description", "price", "category", "image", "rating",
                "reviewCount", "reviews", "sellerTrustScore", "isCertified", "seller", "brand"
              ],
            },
          },
        },
      })
    );

    const products = JSON.parse(response.text || "[]");
    res.json(products);
  } catch (error) {
    handleGeminiError("generateProducts", error);
    res.json(getFilteredFallback(category));
  }
});

// Route 2: Search Assistant Chat
app.post("/api/gemini/search-assistant", async (req, res) => {
  const { query, products } = req.body;
  const localMatches = (products || []).filter((p: any) =>
    p.name.toLowerCase().includes((query || "").toLowerCase()) ||
    p.category.toLowerCase().includes((query || "").toLowerCase())
  ).slice(0, 5);

  const matchInfo = localMatches.length > 0
    ? `J'ai trouvé quelques correspondances exactes dans notre catalogue : ${localMatches.map((p: any) => `${p.name} (${p.price} FC)`).join(", ")}.`
    : "Je n'ai pas trouvé de correspondance exacte immédiate, mais je vais chercher dans l'ensemble de notre base de données.";

  const getAssistantFallback = () => {
    const q = (query || "").toLowerCase();
    let text = "[Service de secours Eladma] ";
    if (q.includes("livraison") || q.includes("expédition") || q.includes("frais")) {
      text += "Nous expédions pour les 26 provinces ainsi qu'à l'international. La livraison standard prend 5-7 jours, et express 2-3 jours.";
    } else if (q.includes("coopérative") || q.includes("artisan") || q.includes("ngaza") || q.includes("katoka")) {
      text += "Nous collaborons directement avec les coopératives locales de Kananga : les Sculpteurs de Ngaza, les Tisseuses de Camp Vangu, et les Forgerons de Katoka.";
    } else if (localMatches.length > 0) {
      text += `${matchInfo} Que puis-je vous dire d'autre sur ces produits d'exception ?`;
    } else {
      text += "Notre serveur IA principal d'Eladma est actuellement en cours de maintenance ou de limitation de quota. Néanmoins, vous pouvez parfaitement naviguer dans notre catalogue, filtrer par catégorie, et passer commande en toute sécurité.";
    }
    return { text, isFallback: true };
  };

  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY" || !checkGeminiActive()) {
      return res.json(getAssistantFallback());
    }

    const catalogList = (products || []).slice(0, 15).map((p: any) => ({
      name: p.name,
      price: p.price,
      category: p.category,
      isLocal: p.isLocal,
      isCertified: p.isCertified
    }));

    const response = await retry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Vous êtes l'Assistant Shopping IA d'Eladma. Votre mission est d'aider les clients à trouver des produits et à suivre leurs commandes.
        
        CONTEXTE DU CATALOGUE ACTUEL :
        ${matchInfo}
        - Liste complète des suggestions : ${JSON.stringify(catalogList)}
        
        CAPACITÉS :
        - Eladma est basée à Kananga, RDC. Elle valorise l'artisanat local du Kasai.
        - Il existe une section "Nos Coopératives" (view: cooperatives) pour Ngaza, Katoka et Camp Vangu.
        - Politique de suivi : Les commandes commençant par ELADMA- (ex: ELADMA-1234) sont suivies en temps réel.
        - Filtres : Les utilisateurs peuvent désormais filtrer par prix, note (étoiles), produits locaux (Kasaï) et vendeurs certifiés dans la barre de catégories.
        
        CONSIGNES :
        - Si l'utilisateur cherche un produit présent dans la liste ci-dessus, mettez-le en avant.
        - Si le produit n'est pas dans la liste, suggérez des alternatives ou expliquez comment utiliser les nouveaux FILTRES dans la barre de catégories pour affiner la recherche.
        - Soyez professionnel, chaleureux et expert. Répondez exclusivement en Français.
        
        QUESTION DE L'UTILISATEUR : "${query}"`,
      })
    );

    res.json({ text: response.text || "Désolé, je n'ai pas pu traiter votre demande." });
  } catch (error) {
    handleGeminiError("searchAssistant", error);
    res.json(getAssistantFallback());
  }
});

// Route 3: FAQ Assistant
app.post("/api/gemini/ask-faq", async (req, res) => {
  const { question } = req.body;
  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY" || !checkGeminiActive()) {
      return res.json({
        text: getMockFaqAnswer(question),
      });
    }

    const response = await retry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Vous êtes l'expert d'assistance de la FAQ d'Eladma, une plateforme e-commerce innovante basée à Kananga (Kasaï-Central, République Démocratique du Congo).
        Votre tâche est de fournir une réponse claire, chaleureuse et informative à la question de l'utilisateur concernant le fonctionnement de la plateforme, les politiques de livraison, les retours/remboursements, l'intégration des vendeurs (coopératives locales comme celle de Ngaza, Katoka et du Camp Vangu) ou toute autre information légale d'Eladma.
  
        Informations de base d'Eladma :
        - Base de l'entreprise : Kananga, RDC (Siège à Ngaza, Kananga/C).
        - Mission : Valorisation de l'artisanat local du Kasai et démocratisation de l'accès aux produits certifiés by IA.
        - Livraison : Standard (5-7 jours ouvrés, gratuit dès 100€) et Express (2-3 jours ouvrés pour les membres Rewards Or/Diamant). Livraison mondiale (>200 pays).
        - Retours : Garantie de rétractation de 30 jours, retours simplifiés, remboursement sous 7-10 jours ouvrés.
        - Vendre sur Eladma : Inscription gratuite pour les artisans et vendeurs, processus de vérification assistée par IA pour certification (Trust Score).
  
        CONSIGNES DE RÉPONSE :
        1. Répondez de manière structurée avec un ton professionnel et attentionné en Français.
        2. Soyez concis mais complet (environ 2-4 phrases ou quelques puces si nécessaire).
        3. N'hésitez pas à mentionner le support client (contact@eladma.com) s'ils ont besoin d'une aide humaine complémentaire.
  
        QUESTION FRÉQUENTE DE L'UTILISATEUR : "${question}"`,
      })
    );

    res.json({ text: response.text || "Désolé, je n'ai pas pu générer de réponse actuellement." });
  } catch (error) {
    handleGeminiError("askFaqAssistant", error);
    res.json({ text: getMockFaqAnswer(question), isFallback: true });
  }
});

// Route 4: Batch Translate Products
app.post("/api/gemini/translate-products", async (req, res) => {
  const { products, targetLanguage } = req.body;
  const fallback = (products || []).map((p: any) => ({
    id: p.id,
    name: `${p.name} (${String(targetLanguage).toUpperCase()})`,
    description: `${p.description} (Traduit automatiquement en ${String(targetLanguage).toUpperCase()})`
  }));

  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY" || !checkGeminiActive()) {
      return res.json(fallback);
    }

    const payload = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following list of product objects from French to the target language: "${targetLanguage}" (en = English, ln = Lingala, sw = Swahili).
      Keep brand names or proper nouns like "Eladma", "Congo", or "Kasaï" intact if appropriate. Translate everything else naturally.
      For Lingala (ln) and Swahili (sw), use locally authentic, high-quality, and natural phrasing.
      
      Respond directly with a JSON array mimicking the input structure. Only return the final JSON array.
      Output Schema: Array of items with properties: "id", "name", and "description".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["id", "name", "description"]
          }
        }
      }
    });

    const translations = JSON.parse(response.text || "[]");
    res.json(translations);
  } catch (error) {
    handleGeminiError("translateProducts", error);
    res.json(fallback);
  }
});

// Route 5: Search Products By Image (Visual search)
app.post("/api/gemini/search-by-image", async (req, res) => {
  const { base64Image, products } = req.body;
  const getFallbackMatches = () => {
    return (products || []).slice(0, 2).map((p: any, idx: number) => ({
      productId: p.id,
      similarityScore: idx === 0 ? 92 : 78,
      explanation: `L'objet en photo présente des similitudes visuelles de forme issues de la tradition de "${p.name}". (Index de secours déconnecté)`
    }));
  };

  try {
    if (!base64Image) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY" || !checkGeminiActive()) {
      return res.json({
        identifiedItem: products[0] ? `Artisan local similaire à : ${products[0].name}` : "Article artisanal du Kasaï",
        matches: getFallbackMatches()
      });
    }

    const base64DataOnly = base64Image.split(",")[1] || base64Image;
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64DataOnly,
      },
    };

    const catalogSnapshot = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      seller: p.seller
    }));

    const textPart = {
      text: `Analyze this image (which was taken by an e-commerce user's camera). 
      1. Identify the main item/object visible in the image. Give it a short name in French as "identifiedItem".
      2. Compare the identified item against our e-commerce catalog: ${JSON.stringify(catalogSnapshot)}.
      3. For each product in our catalog that has some visual, functional, or category similarity, assign a "similarityScore" (0-100) and write a brief explanation in French ("explanation") detailing why it matches.
      4. Limit the result list "matches" to the top 3 most similar products, but only those with score > 20. If no items match, return an empty list.
 
      Respond directly with the JSON structure described in the schema. Only return the final JSON.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identifiedItem: { 
              type: Type.STRING, 
              description: "Short name in French of what was identified in the image" 
            },
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  similarityScore: { 
                    type: Type.INTEGER,
                    description: "Similarity score from 0 to 100" 
                  },
                  explanation: { 
                    type: Type.STRING,
                    description: "Reasoning for the similarity, written in clean French" 
                  }
                },
                required: ["productId", "similarityScore", "explanation"]
              }
            }
          },
          required: ["identifiedItem", "matches"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error) {
    handleGeminiError("searchProductsByImage", error);
    res.json({
      identifiedItem: products[0] ? `Artisan local similaire à : ${products[0].name}` : "Article artisanal de Kananga",
      matches: getFallbackMatches()
    });
  }
});


// ---------------- GOOGLE CHAT PROXIENDPOINTS ----------------
app.get("/api/chat/spaces", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const response = await fetch("https://chat.googleapis.com/v1/spaces", {
      headers: { Authorization: token },
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat/spaces", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const response = await fetch("https://chat.googleapis.com/v1/spaces", {
      method: "POST",
      headers: { 
        Authorization: token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/chat/spaces/:spaceId/messages", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Missing token" });
  
  const spaceId = req.params.spaceId;
  const decodedSpaceId = spaceId.startsWith("spaces/") ? spaceId : `spaces/${spaceId}`;

  try {
    const response = await fetch(`https://chat.googleapis.com/v1/${decodedSpaceId}/messages?pageSize=30`, {
      headers: { Authorization: token },
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat/spaces/:spaceId/messages", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Missing token" });

  const spaceId = req.params.spaceId;
  const decodedSpaceId = spaceId.startsWith("spaces/") ? spaceId : `spaces/${spaceId}`;

  try {
    const response = await fetch(`https://chat.googleapis.com/v1/${decodedSpaceId}/messages`, {
      method: "POST",
      headers: { 
        Authorization: token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ---------------- EXPRESS VITE SEAMLESS SYSTEM ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting robustly in full-stack proxy mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
