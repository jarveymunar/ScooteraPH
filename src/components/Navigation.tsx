import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Coffee,
  Receipt,
  Clock,
  LayoutDashboard,
  UtensilsCrossed,
  Boxes,
  Wallet,
  Users,
  FileText,
  BadgeDollarSign,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { currentUser, activeTab, setActiveTab } = useApp();
  const role = currentUser.role;

  // Build navigation items dynamically based on strict role permissions
  const navItems = [
    // Owner only dashboard
    ...(role === 'owner'
      ? [
          {
            id: 'dashboard',
            label: 'Sales Dashboard',
            icon: LayoutDashboard,
          },
        ]
      : []),

    // All roles have POS Order Entry
    {
      id: 'pos',
      label: 'Order Entry',
      icon: Coffee,
    },

    // All roles have Receipts records
    {
      id: 'receipts',
      label: 'Receipt Records',
      icon: Receipt,
    },

    // All roles have personal Time-In / Time-Out
    {
      id: 'attendance',
      label: 'Time Attendance',
      icon: Clock,
    },

    // Admin & Owner Attendance Monitoring & Payroll
    ...(role === 'owner' || role === 'admin'
      ? [
          {
            id: 'payroll',
            label: role === 'owner' ? 'Attendance & Payroll' : 'Staff Attendance Monitor',
            icon: BadgeDollarSign,
          },
        ]
      : []),

    // Admin & Owner Menu Management
    ...(role === 'owner' || role === 'admin'
      ? [
          {
            id: 'menu',
            label: 'Menu Management',
            icon: UtensilsCrossed,
          },
        ]
      : []),

    // Owner only: Inventory
    ...(role === 'owner'
      ? [
          {
            id: 'inventory',
            label: 'Inventory',
            icon: Boxes,
          },
        ]
      : []),

    // Owner only: Expenses Tracker
    ...(role === 'owner'
      ? [
          {
            id: 'expenses',
            label: 'Expenses Tracker',
            icon: Wallet,
          },
        ]
      : []),

    // Admin & Owner: Users & Credentials
    ...(role === 'owner' || role === 'admin'
      ? [
          {
            id: 'users',
            label: role === 'owner' ? 'Users & Roles' : 'Staff Accounts',
            icon: Users,
          },
        ]
      : []),

    // Owner only: Audit Logs
    ...(role === 'owner'
      ? [
          {
            id: 'audit',
            label: 'Audit Logs',
            icon: FileText,
          },
        ]
      : []),
  ];

  return (
    <nav className="bg-white border-b border-[#E6DFD5] sticky top-18 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#615248] hover:text-[#2C1810] hover:bg-[#F8F4EE]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#D97706]' : 'text-[#8C7A70]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
