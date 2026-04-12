"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPurchaseOrder(data: {
  supplierId: string;
  items: { itemId: string; quantity: number; rate: number }[];
}) {
  try {
    const count = await prisma.purchaseOrder.count();
    const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let totalAmount = 0;
    const orderItems = data.items.map(item => {
      const amount = item.quantity * item.rate;
      totalAmount += amount;
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        rate: item.rate,
        amount: amount
      };
    });

    await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        totalAmount,
        status: "Submitted",
        items: { create: orderItems }
      }
    });

    revalidatePath("/buying/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建采购单失败" };
  }
}

export async function updatePurchaseOrderStatus(orderId: string, newStatus: string) {
  try {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: newStatus }
    });
    revalidatePath(`/buying/orders/${orderId}`);
    revalidatePath("/buying/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新状态失败" };
  }
}
