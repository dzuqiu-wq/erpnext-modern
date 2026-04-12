import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { updateOrderStatus } from '@/app/actions/order-actions';

describe('Nova ERP 核心业务引擎集成测试', () => {
  let testItemId: string;
  let testWarehouseId: string;
  let testCustomerId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // 1. 准备基础测试数据 (使用特定前缀防污染)
    const wh = await prisma.warehouse.create({
      data: { name: 'TEST_仓库_AUTO', code: 'WH-TEST-01', isActive: true }
    });
    testWarehouseId = wh.id;

    const item = await prisma.item.create({
      data: {
        itemCode: 'ITEM-TEST-01',
        itemName: '自动化测试商品',
        description: 'auto test item',
        standardRate: 100,
        stockUom: 'PCS',
        isActive: true,
      }
    });
    testItemId = item.id;

    const customer = await prisma.customer.create({
      data: { name: 'TEST_客户_AUTO', email: 'test-auto@example.com', status: 'Active' }
    });
    testCustomerId = customer.id;
  });

  it('1. 期初入库与移动加权平均价测试', async () => {
    // 模拟直接操作 Prisma 创建入库结存 (实际项目中应调用 stock-actions.ts)
    await prisma.stockBalance.create({
      data: {
        itemId: testItemId,
        warehouseId: testWarehouseId,
        actualQty: 10,
        reservedQty: 0,
        stockValue: 1500, // 10个，总价值1500
        valuationRate: 150 // 均价 150
      }
    });

    const balance = await prisma.stockBalance.findFirst({ where: { itemId: testItemId } });
    expect(balance?.actualQty).toBe(10);
    expect(balance?.valuationRate).toBe(150);
  });

  it('2. 订单创建防超卖测试 (预留库存)', async () => {
    // 创建测试订单
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: 'SO-TEST-001',
        customerId: testCustomerId,
        status: 'Submitted',
        totalAmount: 1000,
        items: {
          create: [{
            itemId: testItemId,
            warehouseId: testWarehouseId,
            quantity: 4,
            rate: 250,
            amount: 1000
          }]
        }
      }
    });
    testOrderId = order.id;

    // 模拟 createSalesOrder 中的预留逻辑
    await prisma.stockBalance.updateMany({
      where: { itemId: testItemId, warehouseId: testWarehouseId },
      data: { reservedQty: 4 }
    });

    const balance = await prisma.stockBalance.findFirst({ where: { itemId: testItemId } });
    expect(balance?.reservedQty).toBe(4);
    expect(balance?.actualQty).toBe(10); // 实际库存不应减少
  });

  it('3. 订单完成测试 (真实扣减与成本流转)', async () => {
    const res = await updateOrderStatus(testOrderId, 'Completed');
    expect(res.success).toBe(true);

    const balance = await prisma.stockBalance.findFirst({ where: { itemId: testItemId } });
    // 验证预留释放和真实扣减
    expect(balance?.reservedQty).toBe(0);
    expect(balance?.actualQty).toBe(6); // 10 - 4

    // 验证移动加权平均成本核算 (扣减的成本应为 4 * 150 = 600)
    expect(balance?.stockValue).toBe(900); // 1500 - 600
    expect(balance?.valuationRate).toBe(150);

    // 验证库存流水生成
    const ledger = await prisma.stockLedger.findFirst({ where: { voucherNo: 'SO-TEST-001' } });
    expect(ledger).toBeDefined();
    expect(ledger?.qtyChange).toBe(-4);
  });

  it('4. 订单取消冲销测试 (Cancel Reversal)', async () => {
    const res = await updateOrderStatus(testOrderId, 'Cancelled');
    expect(res.success).toBe(true);

    const balance = await prisma.stockBalance.findFirst({ where: { itemId: testItemId } });
    // 验证库存恢复
    expect(balance?.actualQty).toBe(10); // 6 + 4 恢复
    expect(balance?.stockValue).toBe(1500); // 900 + 600 恢复

    // 验证反向流水生成
    const cancelLedger = await prisma.stockLedger.findFirst({
      where: { voucherType: 'SalesOrder-Cancel', voucherNo: 'SO-TEST-001' }
    });
    expect(cancelLedger).toBeDefined();
    expect(cancelLedger?.qtyChange).toBe(4);
  });
});
