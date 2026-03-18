import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(data: {
  email: string;
  gymId: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  passwordHash: string;
}) {
  const existing = await prisma.user.findFirst({ where: { email: data.email } });
  if (existing) return existing;
  await prisma.$executeRaw`
    INSERT INTO users (id, gym_id, email, password_hash, role, first_name, last_name, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      ${data.gymId}::uuid,
      ${data.email},
      ${data.passwordHash},
      ${data.role}::"UserRole",
      ${data.firstName},
      ${data.lastName},
      NOW(),
      NOW()
    )
  `;
  return prisma.user.findFirst({ where: { email: data.email } });
}

async function seedAuth() {
  console.log('🌱 Seeding authentication data...');

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

  console.log(`✅ Gym: ${gym.name} (${gym.id})`);

  const passwordHash = await bcrypt.hash('SecurePass123!', 12);

  const superAdmin = await upsertUser({ email: 'superadmin@fitmaster.com', gymId: null, role: UserRole.SUPER_ADMIN, firstName: 'Super', lastName: 'Admin', passwordHash });
  const gymAdmin   = await upsertUser({ email: 'admin@testgym.com',        gymId: gym.id, role: UserRole.GYM_ADMIN,   firstName: 'Gym',   lastName: 'Admin',        passwordHash });
  const trainer    = await upsertUser({ email: 'trainer@testgym.com',      gymId: gym.id, role: UserRole.TRAINER,     firstName: 'John',  lastName: 'Trainer',      passwordHash });
  const receptionist = await upsertUser({ email: 'receptionist@testgym.com', gymId: gym.id, role: UserRole.RECEPTIONIST, firstName: 'Jane', lastName: 'Receptionist', passwordHash });

  console.log('✅ Users:');
  console.log(`  - ${superAdmin.role}: ${superAdmin.email}`);
  console.log(`  - ${gymAdmin.role}: ${gymAdmin.email}`);
  console.log(`  - ${trainer.role}: ${trainer.email}`);
  console.log(`  - ${receptionist.role}: ${receptionist.email}`);
  console.log('\n🔑 Password: SecurePass123!');
}

seedAuth()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
