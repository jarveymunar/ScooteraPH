import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, RecurringExpense, PaymentMethod, RecurringFrequency } from '../types';
import { formatPHP, formatManilaDateOnly, formatManilaDateTime, getTodayManila, exportToCSV } from '../lib/utils';
import {
  Wallet,
  Plus,
  Repeat,
  AlertCircle,
  Download,
  Search,
  Filter,
  CheckCircle,
  Calendar,
  Ban,
  Clock,
  Play,
  Pause,
  Edit2,
  Trash2,
  FileCheck,
  Tag,
  DollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const ExpensesTrackerView: React.FC = () => {
  const {
    expenses,
    recurringExpenses,
    expenseCategories,
    addExpense,
    voidExpense,
    saveRecurringTemplate,
    toggleRecurringTemplateActive,
    triggerRecurringExpensesGeneration,
  } = useApp();

  const todayStr = getTodayManila();

  // Active top-level subtab: 'one-time' or 'recurring'
  const [subTab, setSubTab] = useState<'one-time' | 'recurring'>('one-time');

  // Filters for One-Time Expenses
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('month');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [recurringOnlyFilter, setRecurringOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddRecurringModalOpen, setIsAddRecurringModalOpen] = useState(false);
  const [voidingExpenseId, setVoidingExpenseId] = useState<string | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Expense Form State
  const [newExpenseForm, setNewExpenseForm] = useState({
    expense_date: todayStr,
    category_id: expenseCategories[0]?.id || 'expcat-1',
    description: '',
    vendor: '',
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    reference_no: '',
    notes: '',
  });

  // New Recurring Template Form State
  const [newRecurringForm, setNewRecurringForm] = useState({
    category_id: expenseCategories[0]?.id || 'expcat-1',
    description: '',
    vendor: '',
    amount: '',
    payment_method: 'bank_transfer' as PaymentMethod,
    frequency: 'monthly' as RecurringFrequency,
    day_of_month: 1,
    start_date: todayStr,
    next_due_date: todayStr,
    is_variable: false,
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategoryFilter !== 'all' && e.category_id !== selectedCategoryFilter) return false;
    if (selectedPaymentFilter !== 'all' && e.payment_method !== selectedPaymentFilter) return false;
    if (recurringOnlyFilter && !e.recurring_id) return false;

    if (dateFilter === 'today' && e.expense_date !== todayStr) return false;
    if (dateFilter === 'month' && !e.expense_date.startsWith(todayStr.slice(0, 7))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchVendor = e.vendor.toLowerCase().includes(q);
      if (!matchDesc && !matchVendor) return false;
    }
    return true;
  });

  // Summary Metrics
  const nonVoidedExpenses = expenses.filter((e) => !e.is_voided);
  const todayTotal = nonVoidedExpenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthTotal = nonVoidedExpenses
    .filter((e) => e.expense_date.startsWith(todayStr.slice(0, 7)))
    .reduce((sum, e) => sum + e.amount, 0);

  const thisYearTotal = nonVoidedExpenses
    .filter((e) => e.expense_date.startsWith(todayStr.slice(0, 4)))
    .reduce((sum, e) => sum + e.amount, 0);

  // Top category
  const categorySpending: Record<string, number> = {};
  nonVoidedExpenses.forEach((e) => {
    categorySpending[e.category_name] = (categorySpending[e.category_name] || 0) + e.amount;
  });
  const topCategoryEntry = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

  // Upcoming 30 days recurring total calculation
  const upcomingRecurringTotal = recurringExpenses
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.amount, 0);

  // Chart data
  const pieData = Object.entries(categorySpending).map(([name, value]) => ({ name, value }));
  const DONUT_COLORS = ['#B45309', '#D97706', '#2C1810', '#0284C7', '#10B981', '#6366F1', '#EC4899'];

  // Handle Add One-Time Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpenseForm.amount);
    if (isNaN(amt) || amt <= 0 || !newExpenseForm.description.trim() || !newExpenseForm.vendor.trim()) {
      showToast('Please fill out all required fields with an amount > 0');
      return;
    }

    const cat = expenseCategories.find((c) => c.id === newExpenseForm.category_id);

    addExpense({
      expense_date: newExpenseForm.expense_date,
      category_id: newExpenseForm.category_id,
      category_name: cat ? cat.name : 'Miscellaneous',
      description: newExpenseForm.description,
      vendor: newExpenseForm.vendor,
      amount: amt,
      payment_method: newExpenseForm.payment_method,
      reference_no: newExpenseForm.reference_no,
      receipt_path: null,
      notes: newExpenseForm.notes,
      is_estimate: false,
    });

    setIsAddExpenseModalOpen(false);
    setNewExpenseForm({
      expense_date: todayStr,
      category_id: expenseCategories[0]?.id || 'expcat-1',
      description: '',
      vendor: '',
      amount: '',
      payment_method: 'cash',
      reference_no: '',
      notes: '',
    });
    showToast('One-time expense recorded successfully.');
  };

  // Handle Void Expense
  const handleConfirmVoid = () => {
    if (!voidingExpenseId) return;
    if (!voidReasonInput.trim()) {
      showToast('Void reason is strictly required by audit policy.');
      return;
    }
    voidExpense(voidingExpenseId, voidReasonInput.trim());
    setVoidingExpenseId(null);
    setVoidReasonInput('');
    showToast('Expense successfully voided and logged.');
  };

  // Handle Create Recurring Template
  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newRecurringForm.amount);
    if (isNaN(amt) || amt <= 0 || !newRecurringForm.description.trim() || !newRecurringForm.vendor.trim()) {
      showToast('Please enter a valid recurring template description and amount.');
      return;
    }

    const cat = expenseCategories.find((c) => c.id === newRecurringForm.category_id);

    saveRecurringTemplate({
      category_id: newRecurringForm.category_id,
      category_name: cat ? cat.name : 'Operating',
      description: newRecurringForm.description,
      vendor: newRecurringForm.vendor,
      amount: amt,
      payment_method: newRecurringForm.payment_method,
      frequency: newRecurringForm.frequency,
      day_of_month: Number(newRecurringForm.day_of_month),
      start_date: newRecurringForm.start_date,
      next_due_date: newRecurringForm.next_due_date,
      is_variable: newRecurringForm.is_variable,
      notes: newRecurringForm.notes,
    });

    setIsAddRecurringModalOpen(false);
    showToast('Recurring expense template saved.');
  };

  // Manual Trigger "Generate Now" for Recurring Expenses
  const handleGenerateNow = () => {
    const generated = triggerRecurringExpensesGeneration();
    if (generated > 0) {
      showToast(`Processed recurring templates. ${generated} new expense(s) created.`);
    } else {
      showToast('All recurring templates are up to date. No pending due expenses.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvData = filteredExpenses.map((e) => ({
      ExpenseDate: e.expense_date,
      Category: e.category_name,
      Description: e.description,
      Vendor: e.vendor,
      AmountPHP: e.amount,
      PaymentMethod: e.payment_method.toUpperCase(),
      ReferenceNo: e.reference_no || 'N/A',
      IsRecurring: e.recurring_id ? 'YES' : 'NO',
      IsEstimate: e.is_estimate ? 'YES (NEEDS REVIEW)' : 'NO',
      IsVoided: e.is_voided ? 'VOIDED' : 'ACTIVE',
      VoidReason: e.void_reason || '',
      RecordedBy: e.created_by_name,
      RecordedAt: formatManilaDateTime(e.created_at),
    }));
    exportToCSV(`Scootera_Expenses_Export_${todayStr}`, csvData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C1810] text-[#FAF7F2] px-5 py-3 rounded-2xl shadow-xl border border-[#D97706] text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-[#D97706]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Operating Expenses Tracker
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Strictly Owner-only. Track one-time operating costs, recurring bills, and scheduled auto-generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#4A3B32] font-semibold text-xs cursor-pointer min-h-[44px]"
          >
            <Download className="w-4 h-4 text-[#B45309]" />
            Export CSV
          </button>

          {subTab === 'one-time' ? (
            <button
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs tracking-wide shadow-sm cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              Add Expense
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateNow}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer min-h-[44px]"
              >
                <Play className="w-3.5 h-3.5" />
                Generate Now
              </button>
              <button
                onClick={() => setIsAddRecurringModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[44px]"
              >
                <Plus className="w-4 h-4 text-[#D97706]" />
                New Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#7A6B63]">Today's Expenses</span>
          <p className="text-lg font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {formatPHP(todayTotal)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#7A6B63]">This Month</span>
          <p className="text-lg font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {formatPHP(thisMonthTotal)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#7A6B63]">This Year (YTD)</span>
          <p className="text-lg font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {formatPHP(thisYearTotal)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#7A6B63]">Top Cost Category</span>
          <p className="text-sm font-bold text-[#B45309] mt-1 truncate">
            {topCategoryEntry ? topCategoryEntry[0] : 'None'}
          </p>
          <span className="text-[10px] text-[#8C7A70] font-mono tabular-nums">
            {topCategoryEntry ? formatPHP(topCategoryEntry[1]) : '₱0.00'}
          </span>
        </div>

        <div className="bg-[#FAF3EA] p-4 rounded-xl border border-[#E8DCCB] shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-[#B45309]">Upcoming (30 Days)</span>
          <p className="text-lg font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {formatPHP(upcomingRecurringTotal)}
          </p>
          <span className="text-[10px] text-[#7A6B63]">From active recurring</span>
        </div>
      </div>

      {/* Subtab Segmented Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F5EFE6] rounded-2xl max-w-sm">
        <button
          onClick={() => setSubTab('one-time')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
            subTab === 'one-time'
              ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
              : 'text-[#6B5A50] hover:text-[#2C1810]'
          }`}
        >
          <DollarSign className="w-4 h-4 text-[#D97706]" />
          Expenses Ledger ({filteredExpenses.length})
        </button>
        <button
          onClick={() => setSubTab('recurring')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
            subTab === 'recurring'
              ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
              : 'text-[#6B5A50] hover:text-[#2C1810]'
          }`}
        >
          <Repeat className="w-4 h-4 text-[#D97706]" />
          Recurring Templates ({recurringExpenses.length})
        </button>
      </div>

      {/* VIEW A: ONE-TIME EXPENSES LEDGER */}
      {subTab === 'one-time' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#F5EFE6] rounded-xl font-bold">
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    dateFilter === 'month' ? 'bg-[#2C1810] text-[#FAF7F2]' : 'text-[#6B5A50]'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    dateFilter === 'today' ? 'bg-[#2C1810] text-[#FAF7F2]' : 'text-[#6B5A50]'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    dateFilter === 'all' ? 'bg-[#2C1810] text-[#FAF7F2]' : 'text-[#6B5A50]'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] font-medium min-h-[38px] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Recurring Only Checkbox */}
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD5] font-semibold text-[#4A3B32] cursor-pointer min-h-[38px]">
                <input
                  type="checkbox"
                  checked={recurringOnlyFilter}
                  onChange={(e) => setRecurringOnlyFilter(e.target.checked)}
                  className="rounded text-[#D97706] focus:ring-[#D97706]"
                />
                <span>Recurring Only</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] min-h-[38px]"
              />
            </div>
          </div>

          {/* Expenses List Table */}
          <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Description & Vendor</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Amount (₱)</th>
                    <th className="px-5 py-3.5 text-center">Badges</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE5]">
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        exp.is_voided ? 'opacity-50 bg-[#F9F8F6]' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-[#7A6B63] whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#2C1810]">
                          <span className={exp.is_voided ? 'line-through' : ''}>
                            {exp.description}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#7A6B63]">
                          Vendor: <span className="font-medium text-[#4A3B32]">{exp.vendor}</span>
                          {exp.reference_no && ` · Ref: ${exp.reference_no}`}
                        </div>
                        {exp.is_voided && (
                          <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                            VOIDED: "{exp.void_reason}" by {exp.voided_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#4A3B32] font-medium">
                        {exp.category_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0EAE1] text-[#4A3B32]">
                          {exp.payment_method}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3.5 text-right font-mono font-bold text-sm tabular-nums ${
                          exp.is_voided ? 'text-neutral-400 line-through' : 'text-rose-700'
                        }`}
                      >
                        {formatPHP(exp.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center space-x-1 whitespace-nowrap">
                        {exp.recurring_id && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Repeat className="w-2.5 h-2.5" /> Recurring
                          </span>
                        )}
                        {exp.is_estimate && !exp.is_voided && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            Needs Review
                          </span>
                        )}
                        {exp.is_voided && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <Ban className="w-2.5 h-2.5" /> Voided
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {!exp.is_voided && (
                          <button
                            onClick={() => {
                              setVoidingExpenseId(exp.id);
                              setVoidReasonInput('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer min-h-[32px]"
                            title="Void Expense"
                          >
                            <Ban className="w-3 h-3" />
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: RECURRING EXPENSES TEMPLATES */}
      {subTab === 'recurring' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringExpenses.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-[#E6DFD5] p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] bg-[#FAF3EA] px-2 py-0.5 rounded">
                        {tpl.frequency} · {tpl.category_name}
                      </span>
                      <h3 className="font-bold text-base text-[#2C1810] mt-1.5">
                        {tpl.description}
                      </h3>
                      <p className="text-xs text-[#7A6B63]">
                        Vendor: <span className="font-semibold text-[#4A3B32]">{tpl.vendor}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          tpl.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {tpl.is_active ? 'Active' : 'Paused'}
                      </span>
                      <p className="font-mono font-extrabold text-lg text-[#2C1810] mt-1 tabular-nums">
                        {formatPHP(tpl.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-[#FAF7F2] rounded-xl text-xs space-y-1 text-[#7A6B63]">
                    <div className="flex justify-between">
                      <span>Next Due Date:</span>
                      <span className="font-mono font-bold text-[#2C1810]">
                        {tpl.next_due_date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="uppercase font-semibold text-[#4A3B32]">
                        {tpl.payment_method}
                      </span>
                    </div>
                    {tpl.is_variable && (
                      <div className="text-purple-700 font-bold text-[11px] pt-1 border-t border-[#EAE3D9]">
                        * Variable utility: generates estimated expense with review badge.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F2EDE5]">
                  <button
                    onClick={() => toggleRecurringTemplateActive(tpl.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A3B32] hover:text-[#2C1810] cursor-pointer"
                  >
                    {tpl.is_active ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        Pause Template
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        Resume Template
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-[#8C7A70]">
                    Auto-trigger: daily 00:05 GMT+8
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD ONE-TIME EXPENSE */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2C1810]">
                Record Store Expense
              </h3>
              <button
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Expense Date (GMT+8)
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpenseForm.expense_date}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, expense_date: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Amount (PHP ₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newExpenseForm.amount}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Expense Category *
                </label>
                <select
                  value={newExpenseForm.category_id}
                  onChange={(e) =>
                    setNewExpenseForm({ ...newExpenseForm, category_id: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] cursor-pointer"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Description / Item Purchased *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 20L Whole Milk, Espresso Descaler..."
                  value={newExpenseForm.description}
                  onChange={(e) =>
                    setNewExpenseForm({ ...newExpenseForm, description: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Vendor / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hacienda Dairy Co."
                    value={newExpenseForm.vendor}
                    onChange={(e) =>
                      setNewExpenseForm({ ...newExpenseForm, vendor: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newExpenseForm.payment_method}
                    onChange={(e) =>
                      setNewExpenseForm({
                        ...newExpenseForm,
                        payment_method: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] cursor-pointer"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Receipt / Invoice Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. OR-84729"
                  value={newExpenseForm.reference_no}
                  onChange={(e) =>
                    setNewExpenseForm({ ...newExpenseForm, reference_no: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div className="p-4 bg-[#FAF7F2] -mx-6 -mb-6 border-t border-[#E6DFD5] flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD RECURRING TEMPLATE */}
      {isAddRecurringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2C1810]">
                Create Recurring Expense Template
              </h3>
              <button
                onClick={() => setIsAddRecurringModalOpen(false)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Template Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Commercial Cafe Lease"
                  value={newRecurringForm.description}
                  onChange={(e) =>
                    setNewRecurringForm({ ...newRecurringForm, description: e.target.value })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Vendor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vespa Plaza Properties"
                    value={newRecurringForm.vendor}
                    onChange={(e) =>
                      setNewRecurringForm({ ...newRecurringForm, vendor: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Amount (PHP ₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newRecurringForm.amount}
                    onChange={(e) =>
                      setNewRecurringForm({ ...newRecurringForm, amount: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Frequency
                  </label>
                  <select
                    value={newRecurringForm.frequency}
                    onChange={(e) =>
                      setNewRecurringForm({
                        ...newRecurringForm,
                        frequency: e.target.value as RecurringFrequency,
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] cursor-pointer"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecurringForm.next_due_date}
                    onChange={(e) =>
                      setNewRecurringForm({ ...newRecurringForm, next_due_date: e.target.value })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#4A3B32]">
                  <input
                    type="checkbox"
                    checked={newRecurringForm.is_variable}
                    onChange={(e) =>
                      setNewRecurringForm({ ...newRecurringForm, is_variable: e.target.checked })
                    }
                    className="rounded text-[#D97706] focus:ring-[#D97706]"
                  />
                  <span>Variable utility (Electricity, Water) — marks generated expense as Estimate</span>
                </label>
              </div>

              <div className="p-4 bg-[#FAF7F2] -mx-6 -mb-6 border-t border-[#E6DFD5] flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddRecurringModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM VOID WITH REQUIRED REASON */}
      {voidingExpenseId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD5] space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Ban className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#2C1810]">
                Void Expense Record
              </h3>
            </div>
            <p className="text-xs text-[#7A6B63]">
              Expenses cannot be hard-deleted to preserve financial integrity. Please state the reason for voiding:
            </p>

            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                Void Reason (Required for Audit Log) *
              </label>
              <textarea
                rows={3}
                required
                value={voidReasonInput}
                onChange={(e) => setVoidReasonInput(e.target.value)}
                placeholder="e.g. Duplicate entry, Supplier refunded cash, Incorrect amount entered..."
                className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVoidingExpenseId(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] text-xs font-semibold text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                disabled={!voidReasonInput.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
