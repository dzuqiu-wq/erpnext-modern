"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { updateItem } from "@/app/actions/item-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  itemCode: z.string().min(1, { message: "商品编码不能为空" }),
  itemName: z.string().min(1, { message: "商品名称不能为空" }),
  description: z.string().optional(),
  standardRate: z.coerce.number().min(0),
  stockUom: z.string().min(1),
  isActive: z.enum(["true", "false"]),
});

export function EditItemForm({ item }: { item: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      itemCode: item.itemCode || "",
      itemName: item.itemName || "",
      description: item.description || "",
      standardRate: item.standardRate || 0,
      stockUom: item.stockUom || "PCS",
      isActive: item.isActive ? "true" : "false",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await updateItem(item.id, {
      ...values,
      standardRate: values.standardRate,
      isActive: values.isActive === "true",
    });
    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("商品更新成功");
      router.push("/selling/items");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="itemCode" render={({ field }: any) => (
            <FormItem><FormLabel>商品编码 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="itemName" render={({ field }: any) => (
            <FormItem><FormLabel>商品名称 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="standardRate" render={({ field }: any) => (
            <FormItem><FormLabel>标准售价 (¥) *</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stockUom" render={({ field }: any) => (
            <FormItem><FormLabel>库存单位 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="PCS">件 (PCS)</SelectItem>
                <SelectItem value="KG">千克 (KG)</SelectItem>
                <SelectItem value="Box">箱 (Box)</SelectItem>
                <SelectItem value="M">米 (Meter)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="isActive" render={({ field }: any) => (
          <FormItem>
            <FormLabel>商品状态 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/selling/items")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存更改"}</Button>
        </div>
      </form>
    </Form>
  );
}
