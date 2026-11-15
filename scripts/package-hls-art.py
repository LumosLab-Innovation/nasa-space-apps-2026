"""Package actual WebGL captures; preserve the approved Moon/Earth background."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
screens = root / 'docs/screens'
black = np.asarray(Image.open(screens / 'hls-loading-ship-layer.png').convert('RGB'), dtype=np.float32)
white = np.asarray(Image.open(screens / 'hls-loading-ship-white.png').convert('RGB'), dtype=np.float32)
# Recover antialiased coverage from the same render over two clear colours.
alpha = np.clip(1 - np.mean(white - black, axis=2) / 255, 0, 1)
rgb = np.clip(black / np.maximum(alpha[..., None], 1 / 255), 0, 255)
rgba = np.concatenate([rgb, alpha[..., None] * 255], axis=2).round().astype(np.uint8)
layer = Image.fromarray(rgba)
crop = json.loads((screens / 'hls-art-crop.json').read_text())
x, y, w, h = (crop[k] for k in ['left', 'top', 'width', 'height'])
layer.crop((x, y, x + w, y + h)).save(root / 'src/assets/loading-ship.png', optimize=True)
background = Image.open(root / 'src/assets/loading-moon.webp').convert('RGBA')
background.alpha_composite(layer)
background.convert('RGB').save(root / 'src/assets/menu-orbit.webp', quality=90, method=6)
print(crop)
