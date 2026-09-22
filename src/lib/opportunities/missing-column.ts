type PostgrestLikeError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
} | null;

/** Column name PostgREST/Postgres is complaining is missing, if any. */
export function missingColumnFromError(error: PostgrestLikeError): string | null {
  if (!error) return null;
  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ");

  const schemaCache = text.match(
    /['"]([a-z_][a-z0-9_]*)['"] column of ['"][a-z_]+['"]/i
  );
  if (schemaCache) return schemaCache[1];

  const doesNotExist = text.match(
    /column ['"]?([a-z_][a-z0-9_]*)['"]? does not exist/i
  );
  if (doesNotExist) return doesNotExist[1];

  if (error.code === "PGRST204" || /schema cache/i.test(text)) {
    const quoted = text.match(/['"]([a-z_][a-z0-9_]*)['"]/);
    if (quoted) return quoted[1];
  }

  return null;
}
