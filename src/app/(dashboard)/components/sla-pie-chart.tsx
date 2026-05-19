"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface SLAPieChartProps {
  data?: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    overdue: number;
    healthyRate: number;
  };
  title?: string;
}

export function SLAPieChart({ data, title = "售后健康看板" }: SLAPieChartProps) {
  // 默认数据
  const defaultData = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    healthyRate: 0,
  };

  const stats = data || defaultData;
  const healthy = stats.total - stats.overdue;

  // 饼图数据
  const pieData = [
    { name: '正常', value: healthy, color: '#22c55e' },
    { name: '逾期警告', value: stats.overdue, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // 如果没有数据，添加一个空状态
  if (stats.total === 0) {
    pieData.push({ name: '暂无工单', value: 1, color: '#e5e7eb' });
  }

  // 状态分布数据
  const statusData = [
    { name: '待处理', value: stats.open, color: '#94a3b8' },
    { name: '处理中', value: stats.inProgress, color: '#3b82f6' },
    { name: '已解决', value: stats.resolved, color: '#22c55e' },
    { name: '已关闭', value: stats.closed, color: '#6b7280' },
  ].filter(d => d.value > 0);

  if (statusData.length === 0 && stats.total === 0) {
    statusData.push({ name: '暂无工单', value: 1, color: '#e5e7eb' });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 健康度环形图 */}
        <div className="mb-4">
          <div className="relative w-40 h-40 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} 个`, '']}
                  labelStyle={{ color: '#666' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* 中心文字 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {stats.total > 0 ? Math.round(stats.healthyRate * 100) : 0}%
              </div>
              <div className="text-xs text-zinc-500">健康率</div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-zinc-600">正常 {healthy}</span>
          </div>
          {stats.overdue > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-red-600">逾期 {stats.overdue}</span>
            </div>
          )}
        </div>

        {/* 状态分布小柱状图 */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium">状态分布</p>
          {statusData.map(item => {
            const percent = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-16">{item.name}</span>
                <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{ 
                      width: `${percent}%`,
                      backgroundColor: item.color,
                      minWidth: item.value > 0 ? '4px' : '0'
                    }}
                  />
                </div>
                <span className="text-xs font-mono w-12 text-right">{item.value}</span>
              </div>
            );
          })}
        </div>

        {/* SLA 警告 */}
        {stats.overdue > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700 dark:text-red-400">
                  SLA 违规警告
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  有 <span className="font-semibold">{stats.overdue}</span> 个工单已超过 SLA 截止时间，需要立即处理！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 整体统计 */}
        {stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-zinc-500">总工单</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-600">{stats.open + stats.inProgress}</div>
                <div className="text-xs text-zinc-500">进行中</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{stats.resolved + stats.closed}</div>
                <div className="text-xs text-zinc-500">已完成</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 简洁版小组件（用于 KPI 卡片内嵌）
export function SLAMiniIndicator({ overdue = 0 }: { overdue?: number }) {
  if (overdue === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">SLA 正常</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-red-600">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm font-medium">SLA 违规 {overdue}</span>
    </div>
  );
}