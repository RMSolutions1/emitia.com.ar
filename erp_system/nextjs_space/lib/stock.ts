import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { ensureCompanyDefaults } from '@/lib/company-setup';

type Tx = Prisma.TransactionClient;

type AdjustStockInput = {
  companyId: string;
  productId: string;
  delta: number;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  reason?: string;
  reference?: string;
  userId?: string;
  warehouseId?: string;
  tx?: Tx;
};

export async function getDefaultWarehouse(companyId: string, tx?: Tx) {
  const db = tx ?? prisma;
  let warehouse = await db.warehouse.findFirst({
    where: { companyId, isDefault: true, isActive: true },
  });

  if (!warehouse) {
    await ensureCompanyDefaults(companyId, db as Tx);
    warehouse = await db.warehouse.findFirst({
      where: { companyId, isDefault: true, isActive: true },
    });
  }

  if (!warehouse) {
    throw new Error('No se pudo obtener el depósito principal');
  }

  return warehouse;
}

export async function syncProductStockTotal(productId: string, tx?: Tx) {
  const db = tx ?? prisma;
  const levels = await db.stockLevel.findMany({
    where: { productId },
    select: { quantity: true },
  });
  const total = levels.reduce((sum, level) => sum + level.quantity, 0);

  await db.product.update({
    where: { id: productId },
    data: { stock: total },
  });

  return total;
}

export async function setProductStockInDefaultWarehouse(
  productId: string,
  companyId: string,
  quantity: number,
  minStock?: number,
  tx?: Tx
) {
  const db = tx ?? prisma;
  const warehouse = await getDefaultWarehouse(companyId, db as Tx);

  await db.stockLevel.upsert({
    where: {
      productId_warehouseId: { productId, warehouseId: warehouse.id },
    },
    create: {
      companyId,
      productId,
      warehouseId: warehouse.id,
      quantity,
      minStock: minStock ?? undefined,
    },
    update: {
      quantity,
      ...(minStock !== undefined ? { minStock } : {}),
    },
  });

  return syncProductStockTotal(productId, db as Tx);
}

export async function adjustProductStock(input: AdjustStockInput) {
  const run = async (tx: Tx) => {
    const warehouseId =
      input.warehouseId ?? (await getDefaultWarehouse(input.companyId, tx)).id;

    const existing = await tx.stockLevel.findUnique({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId,
        },
      },
    });

    const nextQty = (existing?.quantity ?? 0) + input.delta;
    if (nextQty < 0) {
      throw new Error('Stock insuficiente en depósito');
    }

    await tx.stockLevel.upsert({
      where: {
        productId_warehouseId: {
          productId: input.productId,
          warehouseId,
        },
      },
      create: {
        companyId: input.companyId,
        productId: input.productId,
        warehouseId,
        quantity: Math.max(0, input.delta),
      },
      update: {
        quantity: nextQty,
      },
    });

    await tx.stockMovement.create({
      data: {
        companyId: input.companyId,
        productId: input.productId,
        warehouseId,
        type: input.type,
        quantity: Math.abs(input.delta),
        reason: input.reason,
        reference: input.reference,
        userId: input.userId,
      },
    });

    return syncProductStockTotal(input.productId, tx);
  };

  if (input.tx) {
    return run(input.tx);
  }

  return prisma.$transaction(run);
}

export async function migrateCompanyStockToLevels(companyId: string) {
  await ensureCompanyDefaults(companyId, prisma);
  const warehouse = await getDefaultWarehouse(companyId);

  const products = await prisma.product.findMany({
    where: { companyId, active: true },
    select: { id: true, stock: true, minStock: true },
  });

  let migrated = 0;

  for (const product of products) {
    const existing = await prisma.stockLevel.findFirst({
      where: { productId: product.id, warehouseId: warehouse.id },
    });

    if (!existing) {
      await prisma.stockLevel.create({
        data: {
          companyId,
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: product.stock,
          minStock: product.minStock,
        },
      });
      migrated++;
    }
  }

  return { migrated, total: products.length, warehouseId: warehouse.id };
}

export async function getProductStockByWarehouse(productId: string, companyId: string) {
  return prisma.stockLevel.findMany({
    where: { productId, companyId },
    include: {
      warehouse: { select: { id: true, code: true, name: true, isDefault: true } },
    },
    orderBy: { warehouse: { isDefault: 'desc' } },
  });
}
