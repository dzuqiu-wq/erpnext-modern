import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await prisma.salesOrder.findMany({
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">销售订单</h3>
          <p className="text-sm text-zinc-500">管理所有面向客户的销售交易、状态及明细。</p>
        </div>
        <Link href="/selling/orders/new">
          <Button>新建订单</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单编号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">总金额</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  暂无订单数据，请点击右上角新建。
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                    <Link href={`/selling/orders/${order.id}`} className="hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    {order.status === 'Draft' ? <Badge variant="outline">草稿</Badge> :
                     order.status === 'Submitted' ? <Badge className="bg-blue-600 hover:bg-blue-700">已提交</Badge> :
                     order.status === 'Completed' ? <Badge className="bg-green-600 hover:bg-green-700">已完成</Badge> :
                     <Badge variant="destructive">已取消</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ¥ {order.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
