import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // Optional filter by job status

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get product counts with aggregation
    const productCounts = await prisma.job.groupBy({
      by: ['productId'],
      where,
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      }
    });

    // Get product details and format response
    const productCountData = await Promise.all(
      productCounts.map(async (count) => {
        const product = await prisma.product.findUnique({
          where: { id: count.productId }
        });

        return {
          productId: count.productId,
          productName: product?.name || 'Unknown Product',
          totalQuantity: count._sum.quantity || 0,
          jobCount: count._count.id,
          costPerUnit: product?.costPerUnit || 0,
          totalCost: (count._sum.quantity || 0) * (product?.costPerUnit || 0)
        };
      })
    );

    // Calculate overall totals
    const totalQuantity = productCountData.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalCost = productCountData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalJobs = productCountData.reduce((sum, item) => sum + item.jobCount, 0);

    return NextResponse.json({
      products: productCountData,
      summary: {
        totalProducts: productCountData.length,
        totalQuantity,
        totalCost,
        totalJobs
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product counts:', error);
    return NextResponse.json({ error: 'Failed to fetch product counts' }, { status: 500 });
  }
} 