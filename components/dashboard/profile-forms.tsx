"use client";

import { changePasswordAction, updateProfileAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { ProfileDetails } from "@/lib/services/user.service";
import type { SessionUser } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({ user, details }: { user: SessionUser; details: ProfileDetails }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { toast } = useToast();
  const router = useRouter();
  const isAgent = user.role === "agent";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const split = (name: string) => {
      const raw = String(fd.get(name) ?? "");
      fd.delete(name);
      for (const part of raw.split(",").map((p) => p.trim()).filter(Boolean)) fd.append(name, part);
    };
    split("specializations");
    split("languages");
    split("serviceAreas");

    setSaving(true);
    setErrors({});
    const result = await updateProfileAction(null, fd);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast(result.error, "error");
      return;
    }
    toast("Profile updated", "success");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="profile-name">Full name</Label>
          <Input id="profile-name" name="name" defaultValue={user.name} required />
          <FieldError error={errors.name} />
        </div>
        <div>
          <Label htmlFor="profile-phone">Phone</Label>
          <Input id="profile-phone" name="phone" type="tel" defaultValue={user.phone ?? ""} />
          <FieldError error={errors.phone} />
        </div>
      </div>

      <div>
        <Label htmlFor="profile-avatar" hint="Direct image URL">
          Profile picture
        </Label>
        <Input id="profile-avatar" name="avatarUrl" defaultValue={user.avatarUrl ?? ""} placeholder="https://…" />
        <FieldError error={errors.avatarUrl} />
      </div>

      <div>
        <Label htmlFor="profile-bio" hint="Shown publicly to clients">
          Biography
        </Label>
        <Textarea id="profile-bio" name="bio" defaultValue={user.bio ?? ""} placeholder="Your experience, markets and approach." />
        <FieldError error={errors.bio} />
      </div>

      <div>
        <Label htmlFor="profile-website">Website</Label>
        <Input id="profile-website" name="website" defaultValue={details.website ?? ""} placeholder="https://…" />
        <FieldError error={errors.website} />
      </div>

      {isAgent && (
        <>
          <div className="border-t border-ivory-200 pt-6">
            <h3 className="font-serif text-xl text-charcoal-900">Professional details</h3>
            <p className="mt-1 text-xs text-stone-400">
              Verification requires a licence number or specialisations. Your profile becomes
              complete once these are set.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="profile-license">Licence number</Label>
              <Input id="profile-license" name="licenseNumber" defaultValue={details.licenseNumber ?? ""} />
              <FieldError error={errors.licenseNumber} />
            </div>
            <div>
              <Label htmlFor="profile-years">Years of experience</Label>
              <Input
                id="profile-years"
                name="yearsExperience"
                type="number"
                min={0}
                max={60}
                defaultValue={details.yearsExperience ?? ""}
              />
              <FieldError error={errors.yearsExperience} />
            </div>
          </div>
          <div>
            <Label htmlFor="profile-specs" hint="Comma separated">
              Specialisations
            </Label>
            <Input
              id="profile-specs"
              name="specializations"
              defaultValue={details.specializations.join(", ")}
              placeholder="Luxury sales, Waterfront, Investment"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="profile-langs" hint="Comma separated">
                Languages
              </Label>
              <Input id="profile-langs" name="languages" defaultValue={details.languages.join(", ")} placeholder="English, French" />
            </div>
            <div>
              <Label htmlFor="profile-areas" hint="Comma separated">
                Service areas
              </Label>
              <Input id="profile-areas" name="serviceAreas" defaultValue={details.serviceAreas.join(", ")} placeholder="Ikoyi, Banana Island" />
            </div>
          </div>
          {!user.agencyId && (
            <div>
              <Label htmlFor="profile-agency" hint="Creates a new agency profile">
                Agency name
              </Label>
              <Input id="profile-agency" name="agencyName" placeholder="Sterling & Co." />
              <FieldError error={errors.agencyName} />
            </div>
          )}
        </>
      )}

      <div className="flex justify-end border-t border-ivory-200 pt-5">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setErrors({});
    const result = await changePasswordAction(null, fd);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields ?? {});
      toast(result.error, "error");
      return;
    }
    form.reset();
    toast("Password changed", "success");
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
        <FieldError error={errors.currentPassword} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-password" hint="Minimum 8 characters">
            New password
          </Label>
          <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
          <FieldError error={errors.newPassword} />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
          <FieldError error={errors.confirmPassword} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" loading={saving}>
          Update password
        </Button>
      </div>
    </form>
  );
}
