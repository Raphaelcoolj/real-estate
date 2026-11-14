"use client";

import { signOutAction } from "@/actions/auth.actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Sheet } from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/constants/navigation";
import type { SessionUser } from "@/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function HeaderActions({ user }: { user: SessionUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const signOut = () => {
    startTransition(async () => {
      await signOutAction();
      router.push("/");
      router.refresh();
    });
  };

  const isActive = (href: string) => {
    const base = href.split("?")[0]!;
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  return (
    <div className="flex items-center gap-2">
      <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
        {PUBLIC_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-[0.8125rem] font-medium tracking-[0.04em] transition-colors ${
              isActive(item.href) ? "text-charcoal-900" : "text-stone-500 hover:text-charcoal-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <span aria-hidden className="mx-2 hidden h-5 w-px bg-ivory-300 lg:block" />

      <div className="hidden items-center gap-2.5 lg:flex">
        {user ? (
          <Dropdown
            width="w-60"
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-ivory-100"
                aria-label="Account menu"
              >
                <Avatar name={user.name} src={user.avatarUrl} size={32} verified={user.verificationStatus === "verified"} />
                <span className="max-w-28 truncate text-[0.8125rem] font-medium text-charcoal-800">
                  {user.name.split(" ")[0]}
                </span>
                <svg viewBox="0 0 12 8" className="size-2.5 stroke-stone-400" fill="none" strokeWidth="1.5">
                  <path d="M1 1.5 6 6.5 11 1.5" />
                </svg>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="border-b border-ivory-200 px-4 py-3">
                  <p className="truncate text-sm font-medium text-charcoal-900">{user.name}</p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                </div>
                <DropdownItem href="/dashboard" onClick={close}>
                  Dashboard
                </DropdownItem>
                {user.role !== "admin" && (
                  <DropdownItem href="/dashboard/notifications" onClick={close}>
                    Notifications
                  </DropdownItem>
                )}
                <DropdownItem href="/dashboard/settings" onClick={close}>
                  Account settings
                </DropdownItem>
                <div className="my-1 border-t border-ivory-200" />
                <DropdownItem danger onClick={() => { close(); signOut(); }}>
                  {pending ? "Signing out…" : "Sign out"}
                </DropdownItem>
              </>
            )}
          </Dropdown>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="px-3 text-[0.8125rem] font-medium text-charcoal-800 transition-colors hover:text-brass-600"
            >
              Sign in
            </Link>
            <ButtonLink href="/sign-up" size="sm">
              Join Arcadia
            </ButtonLink>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="rounded-full p-2.5 text-charcoal-900 transition-colors hover:bg-ivory-100 lg:hidden"
      >
        <svg viewBox="0 0 20 14" className="h-3.5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M0 1h20M0 7h20M0 13h13" />
        </svg>
      </button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="right" title="Menu">
        <div className="flex flex-col gap-8">
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-ivory-100 p-3"
            >
              <Avatar name={user.name} src={user.avatarUrl} size={44} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-charcoal-900">{user.name}</span>
                <span className="block truncate text-xs text-stone-500">Open dashboard</span>
              </span>
            </Link>
          )}
          <nav aria-label="Mobile" className="flex flex-col">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between border-b border-ivory-200 py-3.5 text-base text-charcoal-900"
              >
                {item.label}
                <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.5">
                  <path d="m6 3 5 5-5 5" />
                </svg>
              </Link>
            ))}
            <Link
              href="/agents"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between border-b border-ivory-200 py-3.5 text-base text-charcoal-900"
            >
              Agents
              <svg viewBox="0 0 16 16" className="size-3.5 stroke-stone-400" fill="none" strokeWidth="1.5">
                <path d="m6 3 5 5-5 5" />
              </svg>
            </Link>
          </nav>
          <div className="flex flex-col gap-2.5">
            {user ? (
              <>
                <ButtonLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </ButtonLink>
                <Button variant="outline" onClick={signOut} loading={pending}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <ButtonLink href="/sign-up" onClick={() => setMobileOpen(false)}>
                  Join Arcadia
                </ButtonLink>
                <ButtonLink href="/sign-in" variant="outline" onClick={() => setMobileOpen(false)}>
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
