"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { createItem } from "@/app/actions/item-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  itemCode: z.string().min(1, { message: "商品编码不能为空" }),
  itemName: z.string().min(1, { message: "商品名称不能为空" }),
  description: z.string().optional(),
  standardRate: z.coerce.number().min(0, { message: "售价不能为负数" }),
  stockUom: z.string().min(1, { message: "请选择库存单位" }),
  isActive: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof formSchema>;

export function ItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      itemCode: "", itemName: "", description: "",
      standardRate: 0, stockUom: "PCS", isActive: "true"
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);
    const res = await createItem({
      itemCode: values.itemCode,
      itemName: values.itemName,
      description: values.description || undefined,
      standardRate: values.standardRate,
      stockUom: values.stockUom,
      isActive: values.isActive === "true",
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("商品创建成功");
      router.push("/selling/items");
      router.refresh();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="itemCode" className="text-sm font-medium">商品编码 *</label>
          <Input id="itemCode" placeholder="例如: ITEM-001" {...form.register("itemCode")} />
          {form.formState.errors.itemCode && (
            <p className="text-sm text-red-500">{String(form.formState.errors.itemCode.message || "")}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="itemName" className="text-sm font-medium">商品名称 *</label>
          <Input id="itemName" {...form.register("itemName")} />
          {form.formState.errors.itemName && (
            <p className="text-sm text-red-500">{String(form.formState.errors.itemName.message || "")}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="standardRate" className="text-sm font-medium">标准售价 (¥) *</label>
          <Input id="standardRate" type="number" step="0.01" {...form.register("standardRate")} />
          {form.formState.errors.standardRate && (
            <p className="text-sm text-red-500">{String(form.formState.errors.standardRate.message || "")}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="stockUom" className="text-sm font-medium">库存单位 *</label>
          <Select onValueChange={(value) => form.setValue("stockUom", String(value))} defaultValue="PCS">
            <SelectTrigger id="stockUom">
              <SelectValue placeholder="选择单位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PCS">件 (PCS)</SelectItem>
              <SelectItem value="KG">千克 (KG)</SelectItem>
              <SelectItem value="Box">箱 (Box)</SelectItem>
              <SelectItem value="M">米 (Meter)</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.stockUom && (
            <p className="text-sm text-red-500">{String(form.formState.errors.stockUom.message || "")}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="isActive" className="text-sm font-medium">商品状态 *</label>
        <Select onValueChange={(value) => form.setValue("isActive", value as "true" | "false")} defaultValue="true">
          <SelectTrigger id="isActive">
            <SelectValue placeholder="请选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">启用</SelectItem>
            <SelectItem value="false">停用</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.isActive && (
          <p className="text-sm text-red-500">{String(form.formState.errors.isActive.message || "")}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/selling/items")}>取消</Button>
        <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存商品"}</Button>
      </div>
    </form>
  );
}
