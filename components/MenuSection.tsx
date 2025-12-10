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
  
  // Default to today. 0 is Sunday, 6 is Saturday.
  const currentDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);

  // Refs for sliding animation
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const tabs: { id: Category; label: string }[] = [
    { id: 'lunch', label: 'Бизнес-ланчи' },
    { id: 'extras', label: 'Напитки и десерты' },
  ];

  // Calculate sliding indicator position
  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeCategory);
    const activeTab = tabsRef.current[activeIndex];
    
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        opacity: 1
      });
    }
  }, [activeCategory, isSticky]); // Re-calc on category change or sticky state change

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

  const days = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
    { id: 6, label: 'Сб' },
    { id: 0, label: 'Вс' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('menu-start');
      if (section) {
        const rect = section.getBoundingClientRect();
        setIsSticky(rect.top <= 90);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="menu-start" className="relative min-h-screen pb-24 z-10">
      
      {/* Sticky Category Nav */}
      <div className={`sticky top-[64px] md:top-[76px] z-30 py-4 transition-all duration-500 ${isSticky ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          
          {/* Main Categories - Sliding Tabs */}
          <div className="relative p-1.5 bg-slate-900/50 backdrop-blur-md rounded-full border border-white/10 shadow-inner flex overflow-hidden">
            
            {/* The Sliding Background "Pill" */}
            <div 
              className="absolute top-1.5 bottom-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ 
                left: indicatorStyle.left, 
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity 
              }}
            >
              {/* Shine effect on the slider */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            </div>

            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el) => { tabsRef.current[index] = el; }}
                onClick={() => {
                  onCategoryChange(tab.id);
                  if (isSticky) {
                    window.scrollTo({
                      top: (document.getElementById('menu-start')?.offsetTop || 0) - 100,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`relative z-10 px-6 sm:px-10 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'text-white drop-shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Week Day Selector (Only for Lunch) */}
          {activeCategory === 'lunch' && (
            <div className="animate-fade-in w-full max-w-2xl overflow-x-auto no-scrollbar py-4">
               <div className="flex justify-center items-center gap-2 sm:gap-3 min-w-max px-2">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2 sticky left-0">День:</span>
                 {days.map((day) => (
                   <button
                     key={day.id}
                     onClick={() => setSelectedDay(day.id)}
                     className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center border ${
                       selectedDay === day.id 
                         ? 'bg-white text-indigo-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-110 -translate-y-1' 
                         : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:bg-white/10 hover:text-white'
                     }`}
                   >
                     {day.label}
                     {/* Active dot indicator */}
                     {selectedDay === day.id && (
                       <span className="absolute -bottom-1.5 w-1 h-1 bg-fuchsia-500 rounded-full animate-bounce"></span>
                     )}
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
           <div className="text-center py-20 animate-fade-in bg-white/5 rounded-3xl border border-white/5 mx-auto max-w-2xl">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Calendar size={32} className="text-slate-500" />
              </div>
              <h3 className="text-2xl text-white font-bold mb-2">Меню формируется</h3>
              <p className="text-slate-400">На этот день блюда еще не добавлены. Посмотрите другие дни!</p>
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

// Extracted Card Component
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
      
      {/* Card Background Glow */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 rounded-[24px] opacity-0 group-hover:opacity-100 transition duration-700 blur-md"></div>
      
      <div className="relative flex flex-col h-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden hover:border-transparent transition-all shadow-xl">
        {/* Image/Video Area */}
        <div 
          className="relative aspect-[4/3] overflow-hidden cursor-pointer"
          onClick={() => onOpenModal(item)}
        >
          <img 
            src={item.image} 
            alt={item.title} 
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = FALLBACK_IMAGE;
              target.onerror = null;
            }}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
          />
          
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

          {item.video && !isPlaying && (
             <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/90 border border-white/10 shadow-lg">
               <Play size={10} fill="currentColor" />
             </div>
          )}
          
          {/* Price Tag */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full font-bold shadow-lg text-sm">
            {item.price} ₽
          </div>

           {/* Add Button Overlay */}
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transform translate-y-14 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
          >
             <Plus size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 p-5 cursor-pointer" onClick={() => onOpenModal(item)}>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
            {item.title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
            {item.description}
          </p>
          
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs font-semibold text-slate-500">
              {item.weight} • {item.calories} ккал
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};