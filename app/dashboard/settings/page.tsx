import { DashboardHeader } from "@/components/dashboard/page-header";
import { PasswordForm, ProfileForm } from "@/components/dashboard/profile-forms";
import { VerificationCard } from "@/components/dashboard/verification-card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/rbac";
import { settle } from "@/lib/settle";
import { getProfileDetails } from "@/lib/services/user.service";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const details = await settle(getProfileDetails(user.id), {
    website: null,
    licenseNumber: null,
    specializations: [],
    languages: [],
    serviceAreas: [],
    yearsExperience: null,
    agencyName: null,
  });

  return (
    <>
      <DashboardHeader
        eyebrow="Account"
        title="Profile settings"
        description="Keep your details current — they're what clients and moderators see."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="rounded-xl border border-ivory-200 bg-white p-6 sm:p-8">
          <h2 className="mb-6 font-serif text-xl text-charcoal-900">Personal information</h2>
          <ProfileForm user={user} details={details} />
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-ivory-200 bg-white p-6">
            <h2 className="font-serif text-xl text-charcoal-900">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3 border-b border-ivory-200 pb-3">
                <dt className="text-[0.6875rem] tracking-[0.12em] text-stone-400 uppercase">Email</dt>
                <dd className="truncate text-right font-medium text-charcoal-900">{user.email}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-ivory-200 pb-3">
                <dt className="text-[0.6875rem] tracking-[0.12em] text-stone-400 uppercase">Role</dt>
                <dd>
                  <Badge tone="neutral">{user.role}</Badge>
                </dd>
              </div>
              {user.agencyName && (
                <div className="flex items-baseline justify-between gap-3 border-b border-ivory-200 pb-3">
                  <dt className="text-[0.6875rem] tracking-[0.12em] text-stone-400 uppercase">Agency</dt>
                  <dd className="text-right font-medium text-charcoal-900">{user.agencyName}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[0.6875rem] tracking-[0.12em] text-stone-400 uppercase">Member since</dt>
                <dd className="font-medium text-charcoal-900">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </div>

          {user.role === "agent" && (
            <VerificationCard status={user.verificationStatus} profileComplete={user.profileComplete} />
          )}
        </aside>
      </div>

      <section className="mt-6 max-w-3xl rounded-xl border border-ivory-200 bg-white p-6 sm:p-8">
        <h2 className="font-serif text-xl text-charcoal-900">Password</h2>
        <p className="mt-1.5 mb-5 text-xs text-stone-400">
          Choose a strong password you don&apos;t use elsewhere.
        </p>
        <PasswordForm />
      </section>
    </>
  );
}
