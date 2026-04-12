"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  role: string;
}) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return { error: "该电子邮箱已被注册" };

    let hashedPassword: string | null = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      }
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "创建用户失败" };
  }
}

export async function updateUser(id: string, data: {
  name: string;
  email: string;
  password?: string;
  role: string;
}) {
  try {
    const updateData: any = { name: data.name, email: data.email, role: data.role };

    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "更新用户失败" };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/settings/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除用户失败" };
  }
}
