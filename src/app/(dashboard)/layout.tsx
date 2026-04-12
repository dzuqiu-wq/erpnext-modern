import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Sidebar userRole={session?.user?.role as string || "System Manager"} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header user={session.user} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible flex flex-col bg-zinc-50 dark:bg-zinc-900">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-8 pt-6 pb-2 border-t border-zinc-200 dark:border-zinc-800 text-center print:hidden">
            <p className="text-xs text-zinc-500 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} Nova ERP. All rights reserved.
            </p>
            <p className="text-xs text-zinc-400 mt-2 flex items-center justify-center gap-2">
              <span>Developed by <span className="font-semibold text-zinc-600 dark:text-zinc-300">伍永新</span></span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span>TEL: <span className="font-mono">17520233222</span></span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
