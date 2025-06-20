import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../route';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }
    const body = await req.json();
    const { checklistItems } = body;
    if (!Array.isArray(checklistItems) || checklistItems.some((item: any) => !item.checked)) {
      return NextResponse.json({ error: 'All checklist items must be checked to dispatch' }, { status: 400 });
    }
    const job = jobs.find(j => j.id === id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    job.status = 'Completed';
    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 