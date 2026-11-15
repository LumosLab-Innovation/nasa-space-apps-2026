# Artemis astronaut in the Axiom AxEMU suit, flight configuration (all white, heat-reflecting cover; the
# dark-grey cover shown at the 2023 reveal was a display cover only). References: NASA "Spacesuit for NASA's
# Artemis III Moon Surface Mission Debuts" and images.nasa.gov AxEMU mock-up photos (public/models/SOURCES.md).
# Features modelled: hard upper torso with rear-entry hatch and PLSS, chest display/control module, metal
# bearings at shoulders/upper arms/waist/hips/wrists, convolute bellows at elbows and knees, bubble helmet
# with gold sun visor, light bar and HD camera, five-finger gloves, treaded boots, red ID stripes and patches.
# Rigid segments on a pivot hierarchy (Plan 7 ruling): code swings the pivots; joints are covered by
# bearings/bellows like a real suit. Requires common.py in the same run (run.md).
OUT = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/astronaut.glb'

begin_build('astronaut')
WHITE = mat('Suit_White', (0.9, 0.89, 0.86), 0.0, 0.82)
LEGS = mat('Suit_Legs', (0.86, 0.85, 0.82), 0.0, 0.86)
BOOTS = mat('Suit_Boots', (0.42, 0.42, 0.43), 0.0, 0.9)
STRIPE = mat('Suit_Stripe', (0.74, 0.1, 0.09), 0.0, 0.6)
GOLD = mat('Visor_Gold', (1.0, 0.7, 0.28), 1.0, 0.08)
PLSS = mat('PLSS', (0.88, 0.88, 0.86), 0.05, 0.55)
JOINT = mat('Suit_Joint', (0.62, 0.63, 0.66), 0.9, 0.3)
LAMP = mat('Suit_Lamp', (1.0, 0.97, 0.9), 0.0, 0.3, emission=(1.0, 0.95, 0.85), strength=5.0)
DARK = mat('Suit_Dark', (0.06, 0.06, 0.07), 0.2, 0.5)
SCREEN = mat('Suit_Screen', (0.1, 0.25, 0.35), 0.0, 0.2, emission=(0.25, 0.75, 1.0), strength=1.5)
BLUE = mat('Suit_Blue', (0.08, 0.16, 0.45), 0.0, 0.6)
GLASS = mat('Helmet_Glass', (0.75, 0.8, 0.85), 0.0, 0.05)
gb = next(n for n in GLASS.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
gb.inputs['Alpha'].default_value = 0.22
try:
    GLASS.surface_render_method = 'BLENDED'
except Exception:
    pass

SEG = 28

def tube(p, a, b, r1, r2, m, segs=SEG):
    """Tapered tube from a to b (soft-goods limb sections)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    r = bmesh.ops.create_cone(p['bm'], cap_ends=True, cap_tris=False, segments=segs, radius1=r1, radius2=r2, depth=d.length)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return _finish(p, r['verts'], m, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())

def bellows(p, a, b, r, n, m):
    """Convolute joint: alternating fat and thin rings between a and b."""
    a, b = Vector(a), Vector(b)
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        tube(p, a.lerp(b, t0), a.lerp(b, (t0 + t1) / 2), r, r * 1.09, m, SEG)
        tube(p, a.lerp(b, (t0 + t1) / 2), a.lerp(b, t1), r * 1.09, r, m, SEG)

def smooth(o, angle=40):
    """Smooth shading with sharp creases above `angle` (bevel edges stay crisp)."""
    if o.type != 'MESH':
        return o
    for poly in o.data.polygons:
        poly.use_smooth = True
    try:
        o.data.set_sharp_from_angle(angle=math.radians(angle))
    except Exception:
        pass
    return o

root = obj('astro_root')

# ---- pelvis, waist bearing, spine pivot, hard upper torso ----
pv = P()
box(pv, (0.36, 0.26, 0.18), m=WHITE)
cyl(pv, 0.175, 0.05, at=(0, 0, 0.11), m=JOINT, segs=SEG)        # waist bearing
cyl(pv, 0.165, 0.02, at=(0, 0, 0.14), m=DARK, segs=SEG)
box(pv, (0.3, 0.012, 0.05), at=(0, -0.135, -0.02), m=BLUE)       # brief stripe
pelvis = smooth(obj('pelvis', pv, root, at=(0, 0, 0.98), bevel=0.04))

spine = obj('spine', None, pelvis, at=(0, 0, 0.1))

ts = P()
sphere(ts, 0.25, at=(0, 0, 0.27), m=WHITE, segs=SEG, rings=18, scale=(1.0, 0.74, 1.05))   # rounded hard upper torso
tube(ts, (0, 0, 0.0), (0, 0, 0.16), 0.17, 0.2, WHITE)                                      # lower torso to the waist
for sx in (1, -1):
    sphere(ts, 0.1, at=(0.225 * sx, 0, 0.42), m=WHITE, segs=SEG, rings=12)                 # shoulder yokes
cyl(ts, 0.135, 0.05, at=(0, 0, 0.5), m=JOINT, segs=SEG)                    # neck ring
cyl(ts, 0.142, 0.015, at=(0, 0, 0.475), m=DARK, segs=SEG)
# chest display and control module (DCM)
box(ts, (0.24, 0.07, 0.13), at=(0, -0.2, 0.22), m=PLSS)
box(ts, (0.1, 0.012, 0.06), at=(0.04, -0.238, 0.235), m=SCREEN)
for i, x in enumerate((-0.08, -0.05, -0.02)):
    cyl(ts, 0.012, 0.012, at=(x, -0.239, 0.205 + 0.02 * (i % 2)), axis='Y', m=STRIPE if i == 0 else DARK, segs=10)
rod(ts, (-0.1, -0.2, 0.17), (-0.18, -0.12, 0.05), 0.014, m=DARK)          # umbilical hoses to the PLSS
rod(ts, (0.1, -0.2, 0.17), (0.18, -0.12, 0.05), 0.014, m=DARK)
# patches: flag (left shoulder) and mission patch (right chest)
box(ts, (0.012, 0.09, 0.055), at=(0.235, -0.04, 0.38), m=BLUE)
box(ts, (0.013, 0.05, 0.03), at=(0.236, -0.06, 0.39), m=STRIPE)
cyl(ts, 0.032, 0.01, at=(-0.13, -0.17, 0.36), axis='Y', m=BLUE, segs=16)
torso = smooth(obj('torso', ts, spine, at=(0, 0, 0), bevel=0.05))

# PLSS backpack with rear-entry hatch outline, vents and handles
pk = P()
box(pk, (0.5, 0.26, 0.64), m=PLSS)
box(pk, (0.44, 0.02, 0.56), at=(0, 0.135, 0), m=WHITE)          # hatch door
for z in (-0.2, 0.0, 0.2):
    box(pk, (0.3, 0.012, 0.02), at=(0, 0.147, z), m=DARK)        # hatch seams / vents
cyl(pk, 0.035, 0.2, at=(-0.18, 0.02, 0.35), m=JOINT, segs=12)    # antenna stub
rod(pk, (0.2, 0.14, 0.25), (0.2, 0.14, -0.25), 0.015, m=JOINT)   # grab handle
box(pk, (0.12, 0.05, 0.08), at=(0.15, 0.1, -0.33), m=DARK)       # scrubber housing
plss = smooth(obj('plss', pk, torso, at=(0, 0.27, 0.26), bevel=0.06))

# ---- neck pivot, helmet (bubble + gold visor + light bar + HD camera) ----
neck = obj('neck', None, torso, at=(0, 0, 0.52))
hm_ = P()
sphere(hm_, 0.178, at=(0, 0, 0.14), m=WHITE, segs=SEG, rings=18, scale=(1, 1.03, 1))
r = bmesh.ops.create_uvsphere(hm_['bm'], u_segments=SEG, v_segments=18, radius=0.186)
bmesh.ops.delete(hm_['bm'], geom=[v for v in r['verts'] if v.co.y > -0.02 or v.co.z < -0.07], context='VERTS')
_finish(hm_, [v for v in r['verts'] if v.is_valid], GLASS, Matrix.Translation((0, 0, 0.14)))  # clear bubble, front half
box(hm_, (0.22, 0.05, 0.03), at=(0, -0.02, 0.298), m=PLSS)               # light bar
box(hm_, (0.04, 0.05, 0.03), at=(0.11, -0.03, 0.265), m=DARK)            # HD camera
cyl(hm_, 0.012, 0.01, at=(0.11, -0.056, 0.265), axis='Y', m=SCREEN, segs=10)
helmet = smooth(obj('helmet', hm_, neck, at=(0, 0, 0)))

vz = P()
r = bmesh.ops.create_uvsphere(vz['bm'], u_segments=SEG, v_segments=18, radius=0.192)
bmesh.ops.delete(vz['bm'], geom=[v for v in r['verts'] if v.co.y > -0.04 or v.co.z < -0.06 or v.co.z > 0.13], context='VERTS')
_finish(vz, list(vz['bm'].verts), GOLD, Matrix.Identity(4))
smooth(obj('visor', vz, helmet, at=(0, 0, 0.14)))

for side, sx in (('L', 1), ('R', -1)):
    lp = P()
    box(lp, (0.045, 0.07, 0.045), m=PLSS)
    cyl(lp, 0.018, 0.012, at=(0, -0.038, 0), axis='Y', m=LAMP, segs=12)
    obj('lamp_' + side, lp, helmet, at=(0.175 * sx, -0.02, 0.2), bevel=0.008)

# ---- arms: shoulder bearing, upper arm with bearing + stripe, elbow bellows, forearm, wrist, glove ----
for side, sx in (('L', 1), ('R', -1)):
    ua = P()
    cyl(ua, 0.098, 0.06, at=(0.0, 0, 0.0), axis='X', m=JOINT, segs=SEG)                 # shoulder bearing
    tube(ua, (0.015 * sx, 0, -0.03), (0.02 * sx, 0, -0.2), 0.092, 0.08, WHITE)
    cyl(ua, 0.09, 0.03, at=(0.018 * sx, 0, -0.1), m=JOINT, segs=SEG)                  # upper-arm bearing
    cyl(ua, 0.086, 0.05, at=(0.019 * sx, 0, -0.16), m=STRIPE, segs=SEG)
    bellows(ua, (0.02 * sx, 0, -0.2), (0.02 * sx, 0, -0.3), 0.076, 3, WHITE)
    upper = smooth(obj('upperArm_' + side, ua, torso, at=(0.27 * sx, 0, 0.42)))

    fa = P()
    tube(fa, (0, 0, 0), (0, -0.02, -0.22), 0.074, 0.062, WHITE)
    cyl(fa, 0.066, 0.035, at=(0, -0.02, -0.235), m=JOINT, segs=SEG)                     # wrist bearing
    box(fa, (0.05, 0.03, 0.06), at=(0.0, -0.075, -0.12), m=PLSS)                       # cuff checklist
    fore = smooth(obj('foreArm_' + side, fa, upper, at=(0.02 * sx, 0, -0.3)))
    wrist = obj('wrist_' + side, None, fore, at=(0, -0.02, -0.26))

    gl = P()
    box(gl, (0.085, 0.07, 0.09), at=(0, -0.01, -0.05), m=BOOTS)                       # palm
    for i in range(4):
        rod(gl, (-0.03 + 0.02 * i, -0.02, -0.095), (-0.03 + 0.02 * i, -0.035, -0.15), 0.0105, m=BOOTS, segs=10)
    rod(gl, (-0.045 * sx, -0.04, -0.05), (-0.06 * sx, -0.07, -0.09), 0.012, m=BOOTS, segs=10)  # thumb
    cyl(gl, 0.05, 0.03, at=(0, -0.005, -0.005), m=WHITE, segs=SEG)                    # glove gauntlet
    smooth(obj('glove_' + side, gl, wrist, at=(0, 0, 0), bevel=0.008))

# ---- legs: hip bearing, thigh with stripe, knee bellows, shin, ankle, treaded boot ----
for side, sx in (('L', 1), ('R', -1)):
    th = P()
    cyl(th, 0.112, 0.05, at=(0, 0, 0.0), m=JOINT, segs=SEG)                             # hip bearing
    tube(th, (0, 0, -0.03), (0, 0, -0.33), 0.108, 0.094, LEGS)
    cyl(th, 0.104, 0.05, at=(0, 0, -0.18), m=STRIPE, segs=SEG)
    bellows(th, (0, 0, -0.33), (0, 0, -0.42), 0.09, 3, LEGS)
    thigh = smooth(obj('thigh_' + side, th, pelvis, at=(0.11 * sx, 0, -0.06)))

    sn = P()
    tube(sn, (0, 0, -0.01), (0, 0, -0.36), 0.09, 0.078, LEGS)
    cyl(sn, 0.084, 0.03, at=(0, 0, -0.36), m=JOINT, segs=SEG)                          # ankle ring
    shin = smooth(obj('shin_' + side, sn, thigh, at=(0, 0, -0.41)))
    ankle = obj('ankle_' + side, None, shin, at=(0, 0, -0.4))

    bt = P()
    box(bt, (0.14, 0.27, 0.12), at=(0, -0.04, -0.04), m=BOOTS)
    sphere(bt, 0.075, at=(0, -0.14, -0.05), m=BOOTS, segs=20, rings=10, scale=(0.95, 1.0, 0.8))   # rounded toe cap
    box(bt, (0.145, 0.29, 0.03), at=(0, -0.04, -0.105), m=DARK)                        # sole
    for k in range(6):
        box(bt, (0.15, 0.018, 0.01), at=(0, -0.16 + 0.05 * k, -0.118), m=DARK)        # tread bars
    cyl(bt, 0.085, 0.05, at=(0, 0, 0.0), m=WHITE, segs=SEG)                            # boot cuff
    smooth(obj('boot_' + side, bt, ankle, at=(0, 0, 0), bevel=0.03))

h = assert_height(1.85, 1.95)
print('astronaut height %.3f m, tris %d' % (h, tris_count()))
export_glb(OUT)
print('exported', OUT)
