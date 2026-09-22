import { jsPDF } from "jspdf";
import type { AgreementClause } from "./agreement-template";

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return [0, 0, 0];
  const bigint = Number.parseInt(normalized, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const PAGE_BG = hexToRgb("#0D0D0D");
const WHITE = hexToRgb("#FFFFFF");
const MUTED = hexToRgb("#B3B3B3");
const GREEN = hexToRgb("#C2CC06");
const RULE = hexToRgb("#262626");

export type AgreementPdfInput = {
  title: string;
  subtitle?: string;
  clauses: AgreementClause[];
  signedBy?: string | null;
  signedAt?: string | null;
  fileName?: string;
};

function signedLabel(signedBy?: string | null, signedAt?: string | null) {
  if (!signedBy || !signedAt) return null;
  const date = new Date(signedAt);
  const dateText = Number.isNaN(date.getTime())
    ? signedAt
    : date.toLocaleDateString("en-GB");
  return `Signed by ${signedBy} on ${dateText}`;
}

function fileSlug(title: string) {
  return title.replace(/[^\w]+/g, "_").replace(/^_|_$/g, "") || "Agreement";
}

export function buildAgreementPdf(input: AgreementPdfInput): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const footerY = pageHeight - 22;

  const paintPage = () => {
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageWidth, 5, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, pageHeight - 5, pageWidth, 5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("R/HOOD Studio", margin, footerY);
    doc.text(
      String(doc.getNumberOfPages()),
      pageWidth - margin,
      footerY,
      { align: "right" }
    );
  };

  const ensureSpace = (cursor: { y: number }, needed: number) => {
    if (cursor.y + needed <= footerY - 18) return;
    doc.addPage();
    paintPage();
    cursor.y = margin + 16;
  };

  paintPage();
  const cursor = { y: margin + 28 };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text(input.title, margin, cursor.y);
  cursor.y += 18;

  if (input.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    const subtitleLines = doc.splitTextToSize(input.subtitle, contentWidth);
    doc.text(subtitleLines, margin, cursor.y);
    cursor.y += subtitleLines.length * 14 + 6;
  }

  const signed = signedLabel(input.signedBy, input.signedAt);
  if (signed) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(signed, margin, cursor.y);
    cursor.y += 18;
  }

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.8);
  doc.line(margin, cursor.y, pageWidth - margin, cursor.y);
  cursor.y += 22;

  input.clauses.forEach((clause) => {
    const bodyLines = doc.splitTextToSize(clause.body, contentWidth);
    const blockHeight = 18 + bodyLines.length * 14 + 16;
    ensureSpace(cursor, Math.min(blockHeight, 80));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.text(clause.heading, margin, cursor.y);
    cursor.y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...MUTED);
    bodyLines.forEach((line: string) => {
      ensureSpace(cursor, 16);
      doc.text(line, margin, cursor.y);
      cursor.y += 14;
    });
    cursor.y += 14;
  });

  return doc;
}

export function downloadAgreementPdf(input: AgreementPdfInput) {
  const doc = buildAgreementPdf(input);
  const today = new Date().toISOString().slice(0, 10);
  doc.save(input.fileName || `${fileSlug(input.title)}_${today}.pdf`);
}
