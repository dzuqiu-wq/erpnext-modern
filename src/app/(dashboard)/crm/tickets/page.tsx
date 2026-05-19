import { getTickets, getTicketStats, TICKET_STATUS_CONFIG, SLA_CONFIGS } from "@/app/actions/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  // 并发获取工单列表和统计数据
  const [tickets, stats] = await Promise.all([
    getTickets(),
    getTicketStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">售后工单</h3>
          <p className="text-sm text-zinc-500">客户服务与 SLA 管理中心。</p>
        </div>
        <Link href="/crm/tickets/new">
          <Button>新建工单</Button>
        </Link>
      </div>

      {/* SLA 统计概览 */}
      <div className="grid grid-cols-4 gap-4">
        {/* SLA 违规 */}
        <Card className={stats.overdueCount > 0 ? "border-red-300 bg-red-50 dark:bg-red-900/20" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${stats.overdueCount > 0 ? "text-red-500" : "text-zinc-400"}`} />
              SLA 违规
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.overdueCount > 0 ? "text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}>
              {stats.overdueCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">逾期未解决</p>
          </CardContent>
        </Card>

        {/* 待处理 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              待处理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600 dark:text-slate-300">
              {stats.openCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">待响应工单</p>
          </CardContent>
        </Card>

        {/* 已解决 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              已解决
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.statusStats.find(s => s.status === 'Resolved')?.count || 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">已完成的工单</p>
          </CardContent>
        </Card>

        {/* 总计 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">全部工单</p>
          </CardContent>
        </Card>
      </div>

      {/* 优先级分布 */}
      <div className="flex gap-4">
        {stats.priorityStats.map((p) => (
          <div
            key={p.priority}
            className="flex items-center gap-2 px-3 py-2 rounded-full border"
            style={{ backgroundColor: `${p.color}20` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-sm font-medium">{p.label}</span>
            <span className="text-sm text-zinc-500">{p.count}</span>
          </div>
        ))}
      </div>

      {/* 工单列表 */}
      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>工单号</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>关联订单</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>SLA 截止</TableHead>
              <TableHead>处理人</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                  暂无工单数据
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket: any) => <TicketRow key={ticket.id} ticket={ticket} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// 工单行组件（处理 SLA 高亮）
function TicketRow({ ticket }: { ticket: any }) {
  // 计算 SLA 状态
  const now = new Date();
  const dueDate = ticket.dueDate ? new Date(ticket.dueDate) : null;
  const isOverdue = dueDate && dueDate < now && !['Resolved', 'Closed'].includes(ticket.status);
  const hoursLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
  const isUrgent = ticket.priority === 'Urgent';

  // 优先级配置
  const priorityConfig = SLA_CONFIGS[ticket.priority] || SLA_CONFIGS.Medium;
  
  // 状态配置
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.Open;

  // 行背景色
  const rowBgClass = isOverdue 
    ? "bg-red-50 dark:bg-red-900/30 border-l-4 border-l-red-500" 
    : isUrgent && ticket.status === 'Open'
    ? "bg-amber-50/50 dark:bg-amber-900/20 border-l-4 border-l-amber-500"
    : "";

  return (
    <TableRow className={rowBgClass}>
      {/* 工单号 */}
      <TableCell className="font-mono text-sm font-medium text-blue-600">
        <Link href={`/crm/tickets/${ticket.id}`} className="hover:underline">
          {ticket.ticketNo}
        </Link>
      </TableCell>

      {/* 标题 */}
      <TableCell>
        <div className="font-medium text-sm">{ticket.title}</div>
        {ticket.description && (
          <div className="text-xs text-zinc-500 truncate max-w-[200px]">
            {ticket.description.substring(0, 50)}
          </div>
        )}
      </TableCell>

      {/* 客户 */}
      <TableCell>
        <Link href={`/crm/customers/${ticket.customer?.id}`} className="hover:underline">
          <div className="flex items-center gap-2">
            <span>{ticket.customer?.name || '-'}</span>
            {ticket.customer?.level && (
              <Badge variant="outline" className="text-[10px]">{ticket.customer.level}</Badge>
            )}
          </div>
        </Link>
      </TableCell>

      {/* 关联订单 */}
      <TableCell>
        {ticket.salesOrder ? (
          <Link 
            href={`/selling/orders/${ticket.salesOrder.id}`}
            className="text-blue-600 hover:underline text-sm font-mono"
          >
            {ticket.salesOrder.orderNumber}
          </Link>
        ) : (
          <span className="text-zinc-400 text-sm">-</span>
        )}
      </TableCell>

      {/* 优先级 */}
      <TableCell>
        <Badge 
          className={`${priorityConfig.color} text-white border-0`}
        >
          {priorityConfig.label}
        </Badge>
      </TableCell>

      {/* 状态 */}
      <TableCell>
        <Badge 
          variant="outline"
          style={{ backgroundColor: `${statusConfig.color}20`, borderColor: statusConfig.color }}
        >
          {statusConfig.label}
        </Badge>
      </TableCell>

      {/* SLA 截止 */}
      <TableCell>
        {dueDate ? (
          <div className={`flex items-center gap-1 text-sm ${isOverdue ? "text-red-600 font-semibold" : "text-zinc-600"}`}>
            {isOverdue && <AlertCircle className="h-3 w-3" />}
            {dueDate.toLocaleDateString()}
            {hoursLeft !== null && hoursLeft > 0 && (
              <span className="text-xs text-zinc-400 ml-1">
                (剩{hoursLeft}h)
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-400 text-sm">-</span>
        )}
      </TableCell>

      {/* 处理人 */}
      <TableCell>
        {ticket.assignee ? (
          <span className="text-sm">{ticket.assignee.name || ticket.assignee.email}</span>
        ) : (
          <span className="text-zinc-400 text-sm">未分配</span>
        )}
      </TableCell>
    </TableRow>
  );
}