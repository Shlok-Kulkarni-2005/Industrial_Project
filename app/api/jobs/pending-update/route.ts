import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../route';

export async function GET() {
  try {
    // Simulate checklist items for each job
    const pending = jobs.filter((job: Job) => job.status === 'Waiting for Update').map((job: Job) => ({
      productId: job.id,
      machine: job.machineName,
      stage: job.productType,
      checklistItems: [
        { label: 'Deburring', checked: false },
        { label: 'Final Inspect', checked: false },
        { label: 'Oiling', checked: false },
      ],
    }));
    return NextResponse.json({ pending }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pending jobs' }, { status: 500 });
  }
} 