import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        sentByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, type = 'MANAGER', sentBy } = body;
    
    if (!title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alertData: any = {
      title,
      message,
      type: type.toUpperCase()
    };

    // If sentBy is provided, validate the user exists
    if (sentBy) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(sentBy) }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      alertData.sentBy = parseInt(sentBy);
    }

    const alert = await prisma.alert.create({
      data: alertData,
      include: {
        sentByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 