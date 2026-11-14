import { Logo, LogoMark } from "@/components/brand/logo";
import { FOOTER_NAV } from "@/constants/navigation";
import Link from "next/link";

const socials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "X", href: "https://x.com" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ivory-200 bg-charcoal-950 text-ivory-300">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo inverted />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory-400/80">
              A curated marketplace for exceptional homes. Verified listings from trusted agents in
              the world&apos;s most desirable addresses.
            </p>
            <div className="mt-8 flex gap-5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="label-caps text-ivory-400/70 transition-colors hover:text-brass-400"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_NAV.map((group) => (
              <div key={group.title}>
                <h3 className="label-caps mb-5 font-sans text-brass-400">{group.title}</h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-ivory-400/80 transition-colors hover:text-ivory-50"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-ivory-400/10 pt-8 text-xs text-ivory-400/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Arcadia International. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
            <LogoMark className="size-4 text-brass-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
