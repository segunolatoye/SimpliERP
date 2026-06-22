import { NextResponse } from 'next/server';

/**
 * Basic liveness probe.
 * Returns 200 OK immediately if the server is running.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
