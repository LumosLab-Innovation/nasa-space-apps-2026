# Plan 2: Model nhân vật và bụi Mặt Trăng tả thực: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay toàn bộ khối hình tạm của Plan 1 bằng model GLB phong cách phần cứng NASA thật (Pip kiểu VIPER, Mica, phi hành gia AxEMU, 4 module, thùng hàng, cờ Artemis IV, Starship HLS, trạm chuyển tiếp, búa, lông chim). Thêm bụi bay theo parabol khi nhảy, đáp, bước và lăn bánh; dấu chân và vệt bánh ở lại vĩnh viễn; bụi bám dần lên đồ và bánh xe.

**Architecture:**
- Model được dựng bằng script Python chạy trong Blender của người dùng qua Blender MCP (`execute_blender_code`), xuất GLB vào `public/models/`.
- Game nạp GLB bằng `@babylonjs/loaders`. Nếu nạp lỗi thì dùng lại khối hình tạm của Plan 1.
- Tên node trong GLB là hợp đồng giữa Blender và game, ghi trong `src/models/manifest.ts` và được test bằng cách đọc thẳng file GLB.
- Hoạt ảnh là các khối cứng nối theo cây cha–con, quay bằng code (không skin xương).
- Mọi phép tính (động học hạt bụi, dáng đi, góc nhìn, khoảng cách in dấu, độ bám bụi) là hàm thuần có test Vitest. Lớp Babylon chỉ gọi các hàm đó và được kiểm tra bằng mắt.

**Tech Stack:** như Plan 1 (Vite 8, TypeScript ~5.9, Babylon.js 9.34 core/gui/loaders, Havok 1.3, Vitest 5, Node 24), cộng Blender 5.2.1 qua Blender MCP.

**Spec:** `docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md` (v3, §3–§5, §10), là delta trên `docs/2026-11-06-pip-mica-thiet-ke-game.md` (v2.0). Executor đọc cả hai.

## Lộ trình sau v3 (thay lộ trình 4 plan cũ)

| Plan | Nội dung | Ưu tiên (spec §9) |
|---|---|---|
| **2 (file này)** | Model + bụi + dấu vết + bụi bám | 1 |
| 3 | Dữ liệu JPL tháng tốt nhất 2028, đặt lại điểm dừng theo ánh sáng thật, hành trình 8 điểm, thử thách, nâng cấp Pip, tài nguyên, thoại Pip, cắm cờ, chế độ `?demo=1` | 2 |
| 4 | Hồi 4 bổ sung (bão DONKI, ghép nhật ký), Hồi 5 gọn, Kết | 3 |
| 5 | Cutscene hạ cánh 3D (bay qua Biển Tĩnh Lặng), Orion, bụi luồng phụt | 4 |
| 6 | Tiếng Việt, âm thanh "trong mũ", chứng chỉ, video | 5 |

## Global Constraints

- **Phong cách A, phần cứng NASA thật:** nhôm xước, lá cách nhiệt vàng (MLI), sơn trắng tản nhiệt, ốc vít, bó cáp, tem nhãn; tỉ lệ thật (spec §4).
- **Pip:**
  - Bốn bánh, mỗi bánh trên một chân có khớp, lái độc lập; khung thấp, rộng.
  - **Tấm pin dựng đứng**.
  - Đầu trên cột cao gồm: màn hình mặt hiển thị 6 biểu cảm (`happy, curious, worried, sad, dots, sleep`), 2 camera stereo, 2 đèn pha LED, LIDAR trên đỉnh. Đầu xoay ngang và gật lên xuống được.
  - Tay robot 5–6 khớp, kẹp hai ngón, camera cổ tay; tời ở đuôi.
  - Cao tổng **1,2–1,5 m** (spec §4.1).
- **Mica:** 6 bánh lưới kim loại (rocker-bogie), thân hộp, **2 tấm pin nằm ngang**, sơn bạc ngả màu, một mắt camera tròn trên cột, ống khoan (spec §4.2).
- **Phi hành gia:** theo AxEMU. Thân trắng, sọc màu trên tay và chân, mũ có kính chắn vàng, ba lô PLSS, 2 đèn mũ. Cao **1,9 m** (khớp capsule `HEIGHT = 1.9` trong `src/player/astronaut.ts`) (spec §4.3).
- **Không dùng** máy tạo 3D bằng AI hay thư viện model trả phí (spec §2).
- **Blender:**
  - Mỗi script dựng trong **một scene riêng** tên `build_<id>` và chỉ xuất object của scene đó.
  - **Không bao giờ** xóa hay sửa object nằm ngoài scene đó: đây là Blender của người dùng.
  - Không gọi `read_homefile`/`read_factory_settings`.
- **Trục:**
  - Trong Blender, mặt trước model hướng **−Y**, trục **+Z** hướng lên, gốc tọa độ đặt dưới chân, chính giữa.
  - Exporter glTF đổi −Y thành +Z, nên trong Babylon mặt trước là **+z** (đúng quy ước `yaw 0 = +z` của Plan 1).
  - Hậu tố `_L` là phía bên trái của robot, tức **+X** trong Blender.
- **Bụi:**
  - Hạt bay theo parabol với `LUNAR_G = 1.62`, **không lực cản**, không đọng thành mây.
  - Hạt chỉ biến mất khi chạm đất, không mờ dần giữa không trung.
  - Số hạt và vận tốc tỉ lệ với vận tốc chạm đất (spec §5).
- **Dấu chân và vệt bánh ở lại** suốt phiên chơi (spec §5).
- **Không thêm dependency runtime mới.** Game chạy offline sau khi tải trang (spec §3).
- **Ngân sách:**
  - Pip ≤ 25k tam giác; Mica ≤ 20k; phi hành gia ≤ 20k; mỗi module ≤ 10k; HLS ≤ 30k.
  - Không dùng texture ảnh: chỉ hệ số PBR, trừ màn hình mặt Pip (DynamicTexture có sẵn).
  - ≥ 30 FPS trên laptop phổ thông.
- Chữ hiển thị mới nằm trong `src/content/*.en.*` (spec §3).

## Review Focus

1. **File GLB thiếu hoặc lỗi** (chưa dựng, sai đường dẫn, mất mạng giữa chừng): game vẫn chạy bằng khối hình tạm, chỉ cảnh báo một lần trên console. Test: `loadModel returns null when the importer fails` (Task 1).
2. **Model quay ngược hoặc bị lật gương** (mặt Pip nhìn ra sau, tay ở sai bên): test đọc GLB, kiểm tra node mặt trước có z > 0 và node `_L` có x > 0 trong tọa độ glTF. Test: `front faces +Z and _L is on +X` (Task 1 helper, áp vào từng model ở Task 2, 7, 8).
3. **Bụi phát sáng trong bóng tối:** hạt bụi phải là vật thể được chiếu sáng (tối khi trong bóng, sáng khi có nắng hoặc đèn). Test: `dust grain material is lit` (Task 3).
4. **Ngã từ vách cao 20 m hoặc nhảy liên tục:** số hạt mỗi lần bắn bị chặn trên và tổng hạt sống không vượt quá kích thước pool. Test: `burst count is capped` và `pool never exceeds capacity` (Task 3).
5. **Chơi lâu, đi nhiều cây số:** dấu chân và vệt bánh không làm tràn bộ nhớ (ring buffer), và dấu cũ nhất bị thay trước. Test: `stamp ring buffer overwrites oldest` (Task 4).

---

## File Structure

```
tools/blender/
  common.py             — vật liệu PBR chuẩn (MLI vàng, nhôm xước, sơn trắng, cell pin, cao su tối, lưới kim loại),
                          helper khối có vát cạnh, ốc vít, bó cáp, scene riêng, xuất GLB, assert kích thước/hướng
  build_pip.py          — Pip → public/models/pip.glb
  build_mica.py         — Mica → public/models/mica.glb
  build_astronaut.py    — phi hành gia → public/models/astronaut.glb
  build_props.py        — module, thùng, cờ, HLS, trạm chuyển tiếp, búa, lông chim → public/models/<id>.glb
  run.md                — cách chạy script qua Blender MCP
public/models/*.glb     — sản phẩm (commit vào git)
src/models/
  glb.ts                — đọc JSON chunk của GLB, tên node/material, vị trí thế giới của node
  manifest.ts           — hợp đồng tên node/material + chiều cao cho từng model
  loadModel.ts          — nạp GLB (cache container, instantiate), tìm node theo tên, null khi lỗi
src/fx/
  ballistic.ts          — động học hạt bụi thuần (parabol, thời gian chạm đất, số hạt theo va chạm)
  dustSystem.ts         — pool hạt bụi dạng thin instance, vật liệu được chiếu sáng
  trails.ts             — logic in dấu (khoảng cách, ring buffer) thuần
  trailRenderer.ts      — vẽ dấu chân/vệt bánh bằng thin instance
  dustCoat.ts           — độ bám bụi thuần theo quãng đường
src/pip/pipRig.ts       — hàm thuần: góc quay bánh, góc lái, góc nhìn đầu, tư thế tay
src/player/gait.ts      — hàm thuần: dáng đi bộ/nhảy "thỏ" cho tay chân
Sửa: src/pip/pip.ts, src/mica/mica.ts, src/player/astronaut.ts, src/interact/moduleSystem.ts,
     src/science/scienceSystem.ts, src/science/experiments.ts, src/scenes/surfaceScene.ts, src/main.ts
tests/glb.test.ts, models.test.ts, ballistic.test.ts, trails.test.ts, dustCoat.test.ts, pipRig.test.ts, gait.test.ts
```

---

### Task 1: Hợp đồng model, đọc GLB, nạp model có dự phòng

**Files:**
- Create: `src/models/glb.ts`, `src/models/manifest.ts`, `src/models/loadModel.ts`, `tests/glb.test.ts`
- Modify: `src/main.ts` (thêm `import '@babylonjs/loaders/glTF';`)

**Interfaces:**
- Produces:
  - `interface GltfNode { name?: string; children?: number[]; translation?: [number,number,number]; rotation?: [number,number,number,number]; scale?: [number,number,number]; mesh?: number }`
  - `interface GltfJson { nodes?: GltfNode[]; materials?: { name?: string }[]; scenes?: { nodes: number[] }[]; scene?: number }`
  - `parseGlbJson(buf: Uint8Array): GltfJson`, ném `Error('not a GLB')` nếu magic khác `glTF`.
  - `nodeNames(j: GltfJson): Set<string>`; `materialNames(j: GltfJson): Set<string>`
  - `nodeWorldPosition(j: GltfJson, name: string): [number,number,number] | null`: ghép TRS từ gốc scene xuống node.
  - `type ModelId = 'pip'|'mica'|'astronaut'|'solarTower'|'radiator'|'habitat'|'antenna'|'crate'|'flag'|'hls'|'relay'|'hammer'|'feather'`
  - `interface ModelSpec { file: string; nodes: string[]; materials: string[]; heightM: [number, number]; front?: string; left?: string }`. `front` là node phải có z > 0, `left` là node phải có x > 0 (tọa độ glTF).
  - `MODELS: Record<ModelId, ModelSpec>`: điền đầy đủ theo danh sách node của Task 2, 7, 8, 9.
  - `interface LoadedModel { root: TransformNode; meshes: AbstractMesh[]; node(name: string): TransformNode; material(name: string): Material | null }`. `node()` tìm trong con cháu của `root` của chính instance này; không có thì ném `Error('model <id>: missing node <name>')`.
  - `type Importer = (url: string, scene: Scene) => Promise<AssetContainer>`
  - `loadModel(scene: Scene, id: ModelId, importer?: Importer): Promise<LoadedModel | null>`:
    - Mặc định dùng `LoadAssetContainerAsync` của Babylon 9 (nếu tên API khác thì tra context7 `@babylonjs/core` và ghi Ruling).
    - Cache container theo `id`; mỗi lần gọi trả một instance mới (`instantiateModelsToScene`).
    - Mọi mesh đặt `receiveShadows = true`.
    - Lỗi thì `console.warn` một lần cho mỗi `id` rồi trả `null`.
  - `glbPath(id: ModelId): string` trả `models/<file>` (tương đối, chạy được cả ở `vite build`).

- [ ] **Step 1: Viết test hỏng**

```ts
// tests/glb.test.ts
import { parseGlbJson, nodeNames, nodeWorldPosition } from '../src/models/glb';
import { loadModel } from '../src/models/loadModel';
import { MODELS } from '../src/models/manifest';

function makeGlb(json: object): Uint8Array { /* header 'glTF' v2 + JSON chunk padded with spaces to 4 bytes */ }

it('parses the JSON chunk of a GLB', () => {
  const j = parseGlbJson(makeGlb({ nodes: [{ name: 'a' }], scenes: [{ nodes: [0] }] }));
  expect([...nodeNames(j)]).toEqual(['a']);
});
it('rejects files that are not GLB', () => {
  expect(() => parseGlbJson(new Uint8Array(20))).toThrow('not a GLB');
});
it('composes parent translation and rotation into world position', () => {
  // parent at (0,0,2) rotated 90° about +Y (quat [0, 0.7071068, 0, 0.7071068]); child at local (1,0,0)
  const j = { scenes: [{ nodes: [0] }], nodes: [
    { name: 'p', translation: [0, 0, 2], rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2], children: [1] },
    { name: 'c', translation: [1, 0, 0] } ] };
  const w = nodeWorldPosition(j as never, 'c')!;
  expect(w[0]).toBeCloseTo(0, 5); expect(w[1]).toBeCloseTo(0, 5); expect(w[2]).toBeCloseTo(1, 5);
});
it('loadModel returns null when the importer fails', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(loadModel({} as never, 'pip', () => Promise.reject(new Error('404')))).resolves.toBeNull();
  expect(warn).toHaveBeenCalledTimes(1);
});
it('every model spec names a file under models/ and a sane height range', () => {
  for (const [id, s] of Object.entries(MODELS)) {
    expect(s.file).toBe(`${id}.glb`);
    expect(s.heightM[0]).toBeGreaterThan(0);
    expect(s.heightM[1]).toBeGreaterThanOrEqual(s.heightM[0]);
  }
});
```

- [ ] **Step 2:** `npx vitest run tests/glb.test.ts`. Kỳ vọng: FAIL vì không tìm thấy module `../src/models/glb`.
- [ ] **Step 3: Cài đặt**
  - Viết `glb.ts`, `manifest.ts`, `loadModel.ts` theo Interfaces.
  - `nodeWorldPosition` dùng phép quay quaternion và scale đơn giản, không cần thư viện.
  - Chiều cao trong `MODELS`: pip `[1.2, 1.5]`; mica `[1.2, 1.6]`; astronaut `[1.85, 1.95]`; solarTower `[7, 9]`; radiator `[2, 3]`; habitat `[4, 5]`; antenna `[3, 4]`; crate `[0.8, 1.0]`; flag `[2.2, 2.6]`; hls `[48, 52]`; relay `[2.5, 3.5]`; hammer `[0.3, 0.45]`; feather `[0.2, 0.35]`.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: toàn bộ PASS (86 test cũ + test mới).
- [ ] **Step 5: Commit** `feat: GLB model contract, reader and fallback loader`

---

### Task 2: Bộ công cụ Blender và model Pip (có cổng duyệt của người dùng)

**Files:**
- Create: `tools/blender/common.py`, `tools/blender/build_pip.py`, `tools/blender/run.md`, `public/models/pip.glb`, `tests/models.test.ts`
- Modify: `src/models/manifest.ts` (danh sách node Pip nếu cần chỉnh)

**Interfaces:**
- Consumes: `MODELS.pip`, `parseGlbJson`, `nodeNames`, `materialNames`, `nodeWorldPosition` (Task 1).
- Produces `pip.glb` với các node:
  - `pip_root`, `chassis`
  - `leg_FL`, `leg_FR`, `leg_RL`, `leg_RR` (pivot ở khớp hông)
  - `steer_FL…RR` (pivot trục lái dọc), `wheel_FL…RR` (pivot tâm bánh, quay quanh trục X)
  - `panel_L`, `panel_R`, `panel_B` (pin đứng), `mast_pan` (quay quanh Z của Blender), `head_tilt` (quay quanh X)
  - `face_screen`: mặt phẳng UV 0..1, chữ đọc đúng chiều khi nhìn từ phía trước.
  - `cam_L`, `cam_R`, `lamp_L`, `lamp_R`, `lidar`
  - `arm_base` (quay ngang), `arm_shoulder`, `arm_elbow`, `arm_wrist_pitch`, `arm_wrist_roll`, `grip_L`, `grip_R`
  - `winch`
- Materials: `Pip_White`, `Pip_MLI`, `Pip_Alu`, `Pip_Cells`, `Pip_Rubber`, `PipFace` (màn hình), `Pip_Lamp`.
- `MODELS.pip.front = 'face_screen'`, `MODELS.pip.left = 'panel_L'`.
- `common.py` cung cấp:
  - `begin_build(id) -> bpy.types.Scene`: tạo hoặc dọn **chỉ** scene `build_<id>` rồi đặt nó làm scene của cửa sổ.
  - `mat(name, base_color, metallic, roughness, emission=None)`
  - `bevel_box(name, size, bevel, parent)`, `cylinder(...)`, `bolts(...)`, `cable(points, radius, parent)`
  - `pivot_empty(name, location, parent)`
  - `assert_height(objs, lo, hi)`: đo bounding box theo trục Z.
  - `export_glb(scene, path)`: chọn mọi object của scene đó, `export_scene.gltf` với `export_format='GLB'`, `use_selection=True`, `export_apply=True`, `export_yup=True`.

- [ ] **Step 1: Viết test hỏng**

```ts
// tests/models.test.ts — one block per model; this task adds 'pip', Tasks 7–9 add the rest
import { readFileSync, existsSync } from 'node:fs';
const check = (id: ModelId) => describe(`model ${id}`, () => {
  const path = `public/models/${MODELS[id].file}`;
  it('exists', () => expect(existsSync(path)).toBe(true));
  it('has every contract node and material', () => {
    const j = parseGlbJson(new Uint8Array(readFileSync(path)));
    const n = nodeNames(j), m = materialNames(j);
    expect(MODELS[id].nodes.filter((x) => !n.has(x))).toEqual([]);
    expect(MODELS[id].materials.filter((x) => !m.has(x))).toEqual([]);
  });
  it('front faces +Z and _L is on +X', () => {
    const j = parseGlbJson(new Uint8Array(readFileSync(path)));
    if (MODELS[id].front) expect(nodeWorldPosition(j, MODELS[id].front!)![2]).toBeGreaterThan(0);
    if (MODELS[id].left) expect(nodeWorldPosition(j, MODELS[id].left!)![0]).toBeGreaterThan(0);
  });
});
check('pip');
```

- [ ] **Step 2:** `npx vitest run tests/models.test.ts`. Kỳ vọng: FAIL ở `exists`.
- [ ] **Step 3: Kiểm tra Blender.**
  - Gọi `get_addon_status` và `get_scene_info` qua Blender MCP. Ghi lại phiên bản và tên các scene đang có của người dùng; không đụng tới các scene này.
  - Nếu MCP không kết nối được: dừng, nhờ người dùng mở Blender và bấm "Start MCP Server".
- [ ] **Step 4: Viết `common.py`, `build_pip.py` rồi chạy.**
  - Chạy qua `execute_blender_code`, nội dung lệnh ghi trong `run.md`: `import runpy, sys; sys.path.insert(0, r'<repo>\tools\blender'); runpy.run_path(r'<repo>\tools\blender\build_pip.py', run_name='__main__')`.
  - Kích thước Pip:
    - Khung 1,4 × 1,0 × 0,35 m, gầm cách đất 0,3 m.
    - Bánh bán kính 0,2 m, rộng 0,15 m, có gân.
    - Cột đầu cao sao cho đỉnh LIDAR ở 1,35–1,45 m.
    - Màn hình mặt 0,32 × 0,16 m.
  - Pip ≤ 25k tam giác.
  - Script phải gọi `assert_height(..., 1.2, 1.5)` trước khi xuất.
- [ ] **Step 5: Nhìn kết quả.**
  - Dùng `look` của Blender MCP chụp 3 góc: trước ¾, bên, sau ¾. Sửa script cho tới khi đạt Global Constraints (tấm pin đứng, tay gập bên hông, có ốc vít và bó cáp, MLI vàng ở thân).
  - Lưu ảnh render vào `docs/screens/plan2-pip-*.png` (render qua `bpy.ops.render.render` vào file, hoặc ảnh từ `look`).
- [ ] **Step 6:** `npx vitest run tests/models.test.ts`. Kỳ vọng: PASS cả 3 test của `pip`.
- [ ] **Step 7: Commit** `feat: Blender toolkit and Pip VIPER-style model`
- [ ] **Step 8: CỔNG DUYỆT (spec §10.5).**
  - Gửi người dùng 3 ảnh render Pip và hỏi họ có duyệt không.
  - Trong lúc chờ, **được làm tiếp Task 3, 4, 5** (không phụ thuộc model).
  - **Không** bắt đầu Task 6–9 khi chưa được duyệt.
  - Nếu người dùng yêu cầu sửa: sửa `build_pip.py`, chạy lại Step 4–7, rồi hỏi lại.

---

### Task 3: Bụi bay theo đường đạn (parabol), được chiếu sáng, bắn ra khi nhảy, đáp, bước và lăn bánh

**Files:**
- Create: `src/fx/ballistic.ts`, `src/fx/dustSystem.ts`, `tests/ballistic.test.ts`
- Modify: `src/player/astronaut.ts` (phát sự kiện), `src/pip/pip.ts` (bỏ `ParticleSystem` `pipDust`, dùng DustSystem), `src/scenes/surfaceScene.ts`

**Interfaces:**
- Produces (`ballistic.ts`, thuần):
  - `interface Grain { x: number; y: number; z: number; vx: number; vy: number; vz: number; alive: boolean }`
  - `stepGrain(g: Grain, dt: number, groundY: (x: number, z: number) => number, gravity = LUNAR_G): void`: tích phân chính xác dạng parabol trong bước `dt`: `y += vy·dt − ½g·dt²`, `vy −= g·dt`, `x += vx·dt`, `z += vz·dt`. Khi `y <= groundY(x,z)` thì `alive = false`, `y = groundY`.
  - `timeToGround(vy: number, h0: number, g = LUNAR_G): number = (vy + √(vy² + 2g·h0)) / g`
  - `burstCount(impactSpeedMs: number): number`: 0 nếu < 0,3 m/s; tăng tuyến tính 40 hạt cho mỗi m/s; chặn trên `MAX_BURST = 400`.
  - `burstVelocities(n: number, impactSpeedMs: number, rand: () => number): {vx,vy,vz}[]`:
    - Hướng tỏa ra quanh chân, góc nâng 15–60°.
    - Tốc độ `0.4 + 0.6·rand()` nhân `clamp(impactSpeedMs, 0.5, 4)` m/s.
- Produces (`dustSystem.ts`):
  - `class DustSystem { constructor(scene: Scene, hm: Heightmap, capacity = 3000); burst(at: Vector3, impactSpeedMs: number): void; trickle(at: Vector3, dirYaw: number, speedMs: number, dt: number): void; update(dt: number): void; readonly alive: number; readonly material: Material }`
  - Mỗi hạt là một thin instance của một khối nhỏ (tứ diện, 1–3 cm) với `PBRMaterial` màu regolith (albedo 0.42), `roughness 1`, **có chiếu sáng** (`disableLighting` false, emissive đen) và `receiveShadows = true`.
  - Pool cố định `capacity`: khi đầy thì bỏ qua hạt mới, không cấp phát thêm.
  - `trickle` là luồng nhỏ liên tục (bước chân, bánh xe), hạt phun ra phía sau theo `dirYaw`.
- Produces (`astronaut.ts`): `onJump: (speedMs: number) => void`, `onLand: (impactSpeedMs: number) => void`, `onStep: (foot: 'L' | 'R') => void`.
  - `onLand` lấy tốc độ rơi dọc ngay trước khi chạm đất (state đổi từ `UNSUPPORTED` sang `SUPPORTED`).
  - `onStep` phát mỗi 0,7 m quãng đường khi đi trên mặt đất.

- [ ] **Step 1: Viết test hỏng**

```ts
// tests/ballistic.test.ts
const flat = () => 0;
it('a grain thrown up at 2 m/s peaks at v²/2g and lands after 2v/g', () => {
  const g: Grain = { x: 0, y: 0, z: 0, vx: 1, vy: 2, vz: 0, alive: true };
  let peak = 0, t = 0;
  while (g.alive && t < 10) { stepGrain(g, 1 / 120, flat); peak = Math.max(peak, g.y); t += 1 / 120; }
  expect(peak).toBeCloseTo(4 / (2 * 1.62), 2);
  expect(t).toBeCloseTo(2 * 2 / 1.62, 1);
});
it('no air drag: horizontal speed never changes in flight', () => {
  const g: Grain = { x: 0, y: 0.5, z: 0, vx: 1.3, vy: 0.8, vz: -0.4, alive: true };
  for (let i = 0; i < 50; i++) stepGrain(g, 0.01, flat);
  expect(g.vx).toBe(1.3); expect(g.vz).toBe(-0.4);
});
it('a grain dies only when it reaches the ground, and rests on it', () => {
  const g: Grain = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, alive: true };
  stepGrain(g, 0.5, () => 0.2); expect(g.alive).toBe(true);
  for (let i = 0; i < 100 && g.alive; i++) stepGrain(g, 0.05, () => 0.2);
  expect(g.alive).toBe(false); expect(g.y).toBe(0.2);
});
it('timeToGround matches the kinematics', () => {
  expect(timeToGround(0, 1.5)).toBeCloseTo(Math.sqrt(2 * 1.5 / 1.62), 6);
});
it('burst count grows with impact speed and is capped', () => {
  expect(burstCount(0.1)).toBe(0);
  expect(burstCount(2)).toBeGreaterThan(burstCount(1));
  expect(burstCount(40)).toBe(MAX_BURST);
});
it('burst velocities all point upward and outward', () => {
  let s = 1; const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (const v of burstVelocities(100, 2, rand)) {
    expect(v.vy).toBeGreaterThan(0);
    const elev = Math.atan2(v.vy, Math.hypot(v.vx, v.vz)) * 180 / Math.PI;
    expect(elev).toBeGreaterThanOrEqual(15 - 1e-9); expect(elev).toBeLessThanOrEqual(60 + 1e-9);
  }
});
```

Test cho Review Focus 3 và 4 (đặt cùng file; dùng `NullEngine` của Babylon):

```ts
it('dust grain material is lit', () => {
  const scene = new Scene(new NullEngine());
  const d = new DustSystem(scene, generateCraterField(33, 100, 1), 50);
  const m = d.material as PBRMaterial;
  expect(m.disableLighting).toBe(false);
  expect(m.emissiveColor.equals(Color3.Black())).toBe(true);
});
it('pool never exceeds capacity', () => {
  const scene = new Scene(new NullEngine());
  const d = new DustSystem(scene, generateCraterField(33, 100, 1), 50);
  for (let i = 0; i < 10; i++) d.burst(new Vector3(0, 5, 0), 4);
  expect(d.alive).toBeLessThanOrEqual(50);
});
```

- [ ] **Step 2:** `npx vitest run tests/ballistic.test.ts`. Kỳ vọng: FAIL vì không tìm thấy module.
- [ ] **Step 3: Cài đặt.**
  - Viết `ballistic.ts`, `dustSystem.ts` (dùng `thinInstanceSetBuffer('matrix', …, 16, false)` + `thinInstanceBufferUpdated('matrix')` mỗi khung, `thinInstanceCount = alive`).
  - Nối `astronaut.onJump/onLand/onStep` vào `dust.burst` / `dust.trickle` trong `surfaceScene.ts`.
  - Pip: mỗi khung khi đang chạy gọi `dust.trickle` ở 4 bánh, lượng hạt tỉ lệ `speed / RUN` (thay `this.dust.emitRate`).
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: toàn bộ PASS.
- [ ] **Step 5: Kiểm tra bằng mắt** (`npm run dev`, Playwright):
  - Nhảy (Space) rồi đáp: bụi tỏa vòng cung rồi rơi xuống đất, không có làn khói.
  - Hạt đen trong bóng, sáng khi có nắng hoặc đèn mũ.
  - Chạy cạnh Pip: thấy bụi bánh hình "đuôi gà trống".
  - Chụp `docs/screens/plan2-dust-*.png`.
  - FPS ≥ 30 sau 20 lần nhảy liên tục (đo bằng `engine.getFps()` qua `__scene`).
- [ ] **Step 6: Commit** `feat: ballistic lunar dust for jumps, landings, steps and wheels`

---

### Task 4: Dấu chân và vệt bánh ở lại

**Files:**
- Create: `src/fx/trails.ts`, `src/fx/trailRenderer.ts`, `tests/trails.test.ts`
- Modify: `src/scenes/surfaceScene.ts`, `src/pip/pip.ts` (báo vị trí 4 bánh), `src/player/astronaut.ts` (vị trí bàn chân ở `onStep`)

**Interfaces:**
- Produces (`trails.ts`, thuần):
  - `class StampSpacer { constructor(spacingM: number); feed(x: number, z: number): boolean }`: trả `true` mỗi khi quãng đường cộng dồn từ lần in trước ≥ `spacingM`. Lần `feed` đầu tiên chỉ ghi điểm xuất phát, trả `false`. Bước nhảy > 5 m giữa hai lần `feed` (dịch chuyển tức thời) cũng chỉ ghi lại điểm, trả `false`.
  - `class StampRing<T> { constructor(capacity: number); push(v: T): number; readonly size: number; at(i: number): T }`: `push` trả chỉ số ô vừa ghi; khi đầy thì ghi đè ô cũ nhất.
- Produces (`trailRenderer.ts`):
  - `class TrailRenderer { constructor(scene: Scene, hm: Heightmap, kind: 'boot' | 'wheel', capacity: number); stamp(x: number, z: number, yaw: number): void }`
  - Thin instance của một quad nằm sát mặt đất, xoay theo pháp tuyến địa hình, `zOffset = -2`.
  - Texture vẽ bằng DynamicTexture: đế giày AxEMU có gân ngang, hoặc gân bánh xe.
  - Dấu tối hơn đất xung quanh khoảng 15% vì đất nén phản xạ ít hơn.
- Dung lượng: `boot` 6000, `wheel` 12000. Khoảng cách in: chân 0,7 m (luân phiên L/R lệch 0,15 m sang bên); mỗi bánh Pip 0,3 m.

- [ ] **Step 1: Viết test hỏng**

```ts
it('spacer fires once per spacing of travelled distance', () => {
  const s = new StampSpacer(0.7); s.feed(0, 0);
  const hits = [0.3, 0.6, 0.9, 1.2, 1.5].map((x) => s.feed(x, 0));
  expect(hits).toEqual([false, false, true, false, true]);
});
it('spacer ignores teleports', () => {
  const s = new StampSpacer(0.7); s.feed(0, 0);
  expect(s.feed(30, 0)).toBe(false); expect(s.feed(30.8, 0)).toBe(true);
});
it('stamp ring buffer overwrites oldest', () => {
  const r = new StampRing<number>(3); [1, 2, 3, 4].forEach((v) => r.push(v));
  expect(r.size).toBe(3); expect([r.at(0), r.at(1), r.at(2)].sort()).toEqual([2, 3, 4]);
});
```

- [ ] **Step 2:** `npx vitest run tests/trails.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối vào scene: chân người chơi theo `onStep`; 4 bánh Pip mỗi khung qua `StampSpacer` riêng cho từng bánh.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 5: Kiểm tra bằng mắt:**
  - Đi 30 m rồi quay lại: dấu chân vẫn còn, nằm sát đất, không nhấp nháy (z-fighting).
  - Pip để lại 4 vệt bánh.
  - Chụp `docs/screens/plan2-trails.png`.
- [ ] **Step 6: Commit** `feat: persistent bootprints and wheel tracks`

---

### Task 5: Bụi bám dần lên đồ và bánh xe

**Files:**
- Create: `src/fx/dustCoat.ts`, `tests/dustCoat.test.ts`
- Modify: `src/scenes/surfaceScene.ts`

**Interfaces:**
- Produces:
  - `class DustCoat { level = 0; addTravel(metres: number): void; addBurst(impactSpeedMs: number): void; clean(amount: number): void }`
    - `addTravel` cộng `metres / 800`.
    - `addBurst` cộng `0.01 · clamp(impactSpeedMs, 0, 4)`.
    - `level` luôn trong `[0, MAX_COAT = 0.85]`: không bao giờ phủ kín 100%, vì còn cần nhìn ra màu đồ.
  - `coatColor(base: Color3Like, level: number): Color3Like`: lerp từ `base` tới `REGOLITH = {r:0.42,g:0.41,b:0.39}`.
- Áp dụng sau khi có model (Task 6, 8):
  - Phi hành gia: material `Suit_Boots` lấy đủ `level`, `Suit_Legs` lấy `level·0.5`.
  - Pip: `Pip_Rubber` lấy đủ `level`, `Pip_White` lấy `level·0.3`.
  - Trong task này chỉ cần nối vào material tạm hiện có (`suit`, `pipDark`, `pipWhite`).

- [ ] **Step 1: Viết test hỏng**

```ts
it('coat grows with distance and is capped below full', () => {
  const c = new DustCoat(); c.addTravel(400); expect(c.level).toBeCloseTo(0.5, 5);
  c.addTravel(1e6); expect(c.level).toBe(MAX_COAT);
});
it('cleaning never goes below zero', () => { const c = new DustCoat(); c.addTravel(80); c.clean(5); expect(c.level).toBe(0); });
it('coat colour moves from base toward regolith grey', () => {
  const w = { r: 0.95, g: 0.95, b: 0.93 };
  expect(coatColor(w, 0)).toEqual(w);
  expect(coatColor(w, 1).r).toBeCloseTo(0.42, 5);
});
```

- [ ] **Step 2:** `npx vitest run tests/dustCoat.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối vào scene: quãng đường người chơi/Pip mỗi khung, `onLand` gọi `addBurst`. EDS của Mica (Plan 1) không đổi; bộ làm sạch cho người chơi và Pip thuộc Plan 3.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 5: Commit** `feat: suit and wheel dust coating over distance`

---

### Task 6: Đưa model Pip vào game và cho Pip cử động *(chỉ bắt đầu sau khi người dùng duyệt ở Task 2 Step 8)*

**Files:**
- Create: `src/pip/pipRig.ts`, `tests/pipRig.test.ts`
- Modify: `src/pip/pip.ts`, `src/interact/moduleSystem.ts` (thùng hàng gắn vào `grip_L`/`grip_R` thay vì `root` ở `y 1.75`), `src/scenes/surfaceScene.ts` (Pip khởi tạo bất đồng bộ)

**Interfaces:**
- Consumes: `loadModel(scene,'pip')`, `LoadedModel.node(...)` (Task 1); node Pip (Task 2); `DustCoat` (Task 5).
- Produces (`pipRig.ts`, thuần):
  - `WHEEL_RADIUS_M = 0.2`
  - `wheelSpin(distanceM: number, radiusM = WHEEL_RADIUS_M): number = distanceM / radiusM` (radian)
  - `steerAngles(turnRateRadS: number, speedMs: number): { front: number; rear: number }`:
    - Lái bốn bánh: bánh sau lái ngược dấu bánh trước.
    - Mỗi góc chặn trong ±0,6 rad.
    - Đứng yên mà xoay tại chỗ (`speed < 0.05`, `turnRate ≠ 0`): ±0,785 rad theo kiểu chữ X.
  - `lookAngles(from: {x,y,z}, to: {x,y,z}, bodyYaw: number): { pan: number; tilt: number }`:
    - `pan` chặn trong ±2,6 rad, `tilt` chặn trong [−0,6, 0,5] rad.
  - `type ArmPose = 'stowed' | 'reach' | 'lift' | 'hold' | 'wave'`
  - `ARM_POSES: Record<ArmPose, { base: number; shoulder: number; elbow: number; wristPitch: number; grip: number }>`
  - `blendPose(a, b, t)` nội suy tuyến tính từng khớp.
- `Pip` giữ nguyên API công khai của Plan 1 (`root`, `meshes`, `mode`, `gotoTarget`, `contextCommand`, `onCommand`, `face`, `setFace`, `lampOn`, `command`, `lowerArm`, `update`, `position`).
  - Thêm `static async create(scene, hm, start): Promise<Pip>`: nạp GLB; nếu `null` thì dựng thân tạm của Plan 1.
  - Gương mặt: material `PipFace` được thay bằng `StandardMaterial` dùng `faceTex` hiện có (emissive, không chiếu sáng).
  - Đèn `pipLampLight` gắn vào `head_tilt`.
  - Tư thế tay theo lệnh: `lift`/`open` → `reach` → `lift`/`hold`; `lowerArm` → `stowed`; khi chào người chơi lần đầu → `wave`.
  - Đầu nhìn theo người chơi khi `follow`, nhìn mục tiêu khi `goto`, cúi xuống mẫu đá khi `scan`.

- [ ] **Step 1: Viết test hỏng**

```ts
it('a wheel turns one radian per radius travelled', () => { expect(wheelSpin(0.4)).toBeCloseTo(2, 6); });
it('four-wheel steering counter-steers the rear and clamps', () => {
  const s = steerAngles(1.5, 1.6); expect(Math.sign(s.rear)).toBe(-Math.sign(s.front));
  expect(Math.abs(s.front)).toBeLessThanOrEqual(0.6);
});
it('turning on the spot uses the X stance', () => { expect(Math.abs(steerAngles(1, 0).front)).toBeCloseTo(0.785, 3); });
it('head looks at a target behind-left and clamps tilt', () => {
  const a = lookAngles({ x: 0, y: 1.4, z: 0 }, { x: -1, y: 1.4, z: -1 }, 0);
  expect(a.pan).toBeLessThan(0); expect(Math.abs(a.pan)).toBeLessThanOrEqual(2.6);
  expect(lookAngles({ x: 0, y: 1.4, z: 0 }, { x: 0, y: -50, z: 1 }, 0).tilt).toBe(-0.6);
});
it('blendPose halfway is the joint-wise mean', () => {
  const m = blendPose(ARM_POSES.stowed, ARM_POSES.lift, 0.5);
  expect(m.shoulder).toBeCloseTo((ARM_POSES.stowed.shoulder + ARM_POSES.lift.shoulder) / 2, 6);
});
```

- [ ] **Step 2:** `npx vitest run tests/pipRig.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt `pipRig.ts`, sửa `pip.ts` và `surfaceScene.ts` (`await Pip.create(...)`). Thêm mọi mesh của Pip vào shadow caster.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: toàn bộ PASS; `npm run build` OK.
- [ ] **Step 5: Kiểm tra bằng mắt** (chụp `docs/screens/plan2-pip-ingame-*.png`):
  - Pip chạy theo, bánh quay đúng chiều và lái khi rẽ.
  - Đầu nhìn theo người chơi; mặt hiện đúng 6 biểu cảm, không bị lật gương.
  - Tay nâng thùng và mang về vòng cam.
  - Đèn pha (phím Q, lệnh `light`) chiếu từ đầu.
  - Mắt nhiệt (T) vẫn hoạt động và tắt đi thì trả lại đúng vật liệu.
  - Thử xóa tạm `public/models/pip.glb`: game vẫn chạy bằng thân tạm.
- [ ] **Step 6: Commit** `feat: Pip GLB in game with wheel, steering, head and arm animation`

---

### Task 7: Model Mica và đưa vào game

**Files:**
- Create: `tools/blender/build_mica.py`, `public/models/mica.glb`
- Modify: `tests/models.test.ts` (`check('mica')`), `src/mica/mica.ts`, `src/mica/repairSystem.ts` (bánh quay khi kéo, nắp mở khi `openHatch`), `src/scenes/surfaceScene.ts`

**Interfaces:**
- Produces `mica.glb`:
  - Node: `mica_root`, `chassis`, `rocker_L`, `rocker_R`, `bogie_L`, `bogie_R`, `wheel_1`…`wheel_6` (1–3 bên trái từ trước ra sau), `wing_L`, `wing_R` (nằm ngang), `mast`, `eye`, `drill`, `hatch` (pivot ở bản lề).
  - Materials: `Mica_Body`, `Mica_Cells`, `Mica_Eye`, `Mica_Mesh` (bánh lưới).
  - `front = 'eye'`, `left = 'wing_L'`.
  - Cao 1,2–1,6 m, ≤ 20k tam giác.
- `Mica` giữ API Plan 1 (`root`, `meshes`, `dust` get/set, `setAwake`).
  - Thêm `static async create(scene, hm, pos): Promise<Mica>`, `setHatchOpen(open: boolean): void`, `rollWheels(distanceM: number): void` (dùng `wheelSpin` với bán kính 0,18 m).
  - `dust` điều khiển màu `Mica_Body` và `Mica_Cells` như Plan 1. `setAwake` điều khiển emissive của `Mica_Eye`.

- [ ] **Step 1:** Thêm `check('mica')` vào `tests/models.test.ts`, chạy `npx vitest run tests/models.test.ts`. Kỳ vọng: FAIL ở `exists`.
- [ ] **Step 2:** Viết `build_mica.py` dùng `common.py` và chạy qua Blender MCP. `look` 3 góc, sửa tới khi đúng Global Constraints (pin **nằm ngang**, cũ kỹ và trầy xước, khác hẳn Pip).
- [ ] **Step 3:** `npx vitest run tests/models.test.ts`. Kỳ vọng: PASS.
- [ ] **Step 4:** Sửa `mica.ts`, `repairSystem.ts`, `surfaceScene.ts`.
- [ ] **Step 5:** `npx vitest run` PASS; `npm run build` OK.
- [ ] **Step 6: Kiểm tra bằng mắt** (chụp `docs/screens/plan2-mica-*.png`):
  - Mica phủ bụi ở rìa hố.
  - Bánh quay khi được kéo.
  - EDS làm sạch dần.
  - Nắp mở khi Pip mở.
  - Mắt sáng khi Mica tỉnh.
- [ ] **Step 7: Commit** `feat: Mica rocker-bogie model with hatch and towing wheels`

---

### Task 8: Model phi hành gia và dáng đi trên Mặt Trăng

**Files:**
- Create: `tools/blender/build_astronaut.py`, `public/models/astronaut.glb`, `src/player/gait.ts`, `tests/gait.test.ts`
- Modify: `tests/models.test.ts` (`check('astronaut')`), `src/player/astronaut.ts`, `src/scenes/surfaceScene.ts`

**Interfaces:**
- Produces `astronaut.glb`:
  - Node: `astro_root` (gốc dưới chân), `pelvis`, `torso`, `helmet`, `visor` (kính chắn vàng, kéo xuống được bằng cách quay quanh X), `plss`, `lamp_L`, `lamp_R`, `upperArm_L/R`, `foreArm_L/R`, `glove_L/R`, `thigh_L/R`, `shin_L/R`, `boot_L/R`.
  - Materials: `Suit_White`, `Suit_Legs`, `Suit_Boots`, `Suit_Stripe`, `Visor_Gold`, `PLSS`.
  - `front = 'visor'`, `left = 'glove_L'`.
  - Cao 1,85–1,95 m, ≤ 20k tam giác.
- Produces (`gait.ts`, thuần):
  - `type GaitMode = 'idle' | 'walk' | 'lope' | 'air'`
  - `gaitMode(speedMs: number, lope: boolean, supported: boolean): GaitMode`: `air` khi không chạm đất; `idle` khi speed < 0,1; `lope` khi giữ Shift và speed > 0,1; còn lại `walk`.
  - `interface Pose { hipL: number; hipR: number; kneeL: number; kneeR: number; shoulderL: number; shoulderR: number; elbowL: number; elbowR: number; bob: number }`
  - `gaitPose(mode: GaitMode, phase: number): Pose`:
    - `walk`: chân ngược pha nhau, tay ngược pha với chân cùng bên.
    - `lope` (bước "thỏ" Apollo): **hai chân cùng pha**, `bob` lớn hơn `walk`.
    - `air`: chân hơi co, tay dang nhẹ.
    - `idle`: mọi khớp ≈ 0.
  - `advancePhase(phase: number, speedMs: number, dt: number, strideM = 1.4): number` trả pha mới trong [0, 1).
- `Astronaut`:
  - Capsule `root` giữ nguyên làm vật lý nhưng `isVisible = false`.
  - Model GLB gắn làm con của `root` với `position.y = -HEIGHT / 2`; nếu nạp lỗi thì giữ thân tạm của Plan 1.
  - Đèn `helmetLamp` gắn vào node `helmet`.
  - `onStep` (Task 3) phát khi pha đi qua 0 hoặc 0,5, thay cho quy tắc 0,7 m nếu có model.
  - Thêm `static async create(scene, hm, spawn): Promise<Astronaut>`.

- [ ] **Step 1: Viết test hỏng**

```ts
it('lope moves both legs together, walk moves them in opposition', () => {
  const l = gaitPose('lope', 0.25), w = gaitPose('walk', 0.25);
  expect(l.hipL).toBeCloseTo(l.hipR, 6);
  expect(Math.sign(w.hipL)).toBe(-Math.sign(w.hipR));
});
it('lope bobs more than walk', () => {
  const peak = (m: GaitMode) => Math.max(...Array.from({ length: 50 }, (_, i) => gaitPose(m, i / 50).bob));
  expect(peak('lope')).toBeGreaterThan(peak('walk'));
});
it('idle is the neutral pose', () => { expect(Object.values(gaitPose('idle', 0.3)).every((v) => Math.abs(v) < 1e-6)).toBe(true); });
it('gait mode picks air whenever unsupported', () => { expect(gaitMode(2, true, false)).toBe('air'); });
it('phase advances by distance over stride and wraps', () => {
  expect(advancePhase(0.9, 1.4, 0.2)).toBeCloseTo(0.1, 6);
});
```

- [ ] **Step 2:** `npx vitest run tests/gait.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Thêm `check('astronaut')`. Viết `build_astronaut.py`, chạy qua Blender MCP, `look` 3 góc, sửa tới khi đúng AxEMU (thân trắng, sọc màu, kính vàng, PLSS, 2 đèn mũ).
- [ ] **Step 4:** Cài đặt `gait.ts`, sửa `astronaut.ts` và `surfaceScene.ts`.
- [ ] **Step 5:** `npx vitest run` PASS; `npm run build` OK.
- [ ] **Step 6: Kiểm tra bằng mắt** (chụp `docs/screens/plan2-astronaut-*.png`):
  - Đi bộ: tay chân vung ngược pha.
  - Giữ Shift: nhảy "thỏ" hai chân cùng lúc.
  - Nhảy: tư thế trên không.
  - Đèn mũ chiếu từ mũ.
  - Ủng và chân xám dần sau một quãng đường (Task 5).
- [ ] **Step 7: Commit** `feat: AxEMU astronaut model with lunar walk and lope gait`

---

### Task 9: Module, thùng hàng, cờ, Starship HLS, trạm chuyển tiếp, búa và lông chim

**Files:**
- Create: `tools/blender/build_props.py`; `public/models/{solarTower,radiator,habitat,antenna,crate,flag,hls,relay,hammer,feather}.glb`
- Modify: `tests/models.test.ts` (mỗi id một `check(...)`), `src/interact/moduleSystem.ts` (`buildModule` và thùng hàng dùng GLB, dự phòng khối tạm), `src/science/experiments.ts` (búa/lông chim dùng GLB, giữ nguyên thân Havok 1,32 kg / 0,03 kg), `src/scenes/surfaceScene.ts` (đặt HLS tại `HLS_POS`)

**Interfaces:**
- Node bắt buộc (ngoài node gốc `<id>_root`):

| id | node bắt buộc | ghi chú |
|---|---|---|
| solarTower | `mast`, `panel_pivot`, `panel` | `panel_pivot` quay quanh trục đứng: thay `solarPanel` ở `moduleSystem` (vẫn hướng theo `sky.sunDir`); pin **dựng đứng** 2,4 × 5 m, đỉnh 8 m |
| radiator | `frame`, `fins` | tấm tản nhiệt trắng, đứng |
| habitat | `hull`, `hatch`, `dust_airlock` | trụ nằm ngang Ø4 × 8 m, có buồng khóa bụi |
| antenna | `pole`, `dish_pivot`, `dish` | |
| crate | `lid`, `body` | 1,2 × 0,9 × 1,2 m, có tem "ARTEMIS CARGO" vẽ bằng hình khối, không dùng chữ texture |
| flag | `pole`, `crossbar`, `cloth` | cờ Mỹ có thanh ngang trên (như Apollo, vì không có gió); `cloth` gồm 13 sọc và ô sao bằng hình khối hoặc vertex color |
| hls | `hull`, `elevator`, `legs`, `thrusters` | Starship HLS cao ~50 m, Ø9 m, thang máy ở thân; `front = 'elevator'` |
| relay | `mast`, `dish` | trạm chuyển tiếp cho Đỉnh Trái Đất (Plan 3 dùng) |
| hammer | `head`, `handle` | |
| feather | `quill`, `vane` | lông chim ưng (Apollo 15) |

- Mỗi model khai `heightM` đúng như Task 1 Step 3.
- `ModuleSystem.buildModule` giữ chữ ký nhưng trả `Promise<TransformNode>` nếu cần bất đồng bộ (ghi Ruling). Mọi mesh của module thêm vào shadow caster.

- [ ] **Step 1:** Thêm 10 `check(...)`, chạy `npx vitest run tests/models.test.ts`. Kỳ vọng: FAIL ở `exists`.
- [ ] **Step 2:** Viết `build_props.py` (một hàm cho mỗi id, mỗi id một scene `build_<id>`), chạy qua Blender MCP, `look` từng model.
- [ ] **Step 3:** `npx vitest run tests/models.test.ts`. Kỳ vọng: PASS.
- [ ] **Step 4:** Sửa `moduleSystem.ts`, `experiments.ts`, `surfaceScene.ts`. Chưa có tương tác cắm cờ (thuộc Plan 3): chỉ cần nạp được `flag`, chưa đặt vào thế giới.
- [ ] **Step 5:** `npx vitest run` PASS; `npm run build` OK.
- [ ] **Step 6: Kiểm tra bằng mắt** (chụp `docs/screens/plan2-props-*.png`):
  - HLS sừng sững ở bãi đáp, bóng đổ rất dài.
  - Lắp đủ 4 module.
  - Tấm pin xoay theo Mặt Trời.
  - Búa và lông chim rơi cùng lúc.
- [ ] **Step 7: Commit** `feat: base modules, cargo crates, HLS, relay and experiment props`

---

### Task 10: Rà soát hiệu năng và toàn cảnh

**Files:**
- Modify: chỉ khi đo thấy vượt ngân sách (ví dụ giảm `capacity` bụi, gộp mesh tĩnh của module bằng `Mesh.MergeMeshes`, thu hẹp `shadowMaxZ`)
- Create: `docs/screens/plan2-overview.png`

- [ ] **Step 1:** `npx vitest run` và `npm run build`. Kỳ vọng: toàn bộ PASS, build OK.
- [ ] **Step 2: Đo bằng `npm run dev` + Playwright.**
  - Đứng ở căn cứ khi đủ 4 module, nhảy 20 lần, chạy theo vệt bánh tới Mica cùng Pip.
  - Ghi `engine.getFps()` thấp nhất và số draw call (`scene.getActiveMeshes().length`, `engine._drawCalls` nếu có) vào ledger.
  - Kỳ vọng: FPS ≥ 30.
- [ ] **Step 3:** Nếu FPS < 30 thì sửa theo danh sách ở Files, ghi Ruling, rồi đo lại.
- [ ] **Step 4: Chơi trọn lát cắt Plan 1.** Gặp Pip, búa và lông chim, bóng, ăng-ten, 3 mẫu, 2 module, vệt bánh, Mica, kéo về, sửa, tỉnh. Mọi bước còn chạy đúng với model mới.
- [ ] **Step 5: Commit** `chore: plan 2 performance pass and overview screenshots`
