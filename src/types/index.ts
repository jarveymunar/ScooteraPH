export type UserRole = 'staff' | 'admin' | 'owner';

export interface Profile {
  id: string;
  username: string;
  password?: string; // Login credentials
  full_name: string;
  role: UserRole;
  is_active: boolean;
  hourly_rate: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
}

export interface MenuAddOn {
  id: string;
  name: string;
  price: number; // in PHP ₱
  is_available: boolean;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  price: number; // in PHP ₱
  image_url: string;
  is_available: boolean;
  is_addon?: boolean;
  created_at: string;
}

export type PaymentMethod = 'cash' | 'gcash' | 'bank_transfer' | 'card' | 'other';

export interface SelectedAddOn {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  selected_addons?: SelectedAddOn[];
}

export interface Order {
  id: string;
  order_number: string; // e.g. 20261111-0001
  created_by: string;
  cashier_name: string;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_tendered: number;
  change_due: number;
  status: 'completed' | 'voided';
  order_date: string; // YYYY-MM-DD in Asia/Manila
  created_at: string;
  items: OrderItem[];
}

export interface TimeAttendance {
  id: string;
  user_id: string;
  user_name: string;
  work_date: string; // YYYY-MM-DD
  time_in: string; // ISO string
  time_out: string | null;
  total_hours: number | null;
  status: 'open' | 'completed';
}

export interface InventoryItem {
  id: string;
  item_name: string;
  unit: string;
  current_stock: number;
  min_threshold: number;
  unit_cost: number;
  updated_by_name: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_active: boolean;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringExpense {
  id: string;
  category_id: string;
  category_name: string;
  description: string;
  vendor: string;
  amount: number;
  payment_method: PaymentMethod;
  frequency: RecurringFrequency;
  day_of_week?: number;
  day_of_month?: number;
  start_date: string;
  end_date?: string | null;
  next_due_date: string;
  is_active: boolean;
  is_variable: boolean;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string; // YYYY-MM-DD
  category_id: string;
  category_name: string;
  description: string;
  vendor: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_no?: string;
  receipt_path?: string | null;
  notes?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  recurring_id?: string | null;
  is_estimate: boolean;
  is_voided: boolean;
  void_reason?: string | null;
  voided_by_name?: string | null;
  voided_at?: string | null;
}

export interface AuditLog {
  id: string;
  created_at: string;
  user_name: string;
  role: string;
  action: string;
  entity: string;
  record_id?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}
