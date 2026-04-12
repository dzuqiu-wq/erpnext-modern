import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">仓库管理</h3>
          <p className="text-sm text-zinc-500">管理系统中的所有物理或虚拟存储位置。</p>
        </div>
        <Link href="/stock/warehouses/new">
          <Button>新建仓库</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>仓库编码</TableHead>
              <TableHead>仓库名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                  暂无仓库数据，请在数据库初始化或点击新建。
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium font-mono">{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>
                    {warehouse.isActive ? (
                      <Badge className="bg-green-600 hover:bg-green-700">启用</Badge>
                    ) : (
                      <Badge variant="secondary">停用</Badge>
                    )}
                  </TableCell>
                  <TableCell>{warehouse.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
