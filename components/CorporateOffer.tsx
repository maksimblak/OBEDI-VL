
import React from 'react';
import { Building2, HardHat, Warehouse, Factory, Clapperboard, Award, ChefHat, FileCheck, Thermometer, Briefcase } from 'lucide-react';

interface CorporateOfferProps {
  onRequestOffer: () => void;
}

export const CorporateOffer: React.FC<CorporateOfferProps> = ({ onRequestOffer }) => {
  const targets = [
    { icon: <Building2 size={20} />, label: "Офисы" },
    { icon: <HardHat size={20} />, label: "Строительные объекты" },
    { icon: <Warehouse size={20} />, label: "Складские помещения" },
    { icon: <Factory size={20} />, label: "Заводы" },
    { icon: <Clapperboard size={20} />, label: "Съемочные площадки" },
  ];

  return (
    <section className="py-24 relative z-10 bg-slate-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-[3rem] border border-white/10 overflow-hidden relative shadow-2xl">
           
           <div className="flex flex-col lg:flex-row">
              {/* Content Side */}
              <div className="lg:w-3/5 p-8 md:p-14 relative z-10">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
                    <Briefcase size={14} /> Корпоративным клиентам
                 </div>
                 
                 <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    Организуем полноценное питание <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">для ваших сотрудников</span>
                 </h2>
                 <p className="text-slate-300 mb-8 text-lg leading-relaxed border-l-2 border-indigo-500/50 pl-4">
                    Завтраки, обеды и ужины с доставкой в любое удобное для вас время!
                 </p>

                 {/* Target Audience Chips */}
                 <div className="mb-10 bg-white/5 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                       <span className="w-1 h-4 bg-fuchsia-500 rounded-full"></span>
                       Кому подходит наш сервис:
                    </h4>
                    
                    <div className="flex flex-wrap gap-3">
                       {targets.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-300 text-xs font-medium hover:border-indigo-500/30 transition-colors cursor-default">
                             <span className="text-indigo-400">{t.icon}</span>
                             {t.label}
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Features Grid */}
                 <div className="grid sm:grid-cols-2 gap-y-8 gap-x-8 mb-10 pt-4">
                    <div className="flex gap-4 group">
                       <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                          <Award size={24} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Опыт более 20 лет</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">В сфере общественного питания. Мы знаем всё о качественном сервисе.</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-4 group">
                       <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0 border border-fuchsia-500/10 group-hover:scale-110 transition-transform">
                          <ChefHat size={24} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Своя спец. кухня</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">Еда готовится в действующей специализированной кухне каждое утро. Только свежие блюда.</p>
                       </div>
                    </div>

                    <div className="flex gap-4 group">
                       <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                          <Thermometer size={24} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Горячая доставка</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">Доставим в горячем виде на объекты в специальных пищевых контейнерах.</p>
                       </div>
                    </div>

                    <div className="flex gap-4 group">
                       <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/10 group-hover:scale-110 transition-transform">
                          <FileCheck size={24} />
                       </div>
                       <div>
                          <h4 className="text-white font-bold mb-1">Сертификация</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">Имеем все необходимые сертификаты качества и безопасности.</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={onRequestOffer}
                      className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10 flex-1 sm:flex-none text-center transform active:scale-95"
                    >
                        Получить предложение
                    </button>
                 </div>
              </div>

              {/* Image Side */}
              <div className="lg:w-2/5 relative min-h-[300px] lg:min-h-full">
                 <img 
                   src="https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop" 
                   alt="Corporate Catering" 
                   className="absolute inset-0 w-full h-full object-cover grayscale-[10%] contrast-110"
                 />
                 {/* Gradient Overlay */}
                 <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-slate-900 via-slate-900/60 to-transparent"></div>
                 
                 {/* Decorative Circle */}
                 <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-white/20 rounded-full flex items-center justify-center animate-spin-slow hidden lg:flex">
                    <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold rotate-[-15deg]">
                       Obedi VL Premium
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};
