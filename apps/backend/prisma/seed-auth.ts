import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAuth() {
  console.log('🌱 Seeding authentication data...');

  // Create test gym
  const gym = await prisma.gym.upsert({
    where: { subdomain: 'testgym' },
    update: {},
    create: {
      name: 'Test Gym',
      subdomain: 'testgym',
      country: 'CR',
      timezone: 'America/Costa_Rica',
    },
  });

  console.log(`✅ Created gym: ${gym.name} (${gym.id})`);

  // Create test users
  const password = await bcrypt.hash('SecurePass123!', 12);

  // SUPER_ADMIN - No tiene gymId porque administra toda la plataforma
  const superAdmin = await prisma.user.upsert({
    where: {
      email: 'superadmin@fitmaster.com',
    },
    update: {},
    create: {
      gymId: null, // SUPER_ADMIN no pertenece a ningún gimnasio
      email: 'superadmin@fitmaster.com',
      passwordHash: password,
      role: UserRole.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  // Usuarios del gimnasio - Estos SÍ tienen gymId
  const gymAdmin = await prisma.user.upsert({
    where: {
      email: 'admin@testgym.com',
    },
    update: {},
    create: {
      gymId: gym.id,
      email: 'admin@testgym.com',
      passwordHash: password,
      role: UserRole.GYM_ADMIN,
      firstName: 'Gym',
      lastName: 'Admin',
    },
  });

  const trainer = await prisma.user.upsert({
    where: {
      email: 'trainer@testgym.com',
    },
    update: {},
    create: {
      gymId: gym.id,
      email: 'trainer@testgym.com',
      passwordHash: password,
      role: UserRole.TRAINER,
      firstName: 'John',
      lastName: 'Trainer',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: {
      email: 'receptionist@testgym.com',
    },
    update: {},
    create: {
      gymId: gym.id,
      email: 'receptionist@testgym.com',
      passwordHash: password,
      role: UserRole.RECEPTIONIST,
      firstName: 'Jane',
      lastName: 'Receptionist',
    },
  });

  console.log('✅ Created test users:');
  console.log(`  - Super Admin: ${superAdmin.email}`);
  console.log(`  - Gym Admin: ${gymAdmin.email}`);
  console.log(`  - Trainer: ${trainer.email}`);
  console.log(`  - Receptionist: ${receptionist.email}`);
  console.log('\n🔑 All users have password: SecurePass123!');
}

seedAuth()
  .catch((e) => {
    console.error('❌ Error seeding auth data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
