import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OpportunityForm } from "./opportunity-form";

export const dynamic = 'force-dynamic';

export default async function NewOpportunityPage() {
  // 获取当前会话用户
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id as string;
  const currentUserRole = (session?.user as any)?.role as string;

  // 并发获取客户列表和销售用户列表
  const [customers, salesUsers] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, name: true, level: true, status: true },
      where: { status: { in: ['Active', 'Prospect', 'Lead'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      where: { 
        isActive: true,
        role: { in: ['SALES', 'ADMIN'] },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建商机</h3>
        <p className="text-sm text-zinc-500">创建销售机会，追踪客户需求，推进成交。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <OpportunityForm
          customers={customers}
          salesUsers={salesUsers}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
}