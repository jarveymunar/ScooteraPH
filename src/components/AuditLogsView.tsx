import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatManilaDateTime } from '../lib/utils';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Distinct action types
  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedActionFilter !== 'all' && log.action !== selectedActionFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.user_name.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEntity = log.entity.toLowerCase().includes(q);
      if (!matchUser && !matchAction && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              System Audit Logs (Append-Only)
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Cryptographic ledger tracking all menu modifications, price changes, payroll updates, voids, and exports.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF3EA] border border-[#E8DCCB] text-[#B45309] text-xs font-bold font-mono">
          <Activity className="w-4 h-4" />
          <span>{auditLogs.length} Events Logged</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] font-medium focus:ring-2 focus:ring-[#D97706] min-h-[40px] cursor-pointer"
          >
            <option value="all">All Action Types</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search user, action, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none min-h-[40px]"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                <th className="px-5 py-3.5">Timestamp (GMT+8)</th>
                <th className="px-5 py-3.5">User & Role</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Record ID</th>
                <th className="px-5 py-3.5 text-center">Value Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE5]">
              {filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const hasPayload = log.old_values || log.new_values || log.metadata;

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-5 py-3.5 text-[#7A6B63] font-mono whitespace-nowrap">
                        {formatManilaDateTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#2C1810]">{log.user_name}</div>
                        <span className="text-[10px] uppercase font-semibold text-[#8C7A70]">
                          {log.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#B45309]">
                        {log.action}
                      </td>
                      <td className="px-5 py-3.5 text-[#4A3B32] font-mono">
                        {log.entity}
                      </td>
                      <td className="px-5 py-3.5 text-[#7A6B63] font-mono">
                        {log.record_id || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {hasPayload ? (
                          <button
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] font-semibold text-xs cursor-pointer"
                          >
                            <span>Diff Payload</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded JSON Inspector */}
                    {isExpanded && (
                      <tr className="bg-[#FAF7F2]">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.old_values && (
                              <div className="bg-white p-3 rounded-xl border border-rose-200">
                                <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                                  Previous Values (Old)
                                </span>
                                <pre className="text-[11px] font-mono text-[#2C1810] mt-1 overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.new_values && (
                              <div className="bg-white p-3 rounded-xl border border-emerald-200">
                                <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                                  New Values (Updated)
                                </span>
                                <pre className="text-[11px] font-mono text-[#2C1810] mt-1 overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.metadata && (
                              <div className="bg-white p-3 rounded-xl border border-[#E6DFD5] md:col-span-2">
                                <span className="text-[10px] font-bold uppercase text-[#7A6B63] tracking-wider">
                                  Context Metadata
                                </span>
                                <pre className="text-[11px] font-mono text-[#2C1810] mt-1 overflow-x-auto whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
