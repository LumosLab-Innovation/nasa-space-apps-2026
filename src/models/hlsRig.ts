import { Constants, Matrix, Mesh, MeshBuilder, StandardMaterial, Color3, PBRMaterial, Quaternion, RawCubeTexture, Vector3, VertexData, TransformNode,
  type Scene, type ShadowGenerator } from '@babylonjs/core';
import { rcsNozzles, type ExhaustNozzle } from '../fx/exhaustNozzles';
import { elevatorPose, guardPose, frontGuardOpen, stepElevatorMotion } from '../demo/hlsElevatorMotion';
import { landingGearPose, stepLandingGear } from '../demo/hlsLandingGearMotion';
import { loadModel, type LoadedModel } from './loadModel';
import { withPreparationTarget } from '../core/preparationRender';

type Lod = 'near' | 'far';
type Motion = { position: number; velocity: number };
const rest = (n: TransformNode) => n.rotationQuaternion?.clone() ?? Quaternion.FromEulerVector(n.rotation);
function angle(n: TransformNode, key: string): number {
  const value = n.metadata?.gltf?.extras?.[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`HLS: missing ${n.name}.${key}`);
  return value;
}
function bind(model: LoadedModel) {
  const n = model.node;
  return {
    ...model,
    legs: Array.from({ length: 6 }, (_, i) => {
      const leg = n(`legPivot_${i}`), foot = n(`footPivot_${i}`), door = n(`doorPivot_${i}`);
      return { leg, foot, door, rest: rest(leg), doorRest: rest(door),
        stow: angle(leg, 'stowAngleY'), fold: angle(foot, 'foldAngleY'), open: angle(door, 'openAngleZ') };
    }),
    car: n('elevatorCar'), start: n('elevatorCar').position.y, floor: n('floorHinge'),
    guards: ['guardLeft', 'guardRight', 'guardFront'].map(n), arms: n('supportArms'), cables: n('hoistCables'),
    links: ['Left', 'Right'].flatMap(side => [
      { mesh: n('cableLead' + side), from: n('winchAnchor' + side), to: n('pulleyFeed' + side) },
      { mesh: n('cableDrop' + side), from: n('suspension' + side), to: n('pulleyDrop' + side) },
    ]),
  };
}
type Ship = ReturnType<typeof bind>;

/** Both LODs use the approved meter-scale rig. No scene/global lighting changes. */
export async function createHlsRig(scene: Scene, parent: TransformNode, shadows: ShadowGenerator) {
  const loaded = await Promise.all([loadModel(scene, 'hls'), loadModel(scene, 'hlsFar')]);
  if (!loaded[0] || !loaded[1]) throw new Error('HLS model did not finish loading');
  const ships: Record<Lod, Ship> = { near: bind(loaded[0]), far: bind(loaded[1]) };
  const exhaustMount=new TransformNode('hlsExhaustMount',scene);exhaustMount.parent=parent;
  // Persistent inferred RCS ports, one draw shared by both LODs and exploration/Continue.
  const ports=rcsNozzles().map((n,i)=>{const mesh=MeshBuilder.CreateCylinder('rcsPort-'+i,{height:.24,diameterTop:.22,diameterBottom:.32,tessellation:8},scene);mesh.position.copyFrom(n.position.subtract(n.direction.scale(.12)));mesh.rotationQuaternion=Quaternion.RotationAxis(Vector3.Cross(Vector3.Up(),n.direction).normalize(),Math.PI/2);mesh.computeWorldMatrix(true);return mesh;});
  const portsMesh=Mesh.MergeMeshes(ports,true,true)!;portsMesh.name='hlsRcsPorts';portsMesh.parent=exhaustMount;portsMesh.isPickable=false;
  const portsMaterial=new StandardMaterial('hlsRcsMetal',scene);portsMaterial.diffuseColor=new Color3(.14,.17,.19);portsMaterial.specularColor.set(.2,.22,.24);portsMesh.material=portsMaterial;
  const size = 16;
  const faces = Array.from({ length: 6 }, (_, face) => {
    const bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = face === 2 ? 25 : face === 3 ? 76 : 35 + Math.round(28 * y / size);
      bytes.set([v, v, v + 3, 255], (y * size + x) * 4);
    }
    return bytes;
  });
  const reflection = new RawCubeTexture(scene, faces, size, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_BYTE, true);
  reflection.level = .7;
  for (const ship of Object.values(ships)) {
    ship.root.parent = parent;
    for (const mesh of ship.meshes) {
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      if (mesh.material instanceof PBRMaterial) {
        mesh.material.reflectionTexture = reflection;
        mesh.material.environmentIntensity = .7;
      }
    }
  }
  let gear: Motion = { position: 0, velocity: 0 }, elevator: Motion = { position: 0, velocity: 0 };
  let gearTarget: 0 | 1 = 0, elevatorTarget: 0 | 1 = 0, lod: Lod | undefined;
  let gate = 0, gateTarget: 0 | 1 = 0;
  const GATE_SECONDS = 1.2;
  const snapshots: Record<Lod, Map<string, Mesh>> = { near: new Map(), far: new Map() };
  const fixed:Record<Lod,{source:Set<Mesh>;batch:Mesh}|undefined>={near:undefined,far:undefined};
  let visibleKey = '';
  function applyPose() {
    const g = landingGearPose(gear.position), p = elevatorPose(elevator.position), guard = guardPose(elevator.position);
    for (const ship of Object.values(ships)) {
      for (const leg of ship.legs) {
        leg.leg.rotationQuaternion = leg.rest.multiply(Quaternion.RotationAxis(Vector3.Forward(), -leg.stow * (1 - g.leg)));
        leg.foot.rotationQuaternion = Quaternion.RotationAxis(Vector3.Forward(), -leg.fold * (1 - g.foot));
        leg.door.rotationQuaternion = leg.doorRest.multiply(Quaternion.RotationAxis(Vector3.Up(), leg.open * g.door));
      }
      ship.car.position.y = ship.start + (.22 - ship.start) * p.lower;
      ship.car.position.z = 6.05 + .45 * p.support;
      ship.floor.rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2 * (1 - p.floor));
      ship.guards[0].rotationQuaternion = Quaternion.RotationAxis(Vector3.Forward(), -Math.PI / 2 * (1 - guard.sides));
      ship.guards[1].rotationQuaternion = Quaternion.RotationAxis(Vector3.Forward(), Math.PI / 2 * (1 - guard.sides));
      ship.guards[2].rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2 * (1 - frontGuardOpen(elevator.position, gate)));
      ship.arms.position.z = ship.car.position.z - .95;
      ship.car.computeWorldMatrix(true); ship.arms.computeWorldMatrix(true); ship.cables.computeWorldMatrix(true);
      const inverse = ship.cables.getWorldMatrix().clone().invert();
      for (const link of ship.links) {
        link.from.computeWorldMatrix(true); link.to.computeWorldMatrix(true);
        const a = Vector3.TransformCoordinates(link.from.getAbsolutePosition(), inverse);
        const b = Vector3.TransformCoordinates(link.to.getAbsolutePosition(), inverse);
        const direction = b.subtract(a), length = direction.length(); direction.normalize();
        const axis = Vector3.Cross(Vector3.Up(), direction), dot = Vector3.Dot(Vector3.Up(), direction);
        link.mesh.position.copyFrom(a); link.mesh.scaling.y = length;
        link.mesh.rotationQuaternion = axis.lengthSquared() < 1e-10
          ? (dot > 0 ? Quaternion.Identity() : Quaternion.RotationAxis(Vector3.Right(), Math.PI))
          : Quaternion.RotationAxis(axis.normalize(), Math.acos(Math.max(-1, Math.min(1, dot))));
      }
    }
  }
  function setLod(next: Lod) {
    // End poses are rigid: batch the same geometry into one draw, keeping the original
    // joints available for the next deployment. No extra asset or source geometry edits.
    const settled = gear.velocity === 0 && elevator.velocity === 0 &&
      (gear.position === 0 || gear.position === 1) && (elevator.position === 0 || elevator.position === 1);
    const poseKey = settled ? `${gear.position}:${elevator.position}` : '';
    const key = next + '/' + poseKey;
    if (visibleKey === key) return;
    if (poseKey && !snapshots[next].has(poseKey)) {
      const ship = ships[next];
      ship.root.computeWorldMatrix(true);
      const inverse = ship.root.getWorldMatrix().clone().invert();
      const pieces = ship.meshes.filter(m => m.getTotalVertices() > 0).map(m => {
        m.computeWorldMatrix(true);
        const data = VertexData.ExtractFromMesh(m as Mesh, true, true);
        data.transform(m.getWorldMatrix().multiply(inverse));
        return data;
      });
      const data = pieces.shift()!;
      data.merge(pieces, true);
      const mesh = new Mesh(`hls-${next}-${poseKey}`, scene);
      data.applyToMesh(mesh);
      mesh.parent = ship.root;
      mesh.material = ship.meshes.find(m => m.material)?.material ?? null;
      mesh.isPickable = false; mesh.receiveShadows = true;
      snapshots[next].set(poseKey, mesh);
    }
    for (const [key, ship] of Object.entries(ships)) {
      ship.root.setEnabled(key === next);
      for (const mesh of ship.meshes) {
        // isVisible keeps parent transforms/children intact while hiding the original draws.
        mesh.isVisible = !poseKey && !fixed[key as Lod]?.source.has(mesh as Mesh);
        shadows.removeShadowCaster(mesh, false);
        if (key === next && mesh.isVisible) shadows.addShadowCaster(mesh, false);
      }
      const body=fixed[key as Lod]?.batch;
      if(body){const active=key===next&&!poseKey;body.setEnabled(active);shadows.removeShadowCaster(body,false);if(active)shadows.addShadowCaster(body,false);}
      for (const [pose, mesh] of snapshots[key as Lod]) {
        const active = key === next && pose === poseKey;
        mesh.setEnabled(active);
        shadows.removeShadowCaster(mesh, false);
        if (active) shadows.addShadowCaster(mesh, false);
      }
    }
    lod = next; visibleKey = key;
  }
  function updateLod() {
    const camera = scene.activeCamera;
    if (!camera) return;
    parent.computeWorldMatrix(true);
    const a = Vector3.TransformCoordinates(new Vector3(0, ships.near.root.position.y, 0), parent.getWorldMatrix());
    const b = Vector3.TransformCoordinates(new Vector3(0, ships.near.root.position.y + 50, 0), parent.getWorldMatrix());
    const distance = Math.max(.01, Vector3.Distance(camera.globalPosition, Vector3.Center(a, b)));
    const pixels = Vector3.Distance(a, b) * scene.getEngine().getRenderHeight() / (2 * Math.tan(camera.fov / 2) * distance);
    setLod(lod === 'near' ? (pixels < 130 ? 'far' : 'near') : (pixels > 180 ? 'near' : 'far'));
  }
  applyPose();
  // Keep the static hull/engines batched while joints move; opening a leg must not expand every hull detail into a draw call.
  for(const key of ['near','far'] as const){
    const ship=ships[key],moving=[...ship.legs.flatMap(l=>[l.leg,l.foot,l.door]),ship.car,ship.floor,...ship.guards,ship.arms,ship.cables];
    const meshes=ship.meshes.filter(m=>m.getTotalVertices()>0&&!moving.some(n=>m===n||m.isDescendantOf(n))) as Mesh[];
    if(!meshes.length)continue;
    ship.root.computeWorldMatrix(true);const inverse=ship.root.getWorldMatrix().clone().invert();
    const pieces=meshes.map(m=>{m.computeWorldMatrix(true);const data=VertexData.ExtractFromMesh(m,true,true);data.transform(m.getWorldMatrix().multiply(inverse));return data;});
    const data=pieces.shift()!;data.merge(pieces,true);
    const batch=new Mesh(`hls-${key}-fixed`,scene);data.applyToMesh(batch);batch.parent=ship.root;batch.material=meshes[0].material;batch.isPickable=false;batch.receiveShadows=true;batch.setEnabled(false);
    fixed[key]={source:new Set(meshes),batch};
  }
  // Build settled poses during the loading screen, never on the first frame a leg finishes opening.
  for(const [g,e] of [[0,0],[1,0],[1,1]] as const){
    gear={position:g,velocity:0};elevator={position:e,velocity:0};applyPose();setLod('near');setLod('far');
  }
  gear={position:0,velocity:0};elevator={position:0,velocity:0};applyPose();setLod('near');
  scene.onDisposeObservable.addOnce(() => reflection.dispose());
  return {
    parent,
    /** Call after the scene camera exists, while the initial loading screen is still up. */
    async warm(){
      return withPreparationTarget(scene, async()=>{
      const savedGear={...gear},savedElevator={...elevator},savedLod=lod??'near';
      try{
        gear={position:.4,velocity:.1};elevator={position:.4,velocity:.1};applyPose();
        for(const key of ['near','far'] as const){
          setLod(key);
          scene.render();
          await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
          scene.render();
        }
      }finally{gear=savedGear;elevator=savedElevator;applyPose();setLod(savedLod);}
      });
    },
    dockingHeight: ships.near.node('dockingAnchor').position.y,
    engineHeight: ships.near.node('engineAnchor').position.y,
    exhaustMount,
    exhaustNozzles():ExhaustNozzle[]{
      exhaustMount.computeWorldMatrix(true);const inverse=exhaustMount.getWorldMatrix().clone().invert();
      return Array.from({length:6},(_,i)=>{const anchor=ships.near.node('engineBell_'+i);anchor.computeWorldMatrix(true);return {position:Vector3.TransformCoordinates(anchor.getAbsolutePosition(),inverse),direction:Vector3.Down(),radius:i>=3?1.36:.67,kind:'main' as const};});
    },
    setOffset(y: number) { exhaustMount.position.y=y;for (const ship of Object.values(ships)) ship.root.position.y = y; applyPose(); },
    setTargets(g: 0 | 1, e: 0 | 1, immediate = false) {
      gearTarget = g; elevatorTarget = e;
      if (immediate) { gate = 0; gateTarget = 0; gear = { position: g, velocity: 0 }; elevator = { position: e, velocity: 0 }; applyPose(); setLod(lod ?? 'near'); }
    },
    snapshotMotion() { return { gear: { ...gear }, elevator: { ...elevator }, gearTarget, elevatorTarget }; },
    restoreMotion(state: { gear: typeof gear; elevator: typeof elevator; gearTarget: 0 | 1; elevatorTarget: 0 | 1 }) {
      gear = { ...state.gear }; elevator = { ...state.elevator };
      gearTarget = state.gearTarget; elevatorTarget = state.elevatorTarget; applyPose(); setLod(lod ?? 'near');
    },
    update(dt: number) {
      const moving = gear.position !== gearTarget || elevator.position !== elevatorTarget || gear.velocity !== 0 || elevator.velocity !== 0;
      const gateMoving = gate !== gateTarget;
      if ((moving || gateMoving) && dt > 0) {
        gear = stepLandingGear(gear, gearTarget, dt);
        elevator = stepElevatorMotion(elevator, elevatorTarget, dt);
        if (gateMoving) gate = gateTarget === 1 ? Math.min(1, gate + dt / GATE_SECONDS) : Math.max(0, gate - dt / GATE_SECONDS);
        applyPose();
      }
      updateLod();
    },
    /** Front gate of the crew car: 1 folds it down so the astronaut can step out. Eased in update(dt). */
    setGate(open: 0 | 1, immediate = false) { gateTarget = open; if (immediate) { gate = open; applyPose(); } },
    get gateOpen() { return gate; },
    /**
     * World-space anchors of the near-LOD car. `floor` is the 'elevatorFloor' node (child of floorHinge);
     * `top` is `floor` lifted to elevator position 0 (car at its authored start height), without touching the pose.
     * The car travels out along the rig root's local +Z (car.position.z = 6.05 + .45*support), so outwardYaw
     * is the world yaw of that axis.
     */
    carAnchor() {
      const ship = ships.near;
      ship.root.computeWorldMatrix(true); ship.car.computeWorldMatrix(true);
      const node = ship.root.getChildTransformNodes(false, n => n.name === 'elevatorFloor')[0] ?? ship.car;
      node.computeWorldMatrix(true);
      const floor = node.getAbsolutePosition().clone();
      const parentMatrix = (ship.car.parent as TransformNode | null)?.getWorldMatrix() ?? Matrix.Identity();
      const lift = Vector3.TransformNormal(new Vector3(0, ship.start - ship.car.position.y, 0), parentMatrix);
      const dir = Vector3.TransformNormal(Vector3.Forward(), ship.root.getWorldMatrix());
      return { floor, top: floor.add(lift), outwardYaw: Math.atan2(dir.x, dir.z) };
    },
    get elevatorStowed() { return elevator.position === 0 && elevator.velocity === 0; },
    get elevatorDeployed() { return elevator.position === 1 && elevator.velocity === 0; },
    /** Place the rigid lander above all six pad footprints without changing terrain. */
    /** Contact root height for the actual pads, without changing rotation or position. */
    contactHeight(sample: (x: number, z: number) => number) {
      let floor=-Infinity;
      for(const {foot} of ships.near.legs){foot.computeWorldMatrix(true);const p=foot.getAbsolutePosition();floor=Math.max(floor,sample(p.x,p.z)-(p.y-parent.position.y));}
      return floor;
    },
    groundHeight(sample: (x: number, z: number) => number) {
      // Fit the landing plane first: raising a perfectly upright rigid six-leg craft
      // to the highest pad alone leaves its downhill pads visibly suspended.
      const points = ships.near.legs.map(({ foot }) => {
        foot.computeWorldMatrix(true);
        const p = foot.getAbsolutePosition();
        return { x: p.x, z: p.z, y: sample(p.x, p.z) };
      });
      const mean = points.reduce<Vector3>((v, p) => v.addInPlace(new Vector3(p.x, p.y, p.z)), Vector3.Zero()).scale(1 / points.length);
      let xx = 0, zz = 0, xz = 0, xy = 0, zy = 0;
      for (const p of points) {
        const x = p.x - mean.x, z = p.z - mean.z, y = p.y - mean.y;
        xx += x * x; zz += z * z; xz += x * z; xy += x * y; zy += z * y;
      }
      const det = xx * zz - xz * xz;
      if (Math.abs(det) > 1e-8) {
        const a = (xy * zz - zy * xz) / det, b = (zy * xx - xy * xz) / det;
        const normal = Vector3.TransformNormal(new Vector3(-a, 1, -b).normalize(), Matrix.RotationY(-parent.rotation.y));
        parent.rotation.x = Math.atan2(normal.z, normal.y);
        parent.rotation.z = -Math.asin(normal.x);
        parent.computeWorldMatrix(true);
      }
      let lift = -Infinity;
      for (const leg of ships.near.legs) for (const mesh of leg.foot.getChildMeshes()) {
        mesh.computeWorldMatrix(true);
        const box = mesh.getBoundingInfo().boundingBox;
        for (const p of box.vectorsWorld) lift = Math.max(lift, sample(p.x, p.z) - p.y);
      }
      return parent.position.y + lift + .015;
    },
    inspect() {
      return { gear: gear.position, elevator: elevator.position, gearTarget, elevatorTarget, lod,
        models: Object.entries(ships).map(([name, ship]) => ({ name, enabled: ship.root.isEnabled(),
          meshes: ship.meshes.length, casters: [...ship.meshes, ...snapshots[name as Lod].values()].filter(m => shadows.getShadowMap()?.renderList?.includes(m)).length,
          feet: ship.legs.map(l => { l.foot.computeWorldMatrix(true); return l.foot.getAbsolutePosition().asArray(); }),
          cableError: Math.max(...ship.links.map(l => {
            l.mesh.computeWorldMatrix(true); l.to.computeWorldMatrix(true);
            return Vector3.Distance(Vector3.TransformCoordinates(Vector3.Up(), l.mesh.getWorldMatrix()), l.to.getAbsolutePosition());
          })),
        })) };
    },
  };
}
export type HlsRig = Awaited<ReturnType<typeof createHlsRig>>;
