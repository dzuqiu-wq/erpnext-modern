import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ItemActionCell } from "./item-action-cell";

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">商品管理</h3>
          <p className="text-sm text-zinc-500">管理系统中的所有商品主数据、编码与标准售价。</p>
        </div>
        <Link href="/selling/items/new">
          <Button>新建商品</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品编码</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>单位</TableHead>
              <TableHead className="text-right">标准售价</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">暂无商品数据，请点击右上角新建。</TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemCode}</TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.stockUom}</TableCell>
                  <TableCell className="text-right font-mono">¥ {item.standardRate.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge className="bg-green-600 hover:bg-green-700">启用</Badge>
                    ) : (
                      <Badge variant="secondary">停用</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ItemActionCell itemId={item.id} itemName={item.itemName} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
