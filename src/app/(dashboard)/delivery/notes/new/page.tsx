import { prisma } from "@/lib/prisma";
import { DeliveryNoteForm } from "./delivery-note-form";

export const dynamic = 'force-dynamic';

export default async function NewDeliveryNotePage() {
  const [customers, salesOrders, items] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.salesOrder.findMany({ 
      select: { id: true, orderNumber: true }, 
      where: { status: { in: ['Draft', 'Submitted'] } },
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.item.findMany({ 
      select: { id: true, itemCode: true, itemName: true, standardRate: true }, 
      where: { isActive: true } 
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建送货单</h3>
        <p className="text-sm text-zinc-500">录入送货明细、客户信息及签收要求。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <DeliveryNoteForm 
          customers={customers} 
          salesOrders={salesOrders}
          items={items}
        />
      </div>
    </div>
  );
}