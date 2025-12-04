import React, { useState, useEffect } from 'react';
import { SignUpForm } from './components/SignUpForm';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { VerificationStep } from './components/VerificationStep';
import { User } from './types';
import { Database, HardDrive, Server } from 'lucide-react';
import { supabase } from './supabaseClient';

// New "Data Cube" Logo reflecting Digital Storage
const AKMLogo = ({ className = "w-10 h-10", animated = false }: { className?: string, animated?: boolean }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
        <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
      </linearGradient>
      <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Isometric Cube Shape */}
    <g transform="translate(50 50)">
      {/* Top Face (Data Input) */}
      <path 
        d="M0 -35 L30 -20 L0 -5 L-30 -20 Z" 
        stroke="url(#cubeGradient)" 
        strokeWidth="2" 
        fill="rgba(6, 182, 212, 0.1)"
        className={animated ? "animate-pulse" : ""}
      />
      {/* Right Face (Storage) */}
      <path 
        d="M30 -20 V15 L0 30 V-5 Z" 
        stroke="url(#cubeGradient)" 
        strokeWidth="2" 
        fill="rgba(59, 130, 246, 0.2)"
      />
      {/* Left Face (Processing) */}
      <path 
        d="M0 30 L-30 15 V-20 L0 -5 Z" 
        stroke="url(#cubeGradient)" 
        strokeWidth="2" 
        fill="rgba(59, 130, 246, 0.1)"
      />
      
      {/* Inner Core / Data Packet */}
      <circle cx="0" cy="-5" r="4" fill="#fff" filter="url(#glow-blue)" className={animated ? "animate-pulse" : ""} />
      
      {/* Circuit Lines connecting to the core */}
      <path d="M0 30 V15" stroke="#3b82f6" strokeWidth="1" opacity="0.5" />
      <path d="M-30 -20 L-15 -12" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
      <path d="M30 -20 L15 -12" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
    </g>
    
    {/* Floating Data Particles */}
    <rect x="20" y="20" width="4" height="4" fill="#06b6d4" className={animated ? "animate-bounce" : ""} style={{animationDelay: '0.1s'}} />
    <rect x="75" y="60" width="3" height="3" fill="#3b82f6" className={animated ? "animate-bounce" : ""} style={{animationDelay: '0.3s'}} />
    <rect x="15" y="70" width="3" height="3" fill="#fff" opacity="0.5" className={animated ? "animate-bounce" : ""} style={{animationDelay: '0.5s'}} />
  </svg>
);

function App() {
  const [currentView, setCurrentView] = useState<'signup' | 'login' | 'verification' | 'dashboard'>('signup');
  const [user, setUser] = useState<User | null>(null);
  const [tempUser, setTempUser] = useState<User | null>(null);
  
  // State for Intro Sequence
  const [showIntro, setShowIntro] = useState(true); // Is the intro component mounted?
  const [isExiting, setIsExiting] = useState(false); // Is the exit animation playing?
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Monitor Authentication State (Supabase)
  useEffect(() => {
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        const userData: User = {
          name: metadata.full_name || 'User',
          username: metadata.snapchat_user || 'Unknown',
          email: session.user.email || ''
        };
        setUser(userData);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         const metadata = session.user.user_metadata;
         const userData: User = {
           name: metadata.full_name || 'User',
           username: metadata.snapchat_user || 'Unknown',
           email: session.user.email || ''
         };
         setUser(userData);
         // If we are verified or just logging in, we go to dashboard.
         // But we maintain the flow manually for signup -> verification -> dashboard
         // So we don't force set currentView here if we are in 'verification' mode
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Slower, more deliberate intro sequence
  useEffect(() => {
    // 1. Progress Bar Logic
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50); 

    // 2. Trigger Exit Animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 5500); 

    // 3. Remove from DOM
    const removeTimer = setTimeout(() => {
      setShowIntro(false);
    }, 7500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleSignUpData = (userData: User) => {
    setTempUser(userData);
    setCurrentView('verification');
  };

  const handleVerificationComplete = () => {
    if (tempUser) {
      setUser(tempUser);
      setCurrentView('dashboard');
    }
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setCurrentView('dashboard');
  };
  
  const handleLogout = async () => {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setCurrentView('login');
  };

  if (showIntro) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0b1121] overflow-hidden ${isExiting ? 'animate-fade-out' : ''}`}>
        {/* Intro Background Elements */}
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-transparent"></div>
        
        <div className="text-center relative z-10 w-80">
           <div className="relative flex justify-center mb-10">
              {/* Spinning Ring */}
              <div className="absolute inset-0 m-auto w-40 h-40 border-t-2 border-r-2 border-cyan-500/30 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 m-auto w-32 h-32 border-b-2 border-l-2 border-blue-500/20 rounded-full animate-spin-slow" style={{animationDirection: 'reverse'}}></div>
              
              {/* Logo */}
              <AKMLogo className="w-24 h-24 relative z-10 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" animated={true} />
           </div>
           
           {/* Typography */}
           <h1 className="text-7xl font-bold font-brand text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-wider mb-2 animate-fade-in">
             AKM
           </h1>
           <p className="text-cyan-400 font-brand text-xs tracking-[0.5em] uppercase mb-8 opacity-80 animate-pulse">
             Digital Storage Protocol
           </p>

           {/* Loading Bar */}
           <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden relative">
             <div 
               className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
               style={{ width: `${loadingProgress}%`, transition: 'width 0.1s linear' }}
             ></div>
           </div>
           
           <div className="flex justify-between mt-2 font-mono text-[10px] text-gray-500">
             <span className="animate-pulse">INITIALIZING SYSTEM...</span>
             <span>{loadingProgress}%</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1121] overflow-hidden relative flex flex-col">
      {/* Technical Grid Background */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none"></div>
      
      {/* Vignette & Ambient Glow */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-[#0b1121]/50 pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="px-6 py-5 relative z-20 border-b border-cyan-900/20 bg-[#0b1121]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0b1121]/50 animate-fade-in">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            {/* Small Logo */}
            <div className="relative p-1">
              <AKMLogo className="w-8 h-8 relative z-10" />
            </div>
            
            <div className="flex flex-col">
               <span className="text-xl font-bold font-brand text-white tracking-widest leading-none">
                AKM
              </span>
              <span className="text-[9px] font-mono text-cyan-500/70 tracking-[0.2em] mt-1 group-hover:text-cyan-400 transition-colors">
                CLOUD_SYSTEM_V.1
              </span>
            </div>
          </div>
          
          {currentView !== 'dashboard' && (
             <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-gray-400 border border-white/5 bg-white/5 px-3 py-1.5 rounded-sm">
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${currentView === 'verification' ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></div>
                 {currentView === 'verification' ? 'SYSTEM STATUS: VERIFYING IDENTITY' : currentView === 'login' ? 'SYSTEM STATUS: AWAITING CREDENTIALS' : 'SERVER STATUS: ONLINE'}
               </div>
             </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full">
        {currentView === 'signup' && (
          <SignUpForm 
            onSuccess={handleSignUpData} 
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        
        {currentView === 'login' && (
            <LoginForm 
                onSuccess={handleLoginSuccess}
                onSwitchToSignUp={() => setCurrentView('signup')}
            />
        )}
        
        {currentView === 'verification' && (
          <VerificationStep 
            tempUser={tempUser}
            onVerify={handleVerificationComplete}
            onBack={() => setCurrentView('signup')}
          />
        )}
        
        {currentView === 'dashboard' && user && (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center relative z-10 border-t border-cyan-900/20 bg-[#0b1121]/60">
        <div className="flex justify-center items-center gap-4 text-xs font-mono text-gray-600">
           <span className="hover:text-cyan-500 transition-colors cursor-pointer">PRIVACY_PROTOCOL</span>
           <span>|</span>
           <span className="hover:text-cyan-500 transition-colors cursor-pointer">ENCRYPTION_KEYS</span>
           <span>|</span>
           <span className="hover:text-cyan-500 transition-colors cursor-pointer">AKM_CORP &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;