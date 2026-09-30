// Find documents that still contain English after a translation pass.
// Run with the foundry-mcp `run-script` tool, or paste into a Foundry script macro (GM).
// Returns [{uuid, field, score, sample}] sorted by score.

const THRESHOLD = 0.08; // share of English function words
const MAX_RESULTS = 200;

/* @include ../../lib/english-detector.js */

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
