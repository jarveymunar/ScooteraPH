import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scootera Café POS & Management',
  description:
    'Production-ready Coffee Shop POS and Management system for Scootera Café with real-time order entry, thermal receipts, attendance ledger, payroll, inventory, expenses tracking, and audit logging.',
  icons: {
    icon: '/assets/aistudio/image_5df9d1fb.png',
  },
  openGraph: {
    title: 'Scootera Café POS & Management',
    description:
      'Production-ready Coffee Shop POS and Management system for Scootera Café with real-time order entry, thermal receipts, attendance ledger, payroll, inventory, expenses tracking, and audit logging.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#2C1810] antialiased selection:bg-[#D97706]/20 min-h-screen">
        {children}
      </body>
    </html>
  );
}
