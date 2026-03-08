import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("client_credentials")
    .select("provider")
    .eq("client_id", clientId);

  const providers = new Set(data?.map((d) => d.provider) || []);

  return NextResponse.json({
    shopify: providers.has("shopify"),
    klaviyo: providers.has("klaviyo"),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { provider, credentials } = body;

  if (!provider || !credentials) {
    return NextResponse.json(
      { error: "provider and credentials are required" },
      { status: 400 }
    );
  }

  if (provider !== "shopify" && provider !== "klaviyo") {
    return NextResponse.json(
      { error: "provider must be 'shopify' or 'klaviyo'" },
      { status: 400 }
    );
  }

  // Validate credential fields
  if (provider === "shopify") {
    if (!credentials.domain || !credentials.accessToken) {
      return NextResponse.json(
        { error: "Shopify credentials require domain and accessToken" },
        { status: 400 }
      );
    }
  } else {
    if (!credentials.apiKey) {
      return NextResponse.json(
        { error: "Klaviyo credentials require apiKey" },
        { status: 400 }
      );
    }
  }

  const encryptedCredentials = encrypt(JSON.stringify(credentials));

  const { error } = await supabase.from("client_credentials").upsert(
    {
      client_id: clientId,
      provider,
      credentials: encryptedCredentials,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id,provider" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
