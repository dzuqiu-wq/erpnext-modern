import { prisma } from "@/lib/prisma";
import { StockEntryForm } from "./stock-entry-form";

export const dynamic = 'force-dynamic';

export default async function NewStockEntryPage() {
  const [items, warehouses] = await Promise.all([
    prisma.item.findMany({ select: { id: true, itemCode: true, itemName: true }, where: { isActive: true } }),
    prisma.warehouse.findMany({ select: { id: true, name: true }, where: { isActive: true } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">库存调整</h3>
        <p className="text-sm text-zinc-500">手动执行物料的入库或出库，系统将自动生成流水账并更新实时库存快照。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <StockEntryForm items={items} warehouses={warehouses} />
      </div>
    </div>
  );
}
