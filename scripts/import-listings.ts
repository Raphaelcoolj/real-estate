/* ---------------------------------------------------------------------------
 * import-listings — load listing data from data/listings.json.
 *
 *   npm run import                    # validate + upsert data/listings.json
 *   npm run import -- ./path/to.json  # use another file
 *   npm run import -- --dry-run       # validate and report, no writes
 *
 * Listings are matched by slug, so re-running updates the same records.
 * New records enter moderation as "pending" unless the entry sets
 * "status": "approved". Real media can be remote URLs or /uploads/* paths.
 * ------------------------------------------------------------------------ */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  MAX_IMPORT_BYTES,
  parseListingPayload,
  runListingImport,
} from "@/lib/listings-import";

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const file = argv.find((arg) => !arg.startsWith("--")) ?? "data/listings.json";
  return { file, dryRun: flags.has("--dry-run") };
}

async function main() {
  const { file, dryRun } = parseArgs(process.argv.slice(2));
  const absolute = path.resolve(process.cwd(), file);

  const text = await readFile(absolute, "utf8").catch((error: Error) => {
    throw new Error(`Could not read ${file}: ${error.message}`);
  });
  if (text.length > MAX_IMPORT_BYTES) {
    throw new Error(`${file} is larger than ${Math.round(MAX_IMPORT_BYTES / 1_000_000)} MB.`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${(error as Error).message}`);
  }

  const parsed = parseListingPayload(raw);
  if (!parsed.ok) {
    console.error(`\n${file} is not valid:\n`);
    for (const issue of parsed.issues) console.error(`  • ${issue}`);
    process.exitCode = 1;
    return;
  }

  if (parsed.listings.length === 0) {
    console.log(`\n${file} contains no listings — nothing to import.\n`);
    return;
  }

  const summary = await runListingImport(parsed.listings, { dryRun });

  for (const row of summary.results) {
    const name = `${row.index + 1}. ${row.title}`;
    if (row.action === "failed") {
      console.log(`  failed   ${name}: ${row.error}`);
    } else if (dryRun) {
      console.log(`  ${row.action === "updated" ? "update" : "create"}   ${name}  →  /properties/${row.slug}`);
    } else {
      console.log(`  ${row.action.padEnd(8)} ${name}  →  /properties/${row.slug}`);
    }
  }

  console.log(
    dryRun
      ? `\nDry run complete — ${summary.total} listing(s) valid (${summary.created} to create, ${summary.updated} to update), nothing written.\n`
      : `\nImported ${summary.total} listing(s): ${summary.created} created, ${summary.updated} updated, ${summary.failed} failed.\n`
  );
  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`\nImport failed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { disconnectDB } = await import("@/lib/db");
    await disconnectDB().catch(() => {});
  });
