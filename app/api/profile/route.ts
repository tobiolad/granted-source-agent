import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrgProfileSchema } from "@/lib/validation";

export async function GET() {
  const profile = await db.orgProfile.findUnique({ where: { id: "default" } });
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = OrgProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 }
    );
  }

  const profile = await db.orgProfile.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data }
  });

  return NextResponse.json({ profile });
}
