
import React, { useState, useEffect, useRef } from 'react';
import { Dices, X, Sparkles, Plus, RefreshCw, ShoppingBag } from 'lucide-react';
import { MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface LunchRouletteProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddToCart: (items: MenuItem[]) => void;
}

export const LunchRoulette: React.FC<LunchRouletteProps> = ({ isOpen, onClose, menuItems, onAddToCart }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<MenuItem[]>([]);
  
  // Categorize items
  const soups = menuItems.filter(i => i.category === 'lunch' && (i.title.toLowerCase().includes('суп') || i.title.toLowerCase().includes('борщ') || i.title.toLowerCase().includes('том')));
  const mains = menuItems.filter(i => i.category === 'lunch' && !soups.includes(i));
  const drinks = menuItems.filter(i => i.category === 'extras' || i.category === 'catering');

  // Fallback if categories are empty (use all items)
  const pool1 = soups.length ? soups : menuItems;
  const pool2 = mains.length ? mains : menuItems;
  const pool3 = drinks.length ? drinks : menuItems;

  const [slot1, setSlot1] = useState(pool1[0]);
  const [slot2, setSlot2] = useState(pool2[0]);
  const [slot3, setSlot3] = useState(pool3[0]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult([]);

    let step = 0;
    const maxSteps = 20;
    const interval = setInterval(() => {
      setSlot1(pool1[Math.floor(Math.random() * pool1.length)]);
      setSlot2(pool2[Math.floor(Math.random() * pool2.length)]);
      setSlot3(pool3[Math.floor(Math.random() * pool3.length)]);
      
      step++;
      if (step >= maxSteps) {
        clearInterval(interval);
        finalize();
      }
    }, 100);
  };

  const finalize = () => {
    const final1 = pool1[Math.floor(Math.random() * pool1.length)];
    const final2 = pool2[Math.floor(Math.random() * pool2.length)];
    const final3 = pool3[Math.floor(Math.random() * pool3.length)];
    
    setSlot1(final1);
    setSlot2(final2);
    setSlot3(final3);
    setResult([final1, final2, final3]);
    setIsSpinning(false);
  };

  useEffect(() => {
    if (isOpen && result.length === 0) {
        // Initial spin when opened if empty
        // spin(); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPrice = (slot1?.price || 0) + (slot2?.price || 0) + (slot3?.price || 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-slate-900 border border-fuchsia-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(192,38,211,0.2)] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Decorative Neon Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent shadow-[0_0_10px_#d946ef]"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition">
           <X size={24} />
        </button>

        <div className="p-8 text-center relative z-10">
           <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles size={14} /> Испытай удачу
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-white mb-2 uppercase italic tracking-wider">
             Гастро <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">Рулетка</span>
           </h2>
           <p className="text-slate-400 mb-8">Не знаете что выбрать? Доверьтесь случаю!</p>

           {/* Slots Container */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[slot1, slot2, slot3].map((item, idx) => (
                 <div key={idx} className="relative group h-64 bg-slate-800 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner">
                    <div className={`w-full h-full transition-all duration-100 ${isSpinning ? 'blur-sm scale-110' : 'blur-0 scale-100'}`}>
                        {item && (
                           <>
                             <img 
                               src={item.image} 
                               alt={item.title} 
                               onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = FALLBACK_IMAGE;
                                  target.onerror = null;
                               }}
                               className="w-full h-full object-cover" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                                <div className="text-fuchsia-300 text-xs font-bold mb-1 uppercase tracking-wider">
                                    {idx === 0 ? 'Первое' : idx === 1 ? 'Второе' : 'Напиток'}
                                </div>
                                <div className="text-white font-bold leading-tight">{item.title}</div>
                                <div className="text-slate-400 text-sm mt-1">{item.price} ₽</div>
                             </div>
                           </>
                        )}
                    </div>
                    {/* Highlight line */}
                    <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-2xl transition-all pointer-events-none"></div>
                 </div>
              ))}
           </div>

           {/* Controls */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={spin}
                disabled={isSpinning}
                className={`px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider flex items-center gap-3 transition-all transform ${
                   isSpinning 
                   ? 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95' 
                   : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)]'
                }`}
              >
                 <RefreshCw size={24} className={isSpinning ? 'animate-spin' : ''} />
                 {isSpinning ? 'Крутим...' : 'Крутить'}
              </button>

              {!isSpinning && result.length > 0 && (
                 <button 
                   onClick={() => { onAddToCart(result); onClose(); }}
                   className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg flex items-center gap-3 transition-all"
                 >
                    <ShoppingBag size={24} />
                    Забрать за {totalPrice} ₽
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
