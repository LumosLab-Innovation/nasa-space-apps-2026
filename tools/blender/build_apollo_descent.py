import bpy, sys
from mathutils import Vector
from pathlib import Path
# Usage: blender --background --factory-startup --python tools/blender/build_apollo_descent.py -- ORIGINAL.glb OUTPUT.glb
args=sys.argv[sys.argv.index('--')+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(args[0]).resolve()))
keep=[]
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':continue
 v=[o.matrix_world@Vector(c) for c in o.bound_box]
 if max(c.z for c in v)<=2.424 or o.name in ['pCube3','pCylinde11','pCylinder2']:
  matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=matrix
  for p in o.data.vertices:p.co=o.matrix_world@p.co
  o.matrix_world.identity()
  for p in o.data.vertices:p.co=Vector((p.co.x*1.46,p.co.y*1.46,(p.co.z-.1026)*1.46))
  o.name='NASA_Eagle_'+o.name.replace(' ','_');keep.append(o)
 else:bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.context.scene.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
# Join by material on export, keep original texture/UV data; no decoder dependency.
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=keep[0]
bpy.ops.object.join()
bpy.context.object.name='Eagle_Descent_Stage_NASA'
for m in bpy.data.materials:
 if m.use_nodes:
  bs=m.node_tree.nodes.get('Principled BSDF')
  if bs:
   bs.inputs['Metallic'].default_value=.12
   bs.inputs['Roughness'].default_value=.65
out=Path(args[1]).resolve()
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_draco_mesh_compression_enable=False,export_image_format='AUTO')
print('OUTPUT',out.stat().st_size,'vertices',len(bpy.context.object.data.vertices),'faces',len(bpy.context.object.data.polygons))
