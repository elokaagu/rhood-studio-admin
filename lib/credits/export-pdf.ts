import { jsPDF } from "jspdf";

const BLACK: [number, number, number] = [29, 29, 27];
const LIME: [number, number, number] = [194, 204, 6];
const LIME_DARK: [number, number, number] = [95, 102, 4];
const TINT: [number, number, number] = [238, 242, 199];
const MUTED: [number, number, number] = [110, 110, 105];
const WHITE: [number, number, number] = [255, 255, 255];
const RULE: [number, number, number] = [228, 228, 222];

const EARN: [string, string, string][] = [
  ["5 star rating from a brand", "+50", "When a brand rates a DJ after a gig."],
  ["4 star rating from a brand", "+25", "When a brand rates a DJ after a gig."],
  [
    "Friend joins with your invite",
    "+25",
    "When a friend signs up with a DJ invite code, the inviter gets credits.",
  ],
  ["3 star rating from a brand", "+10", "When a brand rates a DJ after a gig."],
  ["2 star rating from a brand", "+5", "When a brand rates a DJ after a gig."],
  [
    "Someone likes your mix",
    "+1",
    "One credit per person. Liking again does not stack.",
  ],
  ["1 star rating from a brand", "0", "No credits for a 1 star rating."],
  [
    "Manual top-up or correction",
    "Varies",
    "Team can add or remove credits when something goes wrong.",
  ],
];

/** One-page team-facing credits overview. */
export function buildCreditsSystemPdf(): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const contentW = W - M * 2;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, W, H, "F");

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, 78, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 78, W, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...LIME);
  doc.text("R/HOOD", M, 30);

  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.text("Credits", M, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(190, 190, 185);
  doc.text("How DJs earn and spend on the platform", M, 70);

  let y = 104;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  let lines = doc.splitTextToSize(
    "Credits reward DJs for good work and activity. Earn them, then spend them to boost a listing so more people see it. Brands do not use credits. This is DJ-only.",
    contentW
  ) as string[];
  doc.text(lines, M, y);
  y += lines.length * 13 + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...LIME_DARK);
  doc.text("IN SHORT", M, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  lines = doc.splitTextToSize(
    "Every DJ has a credit balance. Earning adds to it. Spending takes away. The leaderboard shows who has the most. When someone boosts a listing, it sits at the top of the feed for one day.",
    contentW
  ) as string[];
  doc.text(lines, M, y);
  y += lines.length * 12.5 + 16;

  const gap = 12;
  const cardW = (contentW - gap) / 2;
  const cardH = 62;
  const cardY = y;

  const drawCard = (
    x: number,
    title: string,
    body: string,
    accent: [number, number, number]
  ) => {
    doc.setFillColor(...TINT);
    doc.roundedRect(x, cardY, cardW, cardH, 8, 8, "F");
    doc.setFillColor(...accent);
    doc.rect(x, cardY, 4, cardH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text(title, x + 16, cardY + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const bodyLines = doc.splitTextToSize(body, cardW - 28) as string[];
    doc.text(bodyLines, x + 16, cardY + 38);
  };

  drawCard(M, "Earn", "Ratings, invites, and mix likes add to a DJ's balance.", LIME);
  drawCard(
    M + cardW + gap,
    "Spend",
    "100 credits boosts a listing to the top of the feed for 24 hours.",
    LIME_DARK
  );
  y = cardY + cardH + 14;

  const spendH = 54;
  doc.setFillColor(...BLACK);
  doc.roundedRect(M, y, contentW, spendH, 8, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...LIME);
  doc.text("THE ONLY WAY TO SPEND", M + 16, y + 18);

  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("Boost a listing", M + 16, y + 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(170, 170, 165);
  doc.text("Only DJs  ·  Top of feed for 24 hours", M + 16, y + 48);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...LIME);
  doc.text("-100", M + contentW - 16, y + 34, { align: "right" });
  y += spendH + 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("WAYS TO EARN", M, y);
  doc.setDrawColor(...LIME);
  doc.setLineWidth(2);
  doc.line(M, y + 5, M + 32, y + 5);
  y += 12;

  const rowPadX = 12;
  const colAction = M + rowPadX;
  const colAmount = M + contentW * 0.42;
  const colNotes = M + contentW * 0.52;
  const notesW = contentW - (colNotes - M) - rowPadX;
  const headerH = 20;

  doc.setFillColor(...LIME_DARK);
  doc.roundedRect(M, y, contentW, headerH, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("What happens", colAction, y + 13);
  doc.text("Credits", colAmount, y + 13);
  doc.text("Notes", colNotes, y + 13);
  y += headerH + 2;

  EARN.forEach((row, i) => {
    const [label, amount, notes] = row;
    const noteLines = doc.splitTextToSize(notes, notesW) as string[];
    const labelLines = doc.splitTextToSize(label, contentW * 0.38) as string[];
    const lineCount = Math.max(noteLines.length, labelLines.length, 1);
    const rowH = 10 + lineCount * 10 + 8;

    if (i % 2 === 0) {
      doc.setFillColor(...TINT);
      doc.roundedRect(M, y, contentW, rowH, 3, 3, "F");
    }

    const textY = y + 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(labelLines, colAction, textY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...(amount === "0" ? MUTED : LIME_DARK));
    doc.text(amount, colAmount, textY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(noteLines, colNotes, textY);

    y += rowH;
  });

  y += 14;

  const colGap = 12;
  const colW = (contentW - colGap) / 2;
  const boxPad = 12;

  const laterCopy = doc.splitTextToSize(
    "We have room for more ways to earn, like finishing a gig, streak bonuses, or peer endorsements. Those are not live yet. Mix likes at +1 are the next small engagement reward we want in place.",
    colW - boxPad * 2
  ) as string[];
  const questionsCopy = doc.splitTextToSize(
    "1. Should finishing a gig give credits on its own, or only when the brand leaves a rating?\n\n2. Is +1 per mix like the right amount, or should it be +2?\n\n3. Should brands ever get credits (for example to feature a listing), or keep this DJ-only?",
    colW - boxPad * 2
  ) as string[];

  const boxInnerH = Math.max(laterCopy.length, questionsCopy.length) * 10 + 28;
  const boxH = boxInnerH + boxPad;

  const drawInfoBox = (x: number, title: string, bodyLines: string[]) => {
    doc.setFillColor(...TINT);
    doc.roundedRect(x, y, colW, boxH, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...LIME_DARK);
    doc.text(title, x + boxPad, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    doc.text(bodyLines, x + boxPad, y + 30);
  };

  drawInfoBox(M, "THINGS WE MAY ADD LATER", laterCopy);
  drawInfoBox(M + colW + colGap, "QUESTIONS FOR THE TEAM", questionsCopy);
  y += boxH + 14;

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.8);
  doc.line(M, y, M + contentW, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    "Share feedback with the team. We will update the live amounts once everyone agrees.",
    M,
    y
  );

  return doc;
}
