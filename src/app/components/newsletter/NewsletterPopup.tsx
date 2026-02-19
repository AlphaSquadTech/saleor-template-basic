"use client";

import { SpinnerIcon } from "@/app/utils/svgs/spinnerIcon";
import { gql, useQuery } from "@apollo/client";
import React, { useEffect, useMemo, useState } from "react";

type AncillaryPage = {
  id: string;
  seoTitle: string | null;
  seoDescription: string | null;
  content: string | null;
};

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "").trim();
}

type NewsLetterPageData = {
  id: string;
  title: string;
  content: string | null;
  contactFormEnabled: boolean;
  isPublished: boolean;
  productInquiryFormEnabled: boolean;
  recaptchaEnabled: boolean;
  fields: string[];
  description: string | null;
  emailTo: string | null;
  emailCc: string | null;
  emailBcc: string | null;
  emailSubject: string | null;
  successMessage: string | null;
};

export const GET_NEWSLETTER = gql`
  query Contact($first: Int = 1) {
    pages(first: $first, filter: { slugs: "newsletter-signup" }) {
      edges {
        node {
          id
          title
          content
          isPublished
          metadata {
            key
            value
          }
        }
      }
    }
  }
`;

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
  const {
    data,
    loading: queryLoading,
    error: newsletterError,
  } = useQuery(GET_NEWSLETTER, {
    variables: { first: 1 },
  });

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

  const getFieldKey = (field: string): string => {
    return field.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const newsletterPageData: NewsLetterPageData | null = React.useMemo(() => {
    if (!data?.pages?.edges?.length) return null;
    const node = data.pages.edges[0].node;
    const metadata = node.metadata.reduce(
      (acc: Record<string, string>, item: { key: string; value: string }) => {
        acc[item.key] = item.value;
        return acc;
      },
      {},
    );

    return {
      id: node.id,
      title: node.title,
      content: node.content,
      isPublished: node.isPublished,
      contactFormEnabled: metadata.contact_form === "true",
      productInquiryFormEnabled: metadata.product_inquiry_form === "true",
      recaptchaEnabled: metadata.reCAPTCHA === "true",
      fields: metadata.fields
        ? metadata.fields.split(",").map((f: string) => f.trim())
        : [],
      description: metadata.description || null,
      emailTo: metadata.email_to || null,
      emailCc: metadata.email_cc || null,
      emailBcc: metadata.email_bcc || null,
      emailSubject: metadata.email_subject || null,
      successMessage: metadata.success_message || null,
    };
  }, [data]);

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
      // Prepare email message
      const emailMessage: Record<string, string> = {};
      newsletterPageData?.fields.forEach((field) => {
        const fieldKey = getFieldKey(field);
        emailMessage[fieldKey] = email;
      });

      // Prepare email recipients
      const recipients: string[] = [];
      if (newsletterPageData?.emailTo) {
        recipients.push(
          ...newsletterPageData.emailTo.split(",").map((e) => e.trim()),
        );
      }

      const ccRecipients: string[] = [];
      if (newsletterPageData?.emailCc) {
        ccRecipients.push(
          ...newsletterPageData.emailCc.split(",").map((e) => e.trim()),
        );
      }

      const bccRecipients: string[] = [];
      if (newsletterPageData?.emailBcc) {
        bccRecipients.push(
          ...newsletterPageData.emailBcc.split(",").map((e) => e.trim()),
        );
      }
      const tenantName = process.env.NEXT_PUBLIC_API_URL || "";

      const resp = await fetch("https://smtp.wsm-dev.com/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_name: tenantName,
          to: recipients,
          cc: ccRecipients.length > 0 ? ccRecipients : undefined,
          bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
          subject:
            newsletterPageData?.emailSubject || "Newsletter Form Submission",
          message: emailMessage,
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

  if (queryLoading) {
    return (
      <main className="h-full w-full">
        <div className="container mx-auto pt-[39px] pb-[38px] text-center">
          <div className="flex items-center justify-center">{SpinnerIcon}</div>
        </div>
      </main>
    );
  }

  if (newsletterError || !newsletterPageData) {
    return (
      <main className="h-full w-full">
        <div className="container mx-auto pt-[39px] pb-[38px]">
          <div className="text-center text-(--color-secondary-800)">
            <p>Unable to load newsletter popup. Please try again later.</p>
          </div>
        </div>
      </main>
    );
  }

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

