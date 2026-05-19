"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDeliveryNote(data: {
  customerId: string;
  customerName: string;
  salesOrderId?: string;
  deliveryDate: string;
  notes?: string;
  maker?: string;
  items: {
    itemId: string;
    itemName: string;
    itemCode?: string;
    specifications?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}) {
  try {
    // 生成送货单号 (如 HB2026050019)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await prisma.deliveryNote.count();
    const seq = String(count + 1).padStart(4, '0');
    const deliveryNo = `HB${year}${month}${day}${seq}`;

    // 计算每行的税额和金额
    let subtotal = 0;
    let totalTax = 0;
    const noteItems = data.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || 13;
      const taxAmount = lineTotal * (taxRate / 100);
      subtotal += lineTotal;
      totalTax += taxAmount;
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode || null,
        specifications: item.specifications || null,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        lineTotal: lineTotal + taxAmount,
      };
    });

    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        deliveryNo,
        customerId: data.customerId,
        customerName: data.customerName,
        salesOrderId: data.salesOrderId || null,
        deliveryDate: new Date(data.deliveryDate),
        totalAmount: subtotal + totalTax,
        status: "Draft",
        notes: data.notes || null,
        maker: data.maker || null,
        items: {
          create: noteItems
        }
      }
    });

    revalidatePath("/delivery/notes");
    return { success: true, deliveryNote };
  } catch (error: any) {
    return { error: error.message || "创建送货单失败" };
  }
}

export async function updateDeliveryNoteStatus(deliveryNoteId: string, newStatus: string) {
  try {
    const note = await prisma.deliveryNote.findUnique({ where: { id: deliveryNoteId } });
    if (!note) throw new Error("送货单不存在");

    await prisma.deliveryNote.update({
      where: { id: deliveryNoteId },
      data: { status: newStatus }
    });

    revalidatePath(`/delivery/notes/${deliveryNoteId}`);
    revalidatePath("/delivery/notes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新送货单状态失败" };
  }
}

export async function deleteDeliveryNote(deliveryNoteId: string) {
  try {
    await prisma.deliveryNote.delete({ where: { id: deliveryNoteId } });
    revalidatePath("/delivery/notes");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除送货单失败" };
  }
}