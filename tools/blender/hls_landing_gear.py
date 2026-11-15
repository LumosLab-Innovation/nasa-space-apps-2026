"""Game reconstruction: rigid swing-up legs inside actual cylindrical hull cutouts."""
import math
from mathutils import Vector, Matrix
from common import P, box, cyl, rod, obj

R=4.5
HALF=.19
LOW=5.0
HIGH=15.6
BACK=3.5
PIVOT_R=3.95
PIVOT_Z=7.1
END=Vector((2.9,0,-6.85))
STOW=-math.pi+math.atan2(END.x,-END.z)
FOOT_FOLD=-math.pi/2-STOW

def angles(far):
    return sorted(set([i*math.tau/(48 if far else 96) for i in range((48 if far else 96)+1)]+
                      [(k*math.tau/6+s*HALF)%math.tau for k in range(6) for s in [-1,1]]))

def in_opening(a):
    return abs((a+math.pi/6)%(math.pi/3)-math.pi/6)<HALF-1e-6

def quad(p,coords,m,smooth=False):
    if m not in p['slots']:p['slots'].append(m)
    f=p['bm'].faces.new([p['bm'].verts.new(v) for v in coords])
    f.material_index=p['slots'].index(m);f.smooth=smooth

def point(r,a,z):return (r*math.cos(a),r*math.sin(a),z)

def hull_band(p,z0,z1,m,far,radius=R):
    aa=angles(far)
    for a,b in zip(aa,aa[1:]):
        if LOW-1e-6<=z0 and z1<=HIGH+1e-6 and in_opening((a+b)/2):continue
        quad(p,[point(radius,a,z0),point(radius,b,z0),point(radius,b,z1),point(radius,a,z1)],m,True)

def add_lower_hull(p,m,far):
    for a,b in zip([2.35,LOW,HIGH],[LOW,HIGH,17]):hull_band(p,a,b,m,far)

def add_hull_seam(p,z,m,far):
    hull_band(p,z,z+.009,m,far,R+.002)

def build_landing_gear(root,hull,lathe,materials,far):
    white,seam,black,steel,dark=materials
    legs=obj('legs',None,root)
    for i in range(6):
        a=i*math.tau/6;ca,sa=math.cos(a),math.sin(a)
        # Actual recess volume: back skin, two sides, sill and lintel. No outer skin across opening.
        p=P();steps=4 if far else 8
        aa=[a-HALF+2*HALF*j/steps for j in range(steps+1)]
        for b,c in zip(aa,aa[1:]):
            quad(p,[point(BACK,b,LOW),point(BACK,c,LOW),point(BACK,c,HIGH),point(BACK,b,HIGH)],black)
            quad(p,[point(R,b,LOW),point(R,c,LOW),point(BACK,c,LOW),point(BACK,b,LOW)],dark)
            quad(p,[point(BACK,b,HIGH),point(BACK,c,HIGH),point(R,c,HIGH),point(R,b,HIGH)],dark)
        for t in [a-HALF,a+HALF]:
            wall=[point(BACK,t,LOW),point(R,t,LOW),point(R,t,HIGH),point(BACK,t,HIGH)]
            quad(p,list(reversed(wall)) if t==a-HALF else wall,dark)
        cavity=obj('gearCavity_'+str(i),p,legs)
        inside=Vector(point(4,a,(LOW+HIGH)/2))
        assert all(face.normal.dot(inside-face.center)>0 for face in cavity.data.polygons),'cavity normals must face recess interior'
        cavity['azimuth']=a;cavity['halfAngle']=HALF;cavity['low']=LOW;cavity['high']=HIGH;cavity['backRadius']=BACK
        # Main hinge is physically supported by a fixed bracket tied to the recess back.
        socket=obj('gearSocket_'+str(i),None,legs,at=(PIVOT_R*ca,PIVOT_R*sa,PIVOT_Z));socket.rotation_euler.z=a
        mount=P()
        for y in [-.31,.31]:
            box(mount,(.48,.12,.48),at=(-.22,y,0),m=steel)
        cyl(mount,.15,.82,axis='Y',m=steel,segs=12)
        obj('gearMount_'+str(i),mount,socket)
        pivot=obj('legPivot_'+str(i),None,socket)
        pivot['stowAngleY']=STOW
        p=P()
        # All members follow the leg axis; the outer shoe has its own hinge.
        rod(p,(0,0,0),END,.17,m=dark,segs=8 if far else 12)
        rod(p,END*.62,END*.96,.125,m=steel,segs=8 if far else 12)
        for y in [-.25,.25]:
            rod(p,(0,y,0),END*.78+Vector((0,y,0)),.07,m=steel,segs=8)
            rod(p,END*.78+Vector((0,y,0)),END,.065,m=dark,segs=8)
        for t in [.23,.62,.78]:
            v=END*t
            rod(p,v+Vector((0,-.25,0)),v+Vector((0,.25,0)),.07,m=dark,segs=8)
        cyl(p,.22,.5,axis='Y',m=dark,segs=12)
        for y in [-.24,.24]:
            rod(p,END*.96+Vector((0,y,0)),END+Vector((0,y,0)),.085,m=steel,segs=8)
        cyl(p,.105,.65,at=END,axis='Y',m=steel,segs=12)
        obj('legMesh_'+str(i),p,pivot)
        foot=obj('footPivot_'+str(i),None,pivot,at=END);foot['foldAngleY']=FOOT_FOLD
        pad=P()
        box(pad,(1.4,1.05,.18),at=(0,0,-.145),m=dark)
        box(pad,(1.26,.94,.03),at=(0,0,-.235),m=black)
        for y in [-.24,.24]:box(pad,(.20,.10,.20),at=(0,y,-.045),m=steel)
        cyl(pad,.13,.40,axis='Y',m=steel,segs=12)
        obj('footMesh_'+str(i),pad,foot)
        # Longitudinal door hinge. Outer surface lies on the same R=4.5 cylinder.
        hinge=Vector(point(R,-HALF,LOW))
        door=obj('doorPivot_'+str(i),None,legs,at=(hinge.x*ca-hinge.y*sa,hinge.x*sa+hinge.y*ca,LOW))
        door.rotation_euler.z=a;door['openAngleZ']=-math.radians(110)
        shell=P();gap=.008
        bb=[-HALF+gap+(2*HALF-2*gap)*j/steps for j in range(steps+1)]
        rel=lambda r,t,z:Vector(point(r,t,z))-hinge
        for b,c in zip(bb,bb[1:]):
            quad(shell,[rel(R,b,LOW+.035),rel(R,c,LOW+.035),rel(R,c,HIGH-.035),rel(R,b,HIGH-.035)],white,True)
            quad(shell,[rel(R-.06,c,LOW+.035),rel(R-.06,b,LOW+.035),rel(R-.06,b,HIGH-.035),rel(R-.06,c,HIGH-.035)],dark)
            for z in [LOW+.035,HIGH-.035]:
                cap=[rel(R,b,z),rel(R-.06,b,z),rel(R-.06,c,z),rel(R,c,z)]
                quad(shell,cap if z==LOW+.035 else list(reversed(cap)),seam)
        for b in [bb[0],bb[-1]]:
            edge=[rel(R,b,LOW+.035),rel(R,b,HIGH-.035),rel(R-.06,b,HIGH-.035),rel(R-.06,b,LOW+.035)]
            quad(shell,edge if b==bb[0] else list(reversed(edge)),seam)
        # Flush access panels with subtle structural inner ribs; never a disappearing door.
        for z in [6,10,14.5]:
            rod(shell,rel(R-.07,bb[0]+.015,z),rel(R-.07,bb[-1]-.015,z),.025,m=steel,segs=6)
        obj('doorMesh_'+str(i),shell,door)
        fixed=P()
        for z in [6,10,14.5]:
            cyl(fixed,.065,.32,at=point(R-.02,a-HALF,z),m=steel,segs=8)
        obj('doorHinges_'+str(i),fixed,legs)
