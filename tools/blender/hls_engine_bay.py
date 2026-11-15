"""Raptor-inspired visual reconstruction. Not a certified HLS propulsion layout."""
import math
import bpy
from mathutils import Vector
from common import P, box, cyl, rod, obj

def append_part(target, part, offset):
    me=bpy.data.meshes.new('engine-work')
    part['bm'].to_mesh(me); part['bm'].free()
    mapping=[target['bm'].verts.new(v.co+Vector(offset)) for v in me.vertices]
    for poly in me.polygons:
        material=part['slots'][poly.material_index]
        if material not in target['slots']: target['slots'].append(material)
        face=target['bm'].faces.new([mapping[i] for i in poly.vertices])
        face.material_index=target['slots'].index(material);face.smooth=poly.use_smooth
    bpy.data.meshes.remove(me)

def build_engine_bay(root,lathe,steel,dark,black,liner,far):
    bay=P();segments=8 if far else 48
    # An actual opaque aft bulkhead, with a recessed face and perimeter load ring.
    cyl(bay,4.40,.18,at=(0,0,3.12),m=dark,segs=24 if far else 96)
    lathe(bay,[(2.90,4.35),(3.2,4.35),(3.2,4.44),(2.90,4.44),(2.90,4.35)],steel,24 if far else 96)
    lathe(bay,[(1.81,4.39),(3.18,4.39)],dark,24 if far else 96)
    for k in range(12):
        a=k*math.tau/12
        rod(bay,(3.7*math.cos(a),3.7*math.sin(a),3.0),(4.36*math.cos(a),4.36*math.sin(a),2.97),.055,m=steel,segs=6)
        if not far:cyl(bay,.055,.06,at=(4.18*math.cos(a),4.18*math.sin(a),2.89),m=steel,segs=6)
    # Three compact bells inboard, three larger vacuum bells outboard.
    for i in range(6):
        vacuum=i>=3;k=i%3;a=k*math.tau/3+(math.pi/3 if vacuum else 0)
        distance=2.8 if vacuum else 1.05;cx=distance*math.cos(a);cy=distance*math.sin(a)
        p=P()
        profile=([(0.65,1.36),(0.90,1.31),(1.20,1.17),(1.55,.94),(1.87,.66),(2.12,.43),(2.30,.27)] if vacuum else
                 [(1.02,.67),(1.23,.63),(1.48,.54),(1.70,.43),(1.90,.31),(2.08,.23)])
        if far:profile=[profile[0],profile[len(profile)//2],profile[-1]]
        if vacuum:
            split=1 if far else 3
            lathe(p,profile[:split+1],steel,segments)
            lathe(p,profile[split:],dark,segments)
        else:lathe(p,profile,dark,segments)
        # Reverse winding for the visible inner wall; close the throat deep inside.
        inner=[(z,r-.035) for z,r in reversed(profile)]
        lathe(p,inner,liner,segments)
        z,r=profile[0]
        lathe(p,[(z,r-.035),(z,r+.012),(z+.025,r+.012),(z+.025,r-.035)],steel,segments)
        tz,tr=profile[-1];cyl(p,tr-.035,.025,at=(0,0,tz+.015),m=black,segs=segments)
        # Compact chamber and injector stack, rather than invented busy external plumbing.
        lathe(p,[(tz,tr),(2.63,.28),(3.03,.21)] if far else [(tz,tr),(2.46,.29),(2.63,.28),(2.72,.21),(3.03,.21)],steel,segments)
        for h,radius in ([(2.67,.31)] if far else [(2.43,.32),(2.67,.31),(2.95,.29)]):
            lathe(p,[(h,radius),(h+.055,radius),(h+.055,radius-.04),(h,radius-.04)],dark,segments)
        # Turbopump bodies and two integrated curved feed runs.
        for sign in [-1,1]:
            cyl(p,.16,.32,at=(sign*.38,0,2.67),m=steel,segs=8 if far else 16)
            if not far:cyl(p,.20,.055,at=(sign*.38,0,2.81),m=dark,segs=16)
            points=[(sign*.38,0,2.59),(sign*.44,.05,2.43),(sign*.37,.12,2.27),(sign*.22,.16,tz+.06)]
            if far:points=[points[0],points[-1]]
            for start,end in zip(points,points[1:]):rod(p,start,end,.055,m=steel,segs=6 if far else 10)
        # Gimbal collar and short actuators fastened to the load frame.
        for k2 in range(3):
            t=k2*math.tau/3
            start=(.39*math.cos(t),.39*math.sin(t),2.48)
            end=(.65*math.cos(t),.65*math.sin(t),3.02)
            rod(p,start,end,.052,m=steel,segs=6)
            if not far:
                cyl(p,.065,.055,at=(.27*math.cos(t),.27*math.sin(t),2.99),m=steel,segs=6)
        if not far:
            # Subtle manufacturing seams on the vacuum extension, not glowing decoration.
            for j in [1,3]:
                z,r=profile[j]
                lathe(p,[(z,r+.002),(z+.008,r+.002)],steel,segments)
            if vacuum:
                # Restrained cooling-channel lines on the bright vacuum extension.
                for band in range(4):
                    z=.72+band*.20
                    j=next(j for j in range(len(profile)-1) if profile[j][0]<=z<=profile[j+1][0])
                    z0,r0=profile[j];z1,r1=profile[j+1];r=r0+(r1-r0)*(z-z0)/(z1-z0)
                    lathe(p,[(z,r+.003),(z+.006,r+.003)],dark,segments)
                for rib in range(32):
                    angle=rib*math.tau/32
                    lathe(p,[(z,r+.004) for z,r in profile[:4]],dark,1,angle,.006)
        append_part(bay,p,(cx,cy,0))
        anchor=obj('engineBell_'+str(i),None,root,at=(cx,cy,profile[0][0]))
        anchor['variant']='vacuum-inspired' if vacuum else 'compact-inspired'
    result=obj('engineBay',bay,root)
    result['reference']='SpaceX Starship Raptor sea/vacuum official visualizations; HLS layout reconstructed'
