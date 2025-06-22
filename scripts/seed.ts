import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.jobChecklistItem.deleteMany()
  await prisma.dispatch.deleteMany()
  await prisma.job.deleteMany()
  await prisma.machine.deleteMany()
  await prisma.product.deleteMany()
  await prisma.operator.deleteMany()
  await prisma.operatorOTP.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.oTP.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create sample machines
  const machines = await Promise.all([
    prisma.machine.create({
      data: {
        name: 'Cutting MC/1',
        status: 'ON',
        location: 'Production Floor A',
        description: 'Primary cutting machine for metal sheets'
      }
    }),
    prisma.machine.create({
      data: {
        name: 'Milling 1',
        status: 'ON',
        location: 'Production Floor B',
        description: 'Precision milling machine'
      }
    }),
    prisma.machine.create({
      data: {
        name: 'Milling 2',
        status: 'OFF',
        location: 'Production Floor B',
        description: 'Secondary milling machine'
      }
    }),
    prisma.machine.create({
      data: {
        name: 'Drilling',
        status: 'ON',
        location: 'Production Floor C',
        description: 'High-speed drilling machine'
      }
    }),
    prisma.machine.create({
      data: {
        name: 'CNC Finish',
        status: 'ON',
        location: 'Production Floor A',
        description: 'CNC finishing machine'
      }
    })
  ])

  console.log('🏭 Created machines:', machines.length)

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Product A',
        description: 'High-quality metal component',
        costPerUnit: 25.50
      }
    }),
    prisma.product.create({
      data: {
        name: 'Product B',
        description: 'Precision machined part',
        costPerUnit: 45.75
      }
    }),
    prisma.product.create({
      data: {
        name: 'Product C',
        description: 'Industrial fastener',
        costPerUnit: 12.25
      }
    }),
    prisma.product.create({
      data: {
        name: 'Product D',
        description: 'Custom bracket assembly',
        costPerUnit: 67.80
      }
    }),
    prisma.product.create({
      data: {
        name: 'Product E',
        description: 'Specialty connector',
        costPerUnit: 89.99
      }
    })
  ])

  console.log('📦 Created products:', products.length)

  // Create sample operators
  const operators = await Promise.all([
    prisma.operator.create({
      data: {
        phone: '+1234567890',
        username: 'John Operator'
      }
    }),
    prisma.operator.create({
      data: {
        phone: '+1234567891',
        username: 'Sarah Technician'
      }
    }),
    prisma.operator.create({
      data: {
        phone: '+1234567892',
        username: 'Mike Engineer'
      }
    })
  ])

  console.log('👷 Created operators:', operators.length)

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        machineId: machines[0].id, // Cutting MC/1
        productId: products[0].id, // Product A
        operatorId: operators[0].id,
        quantity: 100,
        status: 'PENDING',
        stage: 'INITIAL',
        costPerUnit: products[0].costPerUnit,
        totalCost: products[0].costPerUnit * 100,
        checklistItems: {
          create: [
            { label: 'Quality Check', required: true, order: 1 },
            { label: 'Deburring', required: true, order: 2 },
            { label: 'Final Inspection', required: true, order: 3 },
            { label: 'Oiling', required: false, order: 4 }
          ]
        }
      }
    }),
    prisma.job.create({
      data: {
        machineId: machines[1].id, // Milling 1
        productId: products[1].id, // Product B
        operatorId: operators[1].id,
        quantity: 50,
        status: 'IN_PROGRESS',
        stage: 'PROCESSING',
        costPerUnit: products[1].costPerUnit,
        totalCost: products[1].costPerUnit * 50,
        checklistItems: {
          create: [
            { label: 'Quality Check', required: true, order: 1 },
            { label: 'Deburring', required: true, order: 2 },
            { label: 'Final Inspection', required: true, order: 3 },
            { label: 'Oiling', required: false, order: 4 }
          ]
        }
      }
    }),
    prisma.job.create({
      data: {
        machineId: machines[3].id, // Drilling
        productId: products[2].id, // Product C
        operatorId: operators[2].id,
        quantity: 200,
        status: 'FINISHED',
        stage: 'FINISHED',
        costPerUnit: products[2].costPerUnit,
        totalCost: products[2].costPerUnit * 200,
        checklistItems: {
          create: [
            { label: 'Quality Check', required: true, order: 1, checked: true },
            { label: 'Deburring', required: true, order: 2, checked: true },
            { label: 'Final Inspection', required: true, order: 3, checked: true },
            { label: 'Oiling', required: false, order: 4, checked: true }
          ]
        }
      }
    })
  ])

  console.log('📋 Created jobs:', jobs.length)

  // Create sample users (managers)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'manager@trackopz.com',
        password: '$2a$10$example.hash.for.password',
        name: 'John Manager',
        role: 'manager'
      }
    }),
    prisma.user.create({
      data: {
        email: 'admin@trackopz.com',
        password: '$2a$10$example.hash.for.password',
        name: 'Admin User',
        role: 'manager'
      }
    })
  ])

  console.log('👤 Created users:', users.length)

  // Create sample alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        title: 'Machine Maintenance Due',
        message: 'Cutting MC/1 requires scheduled maintenance',
        type: 'SYSTEM',
        sentBy: users[0].id
      }
    }),
    prisma.alert.create({
      data: {
        title: 'Job Completed',
        message: 'Job #3 has been completed successfully',
        type: 'JOB',
        sentBy: users[0].id
      }
    })
  ])

  console.log('🔔 Created alerts:', alerts.length)

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   Machines: ${machines.length}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Operators: ${operators.length}`)
  console.log(`   Jobs: ${jobs.length}`)
  console.log(`   Users: ${users.length}`)
  console.log(`   Alerts: ${alerts.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 