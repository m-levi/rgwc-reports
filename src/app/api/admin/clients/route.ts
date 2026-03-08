import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  await requireAdmin();
  const supabase = await createClient();
  const body = await request.json();

  const { id, name, subtitle } = body;

  if (!id || !name || !subtitle) {
    return NextResponse.json(
      { error: "id, name, and subtitle are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9]+$/.test(id) || id.length > 12) {
    return NextResponse.json(
      { error: "ID must be lowercase alphanumeric, max 12 characters" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("clients").insert({
    id,
    name,
    subtitle,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A client with this ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id, name, subtitle }, { status: 201 });
}
