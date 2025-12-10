
import React from 'react';
import { X, Plus, Sparkles, Timer } from 'lucide-react';
import { MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface UpsellModalProps {
  item: MenuItem;
  discountPrice: number;
  onClose: () => void;
  onAdd: () => void;
  onSkip: () => void;
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ 
  item, 
  discountPrice, 
  onClose, 
  onAdd, 
  onSkip 
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-slate-900 border border-fuchsia-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(192,38,211,0.15)] flex flex-col animate-[blob_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        
        {/* Header Image Area */}
        <div className="h-40 relative">
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>

          <div className="absolute top-4 left-4 bg-fuchsia-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <Sparkles size={12} />
            Специальное предложение
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 text-center relative z-10">
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">
            Идеальное дополнение!
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Кажется, вы забыли напиток. Добавим <span className="text-fuchsia-300 font-medium">{item.title}</span> к вашему обеду по супер-цене?
          </p>

          <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">🥤</div>
               <div className="text-left">
                  <div className="text-xs text-slate-500 line-through">{item.price} ₽</div>
                  <div className="text-lg font-bold text-white leading-none">{discountPrice} ₽</div>
               </div>
            </div>
            <div className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold">
               Выгода {item.price - discountPrice} ₽
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onAdd}
              className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Plus size={18} /> Добавить за {discountPrice} ₽
            </button>
            <button 
              onClick={onSkip}
              className="w-full py-3 text-slate-500 text-sm font-medium hover:text-white transition"
            >
              Нет, спасибо, перейти к оплате
            </button>
          </div>
        </div>

        {/* Timer Bar (Visual Urgency) */}
        <div className="h-1 bg-slate-800 w-full">
            <div className="h-full bg-fuchsia-500 w-full animate-[marquee_10s_linear_forwards]" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};
