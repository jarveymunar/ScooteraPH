import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, MenuAddOn, Category } from '../types';
import { formatPHP } from '../lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Coffee,
  Sparkles,
  FolderPlus,
  Tag,
} from 'lucide-react';

export const MenuManagementView: React.FC = () => {
  const {
    menuItems,
    menuAddOns,
    categories,
    saveMenuItem,
    deleteMenuItem,
    addCategory,
    deleteCategory,
    saveMenuAddOn,
    deleteMenuAddOn,
  } = useApp();

  // Top Section: 'items' or 'addons'
  const [activeSection, setActiveSection] = useState<'items' | 'addons'>('items');

  // Selected Category filter for items
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'cat-1');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Partial<MenuAddOn> | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'item' | 'category' | 'addon'; id: string; name: string } | null>(null);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];
  const filteredItems = menuItems.filter(
    (item) => item.category_id === activeCategoryId || item.category_name === activeCategory?.name
  );

  // --- Category Handlers ---
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  // --- Menu Item Handlers ---
  const handleOpenAddItem = () => {
    setEditingItem({
      category_id: activeCategory ? activeCategory.id : 'cat-1',
      category_name: activeCategory ? activeCategory.name : 'Coffee',
      name: '',
      description: '',
      price: 120.00,
      image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
      is_available: true,
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.name?.trim()) return;
    saveMenuItem(editingItem);
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  // --- Add-on Handlers ---
  const handleOpenAddAddon = () => {
    setEditingAddon({
      name: '',
      price: 30.00,
      is_available: true,
    });
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (addon: MenuAddOn) => {
    setEditingAddon({ ...addon });
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = () => {
    if (!editingAddon || !editingAddon.name?.trim()) return;
    saveMenuAddOn(editingAddon);
    setIsAddonModalOpen(false);
    setEditingAddon(null);
  };

  // Confirm delete
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'item') {
      deleteMenuItem(deleteConfirm.id);
    } else if (deleteConfirm.type === 'category') {
      deleteCategory(deleteConfirm.id);
      if (activeCategoryId === deleteConfirm.id && categories.length > 1) {
        setActiveCategoryId(categories[0].id);
      }
    } else if (deleteConfirm.type === 'addon') {
      deleteMenuAddOn(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#B45309]" />
            <h1 className="text-lg font-bold text-[#2C1810]">
              Menu, Categories & Add-ons Management
            </h1>
          </div>
          <p className="text-xs text-[#7A6B63] mt-0.5">
            Create custom menu categories, configure drinks & food items, and set add-on prices (oat milk, extra shot, syrups).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#4A3B32] font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <FolderPlus className="w-4 h-4 text-[#B45309]" />
            Add Category
          </button>

          {activeSection === 'items' ? (
            <button
              onClick={handleOpenAddItem}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs tracking-wide shadow-sm cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              Add Menu Item
            </button>
          ) : (
            <button
              onClick={handleOpenAddAddon}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs tracking-wide shadow-sm cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              Add Add-on / Modifier
            </button>
          )}
        </div>
      </div>

      {/* Main Switcher: Menu Items vs Add-ons */}
      <div className="flex items-center gap-2 p-1.5 bg-[#F5EFE6] rounded-2xl max-w-md">
        <button
          onClick={() => setActiveSection('items')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
            activeSection === 'items'
              ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
              : 'text-[#6B5A50] hover:text-[#2C1810]'
          }`}
        >
          <Coffee className="w-4 h-4 text-[#D97706]" />
          Menu Items & Dishes ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveSection('addons')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] ${
            activeSection === 'addons'
              ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
              : 'text-[#6B5A50] hover:text-[#2C1810]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#D97706]" />
          Drink Add-ons & Modifiers ({menuAddOns.length})
        </button>
      </div>

      {/* SECTION 1: MENU ITEMS */}
      {activeSection === 'items' && (
        <div className="space-y-4">
          {/* Dynamic Categories Tab Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center shrink-0">
                <button
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                    activeCategoryId === cat.id
                      ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
                      : 'bg-white border border-[#E6DFD5] text-[#6B5A50] hover:text-[#2C1810]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
                {/* Allow deleting category if custom */}
                {!['Coffee', 'Non-Coffee'].includes(cat.name) && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'category', id: cat.id, name: cat.name })}
                    className="p-1 text-neutral-400 hover:text-rose-600 -ml-2 mr-1 cursor-pointer"
                    title="Delete Category"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Menu Items Table */}
          <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                    <th className="px-5 py-3.5">Item Preview</th>
                    <th className="px-5 py-3.5">Item Name & Description</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5 text-right">Selling Price (₱)</th>
                    <th className="px-5 py-3.5 text-center">Availability</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE5]">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E6DFD5]">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-sm">
                        <h4 className="font-bold text-sm text-[#2C1810] leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-[#7A6B63] mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[#4A3B32] font-medium">
                        {item.category_name}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#B45309] tabular-nums">
                        {formatPHP(item.price)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() =>
                            saveMenuItem({ id: item.id, is_available: !item.is_available })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            item.is_available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {item.is_available ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] cursor-pointer"
                            title="Edit Item & Price"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#B45309]" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'item', id: item.id, name: item.name })}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ADD-ONS & MODIFIERS MANAGEMENT */}
      {activeSection === 'addons' && (
        <div className="bg-white rounded-2xl border border-[#E6DFD5] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#E6DFD5] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-[#2C1810]">
                Add-on Pricing & Options
              </h3>
              <p className="text-xs text-[#7A6B63]">
                Manage milk substitutions, extra shots, syrups, and drizzles. Price changes apply immediately to the POS.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E6DFD5] text-[#4A3B32] font-bold">
                  <th className="px-5 py-3.5">Add-on / Modifier</th>
                  <th className="px-5 py-3.5 text-right">Price (₱)</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE5]">
                {menuAddOns.map((addon) => (
                  <tr key={addon.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#2C1810]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{addon.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-sm text-[#B45309] tabular-nums">
                      +{formatPHP(addon.price)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() =>
                          saveMenuAddOn({ id: addon.id, is_available: !addon.is_available })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          addon.is_available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {addon.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditAddon(addon)}
                          className="p-1.5 rounded-lg border border-[#D5C9BC] hover:bg-[#FAF7F2] text-[#2C1810] cursor-pointer"
                          title="Edit Price"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#B45309]" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'addon', id: addon.id, name: addon.name })}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Delete Add-on"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD5] space-y-4">
            <div className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-[#B45309]" />
              <h3 className="font-bold text-base text-[#2C1810]">
                Add Menu Category
              </h3>
            </div>
            <p className="text-xs text-[#7A6B63]">
              Create a custom section in your POS menu (e.g., Pastries & Bakery, Breakfast, Merch).
            </p>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pastries & Bakery"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT MENU ITEM */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <h3 className="font-bold text-base text-[#2C1810]">
                {editingItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={editingItem.name || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Spanish Latte"
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingItem.category_id || categories[0]?.id}
                    onChange={(e) => {
                      const selCat = categories.find((c) => c.id === e.target.value);
                      setEditingItem((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                        category_name: selCat ? selCat.name : 'Coffee',
                      }));
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-3 py-2.5 text-sm text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A3B32] mb-1">
                    Selling Price (PHP ₱) *
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={editingItem.price ?? ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Ingredients, roast profile, tasting notes..."
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editingItem.image_url || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-xs text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#4A3B32]">
                  <input
                    type="checkbox"
                    checked={editingItem.is_available ?? true}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        is_available: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-[#D97706] focus:ring-[#D97706]"
                  />
                  <span>Mark as Available for Order Entry</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={!editingItem.name?.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 min-h-[40px]"
              >
                <Check className="w-4 h-4 text-[#D97706]" />
                Save Menu Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT ADD-ON */}
      {isAddonModalOpen && editingAddon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD5] space-y-4">
            <h3 className="font-bold text-base text-[#2C1810]">
              {editingAddon.id ? 'Edit Add-on Price' : 'New Add-on / Modifier'}
            </h3>
            <p className="text-xs text-[#7A6B63]">
              Configure custom add-ons such as oat milk, syrups, espresso shots, or toppings.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Add-on Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oat Milk Barista Blend"
                  value={editingAddon.name || ''}
                  onChange={(e) =>
                    setEditingAddon((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-sm text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3B32] mb-1">
                  Additional Price (PHP ₱) *
                </label>
                <input
                  type="number"
                  step="5"
                  required
                  value={editingAddon.price ?? ''}
                  onChange={(e) =>
                    setEditingAddon((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl px-4 py-2 text-sm font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddonModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddon}
                disabled={!editingAddon.name?.trim()}
                className="px-5 py-2 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                Save Add-on
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DFD5] space-y-4">
            <h3 className="font-bold text-base text-[#2C1810]">
              Delete {deleteConfirm.type.toUpperCase()}?
            </h3>
            <p className="text-xs text-[#7A6B63]">
              Are you sure you want to remove <span className="font-bold text-[#2C1810]">"{deleteConfirm.name}"</span>? This will be logged in the system audit trail.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C9BC] text-xs font-semibold text-[#4A3B32] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
