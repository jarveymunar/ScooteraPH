import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatManilaTimeOnly, formatManilaDateOnly } from '../lib/utils';
import {
  Coffee,
  Clock,
  ChevronDown,
  Shield,
  Briefcase,
  User,
  LogOut,
  Database,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    availableUsers,
    switchUserById,
    logout,
    setIsSettingsOpen,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Live Asia/Manila ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[#2C1810] text-[#FAF7F2] rounded">
            <Shield className="w-3 h-3 text-[#D97706]" /> Owner
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[#E6DFD5] text-[#2C1810] rounded">
            <Briefcase className="w-3 h-3 text-[#B45309]" /> System Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#F3EFEA] text-[#5C4D43] rounded">
            <User className="w-3 h-3 text-[#78350F]" /> Staff (Barista)
          </span>
        );
    }
  };

  return (
    <header className="bg-[#FAF7F2] border-b border-[#E6DFD5] sticky top-0 z-40 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Scootera Café Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D97706] bg-white shadow-sm shrink-0 flex items-center justify-center">
            <img
              src="/assets/aistudio/image_5df9d1fb.png"
              alt="Scootera Café"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#2C1810]">
                SCOOTERA
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-[#B45309] bg-[#F7F0E6] px-1.5 py-0.5 rounded">
                Café POS
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Live Asia/Manila Clock */}
        <div className="hidden md:flex items-center gap-3 bg-white/80 border border-[#E6DFD5] px-4 py-2 rounded-lg shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#2C1810] font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#B45309]" />
              {formatManilaTimeOnly(currentTime)}
              <span className="text-[10px] text-[#8C7A70] font-sans font-normal ml-0.5">
                (GMT+8)
              </span>
            </div>
            <span className="text-[11px] text-[#7A6B63]">
              {formatManilaDateOnly(currentTime.toISOString())}
            </span>
          </div>
        </div>

        {/* Zone 3: Active User Switcher & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2.5 bg-white border border-[#E6DFD5] hover:border-[#C8BAAA] px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer shadow-2xs"
            >
              <div className="w-7 h-7 rounded-full bg-[#EFE9DF] text-[#2C1810] flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-[#2C1810] leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-[#7A6B63] capitalize">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-[#7A6B63]" />
            </button>

            {isUserDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E6DFD5] rounded-xl shadow-lg z-50 p-2 py-2">
                  <div className="px-3 py-2 border-b border-[#F0EAE1] mb-1">
                    <p className="text-xs font-semibold text-[#7A6B63] uppercase tracking-wider">
                      Switch Terminal Account
                    </p>
                  </div>
                  <div className="space-y-1">
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchUserById(user.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                          currentUser.id === user.id
                            ? 'bg-[#FAF3EA] text-[#2C1810] font-bold border border-[#E8DCCB]'
                            : 'text-[#4A3B32] hover:bg-[#F9F6F1]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#E5DCD0] flex items-center justify-center text-[11px] font-bold">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs">{user.full_name}</p>
                            <p className="text-[10px] text-[#8C7B70]">@{user.username}</p>
                          </div>
                        </div>
                        {getRoleBadge(user.role)}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#F0EAE1] mt-2">
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>Database Settings</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6DFD5] bg-white hover:bg-rose-50 hover:border-rose-200 text-[#4A3B32] hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs min-h-[38px]"
            title="Log Out of Terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
