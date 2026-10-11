"""Cut each 3x2 egg sheet in public/eggs/ into standalone, clean egg files.

Eggs in the source sheets overlap the 512px grid lines, so a fixed grid crop
picks up slivers of neighboring eggs. Instead we label connected regions of
opaque pixels across the whole sheet, assign each region to the cell that
contains its centroid, and keep only that cell's regions. The result is
centered on a square transparent canvas so every egg renders at a consistent
scale with object-fit: contain.

Usage: python3 -I scripts/slice_eggs.py
"""

import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "eggs")
OUT = os.path.join(ROOT, "single")

SHEETS = {
    "aqua.webp": ["aqua-current", "aqua-nebula", "aqua-shard", "aqua-droplet", "aqua-stripe", "aqua-loop"],
    "industrial.webp": ["ind-neon", "ind-copper", "ind-cell", "ind-coil", "ind-orb", "ind-strip"],
    "hex.webp": ["hex-fan", "hex-chip", "hex-vial", "hex-rib", "hex-dome", "hex-vent"],
    "fantasy.webp": ["fan-leaf", "fan-slime", "fan-horn", "fan-eye", "fan-cloud", "fan-crystal"],
    "stone.webp": ["stn-ember", "stn-marble", "stn-geode", "stn-slate", "stn-obsidian", "stn-sand"],
    "wood.webp": ["wd-bark", "wd-birch", "wd-redwood", "wd-fern", "wd-root", "wd-maple"],
    "crystal.webp": ["cr-prism", "cr-petal", "cr-spiral", "cr-rhombus", "cr-onyx", "cr-emerald"],
    "gold.webp": ["au-dune", "au-fissure", "au-guilloche", "au-fold", "au-facet", "au-craquelure"],
    "earth.webp": ["er-moss", "er-coral", "er-sandbar", "er-mycel", "er-frond", "er-brook"],
    "electric.webp": ["el-arc", "el-spark", "el-tesla", "el-plasma", "el-surge", "el-gyre"],
    "terra.webp": ["tr-clay", "tr-loam", "tr-strata", "tr-rift", "tr-ochre", "tr-granite"],
    "feather.webp": ["fe-ashwing", "fe-peacock", "fe-dove", "fe-kingfisher", "fe-owl", "fe-raven"],
    "frost.webp": ["fr-glacier", "fr-rime", "fr-berg", "fr-nightfrost", "fr-drift", "fr-hoar"],
    "verdant.webp": ["vd-scarab", "vd-bud", "vd-cicada", "vd-firefly", "vd-laurel", "vd-canopy"],
}

ALPHA_MIN = 8          # pixels at or below this alpha count as background
MIN_REGION_FRAC = 0.002  # drop specks smaller than this fraction of the cell's main egg
PAD_FRAC = 0.04        # transparent margin around the egg on the square canvas


STRUCT = np.ones((3, 3), dtype=bool)
NECK_SEARCH = 160  # px either side of a grid line to look for the touching point


def separate_touching(mask: np.ndarray, cell_w: float, cell_h: float):
    """Label opaque regions, cutting any region that bridges two grid cells.

    Some eggs touch their neighbor in the source art. For each region taller
    (or wider) than a cell, we find the narrowest row (or column) near the
    grid line inside that region and clear it, which splits the two eggs.
    """
    mask = mask.copy()
    for _ in range(12):
        labels, n = ndimage.label(mask, structure=STRUCT)
        objects = ndimage.find_objects(labels)
        changed = False
        for lab, sl in enumerate(objects, start=1):
            if sl is None:
                continue
            ys, xs = sl
            region = labels[sl] == lab
            if ys.stop - ys.start > cell_h * 1.2:
                line = round(cell_h * round((ys.start + ys.stop) / 2 / cell_h))
                lo = max(ys.start + 1, line - NECK_SEARCH)
                hi = min(ys.stop - 1, line + NECK_SEARCH)
                widths = region[lo - ys.start:hi - ys.start].sum(axis=1)
                cut = lo + int(np.argmin(widths + np.abs(np.arange(lo, hi) - line) * 0.01))
                row = labels[cut, xs] == lab
                mask[cut, xs.start:xs.stop][row] = False
                changed = True
            elif xs.stop - xs.start > cell_w * 1.2:
                line = round(cell_w * round((xs.start + xs.stop) / 2 / cell_w))
                lo = max(xs.start + 1, line - NECK_SEARCH)
                hi = min(xs.stop - 1, line + NECK_SEARCH)
                heights = region[:, lo - xs.start:hi - xs.start].sum(axis=0)
                cut = lo + int(np.argmin(heights + np.abs(np.arange(lo, hi) - line) * 0.01))
                col = labels[ys, cut] == lab
                mask[ys.start:ys.stop, cut][col] = False
                changed = True
        if not changed:
            return labels, n
    return ndimage.label(mask, structure=STRUCT)


def slice_sheet(name: str, ids: list[str]) -> list[str]:
    img = Image.open(os.path.join(ROOT, name)).convert("RGBA")
    rgba = np.array(img)
    h, w = rgba.shape[:2]
    cell_w, cell_h = w / 3, h / 2

    mask = rgba[:, :, 3] > ALPHA_MIN
    labels, n = separate_touching(mask, cell_w, cell_h)
    idx = np.arange(1, n + 1)
    areas = ndimage.sum(mask, labels, idx)
    centroids = ndimage.center_of_mass(mask, labels, idx)

    warnings = []
    by_cell: dict[int, list[tuple[int, float]]] = {i: [] for i in range(6)}
    for lab, area, (cy, cx) in zip(idx, areas, centroids):
        col = min(2, int(cx // cell_w))
        row = min(1, int(cy // cell_h))
        by_cell[row * 3 + col].append((int(lab), float(area)))

    for cell, egg_id in enumerate(ids):
        regions = by_cell[cell]
        if not regions:
            warnings.append(f"{egg_id}: no pixels found")
            continue
        main = max(a for _, a in regions)
        keep = [lab for lab, a in regions if a >= main * MIN_REGION_FRAC]
        keep_mask = np.isin(labels, keep)

        ys, xs = np.nonzero(keep_mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        if (x1 - x0) > cell_w * 1.25 or (y1 - y0) > cell_h * 1.25:
            warnings.append(f"{egg_id}: region {x1-x0}x{y1-y0} spans beyond its cell — check sheet")

        crop = rgba[y0:y1, x0:x1].copy()
        crop[:, :, 3] = np.where(keep_mask[y0:y1, x0:x1], crop[:, :, 3], 0)

        ch, cw = crop.shape[:2]
        side = int(round(max(ch, cw) * (1 + 2 * PAD_FRAC)))
        canvas = np.zeros((side, side, 4), dtype=np.uint8)
        oy, ox = (side - ch) // 2, (side - cw) // 2
        canvas[oy:oy + ch, ox:ox + cw] = crop

        Image.fromarray(canvas, "RGBA").save(
            os.path.join(OUT, f"{egg_id}.webp"), "WEBP", quality=92, method=6
        )
    return warnings


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    all_warnings = []
    for name, ids in SHEETS.items():
        all_warnings += slice_sheet(name, ids)
    print(f"wrote {sum(len(v) for v in SHEETS.values())} eggs to {OUT}")
    for w in all_warnings:
        print("WARN", w)
    return 1 if all_warnings else 0


if __name__ == "__main__":
    sys.exit(main())
