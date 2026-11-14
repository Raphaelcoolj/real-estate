import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <AuthShell
      eyebrow="Join Arcadia"
      title="Begin your search, or list with us."
      subtitle="One account for discovering, saving and enquiring — or for publishing properties as a verified agent."
      image="/hero.jpg"
      quote="“Arcadia made a rarefied process feel considered, calm and entirely confidential.”"
      footer={<AuthFooterLink prompt="Already a member?" href="/sign-in" label="Sign in" />}
    >
      <SignUpForm />
    </AuthShell>
  );
}
