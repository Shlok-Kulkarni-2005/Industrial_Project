import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateRange = searchParams.get('dateRange'); // 'today', 'week', 'month', 'all'

    let dateFilter: any = {};
    
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const start = new Date(now);
      
      switch (dateRange) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
      }
      
      dateFilter = {
        dispatchedAt: {
          gte: start,
          lte: now
        }
      };
    }

    // Get dispatched jobs with their details
    const dispatchedJobs = await prisma.job.findMany({
      where: {
        status: 'DISPATCHED',
        ...dateFilter
      },
      include: {
        product: true,
        machine: true,
        operator: true,
        dispatches: true
      },
      orderBy: { dispatchedAt: 'desc' }
    });

    // Group by product type
    const productDispatchMap: Record<string, any> = {};
    
    dispatchedJobs.forEach(job => {
      const productName = job.product.name;
      
      if (!productDispatchMap[productName]) {
        productDispatchMap[productName] = {
          productType: productName,
          totalQuantity: 0,
          totalCost: 0,
          dispatchCount: 0,
          dispatchDates: [],
          machines: new Set(),
          operators: new Set()
        };
      }
      
      productDispatchMap[productName].totalQuantity += job.quantity;
      productDispatchMap[productName].totalCost += job.totalCost;
      productDispatchMap[productName].dispatchCount += 1;
      productDispatchMap[productName].dispatchDates.push(job.dispatchedAt);
      productDispatchMap[productName].machines.add(job.machine.name);
      if (job.operator) {
        productDispatchMap[productName].operators.add(job.operator.username);
      }
    });

    // Convert to array format
    const dispatched = Object.values(productDispatchMap).map((item: any) => ({
      productType: item.productType,
      totalQuantity: item.totalQuantity,
      totalCost: item.totalCost,
      dispatchCount: item.dispatchCount,
      averageCostPerUnit: item.totalQuantity > 0 ? item.totalCost / item.totalQuantity : 0,
      lastDispatchDate: item.dispatchDates.length > 0 ? 
        new Date(Math.max(...item.dispatchDates.map((d: Date) => d.getTime()))) : null,
      machines: Array.from(item.machines),
      operators: Array.from(item.operators),
      dispatchDates: item.dispatchDates.sort((a: Date, b: Date) => b.getTime() - a.getTime())
    }));

    // Calculate overall totals
    const totalDispatched = dispatched.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalCost = dispatched.reduce((sum, item) => sum + item.totalCost, 0);
    const totalDispatchCount = dispatched.reduce((sum, item) => sum + item.dispatchCount, 0);

    return NextResponse.json({
      dispatched,
      summary: {
        totalProducts: dispatched.length,
        totalDispatched,
        totalCost,
        totalDispatchCount,
        averageCostPerUnit: totalDispatched > 0 ? totalCost / totalDispatched : 0
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching dispatched details:', error);
    return NextResponse.json({ error: 'Failed to fetch dispatched details' }, { status: 500 });
  }
} 