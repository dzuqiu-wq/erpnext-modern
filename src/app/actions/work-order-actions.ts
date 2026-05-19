"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWorkOrder(data: {
  salesOrderId?: string;
  customerId?: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  startDate: string;
  endDate: string;
  customAttributes?: Record<string, any>;
  maker?: string;
  auditor?: string;
}) {
  try {
    // 生成生产单号 (如 HB26050033)
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await prisma.workOrder.count();
    const seq = String(count + 1).padStart(4, '0');
    const workOrderNo = `HB${year}${month}${seq}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNo,
        salesOrderId: data.salesOrderId || null,
        customerId: data.customerId || null,
        itemId: data.itemId,
        itemName: data.itemName,
        itemCode: data.itemCode,
        quantity: data.quantity,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "Draft",
        customAttributes: data.customAttributes || {},
        maker: data.maker || null,
        auditor: data.auditor || null,
      }
    });

    revalidatePath("/manufacturing/work-orders");
    return { success: true, workOrder };
  } catch (error: any) {
    return { error: error.message || "创建生产单失败" };
  }
}

export async function updateWorkOrderStatus(workOrderId: string, newStatus: string) {
  try {
    const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (!workOrder) throw new Error("生产单不存在");

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: newStatus }
    });

    revalidatePath(`/manufacturing/work-orders/${workOrderId}`);
    revalidatePath("/manufacturing/work-orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新生产单状态失败" };
  }
}

export async function deleteWorkOrder(workOrderId: string) {
  try {
    await prisma.workOrder.delete({ where: { id: workOrderId } });
    revalidatePath("/manufacturing/work-orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除生产单失败" };
  }
}