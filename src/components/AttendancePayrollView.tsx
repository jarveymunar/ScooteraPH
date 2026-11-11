import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatPHP,
  formatManilaDateTime,
  formatManilaTimeOnly,
  getTodayManila,
  exportToCSV,
  generatePayslipPDF,
} from '../lib/utils';
import {
  BadgeDollarSign,
  Download,
  FileText,
  Search,
  Edit2,
  Check,
  X,
  User,
  Clock,
  Printer,
  Eye,
} from 'lucide-react';

export const AttendancePayrollView: React.FC = () => {
  const {
    attendance,
    availableUsers,
    currentUser,
    updateEmployeeHourlyRate,
  } = useApp();

  const isOwner = currentUser.role === 'owner';
  const today = getTodayManila();

  // Filters
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState(today);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Editing hourly rate state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempRateInput, setTempRateInput] = useState<string>('');

  // Payslip Preview Modal State
  const [viewingPayslip, setViewingPayslip] = useState<{
    user: (typeof availableUsers)[0];
    shiftsCount: number;
    totalHours: number;
    hourlyRate: number;
    grossPay: number;
    shifts: typeof attendance;
  } | null>(null);

  // Filter attendance records by date range and employee
  const filteredAttendance = attendance.filter((a) => {
    if (a.work_date < startDate || a.work_date > endDate) return false;
    if (selectedUserId !== 'all' && a.user_id !== selectedUserId) return false;
    return true;
  });

  // Consolidated payroll breakdown per employee
  const payrollSummary = availableUsers
    .filter((u) => (selectedUserId === 'all' ? true : u.id === selectedUserId))
    .map((user) => {
      const userShifts = attendance.filter(
        (a) =>
          a.user_id === user.id &&
          a.work_date >= startDate &&
          a.work_date <= endDate &&
          a.total_hours !== null
      );
      const totalHours = userShifts.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      const grossPay = totalHours * user.hourly_rate;

      return {
        user,
        shiftsCount: userShifts.length,
        totalHours,
        hourlyRate: user.hourly_rate,
        grossPay,
        shifts: userShifts,
      };
    });

  const grandTotalPay = payrollSummary.reduce((sum, p) => sum + p.grossPay, 0);
  const grandTotalHours = payrollSummary.reduce((sum, p) => sum + p.totalHours, 0);

  // Start editing rate
  const handleStartEditRate = (userId: string, currentRate: number) => {
    setEditingUserId(userId);
    setTempRateInput(String(currentRate));
  };

  const handleSaveRate = (userId: string) => {
    const parsed = parseFloat(tempRateInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateEmployeeHourlyRate(userId, parsed);
    }
    setEditingUserId(null);
  };

  // Export Attendance CSV respecting filters
  const handleExportAttendanceCSV = () => {
    const csvData = filteredAttendance.map((a) => {
      const u = availableUsers.find((usr) => usr.id === a.user_id);
      const rate = u ? u.hourly_rate : 0;
      const hours = a.total_hours || 0;
      return {
        Employee: a.user_name,
        Role: u?.role || 'staff',
        WorkDate: a.work_date,
        TimeIn: a.time_in,
        TimeOut: a.time_out || 'Active',
        TotalHours: hours,
        HourlyRatePHP: rate,
        SubtotalPayPHP: (hours * rate).toFixed(2),
        Status: a.status,
      };
    });
    exportToCSV(`Scootera_Attendance_${startDate}_to_${endDate}`, csvData);
  };

  // Download PDF from Preview
  const handleDownloadPDF = () => {
    if (!viewingPayslip) return;
    generatePayslipPDF({
      employeeName: viewingPayslip.user.full_name,
      role: viewingPayslip.user.role,
      period: `${startDate} to ${endDate}`,
      hourlyRate: viewingPayslip.user.hourly_rate,
      totalHours: viewingPayslip.totalHours,
      grossPay: viewingPayslip.grossPay,
      shifts: viewingPayslip.shifts.map((s) => ({
        date: s.work_date,
        timeIn: formatManilaTimeOnly(s.time_in),
        timeOut: s.time_out ? formatManilaTimeOnly(s.time_out) : 'Open',
        hours: s.total_hours || 0,
      })),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Attendance & Payroll Monitoring
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Track employee work hours, manage hourly wage rates, view payslip proofs, and export official reports.
          </p>
        </div>

        <button
          onClick={handleExportAttendanceCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#4A3B32] font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4 text-[#B45309]" />
          Export Attendance CSV
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Date Range Inputs */}
        <div className="md:col-span-6 flex items-center gap-2 text-xs">
          <span className="font-bold text-[#4A3B32] whitespace-nowrap">Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] min-h-[40px]"
          />
          <span className="text-[#8C7A70]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] min-h-[40px]"
          />
        </div>

        {/* Employee Dropdown */}
        <div className="md:col-span-6 flex items-center gap-2">
          <div className="relative w-full">
            <User className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2C1810] font-medium focus:ring-2 focus:ring-[#D97706] min-h-[40px] cursor-pointer"
            >
              <option value="all">All Employees</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Total Shift Hours</span>
          <p className="text-xl font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {grandTotalHours.toFixed(2)} hrs
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Consolidated Gross Payroll</span>
          <p className="text-xl font-bold font-mono text-[#B45309] mt-1 tabular-nums">
            {formatPHP(grandTotalPay)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Active Employees</span>
          <p className="text-xl font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {availableUsers.filter((u) => u.is_active).length}
          </p>
        </div>
      </div>

      {/* Consolidated Payroll Table */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5]">
          <h2 className="font-bold text-sm text-[#2C1810]">
            Consolidated Payroll Report
          </h2>
          <p className="text-[11px] text-[#7A6B63]">
            Click "View Payslip" to preview the breakdown before downloading.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                <th className="px-5 py-3">Employee Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-center">Completed Shifts</th>
                <th className="px-5 py-3 text-right">Total Hours</th>
                <th className="px-5 py-3 text-right">Hourly Rate (₱)</th>
                <th className="px-5 py-3 text-right">Gross Pay</th>
                <th className="px-5 py-3 text-center">Payslip Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE5]">
              {payrollSummary.map((summary) => (
                <tr key={summary.user.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#2C1810]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#FAF3EA] text-[#B45309] font-bold text-[10px] flex items-center justify-center">
                        {summary.user.full_name.charAt(0)}
                      </div>
                      <span>{summary.user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-[#7A6B63]">
                    {summary.user.role}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono tabular-nums">
                    {summary.shiftsCount}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-[#2C1810] tabular-nums">
                    {summary.totalHours.toFixed(2)} hrs
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                    {editingUserId === summary.user.id ? (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          step="1"
                          value={tempRateInput}
                          onChange={(e) => setTempRateInput(e.target.value)}
                          className="w-18 bg-white border border-[#D97706] rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRate(summary.user.id)}
                          className="p-1 rounded hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1 rounded hover:bg-rose-100 text-rose-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span className="font-semibold">{formatPHP(summary.hourlyRate)}</span>
                        {isOwner && summary.user.role !== 'owner' && (
                          <button
                            onClick={() => handleStartEditRate(summary.user.id, summary.hourlyRate)}
                            className="p-1 rounded hover:bg-[#F2ECE4] text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
                            title="Edit Hourly Rate"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#B45309] tabular-nums">
                    {formatPHP(summary.grossPay)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => setViewingPayslip(summary)}
                      disabled={summary.totalHours === 0}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] font-semibold text-xs cursor-pointer disabled:opacity-40 min-h-[34px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B45309]" />
                      View Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYSLIP PREVIEW MODAL (View first before download) */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E6DFD5] overflow-hidden my-6 animate-in fade-in">
            {/* Modal Top Bar */}
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#B45309]" />
                <h3 className="font-bold text-base text-[#2C1810]">
                  Official Payslip Preview · Proof of Pay
                </h3>
              </div>
              <button
                onClick={() => setViewingPayslip(null)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Rendered Payslip Document Area */}
            <div className="p-6 space-y-5 bg-[#FAF7F2]/40">
              {/* Header Box */}
              <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-[#D97706] p-0.5 overflow-hidden bg-white shrink-0">
                    <img
                      src="/assets/aistudio/image_5df9d1fb.png"
                      alt="Scootera Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-[#2C1810]">
                      SCOOTERA CAFÉ
                    </h2>
                    <p className="text-[11px] text-[#7A6B63]">
                      Official Payroll Ledger · Asia/Manila (GMT+8)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified Shift Record
                  </span>
                  <p className="text-[10px] text-[#8C7A70] mt-1 font-mono">
                    {formatManilaDateTime(new Date())}
                  </p>
                </div>
              </div>

              {/* Employee & Period Details Grid */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#8C7A70] uppercase">Employee</span>
                  <p className="font-bold text-sm text-[#2C1810]">{viewingPayslip.user.full_name}</p>
                  <p className="text-[11px] text-[#7A6B63] capitalize">Role: {viewingPayslip.user.role}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#8C7A70] uppercase">Pay Period</span>
                  <p className="font-bold text-sm text-[#2C1810]">{startDate} to {endDate}</p>
                  <p className="text-[11px] text-[#B45309] font-mono font-bold">
                    Rate: {formatPHP(viewingPayslip.user.hourly_rate)} / hr
                  </p>
                </div>
              </div>

              {/* Shift Breakdown List */}
              <div className="bg-white rounded-2xl border border-[#E6DFD5] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAF7F2] border-b border-[#E6DFD5] font-bold text-xs text-[#4A3B32] flex justify-between">
                  <span>Shift Date</span>
                  <span>Time In / Out</span>
                  <span>Hours</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-[#F2EDE5] max-h-48 overflow-y-auto text-xs">
                  {viewingPayslip.shifts.map((s) => (
                    <div key={s.id} className="px-4 py-2 flex items-center justify-between">
                      <span className="font-medium text-[#2C1810]">{s.work_date}</span>
                      <span className="text-[#7A6B63] font-mono text-[11px]">
                        {formatManilaTimeOnly(s.time_in)} – {s.time_out ? formatManilaTimeOnly(s.time_out) : 'Open'}
                      </span>
                      <span className="font-mono text-[#2C1810]">
                        {(s.total_hours || 0).toFixed(2)} hrs
                      </span>
                      <span className="font-mono font-bold text-[#B45309]">
                        {formatPHP((s.total_hours || 0) * viewingPayslip.user.hourly_rate)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grand Gross Pay Totals */}
                <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-[#4A3B32]">Total Hours Worked:</span>
                    <p className="font-mono font-bold text-sm text-[#2C1810]">
                      {viewingPayslip.totalHours.toFixed(2)} hours
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#4A3B32]">Total Gross Pay:</span>
                    <p className="font-mono font-extrabold text-xl text-[#B45309] tabular-nums">
                      {formatPHP(viewingPayslip.grossPay)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-[#E6DFD5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2.5 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer min-h-[40px]"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
              >
                <Download className="w-4 h-4 text-[#D97706]" />
                Download Payslip PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
