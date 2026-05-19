import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Package, Calendar, User } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DeliveryNoteActionsBar } from "./delivery-note-actions-bar";

export default async function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const note = await prisma.deliveryNote.findUnique({
    where: { id: resolvedParams.id },
    include: { items: true }
  });

  if (!note) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/delivery/notes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{note.deliveryNo}</h3>
            <p className="text-sm text-zinc-500">送货单详情</p>
          </div>
          {note.status === 'Draft' ? <Badge variant="outline">草稿</Badge> :
           note.status === 'Printed' ? <Badge className="bg-blue-600">已打印</Badge> :
           note.status === 'Delivered' ? <Badge className="bg-green-600">已发货</Badge> :
           <Badge variant="destructive">已取消</Badge>}
        </div>
        <DeliveryNoteActionsBar deliveryNoteId={note.id} currentStatus={note.status} />
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> 客户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">客户名称:</span>
              <span className="font-medium">{note.customerName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">送货日期:</span>
              <span>{note.deliveryDate ? new Date(note.deliveryDate).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">关联销售单:</span>
              <span>{note.salesOrderId || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> 单据概览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">单据编号:</span>
              <span className="font-mono font-medium">{note.deliveryNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">创建时间:</span>
              <span>{note.createdAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">制单人:</span>
              <span>{note.maker || '-'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <span className="font-bold">总金额:</span>
              <span className="font-bold text-blue-600 text-base">
                ¥ {note.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 备注 */}
      {note.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">备注说明</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{note.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* 商品明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>序号</TableHead>
                <TableHead>物料编号</TableHead>
                <TableHead>品名/规格</TableHead>
                <TableHead className="text-center">单位</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">税率</TableHead>
                <TableHead className="text-right">价税合计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {note.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{item.itemCode || '-'}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.itemName}</div>
                    {item.specifications && (
                      <div className="text-xs text-zinc-500">{item.specifications}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{item.unit}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">¥ {item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.taxRate}%</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ¥ {item.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}