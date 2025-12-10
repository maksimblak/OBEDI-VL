
import React from 'react';
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ } from '../data';

interface FAQModalProps {
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ onClose }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/5 bg-slate-900/95 backdrop-blur-xl flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Вопросы и ответы</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-6 space-y-4">
           {FAQ.map((item, index) => {
             const isOpen = openIndex === index;
             return (
               <div 
                 key={index}
                 className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                   isOpen 
                     ? 'bg-white/5 border-indigo-500/30' 
                     : 'bg-transparent border-white/5 hover:border-white/10'
                 }`}
               >
                 <button 
                   onClick={() => setOpenIndex(isOpen ? null : index)}
                   className="w-full flex items-center justify-between p-4 text-left font-medium text-white"
                 >
                   {item.q}
                   {isOpen ? <ChevronUp size={18} className="text-indigo-400" /> : <ChevronDown size={18} className="text-slate-500" />}
                 </button>
                 <div 
                   className={`px-4 text-sm text-slate-300 leading-relaxed transition-all duration-300 ease-in-out ${
                     isOpen ? 'max-h-48 pb-4 opacity-100' : 'max-h-0 opacity-0'
                   }`}
                 >
                   {item.a}
                 </div>
               </div>
             );
           })}
        </div>
        
        <div className="p-6 border-t border-white/5 bg-slate-900/95 text-center">
            <p className="text-slate-400 text-sm mb-4">Не нашли ответ на свой вопрос?</p>
            <a href="tel:+79025562853" className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition">
               Связаться с нами
            </a>
        </div>
      </div>
    </div>
  );
};
