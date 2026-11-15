"""Bake original code-native opacity fields. No photographic/video pixels used."""
from PIL import Image
from pathlib import Path
import math
target=Path(__file__).resolve().parents[1]/'public/textures/exhaust'
target.mkdir(parents=True,exist_ok=True)
for kind in ['glow','wisp','dust','grain']:
    im=Image.new('RGBA',(300,300));pixels=[]
    for y in range(300):
        for x in range(300):
            u=(x-149.5)/149.5;v=(y-149.5)/149.5
            n=.70+.15*math.sin(8*u+4*v+1.4*math.sin(5*v))+.10*math.sin(16*v-9*u)+.05*math.cos(31*u+19*v)
            r=u*u+v*v
            if kind=='glow': a=max(0,1-r)**3
            elif kind=='wisp':a=max(0,1-r)**2*n*(.55+.45*math.sin(6*u+3*v+math.sin(8*v))**2)
            elif kind=='dust':a=max(0,1-r)**1.7*n
            else:a=max(0,1-(u/.25)**2-v*v)**3
            pixels.append((255,255,255,round(255*a)))
    im.putdata(pixels);im.save(target/(kind+'.webp'),lossless=True,method=6)
    print(kind,im.size,(target/(kind+'.webp')).stat().st_size)
