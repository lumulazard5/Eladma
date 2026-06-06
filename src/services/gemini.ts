import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";
import { Language } from "../context/LanguageContext";

// Check if API key is likely missing
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
  console.warn("GEMINI_API_KEY is missing or using placeholder value. AI features may not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Fallback data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'l1',
    name: 'Statue en Bois de Malachite',
    description: 'Une pièce unique sculptée à la main par les artisans de Kananga. Symbolise la sagesse et la force pour décorer élégamment votre intérieur.',
    price: 45.00,
    category: 'Artisanat',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewCount: 12,
    reviews: [],
    isLocal: true,
    seller: 'Coopérative de Ngaza'
  },
  {
    id: 'l2',
    name: 'Panier de Kassai Tressé',
    description: 'Artisanat traditionnel de décoration du Kasai. Robuste, écologique et parfait pour agrémenter vos tables ou salons.',
    price: 25.00,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    reviewCount: 8,
    reviews: [],
    isLocal: true,
    seller: 'Tisseuses du Kasaï'
  },
  {
    id: 'dec_1',
    name: 'Tableau "Symétrie Royale Tshokwe"',
    description: 'Magnifique tableau de décoration alliant peinture acrylique contemporaine et motifs géométriques traditionnels Tshokwe. Réalisé sur toile de coton.',
    price: 85.00,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewCount: 14,
    reviews: [],
    isLocal: true,
    seller: 'Galerie d\'Art de Gombe'
  },
  {
    id: 'dec_2',
    name: 'Tableau Abstrait d\'Impression Lulua',
    description: 'Peinture de décoration de salon inspirée des tatouages rituels d\'Afrique centrale. Couleurs riches terre de Sienne.',
    price: 120.00,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop',
    rating: 4.7,
    reviewCount: 9,
    reviews: [],
    isLocal: true,
    seller: 'Atelier d\'Art de Kananga'
  },
  {
    id: 'furn_1',
    name: 'Fauteuil Royal en Wengé du Bas-Congo',
    description: 'Conçu entièrement en bois précieux de wengé massif. Un confort impérial associé à la robustesse absolue du mobilier haut de gamme congolais.',
    price: 350.00,
    category: 'Furniture',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewCount: 7,
    reviews: [],
    isLocal: true,
    seller: 'Mobilier Prestige Kinshasa'
  },
  {
    id: 'furn_2',
    name: 'Table Basse en Bois de Teck Master',
    description: 'Table basse solide en teck avec finitions lisses à l\'huile de lin naturelle. Équipée de tiroirs de rangement et de matériel métallique d\'assemblage robuste.',
    price: 210.00,
    category: 'Furniture',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    reviewCount: 11,
    reviews: [],
    isLocal: true,
    seller: 'Atelier du Bois d\'Ébène'
  },
  {
    id: 'auto_1',
    name: 'Kit Piston Renforcé pour Moto Sanyo & Haojin',
    description: 'Kit complet de piston et de segments de haute précision métrique, renforcé pour supporter les pistes rudes et garantir une longévité moteur inégalée.',
    price: 45.00,
    category: 'Automotive',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewCount: 22,
    reviews: [],
    sellerTrustScore: 95,
    isCertified: true,
    seller: 'Quincaillerie Générale Victoire'
  },
  {
    id: 'auto_2',
    name: 'Meule Abrasive pour Moulin de Maïs local',
    description: 'Masse abrasive en acier trempé de remplacement universel, haute performance de broyage pour les moulins de quartiers de Mbuji-Mayi ou Kananga.',
    price: 115.00,
    category: 'Automotive',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    reviewCount: 16,
    reviews: [],
    sellerTrustScore: 90,
    isCertified: true,
    seller: 'Atelier Mécanique du Kasaï-Central'
  },
  {
    id: 'auto_3',
    name: 'Plaquettes de Frein Carbone (Voitures)',
    description: 'Jeu de plaquettes de frein avant de qualité premium pour route poussiéreuse, idéal pour Toyota Corolla ou Rav4 roulant à Kinshasa ou Lubumbashi.',
    price: 32.50,
    category: 'Automotive',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=600&auto=format&fit=crop',
    rating: 4.6,
    reviewCount: 19,
    reviews: [],
    sellerTrustScore: 94,
    isCertified: true,
    seller: 'Pièces Auto Kin-Express'
  },
  {
    id: '1',
    name: 'Smartphone Eladma Elite',
    description: 'Le dernier cri de la technologie, assisté par intelligence artificielle. Écran OLED et processeur ultra-rapide.',
    price: 799.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    reviewCount: 45,
    reviews: [],
    sellerTrustScore: 98,
    isCertified: true,
    seller: 'Eladma Tech'
  },
  {
    id: '2',
    name: 'Casques Audio Eladma Pro',
    description: 'Une immersion sonore totale avec réduction de bruit active pour vos appels sur téléphone ou ordinateur.',
    price: 249.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    reviewCount: 32,
    reviews: [],
    sellerTrustScore: 95,
    isCertified: true,
    seller: 'Eladma Audio'
  },
  {
    id: '3',
    name: 'Veste de Pluie Eladma Tech',
    description: 'Élégance et protection maximale contre les éléments. Prêt-à-porter de créateur congolais.',
    price: 129.99,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
    rating: 4.6,
    reviewCount: 18,
    reviews: [],
    sellerTrustScore: 92,
    isCertified: true,
    seller: 'Congo Fashion'
  },
  {
    id: '4',
    name: 'Montre Connectée Eladma V2',
    description: 'Suivez votre santé, votre sport et vos notifications de téléphone avec style.',
    price: 199.99,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop',
    rating: 4.7,
    reviewCount: 56,
    reviews: [],
    sellerTrustScore: 88,
    isCertified: false,
    seller: 'Congo High-Tech'
  }
];

async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

export const generateProducts = async (category: string = 'General'): Promise<Product[]> => {
  try {
    // If no key, don't even try to avoid those RPC errors
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
      return MOCK_PRODUCTS;
    }

    const response = await retry(() => ai.models.generateContent({
      model: "gemini-flash-latest", // Use latest stable flash
      contents: `Generate 8 realistic e-commerce products for the category: ${category}. 
      Context: Eladma is an AI-powered platform based in Kananga, RDC. 
      If the category is 'Artisanat', generate unique handmade items from the Kasai region (Congo).
      Include name, a detailed description, a price between 10 and 1000, and a category.
      Set 'isLocal' to true if the item is traditional Congolese craftsmanship.
      Include a 'sellerTrustScore' (0-100) and 'isCertified' (boolean) based on simulated seller verification.
      Set a 'seller' name representing the merchant (e.g. "Coopérative de Katoka", "Aladma Labs", "Kasaï Bijoux", "Congo Mode").
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
            required: ["id", "name", "description", "price", "category", "image", "rating", "reviewCount", "reviews", "sellerTrustScore", "isCertified", "seller"],
          },
        },
      },
    }));

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Gemini Product Generation Error:", e);
    // Return filtered mock data based on category
    if (category === 'General' || category === 'All') return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }
};

export const searchAssistant = async (query: string, products: Product[]): Promise<string> => {
  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
      return "Désolé, l'assistant IA n'est pas encore configuré. Vous pouvez tout de même parcourir nos produits manuellement.";
    }

    // Identify if the user is looking for a specific product from the catalog
    const localMatches = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    const matchInfo = localMatches.length > 0 
      ? `J'ai trouvé quelques correspondances exactes dans notre catalogue : ${localMatches.map(p => `${p.name} (${p.price}€)`).join(', ')}.`
      : "Je n'ai pas trouvé de correspondance exacte immédiate, mais je vais chercher dans l'ensemble de notre base de données.";

    const response = await retry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Vous êtes l'Assistant Shopping IA d'Eladma. Votre mission est d'aider les clients à trouver des produits et à suivre leurs commandes.
      
      CONTEXTE DU CATALOGUE ACTUEL :
      ${matchInfo}
      - Liste complète des suggestions : ${JSON.stringify(products.slice(0, 15).map(p => ({ name: p.name, price: p.price, category: p.category, isLocal: p.isLocal, isCertified: p.isCertified })))}
      
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
    }));
    return response.text || "Désolé, je n'ai pas pu traiter votre demande.";
  } catch (e) {
    console.error("Gemini Search Assistant Error:", e);
    return "Désolé, j'ai rencontré un problème technique. Je suis en maintenance pour quelques instants, mais je serai de retour très vite !";
  }
};

const getMockFaqAnswer = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes("siège") || q.includes("situe") || q.includes("adresse") || q.includes("congo") || q.includes("kananga")) {
    return "Eladma International SAS a son siège social à Kananga (Kasaï-Central, République Démocratique du Congo), plus précisément dans la commune de Kananga, quartier Ngaza. Nous opérons un modèle décentralisé pour connecter nos coopératives locales de tisseurs et sculpteurs à des acheteurs partout dans le monde.";
  }
  if (q.includes("vendre") || q.includes("conditions") || q.includes("fournisseur") || q.includes("artisan")) {
    return "Vendre sur Eladma est très simple et entièrement gratuit pour démarrer. Nous accueillons les artisans des coopératives de Ngaza, Katoka et du Camp Vangu, ainsi que des vendeurs certifiés. Vos produits passent par notre processus de certification assistée par IA (identification de confiance, score d'évaluation) afin d'assurer la meilleure expérience possible.";
  }
  if (q.includes("livraison") || q.includes("frais") || q.includes("port") || q.includes("express") || q.includes("gratuit")) {
    return "La livraison standard (5-7 jours ouvrés) est gratuite pour toutes vos commandes à partir de 100€ d'achat. Pour les livraisons Express en 2-3 jours, elle est réservée aux abonnés ou s'applique selon les options des transporteurs partenaires lors du règlement.";
  }
  if (q.includes("retour") || q.includes("rembourse") || q.includes("rétractation") || q.includes("échanger")) {
    return "Nous offrons une politique de retour sous 30 jours, sans tracas. Si un produit ne vous apporte pas entière satisfaction, vous pouvez formuler une demande de retour. Nous vous fournirons une étiquette prépayée et vous serez remboursé sur votre mode de paiement d'origine sous 7 à 10 jours ouvrés.";
  }
  if (q.includes("ia") || q.includes("fiabilité") || q.includes("trust") || q.includes("certification") || q.includes("score")) {
    return "L'IA d'Eladma est au cœur de notre écosystème. Elle évalue en permanence le score de confiance des vendeurs (Trust Score) selon les délais de livraison, la régularité, et la conformité des articles. Les vendeurs exemplaires reçoivent un badge vert 'Certifié', qui vous garantit un achat en toute sérénité.";
  }
  return "Eladma est une plateforme e-commerce intelligente liant l'artisanat d'excellence et la technologie de pointe. Nous expédions dans plus de 200 pays à partir de nos coopératives basées au Kasaï (RDC) et ailleurs. Pour toute information supplémentaire ou pour un cas spécifique, notre assistance à taille humaine se tient également prête à vous répondre par email à contact@eladma.com.";
};

export const askFaqAssistant = async (question: string): Promise<string> => {
  try {
    if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
      // Simulate real-world asynchronous API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      return getMockFaqAnswer(question);
    }

    const response = await retry(() => ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Vous êtes l'expert d'assistance de la FAQ d'Eladma, une plateforme e-commerce innovante basée à Kananga (Kasaï-Central, République Démocratique du Congo).
      Votre tâche est de fournir une réponse claire, chaleureuse et informative à la question de l'utilisateur concernant le fonctionnement de la plateforme, les politiques de livraison, les retours/remboursements, l'intégration des vendeurs (coopératives locales comme celle de Ngaza, Katoka et du Camp Vangu) ou toute autre information légale d'Eladma.

      Informations de base d'Eladma :
      - Base de l'entreprise : Kananga, RDC (Siège à Ngaza, Kananga/C).
      - Mission : Valorisation de l'artisanat local du Kasai et démocratisation de l'accès aux produits certifiés par IA.
      - Livraison : Standard (5-7 jours ouvrés, gratuit dès 100€) et Express (2-3 jours ouvrés pour les membres Rewards Or/Diamant). Livraison mondiale (>200 pays).
      - Retours : Garantie de rétractation de 30 jours, retours simplifiés, remboursement sous 7-10 jours ouvrés.
      - Vendre sur Eladma : Inscription gratuite pour les artisans et vendeurs, processus de vérification assistée par IA pour certification (Trust Score).

      CONSIGNES DE RÉPONSE :
      1. Répondez de manière structurée avec un ton professionnel et attentionné en Français.
      2. Soyez concis mais complet (environ 2-4 phrases ou quelques puces si nécessaire).
      3. N'hésitez pas à mentionner le support client (contact@eladma.com) s'ils ont besoin d'une aide humaine complémentaire.

      QUESTION FRÉQUENTE DE L'UTILISATEUR : "${question}"`,
    }));
    return response.text || "Désolé, je n'ai pas pu générer de réponse actuellement.";
  } catch (e) {
    console.error("Gemini FAQ Assistant Error:", e);
    return getMockFaqAnswer(question);
  }
};

// Memory cache for product translations: Key is "productId_targetLanguage"
const translationCache: Record<string, { name: string; description: string }> = {};

export const translateProductsBatch = async (
  products: Product[],
  targetLanguage: Language
): Promise<Product[]> => {
  if (targetLanguage === 'fr' || products.length === 0) {
    return products;
  }
  
  if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is missing. Translations will use mock fallback.");
    return products.map(p => ({
      ...p,
      name: `${p.name} (${targetLanguage.toUpperCase()})`,
      description: `${p.description} (Traduit automatiquement en ${targetLanguage.toUpperCase()})`
    }));
  }

  try {
    const payload = products.map(p => ({
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

    const translations: Array<{ id: string, name: string, description: string }> = JSON.parse(response.text || "[]");
    
    return products.map(p => {
      const match = translations.find(t => t.id === p.id);
      if (match) {
        return {
          ...p,
          name: match.name,
          description: match.description
        };
      }
      return p;
    });
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return products;
  }
};

export const translateProducts = async (
  products: Product[],
  targetLang: Language
): Promise<Product[]> => {
  if (targetLang === 'fr' || products.length === 0) {
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
      console.error("Failed to translate batch:", e);
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

export const searchProductsByImage = async (
  base64Image: string,
  products: Product[]
): Promise<ImageSearchResult> => {
  if (!base64Image) {
    throw new Error("Aucune image fournie pour la recherche.");
  }

  // Handle missing key or mock fallback
  if (!API_KEY || API_KEY === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is missing. Simulating photo analysis...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Choose 1-3 products to simulate finding
    const matches = products.slice(0, 2).map((p, idx) => ({
      productId: p.id,
      similarityScore: idx === 0 ? 92 : 78,
      explanation: `L'objet en photo présente des similitudes visuelles remarquables de forme et de texture de type "${p.category}" proches de la tradition de "${p.name}".`
    }));

    return {
      identifiedItem: products[0] ? `Objet artisan local similaire à : ${products[0].name}` : "Article artisanal sculpté du Kasaï",
      matches
    };
  }

  try {
    const base64DataOnly = base64Image.split(',')[1] || base64Image;
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64DataOnly,
      },
    };

    // Prepare a lightweight product catalog snapshot for Gemini
    const catalogSnapshot = products.map(p => ({
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

    const resultText = response.text || "{}";
    const parsed: ImageSearchResult = JSON.parse(resultText);
    return parsed;
  } catch (error) {
    console.error("Gemini Visual Search Error:", error);
    // Return graceful fallback
    const matches = products.slice(0, 1).map(p => ({
      productId: p.id,
      similarityScore: 65,
      explanation: "Nous avons identifié des similitudes de catégorie générale avec ce produit."
    }));
    return {
      identifiedItem: "Produit non identifié",
      matches
    };
  }
};

