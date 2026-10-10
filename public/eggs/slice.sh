#!/usr/bin/env bash
# Slice each 1536x1024 sheet into 6 512x512 cells, then trim transparent
# padding so every egg sits tight in its own file. Output goes to
# /public/eggs/single/<id>.webp.
#
# The id order follows lib/eggs.ts: for each sheet, (col,row) walks
# (0,0) (1,0) (2,0) (0,1) (1,1) (2,1).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p single

slice () {
  local sheet="$1"; shift
  local ids=("$@")
  local i=0
  for row in 0 1; do
    for col in 0 1 2; do
      local id="${ids[$i]}"
      local x=$(( col * 512 ))
      local y=$(( row * 512 ))
      # crop the cell, then fuzz-trim transparent edges, then pad 8px so
      # anti-aliased edges aren't sheared off
      convert "$sheet" \
        -crop 512x512+${x}+${y} +repage \
        -trim +repage \
        -bordercolor none -border 8x8 +repage \
        -strip -quality 92 \
        "single/${id}.webp"
      i=$(( i + 1 ))
    done
  done
}

slice aqua.webp       aqua-current aqua-nebula aqua-shard  aqua-droplet aqua-stripe aqua-loop
slice industrial.webp ind-neon     ind-copper  ind-cell    ind-coil     ind-orb     ind-strip
slice hex.webp        hex-fan      hex-chip    hex-vial    hex-rib      hex-dome    hex-vent
slice fantasy.webp    fan-leaf     fan-slime   fan-horn    fan-eye      fan-cloud   fan-crystal
slice stone.webp      stn-ember    stn-marble  stn-geode   stn-slate    stn-obsidian stn-sand
slice wood.webp       wd-bark      wd-birch    wd-redwood  wd-fern      wd-root     wd-maple
slice crystal.webp    cr-prism     cr-petal    cr-spiral   cr-rhombus   cr-onyx     cr-emerald
slice gold.webp       au-dune      au-fissure  au-guilloche au-fold     au-facet    au-craquelure

echo "sliced $(ls single/ | wc -l) eggs"
