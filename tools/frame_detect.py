"""Measure the printed frame of an official battlemap.

Official adventure maps usually have a dark border (or a title band) around the drawn
area; MAD Cartography maps do not. This finds, near each edge, the darkest line of the
brightness profile and returns the drawn area as fractions: [left, top, right, bottom].

Usage:
    python tools/frame_detect.py official.webp [--margin 0.08] [--mad mad.webp]

With --mad, it also compares aspect ratios: a large gap means the two maps do not show
the same area and the frame needs checking by eye (tools/qa_overlay.py).
"""
import argparse
import json

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def detect_frame(path, margin=0.08, width=1500):
    img = Image.open(path).convert("L")
    w0, h0 = img.size
    scale = width / w0
    g = np.asarray(img.resize((width, max(1, int(h0 * scale))))).astype(float)
    h, w = g.shape
    # Mean brightness per column (middle rows) and per row (middle columns).
    cols = g[int(h * 0.3) : int(h * 0.7)].mean(axis=0)
    rows = g[:, int(w * 0.3) : int(w * 0.7)].mean(axis=1)

    def darkest(profile, lo, hi):
        return lo + int(np.argmin(profile[lo:hi]))

    x0 = darkest(cols, 0, int(w * margin))
    x1 = darkest(cols, int(w * (1 - margin)), w)
    y0 = darkest(rows, 0, int(h * margin))
    y1 = darkest(rows, int(h * (1 - margin)), h)
    frame = [round(x0 / w, 4), round(y0 / h, 4), round(x1 / w, 4), round(y1 / h, 4)]
    inner_ratio = (x1 - x0) * w0 / w / ((y1 - y0) * h0 / h)
    return frame, inner_ratio


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("official")
    ap.add_argument("--margin", type=float, default=0.08, help="search band near each edge (fraction)")
    ap.add_argument("--mad", help="MAD image, to compare aspect ratios")
    a = ap.parse_args()
    frame, ratio = detect_frame(a.official, a.margin)
    out = {"frame": frame, "inner_aspect": round(ratio, 3)}
    if a.mad:
        mw, mh = Image.open(a.mad).size
        out["mad_aspect"] = round(mw / mh, 3)
        out["aspect_gap"] = round(abs(ratio - mw / mh) / (mw / mh), 3)
    print(json.dumps(out))


if __name__ == "__main__":
    main()
