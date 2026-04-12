import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await prisma.user.findUnique({ where: { id: resolvedParams.id } });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">编辑用户</h3>
        <p className="text-sm text-zinc-500">修改员工账号资料、重置密码或调整系统角色权限。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <EditUserForm user={user} />
      </div>
    </div>
  );
}
