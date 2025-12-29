import { NextRequest, NextResponse } from 'next/server';
import { Layer7 } from '@/lib/layers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const format = searchParams.get('format') || 'json';
    const include = searchParams.get('include') || 'all';
    const period = searchParams.get('period') || 'all_time';

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be one of: json, csv' },
        { status: 400 }
      );
    }

    // Validate include
    const validIncludes = ['all', 'applications', 'metrics'];
    if (!validIncludes.includes(include)) {
      return NextResponse.json(
        { 
          error: `Invalid include option. Must be one of: ${validIncludes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Calculate lookback days based on period
    let lookbackDays: number;
    switch (period) {
      case 'last_30_days':
        lookbackDays = 30;
        break;
      case 'all_time':
      default:
        lookbackDays = 365; // Use 1 year as "all time" limit
    }

    // Call Layer 7 to export data
    const exportResult = await Layer7.exportData(
      user_id,
      format as 'json' | 'csv',
      {
        lookbackDays,
        prettyPrint: true,
      }
    );

    // For CSV format, return as file download
    if (format === 'csv') {
      return new NextResponse(exportResult.data, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=export-${user_id}-${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    // For JSON format, return parsed data
    return NextResponse.json({
      success: true,
      data: JSON.parse(exportResult.data),
      format: exportResult.format,
      record_count: exportResult.recordCount,
      generated_at: exportResult.generatedAt.toISOString(),
      period: {
        start: exportResult.period.start.toISOString(),
        end: exportResult.period.end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
