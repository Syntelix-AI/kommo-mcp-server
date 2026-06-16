#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { createPackageIdentity } from "@syntelix/kommo-mcp-core";

export function describeCli(): string {
  const identity = createPackageIdentity("cli");
  return `${identity.name}:${identity.role}`;
}

const entryPoint = process.argv[1];
const isDirectRun =
  entryPoint !== undefined && import.meta.url === pathToFileURL(entryPoint).href;

if (isDirectRun) {
  console.log(describeCli());
}
