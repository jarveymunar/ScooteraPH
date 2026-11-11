import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatManilaTimeOnly, formatManilaDateOnly, getTodayManila } from '../lib/utils';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const { currentUser, attendance, timeInUser, timeOutUser } = useApp();
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live digital clock in Asia/Manila
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's Manila date
  const todayStr = getTodayManila();

  // Find active open shift for current user
  const openShift = attendance.find(
    (a) => a.user_id === currentUser.id && a.status === 'open'
  );

  // Today's attendance ledger records (strictly today in Asia/Manila)
  const todaysRecords = attendance.filter((a) => a.work_date === todayStr);

  const handleTimeIn = () => {
    setFeedback(null);
    const res = timeInUser();
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleTimeOut = () => {
    setFeedback(null);
    const res = timeOutUser();
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Time-In / Time-Out Terminal Card */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] shadow-sm p-6 sm:p-8 text-center space-y-6">
        {/* Terminal Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF3EA] border border-[#E8DCCB] text-[#B45309] text-xs font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Server Time Attendance Terminal
        </div>

        {/* Live Digital Clock (GMT+8) */}
        <div>
          <div className="text-4xl sm:text-6xl font-extrabold font-mono text-[#2C1810] tracking-tight tabular-nums">
            {formatManilaTimeOnly(liveTime)}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#7A6B63] mt-2">
            Asia/Manila (GMT+8) · {formatManilaDateOnly(liveTime.toISOString())}
          </p>
        </div>

        {/* Active Employee Shift Status */}
        <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E5DCD0] flex items-center justify-center font-bold text-sm text-[#2C1810]">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm text-[#2C1810] leading-tight">
                {currentUser.full_name}
              </h4>
              <p className="text-xs text-[#7A6B63] capitalize">
                Role: {currentUser.role}
              </p>
            </div>
          </div>

          <div className="text-right">
            {openShift ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Shift Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 font-semibold text-xs">
                Not Clocked In
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Time-In and Time-Out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <button
            onClick={handleTimeIn}
            disabled={Boolean(openShift)}
            className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer min-h-[56px]"
          >
            <LogIn className="w-5 h-5" />
            <span>Time-In (Shift Start)</span>
          </button>

          <button
            onClick={handleTimeOut}
            disabled={!openShift}
            className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#2C1810] hover:bg-[#1A0E0A] disabled:opacity-40 disabled:hover:bg-[#2C1810] text-[#FAF7F2] font-bold text-sm shadow-md transition-all cursor-pointer min-h-[56px]"
          >
            <LogOut className="w-5 h-5 text-[#D97706]" />
            <span>Time-Out (Shift End)</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`max-w-md mx-auto p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <p className="text-[11px] text-[#8C7A70]">
          * Timestamps are recorded from the central database server clock to prevent manipulation.
        </p>
      </div>

      {/* Today's Attendance Log Ledger */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#B45309]" />
            <h2 className="font-bold text-sm text-[#2C1810]">
              Today's Attendance Log Ledger
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#7A6B63]">
            {formatManilaDateOnly(todayStr)}
          </span>
        </div>

        {todaysRecords.length === 0 ? (
          <div className="p-8 text-center text-[#8C7A70]">
            <Clock className="w-8 h-8 mx-auto mb-2 text-[#D5C9BC]" />
            <p className="text-xs font-medium">No shifts recorded yet today.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EDE5]">
            {todaysRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF3EA] text-[#B45309] font-bold text-xs flex items-center justify-center">
                    {record.user_name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#2C1810]">
                      {record.user_name}
                    </h5>
                    <p className="text-[11px] text-[#7A6B63]">
                      In: <span className="font-mono">{formatManilaTimeOnly(record.time_in)}</span>
                      {record.time_out && (
                        <span> · Out: <span className="font-mono">{formatManilaTimeOnly(record.time_out)}</span></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {record.status === 'open' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      In Progress
                    </span>
                  ) : (
                    <span className="font-bold font-mono text-xs text-[#2C1810] tabular-nums">
                      {record.total_hours?.toFixed(2)} hrs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
