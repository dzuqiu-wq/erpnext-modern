"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSupplier(data: {
  name: string;
  email?: string;
  phone?: string;
  status: string;
}) {
  try {
    await prisma.supplier.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status,
      }
    });

    revalidatePath("/buying/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建供应商失败" };
  }
}

export async function updateSupplier(id: string, data: {
  name: string;
  email?: string;
  phone?: string;
  status: string;
}) {
  try {
    await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status,
      }
    });
    revalidatePath("/buying/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新供应商失败" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath("/buying/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除供应商失败" };
  }
}
