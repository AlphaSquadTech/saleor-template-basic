import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// Allowlist of permitted webhook domains for SSRF protection
// Add your trusted webhook domains here (e.g., your CRM, Zapier, etc.)
const ALLOWED_WEBHOOK_DOMAINS =
  process.env.ALLOWED_WEBHOOK_DOMAINS?.split(",").map((d) => d.trim()) || [];

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  to: string[];
  replyTo?: string;
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const toRaw = process.env.SMTP_TO?.trim();

  if (!host || !portRaw || !from || !toRaw) return null;

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;

  const secure =
    (process.env.SMTP_SECURE || "").trim().toLowerCase() === "true" ||
    port === 465;

  const user = process.env.SMTP_USER?.trim() || undefined;
  const pass = process.env.SMTP_PASS?.trim() || undefined;
  const replyTo = process.env.SMTP_REPLY_TO?.trim() || undefined;

  const to = toRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!to.length) return null;

  return { host, port, secure, user, pass, from, to, replyTo };
}

function subjectFor(formType: string, pageSlug?: string) {
  const base = process.env.EMAIL_SUBJECT_PREFIX?.trim() || "";
  const prefix = base ? `${base} ` : "";
  const suffix = pageSlug ? ` (${pageSlug})` : "";
  return `${prefix}New ${formType} submission${suffix}`;
}

function renderEmailText(params: {
  formType: string;
  pageSlug?: string;
  data: unknown;
  timestamp?: string;
  ip?: string | null;
  ua?: string | null;
}) {
  const safeJson = JSON.stringify(params.data ?? {}, null, 2);
  return [
    `Form type: ${params.formType}`,
    params.pageSlug ? `Page slug: ${params.pageSlug}` : null,
    params.timestamp ? `Timestamp: ${params.timestamp}` : null,
    params.ip ? `IP: ${params.ip}` : null,
    params.ua ? `User-Agent: ${params.ua}` : null,
    "",
    "Data:",
    safeJson,
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmailHtml(text: string) {
  return `<pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${escapeHtml(
    text
  )}</pre>`;
}

/**
 * Validates a webhook URL against the allowlist to prevent SSRF attacks.
 * Returns true if the URL is safe to use, false otherwise.
 */
function isValidWebhookUrl(webhookUrl: string): boolean {
  if (!webhookUrl || typeof webhookUrl !== "string") {
    return false;
  }

  try {
    const url = new URL(webhookUrl);

    // Only allow HTTPS for security
    if (url.protocol !== "https:") {
      console.warn(
        `Webhook URL rejected: non-HTTPS protocol - ${url.protocol}`
      );
      return false;
    }

    // Block private/internal IP ranges
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /^\[::1\]$/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80:/i,
    ];

    if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
      console.warn(
        `Webhook URL rejected: blocked hostname pattern - ${hostname}`
      );
      return false;
    }

    // Check against allowlist (if configured)
    if (ALLOWED_WEBHOOK_DOMAINS.length > 0) {
      const isAllowed = ALLOWED_WEBHOOK_DOMAINS.some(
        (allowedDomain) =>
          hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`)
      );

      if (!isAllowed) {
        console.warn(
          `Webhook URL rejected: domain not in allowlist - ${hostname}`
        );
        return false;
      }
    }

    return true;
  } catch {
    console.warn(`Webhook URL rejected: invalid URL format - ${webhookUrl}`);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formType, pageSlug, data, metadata, timestamp } = body;

    // Log the submission (in production, you'd save to database)
    console.log("Form submission received:", {
      formType,
      pageSlug,
      data,
      timestamp,
    });

    // Here you can:
    // 1. Save to database
    // 2. Send email notifications
    // 3. Integrate with CRM
    // 4. Send to external APIs

    // Example: Save to database (uncomment when you have a database setup)
    /*
    const submission = await prisma.formSubmission.create({
      data: {
        formType,
        pageSlug,
        submissionData: JSON.stringify(data),
        metadata: JSON.stringify(metadata),
        submittedAt: new Date(timestamp),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    });
    */

    // Example: Send email notification (uncomment when you have email service)
    /*
    if (formType === "contact") {
      await sendContactFormEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Form Submission from ${pageSlug}`,
        data,
      });
    }
    */

    const results: { smtp?: "sent" | "skipped" | "failed"; webhook?: "sent" | "skipped" | "failed" } = {};

    // Example: Send to webhook (with SSRF protection)
    if (metadata?.webhookUrl) {
      if (isValidWebhookUrl(metadata.webhookUrl)) {
        try {
          await fetch(metadata.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formType,
              pageSlug,
              data,
              timestamp,
            }),
          });
          results.webhook = "sent";
        } catch (error) {
          console.error("Webhook error:", error);
          results.webhook = "failed";
        }
      } else {
        console.warn(
          `Webhook skipped due to SSRF protection: ${metadata.webhookUrl}`
        );
        results.webhook = "skipped";
      }
    } else {
      results.webhook = "skipped";
    }

    // SMTP email (optional; enabled via env)
    const smtp = getSmtpConfig();
    if (!smtp) {
      results.smtp = "skipped";
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth:
            smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
        });

        const ip = request.headers.get("x-forwarded-for");
        const ua = request.headers.get("user-agent");
        const text = renderEmailText({
          formType,
          pageSlug,
          data,
          timestamp,
          ip,
          ua,
        });

        await transporter.sendMail({
          from: smtp.from,
          to: smtp.to,
          subject: subjectFor(formType, pageSlug),
          text,
          html: renderEmailHtml(text),
          replyTo: smtp.replyTo,
        });

        results.smtp = "sent";
      } catch (err) {
        console.error("SMTP error:", err);
        results.smtp = "failed";
      }
    }

    const delivered = results.smtp === "sent" || results.webhook === "sent";
    const hasAnyDeliveryConfigured =
      (results.smtp && results.smtp !== "skipped") ||
      (results.webhook && results.webhook !== "skipped");

    if (hasAnyDeliveryConfigured && !delivered) {
      return NextResponse.json(
        {
          success: false,
          message: "Form submitted but delivery failed",
          results,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      results,
    });
  } catch (error) {
    console.error("Form submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit form",
      },
      { status: 500 }
    );
  }
}

// Helper function to send emails (example)
/*
async function sendContactFormEmail({ to, subject, data }: {
  to: string;
  subject: string;
  data: Record<string, any>;
}) {
  // Implementation depends on your email service (SendGrid, Resend, etc.)
  // Example with a generic email service:
  
  const emailContent = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  // Send email using your preferred service
  await emailService.send({
    to,
    subject,
    text: emailContent,
  });
}
*/
