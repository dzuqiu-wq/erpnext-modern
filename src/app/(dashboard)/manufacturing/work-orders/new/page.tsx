import { prisma } from "@/lib/prisma";
import { WorkOrderForm } from "./work-order-form";

export const dynamic = 'force-dynamic';

export default async function NewWorkOrderPage() {
  const [customers, salesOrders, items] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.salesOrder.findMany({ 
      select: { id: true, orderNumber: true }, 
      where: { status: { in: ['Draft', 'Submitted'] } },
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.item.findMany({ 
      select: { id: true, itemCode: true, itemName: true }, 
      where: { isActive: true } 
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建生产单</h3>
        <p className="text-sm text-zinc-500">录入生产工单信息、工艺参数及关联的销售订单。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <WorkOrderForm 
          customers={customers} 
          salesOrders={salesOrders}
          items={items}
        />
      </div>
    </div>
  );
}