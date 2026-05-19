import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Package, User } from "lucide-react";
import { WorkOrderActionsBar } from "./work-order-actions-bar";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!workOrder) {
    notFound();
  }

  // 解析 customAttributes
  let customAttributes: Record<string, any> = {};
  if (workOrder.customAttributes) {
    try {
      customAttributes = workOrder.customAttributes as Record<string, any>;
    } catch {
      customAttributes = {};
    }
  }

  return (
    <div className="space-y-6">
      {/* 顶部操作区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manufacturing/work-orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{workOrder.workOrderNo}</h3>
            <p className="text-sm text-zinc-500">生产单详情</p>
          </div>
          {workOrder.status === 'Draft' ? <Badge variant="outline">草稿</Badge> :
           workOrder.status === 'InProgress' ? <Badge className="bg-amber-600">生产中</Badge> :
           workOrder.status === 'Completed' ? <Badge className="bg-green-600">已完成</Badge> :
           <Badge variant="destructive">已取消</Badge>}
        </div>
        <WorkOrderActionsBar workOrderId={workOrder.id} currentStatus={workOrder.status} />
      </div>

      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> 成品信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">成品编码:</span>
              <span className="font-mono font-medium">{workOrder.itemCode || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">成品名称:</span>
              <span className="font-medium">{workOrder.itemName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">生产数量:</span>
              <span className="font-bold text-blue-600">{(workOrder.quantity as number).toLocaleString()} PCS</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" /> 时间安排
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">开始日期:</span>
              <span>{workOrder.startDate ? new Date(workOrder.startDate).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">出货日期:</span>
              <span className="font-medium">{workOrder.endDate ? new Date(workOrder.endDate).toLocaleDateString() : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">创建时间:</span>
              <span>{workOrder.createdAt.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 人员信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" /> 相关人员
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-6 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">制表人:</span>
            <span>{workOrder.maker || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">审核人:</span>
            <span>{workOrder.auditor || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">关联销售单:</span>
            <span>{workOrder.salesOrderId || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 生产工艺参数 */}
      {Object.keys(customAttributes).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">生产工艺参数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(customAttributes).map(([key, value]) => (
                <div key={key} className="p-3 border rounded-md bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="text-xs text-zinc-500 mb-1">{key}</div>
                  <div className="font-medium text-sm">{String(value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}