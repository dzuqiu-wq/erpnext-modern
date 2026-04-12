"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { updateUser } from "@/app/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, { message: "姓名不能为空" }),
  email: z.string().email({ message: "请输入有效的邮箱地址" }),
  password: z.string().optional(),
  role: z.string(),
});

export function EditUserForm({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { name: user.name || "", email: user.email || "", password: "", role: user.role || "Sales User" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await updateUser(user.id, values);
    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("用户更新成功");
      router.push("/settings/users");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }: any) => (
            <FormItem><FormLabel>姓名 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }: any) => (
            <FormItem><FormLabel>电子邮箱 *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="password" render={({ field }: any) => (
          <FormItem>
            <FormLabel>重置密码 (可选)</FormLabel>
            <FormControl><Input type="password" placeholder="留空则保持原密码不变" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }: any) => (
          <FormItem>
            <FormLabel>系统角色 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Sales User">销售员 (Sales User)</SelectItem>
                <SelectItem value="Purchase User">采购员 (Purchase User)</SelectItem>
                <SelectItem value="Warehouse Manager">仓管员 (Warehouse Manager)</SelectItem>
                <SelectItem value="Accountant">财务会计 (Accountant)</SelectItem>
                <SelectItem value="System Manager">系统管理员 (System Manager)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>更改角色将立即影响该用户的菜单可见范围。</FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/settings/users")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存更改"}</Button>
        </div>
      </form>
    </Form>
  );
}
