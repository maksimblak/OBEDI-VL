
import React from 'react';
import { X, Plus, Sparkles, Flame, Percent, ArrowRight } from 'lucide-react';
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
  const savings = item.price - discountPrice;
  const discountPercent = Math.round((savings / item.price) * 100);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 flex flex-col animate-[blob_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] group">
        
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>

        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-5 right-5 z-20 bg-black/20 hover:bg-white/10 text-white/50 hover:text-white p-2.5 rounded-full transition-all backdrop-blur-md"
        >
            <X size={20} />
        </button>

        {/* Header Image */}
        <div className="relative h-64 w-full">
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
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>

            {/* Floating Tag */}
            <div className="absolute top-6 left-6 animate-float" style={{ animationDuration: '4s' }}>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-wide uppercase">Рекомендуем</span>
                </div>
            </div>

            {/* Giant Discount Badge */}
            <div className="absolute bottom-6 right-6 rotate-[-6deg] group-hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-rose-500 to-orange-500 text-white font-black text-2xl px-5 py-3 rounded-2xl shadow-lg shadow-rose-500/40 flex items-center gap-1 border border-white/10">
                    -{discountPercent}%
                </div>
            </div>
        </div>

        {/* Content Body */}
        <div className="px-8 pb-8 -mt-4 relative z-10 text-center">
            
            <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                Забыли напиток?
            </h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Идеально дополнит ваш обед. <br/>
                Добавьте <span className="text-indigo-300 font-medium">{item.title}</span> со скидкой!
            </p>

            {/* Pricing Card */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-1 mb-8">
               <div className="bg-[#0f172a]/50 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                  {/* Shimmer effect inside price card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

                  <div className="text-left">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Обычная цена</div>
                      <div className="text-sm text-slate-400 line-through decoration-slate-500 decoration-1">{item.price} ₽</div>
                  </div>

                  <div className="h-8 w-px bg-white/10"></div>

                  <div className="text-right">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1 flex items-center justify-end gap-1">
                          <Flame size={10} className="fill-emerald-400" /> Выгода {savings}₽
                      </div>
                      <div className="text-3xl font-black text-white leading-none tracking-tight">{discountPrice} ₽</div>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button 
                    onClick={onAdd}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] group/btn relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat transition-[background-position_0s] duration-0 group-hover/btn:bg-[position:200%_0,0_0] group-hover/btn:duration-[1500ms]"></div>
                    <Plus size={20} strokeWidth={3} /> 
                    <span>Добавить в заказ</span>
                </button>
                
                <button 
                    onClick={onSkip}
                    className="group/skip w-full py-2 flex items-center justify-center gap-1 text-slate-500 text-xs font-medium hover:text-white transition-colors"
                >
                    Нет, спасибо, перейти к оплате
                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover/skip:opacity-100 group-hover/skip:translate-x-0 transition-all" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
