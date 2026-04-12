"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createWarehouse } from "@/app/actions/warehouse-actions";
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
  name: z.string().min(1, { message: "仓库名称不能为空" }),
  code: z.string().min(1, { message: "仓库编码不能为空" }),
  isActive: z.enum(["true", "false"]),
});

export function WarehouseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", code: "", isActive: "true" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await createWarehouse({
      name: values.name,
      code: values.code,
      isActive: values.isActive === "true",
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("仓库创建成功");
      router.push("/stock/warehouses");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mt-6">
        <FormField control={form.control} name="name" render={({ field }: any) => (
          <FormItem><FormLabel>仓库名称 *</FormLabel><FormControl><Input placeholder="例如：深圳中心总仓" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="code" render={({ field }: any) => (
          <FormItem><FormLabel>仓库编码 *</FormLabel><FormControl><Input placeholder="例如：WH-SZ-01" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isActive" render={({ field }: any) => (
          <FormItem>
            <FormLabel>仓库状态 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="请选择状态" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/stock/warehouses")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存仓库"}</Button>
        </div>
      </form>
    </Form>
  );
}
