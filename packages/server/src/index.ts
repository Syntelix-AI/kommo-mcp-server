import { createPackageIdentity } from "@syntelix/kommo-mcp-core";

export interface ServerSkeleton {
  name: "kommo-mcp-server";
  role: "server";
  status: "not-implemented";
}

export function createServerSkeleton(): ServerSkeleton {
  const identity = createPackageIdentity("server");

  return {
    name: identity.name,
    role: identity.role,
    status: "not-implemented"
  };
}
