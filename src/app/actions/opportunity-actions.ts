"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, UserRole } from "@/lib/auth";
import { logEntityChange, getCurrentUserId, logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { eventBus, EventType } from "@/lib/event-bus";

// 商机阶段配置
export const OPPORTUNITY_STAGES = [
  { key: 'Qualification', label: '资质初审', color: 'bg-slate-400', probability: 10 },
  { key: 'Discovery', label: '需求挖掘', color: 'bg-blue-400', probability: 25 },
  { key: 'Proposal', label: '方案报价', color: 'bg-amber-400', colorDark: 'bg-amber-600', probability: 50 },
  { key: 'Negotiation', label: '谈判合同', color: 'bg-purple-400', probability: 75 },
  { key: 'Won', label: '赢单成单', color: 'bg-green-500', probability: 100 },
  { key: 'Lost', label: '输单流失', color: 'bg-red-400', probability: 0 },
] as const;

export type OpportunityStageKey = typeof OPPORTUNITY_STAGES[number]['key'];

// 类型安全的商机数据输入
interface CreateOpportunityInput {
  name: string;
  customerId: string;
  stage?: string;
  value: number;
  probability?: number;
  closeDate: string;
  ownerId: string;
  notes?: string;
  customFields?: Record<string, any>;
}

interface UpdateOpportunityInput {
  name?: string;
  customerId?: string;
  stage?: string;
  value?: number;
  probability?: number;
  closeDate?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

// 获取当前用户角色
async function getCurrentUserRole(): Promise<string> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role as string || 'SALES';
}

// 获取商机列表（销售只能看自己的，ADMIN/FINANCE 看全量）
export async function getOpportunities(): Promise<any[]> {
  const role = await getCurrentUserRole();
  
  // ADMIN 和 FINANCE 可以看全部商机，SALES 只能看自己的
  const where = (role === 'ADMIN' || role === 'FINANCE' || role === 'PURCHASE' || role === 'WAREHOUSE')
    ? {}
    : { ownerId: (await getServerSession(authOptions))?.user?.id as string };

  return prisma.opportunity.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, level: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// 获取单个商机
export async function getOpportunity(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

// 创建商机
export async function createOpportunity(data: CreateOpportunityInput) {
  try {
    // 验证客户存在
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return { error: "客户不存在" };
    }

    // 验证负责人存在
    const owner = await prisma.user.findUnique({ where: { id: data.ownerId } });
    if (!owner) {
      return { error: "负责人不存在" };
    }

    const userId = await getCurrentUserId();

    const opportunity = await prisma.opportunity.create({
      data: {
        name: data.name,
        customerId: data.customerId,
        stage: data.stage || 'Qualification',
        value: data.value || 0,
        probability: data.probability || 10,
        closeDate: new Date(data.closeDate),
        ownerId: data.ownerId,
        notes: data.notes || null,
        customFields: data.customFields || {},
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // 记录审计日志
    await logEntityChange(
      'Opportunity',
      opportunity.id,
      'CREATE',
      undefined,
      opportunity as any,
      userId
    );

    // 发布商机创建事件
    eventBus.publish({
      type: EventType.OPPORTUNITY_CREATED,
      payload: {
        id: opportunity.id,
        name: opportunity.name,
        customerId: opportunity.customerId,
        customerName: customer.name,
        value: opportunity.value,
        ownerId: opportunity.ownerId,
        ownerName: owner.name,
      },
      timestamp: new Date(),
      source: 'CRM',
    });

    revalidatePath("/crm/opportunities");
    return { success: true, opportunity };
  } catch (error: any) {
    console.error('[Opportunity] Create error:', error);
    return { error: error.message || "创建商机失败" };
  }
}

// 更新商机
export async function updateOpportunity(id: string, data: UpdateOpportunityInput) {
  try {
    // 获取更新前的数据
    const before = await prisma.opportunity.findUnique({ where: { id } });
    if (!before) {
      return { error: "商机不存在" };
    }

    const userId = await getCurrentUserId();

    const updateData: any = { ...data };
    if (data.closeDate) {
      updateData.closeDate = new Date(data.closeDate);
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // 记录审计日志
    await logEntityChange(
      'Opportunity',
      id,
      'UPDATE',
      before as any,
      updated as any,
      userId
    );

    revalidatePath("/crm/opportunities");
    revalidatePath(`/crm/opportunities/${id}`);
    return { success: true, opportunity: updated };
  } catch (error: any) {
    console.error('[Opportunity] Update error:', error);
    return { error: error.message || "更新商机失败" };
  }
}

// 变更商机阶段（核心方法，带审计）
export async function updateOpportunityStage(id: string, newStage: string) {
  try {
    // 获取更新前的数据和验证
    const before = await prisma.opportunity.findUnique({ where: { id } });
    if (!before) {
      return { error: "商机不存在" };
    }

    // 验证阶段有效性
    const validStages = OPPORTUNITY_STAGES.map(s => s.key);
    if (!validStages.includes(newStage as OpportunityStageKey)) {
      return { error: `无效的阶段：${newStage}` };
    }

    // 获取新阶段的默认概率
    const stageConfig = OPPORTUNITY_STAGES.find(s => s.key === newStage);
    const newProbability = stageConfig?.probability || before.probability;

    const userId = await getCurrentUserId();

    // 更新商机阶段和概率
    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        stage: newStage,
        probability: newProbability,
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // 记录审计日志（记录阶段变更）
    await logEntityChange(
      'Opportunity',
      id,
      'UPDATE',
      { stage: before.stage, probability: before.probability } as any,
      { stage: updated.stage, probability: updated.probability } as any,
      userId
    );

    // 发布商机阶段变更事件
    const stageEventType = newStage === 'Won' ? EventType.OPPORTUNITY_WON :
                           newStage === 'Lost' ? EventType.OPPORTUNITY_LOST :
                           EventType.OPPORTUNITY_STAGE_CHANGED;

    eventBus.publish({
      type: stageEventType,
      payload: {
        id: updated.id,
        name: updated.name,
        customerId: updated.customerId,
        customerName: updated.customer?.name,
        value: updated.value,
        lastStage: before.stage,
        stage: newStage,
      },
      timestamp: new Date(),
      source: 'CRM',
    });

    revalidatePath("/crm/opportunities");
    return { success: true, opportunity: updated };
  } catch (error: any) {
    console.error('[Opportunity] Stage update error:', error);
    return { error: error.message || "更新商机阶段失败" };
  }
}

// 删除商机
export async function deleteOpportunity(id: string) {
  try {
    const before = await prisma.opportunity.findUnique({ where: { id } });
    if (!before) {
      return { error: "商机不存在" };
    }

    const userId = await getCurrentUserId();

    await prisma.opportunity.delete({ where: { id } });

    // 记录审计日志
    await logEntityChange(
      'Opportunity',
      id,
      'DELETE',
      before as any,
      undefined,
      userId
    );

    revalidatePath("/crm/opportunities");
    return { success: true };
  } catch (error: any) {
    console.error('[Opportunity] Delete error:', error);
    return { error: error.message || "删除商机失败" };
  }
}

// 获取商机管道统计数据
export async function getOpportunityStats() {
  const opportunities = await getOpportunities();
  
  // 按阶段分组统计
  const stageStats = OPPORTUNITY_STAGES.map(stage => {
    const stageOpps = opportunities.filter(o => o.stage === stage.key);
    const totalValue = stageOpps.reduce((sum, o) => sum + o.value, 0);
    const count = stageOpps.length;
    return {
      stage: stage.key,
      label: stage.label,
      color: stage.color,
      count,
      totalValue,
    };
  });

  // 计算加权预测销售额（排除 Won 和 Lost）
  const activeOpps = opportunities.filter(o => 
    !['Won', 'Lost'].includes(o.stage)
  );
  const weightedValue = activeOpps.reduce(
    (sum, o) => sum + o.value * (o.probability / 100), 
    0
  );

  // 计算转化率
  const wonCount = opportunities.filter(o => o.stage === 'Won').length;
  const lostCount = opportunities.filter(o => o.stage === 'Lost').length;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

  return {
    stageStats,
    totalOpportunities: opportunities.length,
    weightedValue,
    wonCount,
    lostCount,
    winRate,
  };
}

// ============================================================
// CRM 到 ERP 桥梁：商机转化为销售订单
// ============================================================

export async function convertToSalesOrder(opportunityId: string) {
  try {
    // 1. 获取商机数据
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        customer: true,
        owner: { select: { id: true, name: true } },
      },
    });

    if (!opportunity) {
      return { error: "商机不存在" };
    }

    // 2. 防重校验：该商机是否已转化
    if ((opportunity.customFields as any)?.convertedToSalesOrder) {
      return { error: "该商机已经转化过销售订单，请勿重复操作" };
    }

    // TODO: 校验客户信用（如客户有欠款、违约记录等，可在这里阻止转化）
    // if (opportunity.customer.status === 'Churned' || opportunity.customer.level === 'C') {
    //   return { error: "客户信用评估不合格，请先处理客户关系" };
    // }

    // 3. 生成销售订单号
    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 4. 在 ERP 中创建草稿状态的销售订单
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: opportunity.customerId,
        totalAmount: opportunity.value,
        grandTotal: opportunity.value,
        status: 'Draft',
      },
    });

    // 5. 标记商机已转化（防止重复转化）
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        customFields: {
          ...((opportunity.customFields as Record<string, any>) || {}),
          convertedToSalesOrder: true,
          salesOrderId: salesOrder.id,
          convertedAt: new Date().toISOString(),
        },
      },
    });

    // 6. 记录审计日志
    const userId = await getCurrentUserId();
    await logAudit({
      userId,
      action: 'CREATE',
      entityName: 'SalesOrder',
      entityId: salesOrder.id,
      details: {
        source: 'Opportunity Conversion',
        opportunityId: opportunity.id,
        opportunityName: opportunity.name,
        orderValue: opportunity.value,
        customerId: opportunity.customerId,
        customerName: opportunity.customer.name,
      },
    });

    // 7. 发布商机转化事件
    eventBus.publish({
      type: EventType.OPPORTUNITY_CONVERTED,
      payload: {
        opportunityId: opportunity.id,
        opportunityName: opportunity.name,
        customerId: opportunity.customerId,
        customerName: opportunity.customer.name,
        salesOrderId: salesOrder.id,
        salesOrderNo: orderNumber,
        orderValue: opportunity.value,
      },
      timestamp: new Date(),
      source: 'CRM',
    });

    revalidatePath("/crm/opportunities");
    revalidatePath("/selling/orders");

    return {
      success: true,
      salesOrder: {
        id: salesOrder.id,
        orderNumber: orderNumber,
        grandTotal: opportunity.value,
      },
    };
  } catch (error: any) {
    console.error('[Opportunity] Convert to SalesOrder error:', error);
    return { error: error.message || "转化销售订单失败" };
  }
}