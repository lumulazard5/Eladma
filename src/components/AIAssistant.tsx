import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchAssistant } from '../services/gemini';
import { Product } from '../types';
import { EladmaSecurity } from '../services/security';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, products }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Bonjour ! Je suis votre assistant Eladma. Comment puis-je vous aider aujourd\'hui ?', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // 1. Check Rate Limiter (Max 10 messages per minute in the AI assistant)
    if (!EladmaSecurity.checkRateLimit('ai_chat_message', 10, 60000)) {
      haptics.warning();
      sounds.warning();
      return;
    }

    // 2. Sanitize query inputs or prompt hacks
    const sanitizedInput = EladmaSecurity.sanitizeInput(trimmedInput);
    if (!sanitizedInput) {
      haptics.error();
      sounds.error();
      setInput('');
      return;
    }

    haptics.light();
    sounds.click();

    const userMsg: Message = { id: Date.now().toString(), text: sanitizedInput, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await searchAssistant(sanitizedInput, products);
      haptics.medium();
      sounds.select();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      haptics.error();
      sounds.error();
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              haptics.light();
              sounds.click();
              onClose();
            }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:right-8 md:bottom-8 md:w-[400px] md:h-[600px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl z-[90] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="p-4 bg-brand text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold">Assistant Eladma</h2>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Propulsé par Gemini</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  haptics.light();
                  sounds.click();
                  onClose();
                }} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand text-white rounded-tr-none' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 shadow-sm border border-zinc-100 dark:border-zinc-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Posez une question..."
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-brand/20 transition-all outline-none text-sm dark:text-white"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand text-white rounded-lg disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
