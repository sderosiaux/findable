import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedDemoDatabase() {
  console.log('Seeding demo data...');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'Demo organization for testing Findable',
      plan: 'PRO',
    },
  });

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@findable.ai' },
    update: {},
    create: {
      email: 'demo@findable.ai',
      password: hashedPassword,
      name: 'Demo User',
      organizationId: organization.id,
      role: 'OWNER',
      emailVerified: true,
    },
  });

  // Create demo project
  const project = await prisma.project.upsert({
    where: { slug: 'sendgrid-alternative' },
    update: {},
    create: {
      name: 'SendGrid Alternative',
      slug: 'sendgrid-alternative',
      domain: 'https://resend.com',
      oneLiner: 'Email API for developers',
      competitors: ['sendgrid.com', 'mailgun.com', 'ses.amazonaws.com'],
      keywords: ['email api', 'transactional email', 'developer email', 'smtp api'],
      organizationId: organization.id,
      settings: {
        monitoring: true,
        alerts: true,
      },
      isActive: true,
    },
  });

  // Create demo queries
  const queries = [
    {
      text: 'Best email API for sending transactional emails',
      category: 'product' as const,
      tags: ['email', 'api', 'transactional'],
    },
    {
      text: 'SendGrid alternative for developers',
      category: 'competitor' as const,
      tags: ['sendgrid', 'alternative'],
    },
    {
      text: 'How to send emails programmatically',
      category: 'general' as const,
      tags: ['tutorial', 'programming'],
    },
    {
      text: 'SMTP vs REST API for email delivery',
      category: 'general' as const,
      tags: ['smtp', 'rest', 'comparison'],
    },
  ];

  for (const queryData of queries) {
    await prisma.query.upsert({
      where: { text: queryData.text },
      update: {},
      create: {
        ...queryData,
        projectId: project.id,
      },
    });
  }

  // Create demo run session
  const session = await prisma.runSession.create({
    data: {
      projectId: project.id,
      status: 'COMPLETED',
      priority: 'normal',
      startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      completedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      metadata: {
        queries: queries.map(q => q.text),
        models: ['gpt-4', 'claude-3-opus'],
        surfaces: ['web'],
      },
    },
  });

  // Create demo metrics
  const metricTypes = ['presence', 'pick_rate', 'snippet_health', 'citations'] as const;
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // i days ago

    for (const metricType of metricTypes) {
      let value: number;
      switch (metricType) {
        case 'presence':
          value = 0.6 + Math.random() * 0.3; // 60-90%
          break;
        case 'pick_rate':
          value = 0.15 + Math.random() * 0.25; // 15-40%
          break;
        case 'snippet_health':
          value = 0.7 + Math.random() * 0.25; // 70-95%
          break;
        case 'citations':
          value = 0.5 + Math.random() * 0.3; // 50-80%
          break;
      }

      await prisma.metric.create({
        data: {
          projectId: project.id,
          metricType,
          value: Number(value.toFixed(3)),
          time: date,
          metadata: {
            generated: true,
            day: date.toISOString().split('T')[0],
          },
        },
      });
    }
  }

  console.log('Demo data seeded successfully');
  console.log(`Demo login: demo@findable.ai / demo123!`);
}

if (require.main === module) {
  seedDemoDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}