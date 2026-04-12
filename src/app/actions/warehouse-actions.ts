"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWarehouse(data: {
  name: string;
  code: string;
  isActive: boolean;
}) {
  try {
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing) return { error: "仓库编码已存在，请使用唯一的编码" };

    await prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        isActive: data.isActive,
      }
    });

    revalidatePath("/stock/warehouses");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建仓库失败" };
  }
}
