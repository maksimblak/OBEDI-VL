import React from 'react';
import { X, ShoppingBag, Flame, Zap, Droplet, Wheat } from 'lucide-react';
import { MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface ProductModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-surface border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 flex flex-col md:flex-row animate-[blob_0.5s_ease-out]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition"
        >
          <X size={20} />
        </button>

        {/* Image Side */}
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
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
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:hidden"></div>
        </div>

        {/* Info Side */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-surface/95 backdrop-blur-xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                 {item.weight}
               </span>
               <span className="px-2 py-1 rounded text-xs font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20">
                 Хит продаж
               </span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">{item.title}</h2>
            <p className="text-slate-300 leading-relaxed mb-8">{item.description}</p>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                <Flame size={18} className="mx-auto text-orange-400 mb-1" />
                <div className="text-white font-bold text-sm">{item.calories}</div>
                <div className="text-[10px] text-slate-500 uppercase">ккал</div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                <Zap size={18} className="mx-auto text-yellow-400 mb-1" />
                <div className="text-white font-bold text-sm">{item.protein}</div>
                <div className="text-[10px] text-slate-500 uppercase">белки</div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                <Droplet size={18} className="mx-auto text-blue-400 mb-1" />
                <div className="text-white font-bold text-sm">{item.fats}</div>
                <div className="text-[10px] text-slate-500 uppercase">жиры</div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                <Wheat size={18} className="mx-auto text-amber-200 mb-1" />
                <div className="text-white font-bold text-sm">{item.carbs}</div>
                <div className="text-[10px] text-slate-500 uppercase">углев</div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-6">
            <div className="text-3xl font-bold text-white whitespace-nowrap">
              {item.price} ₽
            </div>
            <button 
              onClick={() => { onAddToCart(item); onClose(); }}
              className="w-full btn-shine animate-shine bg-[length:200%_auto] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-indigo-500/20"
            >
              <ShoppingBag size={20} />
              В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};