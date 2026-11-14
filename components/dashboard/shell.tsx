"use client";

import { signOutAction } from "@/actions/auth.actions";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { DASHBOARD_NAV } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/constants";
import type { SessionUser } from "@/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const ROLE_LABEL: Record<Role, string> = {
  customer: "Private client",
  agent: "Agent workspace",
  admin: "Administration",
};

function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = DASHBOARD_NAV[role] ?? DASHBOARD_NAV.customer;

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item, index) => {
        if (item.section) {
          return (
            <p
              key={`section-${index}`}
              className="mt-6 mb-2 px-3 text-[0.625rem] font-semibold tracking-[0.2em] text-ivory-400/40 uppercase"
            >
              {item.section}
            </p>
          );
        }
        if (!item.href) return null;
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] transition-colors",
              active
                ? "bg-ivory-50/10 font-medium text-ivory-50"
                : "text-ivory-300/65 hover:bg-ivory-50/5 hover:text-ivory-50"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full transition-colors",
                active ? "bg-brass-400" : "bg-ivory-400/25 group-hover:bg-ivory-300/50"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const signOut = () => {
    startTransition(async () => {
      await signOutAction();
      router.push("/");
      router.refresh();
    });
  };

  const account = (
    <div className="mt-8 border-t border-ivory-400/10 pt-5">
      <div className="flex items-center gap-3 px-2">
        <Avatar name={user.name} src={user.avatarUrl} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] font-medium text-ivory-50">{user.name}</p>
          <p className="truncate text-[0.6875rem] text-ivory-400/50">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-xs text-ivory-300/60 transition-colors hover:bg-ivory-50/5 hover:text-ivory-50"
        >
          View marketplace ↗
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="rounded-lg px-3 py-2 text-left text-xs text-ivory-300/60 transition-colors hover:bg-ivory-50/5 hover:text-ivory-50 disabled:opacity-50"
        >
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-ivory-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-charcoal-950 px-5 py-6 lg:flex">
        <Logo inverted />
        <p className="mt-4 px-1 text-[0.625rem] font-semibold tracking-[0.22em] text-brass-500 uppercase">
          {ROLE_LABEL[user.role]}
        </p>
        <div className="mt-6 flex-1 overflow-y-auto scrollbar-none">
          <NavLinks role={user.role} />
        </div>
        {account}
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-ivory-200 bg-ivory-50/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open dashboard menu"
                className="rounded-full p-2 text-charcoal-900 transition-colors hover:bg-ivory-100 lg:hidden"
              >
                <svg viewBox="0 0 20 14" className="h-3.5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M0 1h20M0 7h20M0 13h13" />
                </svg>
              </button>
              <div className="lg:hidden">
                <Logo />
              </div>
              <p className="hidden text-xs tracking-[0.14em] text-stone-400 uppercase lg:block">
                {ROLE_LABEL[user.role]}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/notifications"
                aria-label="Notifications"
                className="rounded-full p-2.5 text-stone-500 transition-colors hover:bg-ivory-100 hover:text-charcoal-900"
              >
                <svg viewBox="0 0 18 18" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M9 2a5 5 0 0 0-5 5v3.2L2.6 13h12.8L14 10.2V7a5 5 0 0 0-5-5ZM7.2 15.3a2 2 0 0 0 3.6 0" />
                </svg>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 rounded-full border border-ivory-300 py-1 pl-1 pr-3 transition-colors hover:border-stone-400"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={28} />
                <span className="hidden max-w-24 truncate text-xs font-medium text-charcoal-800 sm:block">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} side="left" title="Dashboard" className="bg-charcoal-950">
        <div className="-m-5 flex min-h-full flex-col bg-charcoal-950 p-5">
          <Logo inverted />
          <div className="mt-8 flex-1">
            <NavLinks role={user.role} onNavigate={() => setMenuOpen(false)} />
          </div>
          {account}
        </div>
      </Sheet>
    </div>
  );
}
