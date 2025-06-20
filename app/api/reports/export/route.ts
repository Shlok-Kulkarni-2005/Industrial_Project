import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../../jobs/route';

export async function GET() {
  try {
    // Simulate CSV export (Excel can open CSV)
    const header = 'Job ID,Product Type,Machine,Quantity,Status,Timestamp\n';
    const rows = jobs.map(job => `${job.id},${job.productType},${job.machineName},${job.quantity},${job.status},${job.timestamp}`).join('\n');
    const csv = header + rows;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="report.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
} 