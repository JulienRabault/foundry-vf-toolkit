// Apply a translated batch written by the agent next to the export:
//   worlds/<world>/tmp/trans_<kind>_<n>.json = { "<uuid>": { "name": "...", "text": "<html>", "results": {...} } }
// Documents are updated in place: back up the world first. Idempotent: run it again safely.
// Run one file at a time (run-script times out after ~15 s but the script keeps running
// inside Foundry: check the count with a second call). Set DRY_RUN = false to write.

const DRY_RUN = true;
const FILE = 'trans_journal_1.json';

const tr = await (await fetch(`/worlds/${game.world.id}/tmp/${FILE}`)).json();

// A translation must keep the markup: same number of tags, links and enrichers.
const markers = s => [/</g, /@\w+\[/g, /\[\[/g].map(re => (s.match(re) ?? []).length).join();
const TEXT_PATH = {
  JournalEntryPage: 'text.content',
  Item: 'system.description.value',
  Actor: 'system.details.biography.value',
  RollTable: 'description',
};

let done = 0;
const missing = [];
const rejected = [];
for (const [uuid, t] of Object.entries(tr)) {
  const doc = await fromUuid(uuid);
  if (!doc) {
    missing.push(uuid);
    continue;
  }
  const up = {};
  if (typeof t.name === 'string' && t.name.trim()) up.name = t.name;
  const path = TEXT_PATH[doc.documentName];
  if (path && typeof t.text === 'string' && t.text.trim()) {
    const old = foundry.utils.getProperty(doc._source, path) ?? '';
    if (markers(old) !== markers(t.text)) {
      rejected.push(uuid);
      continue;
    }
    up[path] = t.text;
  }
  // Rename the prototype token only if it still carries the actor's name.
  if (doc.documentName === 'Actor' && up.name && doc.prototypeToken.name === doc._source.name) {
    up['prototypeToken.name'] = up.name;
  }
  if (!DRY_RUN) {
    if (doc.documentName === 'RollTable' && t.results) {
      const results = Object.entries(t.results)
        .filter(([, d]) => typeof d === 'string' && d.trim())
        .map(([_id, description]) => ({ _id, description }));
      await doc.updateEmbeddedDocuments('TableResult', results);
    }
    if (Object.keys(up).length) await doc.update(up);
  }
  done++;
}
return { dryRun: DRY_RUN, applied: done, missing, rejected };
