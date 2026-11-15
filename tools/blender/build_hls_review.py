"""Headless candidate builder. Does not modify live models or the user's Blender file.
Run: blender --background --factory-startup --python tools/blender/build_hls_review.py
Dimensions and hidden topology are a game reconstruction, not flight CAD.
"""
import sys, math, json
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
from common import begin_build, end_build, mat, P, box, cyl, rod, obj, tris_count, world_bounds
from hls_engine_bay import build_engine_bay
from hls_landing_gear import build_landing_gear, add_lower_hull, add_hull_seam

OUT = ROOT / 'public/models/review'
OUT.mkdir(parents=True, exist_ok=True)
REPORT = ROOT / 'docs/screens/hls-v2-metrics.json'
REPORT.parent.mkdir(parents=True, exist_ok=True)

def lathe(p, profile, material, segments, start=0, extent=2*math.pi):
    bm = p['bm']
    if material not in p['slots']: p['slots'].append(material)
    slot = p['slots'].index(material)
    closed=abs(extent-2*math.pi)<.00001
    rings = [[bm.verts.new((r*math.cos(start+i*extent/segments), r*math.sin(start+i*extent/segments), z))
              for i in range(segments if closed else segments+1)] for z, r in profile]
    for a,b in zip(rings, rings[1:]):
        for i in range(segments):
            j=(i+1)%segments if closed else i+1
            f=bm.faces.new((a[i],a[j],b[j],b[i])); f.material_index=slot; f.smooth=True

def rounded_patch(p, angle, z, width, height, radius, material, corner=.13, seg=4):
    """Rounded rectangle conforming to the cylindrical hull; angle zero faces front (-Y)."""
    bm=p['bm']
    if material not in p['slots']: p['slots'].append(material)
    slot=p['slots'].index(material)
    verts=[]
    for cx,cy,start in [(width/2-corner,height/2-corner,0),(-width/2+corner,height/2-corner,90),
                         (-width/2+corner,-height/2+corner,180),(width/2-corner,-height/2+corner,270)]:
        for k in range(seg+1):
            t=math.radians(start+k*90/seg)
            u=cx+corner*math.cos(t); v=cy+corner*math.sin(t)
            a=angle+u/radius
            # Follow the ogive, so lower corners do not sink into the nose.
            rr=radius
            if z>37:
                hull_r=lambda zz: 4.48-4.12*((zz-37)/12.5)**2
                rr+=hull_r(z+v)-hull_r(z)
            verts.append(bm.verts.new((rr*math.sin(a),-rr*math.cos(a),z+v)))
    center=bm.verts.new((radius*math.sin(angle),-radius*math.cos(angle),z))
    for i in range(len(verts)):
        f=bm.faces.new((center,verts[i],verts[(i+1)%len(verts)])); f.material_index=slot

def finish_atlas(scene, materials):
    """One material/primitive per moving part; palette atlas carries color + metal/roughness."""
    count=16; size=128
    colors=[]; orm=[]
    for y in range(8):
        for x in range(size):
            i=min(x//8,len(materials)-1)
            bs=next(n for n in materials[i].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
            rgba=tuple(bs.inputs['Base Color'].default_value)
            colors.extend(rgba)
            orm.extend((1,bs.inputs['Roughness'].default_value,bs.inputs['Metallic'].default_value,1))
    base=bpy.data.images.new('hls-palette-color',width=size,height=8)
    base.pixels[:]=colors; base.pack()
    packed=bpy.data.images.new('hls-palette-orm',width=size,height=8)
    packed.colorspace_settings.name='Non-Color'; packed.pixels[:]=orm; packed.pack()
    atlas=bpy.data.materials.new('HLS_ReferenceAtlas'); atlas.use_nodes=True
    nt=atlas.node_tree; bs=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    tex=nt.nodes.new('ShaderNodeTexImage'); tex.image=base
    nt.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    mr=nt.nodes.new('ShaderNodeTexImage'); mr.image=packed
    split=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(mr.outputs['Color'],split.inputs['Color'])
    nt.links.new(split.outputs['Green'],bs.inputs['Roughness']); nt.links.new(split.outputs['Blue'],bs.inputs['Metallic'])
    for o in scene.objects:
        if o.type!='MESH': continue
        me=o.data; slots=list(me.materials)
        uv=me.uv_layers.new(name='Palette')
        for face in me.polygons:
            index=materials.index(slots[face.material_index])
            for li in face.loop_indices: uv.data[li].uv=((index+.5)/count,.5)
            face.material_index=0
        me.materials.clear(); me.materials.append(atlas)
    return atlas

def build(far=False):
    mid='hlsReviewFar' if far else 'hlsReview'
    scene=begin_build(mid)
    S=48 if far else 96
    white=mat('HLS_Coating',(0.84,.85,.86),.04,.52)
    seam=mat('HLS_Seams',(.63,.65,.67),.18,.6)
    black=mat('HLS_Recess',(.015,.02,.026),.12,.7)
    steel=mat('HLS_Aluminium',(.5,.55,.58),.82,.36)
    glass=mat('HLS_Windows',(.29,.34,.38),.65,.2)
    nozzle=mat('HLS_Nozzles',(.06,.065,.07),.7,.5)
    pale=mat('HLS_WindowInset',(.78,.79,.75),.08,.3)
    red=mat('HLS_Red',(.65,.025,.035),.05,.55)
    liner=mat('HLS_EngineLiner',(.12,.105,.095),.65,.55)
    cablemat=mat('HLS_Cable',(.52,.55,.57),.55,.44)
    palette=[white,seam,black,steel,glass,nozzle,pale,red,liner,cablemat]
    root=obj('hls_root'); root['reconstruction']='NASA/SpaceX public concept; inferred hidden geometry'
    hull=P()
    # Primary image: a long ogive, white coating, no visible blue photovoltaic belt.
    profile=[(17,4.5),(35.8,4.5),(37.0,4.48)]
    lathe(hull,[(2.0,4.42),(2.35,4.5)],white,S)
    add_lower_hull(hull,white,far)
    for i in range(1,25 if not far else 13):
        t=i/(24 if not far else 12)
        # Tangent at the cylindrical shoulder; pointed cap flattened only for docking adapter.
        profile.append((37+12.5*t,4.48*(1-t*t)+.36*t*t))
    profile.extend([(49.75,.5),(49.88,.48)])
    lathe(hull,profile,white,S)
    lathe(hull,[(1.8,4.43),(2.3,4.5)],nozzle,S)
    # Few hairline welds, rather than the old prominent tiled grid.
    if not far:
        for z in (5,9,13,17,21,25,29,35.8):
            add_hull_seam(hull,z,seam,far) if z<17 else lathe(hull,[(z,4.502),(z+.009,4.502)],seam,S)
    # Upper docking interface, simplified unseen internals.
    lathe(hull,[(49.84,.5),(50,.5),(50,.36),(49.83,.36)],steel,32)
    cyl(hull,.35,.02,at=(0,0,49.84),m=black,segs=32)
    for i in range(8):
        a=2*math.pi*i/8
        box(hull,(.06,.07,.09),at=(.45*math.cos(a),.45*math.sin(a),50),m=steel)
    # Windows: count/hidden wrap inferred; visible row follows the image.
    for k in range(-5,6):
        a=k*.155
        rounded_patch(hull,a,39.1,.60,1.02,4.389,black,corner=.14,seg=2 if far else 4)
        rounded_patch(hull,a,39.1,.50,.86,4.402,pale,corner=.12,seg=2 if far else 4)
    # Airlock outline and hoist opening in front.
    rounded_patch(hull,0,35.65,2.45,2.7,4.515,seam,corner=.18)
    rounded_patch(hull,0,35.65,2.39,2.64,4.522,white,corner=.16)
    rounded_patch(hull,0,34.45,2.15,2.45,4.532,black,corner=.13)
    # Raised hoist housing, facing the surface access corridor.
    hoist=P()
    box(hoist,(2.55,.20,2.3),at=(0,-4.60,35.2),m=white)
    box(hoist,(2.25,.02,.06),at=(0,-4.71,34.3),m=seam)
    for x in (-1.4,1.4):
        box(hoist,(.28,.65,.27),at=(x,-4.60,35.65),m=nozzle)
        cyl(hoist,.14,.22,at=(x,-4.72,35.65),axis='X',m=steel,segs=16)
        obj('winchAnchor'+('Left' if x<0 else 'Right'),None,root,at=(x,-4.72,35.79))
    obj('hoistHousing',hoist,root)
    # Sparse RCS ports and a narrow white fixture beside belt.
    # Unverified upper nose RCS placement is omitted from this reference-facing draft.
    obj('hull',hull,root)
    thrust=P()
    # Six dark groups separated by white corridors, including the hoist corridor.
    for group in range(6):
        center=-math.pi/2+math.pi/6+group*math.pi/3
        lathe(thrust,[(30.3,4.51),(32.3,4.51)],black,S//6,center-.41,.82)
    # Recessed-looking oval nozzles repeated around upper belt (layout inferred).
    for k in range(18):
        a=math.pi/6+(k//3)*math.pi/3+((k%3)-1)*.25
        # Oval annular wells embedded into dark band, no added bulky pods.
        normal=Vector((math.sin(a),-math.cos(a),0))
        tangent=Vector((math.cos(a),math.sin(a),0))
        bm=thrust['bm']; verts=[]
        for radius,depth in ((1,4.535),(.78,4.54),(.65,4.518)):
            ring=[]
            for j in range(12 if far else 20):
                t=2*math.pi*j/(12 if far else 20)
                v=normal*depth+tangent*(math.cos(t)*.29*radius)+Vector((0,0,31.3+math.sin(t)*.78*radius))
                ring.append(bm.verts.new(v))
            verts.append(ring)
        if nozzle not in thrust['slots']: thrust['slots'].append(nozzle)
        if black not in thrust['slots']: thrust['slots'].append(black)
        for level in range(2):
            for j in range(len(verts[0])):
                n=(j+1)%len(verts[0])
                f=bm.faces.new((verts[level][j],verts[level][n],verts[level+1][n],verts[level+1][j])); f.material_index=thrust['slots'].index(nozzle if level==0 else black); f.smooth=True
    obj('thrusters',thrust,root)
    build_engine_bay(root,lathe,steel,nozzle,black,liner,far)
    build_landing_gear(root,hull,lathe,(white,seam,black,steel,nozzle),far)
    elevator=obj('elevator',None,root)
    arms=P()
    arm=obj('supportArms',None,elevator,at=(0,-5.55,35.65))
    for x in (-1.4,1.4):
        side='Left' if x<0 else 'Right'
        box(arms,(.16,1.0,.16),at=(x,.5,0),m=steel)
        # Visible pulley and a cable quarter-turn between top feed and drop line.
        cyl(arms,.14,.10,at=(x,.14,0),axis='X',m=nozzle,segs=16)
        for dx in (-.065,.065):cyl(arms,.17,.025,at=(x+dx,.14,0),axis='X',m=steel,segs=16)
        arc=[(x,.14-.14*math.sin(t*math.pi/12),.14*math.cos(t*math.pi/12)) for t in range(7)]
        for a,b in zip(arc,arc[1:]):rod(arms,a,b,.035,m=cablemat,segs=6)
        obj('pulleyFeed'+side,None,arm,at=(x,.14,.14))
        obj('pulleyDrop'+side,None,arm,at=(x,0,0))
    obj('supportArmMesh',arms,arm)
    cables=obj('hoistCables',None,elevator)
    for name in ['cableLeadLeft','cableLeadRight','cableDropLeft','cableDropRight']:
        p=P();rod(p,(0,0,0),(0,0,1),.035,m=cablemat,segs=8)
        obj(name,p,cables)
    car=obj('elevatorCar',None,elevator,at=(0,-6.5,33.1)); car['surfaceZ']=.22
    # Rigid suspension frame: the load path never depends on folding guardrails.
    carrier=P()
    for x in (-1.4,1.4):
        side='Left' if x<0 else 'Right'
        box(carrier,(.11,.12,2.25),at=(x,1.06,1.225),m=steel)
        rod(carrier,(x,1.06,.1),(x,.95,.1),.085,m=steel,segs=12)
        cyl(carrier,.12,.12,at=(x,.95,.1),axis='X',m=steel,segs=12)
        cyl(carrier,.095,.12,at=(x,.95,2.25),axis='X',m=steel,segs=12)
        obj('suspension'+side,None,car,at=(x,.95,2.25))
    for z in (.1,2.25):box(carrier,(2.8,.12,.12),at=(0,1.06,z),m=steel)
    obj('elevatorCarrier',carrier,car)
    floor=obj('floorHinge',None,car,at=(0,.95,.1))
    p=P()
    box(p,(2.7,2.0,.18),at=(0,-.95,0),m=steel)
    for x in (-1.15,1.15): box(p,(.09,1.8,.07),at=(x,-.95,-.11),m=nozzle)
    cyl(p,.075,2.7,at=(0,0,0),axis='X',m=steel,segs=12)
    # Deck-mounted hinge brackets: rail feet remain physically seated throughout rotation.
    for side,x in [('Left',-1.25),('Right',1.25)]:
        for index,y in enumerate((-1.62,-.1)):
            box(p,(.12,.14,.16),at=(x,y,.08),m=steel)
            cyl(p,.065,.16,at=(x,y,.16),axis='Y',m=nozzle,segs=8)
            obj('guardSocket'+side+str(index),None,floor,at=(x,y,.16))
    for index,x in enumerate((-1.16,1.16)):
        box(p,(.14,.12,.28),at=(x,-1.8,.14),m=steel)
        cyl(p,.065,.16,at=(x,-1.8,.28),axis='X',m=nozzle,segs=8)
        obj('guardSocketFront'+str(index),None,floor,at=(x,-1.8,.28))
    obj('elevatorBasket',p,floor)
    # Independent, compact folding rails. Open rear edge faces the airlock.
    for name,x in [('guardLeft',-1.25),('guardRight',1.25)]:
        hinge=obj(name,None,floor,at=(x,0,.16))
        p=P()
        for y in (-1.62,-.1): rod(p,(0,y,0),(0,y,1.18),.035,m=steel,segs=6)
        for z in (.55,1.18): rod(p,(0,-1.62,z),(0,-.1,z),.035,m=steel,segs=6)
        rod(p,(0,-1.62,.05),(0,-.1,1.18),.022,m=steel,segs=6)
        obj(name+'Mesh',p,hinge)
    front=obj('guardFront',None,floor,at=(0,-1.8,.28))
    p=P()
    for x in (-1.16,1.16): rod(p,(x,0,0),(x,0,1.06),.035,m=steel,segs=6)
    for z in (.5,1.06): rod(p,(-1.16,0,z),(1.16,0,z),.035,m=steel,segs=6)
    obj('guardFrontMesh',p,front)
    obj('dockingAnchor',None,root,at=(0,0,50.06))
    obj('engineAnchor',None,root,at=(0,0,1.2))
    obj('elevatorFloor',None,floor,at=(0,-.95,.1))
    # Combine fixed detail, not the moving joints.
    fixed=[o for o in scene.objects if o.name=='hull' or o.name.startswith(('gearMount_','doorHinges_'))]
    bpy.ops.object.select_all(action='DESELECT')
    for o in fixed: o.select_set(True)
    bpy.context.view_layer.objects.active=bpy.data.objects['hull']
    bpy.ops.object.join()
    # Regression: thin lower-hull welds must not be coplanar with the white skin.
    h=bpy.data.objects['hull'].data
    for face in h.polygons:
        if h.materials[face.material_index]==seam and 8.9<face.center.z<13.1:
            assert all(math.hypot(h.vertices[v].co.x,h.vertices[v].co.y)>4.501 for v in face.vertices), 'coplanar lower hull seam'
    finish_atlas(scene,palette)
    bpy.context.view_layer.update()
    lo,hi=world_bounds()
    tris=tris_count()
    file=OUT/('hls-v2-far.glb' if far else 'hls-v2.glb')
    for o in scene.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,use_active_scene=True,
                             export_apply=True,export_yup=True,export_extras=True)
    info={'file':str(file.relative_to(ROOT)),'bytes':file.stat().st_size,'triangles':tris,
          'boundsBlender':{'min':list(lo),'max':list(hi)},'meshObjects':len([o for o in scene.objects if o.type=='MESH'])}
    end_build(mid)
    # Remove our atlas materials/images, after this independent export only.
    for image in list(bpy.data.images):
        if image.name.startswith('hls-palette'): bpy.data.images.remove(image)
    for material in list(bpy.data.materials):
        if material.name.startswith('HLS_ReferenceAtlas'): bpy.data.materials.remove(material)
    return info

report={'source':'NASA/SpaceX 07-24-25 surface concept, published Oct 2026','near':build(),'far':build(True)}
REPORT.write_bytes(json.dumps(report,indent=2).encode('utf8'))
print('HLS_REVIEW_METRICS',json.dumps(report))
