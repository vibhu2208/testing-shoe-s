const seedUsers = require('./seed-users');
const seedTemplates = require('./seed-templates');

async function seedAll() {
  try {
    console.log('🌱 Starting complete database seeding...\n');

    // Seed users first
    await seedUsers();
    console.log('\n');

    // Seed templates
    await seedTemplates();

    console.log('\n🎉 Complete database seeding finished successfully!');
    console.log('\n📊 Database is now ready for testing with:');
    console.log('   • 5 default users (admin, qa, 2 testers, company)');
    console.log('   • 6 comprehensive test templates');
    console.log('   • 30+ test parameters across different categories');

  } catch (error) {
    console.error('❌ Error during complete seeding:', error);
    throw error;
  }
}

// Run the seeding if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('Complete seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Complete seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedAll;
