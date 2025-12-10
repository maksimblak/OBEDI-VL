
import React, { useState } from 'react';
import { MapPin, Clock, Wallet, Banknote, Car, Navigation, Search, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { checkAddressZone } from '../services/geminiService';

// Coordinates for Ulitsa Nadibaidze, 28, Vladivostok
const RESTAURANT_COORDS = {
  lat: 43.096362,
  lng: 131.916723
};

type ZoneType = 'green' | 'yellow' | 'red' | null;

interface ZoneData {
  id: ZoneType;
  title: string;
  time: string;
  price: string;
  description: string;
  streets: string[];
  distanceLimit: number;
  color: string;
  glowColor: string;
  bgColor: string;
}

const ZONES: ZoneData[] = [
  {
    id: 'green',
    title: 'Зеленая зона',
    time: '30-45 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Чуркин, Калинина, Окатовая, Змеинка, Диомид.',
    streets: ['надибаидзе', 'калинина', 'черемуховая', 'окатовая', 'вязовая', 'интернациональная', 'харьковская', 'гульбиновича', 'кизлярская', 'фастовская', 'березовая', 'краева', 'пихтовая'],
    distanceLimit: 4, 
    color: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/40 border-emerald-500/50',
    bgColor: 'group-hover:bg-emerald-500/10'
  },
  {
    id: 'yellow',
    title: 'Желтая зона',
    time: '45-60 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Центр, Луговая, Спортивная, Эгершельд, Гоголя.',
    streets: ['светланская', 'алеутская', 'океанский', 'луговая', 'спортивная', 'фадеева', 'некрасовская', 'гоголя', 'суханова', 'пушкинская', 'ленинская', 'тигровая', 'пограничная', 'семеновская'],
    distanceLimit: 8,
    color: 'text-amber-400',
    glowColor: 'shadow-amber-500/40 border-amber-500/50',
    bgColor: 'group-hover:bg-amber-500/10'
  },
  {
    id: 'red',
    title: 'Красная зона',
    time: '60-90 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Вторая речка, Баляева, Снеговая падь, Тихая, Патрокл.',
    streets: ['русская', 'столетия', 'баляева', 'снеговая', 'нейбута', 'кузнецова', 'ладыгина', 'борадинская', 'давыдова', 'кирова', 'магнитогорская', 'заря', 'седанка', 'патрокл', 'басаргина'],
    distanceLimit: 15,
    color: 'text-rose-400',
    glowColor: 'shadow-rose-500/40 border-rose-500/50',
    bgColor: 'group-hover:bg-rose-500/10'
  }
];

export const DeliveryInfo: React.FC = () => {
  const [addressInput, setAddressInput] = useState('');
  const [detectedZone, setDetectedZone] = useState<ZoneType>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' } | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const handleGeoCheck = () => {
    if (!navigator.geolocation) {
      setFeedback({ text: "Геолокация недоступна", type: 'error' });
      return;
    }
    setIsSearching(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, latitude, longitude);
        
        let zone: ZoneType = null;
        if (dist <= ZONES[0].distanceLimit) zone = 'green';
        else if (dist <= ZONES[1].distanceLimit) zone = 'yellow';
        else if (dist <= ZONES[2].distanceLimit) zone = 'red';
        
        setDetectedZone(zone);
        if (zone) {
            setFeedback({ text: `Вы в зоне доставки (${dist.toFixed(1)} км)`, type: 'success' });
        } else {
            setFeedback({ text: `Вы слишком далеко (${dist.toFixed(1)} км)`, type: 'error' });
        }
        setIsSearching(false);
      },
      () => {
        setIsSearching(false);
        setFeedback({ text: "Ошибка определения", type: 'error' });
      }
    );
  };

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setIsSearching(true);
    setFeedback(null);
    setDetectedZone(null);

    try {
        const result = await checkAddressZone(addressInput);
        
        if (result.found) {
            setDetectedZone(result.zone);
            if (result.zone) {
                setFeedback({ 
                    text: `Нашли: ${result.formattedAddress} (~${result.distance} км)`, 
                    type: 'success' 
                });
            } else {
                setFeedback({ 
                    text: `${result.formattedAddress} - слишком далеко (~${result.distance} км)`, 
                    type: 'error' 
                });
            }
        } else {
            setFeedback({ text: "Адрес не найден. Попробуйте уточнить.", type: 'error' });
        }
    } catch (error) {
        setFeedback({ text: "Ошибка сервиса карт", type: 'error' });
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <section className="py-20 relative z-10 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
             <Car size={14} className="animate-bounce" /> Доставка по Владивостоку
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>Зоны доставки</h2>
          
          {/* Elegant Search Bar */}
          <div className="max-w-xl mx-auto relative group z-20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
             <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500 animate-shine bg-[length:200%_auto]"></div>
             <div className="relative glass rounded-xl p-2 flex items-center gap-2 bg-slate-900/80">
                <Search className="text-slate-400 ml-3 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <form onSubmit={handleTextSearch} className="flex-1">
                  <input 
                      type="text" 
                      placeholder="Введите улицу (например: Светланская)" 
                      className="bg-transparent border-none outline-none text-white w-full py-2 placeholder:text-slate-500"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                  />
                </form>
                <button 
                  type="button"
                  onClick={handleGeoCheck}
                  disabled={isSearching}
                  className="p-2.5 hover:bg-white/10 text-indigo-400 rounded-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Найти меня"
                >
                  <Navigation size={20} className={isSearching ? 'animate-spin' : ''} />
                </button>
             </div>
             
             {/* Feedback Toast */}
             {feedback && (
               <div className={`absolute -bottom-12 left-0 w-full flex justify-center animate-in slide-in-from-top-2`}>
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 ${
                      feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      feedback.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-slate-800 text-slate-300'
                  }`}>
                      {feedback.type === 'error' && <AlertCircle size={14} />}
                      {feedback.type === 'success' && <CheckCircle2 size={14} />}
                      {feedback.text}
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {ZONES.map((zone, idx) => {
             const isActive = detectedZone === zone.id;
             return (
               <div 
                 key={zone.id}
                 className={`group relative overflow-hidden rounded-[2rem] p-8 border transition-all duration-500 h-full flex flex-col hover:-translate-y-2 hover:shadow-2xl animate-fade-in ${
                   isActive 
                     ? `bg-slate-900/90 ${zone.glowColor} scale-105 z-10 ring-1 ring-white/10` 
                     : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                 }`}
                 style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
               >
                 {/* Internal Ambient Glow */}
                 <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] transition-all duration-700 opacity-0 group-hover:opacity-100 ${zone.bgColor.replace('group-hover:bg-', 'bg-')}`}></div>
                 
                 {/* Active status Indicator */}
                 <div className={`absolute top-6 right-6 transition-all duration-500 transform ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    <div className="bg-white text-slate-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                       <CheckCircle2 size={12} className="text-green-600" /> Ваш адрес
                    </div>
                 </div>

                 <div className="relative z-10 mb-6">
                    <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${zone.color} group-hover:text-white`}>
                      {zone.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
                       <Clock size={14} className="group-hover:rotate-[360deg] transition-transform duration-700" /> {zone.time}
                    </div>
                 </div>

                 <p className="relative z-10 text-slate-400 text-sm leading-relaxed mb-8 flex-1 group-hover:text-slate-200 transition-colors">
                    {zone.description}
                 </p>

                 <div className="relative z-10 pt-6 border-t border-white/5 group-hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <Wallet size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" /> 
                          {zone.price}
                       </div>
                       <ChevronRight size={16} className={`text-slate-500 transition-transform duration-300 ${isActive ? 'translate-x-1 text-white' : 'group-hover:translate-x-1 group-hover:text-white'}`} />
                    </div>
                 </div>
               </div>
             );
          })}
        </div>

        {/* Footer Info / Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
           {/* Schedule */}
           <div className="group glass rounded-[2rem] p-8 flex items-center gap-6 border border-white/5 hover:bg-white/5 transition-all duration-500 hover:scale-[1.01]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                 <Clock size={32} />
              </div>
              <div>
                 <h4 className="text-xl text-white font-bold mb-2 group-hover:text-indigo-200 transition-colors">График работы</h4>
                 <p className="text-slate-300 text-sm mb-1">Ежедневно с 09:00 до 21:00</p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Прием заказов до 19:00</p>
                 </div>
              </div>
           </div>

           {/* Payment Methods */}
           <div className="group glass rounded-[2rem] p-8 flex items-center gap-6 border border-white/5 hover:bg-white/5 transition-all duration-500 hover:scale-[1.01]">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border border-fuchsia-500/20 shadow-[0_0_20px_rgba(232,121,249,0.15)]">
                 <Banknote size={32} />
              </div>
              <div>
                 <h4 className="text-xl text-white font-bold mb-2 group-hover:text-fuchsia-200 transition-colors">Способы оплаты</h4>
                 <div className="flex flex-wrap gap-2">
                    {['Картой', 'Наличными', 'Счет для юр.лиц'].map((method, i) => (
                       <span key={i} className="px-3 py-1 bg-white/5 rounded-lg text-xs font-medium text-slate-300 border border-white/5 group-hover:border-white/20 transition-colors">
                          {method}
                       </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
};
