import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, CreditCard, Wallet, Truck, CheckCircle } from 'lucide-react';
import { CartItem } from '../types';
import { authService } from '../services/authService';

interface CheckoutModalProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ cart, total, onClose, onConfirm }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'apple'>('card');
  const [time, setTime] = useState('asap');
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Prefill from user profile if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await authService.getCurrentUser().catch(() => null);
      if (!user || cancelled) return;
      setName(user.name);
      setPhone(user.phone);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
        alert("Пожалуйста, введите корректный номер телефона");
        return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      {step === 'success' ? (
        <div className="relative bg-surface border border-white/10 rounded-3xl p-8 max-w-md w-full text-center animate-in zoom-in-95 duration-300 z-10">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Заказ принят!</h2>
            <p className="text-slate-400 mb-8">Номер заказа #{Math.floor(Math.random() * 9000) + 1000}. Курьер прибудет в течение 45 минут.</p>
            <button 
                onClick={onConfirm}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-transform"
            >
                Отлично
            </button>
        </div>
      ) : (
      <div className="relative w-full max-w-2xl bg-dark border border-white/10 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 z-10">
        
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface/50">
          <h2 className="text-xl font-bold text-white">Оформление заказа</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Контакты</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                    required 
                    type="text" 
                    placeholder="Ваше имя" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition" 
                />
                <input 
                    required 
                    type="tel" 
                    placeholder="+7 (___) ___-__-__" 
                    value={phone}
                    onChange={(e) => {
                        // Phone mask logic
                        const val = e.target.value.replace(/[^\d+ ]/g, ''); 
                        setPhone(val);
                    }}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition" 
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Доставка</h3>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input required type="text" placeholder="Улица, дом, офис" className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 outline-none transition" />
              </div>
              <textarea placeholder="Комментарий курьеру (код домофона, этаж)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition h-24 resize-none"></textarea>
            </div>

            {/* Time Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Время доставки</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[
                  { id: 'asap', label: 'Как можно скорее', icon: <Truck size={16} /> },
                  { id: '13:00', label: '13:00', icon: <Clock size={16} /> },
                  { id: '14:00', label: '14:00', icon: <Clock size={16} /> },
                  { id: '15:00', label: '15:00', icon: <Clock size={16} /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTime(opt.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all whitespace-nowrap ${
                      time === opt.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Оплата</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    paymentMethod === 'card' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-medium">Картой</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    paymentMethod === 'apple' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold text-lg leading-none">Pay</div>
                  <span className="text-xs font-medium">Онлайн</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                    paymentMethod === 'cash' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Wallet size={24} />
                  <span className="text-xs font-medium">Наличными</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 bg-surface border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="text-left w-full md:w-auto">
            <div className="text-slate-400 text-sm">Итого к оплате:</div>
            <div className="text-3xl font-bold text-white">{total} ₽</div>
          </div>
          <button 
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Обработка...
              </>
            ) : (
              'Оплатить заказ'
            )}
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
