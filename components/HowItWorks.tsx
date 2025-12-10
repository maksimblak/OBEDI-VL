import React from 'react';
import { MousePointerClick, ChefHat, PackageCheck, Rocket } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: "01",
      icon: <MousePointerClick size={28} />,
      title: "Выбор",
      desc: "Кликните на любимые блюда или доверьтесь AI-шефу.",
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
      border: "border-indigo-500/20",
      glow: "from-indigo-500",
      line: "bg-indigo-500"
    },
    {
      id: "02",
      icon: <ChefHat size={28} />,
      title: "Магия кухни",
      desc: "Готовим из-под ножа. Никаких заготовок, только свежесть.",
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/20",
      border: "border-fuchsia-500/20",
      glow: "from-fuchsia-500",
      line: "bg-fuchsia-500"
    },
    {
      id: "03",
      icon: <PackageCheck size={28} />,
      title: "Упаковка",
      desc: "Термобоксы сохраняют тепло и аромат до самого открытия.",
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      border: "border-purple-500/20",
      glow: "from-purple-500",
      line: "bg-purple-500"
    },
    {
      id: "04",
      icon: <Rocket size={28} />,
      title: "Доставка",
      desc: "Курьер-ниндзя доставит заказ быстрее, чем остынет кофе.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/20",
      glow: "from-cyan-500",
      line: "bg-cyan-500"
    }
  ];

  return (
    <section className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background with Lights */}
      <div className="absolute inset-0">
         <div className="absolute left-0 top-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow"></div>
         <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-float"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-24 animate-fade-in">
           <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
             Процесс
           </span>
           <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
             Как это <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 animate-shine bg-[length:200%_auto]">работает?</span>
           </h2>
           <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
             Максимально просто. Вы заказываете — мы телепортируем вкусную еду к вам на стол.
           </p>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
           
           {/* Connecting Line (Desktop) */}
           <div className="hidden md:block absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 pointer-events-none">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
           </div>

           {steps.map((step, i) => (
             <div key={step.id} className="group relative z-10 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                {/* Card Body */}
                <div className="relative h-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-4 hover:bg-slate-800/60 hover:border-white/10 overflow-hidden shadow-xl">
                   
                   {/* Hover Gradient Bloom */}
                   <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-gradient-to-br ${step.glow} to-transparent`}></div>
                   
                   {/* Step Number Huge Background */}
                   <div className="absolute -right-4 -top-6 text-[140px] font-black text-white/[0.03] group-hover:text-white/[0.07] transition-colors select-none leading-none z-0 pointer-events-none font-sans tracking-tighter">
                      {step.id}
                   </div>

                   {/* Icon Blob */}
                   <div className={`relative w-20 h-20 rounded-2xl ${step.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border ${step.border} shadow-[0_0_30px_rgba(0,0,0,0.2)]`}>
                      <div className={`${step.color} relative z-10`}>
                        {step.icon}
                      </div>
                      {/* Inner Glow */}
                      <div className={`absolute inset-0 bg-${step.color.split('-')[1]}-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                   </div>

                   {/* Text */}
                   <div className="relative z-10">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">
                        {step.desc}
                      </p>
                   </div>
                   
                   {/* Bottom Progress Line */}
                   <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${step.line.split('-')[1]}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                </div>
             </div>
           ))}
        </div>

      </div>
    </section>
  );
};