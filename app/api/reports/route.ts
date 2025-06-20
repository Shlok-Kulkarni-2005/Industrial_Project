import { NextRequest, NextResponse } from 'next/server';
import { jobs, Job } from '../jobs/route';

function isWithinRange(dateStr: string, range: 'daily' | 'weekly' | 'monthly') {
  const date = new Date(dateStr);
  const now = new Date();
  if (range === 'daily') {
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (range === 'weekly') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo && date <= now;
  }
  if (range === 'monthly') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get('filter') as 'daily' | 'weekly' | 'monthly') || 'daily';
    const filteredJobs = jobs.filter((job: Job) => isWithinRange(job.timestamp, filter));
    const totalManufactured = filteredJobs.reduce((sum, job) => sum + job.quantity, 0);
    const dispatchedJobs = filteredJobs.filter(job => job.status === 'Completed');
    const totalDispatched = dispatchedJobs.reduce((sum, job) => sum + job.quantity, 0);
    // Simulate cost per unit and total
    const costPerUnit = 100; // Example static value
    const totalCost = totalManufactured * costPerUnit;
    return NextResponse.json({
      filter,
      totalManufactured,
      totalDispatched,
      costPerUnit,
      totalCost,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
} 