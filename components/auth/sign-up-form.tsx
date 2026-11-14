"use client";

import { signUpAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, null);
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const initialRole = params.get("role") === "agent" ? "agent" : "customer";
  const [role, setRole] = useState<"customer" | "agent">(initialRole);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      toast("Your account is ready", "success");
      const next = params.get("next") || state.data.next;
      router.push(next);
      router.refresh();
    }
  }, [state, params, router, toast]);

  const fields = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.ok && (
        <div role="alert" className="rounded-lg border border-rust-500/20 bg-rust-500/5 px-4 py-3 text-sm text-rust-600">
          {state.error}
        </div>
      )}

      <input type="hidden" name="role" value={role} />
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-ivory-100 p-1.5">
        {(
          [
            { value: "customer", label: "I'm buying or renting", hint: "Save, compare, enquire" },
            { value: "agent", label: "I'm an agent", hint: "List properties" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRole(option.value)}
            aria-pressed={role === option.value}
            className={cn(
              "rounded-lg px-4 py-3 text-left transition-all duration-300",
              role === option.value ? "bg-white shadow-soft" : "hover:bg-white/50"
            )}
          >
            <span className="block text-[0.8125rem] font-medium text-charcoal-900">{option.label}</span>
            <span className="mt-0.5 block text-[0.6875rem] text-stone-400">{option.hint}</span>
          </button>
        ))}
      </div>

      <div>
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          name="name"
          autoComplete="name"
          required
          placeholder="Ada Okonkwo"
          aria-invalid={Boolean(fields?.name)}
        />
        <FieldError error={fields?.name} />
      </div>

      <div>
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={Boolean(fields?.email)}
        />
        <FieldError error={fields?.email} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="signup-phone" hint="Optional">
            Phone
          </Label>
          <Input id="signup-phone" name="phone" type="tel" autoComplete="tel" placeholder="+44 20 7946 0000" />
          <FieldError error={fields?.phone} />
        </div>
        {role === "agent" && (
          <div>
            <Label htmlFor="signup-agency" hint="Optional">
              Agency name
            </Label>
            <Input id="signup-agency" name="agencyName" placeholder="Sterling & Co." />
            <FieldError error={fields?.agencyName} />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="signup-password" hint="Minimum 8 characters">
          Password
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Create a password"
            className="pr-12"
            aria-invalid={Boolean(fields?.password)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 hover:text-charcoal-900"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <FieldError error={fields?.password} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-stone-500">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-stone-300 accent-charcoal-900"
        />
        <span>
          I agree to Arcadia&apos;s terms of use and privacy policy, and consent to being contacted
          about relevant properties.
        </span>
      </label>
      <FieldError error={fields?.terms} />

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
