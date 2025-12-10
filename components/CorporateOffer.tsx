
import React from 'react';
import { Building2, FileCheck, Users, Percent } from 'lucide-react';
import { IMAGES } from '../data';

export const CorporateOffer: React.FC = () => {
  return (
    <section className="py-24 relative z-10 bg-slate-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-[3rem] border border-white/10 overflow-hidden relative">
           
           <div className="flex flex-col lg:flex-row">
              {/* Content Side */}
              <div className="lg:w-1/2 p-8 md:p-16 relative z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
                    <Building2 size={14} /> Для бизнеса
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Корпоративное питание <br/>
                    <span className="text-indigo-400">для вашей команды</span>
                 </h2>
                 <p className="text-slate-300 mb-10 text-lg leading-relaxed">
                    Повысьте продуктивность сотрудников с вкусными и сытными обедами. 
                    Организуем доставку в офис точно ко времени перерыва.
                 </p>

                 <div className="grid sm:grid-cols-2 gap-6 mb-10">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <FileCheck size={20} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Работа по договору</h4>
                          <p className="text-xs text-slate-400">Полный пакет закрывающих документов, работаем с НДС.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0">
                          <Percent size={20} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Гибкие скидки</h4>
                          <p className="text-xs text-slate-400">Специальные цены для компаний от 10 человек.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Users size={20} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Личный менеджер</h4>
                          <p className="text-xs text-slate-400">Персональное сопровождение и быстрое решение вопросов.</p>
                       </div>
                    </div>
                 </div>

                 <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
                    Получить предложение
                 </button>
              </div>

              {/* Image Side */}
              <div className="lg:w-1/2 relative min-h-[400px]">
                 <img 
                   src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop" 
                   alt="Office Lunch" 
                   className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/50 to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:to-transparent"></div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};
