/**
 * Contract between the Blender build scripts (tools/blender) and the game: every GLB must contain these
 * node and material names. Blender front = −Y, up = +Z; after glTF export the front is +Z and `_L`
 * (the robot's left) is +X. `front`/`left` name nodes the tests use to catch backwards or mirrored models.
 */
export type ModelId =
  | 'pip' | 'mica' | 'astronaut'
  | 'solarTower' | 'radiator' | 'habitat' | 'antenna'
  | 'crate' | 'flag' | 'hls' | 'hlsFar' | 'relay' | 'hammer' | 'feather' | 'rover' | 'orion';

export interface ModelSpec {
  file: string;
  nodes: string[];
  materials: string[];
  heightM: [number, number];
  front?: string;
  left?: string;
}

const quad = (p: string) => ['FL', 'FR', 'RL', 'RR'].map((s) => `${p}_${s}`);
const lr = (...p: string[]) => p.flatMap((x) => [`${x}_L`, `${x}_R`]);
const hlsNodes = ['hls_root', 'hull', 'elevator', 'legs', 'thrusters', 'dockingAnchor', 'engineAnchor',
  'elevatorCar', 'floorHinge', 'guardLeft', 'guardRight', 'guardFront', 'supportArms', 'hoistCables',
  ...Array.from({ length: 6 }, (_, i) => [`legPivot_${i}`, `footPivot_${i}`, `doorPivot_${i}`]).flat(),
  ...['Left', 'Right'].flatMap(s => ['cableLead', 'cableDrop', 'winchAnchor', 'pulleyFeed', 'suspension', 'pulleyDrop'].map(n => n + s))];

export const MODELS: Record<ModelId, ModelSpec> = {
  pip: {
    file: 'pip.glb',
    nodes: [
      'pip_root', 'chassis', ...quad('leg'), ...quad('steer'), ...quad('wheel'),
      'panel_L', 'panel_R', 'panel_B', 'mast_pan', 'head_tilt', 'face_screen',
      'cam_L', 'cam_R', 'lamp_L', 'lamp_R', 'lidar',
      'arm_base', 'arm_shoulder', 'arm_elbow', 'arm_wrist_pitch', 'arm_wrist_roll', 'grip_L', 'grip_R', 'winch',
    ],
    materials: ['Pip_White', 'Pip_MLI', 'Pip_Alu', 'Pip_Cells', 'Pip_Rubber', 'PipFace', 'Pip_Lamp'],
    heightM: [1.2, 1.5],
    front: 'face_screen',
    left: 'panel_L',
  },
  mica: {
    file: 'mica.glb',
    nodes: [
      'mica_root', 'chassis', 'rocker_L', 'rocker_R', 'bogie_L', 'bogie_R',
      'wheel_1', 'wheel_2', 'wheel_3', 'wheel_4', 'wheel_5', 'wheel_6',
      'wing_L', 'wing_R', 'mast', 'eye', 'drill', 'hatch',
    ],
    materials: ['Mica_Body', 'Mica_Cells', 'Mica_Eye', 'Mica_Mesh'],
    heightM: [1.2, 1.6],
    front: 'eye',
    left: 'wing_L',
  },
  astronaut: {
    file: 'astronaut.glb',
    nodes: [
      'astro_root', 'pelvis', 'spine', 'torso', 'neck', 'helmet', 'visor', 'plss', 'lamp_L', 'lamp_R',
      'ankle_L', 'ankle_R', 'wrist_L', 'wrist_R',
      ...lr('upperArm', 'foreArm', 'glove', 'thigh', 'shin', 'boot'),
    ],
    materials: ['Suit_White', 'Suit_Legs', 'Suit_Boots', 'Suit_Stripe', 'Visor_Gold', 'PLSS'],
    heightM: [1.85, 1.95],
    // The visor pivots at the helmet centre (z = 0), so the helmet lamp marks the front.
    front: 'lamp_L',
    left: 'glove_L',
  },
  solarTower: { file: 'solarTower.glb', nodes: ['solarTower_root', 'mast', 'panel_pivot', 'panel'], materials: [], heightM: [7, 9] },
  radiator: { file: 'radiator.glb', nodes: ['radiator_root', 'frame', 'fins'], materials: [], heightM: [2, 3] },
  habitat: { file: 'habitat.glb', nodes: ['habitat_root', 'hull', 'hatch', 'dust_airlock'], materials: [], heightM: [4, 5] },
  antenna: { file: 'antenna.glb', nodes: ['antenna_root', 'pole', 'dish_pivot', 'dish'], materials: [], heightM: [3, 4] },
  crate: { file: 'crate.glb', nodes: ['crate_root', 'lid', 'body'], materials: [], heightM: [0.8, 1.0] },
  flag: { file: 'flag.glb', nodes: ['flag_root', 'pole', 'crossbar', 'cloth'], materials: [], heightM: [2.2, 2.6] },
  hls: { file: 'hls.glb', nodes: hlsNodes, materials: ['HLS_ReferenceAtlas'], heightM: [48, 52], front: 'elevatorCar' },
  hlsFar: { file: 'hlsFar.glb', nodes: hlsNodes, materials: ['HLS_ReferenceAtlas'], heightM: [48, 52], front: 'elevatorCar' },
  orion: {
    file: 'orion.glb',
    nodes: ['orion_root', 'service_module', 'crew_module', 'engine', 'wing_1', 'wing_2', 'wing_3', 'wing_4'],
    materials: ['Orion_White', 'Orion_Silver', 'Orion_HeatShield', 'Orion_Cells'],
    heightM: [8.5, 10.5],
    left: 'wing_1',
  },
  relay: { file: 'relay.glb', nodes: ['relay_root', 'mast', 'dish'], materials: [], heightM: [2.5, 3.5] },
  hammer: { file: 'hammer.glb', nodes: ['hammer_root', 'head', 'handle'], materials: [], heightM: [0.3, 0.45] },
  feather: { file: 'feather.glb', nodes: ['feather_root', 'quill', 'vane'], materials: [], heightM: [0.2, 0.35] },
  rover: {
    file: 'rover.glb',
    nodes: ['rover_root', 'chassis', 'steer_FL', 'steer_FR', ...quad('wheel'), 'dish', 'seat_driver', 'seat_passenger', 'seat_cargo'],
    materials: ['Rover_Frame', 'Rover_Mesh', 'Rover_Seat', 'Rover_Fender'],
    heightM: [1.6, 2.4],
    front: 'dish',
    left: 'wheel_FL',
  },
};

export const glbPath = (id: ModelId): string => `models/${MODELS[id].file}`;
