# Pip: four-wheel VIPER-style lunar rover with vertical solar panels, mast head with face screen,
# folded 6-joint arm and rear winch (spec v3 §4.1). Requires common.py's definitions in the same run
# (Blender MCP safe mode forbids exec/import of local files, so run.md pastes common.py + this file).
OUT = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/pip.glb'

begin_build('pip')
WHITE = mat('Pip_White', (0.86, 0.86, 0.84), 0.0, 0.45)
MLI = mat('Pip_MLI', (1.0, 0.71, 0.29), 1.0, 0.33)
ALU = mat('Pip_Alu', (0.72, 0.72, 0.74), 1.0, 0.38)
CELLS = mat('Pip_Cells', (0.03, 0.05, 0.16), 0.35, 0.18)
RUBBER = mat('Pip_Rubber', (0.07, 0.07, 0.075), 0.2, 0.85)
FACE = mat('PipFace', (0.02, 0.03, 0.04), 0.0, 0.2)
LAMP = mat('Pip_Lamp', (1.0, 0.97, 0.9), 0.0, 0.3, emission=(1.0, 0.95, 0.85), strength=4.0)
DUST = mat('Pip_Dust', (0.46, 0.43, 0.39), 0.0, 1.0)   # Plan 7: regolith smudges low on the body

root = obj('pip_root')

# ---- chassis: gold MLI-wrapped box, white radiator deck, bumpers, hazcams, bolts, cable runs ----
c = P()
box(c, (0.9, 1.3, 0.3), at=(0, 0, 0.48), m=MLI)
box(c, (0.86, 1.26, 0.025), at=(0, 0, 0.642), m=WHITE)
box(c, (0.8, 1.2, 0.04), at=(0, 0, 0.315), m=ALU)
for sy in (-1, 1):
    box(c, (0.62, 0.05, 0.07), at=(0, 0.67 * sy, 0.42), m=ALU)
    for sx in (-1, 1):
        cyl(c, 0.022, 0.05, at=(0.16 * sx, 0.7 * sy, 0.42), axis='Y', m=RUBBER, segs=12)
        box(c, (0.09, 0.14, 0.12), at=(0.43 * sx, 0.5 * sy, 0.45), m=ALU)
bolts(c, [(x, y, 0.656) for x in (-0.4, 0.4) for y in (-0.6, -0.2, 0.2, 0.6)], 'Z', ALU)
bolts(c, [(0.452, y, z) for y in (-0.55, 0.55) for z in (0.36, 0.6)] + [(-0.452, y, z) for y in (-0.55, 0.55) for z in (0.36, 0.6)], 'X', ALU)
rod(c, (-0.28, -0.42, 0.665), (-0.05, 0.25, 0.665), 0.011, m=RUBBER)
rod(c, (-0.05, 0.25, 0.665), (0.25, 0.45, 0.665), 0.011, m=RUBBER)
rod(c, (0.3, 0.55, 0.66), (0.3, 0.55, 1.02), 0.006, m=ALU)
cyl(c, 0.03, 0.01, at=(0.3, 0.55, 1.025), m=WHITE, segs=12)
box(c, (0.004, 0.22, 0.09), at=(0.452, -0.2, 0.5), m=WHITE)
box(c, (0.004, 0.22, 0.09), at=(-0.452, -0.2, 0.5), m=WHITE)
# Plan 7: a band of regolith along the lower edge, a cable loop from the mast to the back panel
box(c, (0.906, 1.306, 0.05), at=(0, 0, 0.355), m=DUST)
rod(c, (0.06, -0.38, 0.665), (0.12, 0.2, 0.668), 0.009, m=RUBBER)
rod(c, (0.12, 0.2, 0.668), (0.05, 0.62, 0.7), 0.009, m=RUBBER)
chassis = obj('chassis', c, root, bevel=0.012)

# ---- legs, steering forks and wheels (independent steering at every corner) ----
for name, sx, sy in (('FL', 1, -1), ('FR', -1, -1), ('RL', 1, 1), ('RR', -1, 1)):
    lg = P()
    cyl(lg, 0.04, 0.12, axis='Y', m=ALU, segs=12)
    rod(lg, (0, 0, 0.02), (0.2 * sx, 0.05 * sy, 0.03), 0.022, m=ALU)
    rod(lg, (0, 0, -0.03), (0.2 * sx, 0.05 * sy, -0.01), 0.018, m=ALU)
    rod(lg, (0.02 * sx, 0, 0.0), (0.18 * sx, 0.04 * sy, 0.02), 0.006, m=RUBBER)
    leg = obj('leg_' + name, lg, chassis, at=(0.43 * sx, 0.5 * sy, 0.45), bevel=0.0)

    st = P()
    cyl(st, 0.05, 0.08, at=(0, 0, 0.0), m=WHITE, segs=16)
    rod(st, (0, 0, -0.03), (-0.1 * sx, 0, -0.07), 0.018, m=ALU)
    rod(st, (-0.1 * sx, 0, -0.07), (-0.1 * sx, 0, -0.26), 0.018, m=ALU)
    cyl(st, 0.05, 0.04, at=(-0.095 * sx, 0, -0.26), axis='X', m=ALU, segs=16)
    steer = obj('steer_' + name, st, leg, at=(0.2 * sx, 0.05 * sy, 0.01))

    wh = P()
    cyl(wh, 0.19, 0.15, axis='X', m=RUBBER, segs=32)
    for i in range(20):
        a = 2 * math.pi * i / 20
        for sg in (1, -1):
            # V-chevron tread lugs (Plan 7), like the VIPER/Curiosity wheels
            box(wh, (0.075, 0.022, 0.02), at=(0.036 * sg, 0.198 * math.cos(a), 0.198 * math.sin(a)), m=RUBBER,
                rot=Matrix.Rotation(a - math.pi / 2, 4, 'X') @ Matrix.Rotation(math.radians(22 * sg), 4, 'Z'))
    cyl(wh, 0.18, 0.004, at=(0.076 * sx, 0, 0), axis='X', m=DUST, segs=32)
    cyl(wh, 0.07, 0.02, at=(0.08 * sx, 0, 0), axis='X', m=ALU, segs=16)
    bolts(wh, [(0.09 * sx, 0.045 * math.cos(k * math.pi / 3), 0.045 * math.sin(k * math.pi / 3)) for k in range(6)], 'X', ALU, radius=0.008, depth=0.01)
    obj('wheel_' + name, wh, steer, at=(0, 0, -0.26))

# ---- vertical solar panels (the VIPER lesson: the polar Sun skims the horizon) ----
def solar(w_y, h, outward):
    p = P()
    sgn = 1 if outward in ('+X', '+Y') else -1
    if outward in ('+X', '-X'):
        box(p, (0.025, w_y, h), at=(0, 0, h / 2), m=ALU)
        box(p, (0.006, w_y - 0.05, h - 0.05), at=(0.014 * sgn, 0, h / 2), m=CELLS)
        for k in (-1, 0, 1):
            box(p, (0.004, 0.012, h - 0.05), at=(0.018 * sgn, k * w_y / 4, h / 2), m=ALU)
        for k in range(1, 6):
            box(p, (0.004, w_y - 0.05, 0.006), at=(0.018 * sgn, 0, 0.025 + k * (h - 0.05) / 6), m=ALU)  # cell grid
    else:
        box(p, (w_y, 0.025, h), at=(0, 0, h / 2), m=ALU)
        box(p, (w_y - 0.05, 0.006, h - 0.05), at=(0, 0.014 * sgn, h / 2), m=CELLS)
        for k in (-1, 0, 1):
            box(p, (0.012, 0.004, h - 0.05), at=(k * w_y / 4, 0.018 * sgn, h / 2), m=ALU)
        for k in range(1, 6):
            box(p, (w_y - 0.05, 0.004, 0.006), at=(0, 0.018 * sgn, 0.025 + k * (h - 0.05) / 6), m=ALU)  # cell grid
    return p

obj('panel_L', solar(0.9, 0.52, '+X'), chassis, at=(0.44, 0.12, 0.655), bevel=0.003)
obj('panel_R', solar(0.9, 0.52, '-X'), chassis, at=(-0.44, 0.12, 0.655), bevel=0.003)
obj('panel_B', solar(0.8, 0.5, '+Y'), chassis, at=(0, 0.66, 0.655), bevel=0.003)

# ---- mast and head: face screen, stereo cameras, LED lamps, spinning LIDAR ----
mp = P()
cyl(mp, 0.08, 0.06, at=(0, 0, 0.03), m=WHITE, segs=20)
rod(mp, (0, 0, 0.05), (0, 0, 0.5), 0.033, m=ALU, segs=12)
rod(mp, (0.045, 0.0, 0.06), (0.045, 0.0, 0.46), 0.008, m=RUBBER)
box(mp, (0.09, 0.09, 0.03), at=(0, 0, 0.27), m=WHITE)
mast = obj('mast_pan', mp, chassis, at=(0, -0.4, 0.655), bevel=0.0)

hd = P()
box(hd, (0.52, 0.2, 0.24), at=(0, -0.01, 0.1), m=WHITE)
box(hd, (0.44, 0.012, 0.25), at=(0, -0.112, 0.1), m=ALU)
box(hd, (0.54, 0.16, 0.025), at=(0, 0.0, -0.025), m=MLI)
cyl(hd, 0.04, 0.12, at=(0, 0, -0.015), axis='X', m=ALU, segs=12)
bolts(hd, [(x, -0.119, z) for x in (-0.21, 0.21) for z in (-0.01, 0.21)], 'Y', ALU, radius=0.007, depth=0.006)
head = obj('head_tilt', hd, mast, at=(0, 0, 0.5), bevel=0.01)

# Big 40 x 20 cm face screen (user decision: chibi face must read from the third-person camera)
fs = P()
plane(fs, 0.40, 0.20, m=FACE)
obj('face_screen', fs, head, at=(0, -0.12, 0.1))

for side, sx in (('L', 1), ('R', -1)):
    cm = P()
    box(cm, (0.07, 0.07, 0.06), at=(0, 0.01, 0), m=WHITE)
    cyl(cm, 0.022, 0.03, at=(0, -0.035, 0), axis='Y', m=RUBBER, segs=12)
    obj('cam_' + side, cm, head, at=(0.14 * sx, -0.06, 0.25))
    lp = P()
    box(lp, (0.05, 0.07, 0.09), at=(0, 0, 0), m=ALU)
    cyl(lp, 0.02, 0.01, at=(0, -0.037, 0.015), axis='Y', m=LAMP, segs=12)
    cyl(lp, 0.02, 0.01, at=(0, -0.037, -0.02), axis='Y', m=LAMP, segs=12)
    obj('lamp_' + side, lp, head, at=(0.29 * sx, -0.04, 0.1))

ld = P()
cyl(ld, 0.03, 0.03, at=(0, 0, 0.015), m=ALU, segs=12)
cyl(ld, 0.05, 0.06, at=(0, 0, 0.06), m=RUBBER, segs=20)
cyl(ld, 0.052, 0.012, at=(0, 0, 0.06), m=CELLS, segs=20)
obj('lidar', ld, head, at=(0, 0.03, 0.22))

# ---- six-joint arm, folded flat at the front-right corner (rest pose = stowed) ----
ab = P()
cyl(ab, 0.065, 0.08, at=(0, 0, 0.04), m=WHITE, segs=20)
bolts(ab, [(0.05 * math.cos(k * math.pi / 3), 0.05 * math.sin(k * math.pi / 3), 0.082) for k in range(6)], 'Z', ALU, radius=0.006, depth=0.006)
arm_base = obj('arm_base', ab, chassis, at=(-0.27, -0.52, 0.655))

sh = P()
cyl(sh, 0.045, 0.1, axis='X', m=WHITE, segs=16)
rod(sh, (0, 0, 0), (0, -0.4, 0), 0.028, m=ALU, segs=12)
rod(sh, (0.03, -0.02, 0.02), (0.03, -0.38, 0.02), 0.006, m=RUBBER)
shoulder = obj('arm_shoulder', sh, arm_base, at=(0, 0, 0.11))

el = P()
cyl(el, 0.04, 0.09, axis='X', m=WHITE, segs=16)
rod(el, (0, 0, 0), (0, 0.34, 0), 0.024, m=ALU, segs=12)
elbow = obj('arm_elbow', el, shoulder, at=(-0.06, -0.4, 0.0))

wp = P()
cyl(wp, 0.032, 0.07, axis='X', m=WHITE, segs=12)
wrist = obj('arm_wrist_pitch', wp, elbow, at=(0, 0.34, 0))

wr = P()
cyl(wr, 0.03, 0.05, at=(0, 0.025, 0), axis='Y', m=ALU, segs=12)
box(wr, (0.08, 0.025, 0.05), at=(0, 0.055, 0), m=WHITE)
cyl(wr, 0.012, 0.02, at=(0, 0.06, 0.035), axis='Y', m=RUBBER, segs=8)
roll = obj('arm_wrist_roll', wr, wrist, at=(0, 0.03, 0))

for side, sx in (('L', 1), ('R', -1)):
    g = P()
    box(g, (0.014, 0.08, 0.026), at=(0, 0.04, 0), m=ALU)
    box(g, (0.018, 0.02, 0.03), at=(-0.004 * sx, 0.075, 0), m=RUBBER)
    obj('grip_' + side, g, roll, at=(0.026 * sx, 0.065, 0))

# ---- rear winch with tether hook ----
w = P()
cyl(w, 0.05, 0.14, axis='X', m=ALU, segs=16)
cyl(w, 0.042, 0.13, axis='X', m=RUBBER, segs=16)
box(w, (0.012, 0.08, 0.12), at=(0.075, -0.02, 0), m=WHITE)
box(w, (0.012, 0.08, 0.12), at=(-0.075, -0.02, 0), m=WHITE)
cyl(w, 0.015, 0.04, at=(0, 0.06, -0.03), axis='Y', m=ALU, segs=8)
obj('winch', w, chassis, at=(0, 0.69, 0.42))

# Plan 7: smooth shading everywhere, crisp creases kept above 35 degrees
for o in STATE['scene'].objects:
    if o.type == 'MESH':
        for poly in o.data.polygons:
            poly.use_smooth = True
        try:
            o.data.set_sharp_from_angle(angle=math.radians(35))
        except Exception:
            pass

h = assert_height(1.2, 1.5)
print('pip height %.3f m, tris %d' % (h, tris_count()))
export_glb(OUT)
print('exported', OUT)
