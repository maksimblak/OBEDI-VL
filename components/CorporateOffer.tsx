
import React from 'react';
import { Building2, HardHat, Warehouse, Factory, Clapperboard, Award, ChefHat, FileCheck, Thermometer, Briefcase } from 'lucide-react';
import { FALLBACK_IMAGE, IMAGES } from '../data';

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
    <section className="py-24 relative z-10 bg-slate-900 border-y border-white/5 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="group bg-gradient-to-br from-slate-900 to-slate-950 rounded-[3rem] border border-white/10 hover:border-indigo-500/30 overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.15)] transition-all duration-700">
           
           <div className="flex flex-col lg:flex-row">
              {/* Content Side */}
              <div className="lg:w-3/5 p-8 md:p-14 relative z-10">
                 {/* Internal decorative glowing blob */}
                 <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-fuchsia-500/5 rounded-full blur-[60px]"></div>
                 </div>

                 <div className="relative z-10">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        <Briefcase size={14} /> Корпоративным клиентам
                     </div>
                     
                     <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                        Организуем полноценное питание <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 animate-shine bg-[length:200%_auto]">для ваших сотрудников</span>
                     </h2>
                     <p className="text-slate-300 mb-8 text-lg leading-relaxed border-l-2 border-indigo-500/50 pl-4 shadow-[inset_10px_0_20px_-10px_rgba(99,102,241,0.1)]">
                        Завтраки, обеды и ужины с доставкой в любое удобное для вас время!
                     </p>

                     {/* Target Audience Chips */}
                     <div className="mb-10 bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-colors shadow-inner">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full shadow-[0_0_10px_#d946ef]"></span>
                           Кому подходит наш сервис:
                        </h4>
                        
                        <div className="flex flex-wrap gap-3">
                           {targets.map((t, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-white/5 rounded-lg text-slate-300 text-xs font-medium hover:border-indigo-500/40 hover:text-white hover:bg-indigo-500/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all cursor-default">
                                 <span className="text-indigo-400">{t.icon}</span>
                                 {t.label}
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Features Grid */}
                     <div className="grid sm:grid-cols-2 gap-y-8 gap-x-8 mb-10 pt-4">
                        <div className="flex gap-4 group/item">
                           <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20 group-hover/item:scale-110 group-hover/item:bg-indigo-500/20 group-hover/item:border-indigo-500/40 group-hover/item:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300">
                              <Award size={24} />
                           </div>
                           <div>
                              <h4 className="text-white font-bold mb-1 group-hover/item:text-indigo-200 transition-colors">Опыт более 20 лет</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">В сфере общественного питания. Мы знаем всё о качественном сервисе.</p>
                           </div>
                        </div>
                        
                        <div className="flex gap-4 group/item">
                           <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 shrink-0 border border-fuchsia-500/20 group-hover/item:scale-110 group-hover/item:bg-fuchsia-500/20 group-hover/item:border-fuchsia-500/40 group-hover/item:shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all duration-300">
                              <ChefHat size={24} />
                           </div>
                           <div>
                              <h4 className="text-white font-bold mb-1 group-hover/item:text-fuchsia-200 transition-colors">Своя спец. кухня</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">Еда готовится в действующей специализированной кухне каждое утро.</p>
                           </div>
                        </div>

                        <div className="flex gap-4 group/item">
                           <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 group-hover/item:scale-110 group-hover/item:bg-emerald-500/20 group-hover/item:border-emerald-500/40 group-hover/item:shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all duration-300">
                              <Thermometer size={24} />
                           </div>
                           <div>
                              <h4 className="text-white font-bold mb-1 group-hover/item:text-emerald-200 transition-colors">Горячая доставка</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">Доставим в горячем виде на объекты в специальных пищевых контейнерах.</p>
                           </div>
                        </div>

                        <div className="flex gap-4 group/item">
                           <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20 group-hover/item:scale-110 group-hover/item:bg-cyan-500/20 group-hover/item:border-cyan-500/40 group-hover/item:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                              <FileCheck size={24} />
                           </div>
                           <div>
                              <h4 className="text-white font-bold mb-1 group-hover/item:text-cyan-200 transition-colors">Сертификация</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">Имеем все необходимые сертификаты качества и безопасности.</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-4 relative z-20">
                        <button 
                          onClick={onRequestOffer}
                          className="relative overflow-hidden px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex-1 sm:flex-none text-center transform active:scale-95 transition-all group/btn"
                        >
                            <span className="relative z-10 group-hover/btn:text-indigo-950 transition-colors">Получить коммерческое предложение</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        </button>
                     </div>
                 </div>
              </div>

              {/* Image Side */}
              <div className="lg:w-2/5 relative min-h-[300px] lg:min-h-full overflow-hidden">
                 <img 
                   src={IMAGES.catering1}
                   alt="Корпоративное питание"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement;
                     target.src = FALLBACK_IMAGE;
                     target.onerror = null;
                   }}
                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                 />
                 {/* Gradient Overlay - Smooth transition from dark background to image */}
                 <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
                 
                 {/* Neon line separator for mobile/desktop */}
                 <div className="absolute top-0 left-0 lg:left-0 lg:h-full w-full h-px lg:w-px bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};
