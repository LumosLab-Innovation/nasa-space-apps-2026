# Plan 1: Nền tảng & Lát cắt bề mặt (Pip & Mica) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một bản game 3D chạy trên trình duyệt, chơi được từ lúc phi hành gia bước ra bề mặt → gặp Pip → thí nghiệm búa & lông chim → lắp 1 module cùng Pip → thu mẫu → thấy vệt bánh xe → tìm thấy Mica → sửa Mica → Mica tỉnh dậy. Đồ hoạ dùng hình khối tạm (placeholder); mô hình thật thuộc Plan 3.

**Architecture:** Toàn bộ luật chơi (vật lý, trạng thái nhiệm vụ, hội thoại, "não" của Pip, máy trạng thái lắp module / sửa Mica, lịch thiên văn) viết thành **hàm TypeScript thuần**, không phụ thuộc Babylon, có unit test bằng Vitest. Lớp Babylon.js (scene, mesh, camera, Havok, GUI) chỉ đọc/ghi qua các hàm thuần đó và được kiểm tra bằng mắt qua dev server. Dữ liệu NASA (JPL Horizons, LOLA) được tải **lúc build** bằng script Node và lưu vào `public/data/` để game chạy offline.

**Tech Stack:** Vite 8, TypeScript ~5.9, @babylonjs/core + gui + loaders 9.34, @babylonjs/havok 1.3, Vitest 5, Node 24; script dữ liệu dùng `geotiff`.

**Spec:** `docs/2026-11-06-pip-mica-thiet-ke-game.md` (bản 2.0). Executor đọc cả spec.

## Lộ trình 4 plan

| Plan | Nội dung | Kết quả chạy được |
|---|---|---|
| **1 (file này)** | Nền tảng, thế giới mở có địa hình, nhân vật, Pip đi theo, lắp module, mẫu vật, vệt bánh xe, Mica | Lát cắt bề mặt chơi được với hình khối tạm |
| 2 | Cảnh phim hạ cánh 3D (M1–M6) + chế độ demo 3 phút `?demo=1` | Demo hoàn chỉnh từ quỹ đạo đến Mica |
| 3 | Mô hình: kho NASA 3D + Blender (Pip, Mica, Starship HLS, module) → GLB, thay placeholder | Đồ hoạ thật |
| 4 | Hồi 2 đầy đủ, bão DONKI, Bóng Dài, Kết, âm thanh, tiếng Việt, video nộp bài | Bản nộp |

## Global Constraints

- Trọng lực: `LUNAR_G = 1.62` m/s² (spec §7). Không có lực cản không khí: mọi physics body `linearDamping = 0`, `angularDamping = 0`.
- Ánh sáng: **không** có ambient light / environment texture; bầu trời đen `clearColor = (0,0,0,1)`; nguồn sáng duy nhất là Mặt Trời (directional) lấy hướng từ dữ liệu Horizons (spec §5.6, §7).
- Pip có **tính cách cố định, không có thanh chỉnh hài hước** (spec §3.2 [Đã chốt]). Pip và Mica **không quen nhau** trước Hồi 4.
- **Không có màn "thua"**: mọi thất bại → lời giải thích của Pip + thử lại (spec §5.8).
- Toàn bộ chữ hiển thị nằm trong `src/content/*.en.ts|json` (tiếng Anh trước, spec §13).
- Mọi thẻ kiến thức có `tag: 'real' | 'fiction' | 'debated'` và `source` (spec §5.7, §10).
- Game phải chạy **không cần mạng** sau khi build (spec §8).
- Ngoại hình Pip/Mica không được giống TARS/CASE/KIPP (spec §1.4).
- Toạ độ bãi đáp: `SITE = { latDeg: -89.45, lonDegEast: 222.7 }` (gần sườn Shackleton–de Gerlache; xấp xỉ, ghi rõ trong `SOURCES.md`).
- Thế giới: hình vuông `WORLD_SIZE_M = 1500`, tâm tại (0,0); lưới địa hình `513 × 513` đỉnh.

## Review Focus

1. **Người chơi đi ra mép bản đồ hoặc rơi xuống hố dốc** → phải bị giữ trong biên (không rơi ra ngoài, không kẹt). Test: `clampToWorld` (Task 8).
2. **Pip kẹt sau đá hoặc bị bỏ xa** → sau 3 giây ở khoảng cách > 25 m, Pip dịch chuyển về sau lưng người chơi. Test: `pipBrain catch-up` (Task 9).
3. **Người chơi đến chỗ Mica trước khi đủ điều kiện mở vệt bánh xe** → cảnh tìm thấy Mica vẫn phải kích hoạt. Test: `micaFound without tracks` (Task 12).
4. **Bấm E liên tục / bấm khi đang hội thoại** → module chỉ được lắp một lần, mẫu chỉ được tính một lần. Test: `installModule idempotent`, `addSample idempotent` (Task 3).
5. **File dữ liệu thiếu hoặc hỏng (không có Horizons/heightmap)** → game vẫn chạy với dữ liệu dự phòng (Mặt Trời cố định az 0° el 1.5°, địa hình thủ tục). Test: `loadEphemeris fallback`, `loadHeightmap fallback` (Task 5, 6).

---

## File Structure

```
package.json, tsconfig.json, vite.config.ts, index.html, .gitignore
scripts/
  fetch-horizons.mjs        — tải lịch Mặt Trời/Trái Đất từ JPL Horizons → public/data/ephemeris/
  build-heightmap.mjs       — cắt DEM LOLA → public/data/terrain/heightmap.f32 + .json
public/data/
  ephemeris/sun.json, earth.json, SOURCES.md
  terrain/heightmap.f32, heightmap.json, SOURCES.md
src/
  main.ts                   — khởi động Engine, Havok, SurfaceScene
  config/constants.ts       — hằng số toàn cục (Global Constraints)
  physics/lunar.ts          — công thức vật lý thuần
  physics/thermal.ts        — nhiệt độ bề mặt theo góc chiếu
  core/gameState.ts         — GameState + actions + selectors
  core/events.ts            — event bus có kiểu
  dialogue/runner.ts        — chạy kịch bản hội thoại
  content/lines.en.ts       — lời thoại (tiếng Anh)
  content/cards.en.json     — thẻ kiến thức
  data/ephemeris.ts         — nạp + nội suy lịch thiên văn, findMissionStart
  data/heightmap.ts         — nạp heightmap, lấy độ cao, địa hình dự phòng
  data/polar.ts             — chiếu cực nam (lat/lon → x,y)
  world/terrain.ts          — mesh địa hình Babylon
  world/sky.ts              — Mặt Trời, bóng đổ, Trái Đất, sao
  world/zones.ts            — vị trí 6 khu, thùng hàng, Mica, vệt bánh xe
  world/tracks.ts           — vẽ vệt bánh xe
  player/movement.ts        — hàm thuần: vận tốc từ input, clampToWorld
  player/astronaut.ts       — character controller Havok + camera
  pip/brain.ts              — máy trạng thái Pip (thuần)
  pip/pip.ts                — mesh Pip + mặt biểu cảm + lệnh
  interact/resolver.ts      — chọn vật tương tác gần nhất (thuần)
  interact/moduleInstall.ts — máy trạng thái lắp module (thuần)
  mica/sequence.ts          — kích hoạt vệt bánh xe / tìm thấy Mica (thuần)
  mica/repair.ts            — máy trạng thái sửa Mica (thuần)
  mica/mica.ts              — mesh Mica + lớp bụi
  science/experiments.ts    — búa & lông chim, đo bóng
  ui/hud.ts, ui/dialogueBox.ts, ui/notebook.ts, ui/thermalView.ts
  scenes/surfaceScene.ts    — lắp ráp tất cả
tests/                      — mỗi module thuần một file *.test.ts
```

---

### Task 1: Khung dự án + cảnh đen có Havok

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.ts`, `src/config/constants.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `constants.ts` export `LUNAR_G = 1.62`, `EARTH_G = 9.81`, `WORLD_SIZE_M = 1500`, `TERRAIN_VERTS = 513`, `SITE = { latDeg: -89.45, lonDegEast: 222.7 }`, `MOON_RADIUS_KM = 1737.4`, `EARTH_MOON_KM = 384400`, `C_KM_S = 299792.458`, `SOLAR_CONST = 1361`, `SIGMA = 5.670374e-8`.
- Produces: `main.ts` export `async function boot(canvas: HTMLCanvasElement): Promise<void>`.

- [ ] **Step 1:** `git init`; tạo `package.json` với scripts `dev: vite`, `build: tsc --noEmit && vite build`, `test: vitest run`; dependencies `@babylonjs/core@^9.34.0 @babylonjs/gui@^9.34.0 @babylonjs/loaders@^9.34.0 @babylonjs/havok@^1.3.14`; devDependencies `vite@^8.3.6 vitest@^5.1.0 typescript@~5.9.0 geotiff`. Chạy `npm install`.
- [ ] **Step 2:** `vite.config.ts`: `optimizeDeps: { exclude: ['@babylonjs/havok'] }`. `tsconfig.json`: `strict: true`, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`.
- [ ] **Step 3: Viết test smoke** `tests/smoke.test.ts`: `expect(LUNAR_G).toBe(1.62)` và `expect(LUNAR_G / EARTH_G).toBeCloseTo(0.165, 3)`.
- [ ] **Step 4:** Chạy `npm test` → PASS.
- [ ] **Step 5:** `main.ts`: tạo `Engine`, `Scene` với `clearColor` đen, nạp Havok bằng `HavokPhysics({ locateFile: () => wasmUrl })` (import `@babylonjs/havok/lib/esm/HavokPhysics.wasm?url`), `scene.enablePhysics(new Vector3(0, -LUNAR_G, 0), new HavokPlugin(true, havok))`; một hộp xám rơi xuống mặt phẳng. `index.html` có `<canvas id="game">` full màn hình.
- [ ] **Step 6:** Chạy `npm run dev`, mở `http://localhost:5173` → thấy nền đen, hộp rơi chậm (~1/6 tốc độ thường), console không có lỗi. Chạy `npm run build` → thành công.
- [ ] **Step 7: Commit** `feat: scaffold Vite + Babylon + Havok with lunar gravity`.

### Task 2: Vật lý Mặt Trăng (hàm thuần)

**Files:** Create `src/physics/lunar.ts`, `src/physics/thermal.ts`, `tests/physics.test.ts`

**Interfaces — Produces:**
- `fallTime(heightM: number, g = LUNAR_G): number`
- `shadowLength(objectHeightM: number, sunElevDeg: number): number` (trả `Infinity` khi `sunElevDeg <= 0`)
- `kineticEnergy(massKg: number, speedMs: number): number`
- `tntEquivalentKg(joules: number): number` (4.184e6 J/kg)
- `lightDelayOneWayS(distanceKm = EARTH_MOON_KM): number`
- `equilibriumTempK(cosIncidence: number, absorptivity = 0.9, emissivity = 0.95): number`
- `surfaceTempC(cosIncidence: number, inShadow: boolean, shadowTempC = -150): number`

- [ ] **Step 1: Viết test**
```ts
expect(fallTime(1.5)).toBeCloseTo(1.361, 3);
expect(fallTime(1.5, EARTH_G)).toBeCloseTo(0.553, 3);
expect(shadowLength(1, 1.5)).toBeCloseTo(38.19, 2);
expect(shadowLength(1, 0)).toBe(Infinity);
expect(kineticEnergy(0.001, 20000)).toBe(200000);
expect(tntEquivalentKg(200000)).toBeCloseTo(0.0478, 4);
expect(lightDelayOneWayS()).toBeCloseTo(1.282, 3);
expect(equilibriumTempK(1)).toBeCloseTo(388.3, 1);
expect(surfaceTempC(1, false)).toBeCloseTo(115.2, 1);
expect(surfaceTempC(0.5, false)).toBeCloseTo(53.4, 1);
expect(surfaceTempC(1, true)).toBe(-150);
expect(surfaceTempC(-0.3, false)).toBe(-150);
```
- [ ] **Step 2:** `npm test` → FAIL (chưa có module).
- [ ] **Step 3:** Cài đặt. `equilibriumTempK = (absorptivity·SOLAR_CONST·cos / (emissivity·SIGMA))^0.25`; `surfaceTempC` trả `shadowTempC` khi `inShadow || cos <= 0`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: lunar physics formulas`.

### Task 3: Trạng thái game & điều kiện nhiệm vụ

**Files:** Create `src/core/gameState.ts`, `src/core/events.ts`, `tests/gameState.test.ts`

**Interfaces — Produces:**
```ts
type ModuleId = 'solarTower' | 'radiator' | 'habitat' | 'antenna';
type SampleId = 'anorthosite' | 'breccia' | 'glassBeads' | 'regolith' | 'freshCrater' | 'iceRegolith';
type DataLogId = 'tempSunShade' | 'dustDepth' | 'sunAngleShadow' | 'radiation' | 'commDelay';
interface GameState { modules: Set<ModuleId>; samples: Set<SampleId>; dataLogs: Set<DataLogId>; flags: Set<string>; unlockedCards: Set<string>; }
createState(): GameState
installModule(s, id): boolean        // true nếu mới lắp, false nếu đã có
addSample(s, id): boolean
logData(s, id): boolean
setFlag(s, flag): boolean
unlockCard(s, cardId): boolean
tracksUnlocked(s): boolean           // modules.size >= 2 && samples.size >= 3
```
- `events.ts`: `class EventBus<E extends Record<string, unknown>> { on(k, fn): () => void; emit(k, payload): void }`. Kiểu sự kiện `GameEvents = { moduleInstalled: ModuleId; sampleAdded: SampleId; dataLogged: DataLogId; flagSet: string; cardUnlocked: string }`.

- [ ] **Step 1: Viết test**: `installModule` lần 1 trả `true`, lần 2 trả `false` và `modules.size === 1`; tương tự `addSample`; `tracksUnlocked` false với 1 module + 3 mẫu, false với 2 module + 2 mẫu, true với 2 module + 3 mẫu; `EventBus.on` trả hàm huỷ, sau khi huỷ không nhận emit nữa.
- [ ] **Step 2:** chạy → FAIL. **Step 3:** cài đặt. **Step 4:** chạy → PASS.
- [ ] **Step 5: Commit** `feat: game state, quest conditions, event bus`.

### Task 4: Hệ thống hội thoại + lời thoại lát cắt

**Files:** Create `src/dialogue/runner.ts`, `src/content/lines.en.ts`, `tests/dialogue.test.ts`

**Interfaces:**
- Consumes: `lightDelayOneWayS` (Task 2), `GameState`/`setFlag` (Task 3).
- Produces:
```ts
type Speaker = 'pip' | 'mica' | 'houston' | 'commander' | 'player';
type PipFace = 'happy' | 'curious' | 'worried' | 'sad' | 'dots' | 'sleep';
interface Line { speaker: Speaker; text: string; face?: PipFace; pauseBeforeMs?: number; setFlag?: string; }
type Script = Record<string, Line[]>;
class DialogueRunner {
  constructor(script: Script, state: GameState);
  start(id: string): Line;        // throw nếu id không tồn tại
  next(): Line | null;            // null khi hết; set flag `dialogue:<id>:done`
  get active(): boolean;
}
houstonDelayMs(): number          // Math.round(2 * lightDelayOneWayS() * 1000) === 2564
```
- Lời thoại Houston tự động có `pauseBeforeMs = houstonDelayMs()` nếu không ghi rõ.

- [ ] **Step 1: Viết test**: `houstonDelayMs() === 2564`; chạy hết một script 3 dòng → dòng thứ 4 `next()` trả `null`, `active === false`, `state.flags.has('dialogue:test:done')`; dòng có `setFlag: 'x'` → flag `x` được set khi dòng đó hiện; dòng houston không có `pauseBeforeMs` → nhận 2564; `start('nope')` throw.
- [ ] **Step 2:** FAIL. **Step 3:** cài đặt runner.
- [ ] **Step 4:** Viết `lines.en.ts` với các id: `meetPip`, `silenceExplain`, `hammerFeather`, `shadowQuiz`, `firstSample`, `houstonWelcome`, `moduleDone`, `tracksFound`, `followTracks`, `micaFound`, `micaIdentify`, `micaWake`. Nội dung dịch sang tiếng Anh **giữ nguyên ý** từ spec §6 (Hồi 1 cảnh 1.2–1.6, Hồi 3 cảnh 3.1–3.4, Hồi 4 cảnh 4.4). `micaFound` dòng đầu có `face: 'dots'`, `pauseBeforeMs: 5000`, `text: ''` (nhịp im lặng 5 giây).
- [ ] **Step 5:** Thêm test: mọi id trên tồn tại trong `lines.en.ts` và không mảng nào rỗng. Chạy → PASS.
- [ ] **Step 6: Commit** `feat: dialogue runner and slice script`.

### Task 5: Lịch thiên văn (JPL Horizons)

**Files:** Create `scripts/fetch-horizons.mjs`, `src/data/ephemeris.ts`, `public/data/ephemeris/{sun.json,earth.json,SOURCES.md}`, `tests/ephemeris.test.ts`

**Interfaces — Produces:**
```ts
interface EphemSample { t: number /* epoch ms UTC */; az: number /* độ, 0=Bắc, theo chiều kim đồng hồ */; el: number /* độ */ }
interface Ephemeris { sun: EphemSample[]; earth: EphemSample[]; source: 'horizons' | 'fallback' }
loadEphemeris(fetchFn = fetch): Promise<Ephemeris>   // lỗi → fallback: sun {az:0, el:1.5} cố định, earth {az:0, el:3}
sampleAt(samples: EphemSample[], tMs: number): { az: number; el: number }  // nội suy tuyến tính, az đi đường ngắn qua 0/360
findMissionStart(e: Ephemeris, minEarthUpHours = 120): number  // giờ đầu tiên: sun.el > 0, earth.el > 2 và earth.el > 0 liên tục ≥ minEarthUpHours
```

- [ ] **Step 1: Viết test**: nội suy `{az:350,el:1}`→`{az:10,el:2}` tại giữa → `az ≈ 0` (hoặc 360), `el = 1.5`; `t` trước mẫu đầu → trả mẫu đầu; `loadEphemeris` với `fetchFn` ném lỗi → `source === 'fallback'` và `sampleAt(sun, any).el === 1.5`; `findMissionStart` trên dữ liệu giả 200 giờ (Trái Đất lặn ở giờ 0–9, lên từ giờ 10) trả `t` của giờ 10.
- [ ] **Step 2:** FAIL. **Step 3:** cài đặt `ephemeris.ts`.
- [ ] **Step 4:** Viết `fetch-horizons.mjs`: gọi `https://ssd.jpl.nasa.gov/api/horizons.api` với `format=json`, `COMMAND='10'` (Mặt Trời) rồi `'399'` (Trái Đất), `CENTER='coord@301'`, `COORD_TYPE='GEODETIC'`, `SITE_COORD='222.7,-89.45,0'`, `EPHEM_TYPE='OBSERVER'`, `QUANTITIES='4'`, `START_TIME='2028-01-01'`, `STOP_TIME='2028-03-01'`, `STEP_SIZE='1 h'`. Tách các dòng giữa `$$SOE` và `$$EOE`, lấy azimuth/elevation, ghi `[{t,az,el}]`. Ghi URL + ngày tải vào `SOURCES.md`.
- [ ] **Step 5:** Chạy `node scripts/fetch-horizons.mjs` → hai file JSON mỗi file ~1400 mẫu; kiểm tra tay: `el` Mặt Trời luôn trong khoảng −2°..+2.5° (đúng với cực Nam). Nếu lệch xa → sai dấu kinh/vĩ độ, sửa trước khi commit.
- [ ] **Step 6:** `npm test` → PASS. **Commit** `feat: Horizons ephemeris pipeline with fallback`.

### Task 6: Địa hình từ LOLA + địa hình dự phòng

**Files:** Create `src/data/polar.ts`, `src/data/heightmap.ts`, `scripts/build-heightmap.mjs`, `src/world/terrain.ts`, `public/data/terrain/{heightmap.f32,heightmap.json,SOURCES.md}`, `tests/heightmap.test.ts`

**Interfaces — Produces:**
```ts
// polar.ts — chiếu cực nam (south polar stereographic), bán kính MOON_RADIUS_KM
latLonToPolarStereoKm(latDeg: number, lonDegEast: number): { x: number; y: number }
// heightmap.ts
interface Heightmap { size: number; worldSizeM: number; heights: Float32Array; source: 'lola' | 'procedural' }
sampleHeight(hm: Heightmap, x: number, z: number): number   // bilinear; x,z là mét, tâm (0,0); ngoài biên → kẹp vào mép
generateCraterField(size: number, worldSizeM: number, seed: number): Heightmap  // mulberry32, ~40 hố hình bát + 3 hố lớn có đỉnh giữa
loadHeightmap(fetchFn = fetch): Promise<Heightmap>             // lỗi → generateCraterField(513, 1500, 42)
// terrain.ts
createTerrain(scene: Scene, hm: Heightmap): Mesh               // mesh có PhysicsAggregate dạng MESH, vật liệu PBR xám, không phản chiếu môi trường
```

- [ ] **Step 1: Viết test**: `latLonToPolarStereoKm(-90, 0)` → `{x:0,y:0}`; với `(-89.45, 222.7)` → `Math.hypot(x,y) ≈ 16.68` (±0.01); `sampleHeight` trên lưới 3×3 heights `[0,0,0, 0,10,0, 0,0,0]`, worldSize 2 → tại (0,0) = 10, tại (0.5,0) = 5, tại (99,99) = 0; `generateCraterField` cùng seed → mảng giống hệt, khác seed → khác; `loadHeightmap` với fetch lỗi → `source === 'procedural'`.
- [ ] **Step 2:** FAIL. **Step 3:** cài đặt `polar.ts`, `heightmap.ts`.
- [ ] **Step 4: Lấy dữ liệu LOLA.** Tìm trên `pgda.gsfc.nasa.gov` một DEM GeoTIFF cực Nam phủ được SITE với độ phân giải ≤ 20 m/pixel (tìm "LOLA south pole DEM"). Ghi URL + trích dẫn vào `SOURCES.md`. Nếu không tải được trong 30 phút → dùng địa hình dự phòng, ghi rõ trong `SOURCES.md`, và chuyển tiếp.
- [ ] **Step 5:** `build-heightmap.mjs <input.tif>`: đọc GeoTIFF bằng `geotiff`, dùng tie-point + pixel scale của file và `latLonToPolarStereoKm(SITE)` để tìm pixel tâm, cắt vùng 3 km × 3 km, **nén theo tỉ lệ game** về 513×513 (spec §4: thế giới thu nhỏ), trừ độ cao trung bình, ghi Float32 little-endian ra `heightmap.f32` + `heightmap.json {size, worldSizeM, source:'lola'}`.
- [ ] **Step 6:** `createTerrain` + gắn vào `main.ts` thay mặt phẳng Task 1. `npm run dev` → thấy địa hình có hố; hộp rơi đứng trên mặt đất.
- [ ] **Step 7:** `npm test` → PASS. **Commit** `feat: LOLA terrain pipeline with procedural fallback`.

### Task 7: Bầu trời, Mặt Trời thấp, Trái Đất

**Files:** Create `src/world/sky.ts`, `src/core/clock.ts`, `tests/clock.test.ts`

**Interfaces:**
- Consumes: `Ephemeris`, `sampleAt`, `findMissionStart` (Task 5).
- Produces:
```ts
class GameClock { constructor(startMs: number, timeScale = 60); tick(dtRealS: number): void; get nowMs(): number; skipHours(h: number): void }
azElToDirection(azDeg: number, elDeg: number): { x: number; y: number; z: number }  // vector đơn vị TỪ người quan sát TỚI vật; +z = Bắc, +x = Đông, +y = lên
createSky(scene: Scene, eph: Ephemeris, clock: GameClock): { sun: DirectionalLight; shadows: CascadedShadowGenerator; update(): void }
```
- [ ] **Step 1: Viết test**: `azElToDirection(0,0)` ≈ `(0,0,1)`; `(90,0)` ≈ `(1,0,0)`; `(0,90)` ≈ `(0,1,0)`; `GameClock(0,60).tick(1)` → `nowMs === 60000`; `skipHours(2)` cộng `7.2e6`.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt → **Step 4:** PASS.
- [ ] **Step 5:** `createSky`: `DirectionalLight` hướng `-azElToDirection(sun)`, cường độ cao; `CascadedShadowGenerator` (bóng đổ dài phải hiện đủ ~40 m sau tảng đá 1 m); **không** `HemisphericLight`, `scene.environmentTexture = null`, `scene.ambientColor = black`. Trái Đất: quả cầu tự phát sáng (emissive), có texture xanh lam, đặt rất xa theo hướng `earth` az/el. Sao: hệ hạt điểm trắng, `visibility = 0` mặc định (Plan 4 mới bật khi đứng trong bóng tối).
- [ ] **Step 6:** Đặt một hộp cao 1 m. `npm run dev` → bóng hộp dài khoảng 38 m, trời đen, Trái Đất sát chân trời. Chụp màn hình lưu `docs/screens/task7.png`.
- [ ] **Step 7: Commit** `feat: low sun, long shadows, Earth from ephemeris`.

### Task 8: Phi hành gia & camera

**Files:** Create `src/player/movement.ts`, `src/player/astronaut.ts`, `tests/movement.test.ts`

**Interfaces — Produces:**
```ts
interface MoveInput { forward: number; right: number; jump: boolean } // -1..1
computeMoveVelocity(input: MoveInput, cameraYawRad: number, speedMs = 1.8): { x: number; z: number }
clampToWorld(x: number, z: number, worldSizeM = WORLD_SIZE_M, marginM = 10): { x: number; z: number }
JUMP_SPEED_MS = 1.6   // đỉnh nhảy ≈ v²/(2g) = 0.79 m
class Astronaut { constructor(scene: Scene, hm: Heightmap, spawn: Vector3); readonly position: Vector3; readonly yaw: number; update(dt: number, input: MoveInput): void }
```
- [ ] **Step 1: Viết test**: `computeMoveVelocity({forward:1,right:0,jump:false}, 0)` → `{x:0, z:1.8}`; với yaw `π/2` → `{x:1.8, z:0}` (±1e-9); input chéo `(1,1)` được chuẩn hoá → độ dài 1.8; `clampToWorld(800, 0)` → `x === 740`; `clampToWorld(0,0)` không đổi; đỉnh nhảy `JUMP_SPEED_MS**2/(2*LUNAR_G) ≈ 0.79`.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt thuần → **Step 4:** PASS.
- [ ] **Step 5:** `Astronaut`: `PhysicsCharacterController` của Babylon (hình viên nang cao 1.9 m, có placeholder là khối trắng đội mũ cầu), trọng lực `-LUNAR_G`; camera `ArcRotateCamera` góc nhìn thứ ba bám theo; WASD + chuột; Space nhảy; mỗi khung hình áp `clampToWorld`.
- [ ] **Step 6:** `npm run dev` → đi lại được trên địa hình, nhảy lơ lửng chậm, không đi ra ngoài biên. **Commit** `feat: astronaut controller with lunar gravity`.

### Task 9: Pip — não & thân

**Files:** Create `src/pip/brain.ts`, `src/pip/pip.ts`, `tests/pipBrain.test.ts`

**Interfaces:**
- Consumes: `PipFace` (Task 4), `Heightmap`/`sampleHeight` (Task 6).
- Produces:
```ts
type PipMode = 'follow' | 'wait' | 'goto' | 'task';
interface PipInput { pip: {x:number; z:number}; player: {x:number; z:number}; playerYawRad: number; dt: number; mode: PipMode; gotoTarget?: {x:number; z:number} }
interface PipOutput { target: {x:number; z:number} | null; speedMs: number; teleportTo: {x:number; z:number} | null }
class PipBrain { farTimerS: number; update(i: PipInput): PipOutput }
FOLLOW_OFFSET = { back: 2.5, left: 1.0 }; STOP_DIST = 2.0; WALK = 1.6; RUN = 4.0; RUN_DIST = 8; CATCHUP_DIST = 25; CATCHUP_S = 3
class Pip { constructor(scene: Scene, hm: Heightmap); readonly position: Vector3; mode: PipMode; setFace(f: PipFace): void; update(dt: number, player: Astronaut): void; command(c: 'lift' | 'light' | 'scan' | 'pull' | 'wait' | 'come'): void }
```
- [ ] **Step 1: Viết test**: player ở (0,0) yaw 0, Pip ở (0,−1.5) → `target === null` (trong STOP_DIST); Pip ở (0,−6) → target là điểm sau-trái người chơi `(-1, -2.5)`, `speedMs === WALK`; Pip ở (0,−12) → `speedMs === RUN`; mode `wait` → `target === null` bất kể khoảng cách; Pip ở (0,−30): gọi `update` dt 1 ba lần → lần 3 có `teleportTo` = điểm sau lưng và `farTimerS` reset về 0; mode `goto` → target = `gotoTarget`.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt `PipBrain` → **Step 4:** PASS.
- [ ] **Step 5:** `Pip`: thân hình trứng trắng sọc cam (placeholder), bánh xích là hai hộp, một cánh tay (2 đoạn trụ), đèn pha (`SpotLight`, tắt mặc định), **mặt** là plane dùng `DynamicTexture` vẽ 6 biểu cảm (mắt tròn/cong/hai chấm/nhắm). Di chuyển kinematic theo `PipBrain` và bám `sampleHeight`. Bụi: khi chạy sinh hạt bay theo parabol (gravity `-LUNAR_G`, không có lực cản) rồi biến mất khi chạm đất.
- [ ] **Step 6:** `npm run dev` → Pip đi theo, chạy khi bị bỏ xa, dịch chuyển khi bị bỏ > 25 m; Q mở vòng lệnh tối thiểu (`wait`/`come`). **Commit** `feat: Pip follow brain and placeholder body`.

### Task 10: Tương tác & lắp module cùng Pip

**Files:** Create `src/interact/resolver.ts`, `src/interact/moduleInstall.ts`, `src/world/zones.ts`, `src/ui/hud.ts`, `tests/interact.test.ts`

**Interfaces — Produces:**
```ts
interface Interactable { id: string; x: number; z: number; enabled: boolean; prompt: string }
pickInteractable(list: Interactable[], player: {x:number; z:number}, yawRad: number, radius = 2.5): Interactable | null  // gần nhất; hoà → góc lệch với hướng nhìn nhỏ hơn
type InstallStage = 'crate' | 'needsLift' | 'lifted' | 'aligning' | 'installed';
class ModuleInstall { constructor(id: ModuleId); stage: InstallStage; playerUse(): void; pipLift(pipDistM: number): boolean /* false nếu > 3 m */; holdAlign(dtS: number): void /* 1.5 s → installed */; releaseAlign(): void }
zones.ts: ZONES (6 khu theo spec §4, toạ độ trong ±700 m), CRATES: { moduleId: ModuleId; x; z }[], MICA_POS, TRACKS_PATH: {x;z}[] (≥ 12 điểm ngoằn ngoèo từ Cánh Đồng Miệng Hố tới MICA_POS, có 1 vòng tròn tại chỗ)
hud.ts: createHud(scene): { showPrompt(text: string | null): void; toast(text: string): void }
```
- [ ] **Step 1: Viết test**: `pickInteractable` bỏ qua `enabled:false` và vật ngoài 2.5 m; hai vật cùng khoảng cách → chọn vật nằm trước mặt; `ModuleInstall`: `playerUse` ở 'crate' → 'needsLift'; `pipLift(4)` → false, giữ nguyên stage; `pipLift(2)` → 'lifted'; `holdAlign(1.0)` rồi `releaseAlign()` → về 'lifted' (tiến độ reset); `holdAlign(1.5)` → 'installed'; gọi tiếp `playerUse` sau khi installed → stage không đổi.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt → **Step 4:** PASS.
- [ ] **Step 5:** Nối vào scene: thùng hàng là các khối có nhãn; E tương tác; khi `needsLift` HUD gợi ý "Q → Pip, lift!"; Pip chạy tới, giơ tay, khối nâng lên; giữ E 1.5 s để căn → module (khối lớn) xuất hiện tại Trại Shackleton, gọi `installModule`, chạy thoại `moduleDone`. Áp dụng cho `solarTower` và `radiator`.
- [ ] **Step 6:** Chơi thử: lắp được 2 module; bấm E liên tục không lắp trùng. **Commit** `feat: co-op module installation`.

### Task 11: Khoảnh khắc khoa học, mẫu vật, Sổ tay

**Files:** Create `src/science/experiments.ts`, `src/ui/notebook.ts`, `src/ui/dialogueBox.ts`, `src/content/cards.en.json`, `tests/cards.test.ts`

**Interfaces:**
- Consumes: `fallTime`, `shadowLength`, `lightDelayOneWayS` (Task 2); `addSample`, `logData`, `unlockCard` (Task 3); `DialogueRunner` (Task 4).
- Produces:
```ts
interface Card { id: string; title: string; body: string; tag: 'real' | 'fiction' | 'debated'; source: { label: string; url: string } }
startHammerFeather(scene: Scene, at: Vector3): Promise<{ hammerS: number; featherS: number }>  // hai body Havok, damping 0, thả cùng lúc từ 1.5 m, đo thời gian chạm đất
createDialogueBox(scene, runner: DialogueRunner, pip: Pip): { play(id: string): Promise<void> }  // áp face, chờ pauseBeforeMs
createNotebook(scene, state: GameState, cards: Card[]): { toggle(): void }  // Tab
```
- [ ] **Step 1: Viết test** cho `cards.en.json`: đúng 10 thẻ, id duy nhất, mỗi thẻ có `tag` hợp lệ và `source.url` bắt đầu bằng `https://`; có các id `hammerFeather`, `longShadows`, `anorthosite`, `noSound`, `apollo17Dust`, `tracksLast`, `eds`, `lightDelay`, `sunFacingHeat`, `micaFiction` (tag `fiction`).
- [ ] **Step 2:** FAIL → **Step 3:** viết `cards.en.json` (nội dung lấy từ spec §1.1, §6, §7, §10; nguồn: trang NASA tương ứng) → **Step 4:** PASS.
- [ ] **Step 5:** Nối scene: (a) cảnh `meetPip` khi người chơi bước ra lần đầu; (b) thí nghiệm búa & lông chim ở gần bãi đáp → HUD hiện hai thời gian đo được (≈1.36 s, chênh nhau < 0.05 s) + mở thẻ `hammerFeather`; (c) tảng đá 1 m: chạy `shadowQuiz`, `logData('sunAngleShadow')`; (d) Pip `scan` làm 3 viên mẫu gần nhất phát sáng 5 s; E nhặt → `addSample`, mở thẻ; (e) ăng-ten tạm: chạy `houstonWelcome` (Houston trễ 2.564 s), `logData('commDelay')`.
- [ ] **Step 6:** Chơi thử toàn bộ Hồi 1; Tab mở Sổ tay thấy các thẻ đã mở kèm nhãn Real/Fiction. **Commit** `feat: science moments, samples, notebook`.

### Task 12: Vệt bánh xe & tìm thấy Mica

**Files:** Create `src/mica/sequence.ts`, `src/world/tracks.ts`, `src/mica/mica.ts`, `tests/micaSequence.test.ts`

**Interfaces:**
- Consumes: `tracksUnlocked` (Task 3), `TRACKS_PATH`, `MICA_POS` (Task 10).
- Produces:
```ts
type MicaStage = 'hidden' | 'tracksSeen' | 'following' | 'found';
nextMicaStage(stage: MicaStage, s: GameState, player: {x;z}, tracksStart: {x;z}, micaPos: {x;z}): MicaStage
// hidden → tracksSeen: tracksUnlocked && dist(player, tracksStart) < 15
// tracksSeen → following: dist(player, tracksStart) < 4
// bất kỳ stage nào → found: dist(player, micaPos) < 6  (kể cả khi chưa mở tracks)
// found là trạng thái cuối
createTracks(scene, path, hm): Mesh   // hai dải vệt song song (6 bánh → 2 dải rộng), bám mặt đất, luôn hiển thị
class Mica { constructor(scene, hm, pos); dust: number /* 0..1, ban đầu 1 */; setAwake(on: boolean): void }  // hộp vuông 6 bánh, hai cánh pin phẳng, một mắt tròn; lớp bụi = vật liệu xám đè lên theo dust
```
- [ ] **Step 1: Viết test**: chưa đủ điều kiện + đứng cạnh tracksStart → vẫn 'hidden'; đủ điều kiện + cách 10 m → 'tracksSeen'; 'tracksSeen' + cách 3 m → 'following'; 'hidden' + cách Mica 5 m → 'found' (Review Focus #3); 'found' + đi xa → vẫn 'found'.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt → **Step 4:** PASS.
- [ ] **Step 5:** Nối scene: 'tracksSeen' → chạy thoại `tracksFound` (Pip mặt `curious`); 'following' → `followTracks`; 'found' → tắt mọi âm thanh UI, Pip `face 'dots'` 5 s, thoại `micaFound`, rồi `micaIdentify` (dòng Houston chỉ chạy nếu `sampleAt(earth).el > 0`, nếu không thì Pip nói Trái Đất đã lặn). Mica đặt ở rìa hố, nửa trong bóng.
- [ ] **Step 6:** Chơi thử cả hai đường: (a) đủ điều kiện → thấy vệt → lần theo → Mica; (b) đi thẳng tới Mica sớm → cảnh vẫn chạy. **Commit** `feat: tracks discovery and finding Mica`.

### Task 13: Mắt nhiệt

**Files:** Create `src/ui/thermalView.ts`, `tests/thermal.test.ts`

**Interfaces:**
- Consumes: `surfaceTempC` (Task 2), hướng Mặt Trời (Task 7).
- Produces:
```ts
tempToColor(tempC: number): { r: number; g: number; b: number }  // -250 → xanh đậm (0,0,0.4); -150 → xanh (0,0.3,1); 0 → tím nhạt; 60 → cam (1,0.5,0); ≥120 → vàng trắng (1,1,0.8); nội suy tuyến tính giữa các mốc
createThermalView(scene, sky): { toggle(): void; get on(): boolean }  // phím T; vật liệu thay thế theo pháp tuyến·hướng Mặt Trời + có trong bóng hay không
```
- [ ] **Step 1: Viết test**: các mốc trả đúng màu; −200 nằm giữa hai mốc đầu (b ≈ 0.7); > 120 kẹp về mốc cuối.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt `tempToColor` → **Step 4:** PASS.
- [ ] **Step 5:** `createThermalView`: khi bật, mọi mesh dùng một `ShaderMaterial` tô màu theo `surfaceTempC(dot(normal, sunDir), inShadow)` (inShadow lấy từ shadow map), kèm vignette xanh và chữ "PIP THERMAL FEED" (đây là camera của Pip, spec §5.5). Mica phải thấy rõ một bên cam/vàng, một bên xanh.
- [ ] **Step 6:** Chơi thử: T bật/tắt mượt, Mica hai màu. **Commit** `feat: Pip thermal view`.

### Task 14: Sửa Mica & Mica tỉnh dậy

**Files:** Create `src/mica/repair.ts`, `tests/micaRepair.test.ts`; Modify `src/scenes/surfaceScene.ts`

**Interfaces:**
- Consumes: `Mica` (Task 12), `Pip.command` (Task 9), `DialogueRunner` (Task 4).
- Produces:
```ts
type RepairStage = 'towing' | 'cleaning' | 'openPanel' | 'swapBoard' | 'warming' | 'awake';
class MicaRepair {
  stage: RepairStage; dust: number /* 1 */; energyUsed: number; batteryC: number /* -40 */; warning: 'tooFast' | null;
  arriveAtBase(): void;               // towing → cleaning
  eds(): void;                        // dust -= 0.25 (không dưới 0), energyUsed += 5; dust <= 0.1 → openPanel
  pipOpen(pipDistM: number): boolean; // ≤ 3 m → swapBoard
  playerSwap(): void;                 // swapBoard → warming
  warm(rateCPerS: number, dtS: number): void; // rate > 2 → warning 'tooFast', không tăng nhiệt; ngược lại batteryC += rate*dt; batteryC >= 0 → awake
}
```
- [ ] **Step 1: Viết test**: 4 lần `eds()` → dust 0, `energyUsed === 20`, stage 'openPanel' (stage chuyển ngay ở lần đạt ≤ 0.1); `eds()` khi ở stage khác 'cleaning' không làm gì; `pipOpen(5)` → false; `warm(3, 10)` → warning 'tooFast', batteryC vẫn −40; `warm(2, 20)` → batteryC 0, stage 'awake', warning null.
- [ ] **Step 2:** FAIL → **Step 3:** cài đặt → **Step 4:** PASS.
- [ ] **Step 5:** Nối scene (bản rút gọn của spec Hồi 4): tại Mica, lệnh Pip `pull` → Pip kéo Mica bằng dây (khớp nối Havok) về Trại Shackleton (`towing`); tại trại: E dùng EDS (hạt bụi bắn khỏi tấm pin, `mica.dust` giảm dần), Pip mở nắp, E thay bo mạch, giữ E để sưởi với thanh tốc độ (giữ lâu = nhanh; vượt 2 °C/s → Pip cảnh báo, thử lại). `awake` → `mica.setAwake(true)`, mắt sáng, chạy thoại `micaWake`, set flag `act4:micaAwake`.
- [ ] **Step 6:** Chơi thử trọn lát cắt: bước ra → Pip → búa & lông chim → 2 module → 3 mẫu → vệt bánh xe → Mica → kéo về → sửa → Mica tỉnh. Ghi thời gian chơi (mục tiêu 10–15 phút). `npm test` toàn bộ PASS, `npm run build` thành công. **Commit** `feat: Mica repair and wake sequence`.

---

## Self-review (đã chạy)
- **Phủ spec:** Hồi 1 (Task 8–11), lắp module phối hợp (Task 10), vệt bánh xe/Mica (Task 12), sửa/tỉnh (Task 14), mắt nhiệt (Task 13), Horizons (Task 5/7), LOLA (Task 6), thẻ Real/Fiction (Task 11). Phần chưa có thuộc Plan 2–4: hạ cánh, demo mode, DONKI, Bóng Dài, Kết, âm thanh, mô hình thật, tiếng Việt, module `habitat`/`antenna` đầy đủ, bí ẩn miệng hố.
- **Kiểu nhất quán:** `ModuleId`, `SampleId`, `PipFace`, `GameState`, `Heightmap`, `Ephemeris` được định nghĩa một lần và tái dùng đúng tên.
