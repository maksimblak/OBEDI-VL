
import React, { useState } from 'react';
import { X, Minus, Plus, Trash2, Share2, Check, ShoppingBag, AlertCircle } from 'lucide-react';
import { CartItem, MenuItem } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  upsellItems: MenuItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cart,
  upsellItems,
  onUpdateQuantity,
  onRemove,
  onAddToCart,
  onCheckout
}) => {
  const [copied, setCopied] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Minimum Order Logic
  const MIN_ORDER_AMOUNT = 3000;
  const remainingForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - total);
  const progress = Math.min(100, (total / MIN_ORDER_AMOUNT) * 100);
  const isCheckoutDisabled = total < MIN_ORDER_AMOUNT;

  const handleShare = () => {
    navigator.clipboard.writeText("https://obedivl.ru/cart/share/12345");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter upsell items to only show ones NOT in cart
  const availableUpsells = upsellItems.filter(u => !cart.find(c => c.id === u.id));

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-dark border-l border-white/5 z-[60] shadow-2xl transform transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-surface/50">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-indigo-400" />
            Ваш заказ
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
           <div className="px-6 pt-6">
              {/* Min Order Progress - Styled with Purple Gradient */}
              <div className={`bg-surface/50 rounded-xl p-4 border mb-2 transition-colors ${remainingForMinOrder > 0 ? 'border-indigo-500/30' : 'border-green-500/30'}`}>
                 <div className="flex justify-between text-xs mb-2">
                   <span className={remainingForMinOrder > 0 ? 'text-indigo-200' : 'text-slate-400'}>
                     {remainingForMinOrder > 0 ? 'Минимальная сумма' : 'Условия выполнены'}
                   </span>
                   <span className="text-white font-medium">
                     {remainingForMinOrder > 0 ? `Ещё ${remainingForMinOrder} ₽` : 'Отлично!'}
                   </span>
                 </div>
                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                       className={`h-full rounded-full transition-all duration-700 ease-out ${
                           remainingForMinOrder > 0 
                           ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                           : 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_15px_rgba(74,222,128,0.5)]'
                       }`}
                       style={{ width: `${progress}%` }}
                    />
                 </div>
                 {remainingForMinOrder > 0 && (
                   <div className="mt-3 text-[10px] text-indigo-300/80 flex items-start gap-1.5">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      Для бесплатной доставки и оформления заказа наберите сумму от 3000 ₽.
                   </div>
                 )}
              </div>
           </div>

          <div className="p-6 space-y-6 pt-2">
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p className="mb-2">Корзина пуста</p>
                <button onClick={onClose} className="text-indigo-400 hover:text-indigo-300 transition text-sm">Перейти к меню</button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface flex-shrink-0 border border-white/5">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = FALLBACK_IMAGE;
                        target.onerror = null;
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium text-white leading-tight">{item.title}</h4>
                        <button onClick={() => onRemove(item.id)} className="text-zinc-600 hover:text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-white text-sm">{item.price * item.quantity} ₽</span>
                      <div className="flex items-center bg-surface rounded-lg border border-white/5">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-white">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Area */}
        <div className="bg-surface border-t border-white/5 p-6">
            
            {/* Upsell Carousel */}
            {availableUpsells.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">С этим часто берут</div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
                  {availableUpsells.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-32 bg-white/5 rounded-xl p-2 border border-white/5 hover:border-white/10 transition group cursor-pointer" onClick={() => onAddToCart(item)}>
                      <div className="h-20 rounded-lg overflow-hidden mb-2 relative">
                         <img 
                            src={item.image} 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = FALLBACK_IMAGE;
                              target.onerror = null;
                            }}
                            className="w-full h-full object-cover" 
                            alt={item.title} 
                         />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                           <Plus size={20} className="text-white" />
                         </div>
                      </div>
                      <div className="text-xs font-medium text-white truncate">{item.title}</div>
                      <div className="text-xs text-indigo-300 font-bold">{item.price} ₽</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Cart Feature */}
            {cart.length > 0 && (
               <button 
                  onClick={handleShare}
                  className="w-full py-2 mb-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition border border-dashed border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5"
              >
                  {copied ? <Check size={12} /> : <Share2 size={12} />}
                  {copied ? 'Ссылка скопирована' : 'Поделиться корзиной'}
              </button>
            )}

            {cart.length > 0 && (
              <>
                <div className="flex justify-between items-center text-white mb-4">
                  <span className="text-zinc-400">Итого</span>
                  <div className="text-right">
                     <span className="text-2xl font-bold">{total} ₽</span>
                     <div className="text-[10px] text-slate-500">Доставка включена</div>
                  </div>
                </div>
                
                {isCheckoutDisabled && (
                  <div className="mb-3 text-center text-xs text-indigo-200 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    Добавьте товаров на {remainingForMinOrder} ₽
                  </div>
                )}

                <button 
                  onClick={onCheckout}
                  disabled={isCheckoutDisabled}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                    isCheckoutDisabled 
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'btn-shine animate-shine bg-[length:200%_auto] text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/20'
                  }`}
                >
                  Оформить заказ
                </button>
              </>
            )}
        </div>
      </div>
    </>
  );
};
