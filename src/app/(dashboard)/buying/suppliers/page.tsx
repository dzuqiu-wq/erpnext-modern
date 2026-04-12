import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SupplierActionCell } from "./supplier-action-cell";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">供应商管理</h3>
          <p className="text-sm text-zinc-500">管理采购模块中的所有供应商主数据。</p>
        </div>
        <Link href="/buying/suppliers/new">
          <Button>新建供应商</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>供应商名称</TableHead>
              <TableHead>联系邮箱</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">暂无供应商数据，请点击右上角新建。</TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>
                    {supplier.status === 'Active' ? (
                      <Badge className="bg-green-600 hover:bg-green-700">活跃</Badge>
                    ) : (
                      <Badge variant="secondary">未激活</Badge>
                    )}
                  </TableCell>
                  <TableCell>{supplier.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <SupplierActionCell supplierId={supplier.id} supplierName={supplier.name} />
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
