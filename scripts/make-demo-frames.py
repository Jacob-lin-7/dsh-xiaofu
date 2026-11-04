"""生成一个 640x360、透明背景的演示动画帧（呼吸 + 眨眼 + 地面阴影）。

用法：python scripts/make-demo-frames.py <out_dir>
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 640, 360
S = 4  # 超采样倍数
FRAMES = 72
FPS = 24

FONT_CANDIDATES = [
    Path(r"C:\Users\Lin\.dsh\profiles\desktop\node_modules\dsh-pet\assets\fonts\上首软糖体.ttf"),
]


def font(size: int):
    for path in FONT_CANDIDATES:
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                pass
    return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def draw_frame(index: int, out_dir: Path) -> None:
    phase = index / FRAMES * math.tau
    scale = 1 + 0.028 * math.sin(phase)
    bob = 3 * math.sin(phase + math.pi / 2)
    blink = 0.18 if 46 <= index <= 49 else 1.0

    canvas = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # 地面阴影
    shadow_w = 150 * scale
    shadow_alpha = int(55 - bob * 4)
    draw.ellipse(
        (
            (320 - shadow_w / 2) * S,
            (326 - 8) * S,
            (320 + shadow_w / 2) * S,
            (326 + 10) * S,
        ),
        fill=(20, 40, 90, max(20, shadow_alpha)),
    )

    body_w = 196 * scale
    body_h = 212 * scale
    cx, cy = 320, 330 - body_h / 2 + bob
    top = cy - body_h / 2
    bottom = cy + body_h / 2
    half_w = body_w / 2
    quarter_h = body_h / 4

    points = [
        (cx, top),
        (cx + half_w, top + quarter_h),
        (cx + half_w, bottom - quarter_h),
        (cx, bottom),
        (cx - half_w, bottom - quarter_h),
        (cx - half_w, top + quarter_h),
    ]
    # 用超采样坐标绘制
    hi_points = [(x * S, y * S) for x, y in points]

    mask = Image.new("L", (W * S, H * S), 0)
    ImageDraw.Draw(mask).polygon(hi_points, fill=255)

    grad = Image.new("RGBA", (W * S, H * S))
    gdraw = ImageDraw.Draw(grad)
    top_color = (125, 205, 255, 255)
    bottom_color = (64, 120, 235, 255)
    for y in range(H * S):
        t = y / (H * S)
        gdraw.line([(0, y), (W * S, y)], fill=lerp(top_color, bottom_color, t))

    body = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    body.paste(grad, (0, 0), mask)

    # 高光与描边
    bdraw = ImageDraw.Draw(body)
    highlight = Image.new("RGBA", body.size, (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse(
        (
            (cx - body_w * 0.34) * S,
            (top + body_h * 0.10) * S,
            (cx + body_w * 0.10) * S,
            (top + body_h * 0.42) * S,
        ),
        fill=(255, 255, 255, 55),
    )
    body = Image.alpha_composite(body, Image.composite(highlight, Image.new("RGBA", body.size, (0, 0, 0, 0)), mask))
    bdraw = ImageDraw.Draw(body)
    bdraw.line(hi_points + [hi_points[0]], fill=(45, 95, 185, 255), width=5 * S, joint="curve")

    canvas = Image.alpha_composite(canvas, body)

    # 脸
    fdraw = ImageDraw.Draw(canvas)
    eye_y = cy - body_h * 0.08
    eye_dx = body_w * 0.15
    eye_w = 26 * scale
    eye_h = 30 * scale * blink
    for sign in (-1, 1):
        ex = cx + sign * eye_dx
        fdraw.ellipse(
            ((ex - eye_w / 2) * S, (eye_y - eye_h / 2) * S, (ex + eye_w / 2) * S, (eye_y + eye_h / 2) * S),
            fill=(255, 255, 255, 240),
        )
        pupil_r = 8 * scale
        fdraw.ellipse(
            (
                (ex - pupil_r / 2) * S,
                (eye_y - pupil_r / 2 + 2) * S,
                (ex + pupil_r / 2) * S,
                (eye_y + pupil_r / 2 + 2) * S,
            ),
            fill=(28, 48, 90, 255),
        )
        fdraw.ellipse(
            ((ex - 3) * S, (eye_y - 4) * S, (ex + 1) * S, (eye_y) * S),
            fill=(255, 255, 255, 230),
        )

    # 腮红
    for sign in (-1, 1):
        cheek_x = cx + sign * body_w * 0.28
        fdraw.ellipse(
            (
                (cheek_x - 14) * S,
                (eye_y + 18) * S,
                (cheek_x + 14) * S,
                (eye_y + 32) * S,
            ),
            fill=(255, 150, 180, 85),
        )

    # 嘴
    fdraw.arc(
        ((cx - 14) * S, (eye_y + 24) * S, (cx + 14) * S, (eye_y + 40) * S),
        start=20,
        end=160,
        fill=(40, 70, 130, 230),
        width=3 * S,
    )

    # 额头的 HEX 标记
    try:
        f = font(int(30 * scale * S))
        fdraw.text((cx * S, (cy - body_h * 0.28) * S), "HEX", font=f, fill=(255, 255, 255, 210), anchor="mm")
    except Exception:
        pass

    canvas = canvas.resize((W, H), Image.LANCZOS)
    canvas.save(out_dir / f"frame_{index:04d}.png")


def main() -> None:
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".tmp-demo/frames")
    out_dir.mkdir(parents=True, exist_ok=True)
    for index in range(FRAMES):
        draw_frame(index, out_dir)
    print(f"generated {FRAMES} frames at {out_dir}")


if __name__ == "__main__":
    main()
