import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { machineId, productId, operatorId, quantity } = body;
    
    if (!machineId || !productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate machine status
    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    if (machine.status !== 'ON') {
      return NextResponse.json({ error: 'Machine must be ON to add job' }, { status: 400 });
    }

    // Get product cost
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const costPerUnit = product.costPerUnit;
    const totalCost = costPerUnit * quantity;

    // Create job with checklist items
    const job = await prisma.job.create({
      data: {
        machineId,
        productId,
        operatorId,
        quantity,
        costPerUnit,
        totalCost,
        status: 'PENDING',
        stage: 'INITIAL',
        checklistItems: {
          create: [
            { label: 'Quality Check', required: true, order: 1 },
            { label: 'Deburring', required: true, order: 2 },
            { label: 'Final Inspection', required: true, order: 3 },
            { label: 'Oiling', required: false, order: 4 }
          ]
        }
      },
      include: {
        machine: true,
        product: true,
        operator: true,
        checklistItems: true
      }
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const operatorId = searchParams.get('operatorId');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (operatorId) {
      where.operatorId = parseInt(operatorId);
    }

    const jobs = await prisma.job.findMany({
      where,
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

    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
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
    const { machineId, productId, operatorId, quantity, status, stage } = body;

    const updateData: any = {};
    
    if (machineId) updateData.machineId = machineId;
    if (productId) updateData.productId = productId;
    if (operatorId) updateData.operatorId = operatorId;
    if (quantity) updateData.quantity = quantity;
    if (status) updateData.status = status;
    if (stage) updateData.stage = stage;

    // If quantity or product changed, recalculate cost
    if (quantity || productId) {
      const job = await prisma.job.findUnique({
        where: { id },
        include: { product: true }
      });

      if (job) {
        const newQuantity = quantity || job.quantity;
        const newProductId = productId || job.productId;
        
        const product = await prisma.product.findUnique({
          where: { id: newProductId }
        });

        if (product) {
          updateData.costPerUnit = product.costPerUnit;
          updateData.totalCost = product.costPerUnit * newQuantity;
        }
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        machine: true,
        product: true,
        operator: true,
        checklistItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 