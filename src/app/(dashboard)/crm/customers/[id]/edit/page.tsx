import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditCustomerForm } from "./edit-customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const customer = await prisma.customer.findUnique({ where: { id: resolvedParams.id } });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">编辑客户</h3>
        <p className="text-sm text-zinc-500">修改客户信息或调整客户状态。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <EditCustomerForm customer={customer} />
      </div>
    </div>
  );
}
