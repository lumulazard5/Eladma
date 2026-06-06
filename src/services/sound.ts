/**
 * Eladma Synthesized Audio Feedback Service
 * Uses standard Web Audio API to generate custom, high-fidelity UI sounds.
 * Avoids any assets download/loading delays. Perfect for low-bandwidth mobile environments in RDC.
 * Respects user preferences.
 */
class SoundService {
  private isEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('eladma_sounds');
      if (savedPref !== null) {
        this.isEnabled = savedPref === 'true';
      } else {
        // Safe default: enabled unless reduced-motion is preferred
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isEnabled = !prefersReducedMotion;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      } catch (err) {
        console.warn('AudioContext not supported in this browser.', err);
      }
    }
    return this.audioCtx;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('eladma_sounds', this.isEnabled ? 'true' : 'false');
    }
    return this.isEnabled;
  }

  public getStatus(): boolean {
    return this.isEnabled;
  }

  /**
   * Universal audio play helper that generates clean synth clicks
   */
  private playTone(freqs: number[], duration: number, type: OscillatorType = 'sine', slide = false) {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Resume context if suspended (common in browsers until user gesture)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Simple amplitude envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02); // gentle volume

      if (freqs.length === 1) {
        osc.frequency.setValueAtTime(freqs[0], now);
      } else if (freqs.length > 1) {
        if (slide) {
          osc.frequency.setValueAtTime(freqs[0], now);
          osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
        } else {
          // Play sequence
          freqs.forEach((f, i) => {
            const stepTime = now + (i * (duration / freqs.length));
            osc.frequency.setValueAtTime(f, stepTime);
          });
        }
      }

      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      console.debug('Tone playing skipped:', e);
    }
  }

  /**
   * Light click sound (e.g. key press or option change)
   */
  public click() {
    this.playTone([600], 0.05, 'sine');
  }

  /**
   * Soft confirm sound (e.g. checkbox selected)
   */
  public select() {
    this.playTone([480, 720], 0.1, 'sine');
  }

  /**
   * Heavy interaction (e.g. open panel, search results loaded)
   */
  public open() {
    this.playTone([320, 500, 680], 0.18, 'sine');
  }

  /**
   * Immersive cooperative story open sound
   */
  public ambientChime() {
    this.playTone([260, 390, 520, 650], 0.6, 'triangle');
  }

  /**
   * Success sound (add to cart, order created)
   */
  public success() {
    this.playTone([523.25, 659.25, 783.99, 1046.50], 0.25, 'sine');
  }

  /**
   * Alert or limitation triggered
   */
  public warning() {
    this.playTone([300, 200], 0.3, 'sawtooth');
  }

  /**
   * Security block or error occurred
   */
  public error() {
    this.playTone([180, 150, 110], 0.5, 'sawtooth');
  }
}

export const sounds = new SoundService();
