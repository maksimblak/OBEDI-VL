import React, { useState } from 'react';
import { X, ChevronRight, Check, Utensils, Coffee, Soup } from 'lucide-react';
import { MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface LunchConstructorProps {
  onClose: () => void;
  onAddToCart: (items: MenuItem[]) => void;
  allItems: MenuItem[];
}

export const LunchConstructor: React.FC<LunchConstructorProps> = ({ onClose, onAddToCart, allItems }) => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<{ [key: number]: MenuItem | null }>({
    0: null, // Soup
    1: null, // Main
    2: null  // Drink
  });

  // Mock data filtering for the constructor demo
  const steps = [
    { 
      id: 0, 
      title: 'Выберите суп', 
      icon: <Soup size={20} />, 
      items: allItems.filter(i => i.category === 'lunch').slice(0, 3) 
    },
    { 
      id: 1, 
      title: 'Основное блюдо', 
      icon: <Utensils size={20} />, 
      items: allItems.filter(i => i.category === 'lunch' || i.category === 'pies').slice(0, 3) 
    },
    { 
      id: 2, 
      title: 'Напиток', 
      icon: <Coffee size={20} />, 
      items: allItems.filter(i => i.category === 'catering').slice(0, 3) // Using catering as placeholder for drinks
    },
  ];

  const handleSelect = (item: MenuItem) => {
    setSelections(prev => ({ ...prev, [step]: item }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Finish
      const itemsToAdd = Object.values(selections).filter((i): i is MenuItem => i !== null);
      onAddToCart(itemsToAdd);
      onClose();
    }
  };

  const currentStepData = steps[step];
  const currentSelection = selections[step];
  // Explicitly type sum as number to avoid 'unknown' type inference error
  const totalPrice = Object.values(selections).reduce((sum: number, item) => sum + ((item as MenuItem | null)?.price || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Sidebar / Progress */}
        <div className="w-full md:w-1/3 bg-surface p-8 border-r border-white/5 flex flex-col relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>

            <h2 className="text-2xl font-bold text-white mb-2">Конструктор Ланча</h2>
            <p className="text-slate-400 text-sm mb-8">Соберите свой идеальный обед за 3 шага.</p>

            <div className="space-y-6 relative z-10">
              {steps.map((s, idx) => (
                <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${idx === step ? 'opacity-100 scale-105' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    idx === step ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 
                    selections[idx] ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {selections[idx] ? <Check size={18} /> : s.icon}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">Шаг {idx + 1}</div>
                    <div className="font-medium text-white">{s.title}</div>
                    {selections[idx] && <div className="text-xs text-indigo-300 mt-1 truncate max-w-[150px]">{selections[idx]?.title}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-400">Итого:</span>
                <span className="text-3xl font-bold text-white">{totalPrice} ₽</span>
              </div>
              <button 
                onClick={handleNext}
                disabled={!currentSelection}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === steps.length - 1 ? 'В корзину' : 'Далее'} <ChevronRight size={18} />
              </button>
            </div>
        </div>

        {/* Main Selection Area */}
        <div className="w-full md:w-2/3 p-8 bg-dark/50 overflow-y-auto relative">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition z-20">
             <X size={20} />
           </button>

           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             {currentStepData.title}
             <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20 ml-2">
               {currentStepData.items.length} вариантов
             </span>
           </h3>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
             {currentStepData.items.map((item) => (
               <div 
                 key={item.id}
                 onClick={() => handleSelect(item)}
                 className={`group cursor-pointer relative rounded-2xl overflow-hidden border transition-all duration-300 ${
                   currentSelection?.id === item.id 
                     ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5' 
                     : 'border-white/10 bg-surface/50 hover:border-white/20 hover:bg-surface'
                 }`}
               >
                 <div className="h-40 overflow-hidden relative">
                   <img 
                      src={item.image} 
                      alt={item.title} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = FALLBACK_IMAGE;
                        target.onerror = null;
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                   {currentSelection?.id === item.id && (
                     <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center backdrop-blur-[2px]">
                       <div className="bg-white text-indigo-600 rounded-full p-2 shadow-lg">
                         <Check size={24} strokeWidth={3} />
                       </div>
                     </div>
                   )}
                 </div>
                 <div className="p-4">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                     <span className="font-semibold text-indigo-300">{item.price} ₽</span>
                   </div>
                   <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
};