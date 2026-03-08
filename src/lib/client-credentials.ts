import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { getShopifyConfig, getKlaviyoConfig } from "@/lib/env";

export interface ShopifyCredentials {
  domain: string;
  accessToken: string;
}

export interface KlaviyoCredentials {
  apiKey: string;
}

export interface ClientCredentials {
  shopify: ShopifyCredentials | null;
  klaviyo: KlaviyoCredentials | null;
}

export async function getClientCredentials(
  clientId: string
): Promise<ClientCredentials> {
  // Try DB first
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("client_credentials")
      .select("provider, credentials")
      .eq("client_id", clientId);

    if (data && data.length > 0) {
      let shopify: ShopifyCredentials | null = null;
      let klaviyo: KlaviyoCredentials | null = null;

      for (const row of data) {
        const decrypted = JSON.parse(decrypt(row.credentials));
        if (row.provider === "shopify") {
          shopify = decrypted as ShopifyCredentials;
        } else if (row.provider === "klaviyo") {
          klaviyo = decrypted as KlaviyoCredentials;
        }
      }

      return { shopify, klaviyo };
    }
  } catch {
    // DB not available — fall back to env vars
  }

  // Fallback to environment variables
  const shopifyEnv = getShopifyConfig();
  const klaviyoEnv = getKlaviyoConfig();

  return {
    shopify: shopifyEnv
      ? { domain: shopifyEnv.domain, accessToken: shopifyEnv.accessToken }
      : null,
    klaviyo: klaviyoEnv ? { apiKey: klaviyoEnv.apiKey } : null,
  };
}
