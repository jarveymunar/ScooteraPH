import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60s for batch processing

export async function GET(request: NextRequest) {
  // 1. Verify Vercel Cron Authorization header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET token' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in server environment.',
      },
      { status: 500 }
    );
  }

  try {
    // 2. Initialize Supabase Admin Client using Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Call database function generate_due_recurring_expenses()
    const { data: count, error: rpcError } = await supabaseAdmin.rpc(
      'generate_due_recurring_expenses'
    );

    if (rpcError) {
      console.error('Cron RPC error executing generate_due_recurring_expenses:', rpcError);
      return NextResponse.json(
        { error: 'Failed to generate recurring expenses', details: rpcError.message },
        { status: 500 }
      );
    }

    // 4. Record cron audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_name: 'Vercel Cron Service',
      role: 'system',
      action: 'CRON_RECURRING_EXPENSES_RUN',
      entity: 'recurring_expenses',
      metadata: {
        generated_count: count ?? 0,
        executed_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed recurring expenses. ${count ?? 0} expense(s) generated.`,
      generated_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Unhandled cron error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error in recurring expenses cron job',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
