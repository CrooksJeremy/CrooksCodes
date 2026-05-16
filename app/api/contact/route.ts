/**
 * POST /api/contact — contact form submission
 *
 * Ported from the standalone Express backend into a Next.js Route Handler so
 * the whole site ships as one Vercel deployment (no separate API, no CORS).
 *
 * Pipeline:
 *  1. Rate limit by client IP (best-effort, see lib/rateLimit).
 *  2. Validate name / email / message.
 *  3. Insert the row into Supabase (`contacts` table).
 *  4. Fire-and-forget a Resend notification email.
 *
 * Response shapes match the old backend so the existing form code in
 * page.tsx works unchanged: 400 returns `errors: [{ msg }]`.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendContactNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

// Always run server-side, never statically optimized.
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function validate(body: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 100) {
    errors.push("Name must be between 2 and 100 characters");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    errors.push("Please provide a valid email");
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 10 || message.length > 1000) {
    errors.push("Message must be between 10 and 1000 characters");
  }

  return errors;
}

export async function POST(req: Request) {
  // 1. Rate limit ───────────────────────────────────────────────────────────
  const limit = checkRateLimit(clientIp(req));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many contact requests from this IP, please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // 2. Parse + validate ─────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const errors = validate(body);
  if (errors.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: errors.map((msg) => ({ msg })),
      },
      { status: 400 },
    );
  }

  const contactData = {
    name: (body.name as string).trim(),
    email: (body.email as string).trim().toLowerCase(),
    message: (body.message as string).trim(),
    created_at: new Date().toISOString(),
  };

  // 3. Persist ──────────────────────────────────────────────────────────────
  let newContact;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("contacts")
      .insert([contactData])
      .select()
      .single();

    if (error) {
      console.error("CONTACT INSERT ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Database error", error: error.message },
        { status: 400 },
      );
    }
    newContact = data;
  } catch (err) {
    console.error("CONTACT HANDLER ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }

  // 4. Notify (fire-and-forget) ─────────────────────────────────────────────
  // The row is already saved; an email failure must not fail the request.
  sendContactNotification(newContact).catch((err) => {
    console.error("CONTACT EMAIL DISPATCH ERROR:", err);
  });

  return NextResponse.json(
    { success: true, message: "Contact submitted successfully", data: newContact },
    { status: 201 },
  );
}
