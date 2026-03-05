const { TestTemplate, TemplateParameter, User } = require('../models');
const { sequelize } = require('../models');

async function seedTemplatesForce() {
  try {
    console.log('Starting force test template seeding...');

    // Clear existing templates and parameters
    console.log('Clearing existing templates...');
    await TemplateParameter.destroy({ where: {} });
    await TestTemplate.destroy({ where: {} });

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    if (!adminUser) {
      throw new Error('Admin user not found. Please seed users first.');
    }

    // Create test templates with parameters
    const templates = [
      {
        name: 'Electronics Component Testing',
        category: 'finished_good',
        description: 'Comprehensive testing for electronic components including voltage, current, and resistance measurements',
        isActive: true,
        parameters: [
          {
            name: 'Input Voltage',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 4.5,
            maxValue: 5.5,
            unit: 'V',
            acceptableValues: ['5.0', '5.1', '4.9', '4.8']
          },
          {
            name: 'Output Current',
            type: 'numeric',
            sequenceOrder: 2,
            isMandatory: true,
            minValue: 0.8,
            maxValue: 1.2,
            unit: 'A'
          },
          {
            name: 'Resistance',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 950,
            maxValue: 1050,
            unit: 'Ω'
          },
          {
            name: 'Power Consumption',
            type: 'numeric',
            sequenceOrder: 4,
            isMandatory: false,
            minValue: 0,
            maxValue: 10,
            unit: 'W'
          },
          {
            name: 'Temperature Test',
            type: 'numeric',
            sequenceOrder: 5,
            isMandatory: true,
            minValue: 20,
            maxValue: 80,
            unit: '°C'
          }
        ]
      },
      {
        name: 'Software Performance Testing',
        category: 'wip',
        description: 'Performance testing for software applications including response time and throughput',
        isActive: true,
        parameters: [
          {
            name: 'Response Time',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 0,
            maxValue: 2000,
            unit: 'ms',
            acceptableValues: ['100', '200', '300', '400', '500']
          },
          {
            name: 'Throughput',
            type: 'numeric',
            sequenceOrder: 2,
            isMandatory: true,
            minValue: 100,
            maxValue: 10000,
            unit: 'req/s'
          },
          {
            name: 'CPU Usage',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 0,
            maxValue: 100,
            unit: '%'
          },
          {
            name: 'Memory Usage',
            type: 'numeric',
            sequenceOrder: 4,
            isMandatory: true,
            minValue: 0,
            maxValue: 8192,
            unit: 'MB'
          },
          {
            name: 'Error Rate',
            type: 'numeric',
            sequenceOrder: 5,
            isMandatory: true,
            minValue: 0,
            maxValue: 5,
            unit: '%'
          }
        ]
      },
      {
        name: 'Mechanical Stress Testing',
        category: 'raw',
        description: 'Mechanical testing for structural integrity and material properties',
        isActive: true,
        parameters: [
          {
            name: 'Tensile Strength',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 200,
            maxValue: 500,
            unit: 'MPa'
          },
          {
            name: 'Compressive Strength',
            type: 'numeric',
            sequenceOrder: 2,
            isMandatory: true,
            minValue: 150,
            maxValue: 400,
            unit: 'MPa'
          },
          {
            name: 'Hardness Test',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 40,
            maxValue: 70,
            unit: 'HRC'
          },
          {
            name: 'Impact Resistance',
            type: 'numeric',
            sequenceOrder: 4,
            isMandatory: true,
            minValue: 10,
            maxValue: 100,
            unit: 'J'
          },
          {
            name: 'Visual Inspection',
            type: 'dropdown',
            sequenceOrder: 5,
            isMandatory: true,
            dropdownOptions: ['Pass', 'Fail', 'Minor Defects', 'Major Defects'],
            acceptableValues: ['Pass', 'Minor Defects']
          }
        ]
      },
      {
        name: 'Chemical Analysis Testing',
        category: 'raw',
        description: 'Chemical composition analysis and purity testing',
        isActive: true,
        parameters: [
          {
            name: 'pH Level',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 6.5,
            maxValue: 7.5,
            unit: 'pH'
          },
          {
            name: 'Purity Percentage',
            type: 'numeric',
            sequenceOrder: 2,
            isMandatory: true,
            minValue: 95,
            maxValue: 100,
            unit: '%'
          },
          {
            name: 'Contaminant Level',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 0,
            maxValue: 0.5,
            unit: 'ppm'
          },
          {
            name: 'Color Test',
            type: 'dropdown',
            sequenceOrder: 4,
            isMandatory: false,
            dropdownOptions: ['Clear', 'Light Yellow', 'Amber', 'Brown'],
            acceptableValues: ['Clear', 'Light Yellow']
          },
          {
            name: 'Odor Test',
            type: 'boolean',
            sequenceOrder: 5,
            isMandatory: true
          }
        ]
      },
      {
        name: 'Network Connectivity Testing',
        category: 'wip',
        description: 'Network performance and connectivity testing',
        isActive: true,
        parameters: [
          {
            name: 'Latency',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 0,
            maxValue: 100,
            unit: 'ms'
          },
          {
            name: 'Bandwidth',
            type: 'numeric',
            sequenceOrder: 2,
            isMandatory: true,
            minValue: 10,
            maxValue: 1000,
            unit: 'Mbps'
          },
          {
            name: 'Packet Loss',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 0,
            maxValue: 5,
            unit: '%'
          },
          {
            name: 'Connection Stability',
            type: 'dropdown',
            sequenceOrder: 4,
            isMandatory: true,
            dropdownOptions: ['Excellent', 'Good', 'Fair', 'Poor'],
            acceptableValues: ['Excellent', 'Good']
          },
          {
            name: 'Security Check',
            type: 'boolean',
            sequenceOrder: 5,
            isMandatory: true
          }
        ]
      },
      {
        name: 'User Interface Testing',
        category: 'finished_good',
        description: 'User interface and usability testing',
        isActive: true,
        parameters: [
          {
            name: 'Loading Time',
            type: 'numeric',
            sequenceOrder: 1,
            isMandatory: true,
            minValue: 0,
            maxValue: 5000,
            unit: 'ms'
          },
          {
            name: 'Responsive Design',
            type: 'boolean',
            sequenceOrder: 2,
            isMandatory: true
          },
          {
            name: 'Accessibility Score',
            type: 'numeric',
            sequenceOrder: 3,
            isMandatory: true,
            minValue: 70,
            maxValue: 100,
            unit: 'score'
          },
          {
            name: 'User Experience Rating',
            type: 'dropdown',
            sequenceOrder: 4,
            isMandatory: true,
            dropdownOptions: ['Excellent', 'Good', 'Average', 'Poor'],
            acceptableValues: ['Excellent', 'Good', 'Average']
          },
          {
            name: 'Browser Compatibility',
            type: 'text',
            sequenceOrder: 5,
            isMandatory: false,
            maxLength: 500
          }
        ]
      }
    ];

    // Create templates and their parameters
    for (const templateData of templates) {
      const { parameters, ...templateInfo } = templateData;
      
      const template = await TestTemplate.create({
        ...templateInfo,
        createdBy: adminUser.id
      });
      console.log(`✅ Created template: ${template.name}`);

      // Create parameters for this template
      for (const paramData of parameters) {
        await TemplateParameter.create({
          ...paramData,
          templateId: template.id
        });
      }

      console.log(`   └── Created ${parameters.length} parameters`);
    }

    console.log('✅ Force test template seeding completed successfully!');
    console.log('\n📋 Created Templates:');
    templates.forEach(t => console.log(`   • ${t.name} (${t.category})`));

  } catch (error) {
    console.error('❌ Error force seeding templates:', error);
    throw error;
  }
}

// Run the seeding if called directly
if (require.main === module) {
  seedTemplatesForce()
    .then(() => {
      console.log('Force template seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Force template seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedTemplatesForce;
