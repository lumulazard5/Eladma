export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isLocal?: boolean;
  sellerTrustScore?: number;
  isCertified?: boolean;
  seller?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Category = 'All' | 'Artisanat' | 'Electronics' | 'Fashion' | 'Home' | 'Beauty' | 'Sports' | 'Furniture' | 'Automotive';

export interface ProductFilters {
  priceRange: [number, number];
  minRating: number;
  localOnly: boolean;
  certifiedOnly: boolean;
  seller: string;
  favoritesOnly?: boolean;
}

export interface Cooperative {
  id: string;
  name: string;
  location: string;
  description: string;
  story: string;
  image: string;
  members: number;
  specialty: string;
}
