import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeJobs = searchParams.get('includeJobs') === 'true';

    if (includeJobs) {
      // Return products with their associated jobs
      const products = await prisma.product.findMany({
        include: {
          jobs: {
            include: {
              machine: true,
              operator: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ products }, { status: 200 });
    } else {
      // Return just the products
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({ products }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, costPerUnit } = body;

    if (!name || costPerUnit === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        costPerUnit: parseFloat(costPerUnit)
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
} 