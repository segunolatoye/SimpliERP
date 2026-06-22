import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '@/lib/config';

// 1. Setup Redis connection specific to BullMQ
export const connection = new IORedis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  username: config.REDIS_USERNAME,
  password: config.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

// 2. Define standard queues
export const Queues = {
  default: new Queue('default', { connection: connection as any }),
  email: new Queue('email', { connection: connection as any }),
  reports: new Queue('reports', { connection: connection as any }),
};

// 3. Worker factory for easy processing
export function createWorker(queueName: keyof typeof Queues, processor: (job: Job) => Promise<any>) {
  const worker = new Worker(queueName, processor, { connection: connection as any });
  
  worker.on('completed', job => {
    console.log(`[BullMQ] Job ${job.id} completed successfully in queue ${queueName}`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error:`, err);
  });
  
  return worker;
}

export interface QueuePayloads {
  'send-email': { to: string, subject: string, body: string };
  'generate-report': { reportId: string, orgId: string };
}

// 4. Helper for type-safe enqueuing
export async function enqueue<T extends keyof QueuePayloads>(
  queueName: keyof typeof Queues,
  jobName: T,
  data: QueuePayloads[T],
  opts?: any
) {
  return Queues[queueName].add(jobName, data, opts);
}
