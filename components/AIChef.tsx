import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { getChefRecommendation } from '../services/geminiService';
import { ChatMessage } from '../types';

export const AIChef: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Привет! Я Шеф Алекс. Не знаете, что выбрать на обед? Я помогу!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await getChefRecommendation(userMsg.text, history);
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'Упс, связь с кухней прервалась. Повторите?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-6 w-80 sm:w-96 glass bg-slate-900/90 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col transition-all duration-300 origin-bottom-right animate-in fade-in slide-in-from-bottom-10 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full text-white backdrop-blur-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Шеф-Помощник</h3>
                <p className="text-xs text-indigo-100/80">Gemini AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm backdrop-blur-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/5 flex gap-2 bg-black/20">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Посоветуй обед..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none placeholder:text-slate-500 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button with Magic Glow */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:scale-105"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-600 rounded-full animate-pulse-slow blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-xl border border-white/20">
            {isOpen ? <X size={28} className="text-white" /> : <MessageCircle size={28} className="text-white" />}
        </div>
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-bounce"></span>
        )}
      </button>
    </div>
  );
};