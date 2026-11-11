import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { POSOrderEntry } from './components/POSOrderEntry';
import { ReceiptsLedger } from './components/ReceiptsLedger';
import { AttendanceView } from './components/AttendanceView';
import { AttendancePayrollView } from './components/AttendancePayrollView';
import { MenuManagementView } from './components/MenuManagementView';
import { SalesDashboardView } from './components/SalesDashboardView';
import { InventoryView } from './components/InventoryView';
import { ExpensesTrackerView } from './components/ExpensesTrackerView';
import { UsersManagementView } from './components/UsersManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { ThermalReceipt } from './components/ThermalReceipt';
import { ConnectionSettingsModal } from './components/ConnectionSettingsModal';
import { LoginView } from './components/LoginView';
import {
  Coffee,
  Receipt,
  Clock,
  LayoutDashboard,
  Wallet,
  Boxes,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, selectedReceipt, setSelectedReceipt, currentUser, setActiveTab, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return currentUser.role === 'owner' ? <SalesDashboardView /> : <POSOrderEntry />;
      case 'pos':
        return <POSOrderEntry />;
      case 'receipts':
        return <ReceiptsLedger />;
      case 'attendance':
        return <AttendanceView />;
      case 'payroll':
        return currentUser.role !== 'staff' ? <AttendancePayrollView /> : <AttendanceView />;
      case 'menu':
        return currentUser.role !== 'staff' ? <MenuManagementView /> : <POSOrderEntry />;
      case 'inventory':
        return currentUser.role === 'owner' ? <InventoryView /> : <POSOrderEntry />;
      case 'expenses':
        return currentUser.role === 'owner' ? <ExpensesTrackerView /> : <POSOrderEntry />;
      case 'users':
        return currentUser.role !== 'staff' ? <UsersManagementView /> : <POSOrderEntry />;
      case 'audit':
        return currentUser.role === 'owner' ? <AuditLogsView /> : <POSOrderEntry />;
      default:
        return <POSOrderEntry />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1810] flex flex-col pb-16 sm:pb-0">
      <Header />
      <Navigation />

      <main className="flex-1 pb-12">
        {renderActiveView()}
      </main>

      {/* Mobile Quick Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E6DFD5] px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg cursor-pointer ${
            activeTab === 'pos' ? 'text-[#B45309]' : 'text-[#7A6B63]'
          }`}
        >
          <Coffee className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">POS</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg cursor-pointer ${
            activeTab === 'receipts' ? 'text-[#B45309]' : 'text-[#7A6B63]'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg cursor-pointer ${
            activeTab === 'attendance' ? 'text-[#B45309]' : 'text-[#7A6B63]'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Clock In</span>
        </button>

        {currentUser.role === 'owner' && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#B45309]' : 'text-[#7A6B63]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Sales</span>
          </button>
        )}

        {currentUser.role === 'owner' && (
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg cursor-pointer ${
              activeTab === 'expenses' ? 'text-[#B45309]' : 'text-[#7A6B63]'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Expenses</span>
          </button>
        )}
      </div>

      {/* Global Thermal Receipt Modal */}
      {selectedReceipt && (
        <ThermalReceipt
          order={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Database / Connection Settings Modal */}
      <ConnectionSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
