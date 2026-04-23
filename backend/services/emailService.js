const { Resend } = require('resend');

/**
 * EMAIL SERVICE
 *
 * Sends contact-form notifications to the site owner via Resend.
 *
 * Design notes:
 * - Lazily constructs the Resend client so the module can be imported
 *   even when RESEND_API_KEY isn't set (e.g., in a minimal local env).
 * - Fire-and-forget: if sending fails, the error is logged but the
 *   contact submission (already stored in Supabase) still succeeds.
 * - HTML escaping the user-supplied fields prevents the message body
 *   from injecting tags into the notification email.
 */

let client = null;

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

function buildHtml({ name, email, message, created_at }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const when = created_at
    ? new Date(created_at).toLocaleString('en-CA', { timeZone: 'America/Halifax' })
    : new Date().toLocaleString('en-CA', { timeZone: 'America/Halifax' });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #0a0a08; color: #f0ede4; padding: 32px; max-width: 560px; margin: 0 auto;">
      <div style="font-family: 'SFMono-Regular', Menlo, monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #c8a84b; margin-bottom: 20px;">
        New contact — JeremyCrooks.ca
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

function buildText({ name, email, message, created_at }) {
  const when = created_at
    ? new Date(created_at).toLocaleString('en-CA', { timeZone: 'America/Halifax' })
    : new Date().toLocaleString('en-CA', { timeZone: 'America/Halifax' });
  return `New contact — JeremyCrooks.ca\n\nFrom: ${name} <${email}>\n\n${message}\n\nReceived: ${when}`;
}

/**
 * Send a notification email for a new contact form submission.
 * Resolves to the Resend response on success, or null if the
 * service is not configured or the send failed.
 */
async function sendContactNotification(contact) {
  console.log('CONTACT EMAIL DISPATCH: starting for', contact?.email);
  const resend = getClient();
  if (!resend) {
    console.warn('CONTACT EMAIL SKIPPED: no client (RESEND_API_KEY missing?)');
    return null;
  }

  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM || 'JeremyCrooks.ca <onboarding@resend.dev>';

  if (!to) {
    console.warn('CONTACT EMAIL SKIPPED: CONTACT_EMAIL_TO is not set');
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
      console.error('CONTACT EMAIL ERROR:', error);
      return null;
    }
    console.log(`CONTACT EMAIL SENT: id=${data?.id} to=${to}`);
    return data;
  } catch (err) {
    console.error('CONTACT EMAIL EXCEPTION:', err);
    return null;
  }
}

module.exports = { sendContactNotification };
