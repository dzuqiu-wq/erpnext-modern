import { prisma } from "@/lib/prisma";
import { getOpportunities, getOpportunityStats, OPPORTUNITY_STAGES } from "@/app/actions/opportunity-actions";
import { KanbanBoard } from "./kanban-board";

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  // 并发获取商机列表和统计数据
  const [opportunities, stats] = await Promise.all([
    getOpportunities(),
    getOpportunityStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">销售商机</h3>
          <p className="text-sm text-zinc-500">追踪商机进展，预测销售管道。</p>
        </div>
      </div>

      {/* 管道数据预测区块 */}
      <PipelineStats stats={stats} />

      {/* Kanban 看板 */}
      <KanbanBoard opportunities={opportunities as any} stages={OPPORTUNITY_STAGES as any} />
    </div>
  );
}

// 管道统计组件
function PipelineStats({ stats }: { stats: Awaited<ReturnType<typeof getOpportunityStats>> }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* 加权预测销售额 */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
        <div className="text-sm font-medium opacity-80 mb-1">加权预测销售额</div>
        <div className="text-2xl font-bold">
          ¥ {stats.weightedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs opacity-70 mt-2">
          基于 {stats.totalOpportunities} 个活跃商机
        </div>
      </div>

      {/* 商机总数 */}
      <div className="bg-white dark:bg-zinc-800 border rounded-lg p-4 shadow-sm">
        <div className="text-sm font-medium text-zinc-500 mb-1">商机总数</div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {stats.totalOpportunities}
        </div>
        <div className="text-xs text-zinc-400 mt-2">
          全部阶段
        </div>
      </div>

      {/* 赢单数 */}
      <div className="bg-white dark:bg-zinc-800 border rounded-lg p-4 shadow-sm">
        <div className="text-sm font-medium text-zinc-500 mb-1">赢单成单</div>
        <div className="text-2xl font-bold text-green-600">
          {stats.wonCount}
        </div>
        <div className="text-xs text-zinc-400 mt-2">
          转化率 {stats.winRate.toFixed(1)}%
        </div>
      </div>

      {/* 输单数 */}
      <div className="bg-white dark:bg-zinc-800 border rounded-lg p-4 shadow-sm">
        <div className="text-sm font-medium text-zinc-500 mb-1">输单流失</div>
        <div className="text-2xl font-bold text-red-500">
          {stats.lostCount}
        </div>
        <div className="text-xs text-zinc-400 mt-2">
          {(100 - stats.winRate).toFixed(1)}% 流失率
        </div>
      </div>
    </div>
  );
}