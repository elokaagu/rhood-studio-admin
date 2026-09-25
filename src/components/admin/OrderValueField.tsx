"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Receipt } from "lucide-react";
import {
  INVOICE_CURRENCY,
  ORDER_CURRENCIES,
  RHOOD_FEE_PERCENT_LABEL,
  formatGbp,
  formatMoney,
  orderBreakdown,
  orderValueError,
  parseOrderValue,
} from "@/lib/opportunities/order-value";

export type OrderValueState = {
  orderValue: string;
  orderCurrency: string;
  orderFxRate: number | null;
  orderFxDate: string | null;
};

export function OrderValueField({
  value,
  onChange,
}: {
  value: OrderValueState;
  onChange: (patch: Partial<OrderValueState>) => void;
}) {
  const currency = value.orderCurrency || INVOICE_CURRENCY;
  const needsRate = currency !== INVOICE_CURRENCY && value.orderFxRate == null;
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsRate) return;
    let cancelled = false;
    setRateError(null);
    fetch(`/api/fx?from=${currency}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          rate?: number;
          date?: string | null;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.rate) {
          setRateError(data.error || "Exchange rate unavailable.");
          return;
        }
        onChange({ orderFxRate: data.rate, orderFxDate: data.date ?? null });
      })
      .catch(() => {
        if (!cancelled) setRateError("Exchange rate unavailable.");
      });
    return () => {
      cancelled = true;
    };
    // onChange is recreated by parents on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, needsRate]);

  const inputError = orderValueError({ ...value, orderFxRate: value.orderFxRate ?? 1 });
  const breakdown = inputError
    ? null
    : orderBreakdown(
        parseOrderValue(value.orderValue),
        currency,
        value.orderFxRate,
        value.orderFxDate
      );
  const hasAmount = parseOrderValue(value.orderValue) != null;

  return (
    <div className="space-y-2">
      <Label htmlFor="orderValue" className="text-foreground flex items-center">
        <Receipt className="h-4 w-4 mr-2" />
        Order value (optional)
      </Label>
      <div className="flex gap-2">
        <Select
          value={currency}
          onValueChange={(next) =>
            onChange({
              orderCurrency: next,
              orderFxRate: next === INVOICE_CURRENCY ? 1 : null,
              orderFxDate: null,
            })
          }
        >
          <SelectTrigger
            className="w-28 shrink-0 bg-secondary border-border text-foreground"
            aria-label="Order currency"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {ORDER_CURRENCIES.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id="orderValue"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 1500"
          value={value.orderValue}
          onChange={(event) =>
            onChange({ orderValue: event.target.value.replace(/[^\d.,]/g, "") })
          }
          aria-invalid={!!inputError}
          aria-describedby="orderValueHelp"
          className="bg-secondary border-border text-foreground"
        />
      </div>
      <div id="orderValueHelp" className="text-xs">
        {inputError ? (
          <p className="text-red-400">{inputError}</p>
        ) : rateError && hasAmount ? (
          <p className="text-red-400">
            {rateError} Switch to GBP or try again shortly.
          </p>
        ) : needsRate && hasAmount ? (
          <p className="flex items-center text-muted-foreground">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Getting today&apos;s {currency} to GBP rate…
          </p>
        ) : breakdown ? (
          <dl className="rounded-md border border-border bg-secondary/40 px-3 py-2 space-y-1">
            {breakdown.currency !== INVOICE_CURRENCY ? (
              <div className="flex justify-between text-muted-foreground">
                <dt>
                  {formatMoney(breakdown.originalValue, breakdown.currency)} at{" "}
                  {breakdown.fxRate.toFixed(4)}
                </dt>
                <dd>{formatGbp(breakdown.orderValue)}</dd>
              </div>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <dt>Order value</dt>
                <dd>{formatGbp(breakdown.orderValue)}</dd>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <dt>R/HOOD fee ({RHOOD_FEE_PERCENT_LABEL})</dt>
              <dd>{formatGbp(breakdown.fee)}</dd>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <dt>Total invoiced (GBP)</dt>
              <dd>{formatGbp(breakdown.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">
            The budget for this booking, in any currency. We convert it to pounds and
            add a {RHOOD_FEE_PERCENT_LABEL} R/HOOD fee when we invoice you.
          </p>
        )}
      </div>
    </div>
  );
}
