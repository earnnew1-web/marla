"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LogOut,
  Settings,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-primary text-primary-foreground transition-all lg:flex lg:flex-col",
        collapsed ? "w-[84px]" : "w-64"
      )}
    >
      <div className="flex items-center justify-between border-b border-primary-foreground/10 px-4 py-5">
        {!collapsed ? (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">Marla Film Lab</p>
            <h1 className="mt-1 text-lg font-bold leading-tight">Admin</h1>
          </div>
        ) : (
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-accent/20 text-sm font-bold text-accent">
            M
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-primary-foreground/70 transition-colors duration-150 ease-out hover:bg-primary-foreground/[0.06] hover:text-primary-foreground"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Button
              key={href}
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start font-semibold",
                active
                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground/95"
                  : "text-primary-foreground/75 transition-colors duration-150 ease-out hover:bg-primary-foreground/[0.06] hover:text-primary-foreground"
              )}
              asChild
            >
              <Link href={href} title={label}>
                <Icon className="h-[18px] w-[18px]" />
                {!collapsed ? label : null}
              </Link>
            </Button>
          );
        })}
      </nav>

      <Separator className="bg-primary-foreground/10" />

      <div className="px-4 py-4">
        {!collapsed ? (
          <div className="mb-3 rounded-lg bg-primary-foreground/5 px-3 py-3">
            <p className="text-sm font-semibold">Staff access</p>
            <p className="mt-1 text-xs text-primary-foreground/60">Authorized team members only</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start font-semibold text-primary-foreground/75 transition-colors duration-150 ease-out hover:bg-primary-foreground/[0.06] hover:text-primary-foreground"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.replace("/admin/login");
            router.refresh();
          }}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed ? "Logout" : null}
        </Button>
      </div>
    </aside>
  );
}
