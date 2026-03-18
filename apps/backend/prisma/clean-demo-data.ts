import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDemoData() {
  console.log('🧹 Cleaning demo data...');

  // Delete in correct order due to foreign key constraints
  await prisma.payment.deleteMany({
    where: {
      clientId: {
        in: await prisma.client.findMany({
          where: {
            email: {
              endsWith: '@demo.com'
            }
          },
          select: { id: true }
        }).then(clients => clients.map(c => c.id))
      }
    }
  });

  await prisma.membership.deleteMany({
    where: {
      clientId: {
        in: await prisma.client.findMany({
          where: {
            email: {
              endsWith: '@demo.com'
            }
          },
          select: { id: true }
        }).then(clients => clients.map(c => c.id))
      }
    }
  });

  await prisma.equipment.deleteMany({
    where: {
      name: {
        in: [
          'Cinta de Correr TechnoGym',
          'Banco de Pesas Ajustable',
          'Bicicleta Estática',
          'Máquina de Remo',
          'Rack de Sentadillas'
        ]
      }
    }
  });

  await prisma.client.deleteMany({
    where: {
      email: {
        endsWith: '@demo.com'
      }
    }
  });

  console.log('✅ Demo data cleaned successfully!');
}

cleanDemoData()
  .catch((e) => {
    console.error('❌ Error cleaning demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });