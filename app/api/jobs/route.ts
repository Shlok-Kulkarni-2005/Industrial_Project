import { NextRequest, NextResponse } from 'next/server';

// In-memory store for jobs
let jobs: Job[] = [];
let jobIdCounter = 1;

export interface Job {
  id: number;
  machineName: string;
  status: 'ON' | 'OFF' | 'MAINTENANCE' | 'IDLE';
  productType: string;
  quantity: number;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineName, status, productType, quantity, timestamp } = body;
    if (!machineName || !status || !productType || !quantity || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (status !== 'ON') {
      return NextResponse.json({ error: 'Status must be ON to add job' }, { status: 400 });
    }
    const job: Job = {
      id: jobIdCounter++,
      machineName,
      status,
      productType,
      quantity,
      timestamp,
    };
    jobs.push(job);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }
    const body = await req.json();
    const job = jobs.find(j => j.id === id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (body.machineName) job.machineName = body.machineName;
    if (body.productType) job.productType = body.productType;
    if (body.quantity) job.quantity = body.quantity;
    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 