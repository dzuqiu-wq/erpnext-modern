"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { createWorkOrder } from "@/app/actions/work-order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  salesOrderId: z.string().optional(),
  customerId: z.string().optional(),
  itemId: z.string().min(1, { message: "请选择成品" }),
  itemName: z.string().min(1, { message: "请输入成品名称" }),
  itemCode: z.string().min(1, { message: "请输入成品编码" }),
  quantity: z.coerce.number().min(1, { message: "数量必须至少为 1" }),
  startDate: z.string().min(1, { message: "请选择开始日期" }),
  endDate: z.string().min(1, { message: "请选择出货日期" }),
  maker: z.string().optional(),
  auditor: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductionParam {
  label: string;
  value: string;
}

export function WorkOrderForm({
  customers,
  salesOrders,
  items,
}: {
  customers: { id: string; name: string }[];
  salesOrders: { id: string; orderNumber: string }[];
  items: { id: string; itemCode: string; itemName: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState<ProductionParam[]>([
    { label: "频率", value: "" },
    { label: "锣牙", value: "" },
    { label: "空载电流", value: "" },
    { label: "阻抗", value: "" },
    { label: "PCB层数", value: "" },
    { label: "板厚", value: "" },
    { label: "铜厚", value: "" },
    { label: "表面处理", value: "" },
    { label: "阻焊颜色", value: "" },
    { label: "字符颜色", value: "" },
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      itemId: "",
      quantity: 1,
      startDate: "",
      endDate: "",
      maker: "",
      auditor: "",
    },
  });

  const updateParam = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...parameters];
    updated[index][field] = val;
    setParameters(updated);
  };

  const addParam = () => setParameters([...parameters, { label: "", value: "" }]);
  const removeParam = (index: number) => setParameters(parameters.filter((_, i) => i !== index));

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);

    // 构建自定义属性 JSON
    const customAttributes: Record<string, any> = {};
    parameters.forEach(p => {
      if (p.label && p.value) {
        customAttributes[p.label] = p.value;
      }
    });

    const res = await createWorkOrder({
      salesOrderId: values.salesOrderId || undefined,
      customerId: values.customerId || undefined,
      itemId: values.itemId,
      itemName: values.itemName,
      itemCode: values.itemCode,
      quantity: values.quantity,
      startDate: values.startDate,
      endDate: values.endDate,
      customAttributes,
      maker: values.maker || undefined,
      auditor: values.auditor || undefined,
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("生产单创建成功");
      router.push("/manufacturing/work-orders");
      router.refresh();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
      {/* 基础信息 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">关联销售订单</label>
          <Select onValueChange={(v) => { if (v) form.setValue("salesOrderId", v); }} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="可选 - 关联销售订单" />
            </SelectTrigger>
            <SelectContent>
              {salesOrders.map((so) => (
                <SelectItem key={so.id} value={so.id}>{so.orderNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">关联客户</label>
          <Select onValueChange={(v) => { if (v) form.setValue("customerId", v); }} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="可选 - 关联客户" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 成品选择 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">选择成品 *</label>
          <Select
            onValueChange={(v) => {
              if (!v) return;
              const item = items.find(i => i.id === v);
              if (item) {
                form.setValue("itemId", v, { shouldValidate: true });
                form.setValue("itemCode", item.itemCode || "", { shouldValidate: true });
                form.setValue("itemName", item.itemName, { shouldValidate: true });
              }
            }}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="选择成品物料" />
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id}>{i.itemCode} - {i.itemName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.itemId && (
            <p className="text-sm text-red-500">{String(form.formState.errors.itemId.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">成品编码 *</label>
          <Input {...form.register("itemCode")} placeholder="自动填充或手动输入" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">成品名称 *</label>
          <Input {...form.register("itemName")} placeholder="自动填充或手动输入" />
        </div>
      </div>

      {/* 数量和日期 */}
      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">生产数量 *</label>
          <Input type="number" min="1" {...form.register("quantity", { valueAsNumber: true })} />
          {form.formState.errors.quantity && (
            <p className="text-sm text-red-500">{String(form.formState.errors.quantity.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">开始日期 *</label>
          <Input type="date" {...form.register("startDate")} />
          {form.formState.errors.startDate && (
            <p className="text-sm text-red-500">{String(form.formState.errors.startDate.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">出货日期 *</label>
          <Input type="date" {...form.register("endDate")} />
          {form.formState.errors.endDate && (
            <p className="text-sm text-red-500">{String(form.formState.errors.endDate.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">制表人</label>
          <Input {...form.register("maker")} placeholder="制表人姓名" />
        </div>
      </div>

      {/* 审核人单独一行 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">审核人</label>
          <Input {...form.register("auditor")} placeholder="审核人姓名" />
        </div>
      </div>

      {/* 动态生产参数 */}
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg">生产工艺参数</h4>
          <Button type="button" variant="outline" size="sm" onClick={addParam}>
            <Plus className="h-4 w-4 mr-1" /> 添加参数
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {parameters.map((param, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-md bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">参数 {index + 1}</span>
                {parameters.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-700"
                    onClick={() => removeParam(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Input
                value={param.label}
                onChange={(e) => updateParam(index, 'label', e.target.value)}
                placeholder="参数名称"
                className="text-sm"
              />
              <Input
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                placeholder="参数值"
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          提示：这些参数将作为 JSON 存储在 customAttributes 字段中，支持灵活的个性化配置。
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/manufacturing/work-orders")}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建生产单"}
        </Button>
      </div>
    </form>
  );
}