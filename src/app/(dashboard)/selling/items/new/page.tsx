import { ItemForm } from "./item-form";

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建商品</h3>
        <p className="text-sm text-zinc-500">在系统中建立新的商品主数据，设定编码与基准价格。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <ItemForm />
      </div>
    </div>
  );
}
