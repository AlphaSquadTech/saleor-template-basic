"use client";

import { useEffect, useMemo, useState } from "react";

type AncillaryPage = {
  id: string;
  seoTitle: string | null;
  seoDescription: string | null;
  content: string | null;
};

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "").trim();
}

function parseEditorJsText(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const json = JSON.parse(raw) as {
      blocks?: Array<{ type?: string; data?: { text?: string } }>;
    };
    const blocks = Array.isArray(json?.blocks) ? json.blocks : [];
    const paragraph = blocks.find((b) => b?.type === "paragraph");
    const html = paragraph?.data?.text || "";
    return stripHtml(html);
  } catch {
    return stripHtml(raw);
  }
}

const DISMISS_KEY = "saleor_template_basic.newsletter_popup_dismissed_at";
const DEFAULT_DELAY_MS = 2500;
const DEFAULT_TTL_DAYS = 14;

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<AncillaryPage | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const title = page?.seoTitle || "Newsletter";
  const description = useMemo(() => parseEditorJsText(page?.content), [page]);

  useEffect(() => {
    const shouldShow = () => {
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return true;
        const dismissedAt = Number(raw);
        if (!Number.isFinite(dismissedAt)) return true;
        const ttlMs = DEFAULT_TTL_DAYS * 24 * 60 * 60 * 1000;
        return Date.now() - dismissedAt > ttlMs;
      } catch {
        return true;
      }
    };

    if (!shouldShow()) return;

    const t = window.setTimeout(() => {
      fetch("/api/page/newsletter")
        .then(async (r) => {
          if (!r.ok) return null;
          return (await r.json()) as AncillaryPage;
        })
        .then((p) => {
          if (!p) return;
          setPage(p);
          setOpen(true);
        })
        .catch(() => {
          // If Saleor isn't configured or page isn't present, do nothing.
        });
    }, DEFAULT_DELAY_MS);

    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const resp = await fetch("/api/form-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "newsletter",
          pageSlug: "newsletter",
          data: { email },
          timestamp: new Date().toISOString(),
        }),
      });

      if (!resp.ok) {
        const j = (await resp.json().catch(() => null)) as { message?: string } | null;
        throw new Error(j?.message || "Failed to subscribe");
      }

      setSuccess(true);
      setEmail("");
      // Dismiss for longer after a successful subscription.
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
    >
      <button
        aria-label="Close newsletter popup"
        onClick={close}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-primary uppercase tracking-tight text-[var(--color-secondary-900)]">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-sm font-secondary text-[var(--color-secondary-700)]">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              onClick={close}
              className="rounded-md px-2 py-1 text-sm text-[var(--color-secondary-700)] hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-secondary text-[var(--color-secondary-800)]">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-600)]"
            />
            {error ? (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            ) : null}
            {success ? (
              <p className="mt-2 text-sm text-green-700">
                Subscribed. Thank you.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={close}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              disabled={!email || submitting}
              onClick={submit}
              className="rounded-md bg-[var(--color-primary-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Subscribe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

