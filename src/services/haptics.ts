/**
 * Eladma Haptic Feedback Service
 * Uses browser Vibration API to trigger physical pulses for interactions.
 * Respects user settings and system accessibility preferences (e.g., prefers-reduced-motion).
 */
class HapticsService {
  private isEnabled: boolean = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      // Respect standard system preferences: disable vibrations if prefers-reduced-motion is active
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Load user choice, fallback to system behavior (enabled unless reduced motion is active)
      const savedPref = localStorage.getItem('eladma_haptics');
      if (savedPref !== null) {
        this.isEnabled = savedPref === 'true';
      } else {
        this.isEnabled = !prefersReducedMotion;
      }

      // Automatically listen to shifts in reduced motion accessibility preferences
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const listener = (e: MediaQueryListEvent) => {
          if (localStorage.getItem('eladma_haptics') === null) {
            this.isEnabled = !e.matches;
          }
        };
        mediaQuery.addEventListener('change', listener);
      } catch (err) {
        console.warn('Failed to bind dynamic media query listener for reduced motion:', err);
      }
    }
  }

  /**
   * Toggles haptic feedback setting in application state and persists it.
   */
  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('eladma_haptics', this.isEnabled ? 'true' : 'false');
    }
    return this.isEnabled;
  }

  /**
   * Returns current active status of haptics
   */
  public getStatus(): boolean {
    return this.isEnabled;
  }

  /**
   * Verifies browser compatibility
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Internal generic execution with safety guards
   */
  private vibrate(pattern: number | number[]) {
    if (!this.isEnabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Suppress silent failures due to lack of active user gesture or hardware absence
      console.debug('Haptics vibration skipped or blocked:', e);
    }
  }

  /**
   * Light feedback - click or toggle change
   */
  public light() {
    this.vibrate(15);
  }

  /**
   * Medium feedback - card selection or filter option activation
   */
  public medium() {
    this.vibrate(30);
  }

  /**
   * Heavy feedback - opening modal panels or triggering heavy processes
   */
  public heavy() {
    this.vibrate(60);
  }

  /**
   * Success feedback - validation complete, item added successfully
   */
  public success() {
    this.vibrate([40, 60, 40]);
  }

  /**
   * Warning feedback - alert or prompt requiring confirmation
   */
  public warning() {
    this.vibrate([80, 50, 80]);
  }

  /**
   * Error feedback - security blocker or transaction failure
   */
  public error() {
    this.vibrate([100, 50, 100, 50, 150]);
  }
}

export const haptics = new HapticsService();
