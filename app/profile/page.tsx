import { db } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";
import type { OrgProfile } from "@/lib/types";

export default async function ProfilePage() {
  const record = await db.orgProfile.findUnique({ where: { id: "default" } });

  const profile: OrgProfile | null = record
    ? {
        id: record.id,
        orgName: record.orgName,
        orgType: record.orgType,
        country: record.country,
        region: record.region,
        stage: record.stage,
        teamSize: record.teamSize,
        description: record.description,
        fundingNeeded: record.fundingNeeded
      }
    : null;

  return <ProfileForm initialProfile={profile} />;
}
