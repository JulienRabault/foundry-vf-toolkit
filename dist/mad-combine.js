// Build a "best of both" scene: the MAD Cartography map (walls, lights, sounds, day/night)
// with the tokens and map pins of the official adventure scene.
//
// 1. Measure the frame of the official image with tools/frame_detect.py (or by eye).
// 2. Fill the three constants below and run. The new scene is created inactive, next to the
//    official one; nothing is modified or deleted.
// 3. Check with tools/qa_overlay.py or by opening the scene; nudge tokens by hand if needed.

const OFFICIAL_SCENE = '<official scene id>'; // scene id of the adventure module
const MAD_SCENE = '<MAD scene id>'; // scene id of the MAD map (one variant)
const FRAME = [0.044, 0.0454, 0.9527, 0.9642]; // drawn area of the official image [l, t, r, b]
const NAME = null; // defaults to "<official name> (MAD)"

// --- inlined from lib/transform.js ---
/**
 * Map a point from an "official" battlemap to a MAD Cartography (or any other)
 * version of the same map.
 *
 * Both images show the same place but the official one has a printed frame
 * (margins, title, compass). `frame` is the drawn area of the official image as
 * fractions of its width and height: [left, top, right, bottom], e.g.
 * [0.044, 0.045, 0.953, 0.964]. The target scene is assumed to cover the whole
 * drawn area without a frame.
 *
 * Scene rectangles use Foundry's `scene.dimensions`: {sceneX, sceneY, sceneWidth, sceneHeight}.
 */

/** @returns {(x: number, y: number) => [number, number]} */
function makeTransform(source, target, frame) {
  const [fl, ft, fr, fb] = frame;
  if (!(fr > fl && fb > ft)) throw new Error('frame must be [left, top, right, bottom] with right>left, bottom>top');
  return (x, y) => [
    target.sceneX + ((x - source.sceneX) / source.sceneWidth - fl) / (fr - fl) * target.sceneWidth,
    target.sceneY + ((y - source.sceneY) / source.sceneHeight - ft) / (fb - ft) * target.sceneHeight,
  ];
}

/**
 * Move a token keeping its centre on the same spot of the map.
 * Token x/y are its top-left corner; width/height are in grid squares.
 */
function moveToken(token, transform, sourceGrid, targetGrid) {
  const cx = token.x + (token.width * sourceGrid) / 2;
  const cy = token.y + (token.height * sourceGrid) / 2;
  const [nx, ny] = transform(cx, cy);
  return {
    ...token,
    x: Math.round(nx - (token.width * targetGrid) / 2),
    y: Math.round(ny - (token.height * targetGrid) / 2),
  };
}

/** Move a map pin (Note) and rescale its icon and label to the new grid size. */
function moveNote(note, transform, sourceGrid, targetGrid) {
  const [nx, ny] = transform(note.x, note.y);
  const k = targetGrid / sourceGrid;
  return {
    ...note,
    x: Math.round(nx),
    y: Math.round(ny),
    iconSize: Math.round(note.iconSize * k),
    fontSize: Math.round(note.fontSize * k),
  };
}
// --- end ---

const so = game.scenes.get(OFFICIAL_SCENE);
const sm = game.scenes.get(MAD_SCENE);
if (!so || !sm) throw new Error('Scene not found');
const go = so.grid.size;
const gm = sm.grid.size;
const T = makeTransform(so.dimensions, sm.dimensions, FRAME);

// v14 scene levels: put tokens on the ground level of the MAD scene.
const levels = sm.levels?.contents ?? [];
const ground = levels.find(l => /ground/i.test(l.name)) ?? levels.find(l => l.elevation?.bottom === 0) ?? levels[0];

const d = sm.toObject();
delete d._id;
Object.assign(d, {
  name: NAME ?? `${so.name} (MAD)`,
  folder: so.folder?.id ?? null,
  journal: so.journal?.id ?? null,
  journalEntryPage: so.journalEntryPage?.id ?? null,
  tokenVision: so.tokenVision,
  playlist: so.playlist?.id ?? null,
  playlistSound: so.playlistSound?.id ?? null,
  active: false,
  navigation: false,
});
d.navName = d.name;
d.fog = { ...d.fog, mode: so.fog.mode };
d.grid = { ...d.grid, distance: so.grid.distance, units: so.grid.units };
d.tokens = so.tokens.contents.map(t => {
  const o = moveToken(t.toObject(), T, go, gm);
  delete o._id;
  if (ground) o.level = ground.id;
  return o;
});
d.notes = so.notes.contents.map(n => {
  const o = moveNote(n.toObject(), T, go, gm);
  delete o._id;
  return o;
});

const created = await Scene.create(d);
const { thumb } = await created.createThumbnail({ img: created.background?.src });
await created.update({ thumb });
return { id: created.id, name: created.name, tokens: d.tokens.length, notes: d.notes.length };
