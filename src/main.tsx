import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { PriceTrackerProvider } from './context/PriceTrackerContext';
import { CompareProvider } from './context/CompareContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <CurrencyProvider>
        <FavoritesProvider>
          <PriceTrackerProvider>
            <CompareProvider>
              <Toaster position="top-center" richColors />
              <App />
            </CompareProvider>
          </PriceTrackerProvider>
        </FavoritesProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </StrictMode>,
);

// Enregistrement du Service Worker pour le support PWA Hors-ligne
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Eladma Service Worker enregistré avec succès sur le scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Échec de l\'enregistrement du Service Worker d\'Eladma:', error);
      });
  });
} else if ('serviceWorker' in navigator) {
  // Toujours tenter d'enregistrer en développement pour les tests locaux d'aperçu
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Eladma Service Worker enregistré en mode developpement:', registration.scope);
      })
      .catch((error) => {
        console.warn('Erreur Service Worker (dev):', error);
      });
  });
}

