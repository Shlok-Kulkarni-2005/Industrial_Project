import { NextRequest, NextResponse } from 'next/server';

export interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'system' | 'job' | 'manager';
  timestamp: string;
}

// In-memory alerts store
let alerts: Alert[] = [
  { id: 1, title: 'Maintenance', message: 'Machine Cutting MC/1 requires maintenance', type: 'system', timestamp: new Date().toISOString() },
  { id: 2, title: 'Job Complete', message: 'Job #1 completed', type: 'job', timestamp: new Date().toISOString() },
];
let alertIdCounter = 3;

export async function GET() {
  try {
    // Return alerts sorted by timestamp (descending)
    const sortedAlerts = alerts.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({ alerts: sortedAlerts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, timestamp } = body;
    if (!title || !message || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const alert: Alert = {
      id: alertIdCounter++,
      title,
      message,
      type: 'manager',
      timestamp,
    };
    alerts.push(alert);
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 