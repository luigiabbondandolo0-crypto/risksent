import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseServer";
import { orderSend, accountSelectColumns, type TradingAccountRow } from "@/lib/tradingApi";

const OPERATIONS = ["Buy", "Sell", "BuyStop", "SellStop", "BuyLimit", "SellLimit"] as const;
const PENDING_OPS = ["BuyStop", "SellStop", "BuyLimit", "SellLimit"];

/**
 * POST /api/orders/send
 * Body: { uuid?, symbol, operation, volume, price?, stoploss?, takeprofit? }
 * Places order via mtapi OrderSend. Optional stoploss/takeprofit = price levels.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { uuid?: string; symbol?: string; operation?: string; volume?: number; price?: number; stoploss?: number; takeprofit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uuid = typeof body.uuid === "string" ? body.uuid.trim() : undefined;
  const symbol = typeof body.symbol === "string" ? body.symbol.trim() : "";
  const operation = typeof body.operation === "string" ? body.operation.trim() : "";
  const volume = typeof body.volume === "number" ? body.volume : Number(body.volume);

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  if (!OPERATIONS.includes(operation as (typeof OPERATIONS)[number])) {
    return NextResponse.json(
      { error: `operation must be one of: ${OPERATIONS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(volume) || volume <= 0) {
    return NextResponse.json({ error: "volume must be a positive number" }, { status: 400 });
  }
  let priceNum: number | undefined;
  if (PENDING_OPS.includes(operation)) {
    const price = typeof body.price === "number" ? body.price : Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "price is required for pending orders (BuyStop, SellStop, BuyLimit, SellLimit)" }, { status: 400 });
    }
    priceNum = price;
  }
  const stoploss = typeof body.stoploss === "number" ? body.stoploss : Number(body.stoploss);
  const takeprofit = typeof body.takeprofit === "number" ? body.takeprofit : Number(body.takeprofit);
  const stoplossNum = Number.isFinite(stoploss) && stoploss > 0 ? stoploss : undefined;
  const takeprofitNum = Number.isFinite(takeprofit) && takeprofit > 0 ? takeprofit : undefined;

  let accountRow: TradingAccountRow | null = null;
  if (uuid) {
    const { data } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .eq("metaapi_account_id", uuid)
      .limit(1)
      .single();
    accountRow = data && typeof data === "object" && "metaapi_account_id" in data ? (data as unknown as TradingAccountRow) : null;
  }
  if (!accountRow) {
    const { data: accounts } = await supabase
      .from("trading_account")
      .select(accountSelectColumns())
      .eq("user_id", user.id)
      .not("metaapi_account_id", "is", null)
      .limit(1);
    accountRow = (accounts?.[0] as unknown as TradingAccountRow) ?? null;
  }

  if (!accountRow?.metaapi_account_id) {
    return NextResponse.json({ error: "No account found. Add an account first." }, { status: 400 });
  }

  const result = await orderSend(accountRow, {
    symbol,
    operation,
    volume,
    price: priceNum,
    stoploss: stoplossNum,
    takeprofit: takeprofitNum
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "OrderSend failed", detail: result.data },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: result.data });
}
