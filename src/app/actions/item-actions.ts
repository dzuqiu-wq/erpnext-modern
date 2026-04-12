"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createItem(data: {
  itemCode: string;
  itemName: string;
  description?: string;
  standardRate: number;
  stockUom: string;
  isActive: boolean;
}) {
  try {
    const existing = await prisma.item.findUnique({ where: { itemCode: data.itemCode } });
    if (existing) return { error: "商品编码已存在，请使用唯一的编码" };

    await prisma.item.create({
      data: {
        itemCode: data.itemCode,
        itemName: data.itemName,
        description: data.description || null,
        standardRate: data.standardRate,
        stockUom: data.stockUom,
        isActive: data.isActive,
      }
    });

    revalidatePath("/selling/items");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建商品失败" };
  }
}

export async function updateItem(id: string, data: {
  itemCode: string;
  itemName: string;
  description?: string;
  standardRate: number;
  stockUom: string;
  isActive: boolean;
}) {
  try {
    // 防弹锁：停用前检查是否有正库存结存
    if (data.isActive === false) {
      const balance = await prisma.stockBalance.findFirst({
        where: { itemId: id, actualQty: { gt: 0 } }
      });
      if (balance) throw new Error("该商品当前仍有库存结存，必须先清空库存才能停用！");
    }

    await prisma.item.update({
      where: { id },
      data: {
        itemCode: data.itemCode,
        itemName: data.itemName,
        description: data.description || null,
        standardRate: data.standardRate,
        stockUom: data.stockUom,
        isActive: data.isActive,
      }
    });
    revalidatePath("/selling/items");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新商品失败" };
  }
}

export async function deleteItem(id: string) {
  try {
    // 防弹锁：检查是否有库存交易记录
    const ledgerExists = await prisma.stockLedger.findFirst({ where: { itemId: id } });
    if (ledgerExists) throw new Error("该商品已有库存交易记录，严禁物理删除！请使用编辑功能将其停用。");

    await prisma.item.delete({ where: { id } });
    revalidatePath("/selling/items");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除商品失败" };
  }
}
