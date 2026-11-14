import { Logo } from "@/components/brand/logo";
import { HeaderActions } from "@/components/layout/header-actions";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-ivory-200/80 bg-ivory-50/85 backdrop-blur-md">
      <div className="container-page flex h-18 items-center justify-between gap-6">
        <Logo />
        <HeaderActions user={user} />
      </div>
    </header>
  );
}
