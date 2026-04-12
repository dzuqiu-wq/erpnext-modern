import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function StockBalancesPage() {
  const balances = await prisma.stockBalance.findMany({
    include: { item: true, warehouse: true },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">实时库存 (Stock Balance)</h3>
          <p className="text-sm text-zinc-500">查看各仓库中商品的实时结存数量。</p>
        </div>
        <Link href="/stock/entry/new">
          <Button>库存调整 (入库/出库)</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品编码</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>所属仓库</TableHead>
              <TableHead className="text-right">当前实际库存</TableHead>
              <TableHead>最后更新</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  暂无库存数据，请点击右上角进行库存调整。
                </TableCell>
              </TableRow>
            ) : (
              balances.map((balance) => (
                <TableRow key={balance.id}>
                  <TableCell className="font-medium">{balance.item.itemCode}</TableCell>
                  <TableCell>{balance.item.itemName}</TableCell>
                  <TableCell><Badge variant="outline">{balance.warehouse.name}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg text-blue-600">
                    {balance.actualQty} {balance.item.stockUom}
                  </TableCell>
                  <TableCell>{balance.updatedAt.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
