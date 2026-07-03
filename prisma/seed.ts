import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Use environment variable for admin password, fallback to generated password
  const adminEmail = 'mtzallqmy@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(16).toString('hex');
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Main Admin',
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log(`Admin user ${admin.email} has been seeded/updated.`);
  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.log(`Generated temporary password: ${adminPassword}`);
  }

  // Seed default providers with minimal configuration
  const providers = [
    { name: 'OpenAI', apiType: 'openai' },
    { name: 'Anthropic', apiType: 'anthropic' },
    { name: 'Google Gemini', apiType: 'gemini' },
    { name: 'DeepSeek', apiType: 'deepseek' },
    { name: 'Groq', apiType: 'groq' },
  ];

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: { isActive: true },
      create: {
        name: provider.name,
        apiType: provider.apiType,
        isActive: true,
        healthStatus: 'unchecked'
      },
    });
  }

  console.log('Default providers have been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
