import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initializeAccounts } from "@/app/actions/accounting-actions";

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({ orderBy: { type: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">会计科目表 (Chart of Accounts)</h3>
        <p className="text-sm text-zinc-500">管理企业财务的核心账套科目。</p>
      </div>
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目名称</TableHead>
              <TableHead>科目类别</TableHead>
              <TableHead>是否为汇总组</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12">
                  <p className="text-zinc-500 mb-4">尚未初始化财务科目，请先执行会计初始化配置。</p>
                  <form action={initializeAccounts as unknown as (formData: FormData) => Promise<void>}>
                    <Button type="submit" variant="default">一键初始化标准科目表</Button>
                  </form>
                </TableCell>
              </TableRow>
            ) : (
              accounts.map(acc => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell><Badge variant="outline">{acc.type}</Badge></TableCell>
                  <TableCell>{acc.isGroup ? "是" : "否"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
