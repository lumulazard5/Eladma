import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Product } from '../types';
import { useLanguage } from './LanguageContext';

export interface CompareContextType {
  compareProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isComparing: (productId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [compareProducts, setCompareProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('eladma_compare_list');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('eladma_compare_list', JSON.stringify(compareProducts));
  }, [compareProducts]);

  const addToCompare = (product: Product) => {
    if (compareProducts.some(p => p.id === product.id)) {
      // Already added, remove it
      removeFromCompare(product.id);
      return;
    }

    if (compareProducts.length >= 3) {
      const msgs = {
        fr: "Vous pouvez comparer jusqu'à 3 produits au maximum. Retirez-en un d'abord.",
        en: "You can compare up to 3 products maximum. Remove one first.",
        ln: "Okoki komekisa kaka biloko 3 na mbala moko. Longola moko naino.",
        sw: "Unaweza kulinganisha hadi bidhaa 3 pekee. Ondoa moja kwanza."
      };
      toast.warning(msgs[language as keyof typeof msgs] || msgs.fr);
      return;
    }

    setCompareProducts(prev => {
      const updated = [...prev, product];
      const addedMsgs = {
        fr: `« ${product.name} » ajouté au comparateur.`,
        en: `« ${product.name} » added to comparison.`,
        ln: `« ${product.name} » ebakisami mpo na komekisa.`,
        sw: `« ${product.name} » imeongezwa kwenye ulinganishi.`
      };
      toast.success(addedMsgs[language as keyof typeof addedMsgs] || addedMsgs.fr);
      return updated;
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareProducts(prev => {
      const removedProduct = prev.find(p => p.id === productId);
      const updated = prev.filter(p => p.id !== productId);
      if (removedProduct) {
        const removedMsgs = {
          fr: `« ${removedProduct.name} » retiré du comparateur.`,
          en: `« ${removedProduct.name} » removed from comparison.`,
          ln: `« ${removedProduct.name} » elongwami na komekisa.`,
          sw: `« ${removedProduct.name} » imeondolewa kwenye ulinganishi.`
        };
        toast.info(removedMsgs[language as keyof typeof removedMsgs] || removedMsgs.fr);
      }
      return updated;
    });
  };

  const isComparing = (productId: string) => {
    return compareProducts.some(p => p.id === productId);
  };

  const clearCompare = () => {
    setCompareProducts([]);
    const clearMsgs = {
      fr: "Comparateur réinitialisé.",
      en: "Comparison cleared.",
      ln: "Komekisa ezongisami na zero.",
      sw: "Ulinganishi umefutwa."
    };
    toast.info(clearMsgs[language as keyof typeof clearMsgs] || clearMsgs.fr);
  };

  return (
    <CompareContext.Provider value={{ compareProducts, addToCompare, removeFromCompare, isComparing, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
