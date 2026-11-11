'use client';

import dynamic from 'next/dynamic';

const POSApp = dynamic(() => import('../../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-[#D97706] bg-white p-1 shadow-sm flex items-center justify-center animate-pulse">
          <img
            src="/assets/aistudio/image_5df9d1fb.png"
            alt="Scootera Café"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs font-bold text-[#8C7A70] tracking-wider uppercase">
          Loading Scootera Terminal...
        </p>
      </div>
    </div>
  ),
});

export default function LoginPage() {
  return <POSApp />;
}
