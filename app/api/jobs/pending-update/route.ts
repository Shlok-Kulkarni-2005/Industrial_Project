import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Fetch jobs that are finished and waiting for update
    const pendingJobs = await prisma.job.findMany({
      where: {
        status: 'FINISHED',
        stage: 'FINISHED'
      },
      include: {
        machine: true,
        product: true,
        operator: true,
        checklistItems: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for frontend compatibility
    const pending = pendingJobs.map(job => ({
      productId: job.id,
      machine: job.machine.name,
      stage: job.product.name,
      productType: job.product.name,
      quantity: job.quantity,
      operator: job.operator?.username || 'Unassigned',
      checklistItems: job.checklistItems.map(item => ({
        id: item.id,
        label: item.label,
        checked: item.checked,
        required: item.required,
        order: item.order
      }))
    }));

    return NextResponse.json({ pending }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch pending jobs' }, { status: 500 });
  }
} 