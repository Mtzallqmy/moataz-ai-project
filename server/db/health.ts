import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkDatabaseHealth() {
  try {
    console.log('🔍 [Health Check] Checking database connection...');
    await prisma.$connect();
    console.log('✅ [Health Check] Database connected successfully.');

    // Verify critical tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Project', 'Agent', 'Workflow');
    ` as any[];

    if (tableCheck.length < 4) {
      console.warn('⚠️ [Health Check] Some critical tables are missing. Database might need migration.');
      console.log('Current tables:', tableCheck.map(t => t.table_name).join(', '));
    } else {
      console.log('✅ [Health Check] All critical tables verified.');
    }

  } catch (error) {
    console.error('❌ [Health Check] Database health check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}
