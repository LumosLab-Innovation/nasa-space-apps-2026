# Orion public-reference visual model; dimensions/docking retained from the existing asset.
# Build with common.py in a background Blender process. Local Z runs from engine to docking nose.
OUT = r'C:/Users/ADMIN/Downloads/NASA_Hackathon/public/models/orion.glb'
begin_build('orion')
WHITE=mat('Orion_White',(.53,.55,.54),.02,.76)
SILVER=mat('Orion_Silver',(.40,.44,.48),.78,.48)
SHIELD=mat('Orion_HeatShield',(.19,.13,.09),.05,.85)
CELLS=mat('Orion_Cells',(.7,.7,.7),.32,.4)
DARK=mat('Orion_Dark',(.035,.045,.055),.15,.65)
FOIL=mat('Orion_Insulation',(.45,.44,.40),.62,.58)
ENGINE=mat('Orion_Engine',(.36,.40,.43),.72,.48)
INNER=mat('Orion_NozzleInterior',(.065,.075,.085),.25,.76)
GLASS=mat('Orion_Window',(.018,.032,.045),.45,.23)
SEG=48

# Embedded images keep asset loading atomic. Subtle low-frequency insulation, fine solar cells.
def texture(material,name,size,pixel,socket='Base Color',normal=False):
    im=bpy.data.images.new(name,width=size,height=size,alpha=False)
    im[TAG]='orion'
    if socket!='Base Color': im.colorspace_settings.name='Non-Color'
    im.pixels.foreach_set([v for y in range(size) for x in range(size) for v in (*pixel(x/size,y/size),1)])
    im.pack()
    nodes=material.node_tree.nodes
    tex=nodes.new('ShaderNodeTexImage');tex.image=im
    output=tex.outputs['Color']
    if normal:
        nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.45
        material.node_tree.links.new(output,nm.inputs['Color']);output=nm.outputs['Normal']
    material.node_tree.links.new(output,nodes.get('Principled BSDF').inputs[socket])
    return im

def cell(u,v):
    x=(u*10)%1;y=(v*16)%1
    if x<.035 or y<.04:return (.24,.29,.35)
    if x<.07 or x>.97:return (.065,.09,.14)
    if (u*80)%1<.10:return (.12,.17,.24)
    a=.012*math.sin(v*55)
    return (.025+a,.052+a,.115+a)
texture(CELLS,'Orion solar cells',512,cell)
def fold_height(u,v):
    # Periodic across U: wraps around the cylinder without a vertical texture seam.
    x=u*math.tau
    wave=math.sin(x*5+1.4*math.sin(v*18)+.5*math.sin(x*2-v*9))
    crease=math.tanh(2.5*math.sin(x*11+v*19+math.sin(v*31)))
    return .60*wave+.23*crease+.17*math.sin(x*17-v*36+math.sin(x*3+v*13))

def foil(u,v):
    f=.48+.025*fold_height(u,v)
    # Thin blanket joining tapes, subdued rather than dark graphic panel lines.
    seam=min((u*6)%1,1-(u*6)%1)<.022
    if seam:f+=.035
    return (f*1.025,f*1.015,f*.97)

def foil_normal(u,v):
    e=1/512
    dx=(fold_height(u+e,v)-fold_height(u-e,v))*.80
    dy=(fold_height(u,v+e)-fold_height(u,v-e))*.80
    n=Vector((-dx,-dy,1)).normalized()
    return tuple(.5+.5*c for c in n)

texture(FOIL,'Orion insulation satin',512,foil)
texture(FOIL,'Orion insulation normal',512,foil_normal,'Normal',True)
texture(FOIL,'Orion insulation roughness',256,lambda u,v:(.58+.055*fold_height(u,v),)*3,'Roughness')
texture(SILVER,'Orion brushed alloy roughness',256,
        lambda u,v:(.46+.035*math.sin(v*math.tau*92)+.025*math.sin(u*math.tau*3),)*3,'Roughness')

# Surface of revolution. Reversed inner profile and connected rim form a real hollow wall.
def lathe(p,profile,m,at=(0,0,0),direction=(0,0,1),segments=32):
    q=Vector((0,0,1)).rotation_difference(Vector(direction).normalized()).to_matrix()
    rings=[]
    for radius,z in profile:
        rings.append([p['bm'].verts.new(q@Vector((radius*math.cos(i*math.tau/segments),radius*math.sin(i*math.tau/segments),z))+Vector(at)) for i in range(segments)])
    for k in range(len(rings)-1):
        for i in range(segments):
            f=p['bm'].faces.new((rings[k][i],rings[k][(i+1)%segments],rings[k+1][(i+1)%segments],rings[k+1][i]));f.material_index=_slot(p,m)

def hoop(p,r,z,m,t=.025,at=(0,0,0),direction=(0,0,1),segments=32):
    lathe(p,[(r+t,z-t),(r+t,z+t),(r-t,z+t),(r-t,z-t),(r+t,z-t)],m,at,direction,segments)

def nozzle(p,at,scale=1,direction=(0,0,-1),segments=32):
    # z goes OUT from mount toward exhaust. Broad exit at z=1.45; throat hidden deep inside.
    outer=[(.21,0),(.24,.22),(.27,.38),(.36,.68),(.51,1.04),(.70,1.40),(.72,1.45)]
    inner=[(.69,1.45),(.67,1.40),(.48,1.04),(.33,.68),(.24,.38),(.17,.24),(.10,.12)]
    lathe(p,[(r*scale,z*scale) for r,z in outer],ENGINE,at,direction,segments)
    lathe(p,[(r*scale,z*scale) for r,z in [outer[-1]]+inner],INNER,at,direction,segments)
    for r,z in ([(.245,.20),(.37,.69),(.715,1.43)] if scale>=.2 else [(.715,1.43)]):
        hoop(p,r*scale,z*scale,SILVER,.015*scale,at,direction,segments)
    # Small closed throat, far behind the wide open mouth.
    d=Vector(direction).normalized();rod(p,Vector(at)+d*.06*scale,Vector(at)+d*.13*scale,.10*scale,m=DARK,segs=segments)

def quad(p,corners,m):
    vs=[p['bm'].verts.new(v) for v in corners];f=p['bm'].faces.new(vs);f.material_index=_slot(p,m)
    uv=p['bm'].loops.layers.uv.verify()
    for l,co in zip(f.loops,[(0,0),(1,0),(1,1),(0,1)]):l[uv].uv=co

def finish(name,p,parent,at=(0,0,0)):
    # Preserve analytic winding: open inner/outer shells are separate islands.
    # Automatic volume-based recalculation can incorrectly invert the outer bell.
    # Cylinders from common.py have no authored UVs. Map blanket/alloy surfaces
    # explicitly so the new maps cover the body instead of sampling one texel.
    uv=p['bm'].loops.layers.uv.verify()
    for f in p['bm'].faces:
        material=p['slots'][f.material_index]
        if material not in (FOIL,SILVER):continue
        f.normal_update()
        if name in ('service_module','crew_module') and abs(f.normal.z)<.85:
            us=[(math.atan2(l.vert.co.y,l.vert.co.x)/math.tau)%1 for l in f.loops]
            if max(us)-min(us)>.5:us=[u+1 if u<.5 else u for u in us]
            for l,u in zip(f.loops,us):l[uv].uv=(u,(l.vert.co.z+2)/4 if name=='service_module' else (l.vert.co.z-2.25)/3.3)
        else:
            axis=max(range(3),key=lambda i:abs(f.normal[i]))
            axes=[i for i in range(3) if i!=axis]
            for l in f.loops:l[uv].uv=tuple(l.vert.co[i]/4+.5 for i in axes)
    o=obj(name,p,parent,at)
    for face in o.data.polygons:face.use_smooth=True
    o.data.set_sharp_from_angle(angle=math.radians(32))
    return o

root=obj('orion_root')
sm=P()
cyl(sm,2,4,m=FOIL,segs=SEG)
cyl(sm,2.03,.45,at=(0,0,1.78),m=SILVER,segs=SEG)
cyl(sm,2.025,.12,at=(0,0,-1.965),m=DARK,segs=SEG)
# Body seams and broad radiator tiles: actual shallow surfaces, no coplanar decals.
for z in (-1.85,1.48,1.96):hoop(sm,2.025,z,SILVER,.018,segments=48)
for k in range(8):
    a=k*math.tau/8+math.pi/8;rot=Matrix.Rotation(a+math.pi/2,4,'Z')
    c=Vector((2.025*math.cos(a),2.025*math.sin(a),-.12))
    box(sm,(1.30,.065,2.65),at=c,m=DARK,rot=rot)
    for row in range(6):
        box(sm,(1.25,.025,.414),at=c+Vector((.04*math.cos(a),.04*math.sin(a),-1.08+row*.433)),m=WHITE,rot=rot)
    for z in (-1.57,1.25):
        corners=[c+rot@Vector(v) for v in [(-.55,-.045,z+.12),(.55,-.045,z+.12),(.55,-.045,z+.32),(-.55,-.045,z+.32)]]
        quad(sm,corners,FOIL)
service=finish('service_module',sm,root)
# Recessed aft bulkhead with structural spokes, brackets, rings and eight auxiliary nozzles.
aft=P();cyl(aft,1.93,.08,at=(0,0,-2.055),m=FOIL,segs=48)
hoop(aft,1.90,-2.12,SILVER,.045,segments=48)
hoop(aft,.43,-2.13,SILVER,.035)
for k in range(8):
    a=k*math.tau/8+math.pi/8;ca,sa=math.cos(a),math.sin(a)
    rod(aft,(.48*ca,.48*sa,-2.13),(1.80*ca,1.80*sa,-2.13),.026,m=SILVER)
    x,y=1.46*ca,1.46*sa
    cyl(aft,.20,.13,at=(x,y,-2.15),m=SILVER,segs=16)
    nozzle(aft,(x,y,-2.20),.26,segments=8)
    rod(aft,(x,y,-2.11),(.82*ca,.82*sa,-2.16),.022,m=ENGINE)
finish('aft_structure',aft,service)
# Six attitude-control pods, each with four small open nozzles (24 total).
rcs=P()
for k in range(6):
    a=k*math.tau/6;rad=Vector((math.cos(a),math.sin(a),0));t=Vector((-math.sin(a),math.cos(a),0));c=rad*2.05+Vector((0,0,-1.35))
    rot=Matrix.Rotation(a+math.pi/2,4,'Z')
    box(rcs,(.40,.24,.38),at=c,m=FOIL,rot=rot)
    for side in (-1,1):
        nozzle(rcs,c+t*.22*side,.12,direction=t*side,segments=8)
        nozzle(rcs,c+rad*.11+Vector((0,0,.20*side)),.12,direction=(0,0,side),segments=8)
finish('attitude_thrusters',rcs,service)
cm=P()
cyl(cm,2.51,.25,at=(0,0,2.125),m=SHIELD,segs=SEG)
cyl(cm,2.50,3.3,at=(0,0,3.9),m=FOIL,segs=SEG,radius2=.85)
hoop(cm,2.49,2.28,WHITE,.025,segments=48)
for k in range(12):
    a=k*math.tau/12
    rod(cm,(2.48*math.cos(a),2.48*math.sin(a),2.31),(.92*math.cos(a),.92*math.sin(a),5.43),.010,m=DARK,segs=6)
for k in range(4):
    a=-math.pi/2+(k-1.5)*.45;rot=Matrix.Rotation(a+math.pi/2,4,'Z')@Matrix.Rotation(math.radians(-27),4,'X')
    c=Vector((1.54*math.cos(a),1.54*math.sin(a),4.20))
    box(cm,(.39,.12,.33),at=c,m=WHITE,rot=rot)
    box(cm,(.30,.035,.24),at=c+Vector((.075*math.cos(a),.075*math.sin(a),.035)),m=GLASS,rot=rot)
# Hatch on the backshell, shallow geometry fitted to cone slope.
a=math.pi/2;rot=Matrix.Rotation(a+math.pi/2,4,'Z')@Matrix.Rotation(math.radians(-27),4,'X')
box(cm,(.72,.07,.98),at=(0,1.92,3.48),m=DARK,rot=rot)
box(cm,(.65,.09,.90),at=(0,1.95,3.50),m=WHITE,rot=rot)
cyl(cm,.85,.2,at=(0,0,5.65),m=WHITE,segs=32)
cyl(cm,.6,.18,at=(0,0,5.84),m=SILVER,segs=32)
cyl(cm,.45,.05,at=(0,0,5.95),m=DARK,segs=32)
for z,r in [(5.58,.85),(5.76,.66),(5.93,.49)]:hoop(cm,r,z,SILVER,.025)
for k in range(8):
    a=k*math.tau/8;cyl(cm,.035,.035,at=(.73*math.cos(a),.73*math.sin(a),5.77),m=DARK,segs=6)
finish('crew_module',cm,service)
en=P();nozzle(en,(0,0,-2.19),segments=48)
# Main engine mounting collar and three mechanical support links terminate at the flange.
hoop(en,.27,-2.22,SILVER,.045,segments=48)
for k in range(3):
    a=k*math.tau/3;ca,sa=math.cos(a),math.sin(a)
    rod(en,(.43*ca,.43*sa,-2.13),(.28*ca,.28*sa,-2.54),.032,m=SILVER)
finish('engine',en,service)
for i in range(4):
    a=math.pi/4+i*math.pi/2;rot=Matrix.Rotation(a,4,'Z');p=P()
    rod(p,(0,0,0),(.70*math.cos(a),.70*math.sin(a),0),.075,m=SILVER)
    cyl(p,.13,.18,at=(0,0,0),m=DARK,segs=16)
    for j in range(3):
        c=.6+1.2+j*2.45;center=Vector((c*math.cos(a),c*math.sin(a),0))
        box(p,(2.35,2,.065),at=center,m=SILVER,rot=rot)
        # Cell face at +/- .045 clears backing; quads have baked UVs on both sides.
        for side in (-1,1):
            corners=[center+rot@Vector(v) for v in [(-1.125,-.95,.045*side),(1.125,-.95,.045*side),(1.125,.95,.045*side),(-1.125,.95,.045*side)]]
            if side<0:corners.reverse()
            quad(p,corners,CELLS)
        if j<2:
            for offset in (-.72,.72):
                pos=center+rot@Vector((1.215,offset,0));box(p,(.15,.12,.10),at=pos,m=DARK,rot=rot)
    finish('wing_%d'%(i+1),p,service,at=(2*math.cos(a),2*math.sin(a),-.9))
h=assert_height(8.5,10.5)
print('orion height %.3f m, tris %d'%(h,tris_count()))
assert tris_count()<=25000
export_glb(OUT)
