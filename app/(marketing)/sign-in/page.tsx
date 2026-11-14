import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Return to your collection."
      subtitle="Sign in to manage saved homes, enquiries and viewings."
      image="/images/locations/mayfair.svg"
      footer={<AuthFooterLink prompt="New to Arcadia?" href="/sign-up" label="Create an account" />}
    >
      <SignInForm />
    </AuthShell>
  );
}
