
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Wallet, Banknote, Car, Navigation, Search, CheckCircle2, ChevronRight, AlertCircle, Home } from 'lucide-react';
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
    distanceLimit: 15,
    color: 'text-rose-400',
    glowColor: 'shadow-rose-500/40 border-rose-500/50',
    bgColor: 'group-hover:bg-rose-500/10'
  }
];

// Massively expanded list of Vladivostok streets
const VLADIVOSTOK_STREETS = [
  "1-я Морская ул", "1-я Поселковая ул", "1-я Промышленная ул", "100-летия Владивостока пр-кт", 
  "40 лет ВЛКСМ ул", "50 лет ВЛКСМ ул", "Абрекская ул", "Авроровская ул", "Адмирала Горшкова ул", 
  "Адмирала Захарова ул", "Адмирала Корнилова ул", "Адмирала Кузнецова ул", "Адмирала Макарова ул",
  "Адмирала Невельского ул", "Адмирала Смирнова ул", "Адмирала Фокина ул", "Адмирала Юмашева ул",
  "Аксаковская ул", "Алеутская ул", "Александровича ул", "Аллилуева ул", "Алтайская ул", "Амурская ул", 
  "Анны Щетининой ул", "Арсеньева ул", "Арсенальная ул", "Артековская ул", "Артиллерийская ул",
  "Байдукова ул", "Балтийская ул", "Баляева ул", "Баратаева ул", "Бархатная ул", "Басаргина ул", 
  "Батарейная ул", "Башидзе ул", "Беговая ул", "Береговая ул", "Березовая ул", "Бестужева ул", 
  "Борисенко ул", "Бородинская ул", "Братская ул", "Брестский пер", "Бурачка ул", "Ватутина ул", 
  "Верхнепортовая ул", "Верещагина ул", "Виктория ул", "Вилкова ул", "Вилюйская ул", "Виргинская ул",
  "Владикавказская ул", "Военное Шоссе ул", "Волжская ул", "Володарского ул", "Волховская ул", 
  "Воропаева ул", "Восточная ул", "Всеволода Сибирцева ул", "Вулканная ул", "Вязовая ул", 
  "Гамарника ул", "Гастелло ул", "Гашкевича ул", "Героев Варяга ул", "Героев Тихоокеанцев ул", 
  "Героев Хасана ул", "Глинки ул", "Гоголя ул", "Горная ул", "Горького ул", "Гризодубовой ул", 
  "Громова ул", "Гроссмана ул", "Гульбиновича ул", "Давыдова ул", "Дальзаводская ул", "Дальняя ул", 
  "Дежнева ул", "Демьяна Бедного ул", "Депутатская аллея", "Державина ул", "Днепровская ул", 
  "Днепровский пер", "Добровольского ул", "Достоевского ул", "Дубовая ул", "Енисейская ул", 
  "Жариковская ул", "Жигура ул", "Жуковского ул", "Завойко ул", "Залесная ул", "Западная ул", 
  "Запорожская ул", "Заречная ул", "Заря ул", "Зейская ул", "Зеленая ул", "Змеинка ул", 
  "Зои Космодемьянской ул", "Ивановская ул", "Иртышская ул", "Ильичева ул", "Иманская ул", 
  "Интернациональная ул", "Казанская ул", "Калинина ул", "Калужская ул", "Камская ул", 
  "Камский пер", "Капитана Шефнера ул", "Карабельная Набережная", "Карбышева ул", "Карьерная ул", 
  "Карякинская ул", "Каплунова ул", "Каспийская ул", "Катерная ул", "Каховская ул", "Керченская ул", 
  "Киевская ул", "Кипарисовая ул", "Кирова ул", "Кирпичный Завод", "Киффа ул", "Кленовая ул", 
  "Клубная ул", "Колесника ул", "Колхозная ул", "Командорская ул", "Коммунаров ул", "Комсомольская ул", 
  "Корнилова ул", "Космонавтов ул", "Котельникова ул", "Красного Знамени пр-кт", "Краснознаменный пер", 
  "Крыгина ул", "Кубанская ул", "Кузнецкая ул", "Кузнецова ул", "Куйбышева ул", "Курильская ул", 
  "Курчатова ул", "Кутузова ул", "Ладыгина ул", "Лазо ул", "Левитана ул", "Лейтенанта Шмидта ул", 
  "Ленинская ул", "Леонова ул", "Лермонтова ул", "Лесная ул", "Лиманная ул", "Липовая ул", 
  "Ломоносова ул", "Луговая ул", "Луцкого ул", "Лыковая ул", "Магнитогорская ул", "Майора Филиппова ул", 
  "Макарова ул", "Маковского ул", "Малая ул", "Марины Расковой ул", "Марченко ул", "Матросская ул", 
  "Махалина ул", "Маяковского ул", "Мельниковская ул", "Менделеева ул", "Металлургическая ул", 
  "Мечникова ул", "Минеральная ул", "Мира ул", "Михайловская ул", "Мичуринская ул", "Могилевская ул", 
  "Можайская ул", "Молодежная ул", "Монтажная ул", "Мордовцева ул", "Морозова ул", "Московская ул", 
  "Муравьева-Амурского ул", "Мусоргского ул", "Мыс Чумака ул", "Набережная ул", "Надибаидзе ул", 
  "Народный пр-кт", "Нахимова ул", "Невская ул", "Невельского ул", "Нейбута ул", "Некрасовская ул", 
  "Некрасовский пер", "Нерчинская ул", "Нестерова ул", "Нижнепортовая ул", "Никифорова ул", 
  "Николаевская ул", "Новоивановская ул", "Новожилова ул", "Обручева ул", "Овчинникова ул", 
  "Одесская ул", "Океанский пр-кт", "Окатовая ул", "Октябрьская ул", "Олега Кошевого ул", 
  "Ольховая ул", "Омская ул", "Онежская ул", "Орловская ул", "Осипенко ул", "Острякова пр-кт", 
  "Островского ул", "Очаковская ул", "Пальчевского ул", "Партизанский пр-кт", "Патрокл ул", 
  "Перекопский пер", "Печорская ул", "Пионерская ул", "Пихтовая ул", "Пограничная ул", "Полевая ул", 
  "Пологая ул", "Полярная ул", "Полярный пер", "Поселковая ул", "Постышева ул", "Посьетская ул", 
  "Почтовая ул", "Прапорщика Комарова ул", "Пржевальского ул", "Прибрежная ул", "Приморская ул", 
  "Приходько ул", "Проселочная ул", "Проспект 100-летия Владивостока", "Путятинская ул", 
  "Пушкинская ул", "Пятнадцатая ул", "Пятая ул", "Радио ул", "Ракетная ул", "Республиканская ул", 
  "Римского-Корсакова ул", "Руднева ул", "Русская ул", "Рылеева ул", "С. Лазо ул", "Сабанеева ул", 
  "Садовая ул", "Саперная ул", "Сахалинская ул", "Светланская ул", "Связи ул", "Северная ул", 
  "Сельская ул", "Семеновская ул", "Сергея Лазо ул", "Серова ул", "Сибирцева ул", "Сипягина ул", 
  "Славянская ул", "Слуцкого ул", "Снеговая ул", "Солнечная ул", "Сочинская ул", "Союзная ул", 
  "Спиридонова ул", "Спортивная ул", "Спутник ул", "Станюковича ул", "Стрелковая ул", "Стрелочная ул", 
  "Строительная ул", "Суханова ул", "Татарская ул", "Терешковой ул", "Тигровая ул", "Тимофеева ул", 
  "Тихоокеанская ул", "Толстого ул", "Тополиная аллея", "Трамвайная ул", "Трудовая ул", 
  "Тунгусская ул", "Тургенева ул", "Тухачевского ул", "Уборевича ул", "Угловая ул", "Украинская ул", 
  "Ульяновская ул", "Уральская ул", "Успенского ул", "Уссурийская ул", "Уткинская ул", "Учебная пер", 
  "Фадеева ул", "Фастовская ул", "Феодосийская ул", "Фирсова ул", "Флотская ул", "Фонтанная ул", 
  "Хабаровская ул", "Харьковская ул", "Херсонская ул", "Холмская ул", "Цимлянская ул", "Чапаева ул", 
  "Часовитина ул", "Черемуховая ул", "Черняховского ул", "Чехова ул", "Чкалова ул", "Чукотская ул", 
  "Шевченко ул", "Шепеткова ул", "Шилкинская ул", "Школьная ул", "Шкотская ул", "Шошина ул", 
  "Штейнберга ул", "Щитовая ул", "Щедрина ул", "Экипажная ул", "Энгельса ул", "Южно-Уральская ул", 
  "Юмашева ул", "Яблочкова ул", "Ялтинская ул"
].sort();

export const DeliveryInfo: React.FC = () => {
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detectedZone, setDetectedZone] = useState<ZoneType>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' } | null>(null);
  const [showHouseHint, setShowHouseHint] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    setShowHouseHint(false); // Hide hint if user types

    if (val.length > 1) {
      const filtered = VLADIVOSTOK_STREETS.filter(street => 
        street.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (street: string) => {
    // Add space after street name to immediately allow house number entry
    const newVal = `${street} `; 
    setAddressInput(newVal);
    setSuggestions([]);
    setShowHouseHint(true);
    
    // Keep focus and cursor at end
    if (inputRef.current) {
        inputRef.current.focus();
    }
  };

  const handleGeoCheck = () => {
    if (!navigator.geolocation) {
      setFeedback({ text: "Геолокация недоступна", type: 'error' });
      return;
    }
    setIsSearching(true);
    setFeedback(null);
    setShowHouseHint(false);

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
            setFeedback({ text: `Вы в зоне доставки (${dist.toFixed(1)} км). Отлично!`, type: 'success' });
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

    // Basic validation to check if it looks like just a street name without a number
    const hasNumber = /\d/.test(addressInput);
    if (!hasNumber) {
        setFeedback({ text: "Пожалуйста, укажите номер дома", type: 'neutral' });
        setShowHouseHint(true);
        return;
    }

    setIsSearching(true);
    setSuggestions([]); 
    setFeedback(null);
    setDetectedZone(null);
    setShowHouseHint(false);

    try {
        const result = await checkAddressZone(addressInput);
        
        if (result.found) {
            setDetectedZone(result.zone);
            if (result.zone) {
                // SUCCESS MESSAGE AS REQUESTED
                setFeedback({ 
                    text: `Отлично! Сюда возим. (${result.formattedAddress}, ~${result.distance} км)`, 
                    type: 'success' 
                });
            } else {
                setFeedback({ 
                    text: `${result.formattedAddress} - к сожалению, это слишком далеко (~${result.distance} км)`, 
                    type: 'error' 
                });
            }
        } else {
            setFeedback({ text: "Адрес не найден. Проверьте номер дома.", type: 'error' });
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
                <form onSubmit={handleTextSearch} className="flex-1 relative">
                  <input 
                      ref={inputRef}
                      type="text" 
                      placeholder={showHouseHint ? "Введите номер дома..." : "Улица и номер дома (например: Светланская 33)"}
                      className="bg-transparent border-none outline-none text-white w-full py-2 placeholder:text-slate-500"
                      value={addressInput}
                      onChange={handleInputChange}
                      autoComplete="off"
                  />
                  {showHouseHint && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded animate-pulse pointer-events-none">
                          <Home size={10} className="inline mr-1"/>
                          № дома?
                      </div>
                  )}
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

             {/* Auto-complete Dropdown */}
             {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-md animate-in slide-in-from-top-2">
                   {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-indigo-500/20 border-b border-white/5 last:border-0 transition-colors flex items-center gap-2 group/item"
                      >
                         <MapPin size={14} className="text-indigo-400 group-hover/item:scale-110 transition-transform" />
                         {suggestion}
                      </button>
                   ))}
                </div>
             )}
             
             {/* Feedback Toast */}
             {feedback && (
               <div className={`absolute -bottom-20 left-0 w-full flex justify-center animate-in slide-in-from-top-2 z-0`}>
                  <div className={`px-5 py-3 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-2 backdrop-blur-xl border ${
                      feedback.type === 'success' ? 'bg-green-500/20 text-green-300 border-green-500/40 shadow-green-500/10' : 
                      feedback.type === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/10' :
                      'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                  }`}>
                      {feedback.type === 'error' && <AlertCircle size={16} />}
                      {feedback.type === 'success' && <CheckCircle2 size={16} />}
                      {feedback.type === 'neutral' && <Home size={16} />}
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
                 <h4 className="text-xl text-white font-bold mb-2 group-hover:text-indigo-200 transition-colors">Режим работы</h4>
                 <p className="text-slate-300 text-sm mb-1">Заказы на сайте: <span className="text-white font-bold">Круглосуточно</span></p>
                 <p className="text-slate-400 text-sm mb-2">Звонки и поддержка: 08:00 - 16:00</p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Доставка обедов по графику</p>
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
