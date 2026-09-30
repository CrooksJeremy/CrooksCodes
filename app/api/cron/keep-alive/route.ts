/**
 * GET /api/cron/keep-alive — Supabase keep-alive ping
 *
 * Supabase pauses free-tier projects after ~7 consecutive days with no
 * activity. A paused project makes the contact form fail until it is manually
 * restored from the dashboard, so this route issues one cheap query per day to
 * keep the project marked as active.
 *
 * Invoked by the Vercel Cron entry in vercel.json. Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set on the project,
 * which is what keeps this endpoint from being a free DB-poke for anyone who
 * finds the URL.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Only reject when a secret is configured — otherwise a missing env var on a
  // preview deployment would silently turn the ping into a 401 no-op.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Smallest real query: one id column, one row. Deliberately not a
    // `head: true` count — that issues a HEAD request, which surfaces as an
    // empty `{ message: "" }` error under the Next.js fetch runtime.
    const { data, error } = await supabase
      .from("contacts")
      .select("id")
      .limit(1);

    if (error) {
      console.error("KEEP-ALIVE QUERY ERROR:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      rows: data?.length ?? 0,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("KEEP-ALIVE HANDLER ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Supabase ping failed" },
      { status: 500 },
    );
  }
}
