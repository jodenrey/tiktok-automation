"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Wand2,
  LineChart,
  ImageIcon,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/automations", label: "Automations", icon: Wand2 },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/collections", label: "Collections", icon: ImageIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    credits: number;
    purchasedCredits: number;
    subscriptionTier?: string;
  };
}

export function AppSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-black/40 px-4 py-5 backdrop-blur">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 text-sm font-semibold">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-fuchsia-500/30">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        tiktok-automation
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Credits card */}
      <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Credits</span>
          <span className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 font-medium text-[11px] sm:text-xs">
            <span>
              Monthly <strong className="text-foreground">{user.credits}</strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              Purchased <strong className="text-foreground">{user.purchasedCredits}</strong>
            </span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{
              width: `${Math.min(100, ((user.credits + user.purchasedCredits) / 50) * 100)}%`,
            }}
          />
        </div>
        <Button asChild variant="secondary" size="sm" className="mt-3 w-full text-xs">
          <Link href="/settings/billing">
            <CreditCard className="h-3 w-3" /> Buy credits
          </Link>
        </Button>
      </div>

      {/* User card */}
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{user.name ?? user.email.split("@")[0]}</div>
          <div className="truncate text-xs text-muted-foreground">{user.subscriptionTier ?? "Starter"}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
