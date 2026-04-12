"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { updateCustomer } from "@/app/actions/customer-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, { message: "客户名称不能为空" }),
  company: z.string().optional(),
  email: z.string().email({ message: "请输入有效的邮箱地址" }).or(z.literal("")).optional(),
  phone: z.string().optional(),
  status: z.enum(["Active", "Lead", "Inactive"]),
});

export function EditCustomerForm({ customer }: { customer: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: customer.name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      status: customer.status || "Active",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const res = await updateCustomer(customer.id, values);
    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("客户更新成功");
      router.push("/crm/customers");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mt-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }: any) => (
            <FormItem><FormLabel>客户名称 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }: any) => (
            <FormItem><FormLabel>关联公司</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }: any) => (
            <FormItem><FormLabel>联系邮箱</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }: any) => (
            <FormItem><FormLabel>联系电话</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="status" render={({ field }: any) => (
          <FormItem>
            <FormLabel>客户状态 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Lead">线索 (Lead)</SelectItem>
                <SelectItem value="Active">活跃 (Active)</SelectItem>
                <SelectItem value="Inactive">未激活 (Inactive)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/crm/customers")}>取消</Button>
          <Button type="submit" disabled={loading}>{loading ? "提交中..." : "保存更改"}</Button>
        </div>
      </form>
    </Form>
  );
}
