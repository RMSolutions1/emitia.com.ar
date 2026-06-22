import prisma from '@/lib/db';

export const PLATFORM_PLANS = [
  {
    code: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'ARS',
    limits: {
      users: 1,
      pos: 1,
      warehouses: 1,
      branches: 1,
      invoicesPerMonth: 50,
    },
    features: {
      afip: false,
      pos: true,
      treasury: false,
      reports: 'basic',
    },
    sortOrder: 0,
  },
  {
    code: 'gestion',
    name: 'Gestión',
    priceMonthly: 14900,
    priceYearly: 149000,
    currency: 'ARS',
    limits: {
      users: 5,
      pos: 3,
      warehouses: 3,
      branches: 2,
      invoicesPerMonth: 500,
    },
    features: {
      afip: true,
      pos: true,
      treasury: true,
      reports: 'standard',
    },
    sortOrder: 1,
  },
  {
    code: 'empresa',
    name: 'Empresa',
    priceMonthly: 34900,
    priceYearly: 349000,
    currency: 'ARS',
    limits: {
      users: 20,
      pos: 10,
      warehouses: 10,
      branches: 10,
      invoicesPerMonth: -1,
    },
    features: {
      afip: true,
      pos: true,
      treasury: true,
      reports: 'advanced',
      multiBranch: true,
    },
    sortOrder: 2,
  },
] as const;

export async function ensurePlatformPlans() {
  for (const plan of PLATFORM_PLANS) {
    await prisma.platformPlan.upsert({
      where: { code: plan.code },
      create: {
        code: plan.code,
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        limits: JSON.stringify(plan.limits),
        features: JSON.stringify(plan.features),
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        limits: JSON.stringify(plan.limits),
        features: JSON.stringify(plan.features),
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });
  }
}
