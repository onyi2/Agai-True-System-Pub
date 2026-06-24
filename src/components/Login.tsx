import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, Beer } from 'lucide-react';
import pubBg from '../assets/images/pub_background_sharp_1782262300963.jpg';

interface LoginProps {
  onLogin: (role: 'Manager' | 'Bartender', name: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<'Manager' | 'Bartender'>('Manager');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (pin !== '1234') { // Hardcoded for demo purposes
      setError('Invalid PIN. Use 1234 for demo.');
      return;
    }
    onLogin(role, name);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${pubBg})`,
          filter: 'brightness(0.4) contrast(1.1)'
        }}
      />
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-brand-dark/90 via-brand-dark/70 to-brand-dark/95" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-brand-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-brand-card-light overflow-hidden z-10"
      >
        <div className="p-8 text-center bg-brand-card-light/20 border-b border-brand-card-light">
          <div className="w-16 h-16 bg-brand-emerald/20 text-brand-emerald rounded-full flex items-center justify-center mx-auto mb-4">
            <Beer size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white font-display uppercase tracking-wider mb-1">Agai True Pub</h1>
          <p className="text-brand-light/60 text-sm">Management Suite</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-light/60 uppercase tracking-wider mb-2">Login As</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Manager')}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    role === 'Manager'
                      ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald'
                      : 'bg-brand-card-light/30 border-transparent text-brand-light/60 hover:text-white'
                  }`}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Bartender')}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    role === 'Bartender'
                      ? 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald'
                      : 'bg-brand-card-light/30 border-transparent text-brand-light/60 hover:text-white'
                  }`}
                >
                  Bartender
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-light/60 uppercase tracking-wider mb-2">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-card-light rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-emerald transition-colors"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-light/60 uppercase tracking-wider mb-2">Access PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light/40" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-card-light rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-emerald transition-colors"
                  placeholder="Enter PIN (1234)"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-emerald text-brand-dark font-bold py-3 px-4 rounded-xl hover:bg-brand-emerald/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Access System <ArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
