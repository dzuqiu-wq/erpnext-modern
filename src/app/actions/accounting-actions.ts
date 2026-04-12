"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 一键初始化标准会计科目
export async function initializeAccounts(): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultAccounts = [
      { name: "银行存款", type: "Asset" },
      { name: "应收账款", type: "Asset" },
      { name: "应付账款", type: "Liability" },
      { name: "主营业务收入", type: "Income" },
      { name: "主营业务成本", type: "Expense" },
    ];

    for (const acc of defaultAccounts) {
      await prisma.account.upsert({
        where: { name: acc.name },
        update: {},
        create: acc,
      });
    }
    revalidatePath("/accounting/accounts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
