import { SupplierForm } from "./supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建供应商</h3>
        <p className="text-sm text-zinc-500">在采购模块中录入新的供应商主数据。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <SupplierForm />
      </div>
    </div>
  );
}
