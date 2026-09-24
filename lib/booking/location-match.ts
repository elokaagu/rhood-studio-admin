/** Country aliases so "UK", "United Kingdom", and "England" count as the same place. */
const COUNTRY_ALIASES: Record<string, string[]> = {
  gb: [
    "uk",
    "u.k.",
    "u.k",
    "united kingdom",
    "great britain",
    "britain",
    "gb",
    "england",
    "scotland",
    "wales",
    "northern ireland",
  ],
  us: ["us", "usa", "u.s.", "u.s.a.", "united states", "united states of america"],
  de: ["germany", "deutschland", "de"],
  fr: ["france", "fr"],
  nl: ["netherlands", "holland", "the netherlands", "nl"],
  es: ["spain", "espana", "españa", "es"],
  it: ["italy", "italia", "it"],
  ie: ["ireland", "éire", "eire", "ie", "republic of ireland"],
  pt: ["portugal", "pt"],
  be: ["belgium", "belgique", "be"],
  se: ["sweden", "se"],
  no: ["norway", "no"],
  dk: ["denmark", "dk"],
  ch: ["switzerland", "swiss", "ch"],
  at: ["austria", "at"],
  au: ["australia", "au"],
  ca: ["canada", "ca"],
  br: ["brazil", "brasil", "br"],
  mx: ["mexico", "méxico", "mx"],
  jp: ["japan", "jp"],
  in: ["india", "in"],
  za: ["south africa", "za"],
  ng: ["nigeria", "ng"],
  gh: ["ghana", "gh"],
  ke: ["kenya", "ke"],
  ae: ["uae", "united arab emirates"],
  pl: ["poland", "pl"],
  cz: ["czechia", "czech republic", "cz"],
};

const ALIAS_TO_COUNTRY = new Map<string, string>();
for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_COUNTRY.set(normalize(alias), code);
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CITY_TO_COUNTRY: Record<string, string> = {
  london: "gb",
  manchester: "gb",
  birmingham: "gb",
  bristol: "gb",
  leeds: "gb",
  glasgow: "gb",
  edinburgh: "gb",
  liverpool: "gb",
  berlin: "de",
  hamburg: "de",
  munich: "de",
  munchen: "de",
  cologne: "de",
  koln: "de",
  frankfurt: "de",
  paris: "fr",
  lyon: "fr",
  marseille: "fr",
  amsterdam: "nl",
  rotterdam: "nl",
  barcelona: "es",
  madrid: "es",
  ibiza: "es",
  rome: "it",
  milano: "it",
  milan: "it",
  dublin: "ie",
  lisbon: "pt",
  lisboa: "pt",
  brussels: "be",
  stockholm: "se",
  oslo: "no",
  copenhagen: "dk",
  zurich: "ch",
  geneva: "ch",
  vienna: "at",
  wien: "at",
  sydney: "au",
  melbourne: "au",
  toronto: "ca",
  montreal: "ca",
  "new york": "us",
  "los angeles": "us",
  chicago: "us",
  miami: "us",
  detroit: "us",
  "sao paulo": "br",
  "mexico city": "mx",
  tokyo: "jp",
  lagos: "ng",
  accra: "gh",
  nairobi: "ke",
  dubai: "ae",
  warsaw: "pl",
  prague: "cz",
};

function countryForCity(city: string | null): string | null {
  if (!city) return null;
  return CITY_TO_COUNTRY[city] || null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(haystack: string, phrase: string): boolean {
  if (!phrase) return false;
  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(phrase)}([^a-z0-9]|$)`,
    "i"
  );
  return pattern.test(haystack);
}

export type ParsedLocation = {
  raw: string;
  city: string | null;
  country: string | null;
};

export function parseLocation(raw: string | null | undefined): ParsedLocation {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { raw: "", city: null, country: null };

  const parts = trimmed
    .split(",")
    .map((part) => normalize(part))
    .filter(Boolean);

  let country: string | null = null;
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const code = ALIAS_TO_COUNTRY.get(parts[i]);
    if (code) {
      country = code;
      parts.splice(i, 1);
      break;
    }
  }

  if (!country) {
    const full = normalize(trimmed);
    for (const [alias, code] of ALIAS_TO_COUNTRY) {
      if (alias.includes(" ") && hasPhrase(full, alias)) {
        country = code;
        break;
      }
    }
  }

  const city = parts[0] || null;
  return { raw: trimmed, city, country };
}

/**
 * Match a DJ city string against a filter that may be a city ("London"),
 * a city + country ("London, UK"), or a country ("United Kingdom").
 */
export function djMatchesLocationFilter(
  djLocation: string | null | undefined,
  filter: string | null | undefined
): boolean {
  const needle = (filter || "").trim();
  if (!needle) return true;

  const haystack = (djLocation || "").trim();
  if (!haystack) return false;

  const dj = parseLocation(haystack);
  const want = parseLocation(needle);

  if (want.city) {
    if (dj.city && (dj.city === want.city || hasPhrase(dj.city, want.city))) {
      if (want.country && dj.country && want.country !== dj.country) return false;
      return true;
    }
    if (hasPhrase(normalize(haystack), want.city)) {
      if (want.country && dj.country && want.country !== dj.country) return false;
      return true;
    }
    return false;
  }

  if (want.country) {
    const djCountry = dj.country || countryForCity(dj.city);
    if (djCountry === want.country) return true;
    const aliases = COUNTRY_ALIASES[want.country] || [];
    const djNorm = normalize(haystack);
    return aliases.some((alias) => hasPhrase(djNorm, alias));
  }

  const djNorm = normalize(haystack);
  const filterNorm = normalize(needle);
  return hasPhrase(djNorm, filterNorm) || hasPhrase(filterNorm, djNorm);
}
