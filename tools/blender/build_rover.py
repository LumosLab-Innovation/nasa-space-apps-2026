# Artemis lunar terrain vehicle (game design, Plan 7). Open two-seat rover in the spirit of Apollo's LRV
# (NASA NSSDC: 2.3 m wheelbase, 81.8 cm woven steel-wire wheels with titanium chevrons, side-by-side seats,
# high-gain dish antenna) with a modern flat cargo deck at the back where Pip rides. The real Artemis LTV
# designs are still being chosen (NASA, April 2024), so this vehicle is imagined.
# Nodes: rover_root > chassis > steer_FL/FR > wheel_FL/FR, wheel_RL/RR, seat_driver, seat_cargo, dish.
# Requires common.py in the same run (run.md).
OUT = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/rover.glb'

begin_build('rover')
FRAME = mat('Rover_Frame', (0.78, 0.79, 0.8), 0.85, 0.35)
MESH = mat('Rover_Mesh', (0.36, 0.36, 0.37), 0.9, 0.55)
SEAT = mat('Rover_Seat', (0.22, 0.3, 0.42), 0.0, 0.8)
DARK = mat('Rover_Dark', (0.07, 0.07, 0.08), 0.3, 0.5)
GOLD = mat('Rover_Gold', (0.95, 0.68, 0.25), 1.0, 0.3)
CELLS = mat('Rover_Cells', (0.05, 0.08, 0.2), 0.5, 0.25)
SCREEN = mat('Rover_Screen', (0.1, 0.25, 0.3), 0.0, 0.2, emission=(0.3, 0.8, 1.0), strength=1.5)
FENDER = mat('Rover_Fender', (0.86, 0.86, 0.84), 0.0, 0.6)
LAMP = SCREEN  # one emissive material keeps the draw calls down

SEG = 24
WHEEL_R = 0.41
AXLE_Z = WHEEL_R
HALF_WB = 1.15
TRACK_X = 1.0

def tube(p, a, b, r, m, segs=8):
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    r_ = bmesh.ops.create_cone(p['bm'], cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r, depth=d.length)
    return _finish(p, r_['verts'], m, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())

def smooth(o, angle=35):
    if o.type != 'MESH':
        return o
    for poly in o.data.polygons:
        poly.use_smooth = True
    try:
        o.data.set_sharp_from_angle(angle=math.radians(angle))
    except Exception:
        pass
    return o

root = obj('rover_root')

# ---- chassis: tubular frame, floor pans, seats, console, antennas, cargo deck ----
ch = P()
FZ = 0.62
for sx in (1, -1):
    tube(ch, (0.75 * sx, -1.75, FZ), (0.75 * sx, 1.75, FZ), 0.035, FRAME)                 # side rails
for y in (-1.75, -1.15, -0.3, 0.35, 1.15, 1.75):
    tube(ch, (-0.75, y, FZ), (0.75, y, FZ), 0.03, FRAME)                                    # cross members
box(ch, (1.46, 1.3, 0.02), at=(0, -0.95, FZ + 0.03), m=DARK)                               # front floor pan
box(ch, (1.2, 0.5, 0.18), at=(0, -0.05, FZ - 0.09), m=GOLD)                                 # batteries under the seats (MLI)
# seats: tube frames with woven webbing
for sx in (1, -1):
    x = 0.38 * sx
    box(ch, (0.46, 0.46, 0.04), at=(x, -0.3, 0.85), m=SEAT)                                 # seat pan
    box(ch, (0.46, 0.04, 0.5), at=(x, -0.05, 1.12), m=SEAT)                                 # backrest
    for dx in (-0.23, 0.23):
        tube(ch, (x + dx, -0.53, 0.85), (x + dx, -0.05, 0.85), 0.015, FRAME)
        tube(ch, (x + dx, -0.05, 0.85), (x + dx, -0.05, 1.38), 0.015, FRAME)
        tube(ch, (x + dx, -0.53, 0.85), (x + dx, -0.53, FZ), 0.015, FRAME)
        tube(ch, (x + dx, -0.05, 0.85), (x + dx, -0.05, FZ), 0.015, FRAME)
    tube(ch, (x - 0.24, -0.4, 1.0), (x - 0.24, -0.05, 1.0), 0.012, FRAME)                   # armrests
    tube(ch, (x + 0.24, -0.4, 1.0), (x + 0.24, -0.05, 1.0), 0.012, FRAME)
    box(ch, (0.3, 0.12, 0.03), at=(x, -1.2, FZ + 0.06), m=DARK)                             # footrests
# roll bar behind the seats, with a small solar wing on top
tube(ch, (-0.72, 0.05, FZ), (-0.72, 0.05, 1.55), 0.03, FRAME)
tube(ch, (0.72, 0.05, FZ), (0.72, 0.05, 1.55), 0.03, FRAME)
tube(ch, (-0.72, 0.05, 1.55), (0.72, 0.05, 1.55), 0.03, FRAME)
box(ch, (1.5, 0.5, 0.03), at=(0, 0.05, 1.6), m=CELLS, rot=Matrix.Rotation(math.radians(-12), 4, 'X'))
box(ch, (1.54, 0.54, 0.02), at=(0, 0.05, 1.585), m=FRAME, rot=Matrix.Rotation(math.radians(-12), 4, 'X'))
# control console between the seats: display, T-handle hand controller
tube(ch, (0, -1.05, FZ), (0, -1.05, 1.05), 0.03, FRAME)
box(ch, (0.42, 0.1, 0.28), at=(0, -1.07, 1.15), m=FENDER, rot=Matrix.Rotation(math.radians(20), 4, 'X'))
box(ch, (0.3, 0.012, 0.16), at=(0, -1.01, 1.17), m=SCREEN, rot=Matrix.Rotation(math.radians(20), 4, 'X'))
box(ch, (0.12, 0.12, 0.14), at=(0, -0.62, 0.92), m=DARK)
tube(ch, (0, -0.62, 0.99), (0, -0.62, 1.12), 0.012, DARK)
tube(ch, (-0.06, -0.62, 1.12), (0.06, -0.62, 1.12), 0.015, DARK)
# front: high-gain dish on a mast (left), helical low-gain antenna (right), TV camera, headlamps
tube(ch, (0.55, -1.5, FZ), (0.55, -1.5, 1.75), 0.022, FRAME)
tube(ch, (-0.55, -1.5, FZ), (-0.55, -1.5, 1.5), 0.015, FRAME)
cyl(ch, 0.035, 0.45, at=(-0.55, -1.5, 1.72), m=FENDER, segs=12)
box(ch, (0.16, 0.2, 0.12), at=(0, -1.62, 0.9), m=DARK)
cyl(ch, 0.04, 0.05, at=(0, -1.735, 0.9), axis='Y', m=SCREEN, segs=12)
for sx in (1, -1):
    box(ch, (0.12, 0.06, 0.08), at=(0.48 * sx, -1.78, FZ + 0.05), m=DARK)
    cyl(ch, 0.032, 0.02, at=(0.48 * sx, -1.815, FZ + 0.05), axis='Y', m=LAMP, segs=12)
# rear cargo deck with low rails and tie-downs (Pip rides here)
box(ch, (1.56, 1.5, 0.04), at=(0, 1.0, 0.72), m=FRAME)
box(ch, (1.5, 1.44, 0.01), at=(0, 1.0, 0.745), m=DARK)
for sx in (1, -1):
    tube(ch, (0.78 * sx, 0.3, 0.82), (0.78 * sx, 1.72, 0.82), 0.015, FRAME)
    for y in (0.3, 1.0, 1.72):
        tube(ch, (0.78 * sx, y, 0.72), (0.78 * sx, y, 0.82), 0.015, FRAME)
tube(ch, (-0.78, 1.72, 0.82), (0.78, 1.72, 0.82), 0.015, FRAME)
for (x, y) in ((0.6, 0.4), (-0.6, 0.4), (0.6, 1.6), (-0.6, 1.6)):
    cyl(ch, 0.025, 0.02, at=(x, y, 0.76), m=GOLD, segs=8)
box(ch, (0.5, 0.25, 0.22), at=(0, 1.86, 0.62), m=GOLD)                                     # rear tool box
# fenders over the four wheels and suspension arms
for sy in (1, -1):
    for sx in (1, -1):
        fp = bmesh.ops.create_cone(ch['bm'], cap_ends=False, cap_tris=False, segments=SEG, radius1=0.5, radius2=0.5, depth=0.32)
        bmesh.ops.delete(ch['bm'], geom=[v for v in fp['verts'] if v.co.x > 0.06], context='VERTS')
        _finish(ch, [v for v in fp['verts'] if v.is_valid], FENDER,
                Matrix.Translation((TRACK_X * sx, HALF_WB * sy, AXLE_Z)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
        tube(ch, (0.75 * sx, HALF_WB * sy - 0.25, FZ), (TRACK_X * sx - 0.13 * sx, HALF_WB * sy, AXLE_Z), 0.025, FRAME)
        tube(ch, (0.75 * sx, HALF_WB * sy + 0.25, FZ), (TRACK_X * sx - 0.13 * sx, HALF_WB * sy, AXLE_Z), 0.025, FRAME)
chassis = smooth(obj('chassis', ch, root, at=(0, 0, 0)))

# high-gain dish: its own node (it can point at Earth)
dp = P()
r = bmesh.ops.create_uvsphere(dp['bm'], u_segments=SEG, v_segments=12, radius=0.45)
bmesh.ops.delete(dp['bm'], geom=[v for v in r['verts'] if v.co.z > -0.3], context='VERTS')
_finish(dp, [v for v in r['verts'] if v.is_valid], FENDER, Matrix.Translation((0, 0, 0.36)))
tube(dp, (0, 0, -0.02), (0, 0, 0.22), 0.012, FRAME)
cyl(dp, 0.03, 0.04, at=(0, 0, 0.24), m=DARK, segs=10)
dish = obj('dish', dp, chassis, at=(0.55, -1.5, 1.78))
dish.rotation_euler = (math.radians(-60), 0, 0)
smooth(dish)

# ---- wheels: woven steel-wire tyre, titanium chevrons, aluminium rim and hub ----
def wheel(name, parent, at):
    wp = P()
    cyl(wp, WHEEL_R, 0.23, axis='X', m=MESH, segs=SEG)
    cyl(wp, 0.3, 0.24, axis='X', m=FRAME, segs=SEG)
    cyl(wp, 0.09, 0.3, axis='X', m=FRAME, segs=12)
    for i in range(16):
        a = 2 * math.pi * i / 16
        rot = Matrix.Rotation(a, 4, 'X')
        for sgn in (1, -1):
            # one V-shaped chevron = two bars meeting at the tyre's centre line
            c = rot @ Vector((0.055 * sgn, 0.0, WHEEL_R + 0.004))
            box(wp, (0.11, 0.02, 0.01), at=tuple(c), m=FRAME, rot=rot @ Matrix.Rotation(math.radians(25 * sgn), 4, 'Z'))
    return smooth(obj(name, wp, parent, at=at))

for side, sx in (('L', 1), ('R', -1)):
    steer = obj('steer_F' + side, None, chassis, at=(TRACK_X * sx, -HALF_WB, AXLE_Z))
    wheel('wheel_F' + side, steer, (0, 0, 0))
    wheel('wheel_R' + side, chassis, (TRACK_X * sx, HALF_WB, AXLE_Z))

# Seat anchors: driver on the left like the Apollo commander; Pip in the middle of the deck.
obj('seat_driver', None, chassis, at=(0.38, -0.3, 0.87))
obj('seat_passenger', None, chassis, at=(-0.38, -0.3, 0.87))
obj('seat_cargo', None, chassis, at=(0, 1.0, 0.75))

h = assert_height(1.6, 2.4)
print('rover height %.3f m, tris %d' % (h, tris_count()))
export_glb(OUT)
print('exported', OUT)
