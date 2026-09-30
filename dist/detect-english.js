// Find documents that still contain English after a translation pass.
// Run with the foundry-mcp `run-script` tool, or paste into a Foundry script macro (GM).
// Returns [{uuid, field, score, sample}] sorted by score.

const THRESHOLD = 0.08; // share of English function words
const MAX_RESULTS = 200;

// --- inlined from lib/english-detector.js ---
/**
 * Cheap heuristic to find text that is still in English after a translation pass.
 * Counts very common English function words that almost never appear in French.
 */
const ENGLISH = new Set(
  'the and of with you your this that which when if into from their they them its is are was were be been has have it can must each creature target'.split(' ')
);

function stripHtml(html) {
  return String(html ?? '')
    .replace(/@\w+\[[^\]]*\](\{[^}]*\})?/g, ' ')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
}

/** Share of English function words among all words (0..1). */
function englishScore(text) {
  const words = stripHtml(text).toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 4) return 0;
  const hits = words.filter(w => ENGLISH.has(w)).length;
  return hits / words.length;
}

/** true when the text looks English (default threshold tuned on dnd5e descriptions). */
function looksEnglish(text, threshold = 0.08) {
  return englishScore(text) >= threshold;
}
// --- end ---

const found = [];
const check = (doc, field, text) => {
  const score = englishScore(text);
  if (score >= THRESHOLD) {
    found.push({ uuid: doc.uuid, name: doc.name, field, score: +score.toFixed(2), sample: stripHtml(text).trim().slice(0, 80) });
  }
};

for (const j of game.collections.get('JournalEntry')) {
  for (const p of j.pages) check(p, 'text.content', p.text?.content);
}
for (const a of game.actors) {
  check(a, 'system.details.biography.value', a.system.details?.biography?.value);
  for (const i of a.items) check(i, 'system.description.value', i.system.description?.value);
}
for (const i of game.items) check(i, 'system.description.value', i.system.description?.value);
for (const t of game.tables) for (const r of t.results) check(r, 'description', r.description ?? r.text);

return found.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
