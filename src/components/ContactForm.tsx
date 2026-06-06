import React, { useState } from 'react';
import { Mail, MessageSquare, Send, User, Phone, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { EladmaSecurity } from '../services/security';

export const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Check Rate Limiting for contact form submission (max 3 submissions per minute)
    if (!EladmaSecurity.checkRateLimit('contact_form_submit', 3, 60000)) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    const rawName = formData.get('userName') as string || '';
    const rawEmail = formData.get('userEmail') as string || '';
    const rawSubject = formData.get('subject') as string || '';
    const rawMessage = formData.get('message') as string || '';

    // 2. Sanitize user inputs thoroughly using Eladma Security Shield
    const sanitizedName = EladmaSecurity.sanitizeInput(rawName);
    const sanitizedEmail = EladmaSecurity.sanitizeInput(rawEmail).trim();
    const sanitizedSubject = EladmaSecurity.sanitizeInput(rawSubject);
    const sanitizedMessage = EladmaSecurity.sanitizeInput(rawMessage);

    if (!sanitizedName || !sanitizedEmail || !sanitizedSubject || !sanitizedMessage) {
      toast.error('⚠️ Sécurité: Données invalides ou scripts malveillants bloqués.');
      return;
    }

    // 3. Strict format email validation
    if (!EladmaSecurity.isValidEmail(sanitizedEmail)) {
      toast.error('⚠️ Sécurité: Format d’adresse e-mail invalide.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call with sanitized parameters
    setTimeout(() => {
      toast.success('Message envoyé !', {
        description: 'Nous vous répondrons par e-mail dans les plus brefs délais.',
      });
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Une question sur une commande ? Une suggestion pour notre assistant IA ? 
          Notre équipe est là pour vous aider.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">E-mail</h3>
              <p className="text-zinc-500">contact@eladma.com</p>
              <p className="text-zinc-500 text-sm italic">Soutien 24/7</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Téléphone</h3>
              <p className="text-zinc-500">+33 1 23 45 67 89</p>
              <p className="text-zinc-500 text-sm">Lun - Ven, 9h - 18h</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Siège Social</h3>
              <p className="text-zinc-500">123 Rue du Commerce</p>
              <p className="text-zinc-500">75015 Paris, France</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  <input 
                    type="text" 
                    required
                    name="userName"
                    placeholder="Jean Dupont"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-brand/20 transition-all outline-none dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                  <input 
                    type="email" 
                    required
                    name="userEmail"
                    placeholder="jean@example.com"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-brand/20 transition-all outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Sujet</label>
              <input 
                type="text" 
                required
                name="subject"
                placeholder="Comment pouvons-nous vous aider ?"
                className="w-full h-12 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-brand/20 transition-all outline-none dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Message</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                <textarea 
                  required
                  name="message"
                  rows={5}
                  placeholder="Écrivez votre message ici..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-brand/20 transition-all outline-none resize-none dark:text-white"
                ></textarea>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Envoyer le message
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
