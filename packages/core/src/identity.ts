/** Identidade de pacote (legado do bootstrap da spec 001). */

export type PackageRole = "core" | "cli" | "server";

export interface PackageIdentity<Role extends PackageRole = PackageRole> {
  name: "kommo-mcp-server";
  role: Role;
  version: "0.0.0";
}

export function createPackageIdentity<Role extends PackageRole>(
  role: Role
): PackageIdentity<Role> {
  return {
    name: "kommo-mcp-server",
    role,
    version: "0.0.0"
  };
}
