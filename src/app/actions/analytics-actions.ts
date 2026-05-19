"use server";

import { prisma } from "@/lib/prisma";
import { logAudit, getCurrentUserId } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ============================================================
// 指标类型枚举
// ============================================================

export enum MetricType {
  SALES_FUNNEL = 'SALES_FUNNEL',
  TICKET_SLA = 'TICKET_SLA',
  REVENUE_FORECAST = 'REVENUE_FORECAST',
}

// 商机阶段配置
export const OPPORTUNITY_STAGES = [
  'Qualification',
  'Needs Analysis',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
] as const;

export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];

// 阶段标签映射
export const STAGE_LABELS: Record<string, string> = {
  Qualification: '意向',
  'Needs Analysis': '需求分析',
  Proposal: '方案报价',
  Negotiation: '商务谈判',
  'Closed Won': '赢单',
  'Closed Lost': '输单',
};

// ============================================================
// 快照数据结构
// ============================================================

interface SalesFunnelPayload {
  stages: {
    stage: string;
    label: string;
    count: number;
    totalValue: number;
    conversionRate: number; // 相对于上一阶段的转化率
  }[];
  totalOpportunities: number;
  totalValue: number;
  overallConversionRate: number; // 从首阶段到赢单的转化率
}

interface TicketSLAPayload {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number; // SLA 违规数
  overdueRate: number; // 违规率
  healthyRate: number; // 健康率 (正常 - 逾期) / 总数
}

interface RevenueForecastPayload {
  totalRevenue: number;
  wonRevenue: number;
  weightedForecast: number; // 加权预测销售额
  avgDealSize: number;
  avgCycleDays: number;
}

// ============================================================
// 核心函数：生成今日快照
// ============================================================

export async function generateTodaySnapshot() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const userId = await getCurrentUserId();
  const results: any = {};

  try {
    // 并行执行三个快照计算
    const [salesFunnelResult, ticketSLAResult, revenueForecastResult] = await Promise.all([
      generateSalesFunnelSnapshot(today, tomorrow),
      generateTicketSLASnapshot(today, tomorrow),
      generateRevenueForecastSnapshot(today, tomorrow),
    ]);

    results.salesFunnel = salesFunnelResult;
    results.ticketSLA = ticketSLAResult;
    results.revenueForecast = revenueForecastResult;

    // 记录审计日志
    await logAudit({
      userId,
      action: 'SNAPSHOT_GENERATED',
      entityName: 'MetricsSnapshot',
      entityId: 'daily-batch',
      details: {
        date: today.toISOString().split('T')[0],
        metrics: Object.keys(results),
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/");
    return { success: true, results };

  } catch (error: any) {
    console.error('[Analytics] Snapshot generation error:', error);
    return { error: error.message || "生成快照失败" };
  }
}

// ============================================================
// 销售漏斗快照
// ============================================================

async function generateSalesFunnelSnapshot(today: Date, tomorrow: Date) {
  // 使用 groupBy 获取各阶段商机统计
  const stageGroups = await prisma.opportunity.groupBy({
    by: ['stage'],
    _count: { id: true },
    _sum: { value: true },
  });

  // 转换为漏斗数据格式
  const stageMap = new Map(stageGroups.map(g => [g.stage, {
    count: g._count.id,
    totalValue: g._sum.value || 0,
  }]));

  let totalOpportunities = 0;
  let totalValue = 0;

  const funnelData = OPPORTUNITY_STAGES
    .filter(stage => stage !== 'Closed Lost') // 排除输单
    .map(stage => {
      const data = stageMap.get(stage) || { count: 0, totalValue: 0 };
      totalOpportunities += data.count;
      totalValue += data.totalValue;
      return {
        stage,
        label: STAGE_LABELS[stage] || stage,
        count: data.count,
        totalValue: data.totalValue,
        conversionRate: 0, // 待计算
      };
    });

  // 计算转化率
  let previousCount = funnelData[0]?.count || 0;
  funnelData.forEach((item, index) => {
    if (index === 0) {
      item.conversionRate = 1; // 第一个阶段 100%
    } else if (previousCount > 0) {
      item.conversionRate = Math.round((item.count / previousCount) * 100) / 100;
    }
    previousCount = item.count;
  });

  // 计算赢单转化率
  const wonStage = funnelData.find(d => d.stage === 'Closed Won');
  const overallConversionRate = funnelData[0]?.count
    ? (wonStage?.count || 0) / funnelData[0].count
    : 0;

  const payload: SalesFunnelPayload = {
    stages: funnelData,
    totalOpportunities,
    totalValue,
    overallConversionRate: Math.round(overallConversionRate * 100) / 100,
  };

  // 入库
  await prisma.metricsSnapshot.upsert({
    where: {
      date_metricType: {
        date: today,
        metricType: MetricType.SALES_FUNNEL,
      },
    },
    update: {
      value: totalValue,
      payload: payload as any,
    },
    create: {
      date: today,
      metricType: MetricType.SALES_FUNNEL,
      value: totalValue,
      payload: payload as any,
    },
  });

  return { value: totalValue, payload };
}

// ============================================================
// 售后 SLA 健康度快照
// ============================================================

async function generateTicketSLASnapshot(today: Date, tomorrow: Date) {
  const now = new Date();

  // 并行查询不同状态的工单
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'Open' } }),
    prisma.ticket.count({ where: { status: 'InProgress' } }),
    prisma.ticket.count({ where: { status: 'Resolved' } }),
    prisma.ticket.count({ where: { status: 'Closed' } }),
  ]);

  // SLA 违规数：未关闭且已过截止时间
  const overdue = await prisma.ticket.count({
    where: {
      status: { notIn: ['Resolved', 'Closed'] },
      dueDate: { lt: now },
    },
  });

  const overdueRate = total > 0 ? Math.round((overdue / total) * 100) / 100 : 0;
  const healthyRate = total > 0 ? Math.round(((total - overdue) / total) * 100) / 100 : 0;

  const payload: TicketSLAPayload = {
    total,
    open,
    inProgress,
    resolved,
    closed,
    overdue,
    overdueRate,
    healthyRate,
  };

  // 入库
  await prisma.metricsSnapshot.upsert({
    where: {
      date_metricType: {
        date: today,
        metricType: MetricType.TICKET_SLA,
      },
    },
    update: {
      value: overdue,
      payload: payload as any,
    },
    create: {
      date: today,
      metricType: MetricType.TICKET_SLA,
      value: overdue, // SLA 违规数作为核心指标
      payload: payload as any,
    },
  });

  return { value: overdue, payload };
}

// ============================================================
// 营收预测快照
// ============================================================

async function generateRevenueForecastSnapshot(today: Date, tomorrow: Date) {
  // 所有非输单商机
  const opportunities = await prisma.opportunity.findMany({
    where: { stage: { not: 'Closed Lost' } },
    select: { stage: true, value: true, probability: true, createdAt: true },
  });

  const totalRevenue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
  const wonRevenue = opportunities
    .filter(o => o.stage === 'Closed Won')
    .reduce((sum, o) => sum + (o.value || 0), 0);

  // 加权预测 = Σ(金额 * 概率)
  const weightedForecast = opportunities.reduce((sum, o) => {
    const probability = o.probability ?? 0.5;
    return sum + (o.value || 0) * probability;
  }, 0);

  const avgDealSize = opportunities.length > 0
    ? totalRevenue / opportunities.length
    : 0;

  // 平均销售周期（从创建到赢单的天数）
  const wonOpportunities = opportunities.filter(o => o.stage === 'Closed Won');
  const avgCycleDays = wonOpportunities.length > 0
    ? wonOpportunities.reduce((sum, o) => {
        const days = (new Date().getTime() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / wonOpportunities.length
    : 0;

  const payload: RevenueForecastPayload = {
    totalRevenue,
    wonRevenue,
    weightedForecast: Math.round(weightedForecast * 100) / 100,
    avgDealSize: Math.round(avgDealSize * 100) / 100,
    avgCycleDays: Math.round(avgCycleDays * 10) / 10,
  };

  // 入库
  await prisma.metricsSnapshot.upsert({
    where: {
      date_metricType: {
        date: today,
        metricType: MetricType.REVENUE_FORECAST,
      },
    },
    update: {
      value: weightedForecast,
      payload: payload as any,
    },
    create: {
      date: today,
      metricType: MetricType.REVENUE_FORECAST,
      value: weightedForecast,
      payload: payload as any,
    },
  });

  return { value: weightedForecast, payload };
}

// ============================================================
// 查询接口
// ============================================================

export async function getSnapshot(metricType: MetricType, date?: Date) {
  const targetDate = date || new Date();
  targetDate.setHours(0, 0, 0, 0);

  return prisma.metricsSnapshot.findUnique({
    where: {
      date_metricType: {
        date: targetDate,
        metricType,
      },
    },
  });
}

export async function getSnapshots(metricType: MetricType, days: number = 30) {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return prisma.metricsSnapshot.findMany({
    where: {
      metricType,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });
}

// 获取今日所有快照
export async function getTodaySnapshots() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshots = await prisma.metricsSnapshot.findMany({
    where: { date: today },
  });

  return {
    salesFunnel: snapshots.find(s => s.metricType === MetricType.SALES_FUNNEL),
    ticketSLA: snapshots.find(s => s.metricType === MetricType.TICKET_SLA),
    revenueForecast: snapshots.find(s => s.metricType === MetricType.REVENUE_FORECAST),
  };
}

// 获取最近审计日志（用于大屏动态追踪）
export async function getRecentAuditLogs(limit: number = 10) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

// 辅助函数：格式化审计日志描述
export function formatAuditLog(log: any): string {
  const userName = log.user?.name || log.user?.email || '系统';
  const actionLabel: Record<string, string> = {
    'CREATE': '创建了',
    'UPDATE': '更新了',
    'DELETE': '删除了',
    'SNAPSHOT_GENERATED': '生成了',
  };
  const action = actionLabel[log.action] || log.action;

  const entityLabels: Record<string, string> = {
    'Opportunity': '商机',
    'Ticket': '工单',
    'Customer': '客户',
    'SalesOrder': '订单',
    'MetricsSnapshot': 'BI 快照',
  };
  const entity = entityLabels[log.entityName] || log.entityName;

  return `${userName} ${action} ${entity}`;
}