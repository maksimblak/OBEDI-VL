
import React from 'react';
import { MousePointerClick, ChefHat, PackageCheck, Rocket, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      id: 1,
      icon: <MousePointerClick size={28} />,
      title: "Заказ",
      desc: "Вы выбираете блюда на сайте или в приложении",
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      border: "border-blue-500/30"
    },
    {
      id: 2,
      icon: <ChefHat size={28} />,
      title: "Готовка",
      desc: "Готовим «из-под ножа» сразу после подтверждения",
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/20",
      border: "border-fuchsia-500/30"
    },
    {
      id: 3,
      icon: <PackageCheck size={28} />,
      title: "Упаковка",
      desc: "Герметичные боксы сохраняют тепло и вкус",
      color: "text-indigo-400",
      bg: "bg-indigo-500/20",
      border: "border-indigo-500/30"
    },
    {
      id: 4,
      icon: <Rocket size={28} />,
      title: "Доставка",
      desc: "Курьер привозит обед за 45 минут",
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30"
    }
  ];

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Как мы работаем</h2>
          <p className="text-slate-400">Прозрачный процесс от кухни до вашего стола</p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent hidden md:block -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative group">
                 
                 {/* Card Container */}
                 <div className="relative z-10 h-full">
                    <div className={`
                        h-full flex flex-col items-center text-center p-6 rounded-3xl 
                        glass bg-white/5 backdrop-blur-xl border border-white/10 
                        transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 hover:border-white/20
                        shadow-lg hover:shadow-2xl
                    `}>
                        {/* Icon Bubble */}
                        <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center 
                            mb-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]
                            ${step.bg} ${step.color} ${step.border} border
                            group-hover:scale-110 transition-transform duration-500
                        `}>
                            {step.icon}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                 </div>
                 
                 {/* Mobile Connector Line */}
                 {idx < steps.length - 1 && (
                    <div className="md:hidden absolute left-1/2 bottom-[-32px] w-0.5 h-8 bg-white/10 -translate-x-1/2"></div>
                 )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
