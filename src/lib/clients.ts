import { createClient } from "@/lib/supabase/server";

export interface ClientConfig {
  id: string;
  name: string;
  subtitle: string;
  is_active?: boolean;
}

// Hardcoded fallback for when Supabase is not configured
const fallbackClients: Record<string, ClientConfig> = {
  rg8k2m: {
    id: "rg8k2m",
    name: "RGWC Reports",
    subtitle: "The Really Good Whisky Company",
  },
};

export async function getClient(
  clientId: string
): Promise<ClientConfig | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, subtitle, is_active")
      .eq("id", clientId)
      .eq("is_active", true)
      .single();

    if (data) return data;
  } catch {
    // Supabase not configured — fall back to hardcoded
  }

  return fallbackClients[clientId] || null;
}

export async function getAllClients(): Promise<ClientConfig[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, subtitle, is_active")
      .eq("is_active", true)
      .order("name");

    if (data && data.length > 0) return data;
  } catch {
    // Supabase not configured — fall back to hardcoded
  }

  return Object.values(fallbackClients);
}

export function getAllClientIds(): string[] {
  return Object.keys(fallbackClients);
}
