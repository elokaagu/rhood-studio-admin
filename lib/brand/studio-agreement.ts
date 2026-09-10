import type { AgreementClause } from "./agreement-template";

/** Platform terms shown to brands on first Studio login. Not legal advice. */
export function buildStudioAgreementClauses(brandName: string): AgreementClause[] {
  const party = brandName.trim() || "the Brand";

  return [
    {
      heading: "1. Parties",
      body: `This R/HOOD Studio Brand Agreement ("Agreement") is between ${party} ("Brand") and R/HOOD ("R/HOOD"). By typing your name below you confirm that you are authorised to bind the Brand.`,
    },
    {
      heading: "2. The Studio",
      body: `R/HOOD Studio is the brand portal for creating opportunities, reviewing DJ applications, sending booking requests, and managing related agreements. Access is invite-only and may be withdrawn if these terms are breached.`,
    },
    {
      heading: "3. Bookings and opportunities",
      body: `Listings and booking requests you publish must be accurate. Fees, dates, and locations you enter are visible to DJs. Performance contracts for accepted bookings are signed separately in Studio.`,
    },
    {
      heading: "4. Conduct",
      body: `You will treat DJs and other users professionally, honour confirmed bookings where reasonably possible, and not use Studio to spam, scrape, or misrepresent your brand.`,
    },
    {
      heading: "5. Content and data",
      body: `You grant R/HOOD a licence to display your brand name, description, website, and logo in the DJ app and Studio as needed to operate the marketplace. You remain responsible for that content.`,
    },
    {
      heading: "6. Liability",
      body: `R/HOOD facilitates introductions and tooling. You are responsible for your events, payments to DJs, and compliance with applicable law. This Agreement is governed by the laws of England and Wales.`,
    },
  ];
}
