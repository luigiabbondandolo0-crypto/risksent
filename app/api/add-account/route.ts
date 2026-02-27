import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brokerType = String(body.brokerType ?? "").toUpperCase();
    const accountNumber = String(body.accountNumber ?? "");
    const investorPassword = String(body.investorPassword ?? "");

    const apiKey = process.env.METATRADER_API_KEY;

    const problems: string[] = [];

    if (!apiKey) {
      problems.push("Missing METATRADER_API_KEY env on server.");
    }

    if (!brokerType || !["MT4", "MT5", "CTRADER", "TRADLOCKER"].includes(brokerType)) {
      problems.push("Unsupported or missing broker type.");
    }

    if (!accountNumber) {
      problems.push("Missing account number.");
    }

    if (!investorPassword) {
      problems.push("Missing investor (read-only) password.");
    }

    // Here is where the real MetaApi integration will live.
    // For now we only log potential issues and return a mock response.
    if (problems.length > 0) {
      console.error("[MetaTrader AddAccount] Potential connection issues:", {
        brokerType,
        accountNumber,
        hasInvestorPassword: investorPassword.length > 0,
        problems
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Mock connection check failed.",
          problems
        },
        { status: 400 }
      );
    }

    console.log("[MetaTrader AddAccount] Mock connection successful:", {
      brokerType,
      accountNumberMasked:
        accountNumber.length > 4
          ? `${"*".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
          : accountNumber,
      hasInvestorPassword: investorPassword.length > 0
    });

    // Placeholder: here we will encrypt investorPassword and persist
    // into trading_account table in Supabase.

    return NextResponse.json({
      ok: true,
      message: "Mock MetaTrader connection successful. Account would be stored now.",
      warnings: [
        "Investor password must be encrypted before storing.",
        "Real MetaApi connectivity and account syncing not implemented yet."
      ]
    });
  } catch (error) {
    console.error("[MetaTrader AddAccount] Unexpected server error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Unexpected server error while validating account.",
        problems: ["Unexpected server error. Check server logs for details."]
      },
      { status: 500 }
    );
  }
}

