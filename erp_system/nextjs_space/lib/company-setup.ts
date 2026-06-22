import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export async function ensureCompanyDefaults(companyId: string, tx: Tx) {
  const existingBranch = await tx.branch.findFirst({
    where: { companyId, isDefault: true },
  });

  const branch =
    existingBranch ??
    (await tx.branch.create({
      data: {
        companyId,
        code: 'CENTRAL',
        name: 'Sucursal Central',
        isDefault: true,
        isActive: true,
      },
    }));

  const existingWarehouse = await tx.warehouse.findFirst({
    where: { companyId, isDefault: true },
  });

  const warehouse =
    existingWarehouse ??
    (await tx.warehouse.create({
      data: {
        companyId,
        branchId: branch.id,
        code: 'DEP-01',
        name: 'Depósito Principal',
        isDefault: true,
        isActive: true,
      },
    }));

  const existingPos = await tx.pointOfSale.findFirst({
    where: { companyId, number: 1 },
  });

  if (!existingPos) {
    await tx.pointOfSale.create({
      data: {
        companyId,
        branchId: branch.id,
        number: 1,
        name: 'Punto de Venta 1',
        isActive: true,
      },
    });
  }

  return { branch, warehouse };
}
