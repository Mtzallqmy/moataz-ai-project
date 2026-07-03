import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const aiQueue = new Queue('ai-tasks', { connection });

export const aiWorker = new Worker('ai-tasks', async job => {
  console.log(`Processing job ${job.id}: ${job.name}`);
  // Background processing logic (e.g. RAG indexing, long-form generation)
  return { status: 'completed' };
}, { connection });

aiWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

aiWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});
