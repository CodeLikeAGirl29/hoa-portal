// src/lib/email.ts
// Uses Resend (https://resend.com) — free tier: 3,000 emails/month
// Install: npm install resend
// Set env var: RESEND_API_KEY=re_...

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@floridahoaportal.com";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY not set — email not sent.");
    return { success: false, reason: "no-api-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Resend error:", err);
      return { success: false, reason: err };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, reason: err };
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────

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
    <div style="background:linear-gradient(135deg,${accentColor},${shadeColorHex(
    accentColor,
    -20
  )});padding:28px 32px;">
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">
        ${hoaName}
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
          ${category}
        </p>
        <p style="color:#111;font-size:16px;font-weight:700;margin:0 0 8px;">
          ${documentTitle}
        </p>
        <p style="color:#aaa;font-size:12px;margin:0;">
          Added by ${uploadedBy}
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a
          href="${loginUrl}"
          style="display:inline-block;background:linear-gradient(135deg,${accentColor},${shadeColorHex(
    accentColor,
    -20
  )});color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;"
        >
          View Document →
        </a>
      </div>

      <p style="color:#ccc;font-size:12px;text-align:center;margin:0;">
        You're receiving this because you're a member of ${hoaName}.<br>
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
      Hi ${name}, your password for the ${hoaName} portal was recently changed.
    </p>
    <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
      If you didn't make this change, please contact your HOA administrator immediately.
    </p>
  </div>
</body>
</html>
  `.trim();
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
