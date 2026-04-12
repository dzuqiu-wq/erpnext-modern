"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { createPurchaseOrder } from "@/app/actions/purchase-order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  supplierId: z.string().min(1, { message: "请选择供应商" }),
  items: z.array(z.object({
    itemId: z.string().min(1, { message: "请选择物料" }),
    quantity: z.coerce.number().min(1, { message: "数量必须大于 0" }),
    rate: z.coerce.number().min(0, { message: "单价不能为负" }),
  })).min(1, { message: "至少添加一行物料" }),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseOrderFormProps {
  suppliers: { id: string; name: string }[];
  itemsMaster: { id: string; itemCode: string; itemName: string; standardRate: number }[];
}

export function PurchaseOrderForm({ suppliers, itemsMaster }: PurchaseOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { supplierId: "", items: [{ itemId: "", quantity: 1, rate: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const items = values.items.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      rate: item.rate,
    }));
    const res = await createPurchaseOrder({ supplierId: values.supplierId, items });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("采购单创建成功");
      router.push("/buying/orders");
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="supplierId" className="text-sm font-medium">供应商 *</label>
        <Select onValueChange={(value) => form.setValue("supplierId", String(value))}>
          <SelectTrigger id="supplierId">
            <SelectValue placeholder="请选择供应商" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.supplierId && (
          <p className="text-sm text-red-500">{String(form.formState.errors.supplierId.message || "")}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">采购物料明细</label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", quantity: 1, rate: 0 })}>
            + 添加一行
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="text-sm text-red-500">至少需要添加一行物料</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-end p-3 border rounded-md bg-zinc-50 dark:bg-zinc-900">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-zinc-500">物料</label>
              <Select onValueChange={(value) => form.setValue(`items.${index}.itemId`, String(value))} value={form.getValues(`items.${index}.itemId`)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择物料" />
                </SelectTrigger>
                <SelectContent>
                  {itemsMaster.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemCode} - {item.itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.items?.[index]?.itemId && (
                <p className="text-xs text-red-500">{String(form.formState.errors.items[index].itemId.message || "")}</p>
              )}
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-zinc-500">数量</label>
              <Input type="number" min={1} {...form.register(`items.${index}.quantity`)} />
              {form.formState.errors.items?.[index]?.quantity && (
                <p className="text-xs text-red-500">{String(form.formState.errors.items[index].quantity.message || "")}</p>
              )}
            </div>
            <div className="w-32 space-y-1">
              <label className="text-xs text-zinc-500">单价 (参考: 进价=销价×50%)</label>
              <Input type="number" min={0} step={0.01} {...form.register(`items.${index}.rate`)} />
              {form.formState.errors.items?.[index]?.rate && (
                <p className="text-xs text-red-500">{String(form.formState.errors.items[index].rate.message || "")}</p>
              )}
            </div>
            <div className="w-32 space-y-1">
              <label className="text-xs text-zinc-500">参考进价</label>
              <div className="h-9 px-3 flex items-center text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border">
                {(() => {
                  const itemId = form.getValues(`items.${index}.itemId`);
                  const item = itemsMaster.find(i => i.id === (itemId as string));
                  return item ? `¥ ${(item.standardRate * 0.5).toFixed(2)}` : "-";
                })()}
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/buying/orders")}>取消</Button>
        <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存采购单"}</Button>
      </div>
    </form>
  );
}
