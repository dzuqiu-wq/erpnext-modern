"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit, getCurrentUserId } from "@/lib/audit";
import { eventBus, EventType } from "@/lib/event-bus";
import { revalidatePath } from "next/cache";

// ============================================================
// SLA 配置（服务级别协议）
// ============================================================

interface SLAConfig {
  priority: string;
  responseHours: number; // 响应时限（小时）
  label: string;
  color: string;
}

export const SLA_CONFIGS: Record<string, SLAConfig> = {
  Urgent: { priority: 'Urgent', responseHours: 4, label: '紧急', color: 'bg-red-600' },
  High: { priority: 'High', responseHours: 24, label: '高', color: 'bg-amber-500' },
  Medium: { priority: 'Medium', responseHours: 72, label: '中', color: 'bg-blue-500' },
  Low: { priority: 'Low', responseHours: 168, label: '低', color: 'bg-green-500' }, // 7 天
};

// Ticket 状态配置
export const TICKET_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Open: { label: '待处理', color: 'bg-slate-400' },
  InProgress: { label: '处理中', color: 'bg-blue-500' },
  Resolved: { label: '已解决', color: 'bg-green-500' },
  Closed: { label: '已关闭', color: 'bg-zinc-400' },
};

// 计算 SLA 截止时间
function calculateDueDate(priority: string): Date {
  const config = SLA_CONFIGS[priority] || SLA_CONFIGS.Medium;
  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + config.responseHours);
  return dueDate;
}

// ============================================================
// 类型定义
// ============================================================

interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: string;
  customerId: string;
  salesOrderId?: string;
  assigneeId?: string;
}

interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

// ============================================================
// 核心业务逻辑
// ============================================================

// 获取当前用户角色
async function getCurrentUserRole(): Promise<string> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role as string || 'SALES';
}

// 获取工单列表
export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  customerId?: string;
  assigneeId?: string;
}) {
  const role = await getCurrentUserRole();
  
  // 构建查询条件
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.customerId) where.customerId = filters.customerId;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

  // ADMIN 可以看全部，SALES 只能看自己相关的
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id as string;
  if (role !== 'ADMIN' && role !== 'FINANCE') {
    // 普通销售只能看到自己客户相关的工单
    where.OR = [
      { customer: { salesOrders: { some: {} } } }, // 自己客户的工单
      { assigneeId: userId }, // 自己处理的工单
    ];
  }

  return prisma.ticket.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, level: true } },
      assignee: { select: { id: true, name: true, email: true } },
      salesOrder: { select: { id: true, orderNumber: true, grandTotal: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

// 获取单个工单
export async function getTicket(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      assignee: { select: { id: true, name: true, email: true } },
      salesOrder: { include: { items: { include: { item: true } } } },
    },
  });
}

// 创建工单（带 SLA 自动计算）
export async function createTicket(data: CreateTicketInput) {
  try {
    // 验证客户存在
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return { error: "客户不存在" };
    }

    // 验证销售订单存在（如果提供了）
    if (data.salesOrderId) {
      const salesOrder = await prisma.salesOrder.findUnique({ where: { id: data.salesOrderId } });
      if (!salesOrder) {
        return { error: "销售订单不存在" };
      }
    }

    // 生成工单号
    const count = await prisma.ticket.count();
    const ticketNo = `TK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // 自动计算 SLA 截止时间
    const priority = data.priority || 'Medium';
    const dueDate = calculateDueDate(priority);

    const userId = await getCurrentUserId();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo,
        title: data.title,
        description: data.description || null,
        priority,
        status: 'Open',
        customerId: data.customerId,
        salesOrderId: data.salesOrderId || null,
        assigneeId: data.assigneeId || null,
        dueDate,
      },
      include: {
        customer: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
      },
    });

    // 记录审计日志
    await logAudit({
      userId,
      action: 'CREATE',
      entityName: 'Ticket',
      entityId: ticket.id,
      details: {
        ticketNo,
        title: data.title,
        priority,
        customerName: customer.name,
        dueDate: dueDate.toISOString(),
      },
    });

    // 发布工单创建事件
    eventBus.publish({
      type: EventType.TICKET_CREATED,
      payload: {
        id: ticket.id,
        ticketNo,
        title: data.title,
        priority,
        customerName: customer.name,
        dueDate: dueDate.toISOString(),
      },
      timestamp: new Date(),
      source: 'CRM',
    });

    revalidatePath("/crm/tickets");
    return { success: true, ticket };
  } catch (error: any) {
    console.error('[Ticket] Create error:', error);
    return { error: error.message || "创建工单失败" };
  }
}

// 更新工单状态（核心方法）
export async function updateTicketStatus(id: string, newStatus: string, userId?: string) {
  try {
    // 获取更新前的数据
    const before = await prisma.ticket.findUnique({ where: { id } });
    if (!before) {
      return { error: "工单不存在" };
    }

    // 验证状态有效性
    const validStatuses = Object.keys(TICKET_STATUS_CONFIG);
    if (!validStatuses.includes(newStatus)) {
      return { error: `无效的状态：${newStatus}` };
    }

    const currentUserId = userId || await getCurrentUserId();

    // 更新工单
    const updated = await prisma.ticket.update({
      where: { id },
      data: { status: newStatus },
      include: {
        customer: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
      },
    });

    // 记录审计日志
    await logAudit({
      userId: currentUserId,
      action: 'UPDATE',
      entityName: 'Ticket',
      entityId: id,
      details: {
        ticketNo: before.ticketNo,
        title: before.title,
        fromStatus: before.status,
        toStatus: newStatus,
      },
    });

    // 发布工单状态变更事件
    eventBus.publish({
      type: EventType.TICKET_STATUS_CHANGED,
      payload: {
        id: updated.id,
        ticketNo: updated.ticketNo,
        title: updated.title,
        fromStatus: before.status,
        toStatus: newStatus,
        priority: updated.priority,
        customerName: updated.customer?.name,
        assigneeName: updated.assignee?.name,
      },
      timestamp: new Date(),
      source: 'CRM',
    });

    revalidatePath("/crm/tickets");
    return { success: true, ticket: updated };
  } catch (error: any) {
    console.error('[Ticket] Status update error:', error);
    return { error: error.message || "更新工单状态失败" };
  }
}

// 更新工单（通用）
export async function updateTicket(id: string, data: UpdateTicketInput) {
  try {
    const before = await prisma.ticket.findUnique({ where: { id } });
    if (!before) {
      return { error: "工单不存在" };
    }

    const userId = await getCurrentUserId();

    // 如果变更了优先级，重新计算 SLA 截止时间
    let dueDate = before.dueDate;
    if (data.priority && data.priority !== before.priority) {
      dueDate = calculateDueDate(data.priority);
    }

    const updateData: any = { ...data, dueDate };

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
      },
    });

    // 记录审计日志
    await logAudit({
      userId,
      action: 'UPDATE',
      entityName: 'Ticket',
      entityId: id,
      details: {
        ticketNo: before.ticketNo,
        changes: {
          before: { status: before.status, priority: before.priority },
          after: { status: data.status, priority: data.priority },
        },
      },
    });

    revalidatePath("/crm/tickets");
    return { success: true, ticket: updated };
  } catch (error: any) {
    console.error('[Ticket] Update error:', error);
    return { error: error.message || "更新工单失败" };
  }
}

// 删除工单
export async function deleteTicket(id: string) {
  try {
    const before = await prisma.ticket.findUnique({ where: { id } });
    if (!before) {
      return { error: "工单不存在" };
    }

    const userId = await getCurrentUserId();

    await prisma.ticket.delete({ where: { id } });

    // 记录审计日志
    await logAudit({
      userId,
      action: 'DELETE',
      entityName: 'Ticket',
      entityId: id,
      details: {
        ticketNo: before.ticketNo,
        title: before.title,
      },
    });

    revalidatePath("/crm/tickets");
    return { success: true };
  } catch (error: any) {
    console.error('[Ticket] Delete error:', error);
    return { error: error.message || "删除工单失败" };
  }
}

// 获取工单统计
export async function getTicketStats() {
  const tickets = await prisma.ticket.findMany({
    include: {
      customer: { select: { id: true, name: true } },
      salesOrder: { select: { id: true, orderNumber: true } },
    },
  });

  // 按状态分组
  const statusStats = Object.keys(TICKET_STATUS_CONFIG).map(status => {
    const count = tickets.filter(t => t.status === status).length;
    return { status, label: TICKET_STATUS_CONFIG[status].label, count };
  });

  // 按优先级分组
  const priorityStats = Object.keys(SLA_CONFIGS).map(priority => {
    const count = tickets.filter(t => t.priority === priority).length;
    return { priority, label: SLA_CONFIGS[priority].label, count, color: SLA_CONFIGS[priority].color };
  });

  // SLA 违规统计
  const now = new Date();
  const overdueCount = tickets.filter(t => 
    t.dueDate && new Date(t.dueDate) < now && !['Resolved', 'Closed'].includes(t.status)
  ).length;

  // 待处理工单
  const openCount = tickets.filter(t => t.status === 'Open').length;

  return {
    totalCount: tickets.length,
    openCount,
    overdueCount,
    statusStats,
    priorityStats,
  };
}