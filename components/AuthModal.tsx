
import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    // Simple formatter, just keeps numbers and adds +7
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits[0] === '7' || digits[0] === '8') {
        return '+7 ' + digits.substring(1, 11);
    }
    return '+7 ' + digits.substring(0, 10);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
        setError('Введите корректный номер');
        return;
    }
    setIsLoading(true);
    setError('');

    try {
      await authService.sendOtp(phone);
      setStep('otp');
    } catch (e) {
      const err = e as Error & { retryAfterMs?: number };
      const retry = typeof err.retryAfterMs === 'number' ? Math.ceil(err.retryAfterMs / 1000) : null;
      setError(retry ? `Too many requests. Try again in ${retry}s.` : err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let user: User | null = null;
    try {
      user = await authService.verifyOtp(phone, otp);
    } catch {
      user = null;
    }
    if (user) {
        onLoginSuccess(user);
        onClose();
    } else {
        setError('Неверный код. Попробуйте 0000');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl animate-[blob_0.4s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
            <X size={20} />
        </button>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Smartphone size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
                {step === 'phone' ? 'Вход на сайт' : 'Подтверждение'}
            </h2>
            <p className="text-slate-400 text-sm">
                {step === 'phone' 
                    ? 'Введите номер телефона, чтобы войти в личный кабинет и копить бонусы.' 
                    : `Мы отправили код на ${phone}. (Введите 0000)`}
            </p>
        </div>

        {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="relative">
                    <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^\d+ ]/g, ''); 
                            setPhone(val);
                        }}
                        placeholder="+7 999 000-00-00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-xl text-white tracking-widest focus:border-indigo-500 outline-none transition placeholder:text-slate-600"
                        autoFocus
                    />
                </div>
                {error && <div className="text-red-400 text-sm text-center">{error}</div>}
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-shine animate-shine bg-[length:200%_auto] text-white py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Получить код <ArrowRight size={18} /></>}
                </button>
            </form>
        ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
                 <div className="flex justify-center gap-2">
                     <input 
                        type="text" 
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-32 bg-white/5 border border-white/10 rounded-xl px-2 py-4 text-center text-3xl text-white tracking-[1em] focus:border-indigo-500 outline-none transition"
                        autoFocus
                     />
                 </div>
                 {error && <div className="text-red-400 text-sm text-center">{error}</div>}
                 
                 <button 
                    type="submit"
                    disabled={isLoading || otp.replace(/\D/g, '').length !== 6}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Войти <KeyRound size={18} /></>}
                </button>
                <button 
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-slate-500 text-sm hover:text-white transition"
                >
                    Изменить номер
                </button>
            </form>
        )}
      </div>
    </div>
  );
};
