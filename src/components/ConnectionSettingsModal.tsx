import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  saveCustomSupabaseConfig,
  getActiveSupabaseConfig,
} from '../lib/supabase';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Key,
  Shield,
  Server,
} from 'lucide-react';

export const ConnectionSettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, isSupabaseLive } = useApp();

  const currentConfig = getActiveSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.key);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleResetToDemo = () => {
    saveCustomSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E6DFD5] overflow-hidden animate-in fade-in duration-200">
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#B45309]" />
            <h3 className="font-bold text-base text-[#2C1810]">
              Database & Vercel Configuration
            </h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Current Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isSupabaseLive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isSupabaseLive ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isSupabaseLive
                  ? 'Connected to Live Supabase Database'
                  : 'Local Store Database Active'}
              </p>
              <p className="text-[11px] mt-0.5 opacity-90">
                {isSupabaseLive
                  ? 'Real-time synchronization and RLS policies are active on PostgreSQL.'
                  : 'Operating on local database cache. All orders, inventory, add-ons, and attendance sync instantly. Connect your live Supabase cloud project below anytime.'}
              </p>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div>
            <label className="block font-bold text-[#4A3B32] mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-xs text-[#2C1810] font-mono focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#4A3B32] mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-xs text-[#2C1810] font-mono focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          {/* Deployment Quick Specs */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E6DFD5] space-y-1.5 text-[11px] text-[#7A6B63]">
            <p className="font-bold text-[#2C1810]">
              Production Deployment Deliverables:
            </p>
            <p>• Schema: <span className="font-mono text-[#2C1810]">supabase/schema.sql</span> (tables, triggers, RLS, functions, seed)</p>
            <p>• Cron: <span className="font-mono text-[#2C1810]">vercel.json</span> (/api/cron/generate-recurring-expenses)</p>
            <p>• Auth & SSR: <span className="font-mono text-[#2C1810]">middleware.ts</span> with @supabase/ssr</p>
            <p>• Guide: <span className="font-mono text-[#2C1810]">README.md</span> for Supabase and Vercel setup</p>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-center">
              Configuration Saved! Reloading app...
            </div>
          )}

          <div className="p-4 bg-[#FAF7F2] -mx-6 -mb-6 border-t border-[#E6DFD5] flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Reset Store Data to Default
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
              >
                <Save className="w-4 h-4 text-[#D97706]" />
                Save & Connect
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
