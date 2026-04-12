import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function StatementsPage() {
  const accounts = await prisma.account.findMany({
    include: { journalLines: true }
  });

  const balances = accounts.map(acc => {
    const totalDebit = acc.journalLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = acc.journalLines.reduce((sum, line) => sum + line.credit, 0);

    let balance = 0;
    if (acc.type === 'Asset' || acc.type === 'Expense') {
      balance = totalDebit - totalCredit;
    } else {
      balance = totalCredit - totalDebit;
    }
    return { ...acc, balance };
  }).filter(acc => acc.balance !== 0);

  const assets = balances.filter(a => a.type === 'Asset');
  const liabilities = balances.filter(a => a.type === 'Liability');
  const equity = balances.filter(a => a.type === 'Equity');
  const income = balances.filter(a => a.type === 'Income');
  const expenses = balances.filter(a => a.type === 'Expense');

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = income.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);

  const netProfit = totalIncome - totalExpenses;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + netProfit;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">财务报表 (Financial Statements)</h3>
        <p className="text-sm text-zinc-500">基于复式记账流水实时生成的企业核心财务双表。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>利润表 (Profit & Loss)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>科目名称</TableHead><TableHead className="text-right">发生额</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900"><TableCell colSpan={2} className="font-bold text-blue-600">营业收入</TableCell></TableRow>
                {income.map(a => <TableRow key={a.id}><TableCell className="pl-6">{a.name}</TableCell><TableCell className="text-right">¥ {a.balance.toFixed(2)}</TableCell></TableRow>)}
                <TableRow className="bg-zinc-50 dark:bg-zinc-900"><TableCell colSpan={2} className="font-bold text-orange-600 mt-2">营业成本及费用</TableCell></TableRow>
                {expenses.map(a => <TableRow key={a.id}><TableCell className="pl-6">{a.name}</TableCell><TableCell className="text-right">¥ {a.balance.toFixed(2)}</TableCell></TableRow>)}
                {expenses.length === 0 && <TableRow><TableCell className="pl-6 text-zinc-400">-</TableCell><TableCell className="text-right text-zinc-400">¥ 0.00</TableCell></TableRow>}
                <TableRow className="font-bold text-lg border-t-2">
                  <TableCell>本期净利润 (Net Profit)</TableCell>
                  <TableCell className={`text-right ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>¥ {netProfit.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>资产负债表 (Balance Sheet)</CardTitle>
              {isBalanced ?
                <Badge className="bg-green-600 hover:bg-green-700">报表已配平</Badge> :
                <Badge variant="destructive">账目不平</Badge>
              }
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>科目类别</TableHead><TableHead className="text-right">余额</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900"><TableCell colSpan={2} className="font-bold">资产 (Assets)</TableCell></TableRow>
                {assets.map(a => <TableRow key={a.id}><TableCell className="pl-6">{a.name}</TableCell><TableCell className="text-right">¥ {a.balance.toFixed(2)}</TableCell></TableRow>)}
                <TableRow className="font-bold text-blue-600"><TableCell>资产总计</TableCell><TableCell className="text-right">¥ {totalAssets.toFixed(2)}</TableCell></TableRow>

                <TableRow className="bg-zinc-50 dark:bg-zinc-900"><TableCell colSpan={2} className="font-bold mt-4">负债 (Liabilities)</TableCell></TableRow>
                {liabilities.map(a => <TableRow key={a.id}><TableCell className="pl-6">{a.name}</TableCell><TableCell className="text-right">¥ {a.balance.toFixed(2)}</TableCell></TableRow>)}
                {liabilities.length === 0 && <TableRow><TableCell className="pl-6 text-zinc-400">-</TableCell><TableCell className="text-right text-zinc-400">¥ 0.00</TableCell></TableRow>}

                <TableRow className="bg-zinc-50 dark:bg-zinc-900"><TableCell colSpan={2} className="font-bold mt-4">所有者权益 (Equity)</TableCell></TableRow>
                {equity.map(a => <TableRow key={a.id}><TableCell className="pl-6">{a.name}</TableCell><TableCell className="text-right">¥ {a.balance.toFixed(2)}</TableCell></TableRow>)}
                <TableRow><TableCell className="pl-6 text-zinc-500">加：本期净利润</TableCell><TableCell className="text-right text-zinc-500">¥ {netProfit.toFixed(2)}</TableCell></TableRow>

                <TableRow className="font-bold text-lg border-t-2">
                  <TableCell>负债及权益总计</TableCell>
                  <TableCell className="text-right">¥ {totalLiabilitiesAndEquity.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
