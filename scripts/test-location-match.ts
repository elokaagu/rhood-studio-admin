import { djMatchesLocationFilter } from "../lib/booking/location-match";

const checks: Array<[string, boolean]> = [
  [
    "London city matches London, UK filter",
    djMatchesLocationFilter("London", "London, UK"),
  ],
  [
    "London, UK matches London city filter",
    djMatchesLocationFilter("London, UK", "London"),
  ],
  [
    "country United Kingdom matches London, UK",
    djMatchesLocationFilter("London, UK", "United Kingdom"),
  ],
  [
    "UK alias matches England in DJ city string",
    djMatchesLocationFilter("Manchester, England", "UK"),
  ],
  [
    "US country filter matches New York, USA",
    djMatchesLocationFilter("New York, USA", "United States"),
  ],
  [
    "Berlin does not match London city filter",
    !djMatchesLocationFilter("Berlin, Germany", "London, UK"),
  ],
  [
    "Germany country filter matches Berlin",
    djMatchesLocationFilter("Berlin", "Germany"),
  ],
  [
    "empty filter matches everyone",
    djMatchesLocationFilter("Paris", ""),
  ],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) {
  console.log(`${ok ? "ok" : "FAIL"}  ${label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} location match check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} location match checks passed.`);
