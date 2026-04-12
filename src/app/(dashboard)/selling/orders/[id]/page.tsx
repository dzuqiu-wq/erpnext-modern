import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { OrderActionsBar } from "./order-actions-bar";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const order = await prisma.salesOrder.findUnique({
    where: { id: resolvedParams.id },
    include: {
      customer: true,
      items: {
        include: { item: true }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <>
      {/* 屏幕显示的 UI (打印时完全隐藏) */}
      <div className="space-y-6 max-w-5xl print:hidden">
        {/* 顶部操作区 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/selling/orders">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h3>
              <p className="text-sm text-zinc-500">销售订单详情</p>
            </div>
            {order.status === 'Draft' ? <Badge variant="outline" className="ml-2">草稿</Badge> :
             order.status === 'Submitted' ? <Badge className="bg-blue-600 ml-2">已提交</Badge> :
             order.status === 'Completed' ? <Badge className="bg-green-600 ml-2">已完成</Badge> :
             <Badge variant="destructive" className="ml-2">已取消</Badge>}
          </div>
          <div className="flex gap-2">
            <OrderActionsBar orderId={order.id} currentStatus={order.status} />
          </div>
        </div>

        {/* 订单主信息面板 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">客户信息</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">客户名称:</span> <span className="font-medium">{order.customer.name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">关联公司:</span> <span>{order.customer.company || '-'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">联系邮箱:</span> <span>{order.customer.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">联系电话:</span> <span>{order.customer.phone || '-'}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">订单概览</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">订单编号:</span> <span className="font-medium">{order.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">创建时间:</span> <span>{order.createdAt.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">最后更新:</span> <span>{order.updatedAt.toLocaleString()}</span></div>
              <div className="flex justify-between pt-2 border-t mt-2"><span className="font-bold">总金额:</span> <span className="font-bold text-blue-600 text-base">¥ {order.totalAmount.toFixed(2)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* 订单明细行列表 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">商品明细</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品编码</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">成交单价</TableHead>
                  <TableHead className="text-right">金额小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.item.itemCode}</TableCell>
                    <TableCell>{line.item.itemName}</TableCell>
                    <TableCell className="text-right">{line.quantity} {line.item.stockUom}</TableCell>
                    <TableCell className="text-right">¥ {line.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">¥ {line.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 打印专属的 UI (屏幕上完全隐藏，仅触发打印时显示) */}
      <div className="hidden print:block w-full bg-white text-black p-8 font-sans">
        {/* 页眉 */}
        <div className="text-center mb-10 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-bold tracking-widest">ERPNext Modern</h1>
          <h2 className="text-xl mt-3 tracking-widest text-gray-700">销 售 订 单 (Sales Order)</h2>
        </div>

        {/* 抬头信息 */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="space-y-2">
            <p><span className="font-bold mr-2">客户名称:</span> {order.customer.name}</p>
            <p><span className="font-bold mr-2">联系电话:</span> {order.customer.phone || '未提供'}</p>
            <p><span className="font-bold mr-2">关联公司:</span> {order.customer.company || '无'}</p>
          </div>
          <div className="space-y-2 text-right">
            <p><span className="font-bold mr-2">单据编号:</span> {order.orderNumber}</p>
            <p><span className="font-bold mr-2">开单日期:</span> {order.createdAt.toLocaleDateString()}</p>
            <p><span className="font-bold mr-2">当前状态:</span> {order.status === 'Completed' ? '已结清' : '未结清'}</p>
          </div>
        </div>

        {/* 明细表格 */}
        <table className="w-full mb-8 border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="text-left py-3 font-bold">商品编码</th>
              <th className="text-left py-3 font-bold">商品名称</th>
              <th className="text-right py-3 font-bold">数量</th>
              <th className="text-right py-3 font-bold">单价</th>
              <th className="text-right py-3 font-bold">金额</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((line) => (
              <tr key={line.id} className="border-b border-gray-300">
                <td className="py-3">{line.item.itemCode}</td>
                <td className="py-3">{line.item.itemName}</td>
                <td className="text-right py-3">{line.quantity} {line.item.stockUom}</td>
                <td className="text-right py-3">¥ {line.rate.toFixed(2)}</td>
                <td className="text-right py-3 font-medium">¥ {line.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 汇总与签名区 */}
        <div className="flex justify-end mb-16">
          <div className="w-72">
            <div className="flex justify-between border-b-2 border-black py-2 text-lg">
              <span className="font-bold">总计金额:</span>
              <span className="font-bold">¥ {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-24 pt-8 border-t border-gray-400 text-sm">
          <div className="w-64 text-center">
            <div className="mb-2">制单方盖章/签字</div>
            <div className="border-b border-black mt-12"></div>
          </div>
          <div className="w-64 text-center">
            <div className="mb-2">客户确认签字</div>
            <div className="border-b border-black mt-12"></div>
          </div>
        </div>
      </div>
    </>
  );
}
