import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function WorkOrdersPage() {
  const workOrders = await prisma.workOrder.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">生产单</h3>
          <p className="text-sm text-zinc-500">管理生产工单、工艺参数及生产进度。</p>
        </div>
        <Link href="/manufacturing/work-orders/new">
          <Button>新建生产单</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>生产单号</TableHead>
              <TableHead>成品编码</TableHead>
              <TableHead>成品名称</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始日期</TableHead>
              <TableHead>出货日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  暂无生产单数据，请点击右上角新建。
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                    <Link href={`/manufacturing/work-orders/${wo.id}`} className="hover:underline">
                      {wo.workOrderNo}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{wo.itemCode || '-'}</TableCell>
                  <TableCell>{wo.itemName || '-'}</TableCell>
                  <TableCell className="font-mono">{(wo.quantity as number).toLocaleString()}</TableCell>
                  <TableCell>
                    {wo.status === 'Draft' ? <Badge variant="outline">草稿</Badge> :
                     wo.status === 'InProgress' ? <Badge className="bg-amber-600 hover:bg-amber-700">生产中</Badge> :
                     wo.status === 'Completed' ? <Badge className="bg-green-600 hover:bg-green-700">已完成</Badge> :
                     <Badge variant="destructive">已取消</Badge>}
                  </TableCell>
                  <TableCell>{wo.startDate ? new Date(wo.startDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{wo.endDate ? new Date(wo.endDate).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}