"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  totalValue: number;
  conversionRate: number;
}

interface FunnelChartProps {
  data?: FunnelStage[];
  title?: string;
}

export function FunnelChart({ data = [], title = "商机销售漏斗" }: FunnelChartProps) {
  // 默认数据（当没有数据时展示示例）
  const defaultData: FunnelStage[] = [
    { stage: 'Qualification', label: '意向', count: 0, totalValue: 0, conversionRate: 1 },
    { stage: 'Needs Analysis', label: '需求分析', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Proposal', label: '方案报价', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Negotiation', label: '商务谈判', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Closed Won', label: '赢单', count: 0, totalValue: 0, conversionRate: 0 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  // 漏斗颜色渐变：从浅到深
  const colors = [
    '#3b82f6', // 意向 - 蓝色
    '#6366f1', // 需求 - 靛蓝
    '#8b5cf6', // 方案 - 紫色
    '#a855f7', // 谈判 - 紫红
    '#22c55e', // 赢单 - 绿色
  ];

  // 计算最大宽度比例（用于漏斗可视化）
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" />
          </svg>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chartData.map((item, index) => {
            // 计算漏斗宽度百分比
            const widthPercent = item.count > 0 ? Math.max((item.count / maxCount) * 100, 10) : 0;
            const isWin = item.stage === 'Closed Won';
            
            return (
              <div key={item.stage} className="space-y-1">
                {/* 阶段标签 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: colors[index] }}
                    />
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-zinc-400">({item.stage})</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-600">
                    <span className="font-mono">{item.count} 个</span>
                    {item.count > 0 && (
                      <span className="text-xs text-zinc-400">
                        转化率 {Math.round(item.conversionRate * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 漏斗条 */}
                <div className="relative h-8 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                      isWin ? 'bg-green-500' : ''
                    }`}
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: colors[index],
                      minWidth: item.count > 0 ? '8px' : '0',
                    }}
                  />
                  {/* 金额标签 */}
                  {item.totalValue > 0 && (
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white"
                    >
                      ¥{(item.totalValue / 10000).toFixed(1)}万
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 汇总统计 */}
        {data.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-zinc-500">总商机数：</span>
                <span className="font-semibold">
                  {data.reduce((sum, d) => sum + d.count, 0)} 个
                </span>
              </div>
              <div>
                <span className="text-zinc-500">漏斗总金额：</span>
                <span className="font-semibold text-blue-600">
                  ¥{(data.reduce((sum, d) => sum + d.totalValue, 0) / 10000).toFixed(1)}万
                </span>
              </div>
              <div>
                <span className="text-zinc-500">赢单转化率：</span>
                <span className="font-semibold text-green-600">
                  {Math.round((data.find(d => d.stage === 'Closed Won')?.count || 0) / 
                    Math.max(data[0]?.count || 1, 1) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 简化版柱状图展示（备选方案）
export function FunnelBarChart({ data = [], title = "商机漏斗" }: FunnelChartProps) {
  const defaultData: FunnelStage[] = [
    { stage: 'Qualification', label: '意向', count: 0, totalValue: 0, conversionRate: 1 },
    { stage: 'Needs Analysis', label: '需求分析', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Proposal', label: '方案报价', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Negotiation', label: '商务谈判', count: 0, totalValue: 0, conversionRate: 0 },
    { stage: 'Closed Won', label: '赢单', count: 0, totalValue: 0, conversionRate: 0 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis 
              dataKey="label" 
              type="category" 
              width={60}
              tick={{ fontSize: 12 }}
            />
<Tooltip 
                  formatter={(value: any) => [`${value} 个`, '商机数量']}
                  labelStyle={{ color: '#666' }}
                />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === chartData.length - 1 ? '#22c55e' : '#6366f1'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}