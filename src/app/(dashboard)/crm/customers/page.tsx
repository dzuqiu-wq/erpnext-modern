import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CustomerActionCell } from "./customer-action-cell";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">客户管理</h3>
          <p className="text-sm text-zinc-500">管理 CRM 模块中的所有客户和潜在线索。</p>
        </div>
        <Link href="/crm/customers/new">
          <Button>新建客户</Button>
        </Link>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户名称</TableHead>
              <TableHead>公司</TableHead>
              <TableHead>联系邮箱</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">暂无客户数据，请点击右上角新建。</TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.company || '-'}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>
                    {customer.status === 'Active' ? (
                      <Badge className="bg-blue-600 hover:bg-blue-700">活跃</Badge>
                    ) : customer.status === 'Lead' ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">线索</Badge>
                    ) : (
                      <Badge variant="secondary">未激活</Badge>
                    )}
                  </TableCell>
                  <TableCell>{customer.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <CustomerActionCell customerId={customer.id} customerName={customer.name} />
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
