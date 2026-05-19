"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTicket, SLA_CONFIGS } from "@/app/actions/ticket-actions";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [salesOrderId, setSalesOrderId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createTicket({
        customerId,
        title,
        description,
        priority,
        salesOrderId: salesOrderId || undefined,
        assigneeId: assigneeId || undefined,
      });

      if (result.error) {
        alert(result.error);
      } else {
        router.push("/crm/tickets");
      }
    } catch (err) {
      console.error(err);
      alert("创建工单失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  // SLA 预览
  const previewConfig = SLA_CONFIGS[priority] || SLA_CONFIGS.Medium;
  const previewDueDate = (() => {
    const d = new Date();
    d.setHours(d.getHours() + previewConfig.responseHours);
    return d.toLocaleString();
  })();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link href="/crm/tickets">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回工单列表
        </Button>
      </Link>

      {/* 标题 */}
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建工单</h3>
        <p className="text-sm text-zinc-500">创建客户售后服务工单，系统将自动计算 SLA 响应时限。</p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 客户选择 */}
            <div className="space-y-2">
              <Label htmlFor="customerId">客户 *</Label>
              <Input
                id="customerId"
                placeholder="输入客户 ID"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              />
            </div>

            {/* 工单标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">工单标题 *</Label>
              <Input
                id="title"
                placeholder="简要描述问题/咨询"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 详细描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">详细描述</Label>
              <Textarea
                id="description"
                placeholder="详细描述客户的问题或需求..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA 配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 优先级 */}
            <div className="space-y-2">
              <Label htmlFor="priority">优先级 *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SLA_CONFIGS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label} - 响应时限 {config.responseHours} 小时
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SLA 预览 */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    SLA 响应时限预览
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    选择 <span className="font-semibold">{previewConfig.label}</span> 优先级，
                    系统将在 <span className="font-semibold">{previewDueDate}</span> 之前响应此工单。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>关联信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 关联订单 */}
            <div className="space-y-2">
              <Label htmlFor="salesOrderId">关联销售订单</Label>
              <Input
                id="salesOrderId"
                placeholder="输入订单 ID（可选）"
                value={salesOrderId}
                onChange={(e) => setSalesOrderId(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                如果是订单相关问题，可以关联对应的销售订单
              </p>
            </div>

            {/* 处理人 */}
            <div className="space-y-2">
              <Label htmlFor="assigneeId">分配给</Label>
              <Input
                id="assigneeId"
                placeholder="输入处理人 ID（可选）"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <Link href="/crm/tickets">
            <Button variant="outline" type="button">取消</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "创建中..." : "创建工单"}
          </Button>
        </div>
      </form>
    </div>
  );
}