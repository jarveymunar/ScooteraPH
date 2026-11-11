import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Order } from '../types';

export const MANILA_TIMEZONE = 'Asia/Manila';

/**
 * Format numeric value to Philippine Peso (₱) with tabular figures
 */
export function formatPHP(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '₱0.00';
  }
  return '₱' + Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Get current date in Asia/Manila timezone as YYYY-MM-DD
 */
export function getTodayManila(): string {
  const now = new Date();
  const zoned = toZonedTime(now, MANILA_TIMEZONE);
  return format(zoned, 'yyyy-MM-dd');
}

/**
 * Format timestamp into Asia/Manila readable string
 */
export function formatManilaDateTime(isoString: string | Date | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    const zoned = toZonedTime(date, MANILA_TIMEZONE);
    return format(zoned, 'MMM dd, yyyy · hh:mm a');
  } catch {
    return String(isoString);
  }
}

/**
 * Format timestamp into Asia/Manila time only
 */
export function formatManilaTimeOnly(isoString: string | Date | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : isoString;
    const zoned = toZonedTime(date, MANILA_TIMEZONE);
    return format(zoned, 'hh:mm:ss a');
  } catch {
    return String(isoString);
  }
}

/**
 * Format YYYY-MM-DD into human-readable date
 */
export function formatManilaDateOnly(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    const zoned = toZonedTime(date, MANILA_TIMEZONE);
    return format(zoned, 'MMMM dd, yyyy');
  } catch {
    return String(dateString);
  }
}

/**
 * Export data array to CSV using Papaparse
 */
export function exportToCSV<T extends Record<string, unknown>>(filename: string, data: T[], fields?: (keyof T)[]): void {
  const csv = fields && fields.length > 0
    ? Papa.unparse({ fields: fields as string[], data })
    : Papa.unparse(data);

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and trigger download for an Employee Payslip PDF
 */
export function generatePayslipPDF(params: {
  employeeName: string;
  role: string;
  period: string;
  hourlyRate: number;
  totalHours: number;
  grossPay: number;
  shifts: Array<{
    date: string;
    timeIn: string;
    timeOut: string;
    hours: number;
  }>;
}): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  let y = 50;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(44, 24, 16);
  doc.text('SCOOTERA CAFÉ', margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(115, 115, 115);
  y += 18;
  doc.text('Official Payroll Ledger · Proof of Pay', margin, y);
  y += 14;
  doc.text('Timezone: Asia/Manila (GMT+8) · Currency: Philippine Peso (PHP)', margin, y);

  // Divider
  y += 15;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(2);
  doc.line(margin, y, 555, y);

  // Employee & Period Summary Box
  y += 25;
  doc.setFillColor(250, 247, 242);
  doc.rect(margin, y, 515, 75, 'F');
  doc.setDrawColor(230, 223, 213);
  doc.setLineWidth(1);
  doc.rect(margin, y, 515, 75, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(44, 24, 16);
  doc.text(`Employee: ${params.employeeName}`, margin + 15, y + 24);
  doc.text(`Pay Period: ${params.period}`, margin + 280, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Role: ${params.role.toUpperCase()}`, margin + 15, y + 44);
  doc.text(`Hourly Rate: PHP ${params.hourlyRate.toFixed(2)} / hr`, margin + 280, y + 44);

  doc.text(`Generated: ${formatManilaDateTime(new Date())}`, margin + 15, y + 62);
  doc.text(`Status: Verified & Processed`, margin + 280, y + 62);

  // Shifts Table Header
  y += 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(44, 24, 16);
  doc.text('Date', margin + 10, y);
  doc.text('Time In (GMT+8)', margin + 120, y);
  doc.text('Time Out (GMT+8)', margin + 250, y);
  doc.text('Hours', margin + 390, y);
  doc.text('Subtotal Pay', margin + 450, y);

  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 555, y);

  // Shifts Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  if (params.shifts.length === 0) {
    y += 20;
    doc.text('No shift records found for this period.', margin + 10, y);
  } else {
    for (const shift of params.shifts) {
      y += 20;
      doc.text(shift.date, margin + 10, y);
      doc.text(shift.timeIn, margin + 120, y);
      doc.text(shift.timeOut || 'Active / Open', margin + 250, y);
      doc.text(`${shift.hours.toFixed(2)} hrs`, margin + 390, y);
      doc.text(`PHP ${(shift.hours * params.hourlyRate).toFixed(2)}`, margin + 450, y);

      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    }
  }

  // Summary Totals
  y += 30;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.5);
  doc.line(margin, y, 555, y);

  y += 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(44, 24, 16);
  doc.text('Total Hours Worked:', margin + 280, y);
  doc.text(`${params.totalHours.toFixed(2)} hrs`, margin + 450, y);

  y += 20;
  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9);
  doc.text('Gross Pay Due:', margin + 280, y);
  doc.text(`PHP ${params.grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 450, y);

  // Signatures
  y += 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.line(margin + 20, y, margin + 180, y);
  doc.text('Employee Signature', margin + 45, y + 14);

  doc.line(margin + 330, y, margin + 490, y);
  doc.text('Authorized Signature (Owner/Admin)', margin + 335, y + 14);

  doc.save(`Payslip_${params.employeeName.replace(/\s+/g, '_')}_${params.period.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Generate Consolidated Financial & Sales Report PDF (Daily, Weekly, Monthly, Annual)
 */
export function generateConsolidatedReportPDF(params: {
  periodType: 'Daily' | 'Weekly' | 'Monthly' | 'Annual';
  dateRange: string;
  totalSales: number;
  totalOrders: number;
  averageOrder: number;
  totalExpenses: number;
  netProfit: number;
  topItems: Array<{ name: string; category: string; quantity: number; revenue: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = 50;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(44, 24, 16);
  doc.text('SCOOTERA CAFÉ', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(115, 115, 115);
  y += 18;
  doc.text(`Consolidated Business Report · ${params.periodType.toUpperCase()} FINANCIAL SUMMARY`, margin, y);
  y += 14;
  doc.text(`Period: ${params.dateRange} · Generated on ${formatManilaDateTime(new Date())}`, margin, y);

  // Amber rule
  y += 15;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(2);
  doc.line(margin, y, 555, y);

  // Financial KPI Cards Grid
  y += 25;
  const cardWidth = 160;
  const cardHeight = 60;
  const cards = [
    { title: 'Gross Sales', value: formatPHP(params.totalSales), sub: `${params.totalOrders} total orders` },
    { title: 'Operating Expenses', value: formatPHP(params.totalExpenses), sub: 'Non-voided expenses' },
    { title: 'Net Profit', value: formatPHP(params.netProfit), sub: params.netProfit >= 0 ? 'Profitable' : 'Deficit' },
  ];

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 15);
    doc.setFillColor(250, 247, 242);
    doc.rect(x, y, cardWidth, cardHeight, 'F');
    doc.setDrawColor(230, 223, 213);
    doc.rect(x, y, cardWidth, cardHeight, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(card.title, x + 10, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(44, 24, 16);
    doc.text(card.value, x + 10, y + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(card.sub, x + 10, y + 50);
  });

  // Section 1: Most-Bought Menu Items
  y += 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(44, 24, 16);
  doc.text('Most-Bought Menu Items', margin, y);

  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 555, y);

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Item Name', margin + 10, y);
  doc.text('Details', margin + 200, y);
  doc.text('Quantity Sold', margin + 340, y);
  doc.text('Total Revenue', margin + 450, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  params.topItems.slice(0, 6).forEach((item) => {
    y += 18;
    doc.text(item.name, margin + 10, y);
    doc.text(item.category, margin + 200, y);
    doc.text(String(item.quantity), margin + 340, y);
    doc.text(formatPHP(item.revenue), margin + 450, y);
  });

  // Section 2: Expenses by Category
  y += 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(44, 24, 16);
  doc.text('Expenses Breakdown by Category', margin, y);

  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 555, y);

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Category', margin + 10, y);
  doc.text('Amount (PHP)', margin + 280, y);
  doc.text('Share of Expenses', margin + 420, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  params.expensesByCategory.forEach((exp) => {
    y += 18;
    doc.text(exp.category, margin + 10, y);
    doc.text(formatPHP(exp.amount), margin + 280, y);
    doc.text(`${exp.percentage.toFixed(1)}%`, margin + 420, y);
  });

  // Footer notes
  y += 40;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('* Payroll is included as calculated from employee time attendance x hourly rate.', margin, y);
  y += 12;
  doc.text('This is an official document generated by Scootera Café POS & Management.', margin, y);

  doc.save(`Scootera_${params.periodType}_Report_${params.dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Generate Receipt Records Register PDF (All filtered receipts)
 */
export function generateReceiptsRegisterPDF(params: {
  period: string;
  totalOrders: number;
  totalSales: number;
  orders: Order[];
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  let y = 50;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(44, 24, 16);
  doc.text('SCOOTERA CAFÉ', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(115, 115, 115);
  y += 16;
  doc.text('Official Sales Receipt Register & Audit Report', margin, y);
  y += 14;
  doc.text(`Period: ${params.period} · Total Receipts: ${params.totalOrders} · Total Collected: ${formatPHP(params.totalSales)}`, margin, y);

  y += 12;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.5);
  doc.line(margin, y, 555, y);

  // Table Header
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(44, 24, 16);
  doc.text('Order No.', margin + 5, y);
  doc.text('Date & Time', margin + 85, y);
  doc.text('Items Summary', margin + 200, y);
  doc.text('Cashier', margin + 375, y);
  doc.text('Method', margin + 445, y);
  doc.text('Amount', margin + 490, y);

  y += 8;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 555, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  params.orders.forEach((ord) => {
    y += 16;
    const itemsText = ord.items
      .map((i) => {
        const addons = i.selected_addons && i.selected_addons.length > 0
          ? ` (+${i.selected_addons.map((a) => a.name).join(', ')})`
          : '';
        return `${i.quantity}x ${i.item_name}${addons}`;
      })
      .join('; ');

    doc.text(ord.order_number, margin + 5, y);
    doc.text(formatManilaDateTime(ord.created_at).slice(0, 18), margin + 85, y);
    
    // Truncate itemsText if too long
    const truncatedItems = itemsText.length > 34 ? itemsText.slice(0, 31) + '...' : itemsText;
    doc.text(truncatedItems, margin + 200, y);
    
    doc.text(ord.cashier_name.slice(0, 14), margin + 375, y);
    doc.text(ord.payment_method.toUpperCase(), margin + 445, y);
    doc.text(formatPHP(ord.total_amount), margin + 490, y);

    if (y > 760) {
      doc.addPage();
      y = 50;
    }
  });

  // Footer summary
  y += 25;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1);
  doc.line(margin, y, 555, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(44, 24, 16);
  doc.text(`TOTAL COLLECTED (${params.totalOrders} ORDERS):`, margin + 270, y);
  doc.text(formatPHP(params.totalSales), margin + 480, y);

  doc.save(`Scootera_Receipt_Records_${params.period.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
