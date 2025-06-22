import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeJobs = searchParams.get('includeJobs') === 'true';

    const operators = await prisma.operator.findMany({
      include: includeJobs ? {
        jobs: {
          include: {
            product: true,
            machine: true
          },
          orderBy: { createdAt: 'desc' }
        }
      } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ operators }, { status: 200 });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json({ error: 'Failed to fetch operators' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, username, profileImage } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const operator = await prisma.operator.create({
      data: {
        phone,
        username,
        profileImage
      }
    });

    return NextResponse.json({ operator }, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    
    if (!id) {
      return NextResponse.json({ error: 'Missing operator id' }, { status: 400 });
    }

    const body = await req.json();
    const { phone, username, profileImage } = body;

    const updateData: any = {};
    if (phone) updateData.phone = phone;
    if (username !== undefined) updateData.username = username;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const operator = await prisma.operator.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ operator }, { status: 200 });
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 });
  }
} 