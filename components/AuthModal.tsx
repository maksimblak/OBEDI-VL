
import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, X, Smartphone, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type AuthAlertAction = 'dismiss' | 'retryOtp' | 'changePhone' | 'requestNewCode';
type AuthAlert = {
  title: string;
  message: string;
  primary: { label: string; action: AuthAlertAction };
  secondary?: { label: string; action: AuthAlertAction };
};

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState<AuthAlert | null>(null);

  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

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

    try {
      const user = await authService.verifyOtp(phone, otp);
      onLoginSuccess(user);
      onClose();
    } catch (e) {
      const err = e as Error & { status?: number; retryAfterMs?: number };
      const retry = typeof err.retryAfterMs === 'number' ? Math.ceil(err.retryAfterMs / 1000) : null;

      const status = typeof err.status === 'number' ? err.status : 0;
      const isInvalidCode = status === 401;
      const isTooManyAttempts = status === 429 && (err.message || '').toLowerCase().includes('attempt');
      const isTooManyRequests = status === 429 && (err.message || '').toLowerCase().includes('request');

      if (isInvalidCode) {
        setError('Неверный код. Попробуйте ещё раз.');
        setOtp('');
        setAlert({
          title: 'Неверный код',
          message: 'Проверьте SMS и попробуйте ещё раз.',
          primary: { label: 'Попробовать снова', action: 'retryOtp' },
          secondary: { label: 'Изменить номер', action: 'changePhone' },
        });
        return;
      }

      if (isTooManyAttempts) {
        setError('Слишком много попыток. Запросите новый код.');
        setOtp('');
        setAlert({
          title: 'Слишком много попыток',
          message: 'Вы ввели неверный код слишком много раз. Запросите новый код и попробуйте снова.',
          primary: { label: 'Запросить новый код', action: 'requestNewCode' },
          secondary: { label: 'Закрыть', action: 'dismiss' },
        });
        return;
      }

      if (isTooManyRequests) {
        const msg = retry ? `Слишком часто. Попробуйте снова через ${retry} сек.` : 'Слишком часто. Попробуйте позже.';
        setError(msg);
        setAlert({
          title: 'Слишком часто',
          message: msg,
          primary: { label: 'Понятно', action: 'dismiss' },
        });
        return;
      }

      setError(err.message || 'Не удалось войти. Попробуйте ещё раз.');
      setAlert({
        title: 'Не удалось войти',
        message: err.message || 'Не удалось войти. Попробуйте ещё раз.',
        primary: { label: 'Закрыть', action: 'dismiss' },
        secondary: { label: 'Изменить номер', action: 'changePhone' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAlertAction = (action: AuthAlertAction) => {
    if (action === 'dismiss') {
      setAlert(null);
      return;
    }

    if (action === 'retryOtp') {
      setAlert(null);
      queueMicrotask(() => otpInputRef.current?.focus());
      return;
    }

    if (action === 'changePhone') {
      setAlert(null);
      setOtp('');
      setError('');
      setStep('phone');
      queueMicrotask(() => phoneInputRef.current?.focus());
      return;
    }

    setAlert(null);
    setOtp('');
    setError('');
    setStep('phone');
    queueMicrotask(() => phoneInputRef.current?.focus());
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

        {alert && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 rounded-3xl bg-black/60 backdrop-blur-sm"
              onClick={() => setAlert(null)}
            />
            <div className="relative w-full max-w-sm rounded-2xl border border-rose-500/20 bg-slate-950/95 p-6 shadow-2xl animate-fade-in">
              <button
                onClick={() => setAlert(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-300 shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-lg leading-snug">{alert.title}</h3>
                  <p className="text-slate-300/90 text-sm leading-relaxed mt-1">{alert.message}</p>
                </div>
              </div>

              <div className={`mt-6 grid gap-3 ${alert.secondary ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  type="button"
                  onClick={() => runAlertAction(alert.primary.action)}
                  className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-400 transition"
                >
                  {alert.primary.label}
                </button>
                {alert.secondary && (
                  <button
                    type="button"
                    onClick={() => runAlertAction(alert.secondary!.action)}
                    className="w-full bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition"
                  >
                    {alert.secondary.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="relative">
                    <input 
                        type="tel" 
                        value={phone}
                        ref={phoneInputRef}
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
                        ref={otpInputRef}
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
