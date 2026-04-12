import { prisma } from "@/lib/prisma";
import { OrderForm } from "./order-form";

// 强制动态渲染，获取最新主数据
export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  // 并发获取客户数据和商品主数据，供表单下拉框使用
  const [customers, itemsMaster, warehouses] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    prisma.item.findMany({ select: { id: true, itemCode: true, itemName: true, standardRate: true }, where: { isActive: true } }),
    prisma.warehouse.findMany({ select: { id: true, name: true, code: true }, where: { isActive: true } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建销售订单</h3>
        <p className="text-sm text-zinc-500">录入客户与交易商品明细，系统将自动计算总金额。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <OrderForm customers={customers} itemsMaster={itemsMaster} warehouses={warehouses} />
      </div>
    </div>
  );
}
