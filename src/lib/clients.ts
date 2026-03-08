export interface ClientConfig {
  id: string;
  name: string;
  subtitle: string;
}

const clients: Record<string, ClientConfig> = {
  rg8k2m: {
    id: "rg8k2m",
    name: "RGWC Reports",
    subtitle: "The Really Good Whisky Company",
  },
};

export function getClient(clientId: string): ClientConfig | null {
  return clients[clientId] || null;
}

export function getAllClientIds(): string[] {
  return Object.keys(clients);
}
