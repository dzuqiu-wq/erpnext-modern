import { prisma } from '@/lib/prisma';
import { beforeAll, afterAll, vi } from 'vitest';

// Mock revalidatePath so server actions work outside Next.js request context
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

beforeAll(async () => {
  console.log("🟢 启动集成测试环境...");
  // 按依赖顺序清理：先删子表再删父表，避免 FK 卡死
  await prisma.journalEntryAccount.deleteMany({
    where: { journalEntry: { referenceType: 'SalesOrder' } }
  });
  await prisma.journalEntry.deleteMany({ where: { referenceType: 'SalesOrder' } });
  await prisma.stockLedger.deleteMany({ where: { voucherNo: { startsWith: 'SO-TEST-' } } });
  await prisma.salesOrderItem.deleteMany({
    where: { salesOrder: { orderNumber: { startsWith: 'SO-TEST-' } } }
  });
  await prisma.salesOrder.deleteMany({ where: { orderNumber: { startsWith: 'SO-TEST-' } } });
  await prisma.stockBalance.deleteMany({
    where: { item: { itemCode: { startsWith: 'ITEM-TEST-' } } }
  });
  await prisma.item.deleteMany({ where: { itemCode: { startsWith: 'ITEM-TEST-' } } });
  await prisma.warehouse.deleteMany({ where: { code: { startsWith: 'WH-TEST-' } } });
  await prisma.customer.deleteMany({ where: { name: { startsWith: 'TEST_' } } });
});

afterAll(async () => {
  await prisma.$disconnect();
  console.log("🔴 测试结束，数据库连接已断开。");
});
