"""Derive web-ready logo assets from SmartAWARE's supplied artwork.

The source is a JPEG on an opaque white background. Two problems for web use:
the white rectangle shows against any non-white surface, and the artwork
carries heavy whitespace padding that wastes layout space.

Background removal is a flood fill inward from the borders, NOT a global
"white becomes transparent". The word AWARE is drawn as outlined letters with
white fill; removing white globally would punch holes through them and change
the logo. Filling only from the outside leaves those interior whites intact.
"""

import sys
from PIL import Image, ImageDraw

SRC = sys.argv[1]
OUT = sys.argv[2]

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"source: {w}x{h}")

# Flood fill from every border pixel. Tolerance absorbs JPEG compression
# artefacts, which leave the "white" background slightly off-white.
fill = (255, 255, 255, 0)
seen = set()
for x in range(0, w, 4):
    for y in (0, h - 1):
        if img.getpixel((x, y))[:3] > (230, 230, 230):
            ImageDraw.floodfill(img, (x, y), fill, thresh=45)
for y in range(0, h, 4):
    for x in (0, w - 1):
        if img.getpixel((x, y))[:3] > (230, 230, 230):
            ImageDraw.floodfill(img, (x, y), fill, thresh=45)

bbox = img.getbbox()
img = img.crop(bbox)
w, h = img.size
print(f"cropped to content: {w}x{h}  (aspect {w / h:.2f}:1)")

# Identify horizontal bands separated by fully transparent rows. The artwork
# stacks three: the wave mark, the SmartAWARE wordmark, and the tagline.
alpha = img.getchannel("A")
rows = [any(alpha.crop((0, y, w, y + 1)).getdata()) for y in range(h)]

bands, start = [], None
for y, filled in enumerate(rows):
    if filled and start is None:
        start = y
    elif not filled and start is not None:
        bands.append((start, y))
        start = None
if start is not None:
    bands.append((start, h))

# Ignore hairline artefacts.
bands = [b for b in bands if b[1] - b[0] > h * 0.02]
print(f"bands detected: {len(bands)} -> {bands}")


def save(image: Image.Image, name: str, label: str) -> None:
    path = f"{OUT}/{name}"
    image.save(path, "PNG", optimize=True)
    print(f"  {name:24} {image.size[0]}x{image.size[1]}  {label}")


PAD = 12  # breathing room so the artwork never touches the edge

full = img.crop((0, max(0, bands[0][0] - PAD), w, min(h, bands[-1][1] + PAD)))
save(full, "logo-full.png", "complete lockup incl. tagline")

if len(bands) >= 3:
    # Wave + wordmark, without the tagline: legible in a 64px header where the
    # full lockup would render the tagline too small to read.
    wordmark = img.crop((0, max(0, bands[0][0] - PAD), w, min(h, bands[-2][1] + PAD)))
    save(wordmark, "logo-wordmark.png", "wave + wordmark, no tagline")

# The wave mark alone, for favicons and tight spaces.
mark_band = bands[0]
mark = img.crop((0, mark_band[0], w, mark_band[1]))
mark = mark.crop(mark.getbbox())
save(mark, "logo-mark.png", "wave mark only")

# Square icon: the mark centred on a transparent canvas.
side = max(mark.size)
icon = Image.new("RGBA", (side, side), (255, 255, 255, 0))
icon.paste(mark, ((side - mark.size[0]) // 2, (side - mark.size[1]) // 2), mark)
icon = icon.resize((512, 512), Image.LANCZOS)
save(icon, "icon-512.png", "square app icon")
icon.resize((32, 32), Image.LANCZOS).save(
    f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)
print("  favicon.ico              multi-size")
