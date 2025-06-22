import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const date = searchParams.get('date'); // Optional: specific date, defaults to today

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Parse the product ID
    const productIdNum = parseInt(productId);
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get the product details
    const product = await prisma.product.findUnique({
      where: { id: productIdNum }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Set up date filter (default to today)
    let dateFilter: any = {};
    if (date) {
      const targetDate = new Date(date);
      dateFilter = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else {
      const today = new Date();
      dateFilter = {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999))
      };
    }

    // Get today's jobs for the selected product
    const todayJobs = await prisma.job.findMany({
      where: {
        productId: productIdNum,
        createdAt: dateFilter
      },
      include: {
        machine: true,
        operator: true,
        checklistItems: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by machine for machine-wise processing steps
    const machineMap: Record<string, any[]> = {};
    todayJobs.forEach(job => {
      const machineName = job.machine.name;
      if (!machineMap[machineName]) {
        machineMap[machineName] = [];
      }
      machineMap[machineName].push({
        id: job.id,
        quantity: job.quantity,
        status: job.status,
        stage: job.stage,
        operator: job.operator?.username || 'Unassigned',
        operatorPhone: job.operator?.phone || '',
        createdAt: job.createdAt,
        checklistItems: job.checklistItems,
        costPerUnit: job.costPerUnit,
        totalCost: job.totalCost
      });
    });

    // Calculate machine-wise statistics
    const machineStats = Object.entries(machineMap).map(([machineName, jobs]) => ({
      machineName,
      jobs,
      totalJobs: jobs.length,
      totalQuantity: jobs.reduce((sum, job) => sum + job.quantity, 0),
      totalCost: jobs.reduce((sum, job) => sum + job.totalCost, 0),
      completedJobs: jobs.filter(job => job.status === 'COMPLETED').length,
      inProgressJobs: jobs.filter(job => job.status === 'IN_PROGRESS').length,
      pendingJobs: jobs.filter(job => job.status === 'PENDING').length
    }));

    // Calculate overall statistics
    const totalJobs = todayJobs.length;
    const totalQuantity = todayJobs.reduce((sum, job) => sum + job.quantity, 0);
    const totalCost = todayJobs.reduce((sum, job) => sum + job.totalCost, 0);
    const completedJobs = todayJobs.filter(job => job.status === 'COMPLETED').length;
    const inProgressJobs = todayJobs.filter(job => job.status === 'IN_PROGRESS').length;
    const pendingJobs = todayJobs.filter(job => job.status === 'PENDING').length;

    // Get unique operators who worked on this product today
    const operators = Array.from(new Set(
      todayJobs
        .filter(job => job.operator)
        .map(job => ({
          username: job.operator!.username,
          phone: job.operator!.phone
        }))
    ));

    return NextResponse.json({ 
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        costPerUnit: product.costPerUnit
      },
      date: date || new Date().toISOString().split('T')[0],
      summary: {
        totalJobs,
        totalQuantity,
        totalCost,
        completedJobs,
        inProgressJobs,
        pendingJobs,
        totalMachines: machineStats.length,
        totalOperators: operators.length
      },
      machineStats,
      operators,
      jobs: todayJobs.map(job => ({
        id: job.id,
        machine: job.machine.name,
        operator: job.operator?.username || 'Unassigned',
        quantity: job.quantity,
        status: job.status,
        stage: job.stage,
        createdAt: job.createdAt,
        checklistItems: job.checklistItems,
        costPerUnit: job.costPerUnit,
        totalCost: job.totalCost
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
} 