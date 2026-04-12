"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createUser } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, { message: "姓名不能为空" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  password: z.string().min(6, { message: "初始密码至少需要 6 个字符" }),
  role: z.enum(["System Manager", "Sales User", "Purchase User", "Warehouse Manager", "Accountant"]),
});

export function UserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { name: "", email: "", password: "", role: "Sales User" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await createUser({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("用户创建成功", { description: "子账号现在可以使用该邮箱和密码登录系统了。" });
      router.push("/settings/users");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }: any) => (
            <FormItem><FormLabel>姓名 *</FormLabel><FormControl><Input placeholder="例如：李四" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }: any) => (
            <FormItem><FormLabel>电子邮箱 (登录账号) *</FormLabel><FormControl><Input type="email" placeholder="例如：lisi@company.com" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="password" render={({ field }: any) => (
          <FormItem><FormLabel>初始密码 *</FormLabel><FormControl><Input type="password" placeholder="请输入初始登录密码" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }: any) => (
          <FormItem>
            <FormLabel>系统角色 (权限分配) *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="请选择分配给该用户的角色" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Sales User">
                  <div className="font-medium">销售员 (Sales User)</div>
                  <div className="text-xs text-zinc-500">仅限访问：CRM、商品、销售订单、库存看板</div>
                </SelectItem>
                <SelectItem value="Purchase User">
                  <div className="font-medium">采购员 (Purchase User)</div>
                  <div className="text-xs text-zinc-500">仅限访问：供应商、商品、采购订单、库存看板</div>
                </SelectItem>
                <SelectItem value="Warehouse Manager">
                  <div className="font-medium">仓管员 (Warehouse Manager)</div>
                  <div className="text-xs text-zinc-500">仅限访问：商品、仓库设置、库存调整与看板</div>
                </SelectItem>
                <SelectItem value="Accountant">
                  <div className="font-medium">财务会计 (Accountant)</div>
                  <div className="text-xs text-zinc-500">仅限访问：工作台、会计科目表、日记账、财务报表</div>
                </SelectItem>
                <SelectItem value="System Manager">
                  <div className="font-medium text-red-600">系统管理员 (System Manager)</div>
                  <div className="text-xs text-zinc-500">拥有所有模块及底层设置的最高读写权限</div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>角色决定了用户登录后左侧导航栏的可见范围以及数据访问权限。</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/settings/users")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存并授权用户"}</Button>
        </div>
      </form>
    </Form>
  );
}
