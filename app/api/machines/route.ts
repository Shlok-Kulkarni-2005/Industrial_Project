import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const includeJobs = searchParams.get('includeJobs') === 'true';

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const machines = await prisma.machine.findMany({
      where,
      include: includeJobs ? {
        jobs: {
          include: {
            product: true,
            operator: true
          },
          orderBy: { createdAt: 'desc' }
        }
      } : undefined,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ machines }, { status: 200 });
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, status = 'OFF', location, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Machine name is required' }, { status: 400 });
    }

    const machine = await prisma.machine.create({
      data: {
        name,
        status,
        location,
        description
      }
    });

    return NextResponse.json({ machine }, { status: 201 });
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    
    if (!id) {
      return NextResponse.json({ error: 'Missing machine id' }, { status: 400 });
    }

    const body = await req.json();
    const { name, status, location, description } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;

    const machine = await prisma.machine.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ machine }, { status: 200 });
  } catch (error) {
    console.error('Error updating machine:', error);
    return NextResponse.json({ error: 'Failed to update machine' }, { status: 500 });
  }
} 