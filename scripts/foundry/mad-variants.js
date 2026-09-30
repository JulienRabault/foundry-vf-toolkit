// Once a combined scene exists (mad-combine.js), create the other MAD variants
// (night, rain, trashed…) with the same tokens and pins, so the GM can pick the right
// ambiance at the table. Variants must have the same size as the one used for the
// combined scene (MAD variants of a location do).

const COMBINED_SCENE = '<combined scene id>'; // scene made by mad-combine.js
const VARIANTS = {
  // MAD scene id: suffix added to the combined scene's base name
  '<MAD scene id, day rain>': 'jour, pluie',
  '<MAD scene id, night>': 'nuit, dégagé',
};
const BASE_NAME = null; // defaults to the combined scene name without a trailing "(…)"

const c = game.scenes.get(COMBINED_SCENE);
if (!c) throw new Error('Combined scene not found');
const co = c.toObject();
const base = BASE_NAME ?? c.name.replace(/\s*\([^)]*\)\s*$/, '');
const out = [];
for (const [id, suffix] of Object.entries(VARIANTS)) {
  const v = game.scenes.get(id);
  if (!v) {
    out.push(`missing ${id}`);
    continue;
  }
  if (v.width !== c.width || v.height !== c.height || v.grid.size !== c.grid.size) {
    out.push(`skipped ${v.name}: different size`);
    continue;
  }
  const name = `${base} (${suffix})`;
  if (game.scenes.find(s => s.name === name)) {
    out.push(`exists ${name}`);
    continue;
  }
  const d = v.toObject();
  delete d._id;
  const strip = arr => arr.map(({ _id, ...rest }) => rest);
  Object.assign(d, {
    name,
    navName: name,
    folder: co.folder,
    journal: co.journal,
    journalEntryPage: co.journalEntryPage,
    tokenVision: co.tokenVision,
    ownership: co.ownership,
    active: false,
    navigation: false,
    tokens: strip(co.tokens), // level ids are "defaultLevel0000" on MAD scenes, shared by variants
    notes: strip(co.notes),
  });
  d.fog = { ...d.fog, mode: co.fog.mode };
  d.grid = { ...d.grid, distance: co.grid.distance, units: co.grid.units };
  if (d.levels) d.levels = d.levels.map(l => ({ ...l, name }));
  const s = await Scene.create(d);
  out.push(`${s.id} ${name}`);
}
return out;
