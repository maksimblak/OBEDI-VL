import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Plus, ChefHat } from 'lucide-react';
import { getChefRecommendation } from '../services/geminiService';
import { ChatMessage, MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface AIChefProps {
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

const QUICK_PROMPTS = [
  "Что посоветуешь на обед?",
  "Есть что-то легкое до 400 ккал?",
  "Хочу суп",
  "Что самое популярное?",
  "Хочу сладкого"
];

export const AIChef: React.FC<AIChefProps> = ({ menuItems, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я Шеф Алекс. Не знаете, что выбрать на обед? Я помогу подобрать блюдо по вкусу или калориям!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out internal tags from history before sending to API
      const history = messages.map(m => ({ 
        role: m.role, 
        text: m.text.replace(/\|\|REC_ID:.*?\|\|/g, '') 
      }));
      
      const responseText = await getChefRecommendation(userMsg.text, history, menuItems);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Упс, связь с кухней прервалась. Повторите?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse the message and extract the hidden ID
  const parseMessage = (content: string) => {
    const idMatch = content.match(/\|\|REC_ID:(.*?)\|\|/);
    const recommendedId = idMatch ? idMatch[1] : null;
    const cleanText = content.replace(/\|\|REC_ID:.*?\|\|/g, '').trim();
    
    const recommendedItem = recommendedId ? menuItems.find(i => i.id === recommendedId) : null;

    return { cleanText, recommendedItem };
  };

  return (
    <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 z-[60] flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 sm:mb-6 w-[90vw] sm:w-96 h-[500px] glass bg-slate-900/95 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col transition-all duration-300 origin-bottom-right animate-in fade-in slide-in-from-bottom-10 backdrop-blur-xl">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm shadow-inner">
                <ChefHat size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Шеф Алекс</h3>
                <p className="text-[10px] text-indigo-100/80 uppercase tracking-wider font-semibold">AI Помощник</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
            {messages.map((msg, idx) => {
              const { cleanText, recommendedItem } = parseMessage(msg.text);

              return (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Text Bubble */}
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm mb-2 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm backdrop-blur-md'
                  }`}>
                    {cleanText}
                  </div>

                  {/* Recommendation Card (if present) */}
                  {msg.role === 'model' && recommendedItem && (
                     <div className="max-w-[85%] bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-lg animate-in zoom-in-95 duration-300">
                        <div className="h-24 relative">
                           <img 
                              src={recommendedItem.image} 
                              alt={recommendedItem.title} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = FALLBACK_IMAGE;
                                target.onerror = null;
                              }}
                              className="w-full h-full object-cover"
                           />
                           <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold text-white">
                             {recommendedItem.price} ₽
                           </div>
                        </div>
                        <div className="p-3">
                           <div className="font-bold text-white text-sm mb-1 line-clamp-1">{recommendedItem.title}</div>
                           <div className="text-xs text-slate-400 mb-3 line-clamp-2">{recommendedItem.description}</div>
                           <button 
                             onClick={() => onAddToCart(recommendedItem)}
                             className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                           >
                             <Plus size={14} /> В корзину
                           </button>
                        </div>
                     </div>
                  )}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  <span className="text-xs text-slate-400 mr-2">Шеф думает</span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (Horizontal Scroll) */}
          {!isLoading && messages.length < 10 && (
             <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-200 text-slate-400 text-xs rounded-full transition-all"
                  >
                    {prompt}
                  </button>
                ))}
             </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-white/5 flex gap-2 bg-black/40 backdrop-blur-md">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Спросите про меню..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none placeholder:text-slate-600 transition-all"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-full animate-pulse-slow blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-slate-900 rounded-full shadow-xl border border-white/20 overflow-hidden">
            {/* Inner Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
            
            {isOpen ? (
                <X size={28} className="text-white relative z-10" />
            ) : (
                <div className="relative z-10 flex items-center justify-center">
                    <ChefHat size={28} className="text-white" />
                </div>
            )}
        </div>
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-bounce"></span>
        )}
      </button>
    </div>
  );
};