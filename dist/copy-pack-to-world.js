// Copy a module compendium into a world compendium you can translate freely
// (module packs are overwritten on every module update, and should stay untouched).
// Keeps ids (links keep working), folders and document order.

const SOURCE = 'dnd-phandelver-below.pbso-bestiary'; // module pack id
const NAME = 'bestiaire-vf'; // world pack name
const LABEL = 'Bestiaire (VF)';

const src = game.packs.get(SOURCE);
if (!src) throw new Error(`Pack not found: ${SOURCE}`);
let dest = game.packs.get(`world.${NAME}`);
if (!dest) {
  dest = await foundry.documents.collections.CompendiumCollection.createCompendium({
    name: NAME,
    label: LABEL,
    type: src.documentName,
    packageType: 'world',
  });
}

// Folders first, parents before children, same ids.
const folders = [...src.folders].sort((a, b) => a.depth - b.depth);
for (const f of folders) {
  if (dest.folders.get(f.id)) continue;
  await Folder.create(f.toObject(), { pack: dest.collection, keepId: true });
}

const docs = await src.getDocuments();
const existing = new Set((await dest.getIndex()).map(e => e._id));
// toObject() holds the real source name. Never rebuild data from `item.name`: dnd5e returns
// the unidentified name for unidentified items and you would lose the real one.
const data = docs.filter(d => !existing.has(d.id)).map(d => d.toObject());
for (let i = 0; i < data.length; i += 50) {
  await dest.documentClass.createDocuments(data.slice(i, i + 50), { pack: dest.collection, keepId: true });
}
return { pack: dest.collection, copied: data.length, skipped: existing.size };
