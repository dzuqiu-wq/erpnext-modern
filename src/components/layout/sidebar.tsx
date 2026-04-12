"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Package, ShoppingCart, Truck,
  ClipboardList, FileText, Settings, Warehouse, PackageCheck,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "工作台", href: "/", icon: Home, roles: ["System Manager", "Sales User", "Purchase User", "Warehouse Manager", "Accountant"] },
  {
    name: "销售 (Selling)", icon: ShoppingCart, roles: ["System Manager", "Sales User"],
    children: [
      { name: "客户 (CRM)", href: "/crm/customers" },
      { name: "商品 (Items)", href: "/selling/items" },
      { name: "销售订单 (Orders)", href: "/selling/orders" },
    ]
  },
  {
    name: "采购 (Buying)", icon: Truck, roles: ["System Manager", "Purchase User"],
    children: [
      { name: "供应商 (Suppliers)", href: "/buying/suppliers" },
      { name: "采购订单 (Purchase)", href: "/buying/orders" },
    ]
  },
  {
    name: "库存 (Stock)", icon: Warehouse, roles: ["System Manager", "Warehouse Manager", "Sales User", "Purchase User"],
    children: [
      { name: "仓库 (Warehouses)", href: "/stock/warehouses" },
      { name: "实时库存 (Balances)", href: "/stock/balances" },
    ]
  },
  {
    name: "财务 (Accounting)", icon: FileText, roles: ["System Manager", "Accountant"],
    children: [
      { name: "科目表 (Accounts)", href: "/accounting/accounts" },
      { name: "日记账 (Journals)", href: "/accounting/journals" },
      { name: "财务报表 (Statements)", href: "/accounting/statements" },
    ]
  },
  { name: "设置 (Settings)", href: "/settings/users", icon: Settings, roles: ["System Manager"] },
];

export function Sidebar({ userRole = "System Manager" }: { userRole?: string }) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<string[]>([
    "销售 (Selling)", "采购 (Buying)", "库存 (Stock)", "财务 (Accounting)"
  ]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 text-zinc-300">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">Nova ERP</h1>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          if (!item.roles.includes(userRole)) return null;

          if (!item.children) {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href as string));
            return (
              <Link
                key={item.name}
                href={item.href as string}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/50 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          }

          const isOpen = openGroups.includes(item.name);
          const isChildActive = item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));

          return (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => toggleGroup(item.name)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-800/50 hover:text-white",
                  isChildActive && !isOpen ? "text-white font-semibold" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
              </button>

              {isOpen && (
                <div className="ml-9 mt-1 space-y-1 border-l border-zinc-800 pl-3 py-1">
                  {item.children.map(child => {
                    const isSubActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          isSubActive
                            ? "bg-zinc-800 text-white font-medium"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                        )}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs text-white">
            {userRole.charAt(0)}
          </div>
          <div className="text-xs">
            <p className="text-zinc-500">当前角色</p>
            <p className="font-medium text-zinc-300">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
