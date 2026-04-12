import { WarehouseForm } from "./warehouse-form";

export default function NewWarehousePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建仓库</h3>
        <p className="text-sm text-zinc-500">在系统中建立新的物理或虚拟存储位置。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <WarehouseForm />
      </div>
    </div>
  );
}
