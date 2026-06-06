import React from 'react';
import { Home, Gift, BookOpen, User, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  const tabs = [
    { id: 'home', label: 'Boutique', icon: Home },
    { id: 'categories', label: 'Rayons', icon: LayoutGrid },
    { id: 'catalog', label: 'Catalogue', icon: BookOpen },
    { id: 'rewards', label: 'Cadeaux', icon: Gift },
    { id: 'profile', label: 'Moi', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-100 dark:border-zinc-800 px-2 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.light();
                sounds.click();
                onViewChange(tab.id);
              }}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 group"
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-brand scale-110' : 'text-zinc-400'}`}>
                <tab.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-brand' : 'text-zinc-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-brand rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
