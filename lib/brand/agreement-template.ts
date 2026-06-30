import type { BrandAcceptedContract } from "./types";

export type AgreementClause = {
  heading: string;
  body: string;
};

function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return "To be agreed";
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";
  return `${symbol}${amount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Builds the example DJ booking agreement shown to brands for an accepted
 * booking request. Clauses are generic placeholders, not legal advice.
 */
export function buildAgreementClauses(
  contract: BrandAcceptedContract,
  brandName: string
): AgreementClause[] {
  const djName = contract.dj_profile?.dj_name || "the DJ";
  const fee = formatMoney(contract.payment_amount, contract.payment_currency);

  return [
    {
      heading: "1. Parties",
      body: `This Performance Agreement ("Agreement") is entered into between ${brandName} ("Client") and ${djName} ("Performer"), facilitated through the R/HOOD platform ("R/HOOD").`,
    },
    {
      heading: "2. Event Details",
      body: `Event: ${contract.event_title}\nDate: ${formatDate(contract.event_date)}\nLocation: ${contract.location}`,
    },
    {
      heading: "3. Fees & Payment",
      body: `Client agrees to pay Performer a total fee of ${fee} for the performance described above. Payment is due within 14 days of the event via the payment method agreed between the parties.`,
    },
    {
      heading: "4. Cancellation Policy",
      body: `Either party may cancel this Agreement with at least 14 days' written notice. Cancellations within 7 days of the event may be subject to a cancellation fee of up to 50% of the agreed fee.`,
    },
    {
      heading: "5. Equipment & Technical Requirements",
      body: `Client is responsible for providing a suitable performance space, sound system, and DJ equipment unless otherwise agreed in writing between the parties.`,
    },
    {
      heading: "6. Liability",
      body: `Each party is responsible for their own equipment, personnel, and conduct. Client agrees to provide a safe working environment for Performer.`,
    },
    {
      heading: "7. Governing Law",
      body: `This Agreement is governed by the laws of England and Wales.`,
    },
  ];
}
