# Base modules, cargo crate, Artemis IV flag, Starship HLS, comms relay, hammer and feather
# (spec v3 §4.4). Each prop is built in its own scene, exported, then cleaned up, so shared node
# names (mast, dish, hull...) never collide. Requires common.py in the same run (see run.md).
DIR = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/'

def common_mats():
    return {
        'white': mat('Prop_White', (0.9, 0.9, 0.88), 0.0, 0.5),
        'alu': mat('Prop_Alu', (0.7, 0.7, 0.72), 1.0, 0.4),
        'cells': mat('Prop_Cells', (0.04, 0.06, 0.2), 0.4, 0.2),
        'gold': mat('Prop_MLI', (1.0, 0.71, 0.29), 1.0, 0.33),
        'dark': mat('Prop_Dark', (0.08, 0.08, 0.09), 0.3, 0.8),
        'orange': mat('Prop_Orange', (0.95, 0.42, 0.08), 0.0, 0.5),
    }

def solar_tower(M):
    r = obj('solarTower_root')
    b = P()
    for k in range(3):
        a = k * 2 * math.pi / 3
        rod(b, (0, 0, 1.2), (1.4 * math.cos(a), 1.4 * math.sin(a), 0.02), 0.05, m=M['alu'])
    cyl(b, 0.35, 0.3, at=(0, 0, 0.15), m=M['white'], segs=16)
    cyl(b, 0.12, 8.0, at=(0, 0, 4.0), m=M['white'], segs=16)
    mast = obj('mast', b, r)
    pv = obj('panel_pivot', None, mast, at=(0, 0, 5.2))
    p = P()
    box(p, (2.4, 0.06, 5.0), m=M['alu'])
    box(p, (2.3, 0.012, 4.9), at=(0, -0.035, 0), m=M['cells'])
    box(p, (2.3, 0.012, 4.9), at=(0, 0.035, 0), m=M['cells'])
    for k in range(1, 6):
        box(p, (2.32, 0.02, 0.02), at=(0, -0.045, -2.45 + k * 0.82), m=M['alu'])
    obj('panel', p, pv, at=(0, 0.2, 0), bevel=0.01)
    return (7, 9)

def radiator(M):
    r = obj('radiator_root')
    f = P()
    box(f, (2.6, 0.6, 0.4), at=(0, 0, 0.2), m=M['alu'])
    box(f, (3.0, 0.1, 2.0), at=(0, 0, 1.4), m=M['white'])
    rod(f, (-1.4, 0, 0.4), (-1.4, 0, 2.4), 0.04, m=M['alu'])
    rod(f, (1.4, 0, 0.4), (1.4, 0, 2.4), 0.04, m=M['alu'])
    obj('frame', f, r, bevel=0.02)
    fi = P()
    for k in range(-6, 7):
        box(fi, (0.02, 0.22, 1.9), at=(k * 0.22, 0, 1.4), m=M['white'])
    obj('fins', fi, r)
    return (2, 3)

def habitat(M):
    r = obj('habitat_root')
    h = P()
    cyl(h, 2.0, 8.0, at=(0, 0, 2.2), axis='X', m=M['white'], segs=32)
    for x in (-3.2, -1.1, 1.1, 3.2):
        cyl(h, 2.03, 0.12, at=(x, 0, 2.2), axis='X', m=M['alu'], segs=32)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(h, (2.6 * sx, 1.0 * sy, 0.9), (3.0 * sx, 1.6 * sy, 0.0), 0.09, m=M['alu'])
    box(h, (0.6, 0.6, 0.3), at=(0, 0, 4.25), m=M['gold'])
    obj('hull', h, r, bevel=0.0)
    a = P()
    box(a, (1.6, 1.8, 2.3), at=(0, 0, 0), m=M['white'])
    box(a, (1.64, 1.84, 0.1), at=(0, 0, -1.0), m=M['alu'])
    airlock = obj('dust_airlock', a, r, at=(4.7, 0, 1.6), bevel=0.05)
    ht = P()
    box(ht, (0.08, 1.0, 1.6), m=M['alu'])
    box(ht, (0.05, 0.12, 0.3), at=(0.06, -0.35, 0), m=M['dark'])
    obj('hatch', ht, airlock, at=(0.83, 0, -0.1))
    return (4, 5)

def antenna(M):
    r = obj('antenna_root')
    p = P()
    for k in range(3):
        a = k * 2 * math.pi / 3
        rod(p, (0, 0, 0.8), (0.8 * math.cos(a), 0.8 * math.sin(a), 0.02), 0.035, m=M['alu'])
    cyl(p, 0.07, 3.0, at=(0, 0, 1.5), m=M['white'], segs=12)
    pole = obj('pole', p, r)
    dp = obj('dish_pivot', None, pole, at=(0, 0, 3.0))
    d = P()
    cyl(d, 0.8, 0.12, at=(0, 0, 0.1), m=M['white'], segs=32, radius2=0.25)
    rod(d, (0, 0, 0.1), (0, 0, 0.55), 0.02, m=M['alu'])
    cyl(d, 0.05, 0.08, at=(0, 0, 0.58), m=M['dark'], segs=10)
    obj('dish', d, dp)
    return (3, 4)

def crate(M):
    r = obj('crate_root')
    b = P()
    box(b, (1.2, 1.2, 0.82), at=(0, 0, 0.41), m=M['white'])
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(b, (0.08, 0.08, 0.84), at=(0.58 * sx, 0.58 * sy, 0.42), m=M['alu'])
    box(b, (1.204, 0.3, 0.12), at=(0, 0, 0.5), m=M['orange'])
    for k in range(6):
        box(b, (0.06, 0.004, 0.06), at=(-0.4 + k * 0.16, -0.602, 0.65), m=M['dark'])
    obj('body', b, r, bevel=0.01)
    l = P()
    box(l, (1.22, 1.22, 0.06), m=M['alu'])
    box(l, (0.3, 0.06, 0.04), at=(0, 0, 0.05), m=M['dark'])
    obj('lid', l, r, at=(0, 0, 0.85), bevel=0.01)
    return (0.8, 1.0)

def flag(M):
    red = mat('Flag_Red', (0.7, 0.08, 0.12), 0.0, 0.8)
    wht = mat('Flag_White', (0.95, 0.95, 0.95), 0.0, 0.8)
    blu = mat('Flag_Blue', (0.08, 0.12, 0.38), 0.0, 0.8)
    r = obj('flag_root')
    p = P()
    cyl(p, 0.018, 2.4, at=(0, 0, 1.2), m=M['alu'], segs=10)
    pole = obj('pole', p, r)
    cb = P()
    rod(cb, (0, 0, 0), (0.95, 0, 0), 0.012, m=M['alu'])
    obj('crossbar', cb, pole, at=(0, 0, 2.3))
    # Apollo-style: a crossbar holds the cloth out, because there is no wind on the Moon.
    c = P()
    W, H = 0.9, 0.6
    sh = H / 13
    for i in range(13):
        box(c, (W, 0.008, sh), at=(0.03 + W / 2, 0, -0.02 - sh / 2 - i * sh), m=red if i % 2 == 0 else wht)
    cw, ch = W * 0.4, sh * 7
    box(c, (cw, 0.012, ch), at=(0.03 + cw / 2, 0, -0.02 - ch / 2), m=blu)
    for row in range(5):
        for col in range(6):
            box(c, (0.018, 0.016, 0.018), at=(0.06 + col * 0.055 + (row % 2) * 0.027, 0, -0.04 - row * 0.05), m=wht)
    obj('cloth', c, pole, at=(0, 0, 2.3))
    return (2.2, 2.6)

def hls(M):
    """Starship HLS (Plan 7, NASA/SpaceX renders): 9 m x 50 m stainless hull with weld seams, solar array band,
    crew window band, landing thrusters mounted high, crew elevator with cab, six legs, docking port on top."""
    steel = mat('Hls_Steel', (0.78, 0.79, 0.8), 1.0, 0.35)
    seam = mat('Hls_Seam', (0.56, 0.57, 0.59), 1.0, 0.5)
    black = mat('Hls_Black', (0.05, 0.05, 0.06), 0.2, 0.7)
    cells = mat('Hls_Cells', (0.04, 0.06, 0.18), 0.5, 0.25)
    glass = mat('Hls_Glass', (0.02, 0.03, 0.05), 0.2, 0.05)
    r = obj('hls_root')
    h = P()
    cyl(h, 4.5, 41.0, at=(0, 0, 23.5), m=steel, segs=48)                       # hull z 3..44
    # ogive nose z 44..50 in six frustums, then the docking port
    prof = [4.5, 4.38, 4.05, 3.5, 2.75, 1.85, 0.95]
    for k in range(6):
        cyl(h, prof[k], 1.0, at=(0, 0, 44.5 + k), m=steel, segs=48, radius2=prof[k + 1])
    cyl(h, 0.8, 0.35, at=(0, 0, 50.17), m=seam, segs=24)
    cyl(h, 0.55, 0.1, at=(0, 0, 50.39), m=black, segs=24)
    # weld seams: rings every 1.83 m (stainless rings) and vertical seams
    z = 4.0
    while z < 43.5:
        cyl(h, 4.515, 0.05, at=(0, 0, z), m=seam, segs=48)
        z += 1.83
    for k in range(12):
        a = k * 2 * math.pi / 12 + 0.13
        box(h, (0.04, 0.03, 41.0), at=(4.51 * math.cos(a), 4.51 * math.sin(a), 23.5), m=seam, rot=Matrix.Rotation(a, 4, 'Z'))
    # solar array band near the top, split into panels
    cyl(h, 4.53, 4.6, at=(0, 0, 38.0), m=cells, segs=48)
    for k in range(24):
        a = k * 2 * math.pi / 24
        box(h, (0.06, 0.04, 4.6), at=(4.55 * math.cos(a), 4.55 * math.sin(a), 38.0), m=seam, rot=Matrix.Rotation(a, 4, 'Z'))
    # crew window band facing the elevator side
    for k in range(-5, 6):
        a = -math.pi / 2 + k * 0.17
        box(h, (0.6, 0.06, 0.85), at=(4.54 * math.cos(a), 4.54 * math.sin(a), 41.6), m=glass, rot=Matrix.Rotation(a + math.pi / 2, 4, 'Z'))
        box(h, (0.72, 0.04, 0.97), at=(4.52 * math.cos(a), 4.52 * math.sin(a), 41.6), m=black, rot=Matrix.Rotation(a + math.pi / 2, 4, 'Z'))
    # airlock door behind the elevator cab
    box(h, (2.0, 0.08, 2.6), at=(0, -4.52, 33.2), m=black)
    obj('hull', h, r)
    lg = P()
    for k in range(6):
        a = k * 2 * math.pi / 6 + 0.3
        ca, sa = math.cos(a), math.sin(a)
        rod(lg, (4.3 * ca, 4.3 * sa, 9.0), (6.8 * ca, 6.8 * sa, 0.5), 0.32, m=steel)            # main strut
        rod(lg, (4.4 * ca, 4.4 * sa, 4.0), (6.6 * ca, 6.6 * sa, 0.9), 0.18, m=seam)             # brace
        cyl(lg, 0.45, 2.0, at=(6.1 * ca, 6.1 * sa, 2.6), m=black, segs=12)                      # shock absorber
        cyl(lg, 1.1, 0.3, at=(6.8 * ca, 6.8 * sa, 0.15), m=steel, segs=20)                      # foot pad
    obj('legs', lg, r)
    t = P()
    # landing thrusters mounted high on the hull (so the plume hits the ground less): four pods of two
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        ca, sa = math.cos(a), math.sin(a)
        box(t, (1.4, 1.0, 1.6), at=(4.8 * ca, 4.8 * sa, 32.0), m=steel, rot=Matrix.Rotation(a, 4, 'Z'))
        for d in (-0.35, 0.35):
            px, py = 5.0 * ca - d * sa, 5.0 * sa + d * ca
            cyl(t, 0.18, 0.7, at=(px, py, 30.9), m=black, segs=12, radius2=0.32)
    # three Raptor engines at the base
    for k in range(3):
        a = k * 2 * math.pi / 3
        cyl(t, 0.9, 1.6, at=(1.6 * math.cos(a), 1.6 * math.sin(a), 2.2), m=black, segs=20, radius2=0.55)
        cyl(t, 0.5, 0.4, at=(1.6 * math.cos(a), 1.6 * math.sin(a), 3.1), m=seam, segs=16)
    obj('thrusters', t, r)
    e = P()
    rod(e, (-0.9, 0, 0.0), (-0.9, 0, 34.5), 0.12, m=black)
    rod(e, (0.9, 0, 0.0), (0.9, 0, 34.5), 0.12, m=black)
    for zz in range(2, 34, 3):
        rod(e, (-0.9, 0, zz), (0.9, 0, zz), 0.05, m=seam)
    box(e, (2.0, 2.0, 0.1), at=(0, -1.0, 0.3), m=M['alu'])
    for zz in (1.2, 2.2):
        rod(e, (-1.0, -2.0, zz), (1.0, -2.0, zz), 0.03, m=M['alu'])
    # elevator cab parked at the airlock, with a window
    box(e, (2.4, 2.2, 2.8), at=(0, -1.0, 33.2), m=steel)
    box(e, (1.2, 0.05, 0.9), at=(0, -2.12, 33.8), m=glass)
    box(e, (2.6, 2.4, 0.15), at=(0, -1.0, 34.7), m=black)
    obj('elevator', e, r, at=(0, -4.75, 0))
    return (48, 52)

def relay(M):
    r = obj('relay_root')
    m_ = P()
    for k in range(3):
        a = k * 2 * math.pi / 3
        rod(m_, (0, 0, 0.6), (0.6 * math.cos(a), 0.6 * math.sin(a), 0.02), 0.03, m=M['alu'])
    cyl(m_, 0.05, 2.4, at=(0, 0, 1.2), m=M['white'], segs=12)
    box(m_, (0.3, 0.2, 0.25), at=(0, 0, 0.9), m=M['gold'])
    box(m_, (0.4, 0.02, 0.3), at=(0, -0.2, 1.4), m=M['cells'])
    mast = obj('mast', m_, r)
    d = P()
    cyl(d, 0.55, 0.1, at=(0, 0, 0), axis='Y', m=M['white'], segs=28, radius2=0.18)
    rod(d, (0, 0, 0), (0, -0.4, 0), 0.015, m=M['alu'])
    obj('dish', d, mast, at=(0, 0, 2.6))
    return (2.5, 3.5)

def hammer(M):
    r = obj('hammer_root')
    hd = P()
    box(hd, (0.14, 0.05, 0.05), m=M['alu'])
    obj('head', hd, r, at=(0, 0, 0.36))
    hn = P()
    cyl(hn, 0.013, 0.34, at=(0, 0, 0.17), m=M['dark'], segs=10)
    obj('handle', hn, r)
    return (0.3, 0.45)

def feather(M):
    brown = mat('Feather_Brown', (0.45, 0.32, 0.2), 0.0, 0.9)
    pale = mat('Feather_Pale', (0.85, 0.8, 0.7), 0.0, 0.9)
    r = obj('feather_root')
    q = P()
    cyl(q, 0.003, 0.28, at=(0, 0, 0.14), m=pale, segs=6)
    obj('quill', q, r)
    v = P()
    for k in range(9):
        z = 0.06 + k * 0.024
        w = 0.035 * math.sin(math.pi * (k + 1) / 10)
        box(v, (w * 2, 0.002, 0.026), at=(0, 0, z), m=brown if k % 3 else pale)
    obj('vane', v, r)
    return (0.2, 0.35)

def build_one(mid, M):
    """Explicit dispatch: Blender MCP safe mode forbids calling a function held in a variable."""
    if mid == 'solarTower':
        return solar_tower(M)
    if mid == 'radiator':
        return radiator(M)
    if mid == 'habitat':
        return habitat(M)
    if mid == 'antenna':
        return antenna(M)
    if mid == 'crate':
        return crate(M)
    if mid == 'flag':
        return flag(M)
    if mid == 'hls':
        return hls(M)
    if mid == 'relay':
        return relay(M)
    if mid == 'hammer':
        return hammer(M)
    return feather(M)

for mid in ('solarTower', 'radiator', 'habitat', 'antenna', 'crate', 'flag', 'hls', 'relay', 'hammer', 'feather'):
    begin_build(mid)
    lo, hi = build_one(mid, common_mats())
    hgt = assert_height(lo, hi)
    print('%s height %.2f m, tris %d' % (mid, hgt, tris_count()))
    export_glb(DIR + mid + '.glb')
    end_build(mid)
print('done', [s.name for s in bpy.data.scenes])
