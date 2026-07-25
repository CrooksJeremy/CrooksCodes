/**
 * EMAIL SERVICE (server-only)
 *
 * Sends contact-form notifications to the site owner via Resend.
 *
 * - Lazily constructs the Resend client so the module imports cleanly even
 *   when RESEND_API_KEY isn't set (e.g., a minimal local env).
 * - Fire-and-forget: if sending fails, the error is logged but the contact
 *   submission (already stored in Supabase) still succeeds.
 * - HTML-escaping the user-supplied fields prevents the message body from
 *   injecting tags into the notification email.
 */
import { Resend } from "resend";

export type Contact = {
  name: string;
  email: string;
  message: string;
  created_at?: string;
};

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

function formatWhen(created_at?: string): string {
  const date = created_at ? new Date(created_at) : new Date();
  return date.toLocaleString("en-CA", { timeZone: "America/Halifax" });
}

function buildHtml({ name, email, message, created_at }: Contact): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const when = formatWhen(created_at);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #0a0a08; color: #f0ede4; padding: 32px; max-width: 560px; margin: 0 auto;">
      <div style="font-family: 'SFMono-Regular', Menlo, monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a84b; margin-bottom: 20px;">
        New contact — CrooksCodes
      </div>
      <div style="border-top: 1px solid rgba(240, 237, 228, 0.14); padding-top: 20px;">
        <p style="margin: 0 0 6px; font-family: 'SFMono-Regular', Menlo, monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #6a6860;">From</p>
        <p style="margin: 0 0 20px; font-size: 15px; color: #f0ede4;">${safeName} &nbsp;·&nbsp; <a href="mailto:${safeEmail}" style="color: #c8a84b; text-decoration: none;">${safeEmail}</a></p>
        <p style="margin: 0 0 6px; font-family: 'SFMono-Regular', Menlo, monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #6a6860;">Message</p>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #f0ede4;">${safeMessage}</p>
        <p style="margin: 0; font-family: 'SFMono-Regular', Menlo, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #6a6860;">Received · ${when}</p>
      </div>
    </div>
  `;
}

function buildText({ name, email, message, created_at }: Contact): string {
  return `New contact — CrooksCodes\n\nFrom: ${name} <${email}>\n\n${message}\n\nReceived: ${formatWhen(created_at)}`;
}

/**
 * Send a notification email for a new contact form submission.
 * Resolves to the Resend message id on success, or null if the service
 * is not configured or the send failed.
 */
export async function sendContactNotification(contact: Contact): Promise<string | null> {
  const resend = getClient();
  if (!resend) {
    console.warn("CONTACT EMAIL SKIPPED: no client (RESEND_API_KEY missing?)");
    return null;
  }

  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM || "CrooksCodes <onboarding@resend.dev>";

  if (!to) {
    console.warn("CONTACT EMAIL SKIPPED: CONTACT_EMAIL_TO is not set");
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: contact.email,
      subject: `New contact from ${contact.name}`,
      html: buildHtml(contact),
      text: buildText(contact),
    });

    if (error) {
      console.error("CONTACT EMAIL ERROR:", error);
      return null;
    }
    console.log(`CONTACT EMAIL SENT: id=${data?.id} to=${to}`);
    return data?.id ?? null;
  } catch (err) {
    console.error("CONTACT EMAIL EXCEPTION:", err);
    return null;
  }
}
