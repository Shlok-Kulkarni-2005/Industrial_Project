import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../../jobs/route';

export async function GET() {
  try {
    // Count products by productType
    const counts: Record<string, number> = {};
    jobs.forEach((job: Job) => {
      counts[job.productType] = (counts[job.productType] || 0) + job.quantity;
    });
    return NextResponse.json({ counts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product counts' }, { status: 500 });
  }
} 