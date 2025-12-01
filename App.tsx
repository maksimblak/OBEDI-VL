
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, ArrowRight, Clock, Utensils, Truck, Star, ChevronDown, ChevronUp, MapPin, PlayCircle, Settings2, RotateCcw, History, User as UserIcon, LogIn, Menu as MenuIcon, X, Zap, ChefHat } from 'lucide-react';
import { MenuSection } from './components/MenuSection';
import { CartSidebar } from './components/CartSidebar';
import { AIChef } from './components/AIChef';
import { ProductModal } from './components/ProductModal';
import { LunchConstructor } from './components/LunchConstructor';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { DeliveryInfo } from './components/DeliveryInfo';
import { Logo } from './components/Logo';
import { MenuItem, CartItem, Category, Order, User } from './types';
import { historyService } from './services/historyService';
import { authService } from './services/authService';
import { MOCK_MENU, IMAGES, REVIEWS, FAQ } from './data';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('lunch');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Load init state
  useEffect(() => {
    // Check auth
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Check history (if user logs in, we might want to reload this, but for now simple check)
    const last = historyService.getLastOrder(currentUser?.id);
    if (last) setLastOrder(last);

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const addMultipleToCart = (items: MenuItem[]) => {
    items.forEach(item => {
      setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
          return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleRepeatOrder = () => {
    if (lastOrder) {
      setCart(lastOrder.items);
      setIsCartOpen(true);
      setLastOrder(null); // Hide notification
    }
  };

  const handleCheckoutComplete = () => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    historyService.saveOrder(cart, total, user?.id);
    
    // Optimistically update lastOrder for the UI before clearing cart
    const tempCart = [...cart];
    
    setLastOrder({
      id: Date.now().toString(),
      userId: user?.id,
      date: new Date().toISOString(),
      items: tempCart,
      total,
      status: 'pending'
    });
    
    setCart([]); // Clear cart
    
    setTimeout(() => {
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
    }, 2000);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
      setUser(loggedInUser);
      // Refresh last order for this user
      const last = historyService.getLastOrder(loggedInUser.id);
      if (last) setLastOrder(last);
  };

  const handleLogout = () => {
      authService.logout();
      setUser(null);
      setIsProfileOpen(false);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const upsellItems = MOCK_MENU.filter(i => i.category === 'extras');

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass border-b border-white/10 py-3 shadow-lg shadow-indigo-500/5' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
             {/* Mobile Hamburger */}
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
             >
               {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
             </button>

             <div className="cursor-pointer group transform scale-90 sm:scale-100 origin-left" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
               <Logo />
             </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-200">
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Как это работает
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all group-hover:w-full box-shadow-[0_0_8px_currentColor]"></span>
              </button>
              <button onClick={() => scrollToSection('menu-start')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Меню
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Отзывы
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all group-hover:w-full"></span>
              </button>
            </nav>
            <div className="hidden lg:block h-6 w-px bg-white/20"></div>
            
            {/* User / Login Button */}
            {user ? (
               <button 
                 onClick={() => setIsProfileOpen(true)}
                 className="hidden lg:flex items-center gap-2 text-sm text-indigo-200 hover:text-white transition group"
               >
                 <div className="w-8 h-8 rounded-full bg-surface border border-indigo-400 flex items-center justify-center text-white font-bold text-xs group-hover:border-white transition shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                   {user.name.charAt(0)}
                 </div>
                 {user.name.split(' ')[0]}
               </button>
            ) : (
               <button 
                 onClick={() => setIsAuthOpen(true)}
                 className="hidden lg:flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition"
               >
                 <LogIn size={18} /> Войти
               </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium hover:bg-white/20 hover:border-white/30 transition-all active:scale-95 group shadow-lg shadow-black/20"
            >
              <ShoppingBag size={18} className="group-hover:text-fuchsia-300 transition-colors" />
              <span className="hidden sm:inline">Корзина</span>
              {cartCount > 0 && (
                <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-surface/95 backdrop-blur-xl border-t border-white/10 p-4 flex flex-col gap-4">
             {user ? (
                <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-indigo-300">{user.loyaltyPoints} бонусов</div>
                  </div>
                </div>
             ) : (
                <button onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-indigo-300 p-2">
                   <LogIn size={18} /> Войти в аккаунт
                </button>
             )}
             <button onClick={() => scrollToSection('menu-start')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Меню доставки</button>
             <button onClick={() => scrollToSection('how-it-works')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Как это работает</button>
             <button onClick={() => scrollToSection('reviews')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Отзывы</button>
             <button onClick={() => scrollToSection('faq')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Вопросы и ответы</button>
          </div>
        </div>
      </nav>

      {/* Repeat Order Notification Toast */}
      {lastOrder && !isCheckoutOpen && (
        <div className="fixed top-20 right-4 md:right-8 z-40 animate-in slide-in-from-right duration-700">
           <div className="glass p-3 md:p-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-indigo-500/40 bg-indigo-900/40 max-w-[320px] md:max-w-sm backdrop-blur-xl">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                <RotateCcw size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-bold truncate">С возвращением!</div>
                <div className="text-xs text-indigo-200 truncate">Повторить заказ на {lastOrder.total} ₽?</div>
              </div>
              <button 
                onClick={handleRepeatOrder}
                className="bg-white text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500 hover:text-white transition"
              >
                Да
              </button>
              <button onClick={() => setLastOrder(null)} className="text-indigo-300 hover:text-white">
                <ChevronDown size={14} />
              </button>
           </div>
        </div>
      )}

      {/* HERO SECTION - REIMAGINED */}
      <header className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden pb-10">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
            <img 
              src={IMAGES.hero} 
              alt="Background" 
              className="w-full h-full object-cover scale-105 animate-pulse-slow"
              style={{ animationDuration: '20s' }}
            />
            {/* Dark Gradient Overlay with Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950"></div>
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950 opacity-90"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center pt-32 md:pt-48 flex flex-col items-center">
          
          {/* Glowing Backlight behind Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-fade-in hover:bg-white/10 transition-colors cursor-default">
            <Zap size={14} className="text-yellow-400 fill-yellow-400 animate-bounce" />
            Вкусные обеды №1
          </div>
          
          {/* Main Typography - Restored Clean Style */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-12 leading-tight drop-shadow-2xl animate-fade-in">
             Комплексные обеды <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400 relative">
               премиум-класса
             </span>
          </h1>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-20 mb-16 w-full max-w-md sm:max-w-none animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <button 
              onClick={() => setIsConstructorOpen(true)}
              className="relative overflow-hidden bg-white text-indigo-950 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-white to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Settings2 size={22} className="relative z-10 text-indigo-600" /> 
              <span className="relative z-10">Собрать ланч</span>
            </button>
            <button 
              onClick={() => scrollToSection('menu-start')} 
              className="px-10 py-5 glass border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 flex items-center justify-center gap-3 group text-lg"
            >
              <Utensils size={22} className="text-fuchsia-400 group-hover:rotate-12 transition-transform" />
              Меню
            </button>
          </div>
          
          {/* Stats Grid - Floating Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.7s' }}>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-indigo-500/30 hover:-translate-y-1 transition-transform">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg">45<span className="text-indigo-400 text-lg align-top">+</span></div>
                <div className="text-xs text-indigo-200 uppercase tracking-widest font-bold">мин. доставка</div>
             </div>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-fuchsia-500/30 hover:-translate-y-1 transition-transform">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg">500<span className="text-fuchsia-400 text-lg align-top">+</span></div>
                <div className="text-xs text-fuchsia-200 uppercase tracking-widest font-bold">обедов/день</div>
             </div>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-cyan-500/30 hover:-translate-y-1 transition-transform">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg flex items-center gap-1">4.9 <Star size={20} className="fill-yellow-400 text-yellow-400" /></div>
                <div className="text-xs text-cyan-200 uppercase tracking-widest font-bold">народный рейтинг</div>
             </div>
          </div>

        </div>

      </header>

      {/* Process Section */}
      <section id="how-it-works" className="py-16 md:py-24 relative z-10 bg-slate-950">
         {/* Ambient background blob for transition */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-indigo-900/20 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Сервис нового поколения</h2>
            <p className="text-slate-300 text-lg">Закажите вкусный обед в пару кликов.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
             <div className="glass p-8 rounded-3xl group hover:bg-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-lg hover:shadow-indigo-500/10">
               <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                 <Utensils size={28} />
               </div>
               <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors">Умное меню</h3>
               <p className="text-slate-400 leading-relaxed group-hover:text-slate-300">AI помогает выбрать идеальный обед на основе ваших предпочтений за пару секунд.</p>
             </div>

             <div className="glass p-8 rounded-3xl group hover:bg-white/5 hover:border-fuchsia-500/50 transition-all duration-500 shadow-lg hover:shadow-fuchsia-500/10">
               <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500/30 to-pink-500/30 text-fuchsia-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                 <Clock size={28} />
               </div>
               <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-fuchsia-300 transition-colors">Готовим сейчас</h3>
               <p className="text-slate-400 leading-relaxed group-hover:text-slate-300">Никаких заготовок. Шеф-повар начинает готовить сразу после клика "Заказать".</p>
             </div>

             <div className="glass p-8 rounded-3xl group hover:bg-white/5 hover:border-cyan-500/50 transition-all duration-500 shadow-lg hover:shadow-cyan-500/10">
               <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                 <Truck size={28} />
               </div>
               <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">Турбо-доставка</h3>
               <p className="text-slate-400 leading-relaxed group-hover:text-slate-300">Оптимизированные маршруты позволяют доставлять обеды горячими прямо к вашему столу.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Infinite Marquee - Moved Here */}
      <div className="relative w-full overflow-hidden bg-indigo-950/30 border-y border-white/10 py-4 z-10 backdrop-blur-sm">
        <div className="flex animate-marquee whitespace-nowrap">
          {[1,2,3,4].map((i) => (
             <div key={i} className="flex items-center gap-12 px-6 text-indigo-200 font-medium text-sm uppercase tracking-widest drop-shadow-sm">
                <span>⚡ Быстрая доставка обедов</span>
                <span className="text-fuchsia-400 drop-shadow-[0_0_5px_currentColor]">•</span>
                <span>🔥 Горячие блюда</span>
                <span className="text-fuchsia-400 drop-shadow-[0_0_5px_currentColor]">•</span>
                <span>🥗 Меню обновляется ежедневно</span>
                <span className="text-fuchsia-400 drop-shadow-[0_0_5px_currentColor]">•</span>
                <span>🍲 По-домашнему вкусно</span>
                <span className="text-fuchsia-400 drop-shadow-[0_0_5px_currentColor]">•</span>
             </div>
          ))}
        </div>
      </div>

      {/* Menu Area */}
      <MenuSection 
        items={MOCK_MENU} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        onAddToCart={addToCart}
        onOpenModal={setModalItem}
      />

      {/* Reviews Section */}
      <section id="reviews" className="py-24 relative z-10 border-t border-white/10 bg-surface/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Впечатления</h2>
              <p className="text-slate-400 max-w-md">Выбор топ-менеджеров и офисных команд Владивостока.</p>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border-white/20">
              <div className="flex">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-amber-400 text-amber-400 drop-shadow-sm" />)}
              </div>
              <span className="text-white font-bold ml-1">4.9</span>
              <span className="text-indigo-200 text-sm">/ 5.0</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map(review => (
              <div key={review.id} className="glass p-8 rounded-3xl hover:bg-white/5 hover:border-white/20 transition-all duration-300 group">
                <div className="mb-6 opacity-80">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-indigo-500 text-indigo-500 inline-block mr-1 group-hover:fill-fuchsia-500 group-hover:text-fuchsia-500 transition-colors" />)}
                </div>
                <p className="text-slate-200 mb-6 leading-relaxed italic">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{review.name}</div>
                    <div className="text-xs text-indigo-300">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Info Section */}
      <DeliveryInfo />

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-12 text-center drop-shadow-lg">Важное</h2>
        <div className="space-y-4">
          {FAQ.map((item, idx) => (
            <div key={idx} className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10">
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-white pr-8">{item.q}</span>
                {openFaq === idx ? <ChevronUp className="text-indigo-400" /> : <ChevronDown className="text-slate-500" />}
              </button>
              <div className={`px-6 text-slate-300 leading-relaxed overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 pt-24 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_10px_#6366f1]"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
               <div className="mb-6">
                 <Logo variant="footer" />
               </div>
              <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
                Доставка комплексных обедов в офис и на дом. <br/>
                Владивосток, 2024.
              </p>
              <div className="flex gap-4">
                 <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                 </a>
                 <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600 hover:border-pink-500 transition-all hover:shadow-[0_0_15px_rgba(219,39,119,0.5)]">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468.99c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                 </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Сервис</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-fuchsia-400 transition">Как это работает</button></li>
                <li><button onClick={() => scrollToSection('menu-start')} className="hover:text-fuchsia-400 transition">Меню доставки</button></li>
                <li><button onClick={() => scrollToSection('reviews')} className="hover:text-fuchsia-400 transition">Отзывы</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-fuchsia-400 transition">Вопросы и ответы</button></li>
              </ul>
            </div>

            <div>
               <h4 className="font-bold text-white mb-6">Контакты</h4>
               <ul className="space-y-4 text-slate-400 text-sm">
                 <li className="flex items-start gap-3">
                   <MapPin size={18} className="text-indigo-400 mt-0.5 drop-shadow-sm" />
                   <span>г. Владивосток,<br/>ул. Светланская 10, оф. 3</span>
                 </li>
                 <li className="flex items-center gap-3">
                   <Phone size={18} className="text-indigo-400 drop-shadow-sm" />
                   <span>8 (902) 556-28-53</span>
                 </li>
                 <li className="flex items-center gap-3">
                   <Clock size={18} className="text-indigo-400 drop-shadow-sm" />
                   <span>Пн-Пт: 09:00 - 18:00</span>
                 </li>
               </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2024 OBEDI VL. Made with love & code.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-slate-300 transition">Privacy</a>
              <a href="#" className="hover:text-slate-300 transition">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        upsellItems={upsellItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onAddToCart={addToCart}
        onCheckout={() => setIsCheckoutOpen(true)}
      />
      
      <ProductModal 
        item={modalItem} 
        onClose={() => setModalItem(null)} 
        onAddToCart={addToCart} 
      />

      {isConstructorOpen && (
        <LunchConstructor 
          onClose={() => setIsConstructorOpen(false)}
          onAddToCart={addMultipleToCart}
          allItems={MOCK_MENU}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal 
          cart={cart}
          total={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={handleCheckoutComplete}
        />
      )}

      {isAuthOpen && (
        <AuthModal 
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={handleLoginSuccess}
        />
      )}

      {user && (
        <UserProfile 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            onLogout={handleLogout}
            onUpdateUser={setUser}
        />
      )}
      
      <AIChef />
    </div>
  );
}
