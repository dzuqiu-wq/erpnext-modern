"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createSupplier } from "@/app/actions/supplier-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, { message: "供应商名称不能为空" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }).or(z.literal("")).optional(),
  phone: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

export function SupplierForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { name: "", email: "", phone: "", status: "Active" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await createSupplier({
      name: values.name,
      email: values.email,
      phone: values.phone,
      status: values.status,
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("供应商创建成功");
      router.push("/buying/suppliers");
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">供应商名称 *</label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{String(form.formState.errors.name.message || "")}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">联系邮箱</label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{String(form.formState.errors.email.message || "")}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">联系电话</label>
          <Input id="phone" {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">供应商状态 *</label>
        <Select onValueChange={(value) => form.setValue("status", value as "Active" | "Inactive")} defaultValue="Active">
          <SelectTrigger id="status">
            <SelectValue placeholder="请选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">活跃 (Active)</SelectItem>
            <SelectItem value="Inactive">未激活 (Inactive)</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.status && (
          <p className="text-sm text-red-500">{String(form.formState.errors.status.message || "")}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/buying/suppliers")}>取消</Button>
        <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存供应商"}</Button>
      </div>
    </form>
  );
}
