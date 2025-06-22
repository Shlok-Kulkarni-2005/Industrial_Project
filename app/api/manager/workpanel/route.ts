import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

function isToday(date: Date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('productType');
    const action = searchParams.get('action');

    if (action === 'getProductTypes') {
      // Get unique product types from jobs
      const productTypes = await prisma.job.groupBy({
        by: ['productId'],
        _count: {
          id: true
        }
      });

      // Get product details
      const productTypeData = await Promise.all(
        productTypes.map(async (pt) => {
          const product = await prisma.product.findUnique({
            where: { id: pt.productId }
          });

          return {
            id: pt.productId,
            name: product?.name || 'Unknown Product',
            jobCount: pt._count.id
          };
        })
      );

      return NextResponse.json({ productTypes: productTypeData }, { status: 200 });
    }

    if (!productType) {
      return NextResponse.json({ error: 'Missing productType' }, { status: 400 });
    }

    // Find the product by name
    const product = await prisma.product.findFirst({
      where: { name: productType }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get today's jobs for the selected product
    const todayJobs = await prisma.job.findMany({
      where: {
        productId: product.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
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

    // Group by machine
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
        createdAt: job.createdAt,
        checklistItems: job.checklistItems,
        costPerUnit: job.costPerUnit,
        totalCost: job.totalCost
      });
    });

    const result = Object.entries(machineMap).map(([machineName, jobs]) => ({
      machineName,
      jobs,
      totalJobs: jobs.length,
      totalQuantity: jobs.reduce((sum, job) => sum + job.quantity, 0),
      totalCost: jobs.reduce((sum, job) => sum + job.totalCost, 0)
    }));

    return NextResponse.json({ 
      jobs: result,
      summary: {
        productName: product.name,
        totalMachines: result.length,
        totalJobs: todayJobs.length,
        totalQuantity: todayJobs.reduce((sum, job) => sum + job.quantity, 0),
        totalCost: todayJobs.reduce((sum, job) => sum + job.totalCost, 0)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching work panel data:', error);
    return NextResponse.json({ error: 'Failed to fetch work panel jobs' }, { status: 500 });
  }
} 