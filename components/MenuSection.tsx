import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Play, Calendar } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { FALLBACK_IMAGE } from '../data';

interface MenuSectionProps {
  items: MenuItem[];
  activeCategory: Category;
  onCategoryChange: (cat: Category) => void;
  onAddToCart: (item: MenuItem) => void;
  onOpenModal: (item: MenuItem) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ 
  items, 
  activeCategory, 
  onCategoryChange, 
  onAddToCart,
  onOpenModal
}) => {
  const [isSticky, setIsSticky] = useState(false);
  // Default to today or Monday if Sunday(0)
  const currentDay = new Date().getDay();
  const displayDay = currentDay === 0 || currentDay === 6 ? 1 : currentDay; 
  const [selectedDay, setSelectedDay] = useState<number>(displayDay);

  // Optimize filtering with useMemo
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Filter by category
      if (item.category !== activeCategory) return false;
      
      // 2. If it's lunch, filter by day
      if (activeCategory === 'lunch' && item.availableDays) {
        return item.availableDays.includes(selectedDay);
      }
      
      return true;
    });
  }, [items, activeCategory, selectedDay]);

  const tabs: { id: Category; label: string }[] = [
    { id: 'lunch', label: 'Бизнес-ланчи' },
    { id: 'pies', label: 'Пироги' },
    { id: 'catering', label: 'Кейтеринг' },
  ];

  const days = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('menu-start');
      if (section) {
        const rect = section.getBoundingClientRect();
        // Slightly adjustable threshold
        setIsSticky(rect.top <= 90);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="menu-start" className="relative min-h-screen pb-24 z-10">
      
      {/* Sticky Category Nav */}
      <div className={`sticky top-[64px] md:top-[76px] z-30 py-4 transition-all duration-300 ${isSticky ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-indigo-500/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          
          {/* Main Categories */}
          <div className="overflow-x-auto no-scrollbar w-full flex justify-center">
            <div className="flex gap-1.5 p-1.5 bg-slate-800/80 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onCategoryChange(tab.id);
                    if (isSticky) {
                      window.scrollTo({
                        top: (document.getElementById('menu-start')?.offsetTop || 0) - 100,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`relative px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    activeCategory === tab.id
                      ? 'text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {activeCategory === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-600 -z-10 animate-shine bg-[length:200%_auto]"></div>
                  )}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Week Day Selector (Only for Lunch) */}
          {activeCategory === 'lunch' && (
            <div className="animate-fade-in flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 no-scrollbar">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 hidden sm:block">Меню на:</span>
               <div className="flex gap-2 p-1 bg-slate-800/60 rounded-xl border border-white/10">
                 {days.map((day) => (
                   <button
                     key={day.id}
                     onClick={() => setSelectedDay(day.id)}
                     className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                       selectedDay === day.id 
                         ? 'bg-white text-indigo-900 shadow-lg scale-105' 
                         : 'text-slate-400 hover:bg-white/10 hover:text-white'
                     }`}
                   >
                     {day.label}
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        {/* Helper text for empty days */}
        {filteredItems.length === 0 && (
           <div className="text-center py-20 animate-fade-in">
              <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl text-white font-medium mb-2">На этот день меню еще формируется</h3>
              <p className="text-slate-400">Попробуйте выбрать другой день или загляните в раздел "Пироги"</p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredItems.map((item) => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAddToCart={onAddToCart} 
              onOpenModal={onOpenModal} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Extracted Card Component for better Video handling
const MenuItemCard: React.FC<{
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  onOpenModal: (item: MenuItem) => void;
}> = ({ item, onAddToCart, onOpenModal }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (item.video && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => { /* Autoplay prevented */ });
    }
  };

  const handleMouseLeave = () => {
    if (item.video && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className="group relative flex flex-col animate-fade-in hover:-translate-y-2 transition-transform duration-500"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      
      {/* Card Background Glow - Stronger and brighter */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-3xl opacity-0 group-hover:opacity-50 transition duration-500 blur-xl"></div>
      
      <div className="relative flex flex-col h-full bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all shadow-xl">
        {/* Image/Video Area */}
        <div 
          className="relative aspect-[4/3] overflow-hidden cursor-pointer"
          onClick={() => onOpenModal(item)}
        >
          {/* Static Image with Lazy Loading & Fallback */}
          <img 
            src={item.image} 
            alt={item.title} 
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = FALLBACK_IMAGE;
              target.onerror = null;
            }}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isPlaying ? 'opacity-0' : 'opacity-100'} brightness-105`}
          />
          
          {/* Video Layer */}
          {item.video && (
            <video
              ref={videoRef}
              src={item.video}
              muted
              loop
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Video Indicator Icon (if video exists) */}
          {item.video && !isPlaying && (
             <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white/90 border border-white/20 shadow-lg">
               <Play size={12} fill="currentColor" />
             </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-60"></div>
          
          {/* Price Tag */}
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full font-bold border border-white/10 shadow-lg">
            {item.price} ₽
          </div>

           {/* Desktop Add Button */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
             <button 
              onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
              className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/10 flex items-center gap-2"
             >
               В корзину
             </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 p-6 cursor-pointer bg-gradient-to-b from-transparent to-slate-900/50" onClick={() => onOpenModal(item)}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors drop-shadow-sm">
              {item.title}
            </h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs font-medium text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
              {item.weight} • {item.calories} ккал
            </span>
            
            {/* Mobile Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
              className="md:hidden w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center active:bg-indigo-600 shadow-lg shadow-indigo-500/30"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};