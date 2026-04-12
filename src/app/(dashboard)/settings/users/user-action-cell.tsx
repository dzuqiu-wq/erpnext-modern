"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/app/actions/user-actions";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";

export function UserActionCell({ userId, userName }: { userId: string, userName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`确定要彻底删除用户 "${userName}" 吗？此操作不可恢复。`)) return;

    setLoading(true);
    const res = await deleteUser(userId);
    if (res.error) {
      toast.error("删除失败", { description: res.error });
      setLoading(false);
    } else {
      toast.success("用户已删除");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/settings/users/${userId}/edit`}>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4 text-blue-600 hover:text-blue-800" />
        </Button>
      </Link>
      <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
        <Trash2 className="h-4 w-4 text-red-600 hover:text-red-800" />
      </Button>
    </div>
  );
}
