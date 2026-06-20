import React from 'react';
import { Home, ChevronRight, Search, Tag, ShoppingBag, Truck, Award, Shield, User, Mail, Landmark } from 'lucide-react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { Category } from '../types';

interface BreadcrumbsProps {
  view: string;
  activeCategory: Category;
  searchQuery: string;
  onNavigate: (view: any) => void;
  onSelectCategory: (category: Category) => void;
  onClearSearch: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  view,
  activeCategory,
  searchQuery,
  onNavigate,
  onSelectCategory,
  onClearSearch,
}) => {
  // Navigation triggering logic with sound & haptics feedback
  const handleHomeClick = () => {
    haptics.light();
    sounds.select();
    onNavigate('home');
    onSelectCategory('All');
    onClearSearch();
  };

  const handleCategoryClick = () => {
    haptics.light();
    sounds.select();
    onNavigate('home');
    onClearSearch();
  };

  // Build the list of breadcrumb segments dynamically
  const segments = [];

  // Home segment is always present as the root
  segments.push({
    id: 'home',
    label: 'Accueil',
    icon: Home,
    onClick: handleHomeClick,
    current: view === 'home' && activeCategory === 'All' && !searchQuery,
  });

  if (view === 'home') {
    if (activeCategory !== 'All') {
      segments.push({
        id: 'category',
        label: activeCategory,
        icon: Tag,
        onClick: handleCategoryClick,
        current: !searchQuery,
      });
    }

    if (searchQuery) {
      segments.push({
        id: 'search',
        label: `Recherche: "${searchQuery}"`,
        icon: Search,
        onClick: undefined,
        current: true,
      });
    }
  } else {
    // Other top-level views inside the applet
    let label = '';
    let icon = ShoppingBag;

    switch (view) {
      case 'catalog':
        label = 'Catalogue';
        icon = ShoppingBag;
        break;
      case 'catalog-structure':
        label = 'Architecture & Moteur de Recherche';
        icon = Landmark;
        break;
      case 'checkout':
        label = 'Caisse et Paiement';
        icon = Tag;
        break;
      case 'tracking':
        label = 'Suivi Expédition';
        icon = Truck;
        break;
      case 'rewards':
        label = 'Club Privé Eladma';
        icon = Award;
        break;
      case 'supplier':
        label = 'Boutiques Partenaires';
        icon = Landmark;
        break;
      case 'cooperatives':
        label = 'Nos Coopératives RDC';
        icon = Landmark;
        break;
      case 'profile':
        label = 'Profil Eladma Guard';
        icon = User;
        break;
      case 'contact':
        label = 'Portail Assistance Cliente';
        icon = Mail;
        break;
      default:
        label = view.charAt(0).toUpperCase() + view.slice(1);
    }

    segments.push({
      id: 'view',
      label,
      icon,
      onClick: undefined,
      current: true,
    });
  }

  // Do not render breadcrumbs when on simple home page without searches/filters (to match aesthetic negative space guidelines)
  if (segments.length <= 1) return null;

  return (
    <div id="navigation-breadcrumbs" className="w-full bg-zinc-50/50 dark:bg-zinc-950/20 py-3.5 border-b border-zinc-100 dark:border-zinc-900 transition-colors">
      <div className="container mx-auto px-4">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 font-semibold" aria-label="Fil d'Ariane">
          {segments.map((segment, index) => {
            const IsLast = index === segments.length - 1;
            const SegmentIcon = segment.icon;

            return (
              <React.Fragment key={segment.id}>
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0 select-none block" />
                )}

                <div className="flex items-center gap-1.5">
                  {segment.onClick && !segment.current ? (
                    <button
                      onClick={segment.onClick}
                      className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand dark:hover:text-brand hover:underline font-bold transition-all uppercase tracking-wider text-[10px] cursor-pointer"
                    >
                      <SegmentIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span>{segment.label}</span>
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] ${
                        segment.current 
                          ? 'text-brand font-black' 
                          : 'text-zinc-400'
                      }`}
                    >
                      <SegmentIcon className="w-3.5 h-3.5 shrink-0 text-current" />
                      <span>{segment.label}</span>
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
