import { jsPDF } from "jspdf";
import type { AnalyticsDashboardData } from "@/lib/analytics/types";

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return [0, 0, 0];
  const bigint = Number.parseInt(normalized, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

export function buildAnalyticsPdf(analytics: AnalyticsDashboardData): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandBlack = hexToRgb("#1D1D1B");
  const accentGreen = hexToRgb("#5F6604");
  const accentTint = hexToRgb("#EEF2C7");
  const textMuted = [92, 92, 92] as [number, number, number];
  const tableRowHeight = 26;
  const tableWidth = pageWidth - margin * 2;

  const drawHeader = (subtitle: string) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...brandBlack);
    doc.text("R/HOOD Portal Analytics", margin, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...textMuted);
    doc.text(subtitle, margin, margin + 20);
    doc.setFillColor(...accentGreen);
    doc.rect(margin, margin + 28, pageWidth - margin * 2, 3, "F");
  };

  const ensureSpace = (
    cursor: { y: number },
    required: number,
    subtitle: string
  ) => {
    if (cursor.y + required <= pageHeight - margin) return;
    doc.addPage();
    drawHeader(subtitle);
    cursor.y = margin + 70;
  };

  const generatedAt = new Date().toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const cursor = { y: margin + 70 };
  drawHeader(`Generated ${generatedAt}`);

  const metrics = [
    { label: "Monthly Signups", value: analytics.currentMonthSignups },
    { label: "Brand Applications", value: analytics.brandApplications },
    { label: "Daily Active Users", value: analytics.dailyActiveUsers },
    { label: "Avg Minutes Per User", value: analytics.minutesPerUser },
  ];

  const columnGap = 24;
  const cardWidth = (pageWidth - margin * 2 - columnGap) / 2;
  const cardHeight = 72;

  doc.setLineWidth(1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...brandBlack);
  doc.text("Key Metrics", margin, cursor.y);
  cursor.y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = margin + col * (cardWidth + columnGap);
    const y = cursor.y + row * (cardHeight + 12);

    doc.setFillColor(...accentTint);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, "F");
    doc.setDrawColor(...accentGreen);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, "S");
    doc.setTextColor(...textMuted);
    doc.text(metric.label.toUpperCase(), x + 16, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...brandBlack);
    doc.text(String(metric.value), x + 16, y + 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
  });

  cursor.y += Math.ceil(metrics.length / 2) * (cardHeight + 12) + 20;

  ensureSpace(cursor, 200, `Generated ${generatedAt}`);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...brandBlack);
  doc.text("Monthly Signups (Last 6 Months)", margin, cursor.y);
  cursor.y += 18;

  doc.setFillColor(...accentGreen);
  doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Month", margin + 12, cursor.y + 17);
  doc.text("Signups", margin + tableWidth - 12, cursor.y + 17, { align: "right" });
  cursor.y += tableRowHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  analytics.monthlySignups.forEach((entry, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...accentTint);
      doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
    }
    doc.setTextColor(...brandBlack);
    doc.text(entry.month, margin + 12, cursor.y + 17);
    doc.text(String(entry.signups), margin + tableWidth - 12, cursor.y + 17, {
      align: "right",
    });
    cursor.y += tableRowHeight;
  });

  cursor.y += 24;
  ensureSpace(cursor, 200, `Generated ${generatedAt}`);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...brandBlack);
  doc.text("Top Locations", margin, cursor.y);
  cursor.y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...textMuted);
  const locations = analytics.locationData.slice(0, 10);
  if (locations.length === 0) {
    doc.text("No location data available.", margin, cursor.y + 12);
    cursor.y += 24;
  } else {
    locations.forEach((location, index) => {
      ensureSpace(cursor, tableRowHeight + 10, `Generated ${generatedAt}`);
      doc.setTextColor(...brandBlack);
      doc.text(`${index + 1}. ${location.location}`, margin + 12, cursor.y + 16);
      doc.setTextColor(...textMuted);
      doc.text(`${location.count} members`, margin + tableWidth / 2, cursor.y + 16);
      cursor.y += tableRowHeight;
    });
  }

  doc.addPage();
  drawHeader("Engagement & Ratings Overview");
  cursor.y = margin + 70;

  const userSections = [
    {
      title: "Most Active Users",
      subtitle: "Top members based on gig applications.",
      rows: analytics.topUsers.mostActive.map((user, index) => ({
        rank: index + 1,
        label: user.name,
        value: `${user.gigs} gigs`,
      })),
    },
    {
      title: "Highest Rated Users",
      subtitle: "Average feedback ratings from AI matching sessions.",
      rows: analytics.topUsers.highestRating.map((user, index) => ({
        rank: index + 1,
        label: user.name,
        value: `${user.rating.toFixed(1)} ★`,
      })),
    },
    {
      title: "Up and Coming",
      subtitle: "Members without gig history yet but active recently.",
      rows: analytics.topUsers.upAndComing.map((user, index) => ({
        rank: index + 1,
        label: user.name,
        value: "New",
      })),
    },
    {
      title: "Least Active Users",
      subtitle: "Members with minimal gig activity.",
      rows: analytics.topUsers.leastActive.map((user, index) => ({
        rank: index + 1,
        label: user.name,
        value: `${user.gigs} gigs`,
      })),
    },
  ];

  userSections.forEach((section) => {
    const requiredHeight = 70 + Math.max(section.rows.length, 1) * (tableRowHeight + 4);
    ensureSpace(cursor, requiredHeight, "Engagement & Ratings Overview");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...brandBlack);
    doc.text(section.title, margin, cursor.y);
    cursor.y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...textMuted);
    doc.text(section.subtitle, margin, cursor.y);
    cursor.y += 20;

    doc.setFillColor(...accentGreen);
    doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("#", margin + 12, cursor.y + 17);
    doc.text("User", margin + 48, cursor.y + 17);
    doc.text("Metric", margin + tableWidth - 12, cursor.y + 17, { align: "right" });
    cursor.y += tableRowHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    if (section.rows.length === 0) {
      doc.setFillColor(...accentTint);
      doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
      doc.setTextColor(...brandBlack);
      doc.text("No data available", margin + 12, cursor.y + 17);
      cursor.y += tableRowHeight + 16;
      return;
    }

    section.rows.forEach((row, index) => {
      ensureSpace(cursor, tableRowHeight + 12, "Engagement & Ratings Overview");
      if (index % 2 === 0) {
        doc.setFillColor(...accentTint);
        doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
      }
      doc.setTextColor(...brandBlack);
      doc.text(String(row.rank), margin + 12, cursor.y + 17);
      doc.text(row.label, margin + 48, cursor.y + 17);
      doc.text(row.value, margin + tableWidth - 12, cursor.y + 17, { align: "right" });
      cursor.y += tableRowHeight;
    });

    cursor.y += 28;
  });

  return doc;
}
