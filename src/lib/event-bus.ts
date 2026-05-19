/**
 * 轻量级事件总线 (Event Bus)
 * 用于 CRM 内部以及 CRM 与 ERP 之间的事件驱动通信
 */

// 事件类型定义
export enum EventType {
  // 商机事件
  OPPORTUNITY_CREATED = 'OPPORTUNITY_CREATED',
  OPPORTUNITY_UPDATED = 'OPPORTUNITY_UPDATED',
  OPPORTUNITY_STAGE_CHANGED = 'OPPORTUNITY_STAGE_CHANGED',
  OPPORTUNITY_WON = 'OPPORTUNITY_WON',
  OPPORTUNITY_LOST = 'OPPORTUNITY_LOST',
  OPPORTUNITY_DELETED = 'OPPORTUNITY_DELETED',
  OPPORTUNITY_CONVERTED = 'OPPORTUNITY_CONVERTED', // 商机转化为订单

  // 客户事件
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_ACTIVITY_ADDED = 'CUSTOMER_ACTIVITY_ADDED',

  // ERP 事件
  SALES_ORDER_CREATED = 'SALES_ORDER_CREATED',
  SALES_ORDER_COMPLETED = 'SALES_ORDER_COMPLETED',
  STOCK_LOW = 'STOCK_LOW', // 库存不足预警
  WORK_ORDER_CREATED = 'WORK_ORDER_CREATED',

  // 工单事件 (Phase 3 - 售后客服)
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_SLA_BREACHED = 'TICKET_SLA_BREACHED', // SLA 违规告警
}

// 事件数据结构
export interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: Date;
  source?: string; // 事件来源模块
  correlationId?: string; // 用于追踪关联事件
}

// 事件监听器类型
export type EventListener<T = any> = (event: AppEvent<T>) => void | Promise<void>;

// 事件总线类
class EventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private isDev = process.env.NODE_ENV !== 'production';

  /**
   * 订阅事件
   * @param eventType 事件类型
   * @param listener 监听器回调
   * @returns 取消订阅的函数
   */
  subscribe<T = any>(eventType: EventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener as EventListener);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(eventType)?.delete(listener as EventListener);
    };
  }

  /**
   * 发布事件（异步，不阻塞主流程）
   * @param event 事件对象
   */
  async publish<T = any>(event: AppEvent<T>): Promise<void> {
    if (this.isDev) {
      console.log(`[EventBus] 📢 发布事件: ${event.type}`, {
        timestamp: event.timestamp,
        source: event.source,
        correlationId: event.correlationId,
      });
    }

    const listeners = this.listeners.get(event.type);
    if (!listeners || listeners.size === 0) {
      if (this.isDev) {
        console.log(`[EventBus] ⚠️ 无订阅者: ${event.type}`);
      }
      return;
    }

    // 异步执行所有监听器
    const promises = Array.from(listeners).map(async (listener) => {
      try {
        await listener(event);
      } catch (error) {
        console.error(`[EventBus] ❌ 监听器执行失败: ${event.type}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 同步发布事件（等待所有监听器完成）
   * @param event 事件对象
   */
  async publishSync<T = any>(event: AppEvent<T>): Promise<void> {
    const listeners = this.listeners.get(event.type);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error(`[EventBus] ❌ 监听器执行失败: ${event.type}`, error);
      }
    }
  }

  /**
   * 清除所有监听器（用于测试）
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取某个事件类型的订阅者数量
   */
  getListenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}

// 单例导出
export const eventBus = new EventBus();

// ============================================================
// 内置监听器（预置的业务逻辑，为 Phase 3/4 预留接口）
// ============================================================

/**
 * 商机赢单监听器 - 准备通知 ERP 系统
 */
eventBus.subscribe(EventType.OPPORTUNITY_WON, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】商机赢单，准备通知 ERP 准备库存...');
  console.log(`  商机名称: ${payload.name}`);
  console.log(`  关联客户: ${payload.customerName}`);
  console.log(`  赢单金额: ¥${payload.value}`);
  
  // TODO: Phase 3 实现 - 调用 ERP 库存预留接口
  // await erpService.reserveInventory(payload.itemId, payload.quantity);
  
  // TODO: Phase 4 实现 - 触发生产工单自动创建
  // await productionService.createWorkOrderFromOpportunity(payload.id);
});

/**
 * 商机流失监听器 - 记录流失分析
 */
eventBus.subscribe(EventType.OPPORTUNITY_LOST, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】商机流失，记录流失分析...');
  console.log(`  商机名称: ${payload.name}`);
  console.log(`  流失阶段: ${payload.lastStage}`);
  
  // TODO: Phase 4 实现 - 流失原因分析
  // await analyticsService.recordLostReason(payload.id, payload.lostReason);
});

/**
 * 商机转化为订单监听器 - CRM 到 ERP 桥梁
 */
eventBus.subscribe(EventType.OPPORTUNITY_CONVERTED, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】商机已转化为 ERP 销售订单...');
  console.log(`  商机 ID: ${payload.opportunityId}`);
  console.log(`  生成订单: ${payload.salesOrderNo}`);
  console.log(`  订单金额: ¥${payload.orderValue}`);
  
  // TODO: Phase 3 实现 - ERP 订单后续处理
  // await erpService.notifySalesOrderCreated(payload.salesOrderId);
});

/**
 * 商机创建监听器 - 初始化销售流程
 */
eventBus.subscribe(EventType.OPPORTUNITY_CREATED, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】新商机创建，初始化销售流程...');
  console.log(`  商机名称: ${payload.name}`);
  console.log(`  负责人: ${payload.ownerName}`);
  
  // TODO: Phase 4 实现 - 发送通知给负责人
  // await notificationService.notifyNewOpportunity(payload.ownerId, payload.id);
});

// ============================================================
// 工单事件监听器 (Phase 3)
// ============================================================

/**
 * 工单创建监听器 - 初始化客户服务流程
 */
eventBus.subscribe(EventType.TICKET_CREATED, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】新工单创建，初始化客服流程...');
  console.log(`  工单号: ${payload.ticketNo}`);
  console.log(`  标题: ${payload.title}`);
  console.log(`  优先级: ${payload.priority}`);
  console.log(`  客户: ${payload.customerName}`);
  console.log(`  SLA 截止: ${payload.dueDate}`);
  
  // TODO: 发送通知给管理员/客服团队
  // await notificationService.notifyNewTicket(payload.assigneeId, payload.id);
  
  // TODO: 触发 SLA 倒计时任务
  // await schedulerService.scheduleSLACheck(payload.id, payload.dueDate);
});

/**
 * 工单状态变更监听器 - 更新客户服务状态
 */
eventBus.subscribe(EventType.TICKET_STATUS_CHANGED, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】工单状态变更...');
  console.log(`  工单号: ${payload.ticketNo}`);
  console.log(`  标题: ${payload.title}`);
  console.log(`  状态变更: ${payload.fromStatus} → ${payload.toStatus}`);
  console.log(`  处理人: ${payload.assigneeName || '未分配'}`);
  
  // TODO: 已解决时发送客户满意度调查
  // if (payload.toStatus === 'Resolved') {
  //   await surveyService.sendSatisfactionSurvey(payload.customerId, payload.id);
  // }
  
  // TODO: 已关闭时计算服务响应时长
  // if (payload.toStatus === 'Closed') {
  //   await analyticsService.recordResolutionTime(payload.id);
  // }
});

/**
 * SLA 违规监听器 - 触发升级流程
 */
eventBus.subscribe(EventType.TICKET_SLA_BREACHED, async (event) => {
  const payload = event.payload as any;
  console.log('【事件总线】⚠️ SLA 违规告警!');
  console.log(`  工单号: ${payload.ticketNo}`);
  console.log(`  标题: ${payload.title}`);
  console.log(`  优先级: ${payload.priority}`);
  console.log(`  客户: ${payload.customerName}`);
  console.log(`  SLA 截止时间: ${payload.dueDate}`);
  
  // TODO: 发送告警给管理员
  // await alertService.sendSLABreachAlert(payload.id, payload.assigneeId);
  
  // TODO: 升级工单给更高权限的人
  // await ticketService.escalateTicket(payload.id);
});

// ============================================================
// 辅助函数
// ============================================================

/**
 * 快速发布事件的便捷函数
 */
export function emit<T = any>(
  type: EventType,
  payload: T,
  options?: { source?: string; correlationId?: string }
): void {
  eventBus.publish({
    type,
    payload,
    timestamp: new Date(),
    source: options?.source,
    correlationId: options?.correlationId,
  });
}

/**
 * 同步发布事件的便捷函数
 */
export function emitSync<T = any>(
  type: EventType,
  payload: T,
  options?: { source?: string; correlationId?: string }
): void {
  eventBus.publishSync({
    type,
    payload,
    timestamp: new Date(),
    source: options?.source,
    correlationId: options?.correlationId,
  });
}

/**
 * 生成唯一 correlationId（用于追踪事件链）
 */
export function generateCorrelationId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}