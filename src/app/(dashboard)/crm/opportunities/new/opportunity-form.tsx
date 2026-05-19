"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOpportunity } from "@/app/actions/opportunity-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 表单校验 schema
const formSchema = z.object({
  name: z.string()
    .min(2, { message: "商机名称至少需要 2 个字符" })
    .max(100, { message: "商机名称不能超过 100 个字符" }),
  customerId: z.string().min(1, { message: "请选择关联客户" }),
  ownerId: z.string().min(1, { message: "请选择负责人" }),
  value: z.coerce.number()
    .min(0, { message: "预计金额不能为负数" })
    .max(999999999, { message: "预计金额超出范围" }),
  probability: z.coerce.number()
    .min(0, { message: "赢单概率最低为 0%" })
    .max(100, { message: "赢单概率最高为 100%" }),
  closeDate: z.string().min(1, { message: "请选择预计结单日期" }),
  stage: z.string().default("Qualification"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Customer {
  id: string;
  name: string;
  level: string;
  status: string;
}

interface SalesUser {
  id: string;
  name: string | null;
  email: string;
}

interface OpportunityFormProps {
  customers: Customer[];
  salesUsers: SalesUser[];
  currentUserId: string;
  currentUserRole: string;
}

export function OpportunityForm({
  customers,
  salesUsers,
  currentUserId,
  currentUserRole,
}: OpportunityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      customerId: "",
      ownerId: currentUserRole === 'ADMIN' ? "" : currentUserId,
      value: 0,
      probability: 10,
      closeDate: "",
      stage: "Qualification",
      notes: "",
    },
  });

  const watchValue = watch("value") ?? 0;
  const watchProbability = watch("probability") ?? 10;

  // 计算加权金额
  const weightedValue = watchValue * (watchProbability / 100);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);

    const res = await createOpportunity({
      name: values.name,
      customerId: values.customerId,
      ownerId: values.ownerId,
      value: values.value,
      probability: values.probability,
      closeDate: values.closeDate,
      stage: values.stage,
      notes: values.notes,
    });

    if (res.error) {
      toast.error("创建失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("商机创建成功", {
        description: `已创建 "${values.name}"，预计金额 ¥${values.value.toLocaleString()}`,
      });
      router.push("/crm/opportunities");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-6">
      {/* 基础信息 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">商机名称 *</label>
          <Input
            id="name"
            placeholder="例如：XX集团模具采购项目"
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">关联客户 *</label>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(v) => { if (v) field.onChange(v); }} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.level}级)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message}</p>}
        </div>
      </div>

      {/* 负责人和阶段 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">负责人 *</label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(v) => { if (v) field.onChange(v); }} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {salesUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.ownerId && <p className="text-sm text-red-500">{errors.ownerId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">起始阶段</label>
          <Controller
            name="stage"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(v) => { if (v) field.onChange(v); }} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="选择阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualification">资质初审 (10%)</SelectItem>
                  <SelectItem value="Discovery">需求挖掘 (25%)</SelectItem>
                  <SelectItem value="Proposal">方案报价 (50%)</SelectItem>
                  <SelectItem value="Negotiation">谈判合同 (75%)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="closeDate" className="text-sm font-medium">预计结单日期 *</label>
          <Input
            id="closeDate"
            type="date"
            {...register("closeDate")}
          />
          {errors.closeDate && <p className="text-sm text-red-500">{errors.closeDate.message}</p>}
        </div>
      </div>

      {/* 金额和概率 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label htmlFor="value" className="text-sm font-medium">预计金额 (¥) *</label>
          <Input
            id="value"
            type="number"
            min="0"
            step="100"
            placeholder="0.00"
            {...register("value", { valueAsNumber: true })}
          />
          {errors.value && <p className="text-sm text-red-500">{errors.value.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="probability" className="text-sm font-medium">赢单概率 (%) *</label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            step="5"
            placeholder="10"
            {...register("probability", { valueAsNumber: true })}
          />
          {errors.probability && <p className="text-sm text-red-500">{errors.probability.message}</p>}
        </div>

        {/* 加权金额计算（只读展示） */}
        <div className="space-y-2">
          <label className="text-sm font-medium">加权预测</label>
          <div className="h-10 px-3 flex items-center border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900">
            <span className="text-blue-600 font-semibold">
              ¥ {weightedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-zinc-500">金额 × 概率</p>
        </div>
      </div>

      {/* 备注 */}
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">备注说明</label>
        <Textarea
          id="notes"
          placeholder="可选 - 输入商机背景、客户需求、竞争情况等信息..."
          className="min-h-[100px]"
          {...register("notes")}
        />
      </div>

      {/* 表单操作 */}
      <div className="flex gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/crm/opportunities")}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建商机"}
        </Button>
      </div>
    </form>
  );
}