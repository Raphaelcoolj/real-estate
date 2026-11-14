"use client";

import { signInAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      toast("Welcome back", "success");
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

      <div>
        <Label htmlFor="signin-email">Email address</Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={Boolean(fields?.email)}
        />
        <FieldError error={fields?.email} />
      </div>

      <div>
        <Label htmlFor="signin-password">Password</Label>
        <div className="relative">
          <Input
            id="signin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Your password"
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

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
