"use client";

import { adminUserAction } from "@/actions/admin.actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import type { Role, VerificationStatus } from "@/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  verificationStatus: VerificationStatus;
  avatarUrl?: string | null;
  agency?: { id: string; name: string } | null;
  createdAt: string;
  lastLoginAt?: string | null;
};

type Action = { action: string; label: string; tone?: "danger" };

export function UserTable({ items }: { items: AdminUserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ivory-200 bg-white">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-ivory-200 text-[0.625rem] tracking-[0.14em] text-stone-400 uppercase">
            <th className="px-5 py-3 font-medium">Member</th>
            <th className="px-5 py-3 font-medium">Role</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function actionsFor(user: AdminUserRow): Action[] {
  const actions: Action[] = [];
  if (user.status === "active") actions.push({ action: "suspend", label: "Suspend account", tone: "danger" });
  if (user.status === "suspended") actions.push({ action: "reactivate", label: "Reactivate account" });
  if (user.role === "agent") {
    if (user.verificationStatus !== "verified") actions.push({ action: "verify", label: "Verify agent" });
    if (user.verificationStatus === "pending") {
      actions.push({ action: "reject_verification", label: "Reject verification", tone: "danger" });
    }
    actions.push({ action: "make_customer", label: "Convert to customer" });
  } else {
    actions.push({ action: "make_agent", label: "Grant agent access" });
  }
  return actions;
}

function UserRow({ user }: { user: AdminUserRow }) {
  const [dialog, setDialog] = useState<{ action: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const actions = actionsFor(user);

  const run = async (action: string, note?: string) => {
    setPending(action);
    const result = await adminUserAction({ userId: user.id, action, reason: note ?? "" });
    setPending(null);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast("Account updated", "success");
    setDialog(null);
    setReason("");
    router.refresh();
  };

  const choose = (option: Action) => {
    if (option.action === "suspend" || option.action === "reject_verification") {
      setDialog({ action: option.action, label: option.label });
    } else {
      void run(option.action);
    }
  };

  return (
    <tr className="border-b border-ivory-200 last:border-0 hover:bg-ivory-50/60">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size={34} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-charcoal-900">{user.name}</p>
            <p className="truncate text-xs text-stone-400">{user.email}</p>
            {user.agency && <p className="truncate text-[0.6875rem] text-stone-400">{user.agency.name}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <Badge tone={user.role === "admin" ? "brass" : "neutral"}>{user.role}</Badge>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={user.status} />
          {user.role !== "customer" && user.verificationStatus !== "verified" && (
            <StatusBadge status={user.verificationStatus === "unverified" ? "pending" : user.verificationStatus} label={`ID ${user.verificationStatus}`} />
          )}
        </div>
      </td>
      <td className="px-5 py-3 text-xs text-stone-500">
        {formatDate(user.createdAt)}
        <span className="block text-[0.6875rem] text-stone-400">
          {user.lastLoginAt ? `Last seen ${formatDate(user.lastLoginAt)}` : "Never signed in"}
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <details className="relative inline-block text-left">
          <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md px-3 text-[0.8125rem] text-charcoal-800 hover:bg-ivory-200/70">
            {pending ? "…" : "Manage"}
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-ivory-200 bg-white py-1 text-left shadow-lift">
            {actions.map((option) => (
              <button
                key={option.action}
                type="button"
                onClick={() => choose(option)}
                disabled={Boolean(pending)}
                className={
                  option.tone === "danger"
                    ? "block w-full px-4 py-2 text-left text-xs text-rust-600 hover:bg-rust-600/5 disabled:opacity-50"
                    : "block w-full px-4 py-2 text-left text-xs text-charcoal-800 hover:bg-ivory-100 disabled:opacity-50"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </details>
      </td>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogHeader
          title={dialog?.label ?? ""}
          description="Add a reason — it is shared with the member and stored with the audit trail."
        />
        <DialogBody>
          <Label htmlFor={`reason-${user.id}`}>Reason</Label>
          <Input
            id={`reason-${user.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={dialog?.action === "suspend" ? "Repeated policy violations" : "Licence could not be verified"}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => dialog && run(dialog.action, reason)}
            loading={pending === dialog?.action}
            disabled={reason.trim().length < 3}
          >
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </tr>
  );
}
