import React from 'react';
import type { LegalTab } from './LegalInfo';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface PolicyLinkProps {
  /**
   * The legal tab to open (e.g. 'terms', 'privacy', 'refund', 'shipping', 'faq'...)
   * If provided, navigating to this will set view to 'legal' and active tab to this value.
   */
  tab?: LegalTab;
  
  /**
   * Alternatively, define a custom view identifier directly (e.g. 'contact', 'tracking', 'cooperatives'...)
   */
  view?: string;
  
  /**
   * Navigation handler to change views in App.tsx
   */
  setView: (view: any) => void;
  
  /**
   * Navigation handler to set the active tab inside LegalInfo
   */
  setLegalTab?: (tab: LegalTab) => void;
  
  /**
   * Standard and hovered Tailwind utility custom classes.
   * If omitted, defaults to "hover:text-brand cursor-pointer transition-colors"
   */
  className?: string;
  
  /**
   * Callback fired right before the route modification
   */
  onClickBefore?: () => void;
  
  /**
   * Children content (text, indicators, icons, etc.)
   */
  children: React.ReactNode;
}

export const PolicyLink: React.FC<PolicyLinkProps> = ({
  tab,
  view,
  setView,
  setLegalTab,
  className = 'hover:text-brand cursor-pointer transition-colors',
  onClickBefore,
  children,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Play subtle audio/haptics on interface links
    haptics.light();
    sounds.click();

    if (onClickBefore) {
      onClickBefore();
    }

    if (tab) {
      // Standard legal policy tab sequence
      if (setLegalTab) {
        setLegalTab(tab);
      }
      setView('legal');
    } else if (view) {
      // Direct custom workspace layout path
      setView(view);
    }
  };

  return (
    <span
      onClick={handleClick}
      className={className}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
    >
      {children}
    </span>
  );
};
