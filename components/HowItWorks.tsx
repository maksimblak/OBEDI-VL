import React from 'react';
import { MousePointerClick, ChefHat, PackageCheck, Rocket, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: "01",
      icon: <MousePointerClick size={32} />,
      title: "Выбор",
      desc: "Пара кликов по меню или помощь AI-шефа с выбором.",
      color: "text-indigo-400",
      gradient: "from-indigo-500 to-blue-500",
      shadow: "shadow-indigo-500/20"
    },
    {
      id: "02",
      icon: <ChefHat size={32} />,
      title: "Кухня",
      desc: "Готовим сразу после заказа. Никаких заготовок.",
      color: "text-fuchsia-400",
      gradient: "from-fuchsia-500 to-pink-500",
      shadow: "shadow-fuchsia-500/20"
    },
    {
      id: "03",
      icon: <PackageCheck size={32} />,
      title: "Упаковка",
      desc: "Герметичные термобоксы сохраняют тепло блюд.",
      color: "text-purple-400",
      gradient: "from-purple-500 to-violet-500",
      shadow: "shadow-purple-500/20"
    },
    {
      id: "04",
      icon: <Rocket size={32} />,
      title: "Доставка",
      desc: "Курьер будет у вас в офисе в течение 45 минут.",
      color: "text-cyan-400",
      gradient: "from-cyan-500 to-teal-500",
      shadow: "shadow-cyan-500/20"
    }
  ];

  return (
    <section className="py-28 relative overflow-hidden bg-slate-950">
      {/* Premium Dark Background with Ambient Glow */}
      <div className="absolute inset-0 bg-slate-950">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen opacity-60"></div>
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        <div className="text-center mb-20 animate-fade-in">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-lg">
             Сервис
           </div>
           <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
             От заказа до обеда <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">за 45 минут</span>
           </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
           
           {/* Connecting Line (Desktop) - Glowing Beam */}
           <div className="hidden md:block absolute top-16 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent z-0"></div>

           {steps.map((step, i) => (
             <div key={step.id} className="relative z-10 group animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                
                {/* Card */}
                <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full transition-all duration-500 hover:-translate-y-3 hover:bg-slate-800/80 hover:border-white/10 hover:shadow-2xl overflow-hidden group-hover:shadow-indigo-500/10">
                   
                   {/* Hover Gradient Bloom */}
                   <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_15px_rgba(255,255,255,0.5)]`}></div>
                   <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                   {/* Icon with Glow */}
                   <div className={`w-16 h-16 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10 ${step.shadow} shadow-lg`}>
                      <div className={step.color}>{step.icon}</div>
                   </div>
                   
                   {/* Big Number Background */}
                   <div className="absolute top-4 right-6 text-5xl font-black text-white/[0.03] group-hover:text-white/[0.08] transition-colors select-none font-sans">
                      {step.id}
                   </div>

                   <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">
                     {step.title}
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed font-medium">
                     {step.desc}
                   </p>
                </div>

                {/* Mobile Arrow */}
                {i < steps.length - 1 && (
                   <div className="md:hidden flex justify-center py-4 text-white/10 animate-pulse">
                      <ArrowRight size={24} className="rotate-90" />
                   </div>
                )}
             </div>
           ))}
        </div>
      </div>
    </section>
  );
};