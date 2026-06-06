import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FavoritesContextType {
  favorites: string[]; // List of product IDs
  toggleFavorite: (productId: string, productName?: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eladma_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading favorites from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eladma_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to localStorage:', e);
    }
  }, [favorites]);

  const toggleFavorite = (productId: string, productName?: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (productName) {
          toast.info(`${productName} retiré des favoris.`);
        } else {
          toast.info('Produit retiré des favoris.');
        }
        return prev.filter((id) => id !== productId);
      } else {
        if (productName) {
          toast.success(`${productName} ajouté aux favoris ! ❤️`);
        } else {
          toast.success('Produit ajouté aux favoris ! ❤️');
        }
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    toast.success('Liste des favoris vidée.');
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
