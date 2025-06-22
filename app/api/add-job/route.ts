import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

// Zod schema for request validation
const AddJobSchema = z.object({
  machineId: z.number().positive('Machine ID must be a positive number'),
  productId: z.number().positive('Product ID must be a positive number'),
  operatorId: z.number().positive('Operator ID must be a positive number').optional(),
  quantity: z.number().positive('Quantity must be a positive number'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationResult = AddJobSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { machineId, productId, operatorId, quantity } = validationResult.data;

    // Check if machine exists and is ON
    const machine = await prisma.machine.findUnique({
      where: { id: machineId }
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    if (machine.status !== 'ON') {
      return NextResponse.json({ 
        error: 'Machine must be ON to add job',
        machineStatus: machine.status 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if operator exists (if provided)
    if (operatorId) {
      const operator = await prisma.operator.findUnique({
        where: { id: operatorId }
      });

      if (!operator) {
        return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
      }
    }

    // Calculate costs
    const costPerUnit = product.costPerUnit;
    const totalCost = costPerUnit * quantity;

    // Create job with checklist items in a transaction
    const job = await prisma.$transaction(async (tx) => {
      // Create the job
      const newJob = await tx.job.create({
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
          checklistItems: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return newJob;
    });

    return NextResponse.json({ 
      job,
      message: 'Job added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding job:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: 'Job already exists with these parameters' }, { status: 409 });
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ error: 'Invalid machine, product, or operator ID' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to add job' }, { status: 500 });
  }
}

// GET endpoint to fetch available machines and products for the form
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeOffline = searchParams.get('includeOffline') === 'true';

    // Fetch machines (only ON machines by default)
    const machineWhere = includeOffline ? {} : { status: 'ON' };
    const machines = await prisma.machine.findMany({
      where: machineWhere,
      select: {
        id: true,
        name: true,
        status: true,
        location: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    // Fetch all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        costPerUnit: true
      },
      orderBy: { name: 'asc' }
    });

    // Fetch all operators
    const operators = await prisma.operator.findMany({
      select: {
        id: true,
        username: true,
        phone: true
      },
      orderBy: { username: 'asc' }
    });

    return NextResponse.json({ 
      machines, 
      products, 
      operators 
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching form data:', error);
    return NextResponse.json({ error: 'Failed to fetch form data' }, { status: 500 });
  }
} 