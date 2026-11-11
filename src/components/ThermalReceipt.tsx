import React from 'react';
import { Order } from '../types';
import { formatPHP, formatManilaDateTime } from '../lib/utils';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ThermalReceiptProps {
  order: Order;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const vatableSales = Number((order.total_amount / 1.12).toFixed(2));
  const vatAmount = Number((order.total_amount - vatableSales).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E6DFD5] overflow-hidden my-8">
        {/* Action Header */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E6DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-[#2C1810] text-sm">
              Order Complete · Receipt Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8C7A70] hover:text-[#2C1810] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Paper Viewport */}
        <div className="p-6 bg-[#F4F1EA] flex justify-center">
          <div
            id="thermal-receipt-container"
            className="w-[80mm] min-h-[140mm] bg-white text-black p-5 shadow-md border border-[#E6DFD5] font-mono text-xs leading-tight"
          >
            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-400">
              <div className="w-14 h-14 mx-auto mb-1.5 rounded-full border border-neutral-300 p-0.5 overflow-hidden">
                <img
                  src="/assets/aistudio/image_5df9d1fb.png"
                  alt="Scootera Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="font-bold text-sm tracking-wider uppercase text-neutral-900">
                SCOOTERA CAFÉ
              </h1>
              <p className="text-[10px] text-neutral-600">
                Specialty Coffee & Beverages
              </p>
              <p className="text-[9px] text-neutral-500">
                Vespa Plaza, Bonifacio Global City, Taguig
              </p>
              <p className="text-[9px] text-neutral-500">
                VAT Reg. TIN: 009-842-192-000
              </p>
            </div>

            {/* Order Metadata */}
            <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-neutral-400">
              <div className="flex justify-between">
                <span className="font-bold">Order No:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{formatManilaDateTime(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Terminal:</span>
                <span>Web POS Terminal 01</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-2">
              <div className="flex justify-between font-bold text-[10px] border-b border-neutral-300 pb-1">
                <span>ITEM</span>
                <span>AMOUNT</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="text-[10px] space-y-0.5">
                  <div className="flex justify-between font-semibold">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.item_name}
                    </span>
                    <span className="tabular-nums font-mono">{formatPHP(item.subtotal)}</span>
                  </div>
                  {item.selected_addons && item.selected_addons.length > 0 && (
                    <div className="text-[9px] text-neutral-600 pl-4 space-y-0.5">
                      {item.selected_addons.map((a) => (
                        <div key={a.id} className="flex justify-between">
                          <span>+ {a.name}</span>
                          <span>{formatPHP(a.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums font-mono">{formatPHP(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-600">
                <span>Vatable Sales:</span>
                <span className="tabular-nums font-mono">{formatPHP(vatableSales)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-600">
                <span>VAT (12%):</span>
                <span className="tabular-nums font-mono">{formatPHP(vatAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-neutral-300 text-neutral-900">
                <span>TOTAL DUE:</span>
                <span className="tabular-nums font-mono text-sm">{formatPHP(order.total_amount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-neutral-400">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="uppercase font-semibold">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span className="tabular-nums font-mono">{formatPHP(order.amount_tendered || order.total_amount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change Due:</span>
                <span className="tabular-nums font-mono">{formatPHP(order.change_due || 0)}</span>
              </div>
            </div>

            {/* Thermal Barcode / QR Simulation */}
            <div className="pt-3 text-center space-y-1.5">
              <div className="h-8 w-40 mx-auto flex items-center justify-between px-1 bg-neutral-100 border border-neutral-300">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${
                      i % 3 === 0 ? 'w-1 bg-neutral-900' : i % 2 === 0 ? 'w-0.5 bg-neutral-800' : 'w-0.5 bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[8px] tracking-widest text-neutral-500 uppercase">
                *{order.order_number}*
              </p>
              <p className="text-[10px] font-semibold text-neutral-800 mt-2">
                Thank you! Enjoy your coffee!
              </p>
              <p className="text-[8px] text-neutral-500">
                Follow us @scooteracafe · Free Wi-Fi: Scootera_Guest
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-white border-t border-[#E6DFD5] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D5C9BC] text-[#4A3B32] hover:bg-[#FAF7F2] font-semibold text-xs cursor-pointer min-h-[44px]"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2C1810] text-white hover:bg-[#1D0F0A] font-semibold text-xs cursor-pointer shadow-sm min-h-[44px]"
          >
            <Printer className="w-4 h-4 text-[#D97706]" />
            Print Thermal Receipt (80mm)
          </button>
        </div>
      </div>
    </div>
  );
};
