import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            403
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            权限不足
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            抱歉，您没有权限访问此页面。<br />
            如需获取权限，请联系系统管理员。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <Link href="javascript:history.back()">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回上一页
            </Button>
          </Link>
        </div>
        <div className="pt-4 text-xs text-zinc-400">
          <p>错误代码：RBAC_FORBIDDEN</p>
          <p>如有问题，请联系系统管理员</p>
        </div>
      </div>
    </div>
  );
}