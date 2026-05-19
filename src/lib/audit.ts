import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// 需要记录审计日志的实体
const AUDITED_ENTITIES = ['Customer', 'SalesOrder', 'WorkOrder', 'DeliveryNote', 'Item'];

// 审计日志操作类型
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SNAPSHOT_GENERATED';

// 审计日志数据
interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// 创建审计日志（异步，不阻塞主操作）
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entityName: data.entityName,
        entityId: data.entityId || null,
        details: data.details || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    });
  } catch (error) {
    // 审计日志失败不应影响主操作，仅记录错误
    console.error('[AuditLog] Failed to write audit log:', error);
  }
}

// 记录实体变更（自动对比前后数据）
export async function logEntityChange(
  entityName: string,
  entityId: string,
  action: AuditAction,
  before?: Record<string, any>,
  after?: Record<string, any>,
  userId?: string
): Promise<void> {
  // 计算变更详情
  let details: Record<string, any> = {};
  
  if (action === 'UPDATE' && before && after) {
    // 对比前后数据，找出变更字段
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key of Object.keys(after)) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { from: before[key], to: after[key] };
      }
    }
    details = { changes, before, after };
  } else if (action === 'CREATE') {
    details = { created: after };
  } else if (action === 'DELETE') {
    details = { deleted: before };
  }

  await logAudit({
    userId,
    action,
    entityName,
    entityId,
    details,
  });
}

// 获取当前会话用户 ID（用于审计日志）
export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id as string | undefined;
  } catch {
    return undefined;
  }
}

// 包装需要审计的 Prisma 操作
export function createAuditedOperation<T>(
  entityName: string,
  operation: (args: any) => Promise<T>,
  getEntityId?: (result: T) => string
) {
  return async function auditedOperation(
    args: any,
    userId?: string,
    beforeData?: Record<string, any>
  ): Promise<T> {
    // 执行操作
    const result = await operation(args);
    
    // 获取实体 ID
    const entityId = getEntityId ? getEntityId(result) : (args?.where?.id || args?.data?.id);
    
    // 记录审计日志（异步，不阻塞）
    const afterData = result as Record<string, any>;
    logEntityChange(
      entityName,
      entityId,
      beforeData ? 'UPDATE' : 'CREATE',
      beforeData,
      afterData,
      userId
    ).catch(console.error);
    
    return result;
  };
}

// 包装需要审计的删除操作
export function createAuditedDelete(
  entityName: string,
  deleteOperation: (args: any) => Promise<any>
) {
  return async function auditedDelete(
    args: any,
    userId?: string
  ): Promise<any> {
    // 先获取删除前的数据
    let beforeData: Record<string, any> | undefined;
    if (args?.where?.id) {
      try {
        // 尝试获取原数据（需要根据具体模型调整查询方式）
        // 对于大多数模型，可以通过 findUnique 获取
        beforeData = { id: args.where.id };
      } catch {
        // 忽略获取失败的情况
      }
    }
    
    // 执行删除
    const result = await deleteOperation(args);
    
    // 记录审计日志
    logEntityChange(
      entityName,
      args?.where?.id || 'unknown',
      'DELETE',
      beforeData,
      undefined,
      userId
    ).catch(console.error);
    
    return result;
  };
}

// 清理旧审计日志（保留最近 90 天）
export async function cleanupOldAuditLogs(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });
  
  return result.count;
}

// 导出审计日志查询
export async function getAuditLogs(params: {
  entityName?: string;
  entityId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (params.entityName) where.entityName = params.entityName;
  if (params.entityId) where.entityId = params.entityId;
  if (params.userId) where.userId = params.userId;
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }
  
  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}