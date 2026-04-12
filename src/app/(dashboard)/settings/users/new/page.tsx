import { UserForm } from "./user-form";

export default async function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">新建用户</h3>
        <p className="text-sm text-zinc-500">在系统中创建一个新的账户并分配权限角色。</p>
      </div>
      <div className="p-6 bg-white dark:bg-zinc-950 border rounded-md">
        <UserForm />
      </div>
    </div>
  );
}
