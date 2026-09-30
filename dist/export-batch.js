// Export text to translate into JSON files that an AI agent can read and translate.
// Files land in Data/worlds/<world>/tmp/ (create nothing else, delete the folder when done).
//
// Output format, one file per batch of BATCH_SIZE entries:
//   [{ "id": "<uuid>", "name": "...", "text": "<html>" }, ...]

const KIND = 'journal'; // 'journal' | 'items' | 'actors' | 'tables'
const FOLDER = null; // optional folder name to restrict the export (journals, items, actors)
const BATCH_SIZE = 60;

const inFolder = d => {
  if (!FOLDER) return true;
  for (let f = d.folder; f; f = f.folder) if (f.name === FOLDER) return true;
  return false;
};

let rows = [];
if (KIND === 'journal') {
  for (const j of game.collections.get('JournalEntry').filter(inFolder))
    for (const p of j.pages) rows.push({ id: p.uuid, name: p.name, text: p.text?.content ?? '' });
} else if (KIND === 'items') {
  // dnd5e: export the SOURCE name, `item.name` returns the unidentified name for unidentified items
  rows = game.items.filter(inFolder).map(i => ({ id: i.uuid, name: i._source.name, text: i.system.description?.value ?? '' }));
} else if (KIND === 'actors') {
  rows = game.actors.filter(inFolder).map(a => ({ id: a.uuid, name: a.name, text: a.system.details?.biography?.value ?? '' }));
} else if (KIND === 'tables') {
  rows = game.tables.map(t => ({
    id: t.uuid,
    name: t.name,
    text: t.description ?? '',
    results: Object.fromEntries(t.results.map(r => [r.id, r.description ?? r.text ?? ''])),
  }));
}

const dir = `worlds/${game.world.id}/tmp`;
const FP = foundry.applications.apps.FilePicker.implementation;
await FP.createDirectory('data', dir).catch(() => {});
const files = [];
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const name = `export_${KIND}_${i / BATCH_SIZE + 1}.json`;
  const file = new File([JSON.stringify(rows.slice(i, i + BATCH_SIZE), null, 1)], name, { type: 'application/json' });
  await FP.upload('data', dir, file, {}, { notify: false });
  files.push(`${dir}/${name}`);
}
return { entries: rows.length, files };
