import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  await requireAdmin();
  const { userId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  if (body.role && !["admin", "viewer"].includes(body.role)) {
    return NextResponse.json(
      { error: "Role must be 'admin' or 'viewer'" },
      { status: 400 }
    );
  }

  const updates: Record<string, string> = {};
  if (body.role) updates.role = body.role;
  if (body.name) updates.name = body.name;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
