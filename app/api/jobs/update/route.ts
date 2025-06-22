import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    const body = await req.json();
    const { checklistItems, action } = body; // action can be 'update' or 'dispatch'

    // Validate checklist items
    if (!Array.isArray(checklistItems)) {
      return NextResponse.json({ error: 'Checklist items must be an array' }, { status: 400 });
    }

    // Get the job with checklist items
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        checklistItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Validate that all required checklist items are checked
    const requiredItems = job.checklistItems.filter(item => item.required);
    const checkedRequiredItems = checklistItems.filter((item: any) => 
      requiredItems.some(required => required.id === item.id && item.checked)
    );

    if (checkedRequiredItems.length !== requiredItems.length) {
      return NextResponse.json({ 
        error: 'All required checklist items must be checked to proceed',
        requiredItems: requiredItems.length,
        checkedRequired: checkedRequiredItems.length
      }, { status: 400 });
    }

    // Update checklist items
    await Promise.all(
      checklistItems.map((item: any) =>
        prisma.jobChecklistItem.update({
          where: { id: item.id },
          data: { checked: item.checked }
        })
      )
    );

    // Update job status based on action
    let updateData: any = {};
    
    if (action === 'update') {
      updateData.status = 'FINISHED';
      updateData.stage = 'FINISHED';
    } else if (action === 'dispatch') {
      updateData.status = 'DISPATCHED';
      updateData.stage = 'DISPATCHED';
      updateData.dispatchedAt = new Date();
      
      // Create dispatch record
      await prisma.dispatch.create({
        data: {
          jobId: id,
          quantity: job.quantity,
          cost: job.totalCost
        }
      });
    }

    const updatedJob = await prisma.job.update({
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

    return NextResponse.json({ 
      job: updatedJob,
      message: action === 'dispatch' ? 'Job dispatched successfully' : 'Job updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 