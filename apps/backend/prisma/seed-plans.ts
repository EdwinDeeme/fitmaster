import { PrismaClient, PlanInterval } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🌱 Seeding plans data...');

  // Plan Básico
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan-basic-001' },
    update: {},
    create: {
      id: 'plan-basic-001',
      name: 'Plan Básico',
      description: 'Perfecto para gimnasios pequeños que están comenzando',
      price: 50000,
      currency: 'CRC',
      interval: PlanInterval.MONTHLY,
      features: [
        'Hasta 100 clientes',
        'Hasta 3 usuarios staff',
        'Gestión de membresías',
        'Gestión de pagos',
        'Reportes básicos',
        'Soporte por email',
      ],
      limits: {
        maxClients: 100,
        maxStaff: 3,
        maxStorage: 1, // GB
        aiRoutines: false,
        customBranding: false,
        apiAccess: false,
      },
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
  });

  // Plan Profesional
  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan-pro-001' },
    update: {},
    create: {
      id: 'plan-pro-001',
      name: 'Plan Profesional',
      description: 'Ideal para gimnasios en crecimiento con necesidades avanzadas',
      price: 100000,
      currency: 'CRC',
      interval: PlanInterval.MONTHLY,
      features: [
        'Hasta 500 clientes',
        'Hasta 10 usuarios staff',
        'Gestión de membresías',
        'Gestión de pagos',
        'Rutinas con IA',
        'Reportes avanzados',
        'Gestión de equipamiento',
        'Soporte prioritario',
      ],
      limits: {
        maxClients: 500,
        maxStaff: 10,
        maxStorage: 10, // GB
        aiRoutines: true,
        customBranding: false,
        apiAccess: false,
      },
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
  });

  // Plan Enterprise
  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan-enterprise-001' },
    update: {},
    create: {
      id: 'plan-enterprise-001',
      name: 'Plan Enterprise',
      description: 'Solución completa para cadenas de gimnasios y grandes instalaciones',
      price: 200000,
      currency: 'CRC',
      interval: PlanInterval.MONTHLY,
      features: [
        'Clientes ilimitados',
        'Usuarios staff ilimitados',
        'Gestión de membresías',
        'Gestión de pagos',
        'Rutinas con IA',
        'Reportes avanzados',
        'Gestión de equipamiento',
        'Soporte 24/7',
        'API personalizada',
        'Marca blanca',
        'Múltiples ubicaciones',
      ],
      limits: {
        maxClients: -1, // Ilimitado
        maxStaff: -1, // Ilimitado
        maxStorage: 100, // GB
        aiRoutines: true,
        customBranding: true,
        apiAccess: true,
      },
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
  });

  console.log('✅ Created plans:');
  console.log(`  - ${basicPlan.name}: ${basicPlan.price} ${basicPlan.currency}/mes`);
  console.log(`  - ${proPlan.name}: ${proPlan.price} ${proPlan.currency}/mes`);
  console.log(`  - ${enterprisePlan.name}: ${enterprisePlan.price} ${enterprisePlan.currency}/mes`);
}

seedPlans()
  .catch((e) => {
    console.error('❌ Error seeding plans data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
