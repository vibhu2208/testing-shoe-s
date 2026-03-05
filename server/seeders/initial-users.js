const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const hashedTesterPassword = await bcrypt.hash('tester123', 12);
    const hashedQAPassword = await bcrypt.hash('qa123', 12);
    const hashedCompanyPassword = await bcrypt.hash('company123', 12);

    const adminId = uuidv4();
    const testerId = uuidv4();
    const qaId = uuidv4();
    const companyId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: testerId,
        email: 'tester@test.com',
        password: hashedTesterPassword,
        firstName: 'John',
        lastName: 'Tester',
        role: 'tester',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: qaId,
        email: 'qa@test.com',
        password: hashedQAPassword,
        firstName: 'Jane',
        lastName: 'QA Manager',
        role: 'qa_manager',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: companyId,
        email: 'company@test.com',
        password: hashedCompanyPassword,
        firstName: 'Company',
        lastName: 'Viewer',
        role: 'company',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
