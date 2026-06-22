import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redisClient } from '@/lib/redis';

/**
 * Readiness probe.
 * Verifies that the server is ready to accept traffic by checking
 * upstream dependencies (PostgreSQL and Redis).
 */
export async function GET() {
  try {
    // Check DB Connection (simple query)
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis Connection
    if (redisClient.isOpen) {
      await redisClient.ping();
    } else {
      // Connect if not already connected
      await redisClient.connect();
      await redisClient.ping();
    }

    return NextResponse.json(
      { status: 'ready', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Upstream dependency failure' },
      { status: 503 }
    );
  }
}
