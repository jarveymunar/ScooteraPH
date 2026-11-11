import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPHP, generateConsolidatedReportPDF, getTodayManila, formatManilaDateOnly } from '../lib/utils';
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Coffee,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';

export const SalesDashboardView: React.FC = () => {
  const { orders, expenses, attendance, availableUsers } = useApp();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriodChoice, setReportPeriodChoice] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Annual'>('Daily');

  const todayStr = getTodayManila();

  // Non-voided expenses only
  const activeExpenses = expenses.filter((e) => !e.is_voided);

  // Filter orders according to period
  const periodOrders = orders.filter((o) => {
    if (period === 'daily') return o.order_date === todayStr;
    if (period === 'monthly') return o.order_date.startsWith(todayStr.slice(0, 7));
    if (period === 'annual') return o.order_date.startsWith(todayStr.slice(0, 4));
    return true; // weekly
  });

  const periodExpenses = activeExpenses.filter((e) => {
    if (period === 'daily') return e.expense_date === todayStr;
    if (period === 'monthly') return e.expense_date.startsWith(todayStr.slice(0, 7));
    if (period === 'annual') return e.expense_date.startsWith(todayStr.slice(0, 4));
    return true; // weekly
  });

  // Financial aggregates by period
  const totalSales = periodOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOperatingExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Payroll expense computation (time attendance x hourly rate)
  const totalPayroll = attendance.reduce((sum, a) => {
    if (!a.total_hours) return sum;
    if (period === 'daily' && a.work_date !== todayStr) return sum;
    const user = availableUsers.find((u) => u.id === a.user_id);
    const rate = user ? user.hourly_rate : 65.00;
    return sum + a.total_hours * rate;
  }, 0);

  const grandTotalExpenses = totalOperatingExpenses + (period === 'daily' ? totalPayroll * 0.25 : totalPayroll);
  const netProfit = totalSales - grandTotalExpenses;

  // Most-bought menu items aggregation
  const itemSalesMap: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
  periodOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      if (!itemSalesMap[item.item_name]) {
        itemSalesMap[item.item_name] = {
          name: item.item_name,
          category: 'Beverage / Item',
          quantity: 0,
          revenue: 0,
        };
      }
      itemSalesMap[item.item_name].quantity += item.quantity;
      itemSalesMap[item.item_name].revenue += item.subtotal;
    });
  });

  const topItems = Object.values(itemSalesMap).sort((a, b) => b.quantity - a.quantity);

  // Expenses by Category breakdown
  const categoryTotalsMap: Record<string, number> = {};
  periodExpenses.forEach((exp) => {
    categoryTotalsMap[exp.category_name] = (categoryTotalsMap[exp.category_name] || 0) + exp.amount;
  });
  if (totalPayroll > 0) {
    categoryTotalsMap['Payroll & Labor'] = (categoryTotalsMap['Payroll & Labor'] || 0) + totalPayroll;
  }

  const categoryChartData = Object.entries(categoryTotalsMap).map(([cat, amt]) => ({
    name: cat,
    value: amt,
    percentage: grandTotalExpenses > 0 ? (amt / grandTotalExpenses) * 100 : 0,
  }));

  // Visual trend mock data based on period
  const trendData = [
    { label: '8 AM', Sales: 850, Expenses: 300, Profit: 550 },
    { label: '10 AM', Sales: 1650, Expenses: 450, Profit: 1200 },
    { label: '12 PM', Sales: 2400, Expenses: 800, Profit: 1600 },
    { label: '2 PM', Sales: 1950, Expenses: 650, Profit: 1300 },
    { label: '4 PM', Sales: 2800, Expenses: 900, Profit: 1900 },
    { label: '6 PM', Sales: 2200, Expenses: 750, Profit: 1450 },
    { label: '8 PM', Sales: 1400, Expenses: 500, Profit: 900 },
  ];

  const DONUT_COLORS = ['#B45309', '#D97706', '#2C1810', '#0284C7', '#10B981', '#6366F1', '#EC4899'];

  // Trigger consolidated PDF generation including Daily
  const handleGeneratePDF = () => {
    let dateRangeStr = '';
    if (reportPeriodChoice === 'Daily') {
      dateRangeStr = `Daily Summary for ${formatManilaDateOnly(todayStr)}`;
    } else if (reportPeriodChoice === 'Weekly') {
      dateRangeStr = 'Current Week (Mon - Sun)';
    } else if (reportPeriodChoice === 'Monthly') {
      dateRangeStr = `Month of ${todayStr.slice(0, 7)}`;
    } else {
      dateRangeStr = `Fiscal Year ${todayStr.slice(0, 4)}`;
    }

    generateConsolidatedReportPDF({
      periodType: reportPeriodChoice,
      dateRange: dateRangeStr,
      totalSales,
      totalOrders: periodOrders.length,
      averageOrder: periodOrders.length > 0 ? totalSales / periodOrders.length : 0,
      totalExpenses: grandTotalExpenses,
      netProfit,
      topItems: topItems.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        revenue: i.revenue,
      })),
      expensesByCategory: categoryChartData.map((c) => ({
        category: c.name,
        amount: c.value,
        percentage: c.percentage,
      })),
    });
    setIsReportModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Real-Time Sales & Profit Dashboard
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Aggregated revenue, operational expenses, net profit, and product sales volume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex items-center p-1 bg-[#F5EFE6] rounded-xl text-xs font-semibold">
            {(['daily', 'weekly', 'monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-[#2C1810] text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B5A50] hover:text-[#2C1810]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Generate PDF Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-[#D97706]" />
            Generate Report (PDF)
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A6B63] uppercase tracking-wider">
              {period.toUpperCase()} Gross Sales
            </span>
            <div className="p-2 rounded-lg bg-[#FAF3EA] text-[#B45309]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#2C1810] tabular-nums">
            {formatPHP(totalSales)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Store terminal active</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A6B63] uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-mono text-rose-700 tabular-nums">
            {formatPHP(grandTotalExpenses)}
          </p>
          <p className="text-xs text-[#7A6B63]">
            Non-voided operating + labor
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A6B63] uppercase tracking-wider">
              Net Profit
            </span>
            <div
              className={`p-2 rounded-lg ${
                netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold font-mono tabular-nums ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatPHP(netProfit)}
          </p>
          <p className="text-xs text-[#7A6B63]">
            Margin: {totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%
          </p>
        </div>

        {/* Order Volume */}
        <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7A6B63] uppercase tracking-wider">
              Orders Count
            </span>
            <div className="p-2 rounded-lg bg-[#F5EFE6] text-[#2C1810]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#2C1810] tabular-nums">
            {periodOrders.length}
          </p>
          <p className="text-xs text-[#7A6B63]">
            Avg Ticket:{' '}
            <span className="font-mono font-bold">
              {periodOrders.length > 0 ? formatPHP(totalSales / periodOrders.length) : '₱0.00'}
            </span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Trend Chart (Cols 8) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-sm text-[#2C1810]">
              Revenue & Profit Timeline ({period.toUpperCase()})
            </h2>
            <p className="text-xs text-[#7A6B63]">
              Hour/day distribution of gross sales vs profit in Philippine Peso (₱).
            </p>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EAE1" />
                <XAxis dataKey="label" stroke="#8C7A70" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C7A70" fontSize={11} tickLine={false} tickFormatter={(v) => `₱${v}`} />
                <Tooltip
                  formatter={(val: unknown) => [formatPHP(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '12px', border: '1px solid #E6DFD5', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Sales" fill="#2C1810" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category Donut (Cols 4) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E6DFD5] shadow-xs space-y-4">
          <div>
            <h2 className="font-bold text-sm text-[#2C1810]">
              Expenses Breakdown
            </h2>
            <p className="text-xs text-[#7A6B63]">
              Non-voided operating expenses.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <p className="text-xs text-[#8C7A70]">No expense data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [formatPHP(Number(val)), 'Amount']}
                    contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '10px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F0EAE1]">
            {categoryChartData.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="text-[#4A3B32] truncate max-w-[140px]">{c.name}</span>
                </div>
                <span className="font-mono font-bold text-[#2C1810] tabular-nums">
                  {formatPHP(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most-Bought Menu Items Leaderboard */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5]">
          <h2 className="font-bold text-sm text-[#2C1810]">
            Most-Bought Menu Items Leaderboard
          </h2>
          <p className="text-xs text-[#7A6B63]">
            Ranking based on processed customer orders and receipts for this period.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Menu Item</th>
                <th className="px-5 py-3 text-center">Items Sold</th>
                <th className="px-5 py-3 text-right">Gross Revenue</th>
                <th className="px-5 py-3 text-center">Popularity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE5]">
              {topItems.map((item, idx) => (
                <tr key={item.name} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-5 py-3.5 font-bold font-mono text-[#B45309]">
                    #{idx + 1}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#2C1810]">
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold tabular-nums">
                    {item.quantity} orders
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-[#B45309] tabular-nums">
                    {formatPHP(item.revenue)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="w-32 bg-[#F0EAE1] rounded-full h-2 mx-auto overflow-hidden">
                      <div
                        className="bg-[#D97706] h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (item.quantity / (topItems[0]?.quantity || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consolidated PDF Report Selection Modal with Daily Option */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6DFD5] space-y-5">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#FAF3EA] text-[#B45309] flex items-center justify-center mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#2C1810]">
                Generate Consolidated Financial PDF Report
              </h3>
              <p className="text-xs text-[#7A6B63] mt-1">
                Select reporting period. Includes sales, most-bought items, operating expenses, and net profit.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider">
                Select Report Scope:
              </label>
              {(['Daily', 'Weekly', 'Monthly', 'Annual'] as const).map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    reportPeriodChoice === opt
                      ? 'bg-[#FAF3EA] border-[#D97706] text-[#2C1810]'
                      : 'border-[#E6DFD5] hover:bg-[#FAF7F2] text-[#4A3B32]'
                  }`}
                >
                  <span className="font-bold text-xs">{opt} Financial Report</span>
                  <input
                    type="radio"
                    name="reportPeriod"
                    value={opt}
                    checked={reportPeriodChoice === opt}
                    onChange={() => setReportPeriodChoice(opt)}
                    className="text-[#D97706] focus:ring-[#D97706]"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-[#D97706]" />
                Download {reportPeriodChoice} PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
