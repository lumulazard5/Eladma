import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { sounds } from '../services/sound';
import { haptics } from '../services/haptics';

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  image: string;
  timestamp: string;
  read: boolean;
}

interface PriceTrackerContextType {
  trackedProductIds: string[];
  alerts: PriceAlert[];
  toggleTracking: (productId: string, productName?: string) => void;
  isTracking: (productId: string) => boolean;
  addPriceAlert: (productId: string, productName: string, oldPrice: number, newPrice: number, image: string) => void;
  markAllAlertsAsRead: () => void;
  clearAllAlerts: () => void;
  unreadCount: number;
}

const PriceTrackerContext = createContext<PriceTrackerContextType | undefined>(undefined);

export const PriceTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trackedProductIds, setTrackedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eladma_price_tracking');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading price tracking from localStorage:', e);
      return [];
    }
  });

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('eladma_price_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading price alerts from localStorage:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eladma_price_tracking', JSON.stringify(trackedProductIds));
    } catch (e) {
      console.error('Error saving price tracking to localStorage:', e);
    }
  }, [trackedProductIds]);

  useEffect(() => {
    try {
      localStorage.setItem('eladma_price_alerts', JSON.stringify(alerts));
    } catch (e) {
      console.error('Error saving price alerts to localStorage:', e);
    }
  }, [alerts]);

  const toggleTracking = (productId: string, productName?: string) => {
    haptics.medium();
    sounds.select();
    setTrackedProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        if (productName) {
          toast.info(`Suivi désactivé pour ${productName}.`);
        } else {
          toast.info('Suivi des prix désactivé pour ce produit.');
        }
        return prev.filter((id) => id !== productId);
      } else {
        if (productName) {
          toast.success(`Suivi activé pour ${productName} ! Nous vous alerterons en cas de baisse 🔔`);
        } else {
          toast.success('Suivi des prix activé ! Vous recevrez une alerte en cas de baisse 🔔');
        }
        return [...prev, productId];
      }
    });
  };

  const isTracking = (productId: string) => {
    return trackedProductIds.includes(productId);
  };

  const addPriceAlert = (
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    image: string
  ) => {
    const newAlert: PriceAlert = {
      id: Math.random().toString(36).substring(2, 9),
      productId,
      productName,
      oldPrice,
      newPrice,
      image,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Beautiful descriptive notification style with image inside toast
    haptics.success();
    sounds.success();
    toast.success(`🔥 Baisse de prix de ${Math.round(((oldPrice - newPrice) / oldPrice) * 100)}% !`, {
      description: `Le produit "${productName}" est maintenant à ${newPrice} $ (au lieu de ${oldPrice} $)`,
      duration: 6000,
    });
  };

  const markAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
    sounds.click();
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    sounds.click();
    toast.success('Historique des alertes effacé.');
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <PriceTrackerContext.Provider
      value={{
        trackedProductIds,
        alerts,
        toggleTracking,
        isTracking,
        addPriceAlert,
        markAllAlertsAsRead,
        clearAllAlerts,
        unreadCount,
      }}
    >
      {children}
    </PriceTrackerContext.Provider>
  );
};

export const usePriceTracker = () => {
  const context = useContext(PriceTrackerContext);
  if (context === undefined) {
    throw new Error('usePriceTracker must be used within a PriceTrackerProvider');
  }
  return context;
};
