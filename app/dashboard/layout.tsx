import { DashboardShell } from "@/components/dashboard/shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
