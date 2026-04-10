import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role using service client
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "get_users": {
        const { data: authUsers } = await serviceClient.auth.admin.listUsers({
          perPage: 100,
        });
        const { data: wallets } = await serviceClient
          .from("user_wallets")
          .select("*");
        const { data: profiles } = await serviceClient
          .from("profiles")
          .select("*");
        const { data: roles } = await serviceClient
          .from("user_roles")
          .select("*");

        const users = (authUsers?.users || []).map((u: any) => {
          const wallet = wallets?.find((w: any) => w.user_id === u.id);
          const profile = profiles?.find((p: any) => p.user_id === u.id);
          const userRoles = roles?.filter((r: any) => r.user_id === u.id) || [];
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            full_name: profile?.full_name || "Unknown",
            balance: wallet?.balance || 0,
            total_deposited: wallet?.total_deposited || 0,
            total_won: wallet?.total_won || 0,
            is_activated: wallet?.is_activated || false,
            roles: userRoles.map((r: any) => r.role),
          };
        });

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_deposits": {
        const { data: deposits } = await serviceClient
          .from("deposits")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        // Enrich with user emails
        const userIds = [
          ...new Set((deposits || []).map((d: any) => d.user_id)),
        ];
        const { data: profiles } = await serviceClient
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const enriched = (deposits || []).map((d: any) => ({
          ...d,
          user_name:
            profiles?.find((p: any) => p.user_id === d.user_id)?.full_name ||
            "Unknown",
        }));

        return new Response(JSON.stringify({ deposits: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_game_activity": {
        const { data: games } = await serviceClient
          .from("game_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        const userIds = [
          ...new Set((games || []).map((g: any) => g.user_id)),
        ];
        const { data: profiles } = await serviceClient
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const enriched = (games || []).map((g: any) => ({
          ...g,
          user_name:
            profiles?.find((p: any) => p.user_id === g.user_id)?.full_name ||
            "Unknown",
        }));

        // Summary stats
        const totalBets = (games || []).reduce(
          (s: number, g: any) => s + Number(g.bet_amount),
          0
        );
        const totalWins = (games || []).reduce(
          (s: number, g: any) => s + Number(g.win_amount),
          0
        );
        const gameTypeCounts: Record<string, number> = {};
        (games || []).forEach((g: any) => {
          gameTypeCounts[g.game_type] =
            (gameTypeCounts[g.game_type] || 0) + 1;
        });

        return new Response(
          JSON.stringify({
            games: enriched,
            stats: { totalBets, totalWins, gameTypeCounts },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "release_bonus": {
        const { user_id, amount, all_activated } = params;

        if (all_activated) {
          const { data: wallets } = await serviceClient
            .from("user_wallets")
            .select("id, user_id, balance")
            .eq("is_activated", true);

          let credited = 0;
          for (const w of wallets || []) {
            await serviceClient
              .from("user_wallets")
              .update({ balance: Number(w.balance) + Number(amount) })
              .eq("id", w.id);
            credited++;
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `₦${amount} bonus released to ${credited} activated users`,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else if (user_id) {
          const { data: wallet } = await serviceClient
            .from("user_wallets")
            .select("id, balance")
            .eq("user_id", user_id)
            .single();

          if (wallet) {
            await serviceClient
              .from("user_wallets")
              .update({ balance: Number(wallet.balance) + Number(amount) })
              .eq("id", wallet.id);
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: `₦${amount} bonus released to user`,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ error: "Missing user_id or all_activated" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "activate_user": {
        const { user_id: targetUserId } = params;
        await serviceClient
          .from("user_wallets")
          .update({ is_activated: true })
          .eq("user_id", targetUserId);

        return new Response(
          JSON.stringify({ success: true, message: "User activated" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "get_stats": {
        const { count: userCount } = await serviceClient
          .from("profiles")
          .select("*", { count: "exact", head: true });
        const { count: activatedCount } = await serviceClient
          .from("user_wallets")
          .select("*", { count: "exact", head: true })
          .eq("is_activated", true);
        const { data: depositSum } = await serviceClient
          .from("deposits")
          .select("amount")
          .eq("status", "completed");
        const totalDeposits = (depositSum || []).reduce(
          (s: number, d: any) => s + Number(d.amount),
          0
        );
        const { count: gameCount } = await serviceClient
          .from("game_results")
          .select("*", { count: "exact", head: true });

        return new Response(
          JSON.stringify({
            stats: {
              totalUsers: userCount || 0,
              activatedUsers: activatedCount || 0,
              totalDeposits,
              totalGamesPlayed: gameCount || 0,
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "get_withdrawals": {
        const { data: withdrawals } = await serviceClient
          .from("withdrawals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        const userIds = [...new Set((withdrawals || []).map((w: any) => w.user_id))];
        const { data: profiles } = await serviceClient
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const enriched = (withdrawals || []).map((w: any) => ({
          ...w,
          user_name: profiles?.find((p: any) => p.user_id === w.user_id)?.full_name || "Unknown",
        }));

        return new Response(JSON.stringify({ withdrawals: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_withdrawal": {
        const { withdrawal_id, status: newStatus, admin_note } = params;
        
        // Get withdrawal details
        const { data: withdrawal } = await serviceClient
          .from("withdrawals")
          .select("*")
          .eq("id", withdrawal_id)
          .single();

        if (!withdrawal) {
          return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update withdrawal status
        await serviceClient
          .from("withdrawals")
          .update({ status: newStatus, admin_note: admin_note || null })
          .eq("id", withdrawal_id);

        // If rejected, refund the balance
        if (newStatus === "rejected") {
          const { data: wallet } = await serviceClient
            .from("user_wallets")
            .select("id, balance")
            .eq("user_id", withdrawal.user_id)
            .single();

          if (wallet) {
            await serviceClient
              .from("user_wallets")
              .update({ balance: Number(wallet.balance) + Number(withdrawal.amount) })
              .eq("id", wallet.id);
          }
        }

        return new Response(
          JSON.stringify({ success: true, message: `Withdrawal ${newStatus}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "set_wallet_balance": {
        const { user_id: targetId, balance: newBalance } = params;
        
        await serviceClient
          .from("user_wallets")
          .update({ balance: Number(newBalance) })
          .eq("user_id", targetId);

        return new Response(
          JSON.stringify({ success: true, message: `Balance set to ₦${newBalance}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "adjust_wallet": {
        const { user_id: targetId2, amount: adjustAmount, operation } = params;
        
        const { data: wallet } = await serviceClient
          .from("user_wallets")
          .select("id, balance")
          .eq("user_id", targetId2)
          .single();

        if (!wallet) {
          return new Response(JSON.stringify({ error: "Wallet not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const currentBalance = Number(wallet.balance);
        const adj = Number(adjustAmount);
        const newBal = operation === "add" ? currentBalance + adj : currentBalance - adj;

        await serviceClient
          .from("user_wallets")
          .update({ balance: Math.max(0, newBal) })
          .eq("id", wallet.id);

        return new Response(
          JSON.stringify({ success: true, message: `Balance ${operation === "add" ? "increased" : "decreased"} by ₦${adj}. New balance: ₦${Math.max(0, newBal)}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "generate_renewal_codes": {
        // Generate weekly renewal codes for all activated users
        const { data: wallets } = await serviceClient
          .from("user_wallets")
          .select("user_id")
          .eq("is_activated", true);

        let generated = 0;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        for (const w of wallets || []) {
          const code = `RNW-${w.user_id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          await serviceClient.from("renewal_codes").insert({
            user_id: w.user_id,
            code,
            expires_at: expiresAt.toISOString(),
          });
          generated++;
        }

        return new Response(
          JSON.stringify({ success: true, message: `Generated renewal codes for ${generated} users` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "adjust_points": {
        const { user_id: targetId3, points: pointsAmount, operation: pointsOp } = params;
        
        const { data: wallet } = await serviceClient
          .from("user_wallets")
          .select("id, points")
          .eq("user_id", targetId3)
          .single();

        if (!wallet) {
          return new Response(JSON.stringify({ error: "Wallet not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const currentPoints = Number(wallet.points);
        const pts = Number(pointsAmount);
        const newPts = pointsOp === "add" ? currentPoints + pts : Math.max(0, currentPoints - pts);

        await serviceClient
          .from("user_wallets")
          .update({ points: newPts })
          .eq("id", wallet.id);

        return new Response(
          JSON.stringify({ success: true, message: `Points ${pointsOp === "add" ? "added" : "removed"}. New: ${newPts}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
