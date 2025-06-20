import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../../jobs/route';

export async function GET() {
  try {
    // Find jobs with status 'ON' (active)
    const active = jobs.filter((job: Job) => job.status === 'ON').map((job: Job) => ({
      machineName: job.machineName,
      productType: job.productType,
      status: 'Processing',
    }));
    return NextResponse.json({ active }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch active products' }, { status: 500 });
  }
} 