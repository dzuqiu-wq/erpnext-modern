import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, Activity, Users, Package, Ticket, Target } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FunnelChart } from "./components/funnel-chart";
import { SLAPieChart } from "./components/sla-pie-chart";
import { generateTodaySnapshot, getTodaySnapshots, getRecentAuditLogs, formatAuditLog, MetricType } from "@/app/actions/analytics-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

// 触发快照生成的按钮（仅用于开发测试）
async function TriggerSnapshotButton() {
  "use server";
  
  async function trigger() {
    "use server";
    await generateTodaySnapshot();
  }
  
  return null;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "Administrator";

  // ============================================================
  // 第一步：确保今日快照存在（如果不存在则生成）
  // ============================================================
  let snapshots = await getTodaySnapshots();
  
  // 如果快照不存在，生成一次
  if (!snapshots.salesFunnel || !snapshots.ticketSLA || !snapshots.revenueForecast) {
    await generateTodaySnapshot();
    snapshots = await getTodaySnapshots();
  }

  // ============================================================
  // 第二步：加载实时 KPI 数据
  // ============================================================
  const [
    salesOrders,
    purchaseOrders,
    customerCount,
    warehouseCount,
    recentSales,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.salesOrder.findMany({ 
      select: { totalAmount: true, createdAt: true }, 
      where: { status: { not: 'Cancelled' } } 
    }),
    prisma.purchaseOrder.findMany({ 
      select: { totalAmount: true }, 
      where: { status: { not: 'Cancelled' } } 
    }),
    prisma.customer.count(),
    prisma.warehouse.count(),
    prisma.salesOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, email: true } } }
    }),
    getRecentAuditLogs(8),
  ]);

  // ============================================================
  // 第三步：计算核心 KPI
  // ============================================================
  const totalRevenue = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpenses = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  // 从快照解析漏斗数据
  const salesFunnelPayload = snapshots.salesFunnel?.payload as any;
  const ticketSLAPayload = snapshots.ticketSLA?.payload as any;
  const revenueForecastPayload = snapshots.revenueForecast?.payload as any;

  // 加权预测销售额
  const weightedForecast = revenueForecastPayload?.weightedForecast || 0;
  
  // SLA 违规数
  const overdueCount = ticketSLAPayload?.overdue || 0;

  // ============================================================
  // 第四步：组装视图数据
  // ============================================================
  
  // 销售漏斗数据
  const funnelData = salesFunnelPayload?.stages || [];

  // 营收趋势（月度）
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
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 页面头部 */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="h-7 w-7 text-blue-500" />
            CEO 上帝视角大屏
          </h2>
          <p className="text-zinc-500 mt-2">
            欢迎回来，{userName}。实时业务健康度监控 · 数据驱动决策。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            实时监控中
          </Badge>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 核心 KPI 卡片区 */}
      {/* ============================================================ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* 总销售额 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">¥ {(totalRevenue / 10000).toFixed(1)}万</div>
            <p className="text-xs text-zinc-500 mt-1">含所有有效订单</p>
          </CardContent>
        </Card>

        {/* 加权预测销售 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              加权预测
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">¥ {(weightedForecast / 10000).toFixed(1)}万</div>
            <p className="text-xs text-zinc-500 mt-1">按概率加权后的预测值</p>
          </CardContent>
        </Card>

        {/* 采购支出 */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">采购支出</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">¥ {(totalExpenses / 10000).toFixed(1)}万</div>
            <p className="text-xs text-zinc-500 mt-1">含所有生效采购单</p>
          </CardContent>
        </Card>

        {/* 客户池 */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户池</CardTitle>
            <Users className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{customerCount}</div>
            <p className="text-xs text-zinc-500 mt-1">CRM 注册客户总数</p>
          </CardContent>
        </Card>

        {/* SLA 违规 */}
        <Card className={`border-l-4 ${overdueCount > 0 ? 'border-l-red-500 bg-red-50/50' : 'border-l-green-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              {overdueCount > 0 && <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />}
              SLA 违规
            </CardTitle>
            <Ticket className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overdueCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {overdueCount > 0 ? '需要立即处理！' : '暂无违规'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* 主要内容区：CSS Grid 布局 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：商机转化漏斗 (占 7 列) */}
        <div className="col-span-12 lg:col-span-7">
          <FunnelChart 
            data={funnelData} 
            title="商机销售漏斗" 
          />
        </div>

        {/* 右上：售后健康看板 (占 5 列) */}
        <div className="col-span-12 lg:col-span-5">
          <SLAPieChart 
            data={ticketSLAPayload}
            title="售后健康看板" 
          />
        </div>

        {/* 右下：动态审计追踪 (占 5 列) */}
        <div className="col-span-12 lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-zinc-400" />
                动态审计追踪
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAuditLogs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-zinc-500">
                    暂无操作记录
                  </div>
                ) : (
                  recentAuditLogs.map((log, index) => (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        index === 0 ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {formatAuditLog(log)}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 左下：最近交易 (占 7 列) */}
        <div className="col-span-12 lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-zinc-400" />
                最近达成交易
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-500">
                  暂无交易记录
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSales.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{order.customer.name}</p>
                          <p className="text-xs text-zinc-400">
                            {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold font-mono text-blue-600">
                          +¥{order.totalAmount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 底部运营指标 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-zinc-500">活跃仓库</div>
            <div className="text-2xl font-bold mt-1">{warehouseCount}</div>
            <div className="text-xs text-zinc-400 mt-1">当前启用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-zinc-500">总商机价值</div>
            <div className="text-2xl font-bold mt-1 text-purple-600">
              ¥ {(salesFunnelPayload?.totalValue || 0 / 10000).toFixed(1)}万
            </div>
            <div className="text-xs text-zinc-400 mt-1">漏斗总额</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-zinc-500">售后工单总数</div>
            <div className="text-2xl font-bold mt-1 text-teal-600">
              {ticketSLAPayload?.total || 0}
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              健康率 {Math.round((ticketSLAPayload?.healthyRate || 0) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}