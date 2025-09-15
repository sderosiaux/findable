import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedModels() {
  console.log('Seeding AI models...');

  const models = [
    {
      name: 'gpt-4',
      provider: 'OpenAI',
      description: 'Most capable GPT-4 model',
      maxTokens: 8192,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'gpt-4-turbo',
      provider: 'OpenAI',
      description: 'Faster and more efficient GPT-4',
      maxTokens: 128000,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'gpt-3.5-turbo',
      provider: 'OpenAI',
      description: 'Fast and cost-effective model',
      maxTokens: 16385,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'claude-3-opus',
      provider: 'Anthropic',
      description: 'Most powerful Claude model',
      maxTokens: 200000,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'claude-3-sonnet',
      provider: 'Anthropic',
      description: 'Balanced Claude model',
      maxTokens: 200000,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'claude-3-haiku',
      provider: 'Anthropic',
      description: 'Fast and efficient Claude model',
      maxTokens: 200000,
      isActive: true,
      config: {
        temperature: 0.7,
        top_p: 1.0,
      },
    },
    {
      name: 'perplexity',
      provider: 'Perplexity',
      description: 'Real-time web search enabled AI',
      maxTokens: 4096,
      isActive: true,
      config: {
        temperature: 0.7,
        search_enabled: true,
      },
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { name: model.name },
      update: model,
      create: model,
    });
  }

  console.log('AI models seeded successfully');
}

if (require.main === module) {
  seedModels()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}