
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Send,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Mail
} from 'lucide-react';
import { MenuSection } from './components/MenuSection';
import { CartSidebar } from './components/CartSidebar';
import { AIChef } from './components/AIChef';
import { ProductModal } from './components/ProductModal';
import { LunchConstructor } from './components/LunchConstructor';
import { HowItWorks } from './components/HowItWorks';
import { CorporateOffer } from './components/CorporateOffer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { DeliveryInfo } from './components/DeliveryInfo';
import { Logo } from './components/Logo';
import { LegalModals } from './components/LegalModals';
import { FAQModal } from './components/FAQModal';
import { UpsellModal } from './components/UpsellModal';
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
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  
  // Upsell State
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null);
  const UPSELL_PRICE = 90; // Special offer price
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const shareParamHandledRef = useRef(false);

  const parseShareParam = (value: string): { id: string; quantity: number }[] => {
    return value
      .split(',')
      .map((pair) => {
        const [idRaw, qtyRaw] = pair.split(':');
        const id = (idRaw || '').trim();
        const quantity = Math.max(1, Math.min(99, Math.floor(Number(qtyRaw))));
        if (!id || !Number.isFinite(quantity)) return null;
        return { id, quantity };
      })
      .filter((v): v is { id: string; quantity: number } => v !== null);
  };

  const clearShareParamFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  };

  // Load init state
  useEffect(() => {
    const shareParam = new URLSearchParams(window.location.search).get('share');
    let cancelled = false;

    // Check auth
    (async () => {
      const currentUser = await authService.getCurrentUser().catch(() => null);
      if (cancelled) return;
      setUser(currentUser);

      const last = await historyService.getLastOrder(currentUser?.id);
      if (last) setLastOrder(last);
    })();

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Try to fetch from Evotor
    const fetchMenu = async () => {
      setIsMenuLoading(true);
      const evotorItems = await evotorService.getProducts();
      const finalMenu = evotorItems.length > 0 ? evotorItems : MOCK_MENU;

      if (evotorItems.length > 0) {
        setMenuItems(evotorItems);
      }

      setIsMenuLoading(false);

      if (shareParam && !shareParamHandledRef.current) {
        const parsed = parseShareParam(shareParam);
        const sharedCart: CartItem[] = parsed
          .map(({ id, quantity }) => {
            const item = finalMenu.find((i) => i.id === id);
            return item ? ({ ...item, quantity } as CartItem) : null;
          })
          .filter((v): v is CartItem => v !== null);

        if (sharedCart.length > 0) {
          setCart(sharedCart);
          setIsCartOpen(true);
        }

        shareParamHandledRef.current = true;
        clearShareParamFromUrl();
      }
    };
    
    fetchMenu();

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', handleScroll);
    };
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

  const addToCartSilently = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
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

  // --- UPSELL LOGIC START ---
  const handleInitiateCheckout = () => {
    // Logic: Has Soup AND Main BUT No Drink
    const hasSoup = cart.some(i => 
      i.title.toLowerCase().includes('суп') || 
      i.title.toLowerCase().includes('борщ') || 
      i.title.toLowerCase().includes('том ям') ||
      i.title.toLowerCase().includes('солянка')
    );
    
    const hasMain = cart.some(i => 
      i.category === 'lunch' && 
      !i.title.toLowerCase().includes('суп') && 
      !i.title.toLowerCase().includes('борщ') && 
      !i.title.toLowerCase().includes('том ям') &&
      !i.title.toLowerCase().includes('солянка')
    );

    const hasDrink = cart.some(i => 
      i.category === 'extras' || 
      i.title.toLowerCase().includes('морс') ||
      i.title.toLowerCase().includes('напиток') ||
      i.title.toLowerCase().includes('сок')
    );

    // Try to find the specific "Mors" item (ID 17) or any drink to upsell
    const morsItem = menuItems.find(i => i.id === '17'); // ID 17 is usually Mors in MOCK_MENU

    if (hasSoup && hasMain && !hasDrink && morsItem) {
      setUpsellItem(morsItem);
      setIsUpsellOpen(true);
      setIsCartOpen(false); // Close cart sidebar to focus on modal
    } else {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleAcceptUpsell = () => {
    if (upsellItem) {
      // Add item with discounted price
      const discountedItem = { ...upsellItem, price: UPSELL_PRICE };
      addToCartSilently(discountedItem);
      setIsUpsellOpen(false);
      setIsCartOpen(false);
      
      // Small delay to let the user see the addition or transition smoothly
      setTimeout(() => {
        setIsCheckoutOpen(true);
      }, 300);
    }
  };

  const handleSkipUpsell = () => {
    setIsUpsellOpen(false);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };
  // --- UPSELL LOGIC END ---

  const handleCheckoutComplete = async () => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await historyService.saveOrder(cart, total, user?.id);
    setLastOrder(order);
    
    setCart([]); // Clear cart
    
    setTimeout(() => {
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
    }, 2000);
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
      setUser(loggedInUser);
      const last = await historyService.getLastOrder(loggedInUser.id);
      if (last) setLastOrder(last);
  };

  const handleLogout = async () => {
      await authService.logout().catch(() => undefined);
      setUser(null);
      setIsProfileOpen(false);
  };

  const handleCorporateRequest = () => {
    const message = encodeURIComponent("Здравствуйте! Меня интересует корпоративное питание. Хочу получить предложение.");
    window.open(`https://wa.me/79025562853?text=${message}`, '_blank');
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
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 mt-10 animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
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

      {/* CORPORATE OFFER (NEW) */}
      <CorporateOffer onRequestOffer={handleCorporateRequest} />

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
      <footer className="relative bg-slate-950 pt-24 pb-12 overflow-hidden border-t border-white/5 font-sans">
         {/* Top Gradient Line */}
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
              {/* Col 1: Brand */}
              <div className="space-y-6">
                 <Logo variant="footer" />
                 <p className="text-slate-400 text-sm leading-relaxed">
                   Вкусная и здоровая еда с доставкой в офис и домой. Готовим с любовью, доставляем вовремя.
                 </p>
              </div>

              {/* Col 2: Navigation (New) */}
              <div>
                  <h4 className="text-white font-bold mb-6 text-lg">Меню</h4>
                  <ul className="space-y-4 text-sm text-slate-400">
                      <li><button onClick={() => scrollToSection('featured-sets')} className="hover:text-indigo-400 transition flex items-center gap-2">🔥 Популярное</button></li>
                      <li><button onClick={() => scrollToSection('menu-start')} className="hover:text-indigo-400 transition">🥗 Основное меню</button></li>
                      <li><button onClick={() => setIsConstructorOpen(true)} className="hover:text-indigo-400 transition">🛠 Конструктор</button></li>
                  </ul>
              </div>
              
              {/* Col 3: Help */}
              <div>
                 <h4 className="text-white font-bold mb-6 text-lg">Помощь</h4>
                 <ul className="space-y-4 text-sm text-slate-400">
                    <li><button onClick={() => scrollToSection('delivery-info')} className="hover:text-indigo-400 transition">Доставка и зоны</button></li>
                    <li><button onClick={() => setIsFAQOpen(true)} className="hover:text-indigo-400 transition">Вопросы и ответы</button></li>
                 </ul>
              </div>

              {/* Col 4: Contacts */}
              <div>
                 <h4 className="text-white font-bold mb-6 text-lg">Контакты</h4>
                 <ul className="space-y-4 text-sm text-slate-400">
                    <li className="flex items-start gap-3">
                       <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                       <span>г. Владивосток,<br/>ул. Надибаидзе, 28</span>
                    </li>
                    <li className="flex items-center gap-3">
                       <Phone size={18} className="text-indigo-500 shrink-0" />
                       <a href="tel:+79025562853" className="hover:text-white transition">+7 (902) 556-28-53</a>
                    </li>
                    <li className="flex items-center gap-3">
                       <Mail size={18} className="text-indigo-500 shrink-0" />
                       <a href="mailto:obedi-vl@mail.ru" className="hover:text-white transition">obedi-vl@mail.ru</a>
                    </li>
                    <li className="flex items-start gap-3">
                       <Clock size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                       <div className="flex flex-col">
                           <span>Заказы на сайте: 24/7</span>
                           <span className="text-slate-500 text-xs">Звонки: 08:00 - 16:00</span>
                       </div>
                    </li>
                    <li className="flex items-center gap-3 pt-2">
                       {/* WhatsApp */}
                       <a 
                         href="https://wa.me/79025562853?text=Здравствуйте!%20Хочу%20заказать%20обед." 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="group relative w-10 h-10 rounded-full bg-slate-900 border border-[#25D366]/50 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] active:scale-95"
                         title="Написать в WhatsApp"
                       >
                         <div className="absolute inset-0 rounded-full bg-[#25D366]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 relative z-10">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                         </svg>
                       </a>
                       {/* Telegram */}
                       <a 
                         href="https://t.me/+79025562853" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="group relative w-10 h-10 rounded-full bg-slate-900 border border-[#0088cc]/50 flex items-center justify-center text-[#0088cc] hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,136,204,0.4)] active:scale-95"
                         title="Написать в Telegram"
                       >
                         <div className="absolute inset-0 rounded-full bg-[#0088cc]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <Send size={20} className="relative z-10 ml-[-2px]" />
                       </a>
                    </li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
              <div>© 2024 Obedi VL. Все права защищены.</div>
              <div className="flex gap-6">
                 <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-400 transition">
                   Политика конфиденциальности
                 </button>
                 <button onClick={() => setLegalModal('terms')} className="hover:text-slate-400 transition">
                   Пользовательское соглашение
                 </button>
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
        onCheckout={handleInitiateCheckout}
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
      
      {isUpsellOpen && upsellItem && (
        <UpsellModal 
          item={upsellItem}
          discountPrice={UPSELL_PRICE}
          onClose={() => { setIsUpsellOpen(false); setIsCartOpen(true); }}
          onAdd={handleAcceptUpsell}
          onSkip={handleSkipUpsell}
        />
      )}

      {/* Legal Modals */}
      {legalModal && (
        <LegalModals 
          type={legalModal}
          onClose={() => setLegalModal(null)}
        />
      )}

      {/* FAQ Modal */}
      {isFAQOpen && (
        <FAQModal onClose={() => setIsFAQOpen(false)} />
      )}

      <AIChef menuItems={menuItems} onAddToCart={addToCart} />
    </div>
  );
}
