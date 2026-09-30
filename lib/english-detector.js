/**
 * Cheap heuristic to find text that is still in English after a translation pass.
 * Counts very common English function words that almost never appear in French.
 */
const ENGLISH = new Set(
  'the and of with you your this that which when if into from their they them its is are was were be been has have it can must each creature target'.split(' ')
);

export function stripHtml(html) {
  return String(html ?? '')
    .replace(/@\w+\[[^\]]*\](\{[^}]*\})?/g, ' ')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
}

/** Share of English function words among all words (0..1). */
export function englishScore(text) {
  const words = stripHtml(text).toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 4) return 0;
  const hits = words.filter(w => ENGLISH.has(w)).length;
  return hits / words.length;
}

/** true when the text looks English (default threshold tuned on dnd5e descriptions). */
export function looksEnglish(text, threshold = 0.08) {
  return englishScore(text) >= threshold;
}
