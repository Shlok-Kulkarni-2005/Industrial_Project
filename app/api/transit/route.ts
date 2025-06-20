import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Pending Transit feature is coming soon.' }, { status: 200 });
} 