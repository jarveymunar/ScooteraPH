import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { formatPHP, formatManilaDateTime, exportToCSV, getTodayManila } from '../lib/utils';
import {
  Boxes,
  AlertTriangle,
  Download,
  Search,
  Edit2,
  Check,
  X,
  PackageCheck,
  Plus,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { inventory, updateInventoryItem } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Edit stock modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newStockInput, setNewStockInput] = useState('');
  const [newThresholdInput, setNewThresholdInput] = useState('');
  const [newCostInput, setNewCostInput] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock delivery replenish');

  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = item.current_stock <= item.min_threshold;
    if (filterLowStockOnly && !isLow) return false;
    return matchesSearch;
  });

  const lowStockCount = inventory.filter((i) => i.current_stock <= i.min_threshold).length;
  const totalStockValue = inventory.reduce((sum, i) => sum + i.current_stock * i.unit_cost, 0);

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setNewStockInput(String(item.current_stock));
    setNewThresholdInput(String(item.min_threshold));
    setNewCostInput(String(item.unit_cost));
    setAdjustReason('Physical inventory audit count');
  };

  const handleSave = () => {
    if (!editingItem) return;
    const stock = parseFloat(newStockInput);
    const threshold = parseFloat(newThresholdInput);
    const cost = parseFloat(newCostInput);

    updateInventoryItem(
      editingItem.id,
      {
        current_stock: isNaN(stock) ? editingItem.current_stock : stock,
        min_threshold: isNaN(threshold) ? editingItem.min_threshold : threshold,
        unit_cost: isNaN(cost) ? editingItem.unit_cost : cost,
      },
      adjustReason
    );

    setEditingItem(null);
  };

  const handleExportCSV = () => {
    const today = getTodayManila();
    const csvData = filteredItems.map((i) => ({
      ItemName: i.item_name,
      Unit: i.unit,
      CurrentStock: i.current_stock,
      MinThreshold: i.min_threshold,
      UnitCostPHP: i.unit_cost,
      TotalStockValuePHP: (i.current_stock * i.unit_cost).toFixed(2),
      Status: i.current_stock <= i.min_threshold ? 'LOW_STOCK_ALERT' : 'NORMAL',
      LastUpdated: formatManilaDateTime(i.updated_at),
      UpdatedBy: i.updated_by_name,
    }));
    exportToCSV(`Scootera_Inventory_Report_${today}`, csvData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Inventory & Raw Materials Stock
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Monitor coffee beans, milk, cups, and syrups. Edits are recorded in the system audit log.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#4A3B32] font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4 text-[#B45309]" />
          Export Inventory CSV
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Total Tracked SKUs</span>
          <p className="text-xl font-bold font-mono text-[#2C1810] mt-1 tabular-nums">
            {inventory.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Low Stock Alerts</span>
          <p
            className={`text-xl font-bold font-mono mt-1 tabular-nums ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-700'
            }`}
          >
            {lowStockCount} {lowStockCount > 0 ? 'items need replenishment' : 'all nominal'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E6DFD5] shadow-2xs">
          <span className="text-xs font-semibold text-[#7A6B63]">Total Inventory Valuation</span>
          <p className="text-xl font-bold font-mono text-[#B45309] mt-1 tabular-nums">
            {formatPHP(totalStockValue)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              filterLowStockOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#F5EFE6] text-[#4A3B32] hover:bg-[#EFE9DF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Show Low Stock Only ({lowStockCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw material or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none min-h-[40px]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                <th className="px-5 py-3.5">Raw Material / Item</th>
                <th className="px-5 py-3.5">Unit</th>
                <th className="px-5 py-3.5 text-right">Current Stock</th>
                <th className="px-5 py-3.5 text-right">Min Threshold</th>
                <th className="px-5 py-3.5 text-right">Unit Cost (₱)</th>
                <th className="px-5 py-3.5 text-right">Stock Value</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE5]">
              {filteredItems.map((item) => {
                const isLow = item.current_stock <= item.min_threshold;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#2C1810]">
                      {item.item_name}
                    </td>
                    <td className="px-5 py-3.5 text-[#7A6B63] font-mono">
                      {item.unit}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#2C1810] tabular-nums">
                      {item.current_stock.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#7A6B63] tabular-nums">
                      {item.min_threshold.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#2C1810] tabular-nums">
                      {formatPHP(item.unit_cost)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-[#B45309] tabular-nums">
                      {formatPHP(item.current_stock * item.unit_cost)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          <PackageCheck className="w-3 h-3" />
                          Nominal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] font-semibold text-xs cursor-pointer min-h-[34px]"
                      >
                        <Edit2 className="w-3 h-3 text-[#B45309]" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[#2C1810]">
                  Adjust Stock: {editingItem.item_name}
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  All changes are timestamped and recorded in the audit log.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Current Stock ({editingItem.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-sm font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newThresholdInput}
                    onChange={(e) => setNewThresholdInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-sm font-mono text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Unit Cost (PHP ₱)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={newCostInput}
                    onChange={(e) => setNewCostInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-sm font-mono text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Reason for Adjustment (Audit Log Required)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Weekly physical count audit, Supplier delivery..."
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
              >
                <Check className="w-4 h-4 text-[#D97706]" />
                Save Stock Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
