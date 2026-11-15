"""AxEMU game reconstruction with skin and authored clips; not NASA flight CAD.
Run: blender --background --python tools/blender/build_axemu.py
Exports only the tagged build scene; never saves a user's .blend.
"""
import bpy, bmesh, math
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.kdtree import KDTree
import numpy as np
exec(compile((Path(__file__).parent/'common.py').read_text(),'common.py','exec'))
OUT=str(Path(__file__).resolve().parents[2]/'public/models/astronaut.glb')
# Shared bind offset keeps sleeves clear of the ribcage below the shoulder seam.
ARM_X=.325
WRIST_X=.38
ELBOW_X=ARM_X+(WRIST_X-ARM_X)*(.30/.57)
begin_build('astronaut')
WHITE=mat('Suit_White',(.84,.83,.78),0,.88)
LEGS=mat('Suit_Legs',(.81,.81,.77),0,.9)
BOOTS=mat('Suit_Boots',(.29,.32,.32),.04,.88)
GOLD=mat('Visor_Gold',(.65,.43,.13),.86,.22)
PLSS=mat('PLSS',(.79,.8,.77),.08,.67)
JOINT=mat('Suit_Joint',(.35,.39,.4),.72,.45)
DARK=mat('Suit_Dark',(.035,.046,.05),.02,.83)
SEAM=mat('Suit_Seams',(.60,.60,.56),0,.96)
SCREEN=mat('Suit_Screen',(.035,.13,.18),.2,.36,emission=(.08,.18,.21),strength=.2)
LAMP=mat('Suit_Lamp',(.8,.9,.95),.05,.25,emission=(.6,.72,.8),strength=1)
# Embedded subtle fabric maps, with no bright glitter or unexportable procedural shader.
size=1024; yy,xx=np.mgrid[0:size,0:size]; rng=np.random.default_rng(410)
grain=rng.normal(0,.009,(size,size)); weave=.006*np.sin(xx*math.pi/2)*np.sin(yy*math.pi/2)
color=np.ones((size,size,4),dtype=np.float32)
for k,c in enumerate((.89,.88,.84)):color[:,:,k]=np.clip(c+grain+weave,0,1)
image=bpy.data.images.new('AxEMU_woven_cover',size,size);image[TAG]='astronaut'
image.pixels.foreach_set(color.ravel());image.pack()
normal=np.ones((size,size,4),dtype=np.float32)
normal[:,:,0]=.5+.025*np.sin(xx*math.pi/2);normal[:,:,1]=.5+.025*np.sin(yy*math.pi/2)
nimage=bpy.data.images.new('AxEMU_weave_normal',size,size);nimage[TAG]='astronaut';nimage.colorspace_settings.name='Non-Color'
nimage.pixels.foreach_set(normal.ravel());nimage.pack()
for m in (WHITE,LEGS):
    nodes,links=m.node_tree.nodes,m.node_tree.links;bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    tx=nodes.new('ShaderNodeTexImage');tx.image=image;nt=nodes.new('ShaderNodeTexImage');nt.image=nimage
    nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.28
    links.new(tx.outputs['Color'],bs.inputs['Base Color']);links.new(nt.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],bs.inputs['Normal'])
root=obj('astro_root');ad=bpy.data.armatures.new('AxEMU_Skeleton');ad[TAG]='astronaut'
rig=bpy.data.objects.new('AxEMU_Rig',ad);rig[TAG]='astronaut';STATE['scene'].collection.objects.link(rig);rig.parent=root
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
def bone(name,at,parent=None):
    b=ad.edit_bones.new(name);b.head=at;b.tail=Vector(at)+Vector((0,.045,0))
    if parent:b.parent=ad.edit_bones[parent]
    b.use_deform=True
bone('pelvis',(0,0,1.0));bone('spine',(0,0,1.08),'pelvis');bone('neck',(0,0,1.58),'spine')
for side,sx in [('L',1),('R',-1)]:
    bone('clavicle_'+side,(.18*sx,0,1.48),'spine')
    bone('upperArm_'+side,(ARM_X*sx,0,1.50),'clavicle_'+side);bone('foreArm_'+side,(ELBOW_X*sx,0,1.20),'upperArm_'+side)
    bone('wrist_'+side,(WRIST_X*sx,0,.93),'foreArm_'+side);bone('thigh_'+side,(.13*sx,0,.94),'pelvis')
    bone('shin_'+side,(.13*sx,0,.53),'thigh_'+side);bone('ankle_'+side,(.13*sx,0,.13),'shin_'+side)
    bone('toe_'+side,(.13*sx,-.12,.055),'ankle_'+side)
    for f in range(5):
        x=WRIST_X*sx+(f-1.5)*.021
        bone('finger%d_%s'%(f,side),(x,-.015,.85),'wrist_'+side)
        bone('fingerTip%d_%s'%(f,side),(x,-.035,.815),'finger%d_%s'%(f,side))
bpy.ops.object.mode_set(mode='OBJECT')
def attach(name,part,bone_name,at,bevel=0):
    o=obj(name,part,None,bevel=bevel)
    # Skinned export cannot globally apply modifiers. Bake rigid equipment bevels
    # here; otherwise rounded pouches/controls export as sharp toy-like boxes.
    if bevel:
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    o.parent=rig;o.parent_type='BONE';o.parent_bone=bone_name
    bpy.context.view_layer.update();o.matrix_world=Matrix.Translation(at)
    for p in o.data.polygons if o.type=='MESH' else []:p.use_smooth=True
    return o
def skin(name,verts,faces,weights,material,uvs):
    me=bpy.data.meshes.new(name);me[TAG]='astronaut';me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);o[TAG]='astronaut';STATE['scene'].collection.objects.link(o);o.parent=rig;me.materials.append(material)
    groups={n:o.vertex_groups.new(name=n) for n in {n for w in weights for n in w}}
    for i,w in enumerate(weights):
        total=sum(w.values())
        for n,value in w.items():
            if value>0:groups[n].add([i],value/total,'REPLACE')
    uv=me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        poly.use_smooth=True
        for li in poly.loop_indices:uv.data[li].uv=uvs[me.loops[li].vertex_index]
    mod=o.modifiers.new('AxEMU skin','ARMATURE');mod.object=rig
    return o
def ease(v):
    t=max(0,min(1,v));return t*t*(3-2*t)
def soft_limb(name,x,ztop,zbottom,profile,joints,material,splay=0):
    count,seg=52,32;verts,faces,weights,uvs=[],[],[],[]
    center_x=lambda z:x+math.copysign(splay,x)*max(0,min(1,(1.50-z)/.57))
    for r in range(count+1):
        t=r/count;z=ztop+(zbottom-ztop)*t;rad=profile[-1][1]
        for i in range(1,len(profile)):
            if t<=profile[i][0]:
                a,b=profile[i-1],profile[i];k=ease((t-a[0])/(b[0]-a[0]));rad=a[1]+(b[1]-a[1])*k;break
        w={joints[0][0]:1.0}
        for parent,child,jz,half in joints[1:]:
            k=ease((jz+half-z)/(2*half))
            if k>0:w={n:v*(1-k) for n,v in w.items()};w[child]=k
        for j in range(seg+1):
            a=j/seg*2*math.pi;fold=.0018*math.sin(t*22+2*math.sin(a*2))+.0008*math.sin(t*47+a*3)
            if any(abs(z-q[2])<.08 for q in joints[1:]):fold+=.0025*math.sin(t*65+a)
            rr=rad+fold;verts.append((center_x(z)+math.cos(a)*rr,math.sin(a)*rr*.91,z));weights.append(dict(w));uvs.append((j/seg,t*1.6))
            if r<count and j<seg:
                p=r*(seg+1)+j;faces.append((p+seg+1,p+seg+2,p+1,p))
    for ring,z,up in [(0,ztop,True),(count,zbottom,False)]:
        center=len(verts);verts.append((center_x(z),0,z));weights.append(dict(weights[ring*(seg+1)]));uvs.append((.5,.5))
        for j in range(seg):
            a=ring*(seg+1)+j;faces.append((center,a,a+1) if up else (center,a+1,a))
    return skin(name,verts,faces,weights,material,uvs)
# Soft waist and adult pressure-torso silhouette.
verts,faces,weights,uvs=[],[],[],[]
profiles=[(.94,.19,.13),(1.0,.20,.14),(1.08,.20,.14),(1.16,.20,.16),(1.30,.205,.17),(1.36,.21,.17),(1.42,.255,.16),(1.49,.25,.14),(1.575,.157,.13)]
for i in range(43):
    z=.94+.635*i/42
    for k in range(1,len(profiles)):
        if z<=profiles[k][0]+1e-6:
            a,b=profiles[k-1],profiles[k];t=ease((z-a[0])/(b[0]-a[0]));rx=a[1]+(b[1]-a[1])*t;ry=a[2]+(b[2]-a[2])*t;break
    for j in range(49):
        a=j/48*2*math.pi;wrinkle=.0025*math.sin(z*60+math.sin(a*3))*max(0,1-(z-1.0)*4)
        verts.append(((rx+wrinkle)*math.cos(a),(ry+wrinkle)*math.sin(a),z));s=ease((z-1.0)/.16);weights.append({'pelvis':1-s,'spine':s});uvs.append((j/48,i/42))
        if i<42 and j<48:
            n=i*49+j;faces.append((n,n+1,n+50,n+49))
skin('AxEMU_cover',verts,faces,weights,WHITE,uvs);attach('torso',None,'spine',(0,0,1.08))
for side,sx in [('L',1),('R',-1)]:
    soft_limb('sleeve_'+side,ARM_X*sx,1.545,.91,[(0,.008),(.1,.075),(.20,.101),(.4,.09),(.58,.095),(.76,.085),(1,.072)],[('upperArm_'+side,),('upperArm_'+side,'foreArm_'+side,1.20,.075),('foreArm_'+side,'wrist_'+side,.94,.035)],WHITE,WRIST_X-ARM_X)
    soft_limb('trouser_'+side,.13*sx,.99,.115,[(0,.133),(.16,.13),(.44,.112),(.56,.115),(.76,.105),(1,.096)],[('thigh_'+side,),('thigh_'+side,'shin_'+side,.53,.085),('shin_'+side,'ankle_'+side,.16,.04)],LEGS)
    # Identification bands are dyed into the deforming cover, not floating rings.
    cuff=P();cyl(cuff,.077,.03,m=JOINT,segs=32);cyl(cuff,.079,.008,at=(0,0,.018),m=DARK,segs=32);attach('wristBearing_'+side,cuff,'wrist_'+side,(WRIST_X*sx,0,.935))
    palm=P();sphere(palm,.065,at=(0,-.01,-.045),scale=(.85,.65,1.12),m=WHITE,segs=24,rings=14);attach('glove_'+side,palm,'wrist_'+side,(WRIST_X*sx,0,.93))
    for f in range(5):
        part=P();x=(f-1.5)*.021
        if f<4:
            rod(part,(0,0,0),(0,-.012,-.035),.012,m=WHITE,segs=12);sphere(part,.012,at=(0,-.012,-.035),m=BOOTS,segs=12,rings=8)
        else:rod(part,(-.015*sx,-.02,.015),(-.035*sx,-.045,-.01),.015,m=WHITE,segs=12)
        attach('digit%d_%s'%(f,side),part,'finger%d_%s'%(f,side),(WRIST_X*sx+x,-.015,.85))
    bt=P();sphere(bt,.1,at=(0,-.04,-.035),scale=(.98,1.64,.85),m=LEGS,segs=28,rings=16)
    box(bt,(.196,.30,.038),at=(0,-.045,-.105),m=BOOTS)
    for k in range(8):box(bt,(.19,.018,.012),at=(0,-.17+k*.036,-.125),m=DARK)
    cyl(bt,.099,.045,at=(0,0,.008),m=PLSS,segs=28);attach('boot_'+side,bt,'ankle_'+side,(.13*sx,0,.13),.012)
    attach('toolSocket_'+side,None,'wrist_'+side,(WRIST_X*sx,-.035,.865))
pack=P();box(pack,(.40,.25,.57),m=PLSS);box(pack,(.34,.022,.47),at=(0,.132,0),m=WHITE)
for z in [-.19,-.11,.17]:box(pack,(.28,.012,.015),at=(0,.15,z),m=DARK)
for sx in [-1,1]:rod(pack,(.16*sx,.14,-.19),(.16*sx,.14,.20),.013,m=JOINT,segs=10)
box(pack,(.15,.025,.09),at=(0,.15,.025),m=DARK);attach('plss',pack,'spine',(0,.25,1.28),.035)
chest=P();box(chest,(.23,.066,.145),m=PLSS);box(chest,(.1,.012,.055),at=(.04,-.04,.025),m=SCREEN)
for x in [-.075,-.035]:cyl(chest,.014,.01,at=(x,-.04,-.027),axis='Y',m=JOINT,segs=12)
attach('chestController',chest,'spine',(0,-.174,1.31),.018)
pouch=P();sphere(pouch,.10,scale=(.78,.47,1),m=WHITE,segs=28,rings=18)
box(pouch,(.133,.018,.055),at=(0,-.043,.048),m=WHITE);box(pouch,(.018,.011,.052),at=(0,-.057,.025),m=SEAM)
attach('samplePouch',pouch,'pelvis',(-.17,-.16,.97),.009)
# Waist utility ports, protected connector rims and restrained panel hardware.
ports=P()
for x in [-.075,.075]:
    cyl(ports,.026,.017,at=(x,-.151,1.075),axis='Y',m=DARK,segs=20)
    cyl(ports,.019,.021,at=(x,-.157,1.075),axis='Y',m=JOINT,segs=20)
    box(ports,(.031,.008,.01),at=(x,-.174,1.075),m=PLSS)
attach('waistConnectors',ports,'pelvis',(0,0,0),.003)
hp=P();sphere(hp,.193,at=(0,0,.14),scale=(1.05,1.08,1.0),m=WHITE,segs=40,rings=24)
cyl(hp,.16,.028,at=(0,0,.002),m=JOINT,segs=40);cyl(hp,.159,.013,at=(0,0,-.016),m=DARK,segs=40)
attach('helmet',hp,'neck',(0,0,1.58))
for name,radius,material,ycut in [('visorSeal',.199,DARK,-.055),('visor',.202,GOLD,-.078)]:
    p=P();result=bmesh.ops.create_uvsphere(p['bm'],u_segments=48,v_segments=28,radius=radius)
    bmesh.ops.delete(p['bm'],geom=[v for v in result['verts'] if v.co.y>ycut or v.co.z<-.09 or v.co.z>.105],context='VERTS')
    _finish(p,list(p['bm'].verts),material,Matrix.Translation((0,0,.14)) @ Matrix.Diagonal((1.05,1.08,1,1)));attach(name,p,'neck',(0,0,1.58))
for side,sx in [('L',1),('R',-1)]:
    lp=P();box(lp,(.05,.05,.035),m=PLSS);cyl(lp,.014,.008,at=(0,-.03,0),axis='Y',m=LAMP,segs=16);attach('lamp_'+side,lp,'neck',(.166*sx,-.07,1.825),.008)
# Fuse the coverall before skinning. Separate capped tubes leave visible gaps
# at shoulders/hips even if their elbow/knee weights are smooth.
cloth=[o for o in STATE['scene'].objects if o.name=='AxEMU_cover' or o.name.startswith(('sleeve_','trouser_'))]
samples=[]
for o in cloth:
    names={g.index:g.name for g in o.vertex_groups}
    for v in o.data.vertices:
        samples.append((v.co.copy(),{names[g.group]:g.weight for g in v.groups}))
    o.modifiers.clear()
    bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='DESELECT')
for o in cloth:o.select_set(True)
cover=next(o for o in cloth if o.name=='AxEMU_cover');bpy.context.view_layer.objects.active=cover
bpy.ops.object.join()
remesh=cover.modifiers.new('Weld sewn coverall','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.008;remesh.use_smooth_shade=True
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=cover.modifiers.new('Relax cloth seams','SMOOTH');smooth.factor=.7;smooth.iterations=5
bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate=cover.modifiers.new('Game cloth budget','DECIMATE');decimate.ratio=.22
bpy.ops.object.modifier_apply(modifier=decimate.name)
# Assert real welded connectivity, not just several objects joined under one name.
bm=bmesh.new();bm.from_mesh(cover.data);unseen=set(bm.verts);components=[]
while unseen:
    stack=[unseen.pop()];count=0
    while stack:
        v=stack.pop();count+=1
        for e in v.link_edges:
            other=e.other_vert(v)
            if other in unseen:unseen.remove(other);stack.append(other)
    components.append(count)
bm.free();assert len(components)==1,('Disconnected coverall',components)
# Transfer nearby skin influences, then relax across the welded seams. This
# distributes shoulder/hip rotation across fabric instead of exposing rigid caps.
tree=KDTree(len(samples))
for i,(co,w) in enumerate(samples):tree.insert(co,i)
tree.balance();weights=[]
for v in cover.data.vertices:
    w={}
    for co,i,d in tree.find_n(v.co,6):
        for n,value in samples[i][1].items():w[n]=w.get(n,0)+value/max(.002,d)**2
    total=sum(w.values());weights.append({n:value/total for n,value in w.items()})
neighbors=[[] for _ in cover.data.vertices]
for e in cover.data.edges:
    a,b=e.vertices;neighbors[a].append(b);neighbors[b].append(a)
for _ in range(12):
    relaxed=[]
    for i,w in enumerate(weights):
        out={n:value*.55 for n,value in w.items()}
        for j in neighbors[i]:
            for n,value in weights[j].items():out[n]=out.get(n,0)+value*.45/len(neighbors[i])
        relaxed.append(out)
    weights=relaxed
cover.vertex_groups.clear();groups={b.name:cover.vertex_groups.new(name=b.name) for b in ad.bones}
for i,w in enumerate(weights):
    strongest=sorted(w.items(),key=lambda x:x[1],reverse=True)[:4];total=sum(value for _,value in strongest)
    for n,value in strongest:groups[n].add([i],value/total,'REPLACE')
cover.data.materials.clear();cover.data.materials.append(WHITE)
for p in cover.data.polygons:p.material_index=0;p.use_smooth=True
# Rebuild UVs after remeshing; keep the woven fabric embedded and game-ready.
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=.012)
bpy.ops.object.mode_set(mode='OBJECT')
# Bake garment panel boundaries in UV space instead of selecting coarse mesh
# faces: the dyed bands and stitched knee patches must not have jagged edges.
atlas=color.copy();me=cover.data;me.calc_loop_triangles();uv=me.uv_layers.active.data
def ramp(value,lo,hi):
    t=np.clip((value-lo)/(hi-lo),0,1);return t*t*(3-2*t)
for tri in me.loop_triangles:
    coords=np.array([uv[i].uv[:] for i in tri.loops])*size-.5
    lo=np.maximum(0,np.floor(coords.min(axis=0)).astype(int));hi=np.minimum(size-1,np.ceil(coords.max(axis=0)).astype(int))
    if np.any(hi<lo):continue
    py,px=np.mgrid[lo[1]:hi[1]+1,lo[0]:hi[0]+1];a,b,c=coords
    den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(den)<1e-8:continue
    w0=((b[1]-c[1])*(px-c[0])+(c[0]-b[0])*(py-c[1]))/den
    w1=((c[1]-a[1])*(px-c[0])+(a[0]-c[0])*(py-c[1]))/den;w2=1-w0-w1
    mask=(w0>=-.035)&(w1>=-.035)&(w2>=-.035)
    points=np.array([me.vertices[i].co[:] for i in tri.vertices]);pos=w0[...,None]*points[0]+w1[...,None]*points[1]+w2[...,None]*points[2]
    x,y,z=pos[...,0],pos[...,1],pos[...,2];ax=np.abs(x)
    rgb=color[py,px,:3].copy()
    def tint(amount,tone):
        rgb[:]=rgb*(1-amount[...,None])+np.array(tone)*amount[...,None]
    band=ramp(ax,.23,.24)*ramp(z,1.376,1.379)*(1-ramp(z,1.397,1.400))
    tint(band,(.50,.07,.055))
    knee=((ax-.13)/.080)**2+((z-.55)/.115)**2
    elbow=((z-1.205)/.105)**2+(y/.078)**2
    front=1-ramp(y,-.065,-.055);outer=ramp(ax,.327,.338)
    pad=np.maximum((1-ramp(knee,.97,1.03))*front,(1-ramp(elbow,.97,1.03))*outer)
    tint(pad,(.40,.43,.43))
    stitch=np.maximum((1-ramp(np.abs(knee-1.09),.025,.065))*front,(1-ramp(np.abs(elbow-1.09),.025,.065))*outer)
    tint(stitch*(.55+.45*np.sin(z*580)**2),(.64,.63,.59))
    seams=(1-ramp(np.abs(ax-.15),.001,.003))*front*ramp(z,1.125,1.14)*(1-ramp(z,1.42,1.44))
    waist=(1-ramp(np.abs(z-1.003),.002,.004))*(1-ramp(y,-.095,-.08))
    tint(np.maximum(seams,waist)*.65,(.56,.55,.51))
    atlas[py[mask],px[mask],:3]=rgb[mask]
panel_image=bpy.data.images.new('AxEMU_stitched_panels',size,size);panel_image[TAG]='astronaut'
# Fine weave already lives in the shared normal map; quantize albedo noise to
# avoid paying another megabyte for imperceptible random colour variation.
atlas[:,:,:3]=np.round(atlas[:,:,:3]*127)/127
panel_image.pixels.foreach_set(atlas.ravel());panel_image.pack()
fabric=WHITE.copy();fabric.name='Suit_Coverall';fabric[TAG]='astronaut'
for node in fabric.node_tree.nodes:
    if node.type=='TEX_IMAGE' and node.image==image:node.image=panel_image
cover.data.materials[0]=fabric
mod=cover.modifiers.new('AxEMU skin','ARMATURE');mod.object=rig
print('Connected coverall:',len(cover.data.vertices),'vertices, one welded shell')

# Authored in-place clips: animation never translates the world root.
def pose_keys(name,duration,keys):
    action=bpy.data.actions.new(name);action[TAG]='astronaut';rig.animation_data_create();rig.animation_data.action=action
    for time,params in keys:
        for pb in rig.pose.bones:pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
        rig.pose.bones['pelvis'].location.z=params.get('bob',0);rig.pose.bones['spine'].rotation_euler.x=params.get('spine',0);rig.pose.bones['neck'].rotation_euler.x=params.get('neck',0)
        for side in ['L','R']:
            for bn,key,sign in [('thigh','hip',-1),('shin','knee',1),('ankle','ankle',-1),('upperArm','shoulder',-1),('foreArm','elbow',-1),('wrist','wrist',-1)]:rig.pose.bones[bn+'_'+side].rotation_euler.x=sign*params.get(key+side,params.get(key,0))
        for pb in rig.pose.bones:pb.keyframe_insert('rotation_euler',frame=time*30,group=pb.name)
        rig.pose.bones['pelvis'].keyframe_insert('location',frame=time*30,group='pelvis')
    track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,action);strip.action_frame_start=0;strip.action_frame_end=duration*30;track.mute=True;rig.animation_data.action=None
idle={'elbow':.2,'shoulder':.03}
pose_keys('idle',4,[(0,idle),(2,{**idle,'spine':.012,'neck':-.008}),(4,idle)])
pose_keys('walk',1.4,[(i*.175,{**idle,'hipL':.34*math.sin(i*math.pi/4),'hipR':-.34*math.sin(i*math.pi/4),'kneeL':.14+.3*max(0,-math.sin(i*math.pi/4)),'kneeR':.14+.3*max(0,math.sin(i*math.pi/4)),'shoulderL':-.19*math.sin(i*math.pi/4),'shoulderR':.19*math.sin(i*math.pi/4)}) for i in range(9)])
low={**idle,'bob':-.40,'spine':.50,'neck':.10,'hip':.95,'knee':1.85,'ankle':.90,'shoulderR':.35,'elbowR':.9,'shoulderL':.10,'elbowL':.7}
pose_keys('collectSample',3.6,[(0,idle),(.35,{**idle,'bob':-.025,'spine':.06}),(.95,low),(1.4,{**low,'shoulderR':.62,'elbowR':.45}),(1.65,{**low,'shoulderR':.62,'elbowR':.45}),(2.3,{**low,'shoulderR':.25,'elbowR':1.38,'neck':.04}),(2.8,{**idle,'bob':-.10,'spine':.18,'hip':.4,'knee':.8,'ankle':.4,'shoulderR':.18,'elbowR':1.3}),(3.6,idle)])
work={**idle,'spine':.07,'shoulderL':.75,'elbowL':.8,'shoulderR':1.0,'elbowR':.65}
pose_keys('installModule',2.6,[(0,idle),(.28,{**idle,'shoulderL':.6,'elbowL':.8}),(.6,work),(1.2,{**work,'wristR':.22}),(1.8,{**work,'wristR':-.12}),(2.1,work),(2.35,{**idle,'shoulderL':.5,'elbowL':.6}),(2.6,idle)])
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
STATE['scene'].render.fps=30;STATE['scene'].frame_set(0);bpy.context.view_layer.update()
h=assert_height(1.85,1.95);print('AxEMU height %.3f m, %d triangles, %d bones'%(h,tris_count(),len(ad.bones)))
for o in STATE['scene'].objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=True)
print('Exported',OUT)
