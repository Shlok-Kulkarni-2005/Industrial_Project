import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../../jobs/route';

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('productType');
    if (!productType) {
      return NextResponse.json({ error: 'Missing productType' }, { status: 400 });
    }
    // Filter jobs for the selected product type and today
    const filteredJobs = jobs.filter((job: Job) => job.productType === productType && isToday(job.timestamp));
    // Group by machine
    const machineMap: Record<string, Job[]> = {};
    filteredJobs.forEach(job => {
      if (!machineMap[job.machineName]) machineMap[job.machineName] = [];
      machineMap[job.machineName].push(job);
    });
    const result = Object.entries(machineMap).map(([machineName, jobs]) => ({
      machineName,
      jobs,
    }));
    return NextResponse.json({ jobs: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch work panel jobs' }, { status: 500 });
  }
} 