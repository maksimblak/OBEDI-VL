
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, LogOut, Package, Star, Edit2, CheckCircle, Clock } from 'lucide-react';
import { User, Order } from '../types';
import { historyService } from '../services/historyService';
import { authService } from '../services/authService';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user, onLogout, onUpdateUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);

  useEffect(() => {
    if (isOpen) {
      setOrders(historyService.getOrders(user.id));
      setEditName(user.name);
    }
  }, [isOpen, user]);

  const handleSaveProfile = async () => {
      const nextName = editName.trim();
      if (!nextName) return;
      try {
        const updated = await authService.updateProfile(nextName);
        onUpdateUser(updated);
        setIsEditing(false);
      } catch (e) {
        console.error('Failed to update profile:', e);
      }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div className={`fixed top-0 left-0 h-full w-full sm:w-[400px] bg-dark border-r border-white/5 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-surface/50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <UserIcon size={20} className="text-fuchsia-400" />
                Личный кабинет
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-zinc-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-fuchsia-900/20 border border-white/10 rounded-2xl p-6 mb-8 text-center relative">
                <div className="w-20 h-20 bg-surface rounded-full mx-auto mb-4 border-2 border-indigo-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                    {user.name.charAt(0)}
                </div>
                
                {isEditing ? (
                    <div className="flex gap-2 mb-2 justify-center">
                        <input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-white/10 border border-white/10 rounded px-2 py-1 text-white text-center w-32 text-sm"
                        />
                        <button onClick={handleSaveProfile} className="text-green-400 hover:text-green-300"><CheckCircle size={18} /></button>
                    </div>
                ) : (
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                        {user.name} 
                        <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition"><Edit2 size={14} /></button>
                    </h3>
                )}
                
                <p className="text-slate-400 text-sm mb-6">{user.phone}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface/50 rounded-xl p-3 border border-white/5">
                        <div className="text-indigo-400 font-bold text-xl">{user.loyaltyPoints}</div>
                        <div className="text-xs text-slate-500 uppercase">Бонусов</div>
                    </div>
                    <div className="bg-surface/50 rounded-xl p-3 border border-white/5">
                        <div className="text-white font-bold text-xl">{orders.length}</div>
                        <div className="text-xs text-slate-500 uppercase">Заказов</div>
                    </div>
                </div>
            </div>

            {/* Orders History */}
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock size={16} /> История заказов
            </h3>
            
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Вы еще ничего не заказывали
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-surface/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-white font-medium text-sm">Заказ от {new Date(order.date).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-500">#{order.id.slice(-6)}</div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {order.status === 'delivered' ? 'Доставлен' : 'В обработке'}
                                </span>
                            </div>
                            <div className="space-y-2 mb-3">
                                {order.items.slice(0, 3).map(item => (
                                    <div key={item.id} className="flex justify-between text-xs text-slate-400">
                                        <span>{item.title} x{item.quantity}</span>
                                        <span>{item.price * item.quantity} ₽</span>
                                    </div>
                                ))}
                                {order.items.length > 3 && (
                                    <div className="text-xs text-slate-600 italic">+ еще {order.items.length - 3} блюд</div>
                                )}
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Итого:</span>
                                <span className="text-white font-bold">{order.total} ₽</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>

        <div className="p-6 border-t border-white/5">
            <button 
                onClick={onLogout}
                className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-xl transition font-medium text-sm"
            >
                <LogOut size={18} /> Выйти из аккаунта
            </button>
        </div>
      </div>
    </>
  );
};
