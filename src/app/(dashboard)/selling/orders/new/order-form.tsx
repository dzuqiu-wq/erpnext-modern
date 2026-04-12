"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import { createSalesOrder } from "@/app/actions/order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const formSchema = z.object({
  customerId: z.string().min(1, { message: "请选择客户" }),
  deliveryDate: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  items: z.array(z.object({
    itemId: z.string().min(1, { message: "请选择商品" }),
    warehouseId: z.string().min(1, { message: "请选择发货仓库" }),
    quantity: z.coerce.number().min(1, { message: "数量必须至少为 1" }),
    rate: z.coerce.number().min(0, { message: "单价不能为负数" }),
  })).min(1, { message: "订单至少需要包含一个商品明细" }),
});

type FormValues = z.infer<typeof formSchema>;

export function OrderForm({
  customers,
  itemsMaster,
  warehouses
}: {
  customers: { id: string; name: string }[];
  itemsMaster: { id: string; itemCode: string; itemName: string; standardRate: number }[];
  warehouses: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customerId: "",
      deliveryDate: "",
      discountAmount: 0,
      taxRate: 0,
      items: [{ itemId: "", warehouseId: "", quantity: 1, rate: 0 }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchDiscount = form.watch("discountAmount") ?? 0;
  const watchTax = form.watch("taxRate") ?? 0;

  const itemsTotal = watchItems.reduce(
    (acc, curr) => acc + ((curr.quantity || 0) * (curr.rate || 0)),
    0
  );
  const subTotal = Math.max(0, itemsTotal - watchDiscount);
  const taxAmount = subTotal * (watchTax / 100);
  const grandTotal = subTotal + taxAmount;

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);
    const res = await createSalesOrder({
      customerId: values.customerId,
      items: values.items,
      deliveryDate: values.deliveryDate || undefined,
      discountAmount: values.discountAmount,
      taxRate: values.taxRate,
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("销售订单创建成功");
      router.push("/selling/orders");
      router.refresh();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
      {/* 主表：客户信息 */}
      <div className="max-w-md">
        <div className="space-y-2">
          <label htmlFor="customerId" className="text-sm font-medium">选择客户 *</label>
          <Select onValueChange={(value) => form.setValue("customerId", String(value))} defaultValue="">
            <SelectTrigger id="customerId">
              <SelectValue placeholder="请选择交易客户" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-red-500">{String(form.formState.errors.customerId.message || "")}</p>
          )}
        </div>
      </div>

      {/* 子表：商品明细 */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
            <TableRow>
              <TableHead className="w-[25%]">商品 (Item)</TableHead>
              <TableHead className="w-[20%]">发货仓库 (Warehouse)</TableHead>
              <TableHead className="w-[15%]">数量 (Qty)</TableHead>
              <TableHead className="w-[15%]">单价 (Rate)</TableHead>
              <TableHead className="w-[15%] text-right">金额</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Select
                    onValueChange={(val) => {
                      form.setValue(`items.${index}.itemId`, String(val), { shouldValidate: true });
                      const selectedItem = itemsMaster.find(i => i.id === val);
                      if (selectedItem) form.setValue(`items.${index}.rate`, selectedItem.standardRate);
                    }}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择商品" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsMaster.map((i) => (<SelectItem key={i.id} value={i.id}>{i.itemCode} - {i.itemName}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[index]?.itemId && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.items[index]?.itemId?.message || "")}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(val) => form.setValue(`items.${index}.warehouseId`, String(val), { shouldValidate: true })}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.code} - {w.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[index]?.warehouseId && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.items[index]?.warehouseId?.message || "")}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                  {form.formState.errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.items[index]?.quantity?.message || "")}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                  />
                  {form.formState.errors.items?.[index]?.rate && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.items[index]?.rate?.message || "")}</p>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono align-middle">
                  ¥ {((watchItems[index]?.quantity || 0) * (watchItems[index]?.rate || 0)).toFixed(2)}
                </TableCell>
                <TableCell className="text-center align-middle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-3 border-t bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: "", warehouseId: "", quantity: 1, rate: 0 })}>
            <Plus className="h-4 w-4 mr-2" /> 添加商品行
          </Button>
          <div className="font-bold text-lg">
            小计: <span className="font-mono text-blue-600">¥ {itemsTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 商业字段：交货日期 / 折扣 / 税率 */}
      <div className="grid grid-cols-3 gap-6 max-w-2xl">
        <div className="space-y-2">
          <label htmlFor="deliveryDate" className="text-sm font-medium">交货日期</label>
          <Input
            id="deliveryDate"
            type="date"
            {...form.register("deliveryDate")}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="discountAmount" className="text-sm font-medium">整单折扣金额 (¥)</label>
          <Input
            id="discountAmount"
            type="number"
            min="0"
            step="0.01"
            {...form.register("discountAmount", { valueAsNumber: true })}
          />
          {form.formState.errors.discountAmount && (
            <p className="text-sm text-red-500">{String(form.formState.errors.discountAmount.message || "")}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="taxRate" className="text-sm font-medium">税率 (%)</label>
          <Input
            id="taxRate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="如 13"
            {...form.register("taxRate", { valueAsNumber: true })}
          />
          {form.formState.errors.taxRate && (
            <p className="text-sm text-red-500">{String(form.formState.errors.taxRate.message || "")}</p>
          )}
        </div>
      </div>

      {/* 价格汇总区块 */}
      <div className="border rounded-md p-4 max-w-sm ml-auto space-y-2 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">商品小计</span>
          <span className="font-mono">¥ {itemsTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">整单折扣</span>
          <span className="font-mono text-red-500">- ¥ {watchDiscount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">税额 ({watchTax}%)</span>
          <span className="font-mono">+ ¥ {taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>最终含税总价</span>
          <span className="font-mono text-blue-600">¥ {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {form.formState.errors.items?.root && (
        <p className="text-sm text-red-500 font-medium">{String(form.formState.errors.items.root.message || "")}</p>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/selling/orders")}>取消</Button>
        <Button type="submit" disabled={loading}>{loading ? "提交订单中..." : "保存并提交订单"}</Button>
      </div>
    </form>
  );
}
