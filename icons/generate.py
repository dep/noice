"""Generate Noice extension icons at 16/32/48/128 px.

Design: rounded-square gradient tile with a chat bubble + sparkle,
evoking an LLM assistant that summarizes the page.
"""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

OUT = Path(__file__).parent
SIZES = [16, 32, 48, 128]

# Palette
BG_TOP = (124, 92, 255)      # violet
BG_BOT = (88, 166, 255)      # sky blue
BUBBLE = (255, 255, 255)
BUBBLE_SHADOW = (0, 0, 0, 40)
LINE = (124, 92, 255)
SPARKLE = (255, 225, 120)


def rounded_rect_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def vertical_gradient(size, top, bot):
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] * (1 - t) + bot[0] * t)
        g = int(top[1] * (1 - t) + bot[1] * t)
        b = int(top[2] * (1 - t) + bot[2] * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def draw_sparkle(draw, cx, cy, r, color):
    # 4-point star via two crossed diamonds
    draw.polygon(
        [(cx, cy - r), (cx + r * 0.35, cy), (cx, cy + r), (cx - r * 0.35, cy)],
        fill=color,
    )
    draw.polygon(
        [(cx - r, cy), (cx, cy - r * 0.35), (cx + r, cy), (cx, cy + r * 0.35)],
        fill=color,
    )


def make_icon(size):
    # Render at 4x for anti-aliasing, then downsample
    S = size * 4
    radius = int(S * 0.22)

    # Background tile
    bg = vertical_gradient(S, BG_TOP, BG_BOT).convert("RGBA")
    mask = rounded_rect_mask(S, radius)
    tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    tile.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(tile)

    # Chat bubble geometry
    pad = int(S * 0.18)
    bx0, by0 = pad, int(S * 0.22)
    bx1, by1 = S - pad, int(S * 0.70)
    br = int((by1 - by0) * 0.28)

    # Soft shadow under bubble
    shadow_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    off = int(S * 0.02)
    sd.rounded_rectangle(
        (bx0 + off, by0 + off * 2, bx1 + off, by1 + off * 2),
        radius=br,
        fill=(0, 0, 0, 70),
    )
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=S * 0.015))
    tile = Image.alpha_composite(tile, shadow_layer)
    draw = ImageDraw.Draw(tile)

    # Bubble body
    draw.rounded_rectangle((bx0, by0, bx1, by1), radius=br, fill=BUBBLE)

    # Bubble tail (lower-left)
    tail_top_x = bx0 + int(S * 0.12)
    tail_top_y = by1 - int(S * 0.02)
    tail_tip_x = bx0 + int(S * 0.06)
    tail_tip_y = by1 + int(S * 0.14)
    tail_right_x = bx0 + int(S * 0.22)
    tail_right_y = by1 - int(S * 0.02)
    draw.polygon(
        [(tail_top_x, tail_top_y), (tail_tip_x, tail_tip_y), (tail_right_x, tail_right_y)],
        fill=BUBBLE,
    )

    # Summary lines inside bubble (represents page summarization)
    line_h = max(2, int(S * 0.035))
    line_gap = int(S * 0.09)
    line_x0 = bx0 + int(S * 0.10)
    line_y = by0 + int(S * 0.11)
    widths = [0.68, 0.78, 0.50]
    for w in widths:
        line_x1 = line_x0 + int((bx1 - bx0) * w)
        draw.rounded_rectangle(
            (line_x0, line_y, line_x1, line_y + line_h),
            radius=line_h // 2,
            fill=LINE,
        )
        line_y += line_gap

    # Sparkle top-right (AI signifier)
    sx, sy = int(S * 0.80), int(S * 0.20)
    draw_sparkle(draw, sx, sy, int(S * 0.09), SPARKLE)
    # Tiny companion sparkle
    draw_sparkle(draw, int(S * 0.92), int(S * 0.34), int(S * 0.04), SPARKLE)

    # Downsample
    final = tile.resize((size, size), Image.LANCZOS)
    return final


def main():
    for s in SIZES:
        img = make_icon(s)
        path = OUT / f"icon-{s}.png"
        img.save(path)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
