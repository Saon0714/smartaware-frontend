"""Trace the logo's two ribbons into SVG paths for BrandRibbon.

    python3 scripts/trace-logo-ribbons.py [viewBoxHeight]   # prints JSON

Hand-drawing the mark produced a pair of pinstripes: its green ribbon is 44% of
the artwork's height at the thickest, and drawing by eye put it nearer 20%. So
the shapes are read off the artwork instead — for each column of pixels, where
the green ribbon begins and ends, and where the blue one does.

Run this and paste the two `d` values into
src/components/brand/BrandRibbon.tsx if SmartAWARE ever supplies new artwork.
Without it those coordinates are unreproducible magic numbers.

Standard library only, deliberately: this runs once in a blue moon and is not
worth a dependency. That is why there is a PNG decoder in here.
"""
import os
import struct
import sys
import zlib

SRC = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "brand", "logo-mark.png",
)

def decode_png(path):
    data = open(path, "rb").read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos, idat = 8, b""
    w = h = depth = ctype = None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, depth, ctype, comp, filt, inter = struct.unpack(">IIBBBBB", chunk)
            assert depth == 8 and inter == 0, (depth, inter)
        elif typ == b"IDAT":
            idat += chunk
        elif typ == b"IEND":
            break
        pos += 12 + ln
    raw = zlib.decompress(idat)
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    stride = w * channels
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 0xFF
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif f == 3:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                b = prev[i]
                c = prev[i - channels] if i >= channels else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, channels, out

w, h, ch, px = decode_png(SRC)
print(f"decoded {w}x{h}, {ch} channels", file=sys.stderr)

def pixel(x, y):
    i = (y * w + x) * ch
    if ch == 4:
        return px[i], px[i+1], px[i+2], px[i+3]
    return px[i], px[i+1], px[i+2], 255

# Classify: the mark is one green and one blue, on transparent/white.
GREEN, BLUE = "g", "b"
def classify(r, g, b, a):
    if a < 128: return None
    if r > 225 and g > 225 and b > 225: return None
    if g > r + 25 and g > b + 25: return GREEN
    if b > r + 25 and b > g + 10: return BLUE
    return None

cols = {GREEN: {}, BLUE: {}}
for x in range(w):
    for key in (GREEN, BLUE):
        ys = []
        for y in range(h):
            if classify(*pixel(x, y)) == key:
                ys.append(y)
        if ys:
            cols[key][x] = (min(ys), max(ys))

for key in (GREEN, BLUE):
    xs = sorted(cols[key])
    print(f"{key}: x {xs[0]}..{xs[-1]}  thickest="
          f"{max(hi-lo for lo,hi in cols[key].values())}", file=sys.stderr)

def smooth(pts):
    """A quadratic spline through the midpoints of the polyline.

    Each sampled point becomes a control point and the curve passes through the
    midpoints between them, which removes the faceting a raw polyline shows once
    the band is stretched, at a fraction of the points."""
    if len(pts) < 3:
        return " L".join(f"{x} {y}" for x, y in pts)
    out = [f"{pts[0][0]} {pts[0][1]}"]
    for i in range(1, len(pts) - 1):
        (cx, cy), (nx, ny) = pts[i], pts[i + 1]
        out.append(f"Q{cx} {cy} {round((cx + nx) / 2, 1)} {round((cy + ny) / 2, 1)}")
    out.append(f"Q{pts[-2][0]} {pts[-2][1]} {pts[-1][0]} {pts[-1][1]}")
    return " ".join(out)


def to_path(key, step=14, vw=1440.0, vh=200.0, pad=12.0):
    """The ribbon as an SVG path, resampled and normalised to a viewBox.

    `pad` keeps the shapes off the top and bottom of the viewBox. The source art
    is cropped tight to the ribbons, so without it the curves run along the
    section's own edge and read as clipped rather than as resting there."""
    xs = sorted(cols[key])
    sx, ex = xs[0], xs[-1]
    picks = [x for x in range(sx, ex + 1, step) if x in cols[key]]
    if picks[-1] != ex:
        picks.append(ex)
    fx = lambda x: round(x / (w - 1) * vw, 1)
    fy = lambda y: round(pad + y / (h - 1) * (vh - 2 * pad), 1)
    top = [(fx(x), fy(cols[key][x][0])) for x in picks]
    bot = [(fx(x), fy(cols[key][x][1])) for x in picks]
    return "M" + smooth(top + bot[::-1]) + " Z"


import json
out = {name: to_path(key, vh=float(sys.argv[1]) if len(sys.argv) > 1 else 200.0)
       for key, name in ((GREEN, "green"), (BLUE, "blue"))}
print(json.dumps(out))
