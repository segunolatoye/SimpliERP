import { PrismaClient } from '@prisma/client/index.js'

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const getPrisma = () => {
  if (!globalForPrisma.prisma) {
    let connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
    connectionString = connectionString.replace(/(\?|&)sslmode=require/g, '');
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const pool = new Pool({ 
      connectionString,
      ssl: isLocal ? undefined : { rejectUnauthorized: false }
    })
    const adapter = new PrismaPg(pool)

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrisma()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = getPrisma()
