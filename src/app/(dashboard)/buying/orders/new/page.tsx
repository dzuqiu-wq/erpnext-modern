import { prisma } from "@/lib/prisma";
import { PurchaseOrderForm } from "./purchase-order-form";

export const dynamic = 'force-dynamic';

export default async function NewPurchaseOrderPage() {
  const [suppliers, itemsMaster] = await Promise.all([
    prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.item.findMany({ select: { id: true, itemCode: true, itemName: true, standardRate: true }, where: { isActive: true } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建采购单</h3>
        <p className="text-sm text-zinc-500">向供应商发起采购请求，系统会自动按标准售价的 50% 带入预估进价作为参考。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <PurchaseOrderForm suppliers={suppliers} itemsMaster={itemsMaster} />
      </div>
    </div>
  );
}
