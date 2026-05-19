"use client";

import { updateDeliveryNoteStatus, deleteDeliveryNote } from "@/app/actions/delivery-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer, Check, Truck, XCircle, Trash2 } from "lucide-react";
import Link from "next/link";

interface DeliveryNoteActionsBarProps {
  deliveryNoteId: string;
  currentStatus: string;
}

export function DeliveryNoteActionsBar({ deliveryNoteId, currentStatus }: DeliveryNoteActionsBarProps) {
  const handleStatusChange = async (newStatus: string) => {
    const res = await updateDeliveryNoteStatus(deliveryNoteId, newStatus);
    if (res.error) {
      toast.error("操作失败", { description: res.error });
    } else {
      const statusText = newStatus === 'Printed' ? '已打印' : newStatus === 'Delivered' ? '已发货' : '已取消';
      toast.success(`送货单已${statusText}`);
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个送货单吗？此操作不可撤销。")) return;
    const res = await deleteDeliveryNote(deliveryNoteId);
    if (res.error) {
      toast.error("删除失败", { description: res.error });
    } else {
      toast.success("送货单已删除");
      window.location.href = "/delivery/notes";
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'Draft' && (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStatusChange('Printed')}
          >
            <Printer className="h-4 w-4 mr-1" /> 标记已打印
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
      {currentStatus === 'Printed' && (
        <>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleStatusChange('Delivered')}
          >
            <Truck className="h-4 w-4 mr-1" /> 确认发货
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
      <Link href={`/delivery/notes/${deliveryNoteId}/print`}>
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