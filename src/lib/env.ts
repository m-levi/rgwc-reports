export function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!domain || !accessToken) {
    return null;
  }

  return { domain, accessToken };
}

export function getKlaviyoConfig() {
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    return null;
  }

  return { apiKey };
}
