#!/usr/bin/env python3
"""
Simple script to remove near-white background from a PNG and save a transparent version.
Usage:
  python scripts/remove_white_bg.py static/img/chatbot-avatar.png
This will create a backup of the original file with .bak and overwrite the input with a transparent-background PNG.
Requires: Pillow
Install: pip install pillow
"""
import sys
from PIL import Image


def remove_white_bg(path, out_path=None, threshold=240):
    img = Image.open(path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        if r >= threshold and g >= threshold and b >= threshold:
            # make transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append((r, g, b, a))

    img.putdata(newData)
    if out_path is None:
        # backup original
        bak = path + ".bak"
        import shutil
        shutil.copy2(path, bak)
        out_path = path
    img.save(out_path, "PNG")
    print(f"Saved transparent image to {out_path}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python scripts/remove_white_bg.py path/to/image.png [out.png]")
        sys.exit(1)
    path = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    remove_white_bg(path, out)
