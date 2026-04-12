"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createStockEntry } from "@/app/actions/stock-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  itemId: z.string().min(1, { message: "请选择商品" }),
  warehouseId: z.string().min(1, { message: "请选择仓库" }),
  voucherType: z.enum(["Material Receipt", "Material Issue"]),
  qty: z.coerce.number().min(0.01, { message: "变动数量必须大于 0" }),
  rate: z.coerce.number().min(0).optional(),
});

export function StockEntryForm({
  items, warehouses
}: {
  items: { id: string; itemCode: string; itemName: string }[];
  warehouses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { itemId: "", warehouseId: "", voucherType: "Material Receipt", qty: 1 },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    const qtyChange = values.voucherType === "Material Receipt" ? values.qty : -values.qty;

    const res = await createStockEntry({
      itemId: values.itemId,
      warehouseId: values.warehouseId,
      qtyChange: qtyChange,
      voucherType: values.voucherType,
      rate: values.rate ? Number(values.rate) : undefined,
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("库存调整成功");
      router.push("/stock/balances");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mt-6">
        <FormField control={form.control} name="voucherType" render={({ field }: any) => (
          <FormItem>
            <FormLabel>调整类型 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="选择操作类型" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Material Receipt">物料入库 (+)</SelectItem>
                <SelectItem value="Material Issue">物料出库 (-)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="itemId" render={({ field }: any) => (
          <FormItem>
            <FormLabel>选择商品 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="选择操作商品" /></SelectTrigger></FormControl>
              <SelectContent>
                {items.map((i) => (<SelectItem key={i.id} value={i.id}>{i.itemCode} - {i.itemName}</SelectItem>))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="warehouseId" render={({ field }: any) => (
          <FormItem>
            <FormLabel>目标仓库 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="选择变动仓库" /></SelectTrigger></FormControl>
              <SelectContent>
                {warehouses.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="qty" render={({ field }: any) => (
          <FormItem><FormLabel>变动数量 (绝对值) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        {form.watch("voucherType") === "Material Receipt" ? (
          <FormField control={form.control} name="rate" render={({ field }: any) => (
            <FormItem><FormLabel>入库单价 (Rate) *</FormLabel><FormControl><Input type="number" step="0.01" placeholder="如 10.50" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        ) : (
          <div className="text-sm text-zinc-500 italic">出库成本由系统按移动加权平均法自动核算，无需填写单价。</div>
        )}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/stock/balances")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "处理中..." : "确认提交流水"}</Button>
        </div>
      </form>
    </Form>
  );
}
