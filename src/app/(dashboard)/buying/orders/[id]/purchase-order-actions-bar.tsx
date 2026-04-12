"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updatePurchaseOrderStatus } from "@/app/actions/purchase-order-actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Send } from "lucide-react";

export function PurchaseOrderActionsBar({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string, successMessage: string) => {
    setLoading(true);
    const res = await updatePurchaseOrderStatus(orderId, newStatus);

    if (res.error) {
      toast.error("操作失败", { description: res.error });
    } else {
      toast.success(successMessage);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'Draft' && (
        <Button size="sm" onClick={() => handleStatusChange('Submitted', '采购单已提交')} disabled={loading}>
          <Send className="mr-2 h-4 w-4" /> 提交单据
        </Button>
      )}

      {currentStatus === 'Submitted' && (
        <>
          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('Completed', '采购单已完成')} disabled={loading}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> 标记为已完成
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleStatusChange('Cancelled', '采购单已取消')} disabled={loading}>
            <XCircle className="mr-2 h-4 w-4" /> 取消单据
          </Button>
        </>
      )}

      <Button variant="outline" size="sm" onClick={() => window.print()}>打印单据</Button>
    </div>
  );
}
