// Harmonise proper names everywhere with a glossary (e.g. align on the official French book).
// Glossary file: worlds/<world>/tmp/glossary.json, see glossary/ for an example.
// Touches only visible text: HTML text nodes, names, token names, pin labels. Never ids,
// image paths or @UUID targets. Set DRY_RUN = false to write.

const DRY_RUN = true;
const GLOSSARY = 'glossary.json';

/* @include ../../lib/glossary.js */

const rules = compileGlossary(parseGlossary(await (await fetch(`/worlds/${game.world.id}/tmp/${GLOSSARY}`)).text()));
const T = s => (typeof s === 'string' ? replaceText(s, rules) : s);
const H = s => (typeof s === 'string' ? replaceHtml(s, rules) : s);
const count = {};
const bump = k => (count[k] = (count[k] ?? 0) + 1);

async function patch(doc, changes, kind) {
  const diff = Object.fromEntries(
    Object.entries(changes).filter(([k, v]) => v != null && v !== foundry.utils.getProperty(doc._source ?? doc, k))
  );
  if (!Object.keys(diff).length) return;
  bump(kind);
  if (!DRY_RUN) await doc.update(diff);
}

for (const j of game.collections.get('JournalEntry')) {
  await patch(j, { name: T(j.name) }, 'journals');
  for (const p of j.pages) await patch(p, { name: T(p.name), 'text.content': H(p.text?.content) }, 'pages');
}
for (const a of game.actors) {
  await patch(a, { name: T(a._source.name), 'prototypeToken.name': T(a.prototypeToken.name), 'system.details.biography.value': H(a.system.details?.biography?.value) }, 'actors');
  for (const i of a.items) await patch(i, { name: T(i._source.name), 'system.description.value': H(i.system.description?.value) }, 'actor items');
}
for (const i of game.items) await patch(i, { name: T(i._source.name), 'system.description.value': H(i.system.description?.value) }, 'items');
for (const t of game.tables) {
  await patch(t, { name: T(t.name), description: H(t.description) }, 'tables');
  for (const r of t.results) await patch(r, { description: H(r.description) }, 'table results');
}
for (const s of game.scenes) {
  await patch(s, { name: T(s.name), navName: T(s.navName) }, 'scenes');
  for (const n of s.notes) await patch(n, { text: T(n.text) }, 'pins');
  for (const tk of s.tokens) await patch(tk, { name: T(tk.name) }, 'tokens');
}
for (const f of game.folders) await patch(f, { name: T(f.name) }, 'folders');

return { dryRun: DRY_RUN, changed: count };
