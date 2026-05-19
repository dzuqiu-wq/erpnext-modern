"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { createDeliveryNote } from "@/app/actions/delivery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const lineItemSchema = z.object({
  itemId: z.string().min(1, { message: "请选择商品" }),
  itemName: z.string().min(1, { message: "请输入商品名称" }),
  itemCode: z.string().optional(),
  specifications: z.string().optional(),
  unit: z.string().default("PCS"),
  quantity: z.coerce.number().min(1, { message: "数量必须至少为 1" }),
  unitPrice: z.coerce.number().min(0, { message: "单价不能为负数" }),
  taxRate: z.coerce.number().min(0).max(100).default(13),
});

const formSchema = z.object({
  customerId: z.string().min(1, { message: "请选择客户" }),
  customerName: z.string().min(1, { message: "请输入客户名称" }),
  salesOrderId: z.string().optional(),
  deliveryDate: z.string().min(1, { message: "请选择送货日期" }),
  notes: z.string().optional(),
  maker: z.string().optional(),
  items: z.array(lineItemSchema).min(1, { message: "至少需要一个商品明细" }),
});

type FormValues = z.infer<typeof formSchema>;

export function DeliveryNoteForm({
  customers,
  salesOrders,
  items,
}: {
  customers: { id: string; name: string }[];
  salesOrders: { id: string; orderNumber: string }[];
  items: { id: string; itemCode: string; itemName: string; standardRate: number }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customerId: "",
      customerName: "",
      deliveryDate: new Date().toISOString().split('T')[0],
      items: [{ itemId: "", itemName: "", unit: "PCS", quantity: 1, unitPrice: 0, taxRate: 13 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");

  // 计算汇总
  const subTotal = watchItems.reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);
  const taxTotal = watchItems.reduce((acc, item) => {
    const lineAmount = (item.quantity || 0) * (item.unitPrice || 0);
    return acc + lineAmount * ((item.taxRate || 0) / 100);
  }, 0);
  const grandTotal = subTotal + taxTotal;

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setLoading(true);

    const res = await createDeliveryNote({
      customerId: values.customerId,
      customerName: values.customerName,
      salesOrderId: values.salesOrderId || undefined,
      deliveryDate: values.deliveryDate,
      notes: values.notes || undefined,
      maker: values.maker || undefined,
      items: values.items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        specifications: item.specifications,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
    });

    if (res.error) {
      toast.error("操作失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("送货单创建成功");
      router.push("/delivery/notes");
      router.refresh();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
      {/* 客户和基本信息 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">选择客户 *</label>
          <Select
            onValueChange={(val) => {
              if (!val) return;
              const customer = customers.find(c => c.id === val);
              if (customer) {
                form.setValue("customerId", val, { shouldValidate: true });
                form.setValue("customerName", customer.name || "", { shouldValidate: true });
              }
            }}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="选择客户" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.customerId && (
            <p className="text-sm text-red-500">{String(form.formState.errors.customerId.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">客户名称 *</label>
          <Input 
            {...form.register("customerName")} 
            placeholder="手动输入或从下拉选择自动填充" 
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">关联销售订单</label>
          <Select
            onValueChange={(v) => {
              if (!v) return;
              form.setValue("salesOrderId", v);
            }}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="可选 - 关联销售订单" />
            </SelectTrigger>
            <SelectContent>
              {salesOrders.map((so) => (
                <SelectItem key={so.id} value={so.id}>{so.orderNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">送货日期 *</label>
          <Input type="date" {...form.register("deliveryDate")} />
          {form.formState.errors.deliveryDate && (
            <p className="text-sm text-red-500">{String(form.formState.errors.deliveryDate.message)}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">制单人</label>
          <Input {...form.register("maker")} placeholder="制单人姓名" />
        </div>
      </div>

      {/* 商品明细表 */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
            <TableRow>
              <TableHead className="w-[20%]">商品</TableHead>
              <TableHead className="w-[15%]">规格</TableHead>
              <TableHead className="w-[8%]">单位</TableHead>
              <TableHead className="w-[10%]">数量</TableHead>
              <TableHead className="w-[12%]">单价</TableHead>
              <TableHead className="w-[8%]">税率(%)</TableHead>
              <TableHead className="w-[12%] text-right">金额</TableHead>
              <TableHead className="w-[5%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <Select
                    onValueChange={(val) => {
                      if (!val) return;
                      const item = items.find(i => i.id === val);
                      if (item) {
                        form.setValue(`items.${index}.itemId` as any, val, { shouldValidate: true });
                        form.setValue(`items.${index}.itemName` as any, item.itemName, { shouldValidate: true });
                        form.setValue(`items.${index}.itemCode` as any, item.itemCode || "", { shouldValidate: true });
                        form.setValue(`items.${index}.unitPrice` as any, item.standardRate, { shouldValidate: true });
                      }
                    }}
                    defaultValue=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择商品" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.itemCode} - {i.itemName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[index]?.itemId && (
                    <p className="text-sm text-red-500">{String(form.formState.errors.items[index]?.itemId?.message)}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`items.${index}.specifications`)}
                    placeholder="规格描述"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...form.register(`items.${index}.unit`)}
                    placeholder="PCS"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    {...form.register(`items.${index}.taxRate`, { valueAsNumber: true })}
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  ¥ {((watchItems[index]?.quantity || 0) * (watchItems[index]?.unitPrice || 0)).toFixed(2)}
                </TableCell>
                <TableCell>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ itemId: "", itemName: "", unit: "PCS", quantity: 1, unitPrice: 0, taxRate: 13 })}
          >
            <Plus className="h-4 w-4 mr-2" /> 添加商品行
          </Button>
          <div className="font-bold text-lg">
            小计: <span className="font-mono text-blue-600">¥ {subTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 备注 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">备注说明</label>
        <textarea
          {...form.register("notes")}
          className="w-full p-3 border rounded-md min-h-[80px] resize-y"
          placeholder="可选 - 添加备注信息，如特殊送货要求等"
        />
      </div>

      {/* 价格汇总 */}
      <div className="border rounded-md p-4 max-w-sm ml-auto space-y-2 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">商品小计</span>
          <span className="font-mono">¥ {subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">税额合计</span>
          <span className="font-mono">+ ¥ {taxTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>价税合计</span>
          <span className="font-mono text-blue-600">¥ {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {form.formState.errors.items?.root && (
        <p className="text-sm text-red-500 font-medium">{String(form.formState.errors.items.root.message)}</p>
      )}

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/delivery/notes")}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建送货单"}
        </Button>
      </div>
    </form>
  );
}