"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSalesOrder(data: {
  customerId: string;
  items: { itemId: string; quantity: number; rate: number; warehouseId?: string }[];
  deliveryDate?: string;
  discountAmount?: number;
  taxRate?: number;
}) {
  try {
    // 生成简单的订单流水号 (如 SO-2026-0001)
    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const orderItems = data.items.map(item => {
      const amount = item.quantity * item.rate;
      totalAmount += amount;
      return {
        itemId: item.itemId,
        warehouseId: item.warehouseId || null,
        quantity: item.quantity,
        rate: item.rate,
        amount: amount
      };
    });

    // 商业计算：含税总价
    const discount = data.discountAmount || 0;
    const tax = data.taxRate || 0;
    const subTotal = Math.max(0, totalAmount - discount);
    const grandTotal = subTotal * (1 + tax / 100);

    // Prisma 事务：创建订单前先做库存预留校验
    await prisma.$transaction(async (tx) => {
      // 第一阶段：遍历检查每个订单行的库存是否足够，并增加预留量
      for (const item of data.items) {
        if (!item.warehouseId) throw new Error(`商品 ${item.itemId} 必须指定发货仓库`);

        const balance = await tx.stockBalance.findUnique({
          where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: item.warehouseId } }
        });

        const actual = balance?.actualQty || 0;
        const reserved = balance?.reservedQty || 0;
        const available = actual - reserved;

        if (available < item.quantity) {
          throw new Error(`库存不足防超卖拦截：商品 ${item.itemId} 可用库存仅剩 ${available} (实际:${actual}, 已预留:${reserved})`);
        }

        // 增加预留量
        if (balance) {
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { reservedQty: reserved + item.quantity }
          });
        } else {
          throw new Error(`商品 ${item.itemId} 在仓库 ${item.warehouseId} 中无库存记录，请先入库`);
        }
      }

      // 第二阶段：创建订单（状态为 Submitted，同时锁定预留库存）
      await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          totalAmount,
          discountAmount: discount,
          taxRate: tax,
          grandTotal,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          status: "Submitted",
          items: { create: orderItems }
        }
      });
    });

    revalidatePath("/selling/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建订单失败" };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const orderInfo = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (!orderInfo) throw new Error("订单不存在");

      // Completed：核销库存 + 释放预留 + 生成流水
      if (newStatus === 'Completed' && orderInfo.status !== 'Completed') {
        for (const item of orderInfo.items) {
          if (!item.warehouseId) continue;
          const balance = await tx.stockBalance.findUnique({
            where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: item.warehouseId } }
          });
          if (balance) {
            // 核心逻辑：实际库存减少，同时预留锁定解除
            const oldActual = balance.actualQty ? Number(balance.actualQty) : 0;
            const oldReserved = balance.reservedQty ? Number(balance.reservedQty) : 0;
            const oldStockValue = balance.stockValue ? Number(balance.stockValue) : 0;
            const oldValuationRate = balance.valuationRate ? Number(balance.valuationRate) : 0;

            const newActual = oldActual - item.quantity;
            const newReserved = Math.max(0, oldReserved - item.quantity);

            // 按照移动平均价扣减成本
            let appliedRate = oldValuationRate;
            let outgoingValue = item.quantity * appliedRate;
            let newStockValue = Math.max(0, oldStockValue - outgoingValue);
            let newValuationRate = newActual > 0 ? newStockValue / newActual : 0;

            // NaN 拦截
            newStockValue = isNaN(newStockValue) ? 0 : newStockValue;
            newValuationRate = isNaN(newValuationRate) ? 0 : newValuationRate;
            appliedRate = isNaN(appliedRate) ? 0 : appliedRate;

            await tx.stockBalance.update({
              where: { id: balance.id },
              data: { actualQty: newActual, reservedQty: newReserved, stockValue: newStockValue, valuationRate: newValuationRate }
            });

            await tx.stockLedger.create({
              data: {
                itemId: item.itemId,
                warehouseId: item.warehouseId,
                qtyChange: -item.quantity,
                rate: appliedRate,
                voucherType: 'SalesOrder',
                voucherNo: orderInfo.orderNumber,
              }
            });
          }
        }

        // 生成会计凭证
        const arAccount = await tx.account.findUnique({ where: { name: "应收账款" } });
        const revAccount = await tx.account.findUnique({ where: { name: "主营业务收入" } });
        const existingJournal = await tx.journalEntry.findFirst({
          where: { referenceType: "SalesOrder", referenceId: orderId }
        });
        if (arAccount && revAccount && !existingJournal) {
          const count = await tx.journalEntry.count();
          const entryNumber = `JV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
          await tx.journalEntry.create({
            data: {
              entryNumber,
              referenceType: "SalesOrder",
              referenceId: orderId,
              totalDebit: orderInfo.totalAmount,
              totalCredit: orderInfo.totalAmount,
              lines: {
                create: [
                  { accountId: arAccount.id, debit: orderInfo.totalAmount, credit: 0 },
                  { accountId: revAccount.id, debit: 0, credit: orderInfo.totalAmount }
                ]
              }
            }
          });
        }
      }

      // Cancelled：仅释放预留库存，不扣减实际库存
      if (newStatus === 'Cancelled' && orderInfo.status !== 'Cancelled') {
        // 终极反向冲销：Completed -> Cancelled 时恢复实际库存、库存金额、生成反向流水
        if (orderInfo.status === 'Completed') {
          for (const item of orderInfo.items) {
            if (!item.warehouseId) continue;

            // 1. 查出当时的扣件流水，获取出库单价
            const originalLedger = await tx.stockLedger.findFirst({
              where: {
                voucherType: 'SalesOrder',
                voucherNo: orderInfo.orderNumber,
                itemId: item.itemId,
                qtyChange: { lt: 0 }
              },
              orderBy: { createdAt: 'desc' }
            });
            const refundRate = originalLedger ? originalLedger.rate : 0;

            // 2. 恢复实际库存和价值
            const balance = await tx.stockBalance.findUnique({
              where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: item.warehouseId } }
            });

            if (balance) {
              const oldActual = balance.actualQty ? Number(balance.actualQty) : 0;
              const oldStockValue = balance.stockValue ? Number(balance.stockValue) : 0;

              const newActual = oldActual + item.quantity;
              const incomingValue = item.quantity * refundRate;
              let newStockValue = oldStockValue + incomingValue;
              let newValuationRate = newActual > 0 ? newStockValue / newActual : 0;

              // NaN 拦截
              newStockValue = isNaN(newStockValue) ? 0 : newStockValue;
              newValuationRate = isNaN(newValuationRate) ? 0 : newValuationRate;

              await tx.stockBalance.update({
                where: { id: balance.id },
                data: { actualQty: newActual, stockValue: newStockValue, valuationRate: newValuationRate }
              });

              // 3. 写入反向库存流水 (正数)
              await tx.stockLedger.create({
                data: {
                  itemId: item.itemId,
                  warehouseId: item.warehouseId,
                  qtyChange: item.quantity,
                  rate: refundRate,
                  voucherType: 'SalesOrder-Cancel',
                  voucherNo: orderInfo.orderNumber
                }
              });
            }
          }
        } else {
          // Draft/Submitted -> Cancelled：仅释放预留
          for (const item of orderInfo.items) {
            if (!item.warehouseId) continue;
            const balance = await tx.stockBalance.findUnique({
              where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: item.warehouseId } }
            });
            if (balance) {
              await tx.stockBalance.update({
                where: { id: balance.id },
                data: { reservedQty: Math.max(0, balance.reservedQty - item.quantity) }
              });
            }
          }
        }
      }

      // 更新订单状态
      await tx.salesOrder.update({ where: { id: orderId }, data: { status: newStatus } });
    });

    revalidatePath(`/selling/orders/${orderId}`);
    revalidatePath("/selling/orders");
    revalidatePath("/accounting/journals");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新状态失败" };
  }
}
