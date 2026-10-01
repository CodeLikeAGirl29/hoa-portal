// src/lib/email.ts
// Uses Resend's HTTP API (https://resend.com) — no SDK needed.
// Set env vars: RESEND_API_KEY=re_...  and optionally FROM_EMAIL.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@floridahoaportal.com";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/** Whether outgoing email is set up. Without it, nothing is sent. */
export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

type SendResult = { success: true } | { success: false; reason: unknown };

async function postToResend(path: string, payload: unknown): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY not set — email not sent.");
    return { success: false, reason: "no-api-key" };
  }

  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => res.statusText);
      console.error("Resend error:", err);
      return { success: false, reason: err };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, reason: err };
  }
}

/** Sends one message. Every address in `to` can see the others. */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  return postToResend("/emails", {
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}

/**
 * Sends the same message to many people as separate emails, so recipients
 * never see each other's addresses. Uses Resend's batch endpoint (100 per
 * call) to stay well inside its rate limit.
 */
export async function sendEmailToEach(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  const BATCH = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const group = recipients.slice(i, i + BATCH);
    const result = await postToResend(
      "/emails/batch",
      group.map((to) => ({ from: FROM_EMAIL, to: [to], subject, html }))
    );
    if (result.success) sent += group.length;
    else failed += group.length;
  }

  return { sent, failed };
}

// ─── Email Templates ──────────────────────────────────────────────────────

/** Escapes text before it is placed inside an HTML email. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Falls back to the default blue if a stored colour isn't a plain hex. */
function safeColor(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#185FA5";
}

export function newDocumentEmailHtml({
  hoaName,
  accentColor,
  documentTitle,
  category,
  uploadedBy,
  loginUrl,
}: {
  hoaName: string;
  accentColor: string;
  documentTitle: string;
  category: string;
  uploadedBy: string;
  loginUrl: string;
}) {
  const accent = safeColor(accentColor);
  const accentDark = shadeColorHex(accent, -20);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,${accent},${accentDark});padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">
        ${esc(hoaName)}
      </p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">
        New Document Available
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
        A new document has been added to your HOA document vault and is now available for you to view.
      </p>

      <!-- Document card -->
      <div style="background:#f8f7f5;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">
          ${esc(category)}
        </p>
        <p style="color:#111;font-size:16px;font-weight:700;margin:0 0 8px;">
          ${esc(documentTitle)}
        </p>
        <p style="color:#aaa;font-size:12px;margin:0;">
          Added by ${esc(uploadedBy)}
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a
          href="${esc(loginUrl)}"
          style="display:inline-block;background:linear-gradient(135deg,${accent},${accentDark});color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;"
        >
          View Document →
        </a>
      </div>

      <p style="color:#ccc;font-size:12px;text-align:center;margin:0;">
        You're receiving this because you're a member of ${esc(hoaName)}.<br>
        This portal is F.S. 720.303 compliant.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export function passwordChangedEmailHtml({
  name,
  hoaName,
}: {
  name: string;
  hoaName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background:#f5f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h1 style="color:#111;font-size:18px;margin:0 0 16px;">Password Changed</h1>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Hi ${esc(name)}, your password for the ${esc(hoaName)} portal was recently changed.
    </p>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
      If you didn't make this change, please contact your HOA administrator immediately.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/** Shared layout for the short "click this link" emails. */
function linkEmailHtml({
  heading,
  intro,
  buttonLabel,
  link,
  footnote,
  accentColor,
}: {
  heading: string;
  intro: string;
  buttonLabel: string;
  link: string;
  footnote: string;
  accentColor?: string;
}) {
  const accent = safeColor(accentColor ?? "#185FA5");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:40px 20px;background:#f5f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h1 style="color:#111;font-size:18px;margin:0 0 16px;">${esc(heading)}</h1>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
      ${esc(intro)}
    </p>
    <p style="margin:0 0 24px;">
      <a href="${esc(link)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;">
        ${esc(buttonLabel)}
      </a>
    </p>
    <p style="color:#777;font-size:12px;line-height:1.6;margin:0 0 8px;">
      If the button doesn't work, copy this address into your browser:
    </p>
    <p style="color:#555;font-size:12px;line-height:1.5;margin:0 0 24px;word-break:break-all;">
      ${esc(link)}
    </p>
    <p style="color:#777;font-size:12px;line-height:1.6;margin:0;">
      ${esc(footnote)}
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function passwordResetEmailHtml({
  name,
  link,
  minutes,
}: {
  name: string;
  link: string;
  minutes: number;
}) {
  return linkEmailHtml({
    heading: "Reset your password",
    intro: `Hi ${name}, we received a request to reset the password for your Florida HOA Portal account.`,
    buttonLabel: "Choose a new password",
    link,
    footnote: `This link works once and expires in ${minutes} minutes. If you didn't ask for it, you can ignore this email — your password stays the same.`,
  });
}

export function inviteEmailHtml({
  name,
  hoaName,
  accentColor,
  invitedBy,
  link,
  days,
}: {
  name: string;
  hoaName: string;
  accentColor?: string;
  invitedBy: string;
  link: string;
  days: number;
}) {
  return linkEmailHtml({
    heading: `You're invited to the ${hoaName} portal`,
    intro: `Hi ${name}, ${invitedBy} added you to the ${hoaName} document portal. Choose a password to finish setting up your account.`,
    buttonLabel: "Set your password",
    link,
    footnote: `This link works once and expires in ${days} days. After that, ask your HOA administrator to send a new one.`,
    accentColor,
  });
}

// Simple hex shade utility for email templates (no imports)
function shadeColorHex(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct))
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
