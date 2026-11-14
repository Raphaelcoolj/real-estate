import { LogoMark } from "@/components/brand/logo";
import { Logo } from "@/components/brand/logo";
import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  image = "/hero.jpg",
  quote,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  image?: string;
  quote?: string;
}) {
  return (
    <div className="grid min-h-[calc(100svh-4.5rem)] lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow mb-3 text-brass-600">{eyebrow}</p>
          <h1 className="font-serif text-headline leading-[1.05] text-charcoal-900 text-balance">{title}</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-stone-500">{subtitle}</p>
          <div className="mt-9">{children}</div>
          <div className="mt-8 text-center text-sm text-stone-500">{footer}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-charcoal-950 lg:block">
        <Image src={image} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/35 to-charcoal-950/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ivory-50">
          <Logo inverted />
          <div className="max-w-md">
            <LogoMark className="mb-6 size-8 text-brass-400" />
            <p className="font-serif text-3xl leading-snug text-balance">
              {quote ?? "“The right home is not found by accident. It is introduced.”"}
            </p>
            <p className="mt-6 text-xs tracking-[0.18em] text-ivory-300/70 uppercase">
              Arcadia — Private client advisory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <>
      {prompt}{" "}
      <Link href={href} className="font-medium text-charcoal-900 underline-offset-4 hover:underline">
        {label}
      </Link>
    </>
  );
}
