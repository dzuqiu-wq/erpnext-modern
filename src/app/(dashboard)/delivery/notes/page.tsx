import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DeliveryNotesPage() {
  const notes = await prisma.deliveryNote.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">送货单</h3>
          <p className="text-sm text-zinc-500">管理发货单据、客户签收及配送跟踪。</p>
        </div>
        <Link href="/delivery/notes/new">
          <Button>新建送货单</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>送货单号</TableHead>
              <TableHead>客户名称</TableHead>
              <TableHead>商品项数</TableHead>
              <TableHead className="text-right">总金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>送货日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  暂无送货单数据，请点击右上角新建。
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                    <Link href={`/delivery/notes/${note.id}`} className="hover:underline">
                      {note.deliveryNo}
                    </Link>
                  </TableCell>
                  <TableCell>{note.customerName || '-'}</TableCell>
                  <TableCell>{note.items.length} 项</TableCell>
                  <TableCell className="text-right font-mono">
                    ¥ {note.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {note.status === 'Draft' ? <Badge variant="outline">草稿</Badge> :
                     note.status === 'Printed' ? <Badge className="bg-blue-600">已打印</Badge> :
                     note.status === 'Delivered' ? <Badge className="bg-green-600">已发货</Badge> :
                     <Badge variant="destructive">已取消</Badge>}
                  </TableCell>
                  <TableCell>{note.deliveryDate ? new Date(note.deliveryDate).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}