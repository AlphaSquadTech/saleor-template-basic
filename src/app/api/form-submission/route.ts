import { NextRequest, NextResponse } from "next/server";

// Allowlist of permitted webhook domains for SSRF protection
// Add your trusted webhook domains here (e.g., your CRM, Zapier, etc.)
const ALLOWED_WEBHOOK_DOMAINS =
  process.env.ALLOWED_WEBHOOK_DOMAINS?.split(",").map((d) => d.trim()) || [];

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
        } catch (error) {
          console.error("Webhook error:", error);
        }
      } else {
        console.warn(
          `Webhook skipped due to SSRF protection: ${metadata.webhookUrl}`
        );
      }
    }

    // Example: Integration with external services based on form type
    switch (formType) {
      case "contact":
        // Send to CRM or email service
        break;
      case "newsletter":
        // Add to mailing list
        break;
      case "quote":
        // Send to sales team
        break;
      default:
        // Generic handling
        break;
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
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
