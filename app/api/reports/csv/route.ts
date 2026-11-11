import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename = 'scootera-export.csv', data = [], fields } = body;

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Data must be an array of objects' }, { status: 400 });
    }

    // Limit large exports to stay under Vercel limits
    const limitedData = data.slice(0, 10000);

    const csvString = Papa.unparse({
      fields: fields && fields.length > 0 ? fields : undefined,
      data: limitedData,
    });

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to generate CSV export', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
