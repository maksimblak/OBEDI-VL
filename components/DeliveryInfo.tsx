
import React, { useState } from 'react';
import { MapPin, Clock, Wallet, Banknote, Car, AlertCircle, Search, Navigation, CheckCircle2, XCircle } from 'lucide-react';

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
  streets: string[]; // Mock database of streets for text search
  distanceLimit: number; // km from restaurant
  color: string;
  borderColor: string;
}

const ZONES: ZoneData[] = [
  {
    id: 'green',
    title: 'Зеленая зона (Чуркин)',
    time: '~30-45 мин',
    price: 'Бесплатно от 1500₽',
    description: 'Район Чуркин, Калинина, Окатовая, Змеинка, Диомид.',
    streets: ['надибаидзе', 'калинина', 'черемуховая', 'окатовая', 'вязовая', 'интернациональная', 'харьковская', 'гульбиновича', 'кизлярская', 'фастовская', 'березовая', 'краева', 'пихтовая'],
    distanceLimit: 4, // km
    color: 'bg-green-500',
    borderColor: 'border-green-500'
  },
  {
    id: 'yellow',
    title: 'Желтая зона (Центр/Луговая)',
    time: '~45-60 мин',
    price: 'Бесплатно от 2500₽',
    description: 'Центр города, Луговая, Спортивная, Эгершельд, Гоголя.',
    streets: ['светланская', 'алеутская', 'океанский', 'луговая', 'спортивная', 'фадеева', 'некрасовская', 'гоголя', 'суханова', 'пушкинская', 'ленинская', 'тигровая', 'пограничная', 'семеновская'],
    distanceLimit: 8, // km
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-500'
  },
  {
    id: 'red',
    title: 'Красная зона (Дальняя)',
    time: '~60-90 мин',
    price: 'Бесплатно от 3500₽',
    description: 'Вторая речка, Баляева, Снеговая падь, Тихая, Патрокл.',
    streets: ['русская', 'столетия', 'баляева', 'снеговая', 'нейбута', 'кузнецова', 'ладыгина', 'борадинская', 'давыдова', 'кирова', 'магнитогорская', 'заря', 'седанка', 'патрокл', 'басаргина'],
    distanceLimit: 15, // km
    color: 'bg-red-500',
    borderColor: 'border-red-500'
  }
];

export const DeliveryInfo: React.FC = () => {
  const [addressInput, setAddressInput] = useState('');
  const [detectedZone, setDetectedZone] = useState<ZoneType>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleGeoCheck = () => {
    if (!navigator.geolocation) {
      setFeedback("Геолокация не поддерживается вашим браузером");
      return;
    }

    setIsSearching(true);
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, latitude, longitude);
        
        // Determine zone by distance
        let zone: ZoneType = null;
        if (dist <= ZONES[0].distanceLimit) zone = 'green';
        else if (dist <= ZONES[1].distanceLimit) zone = 'yellow';
        else if (dist <= ZONES[2].distanceLimit) zone = 'red';
        
        setDetectedZone(zone);
        if (zone) {
            setFeedback(`Расстояние: ~${dist.toFixed(1)} км. Ваша зона определена!`);
        } else {
            setFeedback(`Расстояние: ~${dist.toFixed(1)} км. К сожалению, вы слишком далеко.`);
        }
        setIsSearching(false);
      },
      (error) => {
        setIsSearching(false);
        setFeedback("Не удалось определить местоположение. Введите адрес вручную.");
      }
    );
  };

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setIsSearching(true);
    setFeedback(null);
    setDetectedZone(null);

    // Simulate generic search delay
    setTimeout(() => {
        const lowerInput = addressInput.toLowerCase();
        let foundZone: ZoneType = null;

        // Check explicit street lists first
        for (const zone of ZONES) {
            if (zone.streets.some(street => lowerInput.includes(street))) {
                foundZone = zone.id;
                break;
            }
        }

        // Fallback for "Use exact text logic" if needed, but street list is safer for simulation
        if (!foundZone) {
            if (lowerInput.includes('владивосток')) foundZone = 'yellow'; // Default to yellow for general city
        }

        setDetectedZone(foundZone);
        if (foundZone) {
            setFeedback("Мы нашли вашу улицу! Смотрите результат ниже.");
        } else {
            setFeedback("Улица не найдена в базе. Свяжитесь с оператором для уточнения.");
        }
        setIsSearching(false);
    }, 600);
  };

  return (
    <section className="py-24 relative z-10 bg-surface/30 backdrop-blur-sm border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
             <Car size={14} /> Ресторан: ул. Надибаидзе, 28
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Проверка адреса доставки</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Введите улицу или используйте геолокацию, чтобы точно узнать время и стоимость доставки.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto glass p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row gap-2 relative z-20">
             <form onSubmit={handleTextSearch} className="flex-1 flex items-center bg-slate-900/50 rounded-xl px-4 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                 <Search className="text-slate-500 mr-3" size={20} />
                 <input 
                    type="text" 
                    placeholder="Введите улицу (например: Светланская)" 
                    className="bg-transparent border-none outline-none text-white w-full py-3 placeholder:text-slate-500"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                 />
             </form>
             <div className="flex gap-2">
                 <button 
                    type="button"
                    onClick={handleGeoCheck}
                    className="p-3 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl transition border border-white/5 tooltip-trigger"
                    title="Определить мое местоположение"
                 >
                     <Navigation size={20} className={isSearching ? 'animate-pulse' : ''} />
                 </button>
                 <button 
                    onClick={handleTextSearch}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
                 >
                     {isSearching ? 'Поиск...' : 'Проверить'}
                 </button>
             </div>
          </div>
          
          {feedback && (
             <div className={`mt-4 text-sm font-medium animate-fade-in ${detectedZone ? 'text-green-400' : 'text-slate-400'}`}>
                {feedback}
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Delivery Zones Cards */}
          <div className="space-y-4">
             {ZONES.map((zone) => {
                 const isActive = detectedZone === zone.id;
                 return (
                    <div 
                        key={zone.id}
                        className={`group relative flex items-start gap-4 p-6 rounded-3xl border transition-all duration-500 ${
                            isActive 
                              ? `bg-white/10 ${zone.borderColor} shadow-[0_0_30px_rgba(0,0,0,0.3)] scale-105 z-10` 
                              : `bg-white/5 border-white/5 hover:border-white/10 ${detectedZone ? 'opacity-50 blur-[1px]' : ''}`
                        }`}
                    >
                        {isActive && (
                            <div className="absolute -top-3 -right-3 bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-bounce">
                                <CheckCircle2 size={12} className="text-green-600" /> Ваш адрес
                            </div>
                        )}
                        
                        <div className={`mt-1 w-4 h-4 rounded-full ${zone.color} shadow-[0_0_15px_currentColor] shrink-0 transition-transform group-hover:scale-125`}></div>
                        
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                                <h3 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                    {zone.title}
                                </h3>
                                <div className="flex gap-2">
                                    <span className={`text-xs font-mono px-2 py-1 rounded bg-slate-950/50 border border-white/10 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                        {zone.time}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-400 leading-relaxed mb-3">
                                {zone.description}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-2 rounded-lg w-fit">
                                <Wallet size={14} /> {zone.price}
                            </div>
                        </div>
                    </div>
                 );
             })}
          </div>

          {/* Payment Info */}
          <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
             {/* Map Background Decoration */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
             </div>

             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Условия оплаты</h3>
                        <p className="text-xs text-slate-400">Принимаем все виды платежей</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition border border-white/5 text-center">
                        <div className="text-white font-bold mb-1">Наличные</div>
                        <div className="text-xs text-slate-500">Курьеру</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition border border-white/5 text-center">
                        <div className="text-white font-bold mb-1">Терминал</div>
                        <div className="text-xs text-slate-500">При получении</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition border border-white/5 text-center">
                        <div className="text-white font-bold mb-1">Онлайн</div>
                        <div className="text-xs text-slate-500">На сайте</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition border border-white/5 text-center">
                        <div className="text-white font-bold mb-1">Счет</div>
                        <div className="text-xs text-slate-500">Для юр.лиц</div>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-start gap-3">
                        <Clock size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="block text-white font-bold text-sm mb-1">График работы доставки</span>
                            <div className="flex justify-between text-sm text-slate-400 mb-1">
                                <span>Пн-Вс:</span>
                                <span className="text-white">09:00 — 21:00</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2 border-t border-white/5 pt-2">
                                Заказы на текущий день принимаем до 19:00. <br/>
                                Предзаказ на завтра — круглосуточно.
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};
