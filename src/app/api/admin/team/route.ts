import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();

  const { email, name, password, role } = body;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "email, name, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Use service role client to create users
  const serviceClient = await createServiceClient();

  const { error: createError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: role || "viewer" },
    });

  if (createError) {
    return NextResponse.json(
      { error: createError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
