"use client";

import { useState } from "react";
import { updateOpportunityStage, convertToSalesOrder } from "@/app/actions/opportunity-actions";
import { toast } from "sonner";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Calendar, DollarSign, User, Clock,
  Plus, RefreshCw, ShoppingCart, CheckCircle
} from "lucide-react";
import Link from "next/link";

// 阶段配置
interface StageConfig {
  key: string;
  label: string;
  color: string;
  probability: number;
}

// 商机类型
interface Opportunity {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  closeDate: Date | string;
  customer: { id: string; name: string; level: string };
  owner: { id: string; name: string; email: string };
  customFields?: Record<string, any>;
  createdAt?: Date | string;
}

interface KanbanBoardProps {
  opportunities: Opportunity[];
  stages: StageConfig[];
}

export function KanbanBoard({ opportunities, stages }: KanbanBoardProps) {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // 按阶段分组商机
  const groupedOpportunities = stages.reduce((acc, stage) => {
    acc[stage.key] = opportunities.filter(o => o.stage === stage.key);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  // 计算每列的汇总
  const getColumnStats = (stageKey: string) => {
    const opps = groupedOpportunities[stageKey] || [];
    const count = opps.length;
    const totalValue = opps.reduce((sum, o) => sum + o.value, 0);
    return { count, totalValue };
  };

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    setRefreshing(opportunityId);
    const res = await updateOpportunityStage(opportunityId, newStage);
    if (res.error) {
      toast.error("操作失败", { description: res.error });
    } else {
      toast.success("商机阶段已更新");
      window.location.reload();
    }
    setRefreshing(null);
  };

  const handleConvertToOrder = async (opportunityId: string, opportunityName: string) => {
    setRefreshing(opportunityId);
    const res = await convertToSalesOrder(opportunityId);
    if (res.error) {
      toast.error("转化失败", { description: res.error });
      setRefreshing(null);
    } else {
      toast.success("销售订单已生成", {
        description: `商机 "${opportunityName}" 已转化为 ${res.salesOrder?.orderNumber}`,
      });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {/* 看板头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="font-medium">销售漏斗</span>
          <span>|</span>
          <span>拖动卡片可调整顺序，点击阶段按钮可快速推进</span>
        </div>
        <Link href="/crm/opportunities/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            新建商机
          </Button>
        </Link>
      </div>

      {/* Kanban 列 */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const { count, totalValue } = getColumnStats(stage.key);
          const stageOpps = groupedOpportunities[stage.key] || [];

          return (
            <div 
              key={stage.key} 
              className="flex flex-col min-w-[240px] bg-zinc-100 dark:bg-zinc-800/50 rounded-lg"
            >
              {/* 列头 */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stage.color.includes('-') ? undefined : stage.color }}
                    aria-hidden
                  />
                  <span className="font-medium text-sm">{stage.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {count}
                  </Badge>
                </div>
                <div className="text-xs text-zinc-500">
                  ¥ {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* 商机卡片列表 */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                {stageOpps.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400">
                    暂无商机
                  </div>
                ) : (
                  stageOpps.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      stages={stages}
                      isRefreshing={refreshing === opp.id}
                      onStageChange={handleStageChange}
                      onConvertToOrder={handleConvertToOrder}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 单张商机卡片
function OpportunityCard({
  opportunity,
  stages,
  isRefreshing,
  onStageChange,
  onConvertToOrder,
}: {
  opportunity: Opportunity;
  stages: StageConfig[];
  isRefreshing: boolean;
  onStageChange: (id: string, stage: string) => void;
  onConvertToOrder: (id: string, name: string) => void;
}) {
  // 计算结单倒计时
  const closeDate = new Date(opportunity.closeDate);
  const today = new Date();
  const daysLeft = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft >= 0 && daysLeft <= 7;

  // 获取下一个阶段
  const currentIndex = stages.findIndex(s => s.key === opportunity.stage);
  const nextStage = stages[currentIndex + 1];

  // 检查是否已转化
  const isConverted = (opportunity.customFields as any)?.convertedToSalesOrder === true;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-md p-3 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow">
      {/* 商机名称 */}
      <div className="font-medium text-sm mb-2 line-clamp-2">
        {opportunity.name}
      </div>

      {/* 客户信息 */}
      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
        <User className="h-3 w-3" />
        <span className="truncate">{opportunity.customer.name}</span>
        <Badge variant="outline" className="ml-auto text-[10px]">
          {opportunity.customer.level}
        </Badge>
      </div>

      {/* 金额 */}
      <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 mb-2">
        <DollarSign className="h-4 w-4" />
        <span>¥ {opportunity.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* 概率和结单日期 */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          概率 {opportunity.probability}%
        </span>
        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : ''}`}>
          <Clock className="h-3 w-3" />
          <span>
            {isOverdue ? `已逾期 ${Math.abs(daysLeft)} 天` : `${daysLeft} 天后结单`}
          </span>
        </div>
      </div>

      {/* 已转化标识 */}
      {isConverted && (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded mb-2">
          <CheckCircle className="h-3 w-3" />
          <span>已转化为订单</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        {/* Won 阶段的金色转化按钮 */}
        {opportunity.stage === 'Won' && !isConverted && (
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs flex-1 gap-1 bg-amber-500 hover:bg-amber-600 text-white border-0"
            onClick={() => onConvertToOrder(opportunity.id, opportunity.name)}
            disabled={isRefreshing}
          >
            <ShoppingCart className="h-3 w-3" />
            生成销售订单
          </Button>
        )}

        {/* 快速推进按钮 */}
        {nextStage && !['Won', 'Lost'].includes(opportunity.stage) && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs flex-1 gap-1"
            onClick={() => onStageChange(opportunity.id, nextStage.key)}
            disabled={isRefreshing}
          >
            <ArrowRight className="h-3 w-3" />
            推进
          </Button>
        )}

        {/* 阶段选择器 */}
        <Select
          value={opportunity.stage}
          onValueChange={(val) => { if (val) onStageChange(opportunity.id, val); }}
          disabled={isRefreshing}
        >
          <SelectTrigger className="h-7 text-xs w-full">
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.key} value={stage.key}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}