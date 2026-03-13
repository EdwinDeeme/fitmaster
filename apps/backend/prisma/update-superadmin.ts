import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSuperAdmin() {
  console.log('🔄 Actualizando SUPER_ADMIN...');

  // Actualizar el SUPER_ADMIN existente para que no tenga gymId
  const result = await prisma.user.updateMany({
    where: {
      role: 'SUPER_ADMIN',
      email: 'superadmin@fitmaster.com',
    },
    data: {
      gymId: null,
    },
  });

  console.log(`✅ Actualizado ${result.count} usuario(s)`);
}

updateSuperAdmin()
  .catch((e) => {
    console.error('❌ Error actualizando SUPER_ADMIN:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
