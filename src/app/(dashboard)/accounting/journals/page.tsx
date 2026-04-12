import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function JournalsPage() {
  const journals = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">日记账凭证 (Journal Entries)</h3>
        <p className="text-sm text-zinc-500">查看由业务单据自动触发或人工录入的财务复式记账流水。</p>
      </div>
      <div className="space-y-4">
        {journals.length === 0 ? (
          <div className="p-8 text-center border rounded-md bg-white dark:bg-zinc-950 text-zinc-500">暂无财务凭证。完成一笔销售订单即可自动生成。</div>
        ) : (
          journals.map(journal => (
            <div key={journal.id} className="border rounded-md bg-white dark:bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border-b">
                <div className="flex items-center gap-4">
                  <span className="font-bold">{journal.entryNumber}</span>
                  {journal.referenceType && (
                    <Badge variant="secondary">源单据: {journal.referenceType}</Badge>
                  )}
                </div>
                <div className="text-sm text-zinc-500">{journal.postingDate.toLocaleDateString()}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会计科目</TableHead>
                    <TableHead className="text-right text-blue-600">借方 (Debit)</TableHead>
                    <TableHead className="text-right text-green-600">贷方 (Credit)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journal.lines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.account.name}</TableCell>
                      <TableCell className="text-right font-mono">{line.debit > 0 ? `¥ ${line.debit.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{line.credit > 0 ? `¥ ${line.credit.toFixed(2)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900/50 font-bold">
                    <TableCell className="text-right">合计:</TableCell>
                    <TableCell className="text-right text-blue-600 font-mono">¥ {journal.totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600 font-mono">¥ {journal.totalCredit.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
