# Scootera Café POS & Management System

Production-ready Coffee Shop Point of Sale (POS) and Store Management system built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase (PostgreSQL, Auth, Storage, and Realtime).

Designed for tablet, desktop, and mobile with thermal receipt printing (58mm/80mm), live Asia/Manila (GMT+8) time attendance, payroll tracking, inventory management with low-stock warnings, Recharts sales and expense analytics, and complete audit logging.

---

## ☕ Key Features

1. **Order Entry (POS)**:
   - Categorized by **Coffee** and **Non-Coffee**.
   - Single-price structure with **Hot** or **Iced** selection per line item.
   - Automatic sequential order numbering per day (e.g., `20261111-0001`) generated atomically via database sequence.
   - Instant 58mm/80mm thermal receipt printing with the official Scootera Café logo.
2. **Attendance & Time Clock**:
   - Live Asia/Manila (GMT+8) digital clock.
   - Database-enforced atomic `now()` timestamps to prevent client-side manipulation.
   - Strict prevention of double time-in (only one open shift per employee).
   - Daily Attendance Log Ledger + Historical Payroll & Payslip generation.
3. **Attendance & Payroll Monitoring**:
   - Filterable by date range and searchable employee dropdown.
   - Consolidated payroll report: total hours, hourly rate (₱), and gross pay.
   - Server-side CSV attendance export & downloadable Payslip / Proof of Pay PDF.
4. **Sales Dashboard (Owner)**:
   - Real-time visual dashboard (Daily, Weekly, Monthly, Annual).
   - Gross Sales, Non-voided Expenses, Net Profit, and Most-Bought Menu Items.
   - "Generate Report" PDF dialog for consolidated weekly, monthly, or annual financial summaries.
5. **Inventory Management**:
   - Editable current stock, minimum threshold, and unit cost.
   - Low-stock warning indicators.
   - Full audit logging on every adjustment.
6. **Expenses Tracker (Owner Only)**:
   - One-time expenses with receipt uploads and Zod validation.
   - Void confirmation modal requiring mandatory reason (no hard deletes).
   - Recurring expenses engine: weekly, monthly, quarterly, and yearly templates.
   - Idempotent `generate_due_recurring_expenses()` SQL procedure and Vercel Cron trigger.
   - Variable utility estimate flags ("Needs review").
7. **Role-Based Access Control (RBAC)**:
   - **Staff**: Order Entry, Print Receipts, Today's Receipts Ledger, Employee Time-In/Out.
   - **Admin**: Staff permissions + Monitor attendance, Menu item CRUD & price editing, Add staff credentials.
   - **Owner**: Full system access, Sales Dashboard, Hourly rates, User deactivation & role assignment, Inventory, Expenses tracker, and Audit logs.

---

## 🛠️ Step-by-Step Supabase Setup

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Set the project name to `scootera-cafe-pos` and select your nearest region (e.g., `Singapore - ap-southeast-1` for Southeast Asia/Philippines).
3. Set a strong database password and click **Create new project**.

### 2. Run Database Schema & Seed Script
1. In the Supabase Dashboard, open the **SQL Editor** from the left navigation.
2. Click **New query**.
3. Copy the entire contents of `supabase/schema.sql` from this repository.
4. Paste it into the SQL editor and click **Run**.
   - This sets up all 11+ tables, constraints, indexes, RLS policies, daily sequence tables, automated triggers, and seeds the initial menu items and expense categories.
   - It also automatically provisions the `menu-images` (public) and `expense-receipts` (private) storage buckets.

### 3. Create the First Owner Account
1. In the Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add user** > **Create user**.
3. Enter the Owner's email (e.g., `owner@scootera.cafe`) and a secure password.
4. Check **Auto Confirm User?** to confirm immediately without email verification.
5. Note the generated User `UUID` (e.g., `a1b2c3d4-...`).
6. Return to the **SQL Editor** and insert the owner profile:
```sql
INSERT INTO public.profiles (id, username, full_name, role, is_active, hourly_rate)
VALUES (
  'PASTE_USER_UUID_HERE',
  'owner',
  'Master Barista / Owner',
  'owner',
  true,
  0.00
);
```

### 4. Obtain Your Supabase API Keys
1. In the Supabase Dashboard, go to **Project Settings** (gear icon) > **API**.
2. Copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon / public** key
   - **service_role** key (keep this strictly confidential!)

---

## 🚀 Vercel Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial commit of Scootera Cafe POS"
git branch -M main
git remote add origin https://github.com/your-username/scootera-pos.git
git push -u origin main
```

### 2. Import into Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New...** > **Project**.
2. Select your `scootera-pos` repository.
3. Vercel automatically detects Next.js.

### 3. Configure Environment Variables in Vercel
In the Vercel project configuration, expand **Environment Variables** and add:

| Variable Name | Value / Description | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (`https://xyz.supabase.co`) | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public `anon` key | Production, Preview, Dev |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase private `service_role` key (Server only) | Production, Preview, Dev |
| `CRON_SECRET` | 32+ character random string to protect cron endpoints | Production, Preview, Dev |

Generate a random `CRON_SECRET` using terminal:
```bash
openssl rand -base64 32
```

### 4. Deploy!
Click **Deploy**. Vercel will build the project cleanly without warnings or errors.

---

## ⏱️ Vercel Cron Configuration

The `vercel.json` file is pre-configured with a daily cron job scheduled for `00:05 Asia/Manila` (which is `16:05 UTC`):
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-recurring-expenses",
      "schedule": "5 16 * * *"
    }
  ]
}
```
Vercel Cron automatically includes the `Authorization: Bearer <CRON_SECRET>` header in scheduled requests to execute `generate_due_recurring_expenses()` securely.

---

## 🛡️ Permission Matrix Summary

| Feature / Action | Staff | Admin | Owner |
|---|:---:|:---:|:---:|
| **Order Entry (POS)** | ✅ | ✅ | ✅ |
| **Print Thermal Receipt** | ✅ | ✅ | ✅ |
| **Today's Receipts Ledger** | ✅ | ✅ | ✅ |
| **Personal Time In / Out** | ✅ | ✅ | ✅ |
| **Monitor All Staff Time In / Out** | ❌ | ✅ | ✅ |
| **Add / Edit / Delete Menu & Prices** | ❌ | ✅ | ✅ |
| **Historical Receipts Calendar & CSV**| ❌ | ✅ | ✅ |
| **Add Staff User Credentials** | ❌ | ✅ | ✅ |
| **Realtime Sales & Net Profit Dashboard** | ❌ | ❌ | ✅ |
| **Consolidated Payroll & Payslip PDF** | ❌ | ❌ | ✅ |
| **Edit Employee Hourly Rates** | ❌ | ❌ | ✅ |
| **Add Admin & Owner Users / Deactivate** | ❌ | ❌ | ✅ |
| **Inventory Management & Low-Stock Alerts** | ❌ | ❌ | ✅ |
| **Expenses Tracker & Recurring Templates** | ❌ | ❌ | ✅ |
| **Audit Logs Viewer** | ❌ | ❌ | ✅ |

---

## 📄 License
Scootera Café POS & Management System is licensed under the Apache-2.0 License.
