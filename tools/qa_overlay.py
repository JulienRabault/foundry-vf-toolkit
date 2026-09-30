"""Draw token and pin positions (from scripts/foundry/qa-export.js) over the map image.

Usage:
    python tools/qa_overlay.py qa_<scene>.json --data "C:/Users/you/AppData/Local/FoundryVTT/Data" [-o out.png]

Red circles = visible tokens, yellow = hidden tokens, cyan squares = pins.
Open several files at once to get a contact sheet.
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None


def overlay(qa, data_dir, size=900):
    src = Image.open(Path(data_dir) / qa["bg"]).convert("RGB")
    k = size / max(src.size)
    img = src.resize((int(src.size[0] * k), int(src.size[1] * k)))
    # scene pixels -> image pixels: the background fills the scene rectangle
    fx = img.size[0] / qa["w"]
    fy = img.size[1] / qa["h"]
    dr = ImageDraw.Draw(img)
    r = max(4, size // 150)
    for x, y, hidden in qa["t"]:
        X, Y = (x - qa["sx"]) * fx, (y - qa["sy"]) * fy
        dr.ellipse([X - r, Y - r, X + r, Y + r], outline="yellow" if hidden else "red", width=2)
    for x, y, _ in qa["n"]:
        X, Y = (x - qa["sx"]) * fx, (y - qa["sy"]) * fy
        dr.rectangle([X - r, Y - r, X + r, Y + r], outline="cyan", width=2)
    try:
        font = ImageFont.load_default(size=18)  # Pillow >= 10.1, supports accents
    except TypeError:
        font = ImageFont.load_default()
    dr.text((6, 6), qa["name"], fill="white", font=font, stroke_width=2, stroke_fill="black")
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--data", required=True, help="Foundry user data folder (contains modules/ and worlds/)")
    ap.add_argument("-o", "--out", default="qa.png")
    a = ap.parse_args()
    tiles = [overlay(json.load(open(f, encoding="utf-8")), a.data) for f in a.files]
    cols = min(3, len(tiles))
    rows = math.ceil(len(tiles) / cols)
    cw = max(t.size[0] for t in tiles)
    ch = max(t.size[1] for t in tiles)
    sheet = Image.new("RGB", (cols * cw, rows * ch), "black")
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * cw, (i // cols) * ch))
    sheet.save(a.out)
    print(a.out, sheet.size)


if __name__ == "__main__":
    main()
