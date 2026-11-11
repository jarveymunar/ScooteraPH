import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import {
  formatPHP,
  formatManilaDateTime,
  getTodayManila,
  exportToCSV,
  generateReceiptsRegisterPDF,
} from '../lib/utils';
import {
  Receipt,
  Download,
  Search,
  Printer,
  FileText,
} from 'lucide-react';

export const ReceiptsLedger: React.FC = () => {
  const { orders, setSelectedReceipt, currentUser } = useApp();
  const todayStr = getTodayManila();

  const [dateFilterMode, setDateFilterMode] = useState<'today' | 'range' | 'all'>('today');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders according to selected mode and query
  const filteredOrders = orders.filter((o) => {
    if (currentUser.role === 'staff' && o.order_date !== todayStr) {
      return false;
    }

    if (dateFilterMode === 'today' && o.order_date !== todayStr) {
      return false;
    }

    if (dateFilterMode === 'range') {
      if (o.order_date < startDate || o.order_date > endDate) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesNumber = o.order_number.toLowerCase().includes(q);
      const matchesCashier = o.cashier_name.toLowerCase().includes(q);
      const matchesItems = o.items.some((i) => i.item_name.toLowerCase().includes(q));
      if (!matchesNumber && !matchesCashier && !matchesItems) return false;
    }

    return true;
  });

  const totalFilteredSales = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Export CSV
  const handleExportCSV = () => {
    const csvData = filteredOrders.map((o) => ({
      OrderNumber: o.order_number,
      OrderDate: o.order_date,
      DateTimeGMT8: formatManilaDateTime(o.created_at),
      Cashier: o.cashier_name,
      TotalAmountPHP: o.total_amount,
      PaymentMethod: o.payment_method.toUpperCase(),
      AmountTendered: o.amount_tendered,
      ChangeDue: o.change_due,
      ItemsSummary: o.items.map((i) => {
        const addons = i.selected_addons && i.selected_addons.length > 0
          ? ` (+${i.selected_addons.map((a) => a.name).join(', ')})`
          : '';
        return `${i.quantity}x ${i.item_name}${addons}`;
      }).join('; '),
    }));
    exportToCSV(`Scootera_Receipts_${startDate}_to_${endDate}`, csvData);
  };

  // Generate Receipt Records PDF
  const handleExportPDF = () => {
    generateReceiptsRegisterPDF({
      period: dateFilterMode === 'today' ? `Today (${todayStr})` : `${startDate} to ${endDate}`,
      totalOrders: filteredOrders.length,
      totalSales: totalFilteredSales,
      orders: filteredOrders,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Records of Receipts
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            {currentUser.role === 'staff'
              ? "Showing today's receipts ledger. Older days are archived."
              : 'Default view displays today’s receipts. Filter by date or date range to view historical receipts.'}
          </p>
        </div>

        {/* Action Buttons: PDF & CSV */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportPDF}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-[#D97706]" />
            Generate Receipts PDF
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#4A3B32] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Download className="w-4 h-4 text-[#B45309]" />
            Export CSV ({filteredOrders.length})
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Date Filter Tabs */}
        {currentUser.role !== 'staff' && (
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1 p-1 bg-[#F5EFE6] rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDateFilterMode('today')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer min-h-[38px] ${
                  dateFilterMode === 'today'
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B5A50] hover:text-[#2C1810]'
                }`}
              >
                Today Only
              </button>
              <button
                onClick={() => setDateFilterMode('range')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer min-h-[38px] ${
                  dateFilterMode === 'range'
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B5A50] hover:text-[#2C1810]'
                }`}
              >
                Date Range
              </button>
              <button
                onClick={() => setDateFilterMode('all')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer min-h-[38px] ${
                  dateFilterMode === 'all'
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B5A50] hover:text-[#2C1810]'
                }`}
              >
                All Records
              </button>
            </div>

            {/* Date Range Inputs */}
            {dateFilterMode === 'range' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E6DFD5] rounded-lg px-2.5 py-1.5 text-xs text-[#2C1810] focus:ring-1 focus:ring-[#D97706]"
                />
                <span className="text-[#8C7A70]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E6DFD5] rounded-lg px-2.5 py-1.5 text-xs text-[#2C1810] focus:ring-1 focus:ring-[#D97706]"
                />
              </div>
            )}
          </div>
        )}

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order no. or cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2C1810] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#D97706] min-h-[44px]"
          />
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Receipts Count</span>
          <p className="text-xl font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {filteredOrders.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Total Collected</span>
          <p className="text-xl font-bold font-mono text-[#B45309] mt-1 tabular-nums">
            {formatPHP(totalFilteredSales)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Average Ticket</span>
          <p className="text-xl font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {filteredOrders.length > 0
              ? formatPHP(totalFilteredSales / filteredOrders.length)
              : '₱0.00'}
          </p>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-[#8C7A70]">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-[#D5C9BC]" />
            <h3 className="font-bold text-sm text-[#2C1810]">No receipts found</h3>
            <p className="text-xs text-[#7A6B63] mt-1">
              No transactions match the selected date or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Date & Time (GMT+8)</th>
                  <th className="px-5 py-3">Items & Add-ons Summary</th>
                  <th className="px-5 py-3">Cashier</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Total Amount</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE5]">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#FAF8F5] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold font-mono text-[#2C1810]">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-3.5 text-[#7A6B63]">
                      {formatManilaDateTime(order.created_at)}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="line-clamp-2 text-[#2C1810]">
                        {order.items.map((i) => {
                          const addons = i.selected_addons && i.selected_addons.length > 0
                            ? ` (+${i.selected_addons.map((a) => a.name).join(', ')})`
                            : '';
                          return `${i.quantity}x ${i.item_name}${addons}`;
                        }).join('; ')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#4A3B32] font-medium">
                      {order.cashier_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0EAE1] text-[#4A3B32]">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold font-mono text-sm text-[#B45309] tabular-nums">
                      {formatPHP(order.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedReceipt(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] font-semibold text-xs cursor-pointer min-h-[36px]"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#B45309]" />
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
