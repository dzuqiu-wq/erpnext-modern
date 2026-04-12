import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditItemForm } from "./edit-item-form";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const item = await prisma.item.findUnique({ where: { id: resolvedParams.id } });
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">编辑商品</h3>
        <p className="text-sm text-zinc-500">修改商品信息或调整商品状态。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <EditItemForm item={item} />
      </div>
    </div>
  );
}
