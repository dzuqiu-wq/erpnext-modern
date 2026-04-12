import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Package } from "lucide-react";
import { OverviewChart } from "./components/overview-chart";
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession();

  const [
    salesOrders,
    purchaseOrders,
    customerCount,
    warehouseCount,
    recentSales
  ] = await Promise.all([
    prisma.salesOrder.findMany({ select: { totalAmount: true, createdAt: true }, where: { status: { not: 'Cancelled' } } }),
    prisma.purchaseOrder.findMany({ select: { totalAmount: true }, where: { status: { not: 'Cancelled' } } }),
    prisma.customer.count(),
    prisma.warehouse.count(),
    prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, email: true } } }
    })
  ]);

  const totalRevenue = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpenses = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const monthlyData: Record<string, number> = {};
  salesOrders.forEach(order => {
    const month = order.createdAt.toLocaleDateString('zh-CN', { month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + order.totalAmount;
  });

  let chartData = Object.keys(monthlyData).map(key => ({ name: key, total: monthlyData[key] }));
  if (chartData.length === 0) {
    chartData = [
      { name: "一月", total: 0 }, { name: "二月", total: 0 },
      { name: "三月", total: 0 }, { name: "四月", total: 0 }
    ];
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">工作台 (Dashboard)</h2>
        <p className="text-zinc-500 mt-2">欢迎回来，{session?.user?.name || "Administrator"}。这是您企业今日的全局业务摘要。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总销售额 (Revenue)</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">¥ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">基于所有非取消状态的销售订单</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">采购支出 (Expenses)</CardTitle>
            <CreditCard className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">¥ {totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-zinc-500 mt-1">基于所有生效的采购单据</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户池 (Customers)</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-zinc-500 mt-1">CRM 模块注册客户总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃仓库 (Warehouses)</CardTitle>
            <Package className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseCount}</div>
            <p className="text-xs text-zinc-500 mt-1">当前启用状态的仓储节点</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>营收趋势分析</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近达成交易</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentSales.length === 0 ? (
                <div className="text-center text-sm text-zinc-500 py-4">暂无交易记录</div>
              ) : (
                recentSales.map(order => (
                  <div key={order.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{order.customer.name}</p>
                      <p className="text-sm text-zinc-500">{order.customer.email || '未提供邮箱'}</p>
                    </div>
                    <div className="ml-auto font-medium font-mono text-blue-600">
                      +¥{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
