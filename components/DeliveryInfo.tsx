
import React from 'react';
import { MapPin, Clock, CreditCard, ShieldCheck, Wallet, Banknote } from 'lucide-react';

export const DeliveryInfo: React.FC = () => {
  return (
    <section className="py-24 relative z-10 bg-surface/30 backdrop-blur-sm border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Доставка и Оплата</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Мы работаем с корпоративными клиентами и большими заказами.
            Минимальная сумма заказа для всех зон — <span className="text-white font-bold">3000₽</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Delivery Zones */}
          <div className="glass rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <MapPin size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">Зоны доставки</h3>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-green-500">
                    <div>
                        <div className="font-bold text-white mb-1">Зеленая зона (Центр)</div>
                        <p className="text-sm text-slate-400">Центр, Эгершельд, Первая речка</p>
                        <div className="mt-2 text-xs font-mono bg-black/30 inline-block px-2 py-1 rounded text-green-400">
                            ~45 мин • Бесплатно
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-yellow-500">
                    <div>
                        <div className="font-bold text-white mb-1">Желтая зона</div>
                        <p className="text-sm text-slate-400">Вторая речка, Баляева, Чуркин (до моста)</p>
                        <div className="mt-2 text-xs font-mono bg-black/30 inline-block px-2 py-1 rounded text-yellow-400">
                            ~60 мин • Бесплатно
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border-l-4 border-red-500">
                    <div>
                        <div className="font-bold text-white mb-1">Красная зона</div>
                        <p className="text-sm text-slate-400">Русский остров, Тихая, Седанка</p>
                        <div className="mt-2 text-xs font-mono bg-black/30 inline-block px-2 py-1 rounded text-red-400">
                            ~90 мин • Бесплатно
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <Clock size={14} />
                <span>Прием заказов ежедневно с 09:00 до 18:00</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
             <div className="glass rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-fuchsia-500/20 text-fuchsia-400 rounded-xl flex items-center justify-center">
                        <Wallet size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Способы оплаты</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition border border-white/5 flex flex-col items-center text-center">
                        <CreditCard size={32} className="text-indigo-400 mb-2" />
                        <div className="font-bold text-white text-sm">Банковской картой</div>
                        <div className="text-xs text-slate-500 mt-1">Visa, MC, Mir</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition border border-white/5 flex flex-col items-center text-center">
                        <div className="text-2xl font-bold text-white mb-2 leading-none">Pay</div>
                        <div className="font-bold text-white text-sm">SberPay / SBP</div>
                        <div className="text-xs text-slate-500 mt-1">Быстрый платеж</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition border border-white/5 flex flex-col items-center text-center">
                        <Banknote size={32} className="text-green-400 mb-2" />
                        <div className="font-bold text-white text-sm">Наличными</div>
                        <div className="text-xs text-slate-500 mt-1">Курьеру при получении</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition border border-white/5 flex flex-col items-center text-center">
                        <ShieldCheck size={32} className="text-slate-400 mb-2" />
                        <div className="font-bold text-white text-sm">Безналичный расчет</div>
                        <div className="text-xs text-slate-500 mt-1">Для юр. лиц (по договору)</div>
                    </div>
                </div>
             </div>

             <div className="bg-gradient-to-r from-indigo-900/40 to-fuchsia-900/40 rounded-3xl p-6 border border-white/10">
                <h4 className="font-bold text-white mb-2">Корпоративным клиентам</h4>
                <p className="text-sm text-slate-400 mb-4">
                    Заключаем договоры на регулярное питание сотрудников. Скидки до 15% и отсрочка платежа.
                </p>
                <button className="text-sm text-white font-medium underline hover:text-indigo-300">
                    Скачать коммерческое предложение
                </button>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};
