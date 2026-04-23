import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import type { JournalTradeDirection, JournalTradeStatus } from "@/lib/journal/journalTypes";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const accountId = url.searchParams.get("account_id")?.trim();
  const symbol = url.searchParams.get("symbol")?.trim();
  const direction = url.searchParams.get("direction")?.trim().toUpperCase();
  const status = url.searchParams.get("status")?.trim().toLowerCase();
  const from = url.searchParams.get("from")?.trim();
  const to = url.searchParams.get("to")?.trim();
  const closeFrom = url.searchParams.get("close_from")?.trim();
  const closeTo = url.searchParams.get("close_to")?.trim();
  const sort = url.searchParams.get("sort")?.trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get("pageSize") ?? "50") || 50));
  const offset = (page - 1) * pageSize;

  let q = supabase.from("journal_trade").select("*", { count: "exact" }).eq("user_id", user.id);

  if (sort === "close_time") {
    q = q.order("close_time", { ascending: false });
  } else {
    q = q.order("open_time", { ascending: false });
  }

  if (accountId) q = q.eq("account_id", accountId);
  if (symbol) q = q.eq("symbol", symbol.toUpperCase());
  if (direction === "BUY" || direction === "SELL") q = q.eq("direction", direction as JournalTradeDirection);
  if (status === "open" || status === "closed") q = q.eq("status", status as JournalTradeStatus);
  if (from) q = q.gte("open_time", from);
  if (to) q = q.lte("open_time", to);
  if (closeFrom) q = q.gte("close_time", closeFrom);
  if (closeTo) q = q.lte("close_time", closeTo);

  q = q.range(offset, offset + pageSize - 1);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    trades: data ?? [],
    total: count ?? 0,
    page,
    pageSize
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    account_id?: string;
    ticket?: string;
    symbol?: string;
    direction?: string;
    open_time?: string;
    close_time?: string | null;
    open_price?: number;
    close_price?: number | null;
    lot_size?: number;
    stop_loss?: number | null;
    take_profit?: number | null;
    pl?: number | null;
    commission?: number | null;
    swap?: number | null;
    pips?: number | null;
    risk_reward?: number | null;
    setup_tags?: string[] | null;
    notes?: string | null;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const account_id = String(body.account_id ?? "").trim();
  const ticket = String(body.ticket ?? "").trim();
  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const direction = body.direction?.toUpperCase();
  const open_time = String(body.open_time ?? "").trim();
  const open_price = Number(body.open_price);
  const lot_size = Number(body.lot_size);

  if (!account_id || !ticket || !symbol || !open_time) {
    return NextResponse.json(
      { error: "account_id, ticket, symbol, open_time required" },
      { status: 400 }
    );
  }
  if (direction !== "BUY" && direction !== "SELL") {
    return NextResponse.json({ error: "direction must be BUY or SELL" }, { status: 400 });
  }
  if (!Number.isFinite(open_price) || !Number.isFinite(lot_size)) {
    return NextResponse.json({ error: "invalid open_price or lot_size" }, { status: 400 });
  }

  const { data: acct, error: acctErr } = await supabase
    .from("journal_account")
    .select("id")
    .eq("id", account_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (acctErr || !acct) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const status = body.status === "open" ? "open" : "closed";
  const row = {
    user_id: user.id,
    account_id,
    ticket,
    symbol,
    direction,
    open_time,
    close_time: body.close_time ?? null,
    open_price,
    close_price: body.close_price ?? null,
    lot_size,
    stop_loss: body.stop_loss ?? null,
    take_profit: body.take_profit ?? null,
    pl: body.pl ?? null,
    commission: body.commission ?? 0,
    swap: body.swap ?? 0,
    pips: body.pips ?? null,
    risk_reward: body.risk_reward ?? null,
    setup_tags: body.setup_tags ?? [],
    notes: body.notes ?? null,
    screenshot_url: null,
    status
  };

  const { data: trade, error } = await supabase.from("journal_trade").insert(row).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trade });
}
