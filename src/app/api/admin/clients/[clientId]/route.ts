import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.subtitle !== undefined) updates.subtitle = body.subtitle;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
