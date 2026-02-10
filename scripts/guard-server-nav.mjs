#!/usr/bin/env node
/**
 * Regression guard: the main nav must remain server-rendered (no client bailout).
 *
 * This checks:
 * - `navBar.tsx` is not a Client Component (no "use client") and doesn't use client navigation hooks.
 * - `header.tsx` renders the server `NavBar` (not `NavBarClient`).
 *
 * Run:
 *   node scripts/guard-server-nav.mjs
 */

import fs from "node:fs";
import path from "node:path";

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function fail(msg) {
  console.error(`[guard-server-nav] FAIL: ${msg}`);
  process.exitCode = 1;
}

const root = process.cwd();
const navBarPath = path.join(root, "src/app/components/layout/header/navBar.tsx");
const headerPath = path.join(root, "src/app/components/layout/header/header.tsx");

const navBar = read(navBarPath);
const header = read(headerPath);

if (/^\s*["']use client["'];/m.test(navBar)) {
  fail(`navBar is a Client Component: ${navBarPath}`);
}

const clientHooks = ["usePathname", "useRouter", "useSearchParams"];
for (const h of clientHooks) {
  if (new RegExp(`\\b${h}\\b`).test(navBar)) {
    fail(`navBar references ${h} (client-only hook): ${navBarPath}`);
  }
}

if (/\bNavBarClient\b/.test(header)) {
  fail(`header references NavBarClient: ${headerPath}`);
}

if (!/from\s+["']\.\/navBar["']/.test(header) || !/\bNavBar\b/.test(header)) {
  fail(`header does not appear to import/render server NavBar from "./navBar": ${headerPath}`);
}

if (!process.exitCode) {
  console.log("[guard-server-nav] PASS");
}

