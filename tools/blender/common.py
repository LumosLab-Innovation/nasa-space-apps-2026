# Shared helpers for the Pip & Mica model builders. Runs inside the user's live Blender through Blender MCP.
# Safe-mode compatible: only bpy/bmesh/mathutils/math. Every datablock we create is tagged 'pm_build' so
# end_build() removes exactly ours and nothing of the user's.
# Axes: front = -Y, up = +Z, robot's left (_L) = +X, origin at the feet. Objects keep identity rotation;
# primitives are baked into mesh data so game code can rotate pivots freely.
import bpy, bmesh, math
from mathutils import Matrix, Vector

TAG = 'pm_build'
STATE = {}

def begin_build(model_id):
    end_build(model_id)
    orig = bpy.context.window.scene
    sc = bpy.data.scenes.new('build_' + model_id)
    sc[TAG] = model_id
    sc['orig_scene'] = orig.name if orig.get(TAG) is None else orig.get('orig_scene', orig.name)
    bpy.context.window.scene = sc
    STATE['id'] = model_id
    STATE['scene'] = sc
    STATE['mats'] = {}
    return sc

def end_build(model_id):
    """Remove every datablock tagged with this model id and return the window to the user's scene."""
    sc = bpy.data.scenes.get('build_' + model_id)
    if sc is not None:
        orig = bpy.data.scenes.get(sc.get('orig_scene', ''))
        if bpy.context.window.scene == sc and orig is not None:
            bpy.context.window.scene = orig
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.materials):
        for d in [d for d in coll if d.get(TAG) == model_id]:
            coll.remove(d)
    if sc is not None:
        bpy.data.scenes.remove(sc)

def mat(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m[TAG] = STATE['id']
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*color, 1.0)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = roughness
    if emission is not None:
        b.inputs['Emission Color'].default_value = (*emission, 1.0)
        b.inputs['Emission Strength'].default_value = strength
    STATE['mats'][name] = m
    return m

# ---- bmesh primitive builders (functions: safe mode forbids class definitions) ----
def P():
    """A part accumulates primitives into one mesh; each face remembers its material slot."""
    return {'bm': bmesh.new(), 'slots': []}

def _slot(p, m):
    if m not in p['slots']:
        p['slots'].append(m)
    return p['slots'].index(m)

def _finish(p, verts, m, matrix):
    bmesh.ops.transform(p['bm'], matrix=matrix, verts=verts)
    idx = _slot(p, m)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = idx
    return p

def box(p, size, at=(0, 0, 0), m=None, rot=None):
    r = bmesh.ops.create_cube(p['bm'], size=1.0)
    return _finish(p, r['verts'], m, Matrix.Translation(at) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*size, 1.0)))

def cyl(p, radius, depth, at=(0, 0, 0), axis='Z', m=None, segs=16, radius2=None):
    r = bmesh.ops.create_cone(p['bm'], cap_ends=True, cap_tris=False, segments=segs,
                              radius1=radius, radius2=radius if radius2 is None else radius2, depth=depth)
    rot = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}[axis]
    return _finish(p, r['verts'], m, Matrix.Translation(at) @ rot)

def sphere(p, radius, at=(0, 0, 0), m=None, segs=16, rings=8, scale=(1, 1, 1)):
    r = bmesh.ops.create_uvsphere(p['bm'], u_segments=segs, v_segments=rings, radius=radius)
    return _finish(p, r['verts'], m, Matrix.Translation(at) @ Matrix.Diagonal((*scale, 1.0)))

def rod(p, a, b, radius, m=None, segs=8):
    """Cylinder from point a to point b (cables, struts)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    r = bmesh.ops.create_cone(p['bm'], cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius, depth=d.length)
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    return _finish(p, r['verts'], m, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())

def plane(p, w, h, at=(0, 0, 0), m=None):
    """Rectangle facing -Y with UV 0..1: u along +X (viewer's right when looking at the front), v up."""
    hw, hh = w / 2, h / 2
    pts = [(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)]
    vs = [p['bm'].verts.new(Vector(q) + Vector(at)) for q in pts]
    f = p['bm'].faces.new(vs)
    uv = p['bm'].loops.layers.uv.verify()
    for loop, (u, v) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop[uv].uv = (u, v)
    f.material_index = _slot(p, m)
    f.normal_update()
    if f.normal.y > 0:
        f.normal_flip()
    return p

def bolts(p, centers, normal_axis, m, radius=0.012, depth=0.012):
    for c in centers:
        cyl(p, radius, depth, at=c, axis=normal_axis, m=m, segs=6)
    return p

def obj(name, part=None, parent=None, at=(0, 0, 0), bevel=0.0):
    """Mesh object (or empty when part is None) at a parent-local location with identity rotation."""
    sc = STATE['scene']
    if part is None:
        o = bpy.data.objects.new(name, None)
        o.empty_display_size = 0.05
    else:
        me = bpy.data.meshes.new(name)
        me[TAG] = STATE['id']
        part['bm'].to_mesh(me)
        part['bm'].free()
        for m in part['slots']:
            me.materials.append(m)
        o = bpy.data.objects.new(name, me)
        if bevel > 0:
            mod = o.modifiers.new('bevel', 'BEVEL')
            mod.width = bevel
            mod.segments = 2
            mod.limit_method = 'ANGLE'
    if o.name != name:
        raise RuntimeError('name collision: ' + name + ' became ' + o.name)
    o[TAG] = STATE['id']
    sc.collection.objects.link(o)
    o.parent = parent
    o.location = at
    return o

def tris_count():
    dg = bpy.context.evaluated_depsgraph_get()
    n = 0
    for o in STATE['scene'].objects:
        if o.type == 'MESH':
            me = o.evaluated_get(dg).to_mesh()
            n += sum(len(p.vertices) - 2 for p in me.polygons)
            o.evaluated_get(dg).to_mesh_clear()
    return n

def world_bounds():
    bpy.context.view_layer.update()
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in STATE['scene'].objects:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi

def assert_height(lo_m, hi_m):
    lo, hi = world_bounds()
    h = hi.z - min(lo.z, 0.0)
    if not (lo_m <= h <= hi_m):
        raise RuntimeError('height %.3f m outside [%s, %s]' % (h, lo_m, hi_m))
    return h

def export_glb(path):
    """Export ONLY the build scene. The exporter otherwise also picks up objects the user has selected in
    their own scenes, so select inside our view layer and pin the active scene."""
    sc = STATE['scene']
    vl = sc.view_layers[0]
    for o in sc.objects:
        o.select_set(True, view_layer=vl)
    with bpy.context.temp_override(scene=sc, view_layer=vl):
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, use_active_scene=True,
                                  export_apply=True, export_yup=True)
