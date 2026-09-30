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
export function makeTransform(source, target, frame) {
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
export function moveToken(token, transform, sourceGrid, targetGrid) {
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
export function moveNote(note, transform, sourceGrid, targetGrid) {
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
