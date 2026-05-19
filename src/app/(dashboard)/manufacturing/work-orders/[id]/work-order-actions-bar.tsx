"use client";

import { updateWorkOrderStatus, deleteWorkOrder } from "@/app/actions/work-order-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer, Check, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";

interface WorkOrderActionsBarProps {
  workOrderId: string;
  currentStatus: string;
}

export function WorkOrderActionsBar({ workOrderId, currentStatus }: WorkOrderActionsBarProps) {
  const handleStatusChange = async (newStatus: string) => {
    const res = await updateWorkOrderStatus(workOrderId, newStatus);
    if (res.error) {
      toast.error("操作失败", { description: res.error });
    } else {
      toast.success(`生产单已${newStatus === 'InProgress' ? '开始生产' : newStatus === 'Completed' ? '完工' : '取消'}`);
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个生产单吗？此操作不可撤销。")) return;
    const res = await deleteWorkOrder(workOrderId);
    if (res.error) {
      toast.error("删除失败", { description: res.error });
    } else {
      toast.success("生产单已删除");
      window.location.href = "/manufacturing/work-orders";
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'Draft' && (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStatusChange('InProgress')}
          >
            <Check className="h-4 w-4 mr-1" /> 开始生产
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleStatusChange('Cancelled')}
          >
            <XCircle className="h-4 w-4 mr-1" /> 取消
          </Button>
        </>
      )}
      {currentStatus === 'InProgress' && (
        <>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleStatusChange('Completed')}
          >
            <Check className="h-4 w-4 mr-1" /> 完成生产
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleStatusChange('Cancelled')}
          >
            <XCircle className="h-4 w-4 mr-1" /> 取消
          </Button>
        </>
      )}
      <Link href={`/manufacturing/work-orders/${workOrderId}/print`}>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-1" /> 打印
        </Button>
      </Link>
      {currentStatus === 'Draft' && (
        <Button 
          variant="ghost" 
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1" /> 删除
        </Button>
      )}
    </div>
  );
}