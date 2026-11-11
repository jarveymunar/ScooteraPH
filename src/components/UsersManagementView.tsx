import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Profile, UserRole } from '../types';
import { formatPHP } from '../lib/utils';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  User,
  Power,
  Check,
  AlertCircle,
  Clock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const {
    availableUsers,
    currentUser,
    addUserCredential,
    toggleUserActiveStatus,
  } = useApp();

  const isOwner = currentUser.role === 'owner';
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('pass123');
  const [formRole, setFormRole] = useState<UserRole>('staff');
  const [formHourlyRate, setFormHourlyRate] = useState('65.00');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim()) return;

    addUserCredential({
      full_name: formFullName.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword.trim() || 'pass123',
      role: formRole,
      is_active: true,
      hourly_rate: parseFloat(formHourlyRate) || 0,
    });

    setIsAddUserModalOpen(false);
    setFormFullName('');
    setFormUsername('');
    setFormPassword('pass123');
    setFormRole('staff');
    setFormHourlyRate('65.00');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              {isOwner ? 'User Accounts & Access Control' : 'Staff Credentials Management'}
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            {isOwner
              ? 'Provision staff, admin, or owner accounts, manage access status, and configure hourly payroll rates.'
              : 'System Admins can provision staff barista accounts and monitor credentials.'}
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs tracking-wide shadow-sm cursor-pointer min-h-[44px]"
        >
          <UserPlus className="w-4 h-4 text-[#D97706]" />
          {isOwner ? 'Add New User' : 'Add Staff Account'}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Login Password</th>
                <th className="px-5 py-3.5 text-right">Hourly Rate (₱)</th>
                <th className="px-5 py-3.5 text-center">Account Status</th>
                {isOwner && <th className="px-5 py-3.5 text-center">Toggle Access</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE5]">
              {availableUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-[#FAF8F5] transition-colors ${
                    !user.is_active ? 'opacity-50 bg-[#F9F8F6]' : ''
                  }`}
                >
                  <td className="px-5 py-3.5 font-bold text-[#2C1810]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#FAF3EA] text-[#B45309] font-bold text-xs flex items-center justify-center">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <span>{user.full_name}</span>
                        {currentUser.id === user.id && (
                          <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                            Current Session
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#7A6B63]">
                    @{user.username}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase bg-[#FAF3EA] text-[#2C1810]">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-[#2C1810]">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#FAF3EA] px-2 py-0.5 rounded border border-[#E8DCCB]">
                        {revealedPasswords[user.id] ? (user.password || '••••••••') : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordReveal(user.id)}
                        className="text-[#8C7A70] hover:text-[#2C1810] p-1 cursor-pointer"
                        title={revealedPasswords[user.id] ? 'Hide password' : 'Show password'}
                      >
                        {revealedPasswords[user.id] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#2C1810] tabular-nums">
                    {formatPHP(user.hourly_rate)} / hr
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-5 py-3.5 text-center">
                      {user.id !== currentUser.id ? (
                        <button
                          onClick={() => toggleUserActiveStatus(user.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            user.is_active
                              ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{user.is_active ? 'Deactivate' : 'Reactivate'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Protected</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User Credentials */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2C1810]">
                {isOwner ? 'Add System User' : 'Add Staff Account'}
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. maria_barista"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm font-mono text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Login Password *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. barista123"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm font-mono text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Role *
                  </label>
                  {isOwner ? (
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as UserRole)}
                      className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-[#2C1810] font-medium focus:ring-2 focus:ring-[#D97706] cursor-pointer"
                    >
                      <option value="staff">Staff (Barista)</option>
                      <option value="admin">System Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Staff (Barista)"
                      className="w-full bg-neutral-100 border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs text-neutral-600 font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Hourly Wage Rate (₱)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#7A6B63] bg-[#FAF3EA] p-3 rounded-xl border border-[#E8DCCB]">
                * Users can sign in immediately using their username. Deactivated users are blocked from logging in.
              </p>

              <div className="p-4 bg-[#FAF7F2] -mx-6 -mb-6 border-t border-[#E6DFD5] flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
