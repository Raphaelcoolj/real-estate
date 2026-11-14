"use client";

import { importListingsAction } from "@/actions/import.actions";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonStyles } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { ImportSummary } from "@/lib/listings-import";
import {
  syntheticListings,
  type AgentOption,
  type SyntheticStatus,
} from "@/lib/synthetic-listings";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

function countLabel(dryRun: boolean, verb: "created" | "updated") {
  if (!dryRun) return verb === "created" ? "Created" : "Updated";
  return verb === "created" ? "Will create" : "Will update";
}

export function ImportStudio({
  agents,
  total,
  pending,
}: {
  agents: AgentOption[];
  total: number;
  pending: number;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [count, setCount] = useState("12");
  const [status, setStatus] = useState<SyntheticStatus>("approved");
  const [busy, setBusy] = useState<"validate" | "import" | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const generate = () => {
    if (!agents.length) {
      toast("Create and verify an agent account before generating listings.", "error");
      return;
    }
    const listings = syntheticListings(Number(count), agents, status);
    setText(JSON.stringify(listings, null, 2));
    setFileName(`synthetic-${listings.length}-listings.json`);
    setResult(null);
    setError(null);
    setFieldIssues([]);
    toast(`Generated ${listings.length} synthetic listings`, "success");
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    setResult(null);
    setError(null);
    setFieldIssues([]);
    event.target.value = "";
  };

  const submit = async (dryRun: boolean) => {
    setResult(null);
    setError(null);
    setFieldIssues([]);

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (parseError) {
      setError(`That is not valid JSON: ${(parseError as Error).message}`);
      return;
    }

    setBusy(dryRun ? "validate" : "import");
    const response = await importListingsAction({ payload, dryRun });
    setBusy(null);

    if (!response.ok) {
      setError(response.error);
      setFieldIssues(response.fields?.payload?.slice(0, 10) ?? []);
      toast(response.error, "error");
      return;
    }

    setResult(response.data);
    if (response.data.failed > 0 && response.data.created + response.data.updated === 0) {
      toast("No listings were imported — review the errors below.", "error");
    } else if (response.data.dryRun) {
      toast(`Validated ${response.data.total} listing(s)`, "success");
    } else {
      toast(
        `Imported ${response.data.created + response.data.updated} listing(s)` +
          (response.data.failed ? `, ${response.data.failed} failed` : ""),
        response.data.failed ? "info" : "success"
      );
      router.refresh();
    }
  };

  const empty = text.trim().length === 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-xl border border-ivory-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-charcoal-900">Listing payload</h2>
            <p className="mt-1 text-xs text-stone-500">
              A JSON array using the same fields as the listing form. Maximum 500 entries per import.
            </p>
            {fileName && <p className="mt-2 text-[0.6875rem] text-stone-400">Source: {fileName}</p>}
          </div>
          <label className={buttonStyles({ variant: "ghost", size: "sm", className: "cursor-pointer" })}>
            Upload JSON
            <input type="file" accept="application/json,.json" className="sr-only" onChange={onFile} />
          </label>
        </div>

        <Textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setFileName(null);
            setResult(null);
          }}
          spellCheck={false}
          aria-label="Listing JSON payload"
          placeholder='[{"title":"Six-bedroom garden villa in Ikoyi","agentEmail":"tunde@atlantic.example", …}]'
          className="mt-4 min-h-96 resize-y font-mono text-xs leading-relaxed"
        />

        {error && (
          <div className="mt-3 rounded-lg border border-rust-200 bg-rust-50 px-4 py-3 text-xs text-rust-700">
            <p className="font-medium">{error}</p>
            {fieldIssues.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {fieldIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={empty || busy !== null}
            loading={busy === "validate"}
            onClick={() => submit(true)}
          >
            Validate only
          </Button>
          <Button
            size="sm"
            disabled={empty || busy !== null}
            loading={busy === "import"}
            onClick={() => submit(false)}
          >
            Import listings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={empty || busy !== null}
            onClick={() => {
              setText("");
              setFileName(null);
              setResult(null);
              setError(null);
              setFieldIssues([]);
            }}
          >
            Clear
          </Button>
          <span className="ml-auto text-[0.6875rem] text-stone-400">
            {text.trim() ? `${text.length.toLocaleString()} characters` : "No payload yet"}
          </span>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-xl border border-brass-400/40 bg-brass-300/15 p-5">
          <h2 className="font-serif text-lg text-charcoal-900">Synthetic generator</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            Fill the editor with demo listings spread across the curated districts and active agents.
          </p>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-charcoal-800">How many</span>
              <Select value={count} onChange={(event) => setCount(event.target.value)} className="h-10">
                {["6", "12", "24", "48", "96"].map((option) => (
                  <option key={option} value={option}>
                    {option} listings
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-1.5 text-xs">
              <span className="font-medium text-charcoal-800">Publish state</span>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as SyntheticStatus)}
                className="h-10"
              >
                <option value="approved">Approved — live immediately</option>
                <option value="pending">Pending — review in moderation</option>
              </Select>
            </label>
          </div>

          <Button variant="accent" size="sm" className="mt-4 w-full" onClick={generate} disabled={!agents.length}>
            Generate sample
          </Button>
          {!agents.length && (
            <p className="mt-2 text-[0.6875rem] text-rust-700">
              No active agents found. Create an agent account, then verify it in the dashboard.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-ivory-200 bg-white p-5 text-xs">
          <h2 className="font-serif text-lg text-charcoal-900">Current database</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-stone-500">Listings</dt>
              <dd className="font-serif text-xl text-charcoal-900">{total.toLocaleString()}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-stone-500">Awaiting review</dt>
              <dd className="font-serif text-xl text-charcoal-900">{pending.toLocaleString()}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-stone-500">Active agents</dt>
              <dd className="font-serif text-xl text-charcoal-900">{agents.length.toLocaleString()}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/moderation" className="link-underline text-[0.6875rem] font-medium text-charcoal-900">
              Review queue
            </Link>
            <Link href="/dashboard/listings" className="link-underline text-[0.6875rem] font-medium text-charcoal-900">
              All listings
            </Link>
            <Link href="/properties" className="link-underline text-[0.6875rem] font-medium text-charcoal-900">
              Public site
            </Link>
          </div>
        </section>

        <ButtonLink href="/dashboard" variant="outline" size="sm" className="w-full">
          Back to overview
        </ButtonLink>
      </aside>

      {result && (
        <section className="rounded-xl border border-ivory-200 bg-white p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-charcoal-900">
                {result.dryRun ? "Validation result" : "Import complete"}
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                {result.total} entr{result.total === 1 ? "y" : "ies"} processed
                {result.dryRun ? " — nothing was written." : "."}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge tone="success">
                {countLabel(result.dryRun, "created")} {result.created}
              </Badge>
              <Badge tone="brass">
                {countLabel(result.dryRun, "updated")} {result.updated}
              </Badge>
              {result.failed > 0 && <Badge tone="danger">Failed {result.failed}</Badge>}
            </div>
          </div>

          <ul className="mt-5 max-h-96 divide-y divide-ivory-200 overflow-y-auto rounded-lg border border-ivory-200">
            {result.results.slice(0, 60).map((row) => (
              <li key={`${row.index}-${row.slug}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs">
                <span className="w-6 shrink-0 text-stone-400">{row.index + 1}</span>
                <Badge tone={row.action === "failed" ? "danger" : row.action === "created" ? "success" : "brass"}>
                  {row.action}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-charcoal-800">{row.title}</span>
                {row.action === "failed" ? (
                  <span className="w-full text-rust-700 sm:w-auto">{row.error}</span>
                ) : (
                  <code className="text-[0.625rem] text-stone-400">/properties/{row.slug}</code>
                )}
              </li>
            ))}
          </ul>
          {result.results.length > 60 && (
            <p className="mt-2 text-[0.6875rem] text-stone-400">
              Showing the first 60 rows of {result.results.length}.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
