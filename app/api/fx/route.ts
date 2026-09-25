import { NextResponse } from "next/server";
import { INVOICE_CURRENCY, isOrderCurrency } from "@/lib/opportunities/order-value";

const FX_REVALIDATE_SECONDS = 60 * 60;

export async function GET(request: Request) {
  const from = new URL(request.url).searchParams.get("from")?.toUpperCase() ?? "";
  if (!isOrderCurrency(from)) {
    return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
  }

  if (from === INVOICE_CURRENCY) {
    return NextResponse.json({ currency: from, rate: 1, date: null });
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${INVOICE_CURRENCY.toLowerCase()}`,
      { next: { revalidate: FX_REVALIDATE_SECONDS } }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: `Exchange rate unavailable (${response.status}).` },
        { status: 502 }
      );
    }
    const data = (await response.json()) as { rate?: number; date?: string };
    if (typeof data.rate !== "number" || !(data.rate > 0)) {
      return NextResponse.json({ error: "Exchange rate unavailable." }, { status: 502 });
    }
    return NextResponse.json({ currency: from, rate: data.rate, date: data.date ?? null });
  } catch (error) {
    console.error("[fx]", error);
    return NextResponse.json({ error: "Exchange rate unavailable." }, { status: 502 });
  }
}
