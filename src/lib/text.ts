/**
 * Small deterministic text helpers shared by the recommendation rules.
 *
 * Everything here is intentionally simple and inspectable: no statistical
 * model, no embeddings, no network calls. The point is that a reviewer can
 * read a rule and understand exactly why a finding appeared.
 */

const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","then","than","that","this","these","those",
  "is","are","was","were","be","been","being","am","do","does","did","doing",
  "of","in","on","at","to","for","with","by","from","as","into","about","between",
  "we","our","us","i","it","its","their","they","them","he","she","his","her",
  "will","would","can","could","should","may","might","must","shall",
  "have","has","had","not","no","also","such","using","use","used","study","studies",
  "data","dataset","datasets","research","analysis","analyses","patient","patients",
]);

/** Lower-cases, strips punctuation and splits into content tokens. */
export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
    .map(singularise);
}

/**
 * Crude plural stripping — enough for keyword overlap, honest about its limits.
 *
 * The Greek-derived case is handled explicitly because it matters here: without
 * it "diagnoses" in a research question would not match "diagnosis" in a
 * variable description, which is exactly the sort of match the relevance rules
 * exist to find.
 */
export function singularise(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  // diagnoses → diagnosis, prognoses → prognosis, analyses → analysis
  if (token.length > 5 && (token.endsWith("oses") || token.endsWith("yses"))) {
    return `${token.slice(0, -2)}is`;
  }
  // addresses → address
  if (token.length > 4 && token.endsWith("sses")) return token.slice(0, -2);
  // Words already in the "-is" singular must not be stripped further, or
  // "diagnosis" would become "diagnosi" and stop matching "diagnoses".
  if (token.endsWith("is")) return token;
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

export function tokenSet(input: string): Set<string> {
  return new Set(tokenize(input));
}

/** Number of shared tokens between a query and a body of text. */
export function overlapCount(queryTokens: Set<string>, text: string): number {
  const other = tokenSet(text);
  let count = 0;
  for (const token of queryTokens) if (other.has(token)) count += 1;
  return count;
}

/** Returns the shared tokens, sorted, so evidence strings stay stable. */
export function overlapTerms(queryTokens: Set<string>, text: string): string[] {
  const other = tokenSet(text);
  const shared: string[] = [];
  for (const token of queryTokens) if (other.has(token)) shared.push(token);
  return shared.sort();
}

/** True when the raw text contains any of the given phrases (case-insensitive). */
export function containsAny(text: string, phrases: readonly string[]): string[] {
  const haystack = text.toLowerCase();
  return phrases.filter((phrase) => haystack.includes(phrase.toLowerCase()));
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Clamp to the 0–1 range used by recommendation confidence. */
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Stable slug used to build deterministic recommendation ids. */
export function slug(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
