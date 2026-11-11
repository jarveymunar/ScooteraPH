import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coffee, Lock, User, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, availableUsers } = useApp();

  const [username, setUsername] = useState('marco_owner');
  const [password, setPassword] = useState('owner123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = login(username, password);
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleSelectQuickAccount = (u: (typeof availableUsers)[0]) => {
    setUsername(u.username);
    setPassword(u.password || 'barista123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 selection:bg-[#D97706]/20">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E6DFD5] shadow-xl p-8 space-y-6">
        {/* Scootera Café Branding */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#D97706] bg-white shadow-sm overflow-hidden p-1 flex items-center justify-center">
            <img
              src="/assets/aistudio/image_5df9d1fb.png"
              alt="Scootera Café"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#2C1810] tracking-tight">
              SCOOTERA CAFÉ
            </h1>
            <p className="text-xs font-semibold text-[#8C7A70] tracking-wider uppercase mt-0.5">
              Point of Sale & Management Terminal
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8C7A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            <span>Sign In to Terminal</span>
            <ArrowRight className="w-4 h-4 text-[#D97706]" />
          </button>
        </form>

        {/* Quick Accounts Selector for Testing */}
        <div className="pt-4 border-t border-[#F0EAE1] space-y-2">
          <p className="text-[11px] font-bold text-[#7A6B63] uppercase tracking-wider text-center">
            Registered Terminal Accounts
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectQuickAccount(u)}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                  username === u.username
                    ? 'bg-[#FAF3EA] border-[#D97706] text-[#2C1810]'
                    : 'bg-[#FAF7F2] border-[#E6DFD5] text-[#4A3B32] hover:bg-[#F3EFE9]'
                }`}
              >
                <div className="font-bold text-xs truncate">{u.full_name}</div>
                <div className="text-[10px] text-[#8C7A70] capitalize">
                  {u.role} · @{u.username}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-[10px] text-[#A39287]">
          Scootera Café POS · Secure Session Encrypted
        </div>
      </div>
    </div>
  );
};
