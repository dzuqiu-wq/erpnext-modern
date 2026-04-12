import { CustomerForm } from "./customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建客户</h3>
        <p className="text-sm text-zinc-500">在 CRM 模块中录入新的客户或潜在线索。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <CustomerForm />
      </div>
    </div>
  );
}
