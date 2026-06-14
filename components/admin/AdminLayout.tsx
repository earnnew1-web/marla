"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ClipboardList, Menu, Settings, Users } from "lucide-react";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminProtectedRoute>
      <div className="admin-shell">
        <AdminSidebar />
        <div className="lg:ml-64">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Marla Film Lab Admin</p>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <Separator className="my-4" />
                  <nav className="flex flex-col gap-1">
                    {mobileLinks.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                      return (
                        <Button
                          key={href}
                          variant={active ? "default" : "ghost"}
                          className="justify-start"
                          asChild
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <Link href={href}>
                            <Icon className="h-4 w-4" />
                            {label}
                          </Link>
                        </Button>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {mobileLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Button
                    key={href}
                    variant={active ? "default" : "secondary"}
                    size="sm"
                    className="shrink-0"
                    asChild
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </header>
          <main className={cn("min-h-screen px-4 py-5 lg:px-8 lg:py-7")}>{children}</main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
