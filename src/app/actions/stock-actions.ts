"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStockEntry(data: {
  itemId: string;
  warehouseId: string;
  qtyChange: number;
  voucherType: string;
  rate?: number;
}) {
  try {
    // 生成一个随机凭证号模拟流水号
    const voucherNo = `STE-${Date.now().toString().slice(-6)}`;

    // 极其重要：使用 Prisma 事务保证流水和余额的原子性
    await prisma.$transaction(async (tx) => {
      // 1. 获取当前库存快照（用于移动加权平均计算）
      const existingBalance = await tx.stockBalance.findUnique({
        where: {
          itemId_warehouseId: { itemId: data.itemId, warehouseId: data.warehouseId }
        }
      });

      // 1. 安全获取旧数据（处理老数据可能为 null/undefined 的情况）
      const oldQty = existingBalance?.actualQty ? Number(existingBalance.actualQty) : 0;
      const oldStockValue = existingBalance?.stockValue ? Number(existingBalance.stockValue) : 0;
      const oldValuationRate = existingBalance?.valuationRate ? Number(existingBalance.valuationRate) : 0;
      const safeRate = data.rate ? Number(data.rate) : 0;

      let newQty = oldQty + data.qtyChange;
      let newStockValue = 0;
      let newValuationRate = 0;
      let appliedRate = safeRate;

      if (data.qtyChange > 0) {
        // 入库：计算移动平均价
        const incomingValue = data.qtyChange * safeRate;
        newStockValue = oldStockValue + incomingValue;
        newValuationRate = newQty > 0 ? newStockValue / newQty : 0;
      } else {
        // 出库：校验库存，强制使用当前的移动平均单价
        if (newQty < 0) throw new Error(`库存不足！当前可用库存仅剩 ${oldQty}`);
        appliedRate = oldValuationRate;
        const outgoingValue = Math.abs(data.qtyChange) * appliedRate;
        newStockValue = Math.max(0, oldStockValue - outgoingValue); // 避免浮点数精度出现负数
        newValuationRate = newQty > 0 ? newStockValue / newQty : 0;
      }

      // 2. 绝对防御：拦截一切可能逃逸的 NaN，强制转为 0
      newStockValue = isNaN(newStockValue) ? 0 : newStockValue;
      newValuationRate = isNaN(newValuationRate) ? 0 : newValuationRate;
      appliedRate = isNaN(appliedRate) ? 0 : appliedRate;

      // 3. 更新或创建 Balance
      if (existingBalance) {
        await tx.stockBalance.update({
          where: { id: existingBalance.id },
          data: { actualQty: newQty, stockValue: newStockValue, valuationRate: newValuationRate }
        });
      } else {
        if (data.qtyChange < 0) throw new Error("库存不足，无法出库！");
        await tx.stockBalance.create({
          data: { itemId: data.itemId, warehouseId: data.warehouseId, actualQty: newQty, stockValue: newStockValue, valuationRate: newValuationRate }
        });
      }

      // 4. 记录库存流水 (Stock Ledger)，存入本次应用的 rate
      await tx.stockLedger.create({
        data: {
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          qtyChange: data.qtyChange,
          rate: appliedRate,
          voucherType: data.voucherType,
          voucherNo: voucherNo,
        }
      });
    });

    revalidatePath("/stock/balances");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "库存操作失败" };
  }
}
