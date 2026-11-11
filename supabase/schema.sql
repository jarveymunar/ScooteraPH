-- =====================================================================
-- SCOOTERA CAFÉ POS & MANAGEMENT DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- Timezone convention: Asia/Manila (GMT+8)
-- Currency: Philippine Peso (PHP / ₱), numeric(10,2)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('staff', 'admin', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'gcash', 'bank_transfer', 'card', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurring_frequency_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('open', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 65.00 CHECK (hourly_rate >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CATEGORIES (Dynamic Categories - Admin/Owner can add any category)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. MENU ITEMS
-- Each menu item has ONE size and price. Add-ons are also manageable.
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_addon BOOLEAN NOT NULL DEFAULT false, -- If true, can be chosen as an add-on or modifier
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ADD-ONS / MODIFIERS TABLE
CREATE TABLE IF NOT EXISTS public.menu_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (current_stock >= 0),
    min_threshold NUMERIC(10,2) NOT NULL DEFAULT 10.00 CHECK (min_threshold >= 0),
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TIME & ATTENDANCE
CREATE TABLE IF NOT EXISTS public.time_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    work_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
    time_in TIMESTAMPTZ NOT NULL DEFAULT now(),
    time_out TIMESTAMPTZ,
    total_hours NUMERIC(10,2),
    status shift_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_shift_per_user 
ON public.time_attendance (user_id) 
WHERE status = 'open';

-- 9. ORDER SEQUENCE PER DAY TABLE
CREATE TABLE IF NOT EXISTS public.daily_order_sequences (
    order_date DATE PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_method payment_method_type NOT NULL DEFAULT 'cash',
    amount_tendered NUMERIC(10,2) DEFAULT 0.00,
    change_due NUMERIC(10,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'completed',
    order_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. ORDER ITEMS TABLE (With selected add-ons array)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    selected_addons JSONB DEFAULT '[]'::jsonb, -- Array of { id, name, price }
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. RECURRING EXPENSES
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    vendor TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_type NOT NULL DEFAULT 'cash',
    frequency recurring_frequency_type NOT NULL DEFAULT 'monthly',
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    start_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
    end_date DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_variable BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    vendor TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_type NOT NULL DEFAULT 'cash',
    reference_no TEXT DEFAULT '',
    receipt_path TEXT,
    notes TEXT DEFAULT '',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recurring_id UUID REFERENCES public.recurring_expenses(id) ON DELETE SET NULL,
    is_estimate BOOLEAN NOT NULL DEFAULT false,
    is_voided BOOLEAN NOT NULL DEFAULT false,
    void_reason TEXT,
    voided_by UUID REFERENCES public.profiles(id),
    voided_at TIMESTAMPTZ,
    CONSTRAINT uq_recurring_occurrence UNIQUE (recurring_id, expense_date)
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id),
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.time_attendance(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_voided ON public.expenses(is_voided);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON public.expenses(recurring_id);
CREATE INDEX IF NOT EXISTS idx_recurring_due_date ON public.recurring_expenses(next_due_date, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- =====================================================================
-- DATABASE FUNCTIONS
-- =====================================================================

-- 1. Sequential Order Number Generator
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_manila DATE;
    date_prefix TEXT;
    seq_val INT;
BEGIN
    today_manila := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE;
    date_prefix := to_char(today_manila, 'YYYYMMDD');
    
    INSERT INTO public.daily_order_sequences (order_date, last_seq)
    VALUES (today_manila, 1)
    ON CONFLICT (order_date)
    DO UPDATE SET last_seq = public.daily_order_sequences.last_seq + 1
    RETURNING last_seq INTO seq_val;
    
    RETURN date_prefix || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- 2. Single-Transaction Order Creation with Add-ons (RPC)
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_created_by UUID,
    p_total_amount NUMERIC(10,2),
    p_payment_method payment_method_type,
    p_amount_tendered NUMERIC(10,2),
    p_change_due NUMERIC(10,2),
    p_items JSONB -- Array of {menu_item_id, item_name, quantity, unit_price, subtotal, selected_addons}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_number TEXT;
    v_order_id UUID;
    v_item RECORD;
    v_result JSONB;
BEGIN
    v_order_number := public.get_next_order_number();
    
    INSERT INTO public.orders (
        order_number,
        created_by,
        total_amount,
        payment_method,
        amount_tendered,
        change_due,
        order_date,
        status
    )
    VALUES (
        v_order_number,
        p_created_by,
        p_total_amount,
        p_payment_method,
        p_amount_tendered,
        p_change_due,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
        'completed'
    )
    RETURNING id INTO v_order_id;
    
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        menu_item_id UUID,
        item_name TEXT,
        quantity INT,
        unit_price NUMERIC(10,2),
        subtotal NUMERIC(10,2),
        selected_addons JSONB
    )
    LOOP
        INSERT INTO public.order_items (
            order_id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            subtotal,
            selected_addons
        )
        VALUES (
            v_order_id,
            v_item.menu_item_id,
            v_item.item_name,
            v_item.quantity,
            v_item.unit_price,
            v_item.subtotal,
            COALESCE(v_item.selected_addons, '[]'::jsonb)
        );
    END LOOP;
    
    SELECT json_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', p_total_amount,
        'created_at', now()
    )::jsonb INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 3. Atomic Database-Enforced Time-In
CREATE OR REPLACE FUNCTION public.time_in_employee(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_id UUID;
    v_new_id UUID;
    v_time_in TIMESTAMPTZ;
BEGIN
    SELECT id INTO v_existing_id
    FROM public.time_attendance
    WHERE user_id = p_user_id AND status = 'open'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'Employee already has an open shift. Please time out first.';
    END IF;

    v_time_in := now();
    INSERT INTO public.time_attendance (
        user_id,
        work_date,
        time_in,
        status
    )
    VALUES (
        p_user_id,
        (v_time_in AT TIME ZONE 'Asia/Manila')::DATE,
        v_time_in,
        'open'
    )
    RETURNING id INTO v_new_id;

    RETURN json_build_object(
        'success', true,
        'attendance_id', v_new_id,
        'time_in', v_time_in
    )::jsonb;
END;
$$;

-- 4. Atomic Database-Enforced Time-Out
CREATE OR REPLACE FUNCTION public.time_out_employee(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift RECORD;
    v_time_out TIMESTAMPTZ;
    v_hours NUMERIC(10,2);
BEGIN
    SELECT * INTO v_shift
    FROM public.time_attendance
    WHERE user_id = p_user_id AND status = 'open'
    LIMIT 1;

    IF v_shift.id IS NULL THEN
        RAISE EXCEPTION 'No open shift found to time out.';
    END IF;

    v_time_out := now();
    v_hours := ROUND(EXTRACT(EPOCH FROM (v_time_out - v_shift.time_in))::NUMERIC / 3600.0, 2);

    UPDATE public.time_attendance
    SET time_out = v_time_out,
        total_hours = v_hours,
        status = 'completed'
    WHERE id = v_shift.id;

    RETURN json_build_object(
        'success', true,
        'attendance_id', v_shift.id,
        'time_out', v_time_out,
        'total_hours', v_hours
    )::jsonb;
END;
$$;

-- 5. Automated Idempotent Recurring Expenses Generator
CREATE OR REPLACE FUNCTION public.generate_due_recurring_expenses()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_manila DATE;
    tpl RECORD;
    generated_count INT := 0;
    v_next_date DATE;
BEGIN
    today_manila := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE;
    
    FOR tpl IN 
        SELECT * FROM public.recurring_expenses
        WHERE is_active = true 
          AND next_due_date <= today_manila
          AND (end_date IS NULL OR next_due_date <= end_date)
        FOR UPDATE
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE recurring_id = tpl.id AND expense_date = tpl.next_due_date
        ) THEN
            INSERT INTO public.expenses (
                expense_date,
                category_id,
                description,
                vendor,
                amount,
                payment_method,
                recurring_id,
                is_estimate,
                notes,
                created_by
            )
            VALUES (
                tpl.next_due_date,
                tpl.category_id,
                tpl.description,
                tpl.vendor,
                tpl.amount,
                tpl.payment_method,
                tpl.id,
                tpl.is_variable,
                'Generated automatically from recurring template: ' || tpl.description,
                tpl.created_by
            );
            generated_count := generated_count + 1;
        END IF;

        IF tpl.frequency = 'weekly' THEN
            v_next_date := tpl.next_due_date + INTERVAL '7 days';
        ELSIF tpl.frequency = 'monthly' THEN
            v_next_date := tpl.next_due_date + INTERVAL '1 month';
        ELSIF tpl.frequency = 'quarterly' THEN
            v_next_date := tpl.next_due_date + INTERVAL '3 months';
        ELSIF tpl.frequency = 'yearly' THEN
            v_next_date := tpl.next_due_date + INTERVAL '1 year';
        ELSE
            v_next_date := tpl.next_due_date + INTERVAL '1 month';
        END IF;

        UPDATE public.recurring_expenses
        SET next_due_date = v_next_date,
            updated_at = now()
        WHERE id = tpl.id;
    END LOOP;

    IF generated_count > 0 THEN
        INSERT INTO public.audit_logs (
            user_name,
            role,
            action,
            entity,
            metadata
        ) VALUES (
            'System Scheduler',
            'system',
            'RECURRING_EXPENSES_GENERATED',
            'expenses',
            json_build_object('count', generated_count, 'executed_at', now())::jsonb
        );
    END IF;

    RETURN generated_count;
END;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- RLS POLICIES
CREATE POLICY "Public profile reading for active authenticated staff"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner can do all profile operations"
ON public.profiles FOR ALL TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "Admin can create staff profiles"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'owner'));

-- CATEGORIES & MENU ITEMS
CREATE POLICY "Anyone authenticated can view categories"
ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Owner can manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'owner'))
WITH CHECK (public.current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Anyone authenticated can view menu items"
ON public.menu_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Owner can manage menu items"
ON public.menu_items FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'owner'))
WITH CHECK (public.current_user_role() IN ('admin', 'owner'));

-- ADD-ONS
CREATE POLICY "Anyone authenticated can view menu addons"
ON public.menu_addons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Owner can manage menu addons"
ON public.menu_addons FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin', 'owner'))
WITH CHECK (public.current_user_role() IN ('admin', 'owner'));

-- INVENTORY
CREATE POLICY "Owner can manage inventory"
ON public.inventory FOR ALL TO authenticated
USING (public.current_user_role() = 'owner')
WITH CHECK (public.current_user_role() = 'owner');

-- TIME ATTENDANCE
CREATE POLICY "Staff can view own attendance; Admin and Owner view all"
ON public.time_attendance FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin', 'owner') OR user_id = auth.uid());

-- ORDERS
CREATE POLICY "Authenticated users can create orders"
ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can view orders; Admin/Owner view all"
ON public.orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Order items viewable by all authenticated"
ON public.order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Order items insertable by all authenticated"
ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- EXPENSES (Owner Only)
CREATE POLICY "Owner can view expense categories"
ON public.expense_categories FOR SELECT TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can manage expense categories"
ON public.expense_categories FOR ALL TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can view and insert/update expenses"
ON public.expenses FOR SELECT TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can insert expenses"
ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.current_user_role() = 'owner');

CREATE POLICY "Owner can update expenses"
ON public.expenses FOR UPDATE TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can manage recurring expenses"
ON public.recurring_expenses FOR ALL TO authenticated USING (public.current_user_role() = 'owner') WITH CHECK (public.current_user_role() = 'owner');

-- AUDIT LOGS
CREATE POLICY "Owner can read audit logs"
ON public.audit_logs FOR SELECT TO authenticated USING (public.current_user_role() = 'owner');

CREATE POLICY "System and users can append audit logs"
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view menu images" 
ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Admin and Owner can upload menu images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'menu-images' AND public.current_user_role() IN ('admin', 'owner'));

CREATE POLICY "Owner can access expense receipts" 
ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'expense-receipts' AND public.current_user_role() = 'owner')
WITH CHECK (bucket_id = 'expense-receipts' AND public.current_user_role() = 'owner');

-- =====================================================================
-- INITIAL SEED DATA
-- =====================================================================
INSERT INTO public.categories (name, display_order)
VALUES 
    ('Coffee', 1),
    ('Non-Coffee', 2),
    ('Pastries & Bakery', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.expense_categories (name)
VALUES 
    ('Ingredients & Supplies'),
    ('Packaging'),
    ('Utilities'),
    ('Rent'),
    ('Equipment & Maintenance'),
    ('Marketing'),
    ('Licenses & Permits'),
    ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;

-- Initial Add-ons / Modifiers
INSERT INTO public.menu_addons (name, price, is_available)
VALUES
    ('Oat Milk Barista Blend', 40.00, true),
    ('Extra Espresso Shot', 35.00, true),
    ('Vanilla Bean Syrup', 25.00, true),
    ('Artisanal Caramel Drizzle', 20.00, true),
    ('Whipped Cream Foam', 25.00, true),
    ('Organic Wild Honey', 20.00, true),
    ('Almond Milk', 40.00, true),
    ('Coffee Jelly', 30.00, true)
ON CONFLICT (name) DO NOTHING;
