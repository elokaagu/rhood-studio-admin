/** R/HOOD's fee on top of the brand's order value. */
export const RHOOD_FEE_RATE = 0.15;
export const RHOOD_FEE_PERCENT_LABEL = "15%";
export const INVOICE_CURRENCY = "GBP";

export const ORDER_CURRENCIES = [
  { code: "GBP", label: "GBP – British pound" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "USD", label: "USD – US dollar" },
  { code: "CAD", label: "CAD – Canadian dollar" },
  { code: "AUD", label: "AUD – Australian dollar" },
  { code: "NZD", label: "NZD – New Zealand dollar" },
  { code: "CHF", label: "CHF – Swiss franc" },
  { code: "SEK", label: "SEK – Swedish krona" },
  { code: "NOK", label: "NOK – Norwegian krone" },
  { code: "DKK", label: "DKK – Danish krone" },
  { code: "PLN", label: "PLN – Polish złoty" },
  { code: "ZAR", label: "ZAR – South African rand" },
  { code: "AED", label: "AED – UAE dirham" },
  { code: "JPY", label: "JPY – Japanese yen" },
] as const;

export type OrderCurrency = (typeof ORDER_CURRENCIES)[number]["code"];

export function isOrderCurrency(code: string | null | undefined): code is OrderCurrency {
  return ORDER_CURRENCIES.some((c) => c.code === code);
}

export type OrderBreakdown = {
  currency: string;
  /** Amount the brand entered, in `currency`. */
  originalValue: number;
  /** GBP per 1 unit of `currency`. */
  fxRate: number;
  fxDate: string | null;
  /** Everything below is in GBP. */
  orderValue: number;
  fee: number;
  total: number;
};

function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Parses "1,250.50" style input. Empty → null, invalid → NaN. */
export function parseOrderValue(raw: string | null | undefined): number | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^[£$€]\s*/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(stripped)) return Number.NaN;
  return Number(stripped);
}

export function orderBreakdown(
  originalValue: number | null,
  currency: string = INVOICE_CURRENCY,
  fxRate: number | null = 1,
  fxDate: string | null = null
): OrderBreakdown | null {
  if (originalValue == null || !Number.isFinite(originalValue) || originalValue <= 0) {
    return null;
  }
  const rate = currency === INVOICE_CURRENCY ? 1 : fxRate;
  if (rate == null || !Number.isFinite(rate) || rate <= 0) return null;

  const orderValue = roundToPence(originalValue * rate);
  const fee = roundToPence(orderValue * RHOOD_FEE_RATE);
  return {
    currency,
    originalValue: roundToPence(originalValue),
    fxRate: rate,
    fxDate: currency === INVOICE_CURRENCY ? null : fxDate,
    orderValue,
    fee,
    total: roundToPence(orderValue + fee),
  };
}

export function formatMoney(value: number, currency: string = INVOICE_CURRENCY): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatGbp(value: number): string {
  return formatMoney(value, INVOICE_CURRENCY);
}

const SYMBOL_CURRENCY: Record<string, OrderCurrency> = { "£": "GBP", "€": "EUR", $: "USD" };

/**
 * Order value implied by a purely monetary compensation ("£500", "500",
 * "€1,200", "300 EUR"). Null for free, zero or non-cash compensation.
 */
export function orderValueFromCompensation(
  pay: string | null | undefined
): { orderValue: string; orderCurrency: OrderCurrency } | null {
  const text = (pay ?? "").trim().replace(/,/g, "");
  const match = text.match(/^([£€$])?\s*(\d+(?:\.\d{1,2})?)\s*([A-Za-z]{3})?$/);
  if (!match) return null;
  const [, symbol, amount, code] = match;
  if (!(Number(amount) > 0)) return null;
  const upper = code?.toUpperCase();
  if (upper && !isOrderCurrency(upper)) return null;
  const currency = (upper as OrderCurrency | undefined) ?? (symbol ? SYMBOL_CURRENCY[symbol] : undefined);
  return { orderValue: amount, orderCurrency: currency ?? INVOICE_CURRENCY };
}

type LinkedOrderFields = {
  pay: string;
  orderValue: string;
  orderCurrency: string;
};

/**
 * Keeps the order value following the compensation while it's empty or still
 * matches what the previous compensation implied; once the brand types their
 * own order value it's left alone.
 */
export function orderValuePatchForCompensation(
  previous: LinkedOrderFields,
  nextPay: string
): Partial<OrderValueInput> {
  const before = orderValueFromCompensation(previous.pay);
  const stillLinked =
    !previous.orderValue.trim() ||
    (before != null &&
      before.orderValue === previous.orderValue &&
      before.orderCurrency === previous.orderCurrency);
  if (!stillLinked) return {};

  const next = orderValueFromCompensation(nextPay);
  if (!next) return previous.orderValue.trim() && before ? { orderValue: "" } : {};

  const patch: Partial<OrderValueInput> = { orderValue: next.orderValue };
  if (next.orderCurrency !== previous.orderCurrency) {
    patch.orderCurrency = next.orderCurrency;
    patch.orderFxRate = next.orderCurrency === INVOICE_CURRENCY ? 1 : null;
    patch.orderFxDate = null;
  }
  return patch;
}

export type OrderValueInput = {
  orderValue?: string;
  orderCurrency?: string;
  orderFxRate?: number | null;
  orderFxDate?: string | null;
};

/**
 * Columns written to `opportunities`. GBP amounts and the exchange rate are
 * frozen at save time so later rate or fee changes never rewrite an order.
 */
export function orderValueColumns(input: OrderValueInput) {
  const currency = isOrderCurrency(input.orderCurrency)
    ? input.orderCurrency
    : INVOICE_CURRENCY;
  const breakdown = orderBreakdown(
    parseOrderValue(input.orderValue),
    currency,
    input.orderFxRate ?? null,
    input.orderFxDate ?? null
  );
  return {
    order_value: breakdown?.orderValue ?? null,
    rhood_fee: breakdown?.fee ?? null,
    order_total: breakdown?.total ?? null,
    order_currency: breakdown?.currency ?? null,
    order_value_original: breakdown?.originalValue ?? null,
    fx_rate_to_gbp: breakdown?.fxRate ?? null,
    fx_rate_date: breakdown?.fxDate ?? null,
  };
}

export function orderValueError(input: OrderValueInput): string | null {
  const parsed = parseOrderValue(input.orderValue);
  if (parsed == null) return null;
  if (Number.isNaN(parsed)) {
    return "Order value must be a number, e.g. 1500 or 1500.50.";
  }
  if (parsed <= 0) return "Order value must be more than 0.";
  const currency = input.orderCurrency || INVOICE_CURRENCY;
  if (!isOrderCurrency(currency)) return "Choose a supported currency.";
  if (currency !== INVOICE_CURRENCY && !(input.orderFxRate && input.orderFxRate > 0)) {
    return `Couldn't get the ${currency} to GBP exchange rate yet. Try again in a moment.`;
  }
  return null;
}
