import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../jobs/route';

export async function GET() {
  try {
    const dispatched = jobs.filter((job: Job) => job.status === 'Completed').map(job => ({
      productType: job.productType,
      dispatchDate: job.timestamp,
      cost: job.quantity * 100, // Example static cost per unit
      units: job.quantity,
    }));
    return NextResponse.json({ dispatched }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dispatched details' }, { status: 500 });
  }
} 