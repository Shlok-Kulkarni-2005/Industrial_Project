import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../jobs/route';

export async function GET() {
  try {
    // Return all products (productType) from jobs
    const products = jobs.map((job: Job) => ({
      id: job.id,
      name: job.productType,
      machine: job.machineName,
      quantity: job.quantity,
      timestamp: job.timestamp,
    }));
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
} 