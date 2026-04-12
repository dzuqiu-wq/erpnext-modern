import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditSupplierForm } from "./edit-supplier-form";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id: resolvedParams.id } });
  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">编辑供应商</h3>
        <p className="text-sm text-zinc-500">修改供应商信息或调整供应商状态。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <EditSupplierForm supplier={supplier} />
      </div>
    </div>
  );
}
