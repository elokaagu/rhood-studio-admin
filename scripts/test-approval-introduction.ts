import { writeFileSync } from "node:fs";
import { buildApprovalIntroduction } from "../src/lib/email/approval-introduction";
import { CAMPAIGN_AGENT_EMAIL } from "../src/lib/email/ops";

const built = buildApprovalIntroduction({
  djName: "Maya Rodriguez",
  djEmail: "maya@example.com",
  brandName: "House of AGU",
  brandEmail: "team@houseofagu.com",
  opportunityTitle: "test",
  location: "London",
  eventDateLabel: "22 September 2026",
  additionalInfo: "Load-in at 4pm. Ask for Sam at the door.",
});

const checks: Array<[string, boolean]> = [
  ["subject names both parties", /Maya Rodriguez/.test(built.subject) && /House of AGU/.test(built.subject)],
  ["to includes DJ and brand", built.to.includes("maya@example.com") && built.to.includes("team@houseofagu.com")],
  ["cc includes hello@rhood.io", built.cc.includes(CAMPAIGN_AGENT_EMAIL)],
  ["reply-to includes both parties and agent", built.replyTo.includes("maya@example.com") && built.replyTo.includes("team@houseofagu.com") && built.replyTo.includes(CAMPAIGN_AGENT_EMAIL)],
  ["html uses R/HOOD dark theme", built.html.includes("#0f0f0f") && built.html.includes("#1a1a1a") && built.html.includes("#c2cc06")],
  ["html includes both emails", built.html.includes("maya@example.com") && built.html.includes("team@houseofagu.com")],
  ["html greets DJ first name and full brand name", /Hey Maya and House of AGU/.test(built.html)],
  ["html tells them all communication stays on the thread", /All communication stays here/i.test(built.html) && /campaign agent/i.test(built.html)],
  ["html names hello@rhood.io as the agent", built.html.includes(CAMPAIGN_AGENT_EMAIL)],
  ["html includes how this will be executed", /How this will be executed/i.test(built.html)],
  ["html includes brand and DJ expectations", /Brand — House of AGU/.test(built.html) && /DJ — Maya Rodriguez/.test(built.html)],
  ["html includes opportunity details", built.html.includes("test") && built.html.includes("London")],
  ["html includes additional information", built.html.includes("Load-in at 4pm")],
  ["text keeps communication on this thread", /All communication about this campaign stays in this email thread/.test(built.text)],
  ["text includes additional information", built.text.includes("Load-in at 4pm")],
  ["cta is mailto to both plus agent", built.html.includes(`mailto:maya@example.com,team@houseofagu.com,${CAMPAIGN_AGENT_EMAIL}`)],
  ["text version names both", built.text.includes("Maya Rodriguez") && built.text.includes("House of AGU")],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) {
  console.log(`${ok ? "ok" : "FAIL"}  ${label}`);
}

const preview = `/tmp/rhood-approval-intro-preview.html`;
writeFileSync(preview, built.html);
console.log(`preview  ${preview}`);

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}

console.log("\nAll introduction email checks passed.");
