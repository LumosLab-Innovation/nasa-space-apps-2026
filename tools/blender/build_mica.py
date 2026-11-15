# MICA: an older six-wheel rocker-bogie rover with a boxy body, two HORIZONTAL solar wings (the design
# flaw that killed it at the pole), one round camera eye on a mast, a small drill and a top hatch
# (spec v3 §4.2). Requires common.py's definitions in the same run (see run.md).
OUT = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/mica.glb'

begin_build('mica')
BODY = mat('Mica_Body', (0.64, 0.64, 0.63), 0.4, 0.7)   # Plan 7: faded, scuffed paint
CELLS = mat('Mica_Cells', (0.06, 0.09, 0.22), 0.4, 0.3)
EYE = mat('Mica_Eye', (0.02, 0.02, 0.025), 0.0, 0.15)
MESH = mat('Mica_Mesh', (0.5, 0.5, 0.52), 0.8, 0.6)
DUST = mat('Mica_Dust', (0.47, 0.44, 0.4), 0.0, 1.0)   # years of regolith
BURNT = mat('Mica_Burnt', (0.03, 0.03, 0.035), 0.0, 0.9)   # a dead cell (not Mica_Eye: that one glows when MICA wakes)

root = obj('mica_root')

# ---- boxy chassis with panel seams, scuffed corner guards, sample drawer and a bent whip antenna ----
c = P()
box(c, (1.0, 1.3, 0.42), at=(0, 0, 0.62), m=BODY)
for y in (-0.33, 0.0, 0.33):
    box(c, (1.004, 0.008, 0.4), at=(0, y, 0.62), m=MESH)
for sx in (-1, 1):
    for sy in (-1, 1):
        # one corner guard is dented (tilted) from an old fall
        dent = Matrix.Rotation(math.radians(9), 4, 'Y') if (sx, sy) == (1, -1) else None
        box(c, (0.06, 0.06, 0.44), at=(0.49 * sx, 0.64 * sy, 0.62), m=MESH, rot=dent)
# dust: a thick band low on the body and drifts on the top deck
box(c, (1.006, 1.306, 0.12), at=(0, 0, 0.47), m=DUST)
box(c, (0.42, 0.3, 0.012), at=(0.22, 0.2, 0.836), m=DUST)
box(c, (0.26, 0.4, 0.01), at=(-0.3, -0.35, 0.835), m=DUST)
box(c, (0.4, 0.04, 0.12), at=(0, -0.66, 0.55), m=MESH)
box(c, (0.32, 0.02, 0.06), at=(0, -0.68, 0.55), m=BODY)
rod(c, (-0.38, 0.5, 0.83), (-0.38, 0.5, 1.05), 0.008, m=MESH)
rod(c, (-0.38, 0.5, 1.05), (-0.3, 0.52, 1.2), 0.007, m=MESH)
bolts(c, [(x, -0.651, z) for x in (-0.42, 0.42) for z in (0.46, 0.78)], 'Y', MESH, radius=0.012, depth=0.01)
chassis = obj('chassis', c, root, bevel=0.012)

# ---- rocker-bogie suspension: rocker carries the front wheel and the bogie; bogie carries middle + rear ----
def wheel_part():
    w = P()
    cyl(w, 0.18, 0.14, axis='X', m=MESH, segs=24)
    for k in range(12):
        a = 2 * math.pi * k / 12
        box(w, (0.145, 0.02, 0.016), at=(0, 0.184 * math.cos(a), 0.184 * math.sin(a)), m=MESH,
            rot=Matrix.Rotation(a - math.pi / 2, 4, 'X'))
    cyl(w, 0.05, 0.16, axis='X', m=BODY, segs=12)
    cyl(w, 0.176, 0.06, axis='X', m=DUST, segs=24)
    return w

for side, sx, ids in (('L', 1, (1, 2, 3)), ('R', -1, (4, 5, 6))):
    rk = P()
    cyl(rk, 0.05, 0.08, axis='X', m=BODY, segs=12)
    rod(rk, (0, 0, 0), (0.1 * sx, -0.42, -0.22), 0.025, m=BODY)
    rod(rk, (0, 0, 0), (0.06 * sx, 0.3, -0.15), 0.025, m=BODY)
    rocker = obj('rocker_' + side, rk, chassis, at=(0.56 * sx, -0.05, 0.5))
    obj('wheel_%d' % ids[0], wheel_part(), rocker, at=(0.06 * sx, -0.45, -0.32))

    bg = P()
    cyl(bg, 0.04, 0.07, axis='X', m=BODY, segs=12)
    rod(bg, (0, 0, 0), (0.0, -0.28, -0.1), 0.02, m=BODY)
    rod(bg, (0, 0, 0), (0.0, 0.25, -0.1), 0.02, m=BODY)
    bogie = obj('bogie_' + side, bg, rocker, at=(0.06 * sx, 0.3, -0.2))
    obj('wheel_%d' % ids[1], wheel_part(), bogie, at=(0.0, -0.25, -0.12))
    obj('wheel_%d' % ids[2], wheel_part(), bogie, at=(0.0, 0.25, -0.12))

# ---- two flat, horizontal solar wings hinged at the top edges ----
def wing(sx):
    p = P()
    box(p, (0.95, 0.8, 0.03), at=(0.5 * sx, 0, 0), m=MESH)
    box(p, (0.9, 0.75, 0.006), at=(0.5 * sx, 0, 0.017), m=CELLS)
    for k in (-1, 0, 1):
        box(p, (0.9, 0.01, 0.004), at=(0.5 * sx, k * 0.19, 0.021), m=MESH)
    rod(p, (0.02 * sx, 0, -0.02), (0.3 * sx, 0, -0.02), 0.012, m=BODY)
    # dust drifts on the flat wing (why horizontal panels fail at the pole) and, on the right wing, a dead cell
    box(p, (0.3, 0.22, 0.008), at=(0.78 * sx, 0.25, 0.024), m=DUST)
    box(p, (0.22, 0.3, 0.008), at=(0.25 * sx, -0.22, 0.024), m=DUST)
    if sx < 0:
        box(p, (0.16, 0.14, 0.008), at=(0.55 * sx, 0.05, 0.023), m=BURNT)
    return p

obj('wing_L', wing(1), chassis, at=(0.5, 0.05, 0.86), bevel=0.003)
obj('wing_R', wing(-1), chassis, at=(-0.5, 0.05, 0.86), bevel=0.003)

# ---- mast with one round camera eye ----
m_ = P()
cyl(m_, 0.06, 0.05, at=(0, 0, 0.025), m=BODY, segs=16)
rod(m_, (0, 0, 0.04), (0, 0, 0.48), 0.03, m=MESH, segs=12)
mast = obj('mast', m_, chassis, at=(0, -0.45, 0.83))

e = P()
sphere(e, 0.11, m=BODY, segs=20, rings=12)
cyl(e, 0.075, 0.04, at=(0, -0.1, 0), axis='Y', m=MESH, segs=20)
cyl(e, 0.06, 0.02, at=(0, -0.125, 0), axis='Y', m=EYE, segs=20)
obj('eye', e, mast, at=(0, -0.02, 0.56))

# ---- drill on the front, angled down; hatch on the top deck, hinged at its rear edge ----
d = P()
cyl(d, 0.05, 0.12, at=(0, 0, 0), m=BODY, segs=12)
rod(d, (0, -0.02, -0.05), (0, -0.12, -0.3), 0.018, m=MESH)
obj('drill', d, chassis, at=(0.28, -0.7, 0.5))

hp = P()
box(hp, (0.56, 0.5, 0.02), at=(0, -0.25, 0.01), m=BODY)
box(hp, (0.08, 0.03, 0.025), at=(0, -0.48, 0.02), m=MESH)
obj('hatch', hp, chassis, at=(0, 0.55, 0.832))

for o in STATE['scene'].objects:
    if o.type == 'MESH':
        for poly in o.data.polygons:
            poly.use_smooth = True
        try:
            o.data.set_sharp_from_angle(angle=math.radians(35))
        except Exception:
            pass

h = assert_height(1.2, 1.6)
print('mica height %.3f m, tris %d' % (h, tris_count()))
export_glb(OUT)
print('exported', OUT)
