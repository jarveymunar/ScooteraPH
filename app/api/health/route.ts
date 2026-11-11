import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        status: 'warning',
        message: 'Supabase credentials not configured in environment. Running in demo mode.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey);
    const { error } = await supabase.from('categories').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to query Supabase database',
          details: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown database error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
