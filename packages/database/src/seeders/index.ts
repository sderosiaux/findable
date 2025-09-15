import { seedModels } from './models';
import { seedDemoDatabase } from './demo-data-seeder';

async function main() {
  console.log('Starting database seeding...');

  try {
    await seedModels();
    await seedDemoDatabase();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { seedModels, seedDemoDatabase };