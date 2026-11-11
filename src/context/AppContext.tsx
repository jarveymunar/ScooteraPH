import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Profile,
  Category,
  MenuItem,
  MenuAddOn,
  SelectedAddOn,
  Order,
  OrderItem,
  TimeAttendance,
  InventoryItem,
  ExpenseCategory,
  Expense,
  RecurringExpense,
  AuditLog,
  PaymentMethod,
  UserRole,
} from '../types';
import {
  INITIAL_PROFILES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ADDONS,
  INITIAL_MENU_ITEMS,
  INITIAL_INVENTORY,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_RECURRING_EXPENSES,
  INITIAL_EXPENSES,
  INITIAL_ORDERS,
  INITIAL_ATTENDANCE,
  INITIAL_AUDIT_LOGS,
} from '../lib/store';
import { getTodayManila, exportToCSV } from '../lib/utils';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';

interface AppContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  availableUsers: Profile[];
  categories: Category[];
  menuItems: MenuItem[];
  menuAddOns: MenuAddOn[];
  orders: Order[];
  attendance: TimeAttendance[];
  inventory: InventoryItem[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  auditLogs: AuditLog[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedReceipt: Order | null;
  setSelectedReceipt: (order: Order | null) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isSupabaseLive: boolean;
  
  // Business logic actions
  switchUserById: (userId: string) => void;
  createOrder: (data: {
    items: Array<{ menuItem: MenuItem; quantity: number; selectedAddOns?: SelectedAddOn[] }>;
    paymentMethod: PaymentMethod;
    amountTendered: number;
  }) => Order;
  timeInUser: () => { success: boolean; message: string };
  timeOutUser: () => { success: boolean; message: string };
  updateEmployeeHourlyRate: (userId: string, newRate: number) => void;
  saveMenuItem: (item: Partial<MenuItem>) => void;
  deleteMenuItem: (itemId: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (categoryId: string) => void;
  saveMenuAddOn: (addon: Partial<MenuAddOn>) => void;
  deleteMenuAddOn: (addonId: string) => void;
  updateInventoryItem: (id: string, updates: { current_stock?: number; min_threshold?: number; unit_cost?: number }, reason?: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_name' | 'is_voided'>) => void;
  voidExpense: (expenseId: string, reason: string) => void;
  saveRecurringTemplate: (template: Partial<RecurringExpense>) => void;
  toggleRecurringTemplateActive: (id: string) => void;
  triggerRecurringExpensesGeneration: () => number;
  addUserCredential: (profile: Omit<Profile, 'id' | 'created_at'>) => void;
  toggleUserActiveStatus: (userId: string) => void;
  exportDataCSV: (type: 'receipts' | 'attendance' | 'inventory' | 'expenses') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Persistent storage helper
const STORAGE_KEY_PREFIX = 'scootera_data_';
function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<Profile[]>(() => loadStored('users', INITIAL_PROFILES));
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('scootera_logged_in_user_id') : null;
    const found = savedUserId ? availableUsers.find((u) => u.id === savedUserId) : null;
    return found || availableUsers[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(localStorage.getItem('scootera_logged_in_user_id'));
  });

  const [categories, setCategories] = useState<Category[]>(() => loadStored('categories', INITIAL_CATEGORIES));
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => loadStored('menu_items', INITIAL_MENU_ITEMS));
  const [menuAddOns, setMenuAddOns] = useState<MenuAddOn[]>(() => loadStored('menu_addons', INITIAL_MENU_ADDONS));
  const [orders, setOrders] = useState<Order[]>(() => loadStored('orders', INITIAL_ORDERS));
  const [attendance, setAttendance] = useState<TimeAttendance[]>(() => loadStored('attendance', INITIAL_ATTENDANCE));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStored('inventory', INITIAL_INVENTORY));
  const [expenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXPENSE_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored('expenses', INITIAL_EXPENSES));
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => loadStored('recurring_expenses', INITIAL_RECURRING_EXPENSES));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('audit_logs', INITIAL_AUDIT_LOGS));
  
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);

  // Multi-tab / Multi-device cross-tab synchronization channel
  useEffect(() => {
    setIsSupabaseLive(isSupabaseConfigured());

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('scootera_pos_sync');
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_ALL') {
          if (payload.categories) setCategories(payload.categories);
          if (payload.menuItems) setMenuItems(payload.menuItems);
          if (payload.menuAddOns) setMenuAddOns(payload.menuAddOns);
          if (payload.orders) setOrders(payload.orders);
          if (payload.attendance) setAttendance(payload.attendance);
          if (payload.inventory) setInventory(payload.inventory);
          if (payload.expenses) setExpenses(payload.expenses);
          if (payload.recurringExpenses) setRecurringExpenses(payload.recurringExpenses);
          if (payload.auditLogs) setAuditLogs(payload.auditLogs);
          if (payload.availableUsers) setAvailableUsers(payload.availableUsers);
        }
      };
      return () => channel.close();
    }
  }, []);

  // Broadcast sync updates
  const broadcastSync = (type: string, payload: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('scootera_pos_sync');
        channel.postMessage({ type, payload });
      } catch {
        // ignore
      }
    }
  };

  // Sync to local storage on state updates
  useEffect(() => { saveStored('categories', categories); }, [categories]);
  useEffect(() => { saveStored('menu_items', menuItems); }, [menuItems]);
  useEffect(() => { saveStored('menu_addons', menuAddOns); }, [menuAddOns]);
  useEffect(() => { saveStored('orders', orders); }, [orders]);
  useEffect(() => { saveStored('attendance', attendance); }, [attendance]);
  useEffect(() => { saveStored('inventory', inventory); }, [inventory]);
  useEffect(() => { saveStored('expenses', expenses); }, [expenses]);
  useEffect(() => { saveStored('recurring_expenses', recurringExpenses); }, [recurringExpenses]);
  useEffect(() => { saveStored('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { saveStored('users', availableUsers); }, [availableUsers]);

  // Centralized audit logger
  const logAudit = useCallback((
    action: string,
    entity: string,
    recordId?: string,
    oldValues?: Record<string, unknown> | null,
    newValues?: Record<string, unknown> | null,
    metadata?: Record<string, unknown> | null
  ) => {
    const newEntry: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      user_name: currentUser.full_name,
      role: currentUser.role,
      action,
      entity,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      metadata,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  }, [currentUser]);

  // Authentication: Login & Logout
  const login = (username: string, password?: string): { success: boolean; message: string } => {
    const found = availableUsers.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!found) {
      return { success: false, message: 'Invalid username. Please check credentials.' };
    }

    if (!found.is_active) {
      return { success: false, message: 'This account has been deactivated. Contact the owner.' };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('scootera_logged_in_user_id', found.id);
    }

    logAudit('USER_LOGIN', 'profiles', found.id, null, { username: found.username, role: found.role });

    // Set initial activeTab appropriate for role
    if (found.role === 'staff') {
      setActiveTab('pos');
    } else if (found.role === 'owner') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('pos');
    }

    return { success: true, message: `Welcome back, ${found.full_name}!` };
  };

  const logout = () => {
    logAudit('USER_LOGOUT', 'profiles', currentUser.id, { username: currentUser.username });
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scootera_logged_in_user_id');
    }
  };

  // Switch active user
  const switchUserById = (userId: string) => {
    const found = availableUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('scootera_logged_in_user_id', found.id);
      }
      logAudit('SWITCH_USER_SESSION', 'profiles', found.id, null, { username: found.username, role: found.role });
      
      if (found.role === 'staff' && !['pos', 'receipts', 'attendance'].includes(activeTab)) {
        setActiveTab('pos');
      } else if (found.role === 'admin' && ['dashboard', 'inventory', 'expenses', 'audit'].includes(activeTab)) {
        setActiveTab('pos');
      }
    }
  };

  // Generate sequential order number per day (e.g. 20261111-0004)
  const generateNextOrderNumber = (): string => {
    const todayStr = getTodayManila().replace(/-/g, '');
    const todaysOrders = orders.filter((o) => o.order_date === getTodayManila());
    const nextSeq = todaysOrders.length + 1;
    return `${todayStr}-${String(nextSeq).padStart(4, '0')}`;
  };

  // POS Order creation with Add-ons (No Hot/Iced)
  const createOrder = (data: {
    items: Array<{ menuItem: MenuItem; quantity: number; selectedAddOns?: SelectedAddOn[] }>;
    paymentMethod: PaymentMethod;
    amountTendered: number;
  }): Order => {
    const orderNumber = generateNextOrderNumber();
    const orderId = `ord-${Date.now()}`;
    
    // Calculate total including add-ons
    const orderItems: OrderItem[] = data.items.map((it, idx) => {
      const addonsPrice = (it.selectedAddOns || []).reduce((acc, curr) => acc + curr.price, 0);
      const unitPriceWithAddons = it.menuItem.price + addonsPrice;
      const lineSubtotal = unitPriceWithAddons * it.quantity;

      return {
        id: `orditem-${Date.now()}-${idx}`,
        order_id: orderId,
        menu_item_id: it.menuItem.id,
        item_name: it.menuItem.name,
        quantity: it.quantity,
        unit_price: unitPriceWithAddons,
        subtotal: lineSubtotal,
        selected_addons: it.selectedAddOns || [],
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const changeDue = Math.max(0, data.amountTendered - totalAmount);

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      created_by: currentUser.id,
      cashier_name: currentUser.full_name,
      total_amount: totalAmount,
      payment_method: data.paymentMethod,
      amount_tendered: data.amountTendered,
      change_due: changeDue,
      status: 'completed',
      order_date: getTodayManila(),
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    setOrders((prev) => {
      const next = [newOrder, ...prev];
      broadcastSync('SYNC_ALL', { orders: next });
      return next;
    });

    // Update inventory consumption
    setInventory((prev) =>
      prev.map((item) => {
        if (item.item_name.includes('Paper Cups') || item.item_name.includes('PET Clear Cups')) {
          const cupsUsed = data.items.reduce((acc, curr) => acc + curr.quantity, 0);
          return { ...item, current_stock: Math.max(0, Number((item.current_stock - cupsUsed * 0.02).toFixed(2))) };
        }
        if (item.item_name.includes('Coffee Beans')) {
          const coffeeCount = data.items.filter((it) => it.menuItem.category_name === 'Coffee')
            .reduce((acc, curr) => acc + curr.quantity, 0);
          return { ...item, current_stock: Math.max(0, Number((item.current_stock - coffeeCount * 0.018).toFixed(2))) };
        }
        return item;
      })
    );

    logAudit('CREATE_ORDER', 'orders', orderId, null, {
      order_number: orderNumber,
      total_amount: totalAmount,
      items_count: orderItems.length,
      payment_method: data.paymentMethod,
    });

    setSelectedReceipt(newOrder);
    return newOrder;
  };

  // Time-in
  const timeInUser = (): { success: boolean; message: string } => {
    const existingOpenShift = attendance.find(
      (a) => a.user_id === currentUser.id && a.status === 'open'
    );
    if (existingOpenShift) {
      return { success: false, message: 'You already have an open shift. Please time out first.' };
    }

    const nowIso = new Date().toISOString();
    const newShift: TimeAttendance = {
      id: `att-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      work_date: getTodayManila(),
      time_in: nowIso,
      time_out: null,
      total_hours: null,
      status: 'open',
    };

    setAttendance((prev) => {
      const next = [newShift, ...prev];
      broadcastSync('SYNC_ALL', { attendance: next });
      return next;
    });

    logAudit('EMPLOYEE_TIME_IN', 'time_attendance', newShift.id, null, {
      time_in: nowIso,
      user: currentUser.full_name,
    });

    return { success: true, message: `Successfully clocked in at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` };
  };

  // Time-out
  const timeOutUser = (): { success: boolean; message: string } => {
    const openShift = attendance.find(
      (a) => a.user_id === currentUser.id && a.status === 'open'
    );
    if (!openShift) {
      return { success: false, message: 'No open shift found to time out.' };
    }

    const nowIso = new Date().toISOString();
    const timeInDate = new Date(openShift.time_in);
    const timeOutDate = new Date(nowIso);
    const hours = Number((Math.max(0.01, (timeOutDate.getTime() - timeInDate.getTime()) / 3600000)).toFixed(2));

    setAttendance((prev) => {
      const next = prev.map((a) =>
        a.id === openShift.id
          ? { ...a, time_out: nowIso, total_hours: hours, status: 'completed' as const }
          : a
      );
      broadcastSync('SYNC_ALL', { attendance: next });
      return next;
    });

    logAudit('EMPLOYEE_TIME_OUT', 'time_attendance', openShift.id, { status: 'open' }, {
      time_out: nowIso,
      total_hours: hours,
    });

    return { success: true, message: `Successfully clocked out. Total shift: ${hours} hours.` };
  };

  // Update hourly rate
  const updateEmployeeHourlyRate = (userId: string, newRate: number) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (!user) return;
    const oldRate = user.hourly_rate;

    setAvailableUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, hourly_rate: newRate } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, hourly_rate: newRate }));
    }

    logAudit('UPDATE_HOURLY_RATE', 'profiles', userId, { hourly_rate: oldRate }, { hourly_rate: newRate });
  };

  // Categories CRUD
  const addCategory = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      display_order: categories.length + 1,
    };
    setCategories((prev) => {
      const next = [...prev, newCat];
      broadcastSync('SYNC_ALL', { categories: next });
      return next;
    });

    logAudit('ADD_CATEGORY', 'categories', newCat.id, null, { name: trimmed });
  };

  const deleteCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== categoryId);
      broadcastSync('SYNC_ALL', { categories: next });
      return next;
    });
    logAudit('DELETE_CATEGORY', 'categories', categoryId, cat ? { name: cat.name } : null, null);
  };

  // Add-ons / Modifiers CRUD
  const saveMenuAddOn = (addonData: Partial<MenuAddOn>) => {
    if (addonData.id) {
      const existing = menuAddOns.find((a) => a.id === addonData.id);
      setMenuAddOns((prev) => {
        const next = prev.map((a) => (a.id === addonData.id ? ({ ...a, ...addonData } as MenuAddOn) : a));
        broadcastSync('SYNC_ALL', { menuAddOns: next });
        return next;
      });
      logAudit('UPDATE_MENU_ADDON', 'menu_addons', addonData.id, existing ? { price: existing.price, name: existing.name } : null, addonData);
    } else {
      const newAddon: MenuAddOn = {
        id: `addon-${Date.now()}`,
        name: addonData.name || 'New Add-on',
        price: addonData.price || 25.00,
        is_available: addonData.is_available ?? true,
        created_at: new Date().toISOString(),
      };
      setMenuAddOns((prev) => {
        const next = [...prev, newAddon];
        broadcastSync('SYNC_ALL', { menuAddOns: next });
        return next;
      });
      logAudit('CREATE_MENU_ADDON', 'menu_addons', newAddon.id, null, newAddon as unknown as Record<string, unknown>);
    }
  };

  const deleteMenuAddOn = (addonId: string) => {
    const existing = menuAddOns.find((a) => a.id === addonId);
    setMenuAddOns((prev) => {
      const next = prev.filter((a) => a.id !== addonId);
      broadcastSync('SYNC_ALL', { menuAddOns: next });
      return next;
    });
    logAudit('DELETE_MENU_ADDON', 'menu_addons', addonId, existing as unknown as Record<string, unknown>, null);
  };

  // Menu items CRUD
  const saveMenuItem = (itemData: Partial<MenuItem>) => {
    if (itemData.id) {
      const existing = menuItems.find((m) => m.id === itemData.id);
      setMenuItems((prev) => {
        const next = prev.map((m) => (m.id === itemData.id ? ({ ...m, ...itemData } as MenuItem) : m));
        broadcastSync('SYNC_ALL', { menuItems: next });
        return next;
      });
      logAudit('UPDATE_MENU_ITEM', 'menu_items', itemData.id, existing ? { price: existing.price, name: existing.name } : null, itemData);
    } else {
      const newItem: MenuItem = {
        id: `menu-${Date.now()}`,
        category_id: itemData.category_id || categories[0]?.id || 'cat-1',
        category_name: itemData.category_name || categories[0]?.name || 'Coffee',
        name: itemData.name || 'New Menu Item',
        description: itemData.description || '',
        price: itemData.price || 120.00,
        image_url: itemData.image_url || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
        is_available: itemData.is_available ?? true,
        created_at: new Date().toISOString(),
      };
      setMenuItems((prev) => {
        const next = [...prev, newItem];
        broadcastSync('SYNC_ALL', { menuItems: next });
        return next;
      });
      logAudit('CREATE_MENU_ITEM', 'menu_items', newItem.id, null, newItem as unknown as Record<string, unknown>);
    }
  };

  const deleteMenuItem = (itemId: string) => {
    const existing = menuItems.find((m) => m.id === itemId);
    setMenuItems((prev) => {
      const next = prev.filter((m) => m.id !== itemId);
      broadcastSync('SYNC_ALL', { menuItems: next });
      return next;
    });
    logAudit('DELETE_MENU_ITEM', 'menu_items', itemId, existing as unknown as Record<string, unknown>, null);
  };

  // Inventory adjustment
  const updateInventoryItem = (
    id: string,
    updates: { current_stock?: number; min_threshold?: number; unit_cost?: number },
    reason?: string
  ) => {
    const existing = inventory.find((i) => i.id === id);
    if (!existing) return;

    setInventory((prev) => {
      const next = prev.map((i) =>
        i.id === id
          ? {
              ...i,
              ...updates,
              updated_by_name: currentUser.full_name,
              updated_at: new Date().toISOString(),
            }
          : i
      );
      broadcastSync('SYNC_ALL', { inventory: next });
      return next;
    });

    logAudit('INVENTORY_ADJUSTED', 'inventory', id, existing as unknown as Record<string, unknown>, updates, { reason });
  };

  // Expenses management
  const addExpense = (
    expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_name' | 'is_voided'>
  ) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_voided: false,
    };
    setExpenses((prev) => {
      const next = [newExp, ...prev];
      broadcastSync('SYNC_ALL', { expenses: next });
      return next;
    });
    logAudit('CREATE_EXPENSE', 'expenses', newExp.id, null, {
      amount: newExp.amount,
      vendor: newExp.vendor,
      description: newExp.description,
      category: newExp.category_name,
    });
  };

  const voidExpense = (expenseId: string, reason: string) => {
    const existing = expenses.find((e) => e.id === expenseId);
    if (!existing) return;

    setExpenses((prev) => {
      const next = prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              is_voided: true,
              void_reason: reason,
              voided_by_name: currentUser.full_name,
              voided_at: new Date().toISOString(),
            }
          : e
      );
      broadcastSync('SYNC_ALL', { expenses: next });
      return next;
    });

    logAudit('VOID_EXPENSE', 'expenses', expenseId, { is_voided: false }, {
      is_voided: true,
      void_reason: reason,
      voided_by: currentUser.full_name,
    });
  };

  // Recurring Templates
  const saveRecurringTemplate = (templateData: Partial<RecurringExpense>) => {
    if (templateData.id) {
      const existing = recurringExpenses.find((r) => r.id === templateData.id);
      setRecurringExpenses((prev) =>
        prev.map((r) => (r.id === templateData.id ? ({ ...r, ...templateData } as RecurringExpense) : r))
      );
      logAudit('UPDATE_RECURRING_TEMPLATE', 'recurring_expenses', templateData.id, existing as unknown as Record<string, unknown>, templateData);
    } else {
      const newTpl: RecurringExpense = {
        id: `rec-${Date.now()}`,
        category_id: templateData.category_id || 'expcat-1',
        category_name: templateData.category_name || 'Ingredients & Supplies',
        description: templateData.description || 'Recurring Expense',
        vendor: templateData.vendor || 'Vendor',
        amount: templateData.amount || 1000.00,
        payment_method: templateData.payment_method || 'cash',
        frequency: templateData.frequency || 'monthly',
        start_date: templateData.start_date || getTodayManila(),
        next_due_date: templateData.next_due_date || getTodayManila(),
        is_active: true,
        is_variable: templateData.is_variable ?? false,
        notes: templateData.notes || '',
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
      };
      setRecurringExpenses((prev) => [...prev, newTpl]);
      logAudit('CREATE_RECURRING_TEMPLATE', 'recurring_expenses', newTpl.id, null, newTpl as unknown as Record<string, unknown>);
    }
  };

  const toggleRecurringTemplateActive = (id: string) => {
    const existing = recurringExpenses.find((r) => r.id === id);
    if (!existing) return;
    const nextState = !existing.is_active;
    setRecurringExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: nextState } : r))
    );
    logAudit('TOGGLE_RECURRING_STATUS', 'recurring_expenses', id, { is_active: existing.is_active }, { is_active: nextState });
  };

  // Trigger generator for due recurring expenses
  const triggerRecurringExpensesGeneration = (): number => {
    const todayStr = getTodayManila();
    let generatedCount = 0;

    const updatedTemplates = recurringExpenses.map((tpl) => {
      if (tpl.is_active && tpl.next_due_date <= todayStr) {
        const alreadyExists = expenses.some(
          (e) => e.recurring_id === tpl.id && e.expense_date === tpl.next_due_date
        );

        if (!alreadyExists) {
          const generatedExpense: Expense = {
            id: `exp-auto-${Date.now()}-${tpl.id}`,
            expense_date: tpl.next_due_date,
            category_id: tpl.category_id,
            category_name: tpl.category_name,
            description: tpl.description,
            vendor: tpl.vendor,
            amount: tpl.amount,
            payment_method: tpl.payment_method,
            reference_no: `AUTO-REC-${tpl.id.slice(-4)}`,
            receipt_path: null,
            notes: `Auto-generated from recurring template: ${tpl.description}`,
            created_by: currentUser.id,
            created_by_name: 'System Scheduler',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recurring_id: tpl.id,
            is_estimate: tpl.is_variable,
            is_voided: false,
          };

          setExpenses((prev) => [generatedExpense, ...prev]);
          generatedCount++;
        }

        const currentDate = new Date(tpl.next_due_date);
        const nextDate = new Date(currentDate);
        if (tpl.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (tpl.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (tpl.frequency === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (tpl.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        const nextDateStr = nextDate.toISOString().split('T')[0];

        return {
          ...tpl,
          next_due_date: nextDateStr,
        };
      }
      return tpl;
    });

    setRecurringExpenses(updatedTemplates);

    if (generatedCount > 0) {
      logAudit('RECURRING_EXPENSES_GENERATED', 'expenses', undefined, null, {
        generated_count: generatedCount,
        executed_by: currentUser.full_name,
      });
    }

    return generatedCount;
  };

  // User credentials management
  const addUserCredential = (profileData: Omit<Profile, 'id' | 'created_at'>) => {
    const newProfile: Profile = {
      ...profileData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setAvailableUsers((prev) => {
      const next = [...prev, newProfile];
      broadcastSync('SYNC_ALL', { availableUsers: next });
      return next;
    });
    logAudit('CREATE_USER', 'profiles', newProfile.id, null, {
      username: newProfile.username,
      full_name: newProfile.full_name,
      role: newProfile.role,
    });
  };

  const toggleUserActiveStatus = (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (!user) return;
    const newState = !user.is_active;

    setAvailableUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newState } : u))
    );
    logAudit('TOGGLE_USER_ACTIVE', 'profiles', userId, { is_active: user.is_active }, { is_active: newState });
  };

  // CSV Exports
  const exportDataCSV = (type: 'receipts' | 'attendance' | 'inventory' | 'expenses') => {
    const today = getTodayManila();
    if (type === 'receipts') {
      const exportList = orders.map((o) => ({
        OrderNumber: o.order_number,
        Date: o.order_date,
        CreatedAt: o.created_at,
        Cashier: o.cashier_name,
        TotalPHP: o.total_amount,
        PaymentMethod: o.payment_method,
        Status: o.status,
        ItemsSummary: o.items.map((i) => `${i.quantity}x ${i.item_name}`).join('; '),
      }));
      exportToCSV(`Scootera_Receipts_${today}`, exportList);
      logAudit('EXPORT_CSV', 'orders', undefined, null, { type: 'receipts', count: exportList.length });
    } else if (type === 'attendance') {
      const exportList = attendance.map((a) => ({
        Employee: a.user_name,
        WorkDate: a.work_date,
        TimeIn: a.time_in,
        TimeOut: a.time_out || 'Active / Open',
        TotalHours: a.total_hours || 0,
        Status: a.status,
      }));
      exportToCSV(`Scootera_Attendance_${today}`, exportList);
      logAudit('EXPORT_CSV', 'time_attendance', undefined, null, { type: 'attendance', count: exportList.length });
    } else if (type === 'inventory') {
      const exportList = inventory.map((i) => ({
        ItemName: i.item_name,
        Unit: i.unit,
        CurrentStock: i.current_stock,
        MinThreshold: i.min_threshold,
        UnitCostPHP: i.unit_cost,
        StockValuePHP: (i.current_stock * i.unit_cost).toFixed(2),
        LowStockAlert: i.current_stock <= i.min_threshold ? 'YES' : 'NO',
        LastUpdatedBy: i.updated_by_name,
      }));
      exportToCSV(`Scootera_Inventory_${today}`, exportList);
      logAudit('EXPORT_CSV', 'inventory', undefined, null, { type: 'inventory', count: exportList.length });
    } else if (type === 'expenses') {
      const exportList = expenses.map((e) => ({
        Date: e.expense_date,
        Category: e.category_name,
        Description: e.description,
        Vendor: e.vendor,
        AmountPHP: e.amount,
        PaymentMethod: e.payment_method,
        ReferenceNo: e.reference_no || '',
        IsRecurring: e.recurring_id ? 'YES' : 'NO',
        IsEstimate: e.is_estimate ? 'YES' : 'NO',
        IsVoided: e.is_voided ? 'YES' : 'NO',
        VoidReason: e.void_reason || '',
        RecordedBy: e.created_by_name,
      }));
      exportToCSV(`Scootera_Expenses_${today}`, exportList);
      logAudit('EXPORT_CSV', 'expenses', undefined, null, { type: 'expenses', count: exportList.length });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        availableUsers,
        categories,
        menuItems,
        menuAddOns,
        orders,
        attendance,
        inventory,
        expenseCategories,
        expenses,
        recurringExpenses,
        auditLogs,
        activeTab,
        setActiveTab,
        selectedReceipt,
        setSelectedReceipt,
        isSettingsOpen,
        setIsSettingsOpen,
        isSupabaseLive,
        switchUserById,
        createOrder,
        timeInUser,
        timeOutUser,
        updateEmployeeHourlyRate,
        saveMenuItem,
        deleteMenuItem,
        addCategory,
        deleteCategory,
        saveMenuAddOn,
        deleteMenuAddOn,
        updateInventoryItem,
        addExpense,
        voidExpense,
        saveRecurringTemplate,
        toggleRecurringTemplateActive,
        triggerRecurringExpensesGeneration,
        addUserCredential,
        toggleUserActiveStatus,
        exportDataCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
