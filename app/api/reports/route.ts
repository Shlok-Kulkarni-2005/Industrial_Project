import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

function getDateRange(range: 'daily' | 'weekly' | 'monthly') {
  const now = new Date();
  const start = new Date(now);
  
  switch (range) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      break;
  }
  
  return { start, end: now };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get('filter') as 'daily' | 'weekly' | 'monthly') || 'daily';
    const { start, end } = getDateRange(filter);

    // Get jobs in the date range
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        product: true,
        machine: true,
        operator: true,
        dispatches: true
      }
    });

    // Calculate totals
    const totalManufactured = jobs.reduce((sum, job) => sum + job.quantity, 0);
    const totalManufacturedCost = jobs.reduce((sum, job) => sum + job.totalCost, 0);
    
    // Get dispatched jobs
    const dispatchedJobs = jobs.filter(job => job.status === 'DISPATCHED');
    const totalDispatched = dispatchedJobs.reduce((sum, job) => sum + job.quantity, 0);
    const totalDispatchedCost = dispatchedJobs.reduce((sum, job) => sum + job.totalCost, 0);

    // Get jobs by status
    const jobsByStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top products
    const productStats = jobs.reduce((acc, job) => {
      const productName = job.product.name;
      if (!acc[productName]) {
        acc[productName] = {
          quantity: 0,
          cost: 0,
          jobs: 0
        };
      }
      acc[productName].quantity += job.quantity;
      acc[productName].cost += job.totalCost;
      acc[productName].jobs += 1;
      return acc;
    }, {} as Record<string, { quantity: number; cost: number; jobs: number }>);

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        ...stats
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Get machine utilization
    const machineStats = jobs.reduce((acc, job) => {
      const machineName = job.machine.name;
      if (!acc[machineName]) {
        acc[machineName] = {
          quantity: 0,
          cost: 0,
          jobs: 0,
          status: job.machine.status
        };
      }
      acc[machineName].quantity += job.quantity;
      acc[machineName].cost += job.totalCost;
      acc[machineName].jobs += 1;
      return acc;
    }, {} as Record<string, { quantity: number; cost: number; jobs: number; status: string }>);

    const machineUtilization = Object.entries(machineStats)
      .map(([name, stats]) => ({
        name,
        ...stats
      }))
      .sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({
      filter,
      dateRange: { start, end },
      summary: {
        totalManufactured,
        totalManufacturedCost,
        totalDispatched,
        totalDispatchedCost,
        pendingQuantity: totalManufactured - totalDispatched,
        pendingCost: totalManufacturedCost - totalDispatchedCost,
        efficiency: totalManufactured > 0 ? (totalDispatched / totalManufactured) * 100 : 0
      },
      jobsByStatus,
      topProducts,
      machineUtilization,
      totalJobs: jobs.length,
      totalDispatchedJobs: dispatchedJobs.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
} 