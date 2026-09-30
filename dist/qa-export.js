// Export token and pin positions of a scene, to draw them over the map image with
// tools/qa_overlay.py and check a combined scene without opening Foundry.

const SCENE = '<scene id>';

const s = game.scenes.get(SCENE);
if (!s) throw new Error('Scene not found');
const d = s.dimensions;
const g = s.grid.size;
const qa = {
  name: s.name,
  bg: decodeURIComponent(s.background.src),
  sx: d.sceneX,
  sy: d.sceneY,
  w: d.sceneWidth,
  h: d.sceneHeight,
  // token centres, hidden flag
  t: s.tokens.map(t => [t.x + (t.width * g) / 2, t.y + (t.height * g) / 2, t.hidden ? 1 : 0]),
  n: s.notes.map(n => [n.x, n.y, n.text ?? '']),
};
const dir = `worlds/${game.world.id}/tmp`;
const FP = foundry.applications.apps.FilePicker.implementation;
await FP.createDirectory('data', dir).catch(() => {});
await FP.upload('data', dir, new File([JSON.stringify(qa)], `qa_${SCENE}.json`), {}, { notify: false });
return `${dir}/qa_${SCENE}.json`;
