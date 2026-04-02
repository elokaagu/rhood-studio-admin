import type { AnalyticsDashboardData, TopUser } from "@/lib/analytics/types";

export function buildAnalyticsCsv(analytics: AnalyticsDashboardData): string {
  const rows: string[][] = [];
  const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
  const addRow = (...values: (string | number)[]) =>
    rows.push(values.map((value) => String(value ?? "")));
  const addBlankRow = () => rows.push([]);

  addRow("Overview", "Brand Applications", analytics.brandApplications);
  addRow("Overview", "Daily Active Users", analytics.dailyActiveUsers);
  addRow("Overview", "Average Minutes Per User", analytics.minutesPerUser);
  addBlankRow();

  addRow("Monthly Signups", "Month", "Signups");
  analytics.monthlySignups.forEach((item) =>
    addRow("Monthly Signups", item.month, item.signups)
  );
  addBlankRow();

  addRow("Top Locations", "Location", "Members");
  analytics.locationData.forEach((item) =>
    addRow("Top Locations", item.location, item.count)
  );
  addBlankRow();

  addRow("Age Distribution", "Age Range", "Members");
  analytics.ageData.forEach((item) =>
    addRow("Age Distribution", item.ageRange, item.count)
  );
  addBlankRow();

  const userSections = [
    {
      title: "Most Active Users",
      data: analytics.topUsers.mostActive,
      valueLabel: "Gigs",
      valueFormatter: (user: TopUser) => `${user.gigs}`,
    },
    {
      title: "Highest Rated Users",
      data: analytics.topUsers.highestRating,
      valueLabel: "Rating",
      valueFormatter: (user: TopUser) => user.rating.toFixed(1),
    },
    {
      title: "Up and Coming Users",
      data: analytics.topUsers.upAndComing,
      valueLabel: "Status",
      valueFormatter: () => "New",
    },
    {
      title: "Least Active Users",
      data: analytics.topUsers.leastActive,
      valueLabel: "Gigs",
      valueFormatter: (user: TopUser) => `${user.gigs}`,
    },
  ];

  userSections.forEach(({ title, data, valueLabel, valueFormatter }) => {
    addRow(title, "User", valueLabel);
    data.forEach((user, index) =>
      addRow(title, `${index + 1}. ${user.name}`, valueFormatter(user))
    );
    addBlankRow();
  });

  return rows
    .map((row) => (row.length === 0 ? "" : row.map((value) => escape(value)).join(",")))
    .join("\n");
}
