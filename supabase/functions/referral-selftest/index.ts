// TEMPORARY diagnostic function: end-to-end test of referral code generation + stats.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const log: Record<string, unknown> = {};
  const created: string[] = [];

  try {
    // purge leftover manual test accounts
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of list?.users ?? []) {
      if (u.email?.startsWith("reftest_") || u.email?.startsWith("selftest_")) {
        await admin.from("referrals").delete().eq("referrer_id", u.id);
        await admin.from("referrals").delete().eq("referred_id", u.id);
        await admin.auth.admin.deleteUser(u.id);
      }
    }

    const mk = async (tag: string) => {
      const email = `selftest_${tag}_${crypto.randomUUID().slice(0, 8)}@example.com`;
      const password = `Tz9!${crypto.randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw new Error(`createUser ${tag}: ${error.message}`);
      created.push(data.user!.id);
      const anon = createClient(URL, ANON, { auth: { persistSession: false } });
      const { data: s, error: e2 } = await anon.auth.signInWithPassword({ email, password });
      if (e2) throw new Error(`signIn ${tag}: ${e2.message}`);
      return { id: data.user!.id, client: anon, session: s.session! };
    };

    // --- Test 1: referrer gets a code, idempotent across repeated calls ---
    const referrer = await mk("referrer");
    const codes: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { data, error } = await referrer.client.rpc("get_or_create_referral_code");
      if (error) throw new Error(`rpc code #${i}: ${error.message}`);
      codes.push(data as string);
    }
    log.codes = codes;
    log.idempotent = codes.every((c) => c === codes[0]);
    log.format_ok = /^LOOT-[0-9A-F]{6}$/.test(codes[0]);

    // --- Test 2: concurrent calls (race) return one code, no duplicate rows ---
    const concurrent = await Promise.all(
      Array.from({ length: 5 }, () => referrer.client.rpc("get_or_create_referral_code")),
    );
    log.concurrent_errors = concurrent.filter((r) => r.error).map((r) => r.error!.message);
    log.concurrent_codes = [...new Set(concurrent.map((r) => r.data))];

    const { count: rowsForReferrer } = await admin
      .from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", referrer.id);
    log.rows_for_referrer = rowsForReferrer;

    // --- Test 3: brand-new user racing from zero (worst case for collisions) ---
    const fresh = await mk("fresh");
    const freshRace = await Promise.all(
      Array.from({ length: 5 }, () => fresh.client.rpc("get_or_create_referral_code")),
    );
    log.fresh_errors = freshRace.filter((r) => r.error).map((r) => r.error!.message);
    log.fresh_codes = [...new Set(freshRace.map((r) => r.data).filter(Boolean))];
    const { count: freshRows } = await admin
      .from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", fresh.id);
    log.fresh_rows = freshRows;

    // --- Test 4: stats before signup ---
    const before = await referrer.client.rpc("get_referral_stats");
    log.stats_before = before.data;

    // --- Test 5: referred signup uses the code ---
    const referred = await mk("referred");
    const sig = await referred.client.rpc("process_referral_signup", { p_referral_code: codes[0] });
    log.signup = sig.data ?? sig.error?.message;
    const dup = await referred.client.rpc("process_referral_signup", { p_referral_code: codes[0] });
    log.signup_duplicate = dup.data ?? dup.error?.message;
    const self = await referrer.client.rpc("process_referral_signup", { p_referral_code: codes[0] });
    log.self_referral = self.data ?? self.error?.message;
    const bad = await fresh.client.rpc("process_referral_signup", { p_referral_code: "LOOT-ZZZZZZ" });
    log.invalid_code = bad.data ?? bad.error?.message;
    const empty = await fresh.client.rpc("process_referral_signup", { p_referral_code: "" });
    log.empty_code = empty.data ?? empty.error?.message;

    log.stats_after_signup = (await referrer.client.rpc("get_referral_stats")).data;

    // Referrer must still return the SAME code after the row is claimed
    const afterClaim = await referrer.client.rpc("get_or_create_referral_code");
    log.code_stable_after_claim = afterClaim.data === codes[0] ? true : { got: afterClaim.data, err: afterClaim.error?.message };

    // --- Test 6: activation bonus + stats ---
    const act = await admin.rpc("award_referral_activation_bonus", { p_user_id: referred.id });
    log.activation = act.data ?? act.error?.message;
    log.stats_after_activation = (await referrer.client.rpc("get_referral_stats")).data;
    const actAgain = await admin.rpc("award_referral_activation_bonus", { p_user_id: referred.id });
    log.activation_replay = actAgain.data ?? actAgain.error?.message;

    // --- Test 7: anon cannot call the RPCs ---
    const anonClient = createClient(URL, ANON, { auth: { persistSession: false } });
    log.anon_code = (await anonClient.rpc("get_or_create_referral_code")).error?.message ?? "ALLOWED (bad)";
    log.anon_stats = (await anonClient.rpc("get_referral_stats")).error?.message ?? "ALLOWED (bad)";

    // --- Test 8: global invariants ---
    const { data: invariants } = await admin.rpc("get_referral_stats"); // service ctx (no uid)
    log.service_stats_no_uid = invariants;
  } catch (e) {
    log.fatal = (e as Error).message;
  } finally {
    for (const id of created) {
      await admin.from("referrals").delete().eq("referrer_id", id);
      await admin.from("referrals").delete().eq("referred_id", id);
      await admin.auth.admin.deleteUser(id);
    }
    log.cleaned_up = created.length;
  }

  return new Response(JSON.stringify(log, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
