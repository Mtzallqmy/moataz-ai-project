import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'mtzallqmy@gmail.com';
  const adminPassword = 'moataz775@#$';
  
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

  // Seed default providers
  const providers = [
    { name: 'OpenAI', apiKey: 'placeholder' },
    { name: 'Anthropic', apiKey: 'placeholder' },
    { name: 'Google Gemini', apiKey: 'placeholder' },
    { name: 'DeepSeek', apiKey: 'placeholder' },
  ];

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: {},
      create: {
        name: provider.name,
        apiKey: provider.apiKey,
        isActive: true,
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
