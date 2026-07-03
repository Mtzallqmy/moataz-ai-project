import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mtzallqmy@gmail.com';

async function seedAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!existing && !adminPassword) {
    throw new Error(
      'ADMIN_PASSWORD environment variable is required to create the Super Admin account. ' +
        'Set it securely (never commit it) and re-run the seed.'
    );
  }

  const data: {
    role: Role;
    emailVerified: Date;
    name: string;
    password?: string;
  } = {
    role: Role.SUPER_ADMIN,
    emailVerified: new Date(),
    name: 'Moataz (Super Admin)',
  };

  // Only rotate the password when one is explicitly provided via env.
  if (adminPassword) {
    data.password = await bcrypt.hash(adminPassword, 12);
  }

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: data,
    create: {
      email: ADMIN_EMAIL,
      password: data.password!,
      name: data.name,
      role: Role.SUPER_ADMIN,
      emailVerified: data.emailVerified,
      preference: {
        create: { theme: 'dark', defaultModel: 'gemini-2.5-flash' },
      },
      subscription: {
        create: {
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`[seed] Super Admin ${admin.email} provisioned (role=${admin.role}).`);
}

async function seedProviders() {
  const providers: Array<{ name: string; apiType: string; baseUrl?: string }> = [
    { name: 'prov-google', apiType: 'gemini' },
    { name: 'prov-openai', apiType: 'openai', baseUrl: 'https://api.openai.com/v1' },
    { name: 'prov-anthropic', apiType: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
    { name: 'prov-groq', apiType: 'openai', baseUrl: 'https://api.groq.com/openai/v1' },
    { name: 'prov-deepseek', apiType: 'openai', baseUrl: 'https://api.deepseek.com/v1' },
    { name: 'prov-xai', apiType: 'openai', baseUrl: 'https://api.x.ai/v1' },
    { name: 'prov-mistral', apiType: 'openai', baseUrl: 'https://api.mistral.ai/v1' },
    { name: 'prov-openrouter', apiType: 'openai', baseUrl: 'https://openrouter.ai/api/v1' },
  ];

  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { name: provider.name },
      update: { apiType: provider.apiType, baseUrl: provider.baseUrl },
      create: {
        name: provider.name,
        apiType: provider.apiType,
        baseUrl: provider.baseUrl,
        isActive: true,
      },
    });
  }

  console.log(`[seed] ${providers.length} AI providers provisioned.`);
}

async function seedSystemSettings() {
  const defaults: Record<string, unknown> = {
    localization: { defaultLanguage: 'en', defaultTimezone: 'UTC' },
    appearance: { brandColor: 'blue', logoUrl: '' },
    organization: {
      name: 'Moataz AI',
      maxProjectsPerUser: 25,
      maxFilesPerProject: 100,
      maxStorageBytesPerProject: 262144000,
    },
    featureFlags: {
      enableStreaming: true,
      enablePromptLibrary: true,
      enableKnowledgeBase: true,
      enableBilling: true,
      enableRegistration: true,
    },
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as object },
    });
  }

  console.log('[seed] System settings provisioned.');
}

async function main() {
  await seedAdmin();
  await seedProviders();
  await seedSystemSettings();
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
