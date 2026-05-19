"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTicket, updateTicketStatus, updateTicket, TICKET_STATUS_CONFIG, SLA_CONFIGS } from "@/app/actions/ticket-actions";
import { ArrowLeft, Clock, User, Building2, Package, AlertCircle, CheckCircle } from "lucide-react";

interface TicketDetail {
  id: string;
  ticketNo: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  customer: { id: string; name: string; level: string | null };
  assignee: { id: string; name: string; email: string } | null;
  salesOrder: { id: string; orderNumber: string; grandTotal: number } | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 编辑状态
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function loadTicket() {
    try {
      const data = await getTicket(ticketId);
      if (data) {
        setTicket(data as any);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
        setEditStatus(data.status);
        setEditPriority(data.priority);
        setEditAssigneeId(data.assignee?.id || "");
      }
    } catch (err) {
      console.error("Failed to load ticket:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const result = await updateTicketStatus(ticketId, newStatus);
      if (result.success) {
        await loadTicket();
      } else {
        alert(result.error || "更新失败");
      }
    } catch (err) {
      console.error(err);
      alert("更新工单状态失败");
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpdateInfo() {
    setUpdating(true);
    try {
      const result = await updateTicket(ticketId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        assigneeId: editAssigneeId || undefined,
      });
      if (result.success) {
        await loadTicket();
      } else {
        alert(result.error || "更新失败");
      }
    } catch (err) {
      console.error(err);
      alert("更新工单信息失败");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">工单不存在</p>
        <Link href="/crm/tickets" className="text-blue-600 hover:underline mt-2 inline-block">
          返回工单列表
        </Link>
      </div>
    );
  }

  // SLA 计算
  const now = new Date();
  const dueDate = ticket.dueDate ? new Date(ticket.dueDate) : null;
  const isOverdue = dueDate && dueDate < now && !['Resolved', 'Closed'].includes(ticket.status);
  const hoursLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
  const priorityConfig = SLA_CONFIGS[ticket.priority] || SLA_CONFIGS.Medium;
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.Open;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/tickets">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </Link>
          <div>
            <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <span className="font-mono text-blue-600">{ticket.ticketNo}</span>
              <Badge className={priorityConfig.color + " text-white border-0"}>
                {priorityConfig.label}
              </Badge>
            </h3>
          </div>
        </div>

        {/* 状态操作 */}
        <div className="flex items-center gap-2">
          {ticket.status !== 'Resolved' && (
            <Button
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleStatusChange('Resolved')}
              disabled={updating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              标记为已解决
            </Button>
          )}
          {ticket.status !== 'Closed' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('Closed')}
              disabled={updating}
            >
              关闭工单
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：工单详情 */}
        <div className="col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>工单详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>详细描述</Label>
                <Textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>优先级</Label>
                  <Select value={editPriority} onValueChange={(v) => setEditPriority(v as string)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SLA_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select value={editStatus} onValueChange={(v) => handleStatusChange(v as string)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TICKET_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleUpdateInfo} disabled={updating}>
                {updating ? "保存中..." : "保存修改"}
              </Button>
            </CardContent>
          </Card>

          {/* SLA 信息 */}
          <Card className={isOverdue ? "border-red-300 bg-red-50 dark:bg-red-900/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className={`h-5 w-5 ${isOverdue ? "text-red-500" : "text-zinc-400"}`} />
                SLA 信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-zinc-500">SLA 截止时间</p>
                  <p className={`text-lg font-semibold ${isOverdue ? "text-red-600" : ""}`}>
                    {dueDate ? dueDate.toLocaleString() : "-"}
                  </p>
                  {hoursLeft !== null && hoursLeft > 0 && (
                    <p className="text-sm text-zinc-500 mt-1">剩余 {hoursLeft} 小时</p>
                  )}
                  {isOverdue && (
                    <p className="text-sm text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      SLA 已违规！
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-zinc-500">响应时限</p>
                  <p className="text-lg font-semibold">{priorityConfig.responseHours} 小时</p>
                  <p className="text-sm text-zinc-500 mt-1">优先级：{priorityConfig.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：关联信息 */}
        <div className="space-y-6">
          {/* 状态 */}
          <Card>
            <CardHeader>
              <CardTitle>状态</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant="outline"
                className="text-lg px-4 py-2"
                style={{ 
                  backgroundColor: `${statusConfig.color}20`, 
                  borderColor: statusConfig.color,
                  color: statusConfig.color.replace('bg-', '')
                }}
              >
                {statusConfig.label}
              </Badge>
            </CardContent>
          </Card>

          {/* 客户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-zinc-400" />
                客户
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/crm/customers/${ticket.customer.id}`} className="hover:underline">
                <p className="font-medium">{ticket.customer.name}</p>
              </Link>
              {ticket.customer.level && (
                <Badge variant="outline" className="mt-2">{ticket.customer.level}</Badge>
              )}
            </CardContent>
          </Card>

          {/* 处理人 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-400" />
                处理人
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input 
                placeholder="输入处理人 ID" 
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
              />
              {ticket.assignee && (
                <div className="mt-2">
                  <p className="font-medium">{ticket.assignee.name}</p>
                  <p className="text-sm text-zinc-500">{ticket.assignee.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 关联订单 */}
          {ticket.salesOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-zinc-400" />
                  关联订单
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/selling/orders/${ticket.salesOrder.id}`} className="hover:underline">
                  <p className="font-mono text-blue-600">{ticket.salesOrder.orderNumber}</p>
                </Link>
                <p className="text-sm text-zinc-500 mt-1">
                  ¥{ticket.salesOrder.grandTotal.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle>时间</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-zinc-500">创建时间</p>
                <p>{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-500">更新时间</p>
                <p>{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}