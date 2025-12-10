
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, Wallet, Banknote, Car, Navigation, Search, CheckCircle2, ChevronRight, AlertCircle, Home, ArrowRight } from 'lucide-react';
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
  // Styling props
  themeColor: string;
  pillColor: string;
  gradient: string;
}

const ZONES: ZoneData[] = [
  {
    id: 'green',
    title: 'Зеленая зона',
    time: '30-45 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Чуркин, Калинина, Окатовая, Змеинка, Диомид.',
    distanceLimit: 4, 
    themeColor: 'text-emerald-400',
    pillColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    gradient: 'from-emerald-500/20',
  },
  {
    id: 'yellow',
    title: 'Желтая зона',
    time: '45-60 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Центр, Луговая, Спортивная, Эгершельд, Гоголя.',
    distanceLimit: 8,
    themeColor: 'text-amber-400',
    pillColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    gradient: 'from-amber-500/20',
  },
  {
    id: 'red',
    title: 'Красная зона',
    time: '60-90 мин',
    price: 'Бесплатно от 3000₽',
    description: 'Вторая речка, Баляева, Снеговая падь, Тихая, Патрокл.',
    distanceLimit: 15,
    themeColor: 'text-rose-400',
    pillColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    gradient: 'from-rose-500/20',
  }
];

// Massively expanded list of Vladivostok streets (Keep the original list logic)
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
    setShowHouseHint(false);

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
    const newVal = `${street} `; 
    setAddressInput(newVal);
    setSuggestions([]);
    setShowHouseHint(true);
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
                setFeedback({ 
                    text: `Мы доставляем сюда! (${result.formattedAddress}, ~${result.distance} км)`, 
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
    <section className="py-24 relative z-10 overflow-hidden bg-slate-950">
      {/* Deep Background Elements */}
      <div className="absolute inset-0">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[100px] opacity-40"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-900/10 rounded-full blur-[80px] opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header and Search */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Car size={14} /> Карта доставки
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Зоны доставки
                </h2>
                <p className="text-slate-400 text-lg">
                  Проверьте свой адрес, чтобы узнать время доставки и условия.
                </p>
            </div>

            {/* Compact Glass Search */}
            <div className="w-full lg:w-auto relative z-30">
               <div className="relative group min-w-[320px] lg:w-[400px]">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl opacity-30 group-hover:opacity-60 blur transition duration-300"></div>
                 <div className="relative bg-slate-900 border border-white/10 rounded-xl flex items-center shadow-2xl">
                    <Search className="text-slate-500 ml-4 shrink-0" size={18} />
                    <form onSubmit={handleTextSearch} className="flex-1">
                      <input 
                          ref={inputRef}
                          type="text" 
                          placeholder="Введите улицу и дом..."
                          className="bg-transparent border-none outline-none text-white w-full px-3 py-3.5 text-sm placeholder:text-slate-500"
                          value={addressInput}
                          onChange={handleInputChange}
                          autoComplete="off"
                      />
                    </form>
                    <button 
                      onClick={handleGeoCheck}
                      disabled={isSearching}
                      className="p-3 hover:bg-white/5 text-indigo-400 rounded-r-xl transition-colors"
                      title="Найти меня"
                    >
                      <Navigation size={18} className={isSearching ? 'animate-spin' : ''} />
                    </button>
                 </div>

                 {/* Dropdown */}
                 {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
                       {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex items-center gap-2"
                          >
                             <MapPin size={14} className="text-indigo-400" />
                             {suggestion}
                          </button>
                       ))}
                    </div>
                 )}
               </div>

               {/* Status Message */}
               {feedback && (
                  <div className={`mt-3 flex items-start gap-2 text-sm p-3 rounded-lg border ${
                      feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 
                      feedback.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                      'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                      <div className="mt-0.5 shrink-0">
                        {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <span className="leading-snug">{feedback.text}</span>
                  </div>
               )}
            </div>
        </div>

        {/* Zones Grid - Stylish Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {ZONES.map((zone) => {
             const isActive = detectedZone === zone.id;
             return (
               <div 
                 key={zone.id}
                 className={`group relative flex flex-col h-full bg-[#0B1121] border rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                   isActive 
                    ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-[1.02] z-10' 
                    : 'border-white/5 hover:border-white/10 shadow-lg'
                 }`}
               >
                 {/* Top Gradient */}
                 <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${zone.gradient} to-transparent opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                 
                 {/* Active Badge */}
                 {isActive && (
                    <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-lg z-20 flex items-center gap-1">
                       <MapPin size={10} fill="currentColor" /> Ваш адрес
                    </div>
                 )}

                 <div className="p-8 flex flex-col flex-1 relative z-10">
                    <h3 className={`text-2xl font-bold mb-4 ${zone.themeColor}`}>
                      {zone.title}
                    </h3>
                    
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium w-fit mb-6 ${zone.pillColor}`}>
                       <Clock size={16} />
                       {zone.time}
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-8 flex-1 text-[15px]">
                       {zone.description}
                    </p>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors">
                       <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <Wallet size={18} className={zone.themeColor} />
                          {zone.price}
                       </div>
                       <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-all`}>
                          <ChevronRight size={16} />
                       </div>
                    </div>
                 </div>
               </div>
             );
          })}
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Schedule */}
           <div className="bg-[#0B1121] border border-white/5 rounded-2xl p-6 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                 <Clock size={24} />
              </div>
              <div>
                 <h4 className="text-white font-bold mb-1">Режим работы</h4>
                 <p className="text-slate-400 text-sm mb-2">Заказы на сайте круглосуточно. Операторы с 08:00 до 16:00.</p>
              </div>
           </div>

           {/* Payment */}
           <div className="bg-[#0B1121] border border-white/5 rounded-2xl p-6 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 shrink-0 border border-fuchsia-500/20">
                 <Banknote size={24} />
              </div>
              <div>
                 <h4 className="text-white font-bold mb-1">Оплата</h4>
                 <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Картой</span>
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Наличными</span>
                    <span className="px-2 py-1 bg-white/5 rounded border border-white/5">Счет для юр.лиц</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
};
