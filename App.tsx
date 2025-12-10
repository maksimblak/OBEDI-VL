import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Menu as MenuIcon, 
  X, 
  Zap, 
  Settings2, 
  RotateCcw, 
  LogIn, 
  Utensils, 
  Star, 
  Leaf,
  ChevronDown,
  Check,
  Instagram,
  Send,
  MapPin,
  Phone,
  Clock
} from 'lucide-react';
import { MenuSection } from './components/MenuSection';
import { CartSidebar } from './components/CartSidebar';
import { AIChef } from './components/AIChef';
import { ProductModal } from './components/ProductModal';
import { LunchConstructor } from './components/LunchConstructor';
import { HowItWorks } from './components/HowItWorks';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { DeliveryInfo } from './components/DeliveryInfo';
import { Logo } from './components/Logo';
import { MenuItem, CartItem, Category, Order, User } from './types';
import { historyService } from './services/historyService';
import { authService } from './services/authService';
import { evotorService } from './services/evotorService';
import { MOCK_MENU, IMAGES } from './data';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('lunch');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  
  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isConstructorOpen, setIsConstructorOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Load init state
  useEffect(() => {
    // Check auth
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Check history
    const last = historyService.getLastOrder(currentUser?.id);
    if (last) setLastOrder(last);

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Try to fetch from Evotor
    const fetchMenu = async () => {
       setIsMenuLoading(true);
       const evotorItems = await evotorService.getProducts();
       if (evotorItems.length > 0) {
         setMenuItems(evotorItems);
       }
       setIsMenuLoading(false);
    };
    
    fetchMenu();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const addMultipleToCart = useCallback((newItems: MenuItem[]) => {
    setCart(prev => {
      const updatedCart = [...prev];
      
      newItems.forEach(newItem => {
        const existingIndex = updatedCart.findIndex(item => item.id === newItem.id);
        
        if (existingIndex > -1) {
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            quantity: updatedCart[existingIndex].quantity + 1
          };
        } else {
          updatedCart.push({ ...newItem, quantity: 1 });
        }
      });
      
      return updatedCart;
    });
    setIsCartOpen(true);
  }, []);

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
      const last = historyService.getLastOrder(loggedInUser.id);
      if (last) setLastOrder(last);
  };

  const handleLogout = () => {
      authService.logout();
      setUser(null);
      setIsProfileOpen(false);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const createSet = (ids: string[]) => {
      return menuItems.filter(i => ids.includes(i.id));
  };

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-hidden font-sans">
      
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
              <button onClick={() => scrollToSection('featured-sets')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Комплексы
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all group-hover:w-full box-shadow-[0_0_8px_currentColor]"></span>
              </button>
              <button onClick={() => scrollToSection('menu-start')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Меню
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollToSection('delivery-info')} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all relative group">
                Доставка
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
             <button onClick={() => scrollToSection('featured-sets')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Готовые комплексы</button>
             <button onClick={() => scrollToSection('menu-start')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Меню доставки</button>
             <button onClick={() => scrollToSection('delivery-info')} className="text-slate-300 hover:text-white p-2 text-left font-medium">Условия доставки</button>
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

      {/* HERO SECTION */}
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
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-slate-950"></div>
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950 opacity-90"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center pt-32 md:pt-48 flex flex-col items-center">
          
          {/* Glowing Backlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100 text-xs font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-fade-in hover:bg-indigo-500/30 transition-colors cursor-default">
            <Zap size={14} className="text-yellow-400 fill-yellow-400 animate-bounce" />
            Владивосток
          </div>
          
          {/* Main Typography */}
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl animate-fade-in max-w-5xl">
             Вкусные обеды в офис <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 animate-shine bg-[length:200%_auto]">
               с доставкой за 45 минут
             </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
             Готовим "из-под ножа" сразу после заказа. Бесплатная доставка от 3000₽. Меню обновляется каждый день.
          </p>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16 w-full max-w-md sm:max-w-none animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={() => setIsConstructorOpen(true)}
              className="relative overflow-hidden bg-white text-indigo-950 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-white to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Settings2 size={22} className="relative z-10 text-indigo-600" /> 
              <span className="relative z-10">Собрать комплекс</span>
            </button>

            <button 
              onClick={() => scrollToSection('menu-start')} 
              className="px-10 py-5 glass border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 flex items-center justify-center gap-3 group text-lg"
            >
              <Utensils size={22} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
              Меню
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.6s' }}>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-indigo-500/30 hover:-translate-y-1 transition-transform bg-indigo-900/10">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg">45<span className="text-indigo-400 text-lg align-top">+</span></div>
                <div className="text-xs text-indigo-200 uppercase tracking-widest font-bold">минут доставка</div>
             </div>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-fuchsia-500/30 hover:-translate-y-1 transition-transform bg-fuchsia-900/10">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg">350<span className="text-fuchsia-400 text-lg align-top">₽</span></div>
                <div className="text-xs text-fuchsia-200 uppercase tracking-widest font-bold">мин. цена обеда</div>
             </div>
             <div className="glass p-4 rounded-2xl flex flex-col items-center justify-center border-t border-cyan-500/30 hover:-translate-y-1 transition-transform bg-cyan-900/10">
                <div className="text-3xl font-black text-white mb-1 drop-shadow-lg flex items-center gap-1">4.9 <Star size={20} className="fill-yellow-400 text-yellow-400" /></div>
                <div className="text-xs text-cyan-200 uppercase tracking-widest font-bold">рейтинг качества</div>
             </div>
          </div>
        </div>
      </header>

      {/* FEATURED COMPLEXES SECTION */}
      <section id="featured-sets" className="py-24 relative z-10 bg-slate-950">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">Готовые решения</h2>
              <p className="text-slate-400 text-lg">Сбалансированные комплексы для продуктивного дня.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* Set 1: Light */}
               <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img src={IMAGES.lunch2} alt="Лайт Обед" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-indigo-500 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">350 ₽</div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Лайт</h3>
                    <p className="text-slate-400 text-sm mb-6">Идеально для тех, кто следит за фигурой, но не хочет голодать.</p>
                    <ul className="space-y-2 mb-8 flex-1">
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Салат овощной</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Суп дня (250мл)</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Хлебная корзина</li>
                    </ul>
                    <button 
                      onClick={() => addMultipleToCart(createSet(['2', '5']))} 
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-indigo-500/50 hover:text-indigo-300 transition-all"
                    >
                      В корзину
                    </button>
                  </div>
               </div>

               {/* Set 2: Standard (Highlighted) */}
               <div className="group relative rounded-3xl overflow-hidden border border-fuchsia-500/50 bg-slate-900 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-fuchsia-500/30 transition-all duration-300 hover:-translate-y-2 scale-105 z-10 flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500"></div>
                  <div className="h-52 overflow-hidden relative">
                    <img src={IMAGES.lunch6} alt="Стандарт Обед" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-fuchsia-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">450 ₽</div>
                    <div className="absolute top-4 left-4 bg-white text-black font-bold px-2 py-1 rounded-md text-xs uppercase tracking-wider">Хит</div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Стандарт</h3>
                    <p className="text-slate-400 text-sm mb-6">Классический сытный обед. Выбор большинства наших клиентов.</p>
                    <ul className="space-y-2 mb-8 flex-1">
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div> Суп дня (300мл)</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div> Горячее с гарниром</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div> Напиток на выбор</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div> Хлеб</li>
                    </ul>
                    <button 
                       onClick={() => addMultipleToCart(createSet(['5', '6', '17']))}
                       className="w-full py-3 rounded-xl btn-shine animate-shine bg-[length:200%_auto] text-white font-bold transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      В корзину
                    </button>
                  </div>
               </div>

               {/* Set 3: Maxi */}
               <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img src={IMAGES.lunch3} alt="Макси Обед" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-cyan-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">590 ₽</div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Макси</h3>
                    <p className="text-slate-400 text-sm mb-6">Для тех, кто сильно проголодался. Полный набор блюд.</p>
                    <ul className="space-y-2 mb-8 flex-1">
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Салат</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Суп</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Горячее</li>
                       <li className="flex items-center gap-2 text-sm text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Напиток + Десерт</li>
                    </ul>
                    <button 
                      onClick={() => addMultipleToCart(createSet(['3', '17', '19']))}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition-all"
                    >
                      В корзину
                    </button>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* NEW FEATURES SECTION (Styled like user requested) */}
      <section className="py-24 relative z-10 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Image Side with Decorative Elements */}
            <div className="w-full lg:w-1/2 relative order-2 lg:order-1">
               {/* Decorative blob behind - CHANGED to purple/fuchsia */}
               <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/20 to-indigo-500/20 rounded-full blur-[60px] animate-pulse-slow"></div>
               
               <div className="relative rounded-full overflow-hidden border-4 border-white/5 shadow-2xl shadow-indigo-500/10 aspect-square max-w-[500px] mx-auto group">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={IMAGES.lunch1} alt="Fresh Healthy Food" className="object-cover w-full h-full hover:scale-105 transition-transform duration-1000" />
               </div>

               {/* Floating badge - CHANGED to purple theme */}
               <div className="absolute top-10 left-0 lg:left-10 bg-surface/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl animate-float z-20">
                  <div className="flex items-center gap-3">
                     <div className="bg-purple-500/20 p-2 rounded-full text-purple-400">
                        <Leaf size={20} />
                     </div>
                     <div>
                       <div className="font-bold text-white text-sm">100%</div>
                       <div className="text-xs text-slate-400">Натурально</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Content Side */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                 Еда, которая <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">заряжает энергией</span>
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                 Мы не просто доставляем еду, мы заботимся о вашем здоровье и продуктивности. 
                 Используем только фермерские продукты, минимизируем масло и сохраняем максимум витаминов.
              </p>
              
              <ul className="space-y-4 mb-10">
                 {['Без заморозки и полуфабрикатов', 'Экологичная упаковка', 'Обновление меню каждые 2 недели'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-200">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <Check size={14} strokeWidth={3} />
                       </div>
                       {item}
                    </li>
                 ))}
              </ul>

              <button 
                onClick={() => scrollToSection('menu-start')}
                className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10"
              >
                 Выбрать обед
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <MenuSection 
        items={menuItems} 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        onAddToCart={addToCart}
        onOpenModal={(item) => setModalItem(item)}
      />

      {/* Delivery Info */}
      <div id="delivery-info">
        <DeliveryInfo />
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-1">
                 <Logo className="mb-6" variant="footer" />
                 <p className="text-slate-500 text-sm mb-6">
                   Сервис доставки правильного питания для офисов и дома во Владивостоке.
                 </p>
                 <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                       <Instagram size={18} />
                    </a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white transition-all">
                       <Send size={18} />
                    </a>
                 </div>
              </div>
              
              <div>
                 <h4 className="text-white font-bold mb-6">Компания</h4>
                 <ul className="space-y-3 text-sm text-slate-400">
                    <li><a href="#" className="hover:text-indigo-400 transition">О нас</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Вакансии</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Контакты</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Блог</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-6">Помощь</h4>
                 <ul className="space-y-3 text-sm text-slate-400">
                    <li><a href="#" className="hover:text-indigo-400 transition">Доставка и оплата</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Вопросы и ответы</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Юридическим лицам</a></li>
                    <li><a href="#" className="hover:text-indigo-400 transition">Публичная оферта</a></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-6">Контакты</h4>
                 <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex items-start gap-3">
                       <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                       <span>г. Владивосток,<br/>ул. Светланская, 33</span>
                    </li>
                    <li className="flex items-center gap-3">
                       <Phone size={18} className="text-indigo-500 shrink-0" />
                       <span>+7 (423) 200-00-00</span>
                    </li>
                    <li className="flex items-center gap-3">
                       <Clock size={18} className="text-indigo-500 shrink-0" />
                       <span>Пн-Вс: 09:00 - 21:00</span>
                    </li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
              <div>© 2024 Obedi VL. Все права защищены.</div>
              <div className="flex gap-6">
                 <a href="#" className="hover:text-slate-400">Политика конфиденциальности</a>
                 <a href="#" className="hover:text-slate-400">Пользовательское соглашение</a>
              </div>
           </div>
        </div>
      </footer>

      {/* Modals */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => setIsCheckoutOpen(true)}
      />
      
      {isConstructorOpen && (
        <LunchConstructor 
          onClose={() => setIsConstructorOpen(false)}
          onAddToCart={addMultipleToCart}
          allItems={menuItems}
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

      {isProfileOpen && user && (
          <UserProfile 
             isOpen={isProfileOpen}
             onClose={() => setIsProfileOpen(false)}
             user={user}
             onLogout={handleLogout}
             onUpdateUser={setUser}
          />
      )}

      {modalItem && (
        <ProductModal 
          item={modalItem} 
          onClose={() => setModalItem(null)} 
          onAddToCart={addToCart} 
        />
      )}

      <AIChef menuItems={menuItems} onAddToCart={addToCart} />
    </div>
  );
}