import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, MenuAddOn, SelectedAddOn, PaymentMethod } from '../types';
import { formatPHP } from '../lib/utils';
import {
  Coffee,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Check,
  Search,
  ShoppingBag,
  Sparkles,
  Layers,
} from 'lucide-react';

export const POSOrderEntry: React.FC = () => {
  const { menuItems, menuAddOns, categories, createOrder } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || 'cat-1'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state: line items with selected add-ons
  const [cartItems, setCartItems] = useState<
    Array<{
      menuItem: MenuItem;
      quantity: number;
      selectedAddOns: SelectedAddOn[];
    }>
  >([]);

  // Item customization modal (for add-ons)
  const [customizingItem, setCustomizingItem] = useState<{
    menuItem: MenuItem;
    selectedAddOns: SelectedAddOn[];
  } | null>(null);

  // Payment checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTenderedInput, setAmountTenderedInput] = useState<string>('');

  // Active category
  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = item.category_id === selectedCategoryId || item.category_name === activeCategory?.name;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.is_available;
  });

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => {
    const addonsTotal = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
    return sum + (item.menuItem.price + addonsTotal) * item.quantity;
  }, 0);

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Directly add item with optional customization
  const handleQuickAdd = (item: MenuItem) => {
    setCartItems((prev) => {
      // Check if exact same item with no add-ons already exists
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItem.id === item.id && ci.selectedAddOns.length === 0
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { menuItem: item, quantity: 1, selectedAddOns: [] }];
    });
  };

  // Open Add-on customizer
  const handleOpenCustomize = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setCustomizingItem({
      menuItem: item,
      selectedAddOns: [],
    });
  };

  const toggleCustomizerAddon = (addon: MenuAddOn) => {
    if (!customizingItem) return;
    setCustomizingItem((prev) => {
      if (!prev) return null;
      const exists = prev.selectedAddOns.some((a) => a.id === addon.id);
      const updatedAddons = exists
        ? prev.selectedAddOns.filter((a) => a.id !== addon.id)
        : [...prev.selectedAddOns, { id: addon.id, name: addon.name, price: addon.price }];
      return { ...prev, selectedAddOns: updatedAddons };
    });
  };

  const handleConfirmCustomizedAdd = () => {
    if (!customizingItem) return;
    setCartItems((prev) => [
      ...prev,
      {
        menuItem: customizingItem.menuItem,
        quantity: 1,
        selectedAddOns: customizingItem.selectedAddOns,
      },
    ]);
    setCustomizingItem(null);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Payment handling
  const tenderedAmount = parseFloat(amountTenderedInput) || subtotal;
  const changeDue = Math.max(0, tenderedAmount - subtotal);

  const handleCompleteOrder = () => {
    if (cartItems.length === 0) return;
    createOrder({
      items: cartItems.map((ci) => ({
        menuItem: ci.menuItem,
        quantity: ci.quantity,
        selectedAddOns: ci.selectedAddOns,
      })),
      paymentMethod,
      amountTendered: paymentMethod === 'cash' ? tenderedAmount : subtotal,
    });
    setCartItems([]);
    setIsCheckoutOpen(false);
    setAmountTenderedInput('');
  };

  const setQuickCash = (amount: number) => {
    setAmountTenderedInput(String(amount));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Categories, Search & Menu Grid (Cols 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Tabs & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DFD5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Dynamic Categories Tab Bar */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto w-full sm:w-auto scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer min-h-[40px] ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#2C1810] text-[#FAF7F2] shadow-sm'
                      : 'text-[#6B5A50] hover:text-[#2C1810]'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#8C7A70] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E6DFD5] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-[#2C1810] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#D97706] min-h-[40px]"
              />
            </div>
          </div>

          {/* Quick Add-ons Strip */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E6DFD5] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A6B63] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                Available Add-ons & Modifiers (Configured in Menu)
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {menuAddOns.filter((a) => a.is_available).map((addon) => (
                <div
                  key={addon.id}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DCCB] text-xs font-semibold text-[#2C1810] shrink-0 whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>{addon.name}</span>
                  <span className="font-mono text-[#B45309] font-bold">+{formatPHP(addon.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                className="group flex flex-col bg-white border border-[#E6DFD5] hover:border-[#D97706] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all text-left cursor-pointer p-3 select-none"
              >
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-[#FAF7F2] mb-3">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-mono font-bold text-xs tabular-nums">
                    {formatPHP(item.price)}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#2C1810] group-hover:text-[#B45309] transition-colors leading-tight line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-[#7A6B63] line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-[#8C7A70] font-medium pt-2 border-t border-[#F2ECE4]">
                    <button
                      type="button"
                      onClick={(e) => handleOpenCustomize(e, item)}
                      className="text-[11px] font-bold text-[#B45309] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Add-ons
                    </button>
                    <span className="text-[#2C1810] font-bold group-hover:translate-x-0.5 transition-transform">
                      + Add
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="bg-white border border-[#E6DFD5] rounded-2xl p-12 text-center">
              <Coffee className="w-10 h-10 text-[#C8BAAA] mx-auto mb-3" />
              <h3 className="font-bold text-[#2C1810] text-sm">No items found</h3>
              <p className="text-xs text-[#7A6B63] mt-1">
                No items match the selected category or search keyword.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Order Ticket / Cart (Cols 4) */}
        <div className="lg:col-span-4 bg-white border border-[#E6DFD5] rounded-2xl shadow-xs overflow-hidden sticky top-28">
          {/* Cart Header */}
          <div className="bg-[#FAF7F2] px-5 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B45309]" />
              <h2 className="font-bold text-sm text-[#2C1810]">
                Current Order
              </h2>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-4 max-h-[380px] overflow-y-auto space-y-3">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-[#8C7A70]">
                <Coffee className="w-8 h-8 mx-auto mb-2 text-[#D5C9BC]" />
                <p className="text-xs font-medium">Order ticket is empty</p>
                <p className="text-[11px] text-[#A39287] mt-0.5">
                  Tap any item on the left to add to order.
                </p>
              </div>
            ) : (
              cartItems.map((item, index) => {
                const addonsCost = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
                const unitTotal = item.menuItem.price + addonsCost;
                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D9] space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <span className="font-bold text-xs text-[#2C1810] block">
                          {item.menuItem.name}
                        </span>
                        {item.selectedAddOns.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.selectedAddOns.map((addon) => (
                              <div
                                key={addon.id}
                                className="text-[10px] text-[#B45309] font-medium flex items-center gap-1"
                              >
                                <span>+ {addon.name}</span>
                                <span className="font-mono">({formatPHP(addon.price)})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-[11px] text-[#7A6B63] font-mono tabular-nums block mt-1">
                          {formatPHP(unitTotal)} each
                        </span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#D5C9BC] flex items-center justify-center text-[#2C1810] hover:bg-[#EFEAE2] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#D5C9BC] flex items-center justify-center text-[#2C1810] hover:bg-[#EFEAE2] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary & Checkout Button */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] space-y-3">
              <div className="space-y-1.5 text-xs text-[#7A6B63]">
                <div className="flex justify-between">
                  <span>Items Count:</span>
                  <span className="font-bold font-mono tabular-nums">{totalItemCount} items</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (12% Included):</span>
                  <span className="font-mono tabular-nums">{formatPHP(subtotal - subtotal / 1.12)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#2C1810] pt-2 border-t border-[#E6DFD5]">
                  <span>Total Amount:</span>
                  <span className="font-mono tabular-nums text-base text-[#B45309]">
                    {formatPHP(subtotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setAmountTenderedInput(String(subtotal));
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <span>Charge Order</span>
                <span className="font-mono tabular-nums">({formatPHP(subtotal)})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CUSTOMIZE ADD-ONS */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#2C1810]">
                  Customize: {customizingItem.menuItem.name}
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  Select add-ons and modifiers (prices saved in Menu Management).
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider">
                Select Add-ons
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {menuAddOns.filter((a) => a.is_available).map((addon) => {
                  const isSelected = customizingItem.selectedAddOns.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleCustomizerAddon(addon)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FAF3EA] border-[#D97706] text-[#2C1810] font-bold'
                          : 'bg-[#FAF7F2] border-[#E6DFD5] text-[#4A3B32] hover:bg-[#F3EFE9]'
                      }`}
                    >
                      <span className="truncate pr-1">{addon.name}</span>
                      <span className="font-mono text-[#B45309] shrink-0">+{formatPHP(addon.price)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Total preview with add-ons */}
              <div className="pt-3 border-t border-[#E6DFD5] flex justify-between items-center text-xs">
                <span className="font-semibold text-[#7A6B63]">Total with Add-ons:</span>
                <span className="font-mono font-bold text-base text-[#B45309] tabular-nums">
                  {formatPHP(
                    customizingItem.menuItem.price +
                      customizingItem.selectedAddOns.reduce((acc, a) => acc + a.price, 0)
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-[#D5C9BC] font-semibold text-xs text-[#4A3B32] hover:bg-white cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomizedAdd}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] font-bold text-xs shadow-sm cursor-pointer min-h-[40px]"
              >
                <Check className="w-4 h-4 text-[#D97706]" />
                Add to Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden">
            <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[#2C1810]">
                  Payment & Checkout
                </h3>
                <p className="text-xs text-[#7A6B63]">
                  Total Due: <span className="font-bold font-mono text-[#B45309]">{formatPHP(subtotal)}</span>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-xs font-bold text-[#8C7A70] hover:text-[#2C1810] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'gcash', label: 'GCash', icon: Smartphone },
                    { id: 'card', label: 'Card / POS', icon: CreditCard },
                    { id: 'bank_transfer', label: 'Bank', icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[50px] ${
                          isSelected
                            ? 'bg-[#2C1810] text-[#FAF7F2] border-[#2C1810] shadow-sm'
                            : 'bg-[#FAF7F2] text-[#4A3B32] border-[#E6DFD5] hover:bg-[#F3EFE9]'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DFD5]">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A3B32] mb-1">
                      Amount Tendered (₱):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={amountTenderedInput}
                      onChange={(e) => setAmountTenderedInput(e.target.value)}
                      className="w-full bg-white border border-[#D5C9BC] rounded-xl px-4 py-2.5 text-base font-mono font-bold text-[#2C1810] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setQuickCash(subtotal)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#D5C9BC] text-xs font-bold text-[#4A3B32] hover:bg-[#F0EAE1] cursor-pointer"
                    >
                      Exact (₱{subtotal})
                    </button>
                    {[200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickCash(amt)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#D5C9BC] text-xs font-bold text-[#4A3B32] hover:bg-[#F0EAE1] cursor-pointer"
                      >
                        ₱{amt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#E6DFD5]">
                    <span className="text-xs font-bold text-[#4A3B32]">
                      Change Due:
                    </span>
                    <span
                      className={`text-lg font-mono font-extrabold tabular-nums ${
                        changeDue >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatPHP(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod !== 'cash' && (
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E6DFD5] text-xs text-[#7A6B63]">
                  <p className="font-semibold text-[#2C1810]">Digital Payment Confirmation</p>
                  <p className="mt-1">
                    Please verify the transaction on the GCash or payment card terminal before completing.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#E6DFD5] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D5C9BC] text-xs font-bold text-[#4A3B32] hover:bg-white cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={paymentMethod === 'cash' && tenderedAmount < subtotal}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2C1810] text-[#FAF7F2] hover:bg-[#1A0E0A] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs tracking-wide shadow-sm cursor-pointer min-h-[44px]"
              >
                <Check className="w-4 h-4 text-[#D97706]" />
                Complete & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
