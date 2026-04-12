"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
}) {
  try {
    await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        status: data.status,
      }
    });

    revalidatePath("/crm/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建客户失败" };
  }
}

export async function updateCustomer(id: string, data: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
}) {
  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        status: data.status,
      }
    });
    revalidatePath("/crm/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新客户失败" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/crm/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除客户失败" };
  }
}
