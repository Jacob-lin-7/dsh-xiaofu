"""从 idle 首帧派生一段 1 秒的“点击回应”动画（压缩 + 回弹 + 小星星）。"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 640, 360
GROUND_Y = 330
FRAMES = 24


def main() -> None:
    src_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    base = Image.open(src_path).convert("RGBA")
    bbox = base.getbbox()
    if bbox is None:
        raise SystemExit("source frame has no opaque pixels")
    sprite = base.crop(bbox)
    sw, sh = sprite.size
    cx = (bbox[0] + bbox[2]) / 2

    for index in range(FRAMES):
        t = index / FRAMES
        squash = 1 - 0.12 * math.sin(math.pi * t)
        stretch = 1 + 0.05 * math.sin(math.pi * t)
        width = max(1, int(sw * stretch))
        height = max(1, int(sh * squash))
        resized = sprite.resize((width, height), Image.LANCZOS)

        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        shadow_w = 140 * stretch
        draw.ellipse(
            (cx - shadow_w / 2, GROUND_Y - 4, cx + shadow_w / 2, GROUND_Y + 8),
            fill=(20, 40, 90, 50),
        )

        left = int(cx - width / 2)
        top = int(GROUND_Y - height)
        canvas.alpha_composite(resized, (left, top))

        # 小星星
        if 0.15 < t < 0.85:
            alpha = int(180 * (1 - abs(t - 0.5) * 2))
            for sign in (-1, 1):
                sx = cx + sign * (width / 2 + 14)
                sy = GROUND_Y - height * 0.75
                draw.ellipse((sx - 3, sy - 3, sx + 3, sy + 3), fill=(255, 230, 120, alpha))
                draw.ellipse((sx - 8, sy - 1, sx + 8, sy + 1), fill=(255, 230, 120, alpha // 2))

        canvas.save(out_dir / f"frame_{index:04d}.png")

    print(f"generated {FRAMES} click frames at {out_dir}")


if __name__ == "__main__":
    main()
