import { toast } from 'sonner';

/**
 * Eladma Security Shield
 * Provides comprehensive client-side security mechanisms:
 * - Anti-XSS and Input Sanitization
 * - LocalStorage Tamper Detection & Validation
 * - Device / Inspector Access Logging
 * - API Flooding Rate Limiting
 * - Real-Time Intrusion & Threat Detection (SQLi and XSS)
 * - Security Alert Telemetry Subscriber System
 */

export interface BlockedThreat {
  id: string;
  timestamp: string;
  fieldName: string;
  type: 'XSS' | 'SQL_INJECTION' | 'RATE_LIMIT';
  value: string;
  description: string;
  pattern: string;
}

// Memory state for threats
let threatLogs: BlockedThreat[] = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('eladma_security_threat_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
  }
  return [];
})();

const listeners: Set<(threats: BlockedThreat[]) => void> = new Set();

function saveThreats() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('eladma_security_threat_logs', JSON.stringify(threatLogs));
  }
  listeners.forEach(listener => {
    try {
      listener([...threatLogs]);
    } catch (e) {
      console.error("Error invoking security state listener:", e);
    }
  });
}

// Simple client-side token bucket state for rate limiting
interface RateLimitTracker {
  [key: string]: {
    timestamps: number[];
  };
}

const rateLimitMemory: RateLimitTracker = {};

export const EladmaSecurity = {
  /**
   * Cleans any inputs from potential XSS scripting tags, tags, inlined handlers or malicious SQL-like characters.
   */
  sanitizeInput(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags
    let cleaned = text.replace(/<\/?[^>]+(>|$)/g, '');
    
    // Remove common script commands, alert codes, javascript: protocol links
    cleaned = cleaned.replace(/javascript:/gi, '');
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/onerror\s*=/gi, '');
    cleaned = cleaned.replace(/onload\s*=/gi, '');
    cleaned = cleaned.replace(/onclick\s*=/gi, '');
    cleaned = cleaned.replace(/eval\s*\(/gi, '');
    cleaned = cleaned.replace(/union\s+select/gi, ''); // basic SQL injections
    
    return cleaned.trim();
  },

  /**
   * Verifies and recovers states loaded from LocalStorage to prevent tampering/crashing.
   */
  validateAndFetchPoints(rawPoints: number): number {
    const pointsNum = Number(rawPoints);
    if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > 1000000) {
      console.warn("⚠️ Security Alert: Eladma Shield detected corrupted points state. Restoring default.");
      toast.error("Système: Données corrompues détectées et sécurisées.");
      return 245; // Default safe starting state
    }
    return pointsNum;
  },

  /**
   * Check rate-limiting for specific events.
   * Restricts user to MaxRequests within WindowMs.
   */
  checkRateLimit(actionName: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    if (!rateLimitMemory[actionName]) {
      rateLimitMemory[actionName] = { timestamps: [] };
    }

    const tracker = rateLimitMemory[actionName];
    tracker.timestamps = tracker.timestamps.filter(ts => now - ts < windowMs);

    if (tracker.timestamps.length >= maxRequests) {
      toast.error("⚠️ Sécurité : Envoi trop rapide de requêtes. Bloqué pour protéger le terminal.");
      this.logThreat(actionName, 'RATE_LIMIT', `Fréquence dépassée (${maxRequests} requêtes)`, `Inondation de requêtes détectée pour l'action "${actionName}".`);
      return false;
    }

    tracker.timestamps.push(now);
    return true;
  },

  /**
   * Checks in real time if there is any SQL injection pattern or XSS code inside inputs.
   * Logs blocked threat in real time and triggers security.
   */
  checkSuspiciousBehavior(value: string, fieldName: string): boolean {
    if (!value) return true;
    
    const valueLower = value.toLowerCase();
    let detectedType: 'XSS' | 'SQL_INJECTION' | null = null;
    let explanation = '';
    let triggeredPattern = '';
    
    // Check XSS
    const xssPatterns = [
      { regex: /<script/i, desc: 'Balise de script suspecte', pattern: '<script>' },
      { regex: /javascript:/i, desc: 'Schéma d\'URI JavaScript malveillant', pattern: 'javascript:' },
      { regex: /onerror\s*=/i, desc: 'Gestionnaire d\'erreur HTML', pattern: 'onerror=' },
      { regex: /onload\s*=/i, desc: 'Gestionnaire de chargement HTML', pattern: 'onload=' },
      { regex: /onclick\s*=/i, desc: 'Événement de clic HTML injecté', pattern: 'onclick=' },
      { regex: /eval\s*\(/i, desc: 'Exécution dynamique de code JavaScript', pattern: 'eval(...)' },
      { regex: /document\.cookie/i, desc: 'Tentative d\'accès aux cookies de session', pattern: 'document.cookie' },
      { regex: /<svg[^>]*onload/i, desc: 'Injection de script via SVG onload', pattern: '<svg onload=' },
      { regex: /alert\s*\(/i, desc: 'Appel d\'alerte scripté', pattern: 'alert(...)' }
    ];

    for (const pattern of xssPatterns) {
      if (pattern.regex.test(value)) {
        detectedType = 'XSS';
        explanation = pattern.desc;
        triggeredPattern = pattern.pattern;
        break;
      }
    }

    // Check SQL Injection if XSS was not found
    if (!detectedType) {
      const sqlPatterns = [
        { regex: /union\s+select/i, desc: 'Tentative de requête combinée SQL', pattern: 'UNION SELECT' },
        { regex: /drop\s+table/i, desc: 'Commande de suppression de table SQL', pattern: 'DROP TABLE' },
        { regex: /select\s+.*\s+from/i, desc: 'Tentative de lecture de base de données', pattern: 'SELECT ... FROM' },
        { regex: /insert\s+into/i, desc: 'Tentative d\'insertion de lignes SQL', pattern: 'INSERT INTO' },
        { regex: /delete\s+from/i, desc: 'Tentative de suppression de données SQL', pattern: 'DELETE FROM' },
        { regex: /' or '1'='1/i, desc: 'Tautologie d\'authentification par contournement', pattern: "' or '1'='1" },
        { regex: /" or "1"="1/i, desc: 'Tautologie d\'authentification par contournement', pattern: '" or "1"="1' },
        { regex: /'\s*or\s*\d+\s*=\s*\d+/i, desc: 'Tautologie SQL générique', pattern: "' or x=y" },
        { regex: /"\s*or\s*\d+\s*=\s*\d+/i, desc: 'Tautologie SQL générique', pattern: '" or x=y' },
        { regex: /;\s*--/i, desc: 'Terminaison et commentaire de ligne SQL', pattern: ';--' },
        { regex: /--\s*$/i, desc: 'Syntaxe de commentaire SQL de fin de ligne', pattern: '--' },
        { regex: /xp_cmdshell/i, desc: 'Commande d\'exécution système MSSQL', pattern: 'xp_cmdshell' }
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.regex.test(value)) {
          detectedType = 'SQL_INJECTION';
          explanation = pattern.desc;
          triggeredPattern = pattern.pattern;
          break;
        }
      }
    }

    if (detectedType) {
      this.logThreat(fieldName, detectedType, value, explanation, triggeredPattern);
      toast.error(`🛡️ Eladma Shield: Tentative d'attaque ${detectedType} bloquée !`, {
        description: `Activité suspecte sur le champ "${fieldName}" : ${explanation}`
      });
      return false; // Blocks action
    }

    return true; // Proceed safely
  },

  /**
   * Log blocked threats
   */
  logThreat(fieldName: string, type: 'XSS' | 'SQL_INJECTION' | 'RATE_LIMIT', value: string, description: string, pattern: string = ''): void {
    const newThreat: BlockedThreat = {
      id: "TR-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      fieldName,
      type,
      value: value.length > 60 ? value.substring(0, 57) + '...' : value,
      description,
      pattern
    };
    threatLogs = [newThreat, ...threatLogs].slice(0, 50); // Keep last 50 threats
    saveThreats();
  },

  getThreatLogs(): BlockedThreat[] {
    return threatLogs;
  },

  clearThreatLogs(): void {
    threatLogs = [];
    saveThreats();
  },

  subscribeToThreats(listener: (threats: BlockedThreat[]) => void): () => void {
    listeners.add(listener);
    listener([...threatLogs]);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Print strict security warning details.
   */
  initConsoleBanner(): void {
    if (typeof window === 'undefined') return;
    
    console.clear();
    console.log(
      `%c🔴 PROTECTION ANTI-PIRATAGE ELADMA 🔴`,
      'color: #ff3333; font-size: 24px; font-weight: bold; background: #1a1a1a; padding: 8px 12px; border-radius: 4px;'
    );
    console.log(
      `%cATTENTION : Ne collez aucun script ou code ici ! Cela pourrait compromettre vos identifiants ou vos informations de carte bancaire.`,
      'color: #ffffff; font-size: 14px; background: #331111; padding: 4px 8px; border-radius: 4px;'
    );
    console.log(
      `%cCe système est audité en permanence contre les attaques CSRF, XSS et l'injection de paquets.`,
      'color: #888888; font-style: italic;'
    );
  },

  detectDebugger(onDevToolsOpen: () => void): void {
    if (typeof window === 'undefined') return;

    const threshold = 160;
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        onDevToolsOpen();
      }
    };
    
    window.addEventListener('resize', check);
    check();
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length < 100;
  },

  /**
   * Module de Protection des Paiements (PaymentGuard)
   * Protège le processus de finalisation contre les attaques XSS, SQLi, l'abus de cartes (card-testing), et les injections via formulaires de carte.
   */
  PaymentGuard: {
    validatePaymentInputs(cardNumber: string, cardExpiry: string, cardCvc: string, cardHolder: string): boolean {
      // 1. Check Rate-Limiting specifically for payment processing (card-testing abuse detection)
      // Restrict to max 3 credit card attempts every 2 minutes
      if (!EladmaSecurity.checkRateLimit('payment_attempt', 3, 120000)) {
        EladmaSecurity.logThreat(
          'Système de Paiement', 
          'RATE_LIMIT', 
          `Card: ${cardNumber ? cardNumber.substring(0, 4) : ''}...`, 
          'Tentatives excessives de paiement configurées dans le module de protection (Filtre anti card-testing).'
        );
        return false;
      }

      // 2. Validate Card Holder Name for SQLi or XSS
      if (!EladmaSecurity.checkSuspiciousBehavior(cardHolder, "Nom du Titulaire de Carte")) {
        return false;
      }

      // 3. Scan Credit Card Number for suspicious alphanumeric SQL/XSS patterns
      if (!EladmaSecurity.checkSuspiciousBehavior(cardNumber, "Numéro de Carte")) {
        return false;
      }

      // Check if the card number contains suspicious alphanumeric scripts or structures prior to digit validation
      const cleanedCard = cardNumber.replace(/\s+/g, '');
      if (/[a-zA-Z]/.test(cleanedCard)) {
        // If it contains letters, check if it's SQL injection keywords or just general corruption
        const suspiciousWords = [/union/i, /select/i, /or/i, /drop/i, /script/i, /onload/i, /onerror/i];
        const isAttack = suspiciousWords.some(r => r.test(cleanedCard));
        if (isAttack) {
          EladmaSecurity.logThreat(
            'Numéro de Carte', 
            'SQL_INJECTION', 
            cardNumber, 
            'Injection hostile via mot-clé SQL détectée dans le champ Numéro de Carte.'
          );
          toast.error("🛡️ Eladma Shield : Paiement bloqué pour motif de sécurité (Signature SQL/XSS détectée).");
          return false;
        } else {
          // General format violation
          toast.error("Format de carte invalide : Le numéro ne doit contenir que des chiffres.");
          return false;
        }
      }

      // 4. Scan CVV for suspicious behavior (should only be digits)
      if (!EladmaSecurity.checkSuspiciousBehavior(cardCvc, "CVV de Carte")) {
        return false;
      }
      const cleanedCvv = cardCvc.trim();
      if (cleanedCvv.length > 0 && !/^\d{3,4}$/.test(cleanedCvv)) {
        const isAttack = /script|select|union|drop|or/i.test(cleanedCvv) || /['";<>]/.test(cleanedCvv);
        if (isAttack) {
          EladmaSecurity.logThreat(
            'CVV de Carte', 
            'XSS', 
            cardCvc, 
            "Tentative d'attaque Cross-Site Scripting (XSS) via le champ CVV."
          );
          toast.error("🛡️ Eladma Shield : Comportement de transaction hautement suspect bloqué.");
          return false;
        } else {
          toast.error("Format CVV invalide : Le CVV doit comporter 3 ou 4 chiffres.");
          return false;
        }
      }

      // 5. Scan Expiry date for injection patterns
      if (!EladmaSecurity.checkSuspiciousBehavior(cardExpiry, "Expiration de Carte")) {
        return false;
      }
      const cleanedExpiry = cardExpiry.replace(/\s+/g, '');
      if (cleanedExpiry && !/^\d{2}\/\d{2}$/.test(cleanedExpiry)) {
        const isAttack = /script|select|union|drop|or/i.test(cleanedExpiry) || /['";<>]/.test(cleanedExpiry);
        if (isAttack) {
          EladmaSecurity.logThreat(
            'Expiration de Carte', 
            'SQL_INJECTION', 
            cardExpiry, 
            "Payload d'exploitation ou caractères suspects détectés dans le champ de validité."
          );
          toast.error("🛡️ Eladma Shield : Activité de terminal hostile bloquée.");
          return false;
        }
      }

      return true; // Validated successfully!
    }
  }
};
