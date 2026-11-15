# Plan 3: Hành trình khám phá cùng Pip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến bản đồ thành hành trình 8 điểm dừng, ánh sáng hoàn toàn từ dữ liệu thật (tháng tốt nhất của 2028). Mỗi điểm có một thử thách thật cần phối hợp với Pip, Pip được nâng cấp theo module, người chơi quản lý pin, oxy và nhiệt mà không bao giờ "thua". Kèm theo: cắm cờ Artemis IV, bản đồ phím M, và chế độ `?demo=1` 3 phút cho giám khảo.

**Architecture:**
- Luật chơi mới là hàm thuần có test Vitest (Plan 1/2 đều làm vậy):
  - chọn cửa sổ sứ mệnh từ lịch thiên văn;
  - tính đường chân trời và ánh nắng trên heightmap;
  - phát hiện điểm dừng;
  - tài nguyên;
  - nâng cấp;
  - trượt dốc và tời kéo;
  - máy trạng thái demo.
- Lớp Babylon chỉ gọi các hàm này.
- Vị trí điểm dừng được **chọn bằng script dò tìm trên dữ liệu thật** rồi ghi cứng vào `src/world/zones.ts`. Một test đọc dữ liệu thật để chứng minh từng vị trí thỏa ràng buộc ánh sáng.

**Tech Stack:** như Plan 2 (Vite 8, TypeScript ~5.9, Babylon.js 9.34, Havok 1.3, Vitest 5, Node 24). Script TypeScript chạy bằng `npx vite-node`.

**Spec:** `docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md` (v3: §7 hành trình, §7.1–7.4, §6 cờ, §10 quyết định sau rà soát). Đây là delta trên `docs/2026-11-06-pip-mica-thiet-ke-game.md` (v2.0: §5.3–5.8, §6 Hồi 2–4). Executor đọc cả hai và đọc ledger Plan 2 `docs/superpowers/plans/2026-11-06-plan-2-ledger.md`.

## Global Constraints

- **Ánh sáng 100% dữ liệu thật** (spec §10.1):
  - Năm 2028, đổi tháng sang cửa sổ Mặt Trời cao nhất.
  - Không nâng Mặt Trời giả.
  - Vị trí điểm dừng phải khớp với ánh sáng thật: Đồi Nắng có nắng, Hố tối thì tối, Mica nửa sáng nửa tối.
- **Đồng hồ** (spec §10.2):
  - Lịch thật, đồng hồ chạy liên tục `timeScale = 60`.
  - Trong Hồi 1–4, Trái Đất **luôn** ở trên chân trời nên điểm 6 làm được theo thứ tự nào cũng được.
  - Các mốc Trái Đất lặn, Mặt Trời lặn, bình minh được tính sẵn cho Plan 4.
- **Không có màn thua** (v2 §5.8, spec §7.3):
  - Tài nguyên cạn: màn hình mờ đi, Pip kéo người chơi về căn cứ, giải thích chuyện gì đã xảy ra.
  - Không mất tiến độ (cờ, mẫu, module, thẻ giữ nguyên).
- **Mọi thử thách cần phối hợp với Pip** (spec §2 thất bại #3): không thử thách nào giải được một mình.
- **Vật lý** (spec §10.3): Havok cho người chơi và vật rơi; Pip và Mica đi theo động học có quy luật (trượt theo dốc, dây tời có chiều dài).
- **Chữ hiển thị mới** nằm trong `src/content/lines.en.ts` và `src/content/cards.en.json` (tiếng Anh).
- **Thẻ kiến thức mới:**
  - Có `tag` thuộc `real | fiction | debated` và `source.url` là trang NASA (hoặc trang khoa học chính thống).
  - **Đã kiểm chứng bằng WebSearch/WebFetch** khi viết; ghi URL đã mở vào ledger.
- Dùng lại model Plan 2: `relay.glb`, `flag.glb`. Không dựng model mới trong plan này. Đá lăn và băng là khối thủ tục.
- **Ngân sách:** ≥ 30 FPS (đo như Task 10 của Plan 2). Kiểm tra ánh nắng mỗi khung phải dùng cache, không ray-march mỗi khung.
- **Không thêm dependency runtime.**

## Review Focus

1. **Vào Hố tối khi chưa có bộ sưởi hoặc chưa cứu Mica.** Nhiệt bộ đồ cạn sẽ kích hoạt cứu hộ: về căn cứ, đầy tài nguyên, giữ nguyên mọi tiến độ, Pip giải thích. Test: `rescue keeps progress and refills` (Task 5).
2. **Đi các điểm dừng sai thứ tự** (Đỉnh Trái Đất trước, Hố tối trước, Mica trước module): mỗi điểm được phát hiện độc lập, không khóa tiến trình. Test: `stops are discovered in any order` (Task 4).
3. **Trái Đất dưới chân trời ở Đỉnh Trái Đất.** `planMission` bảo đảm Trái Đất ở trên chân trời suốt 72 giờ sim đầu. Nếu vẫn không thấy (đồng hồ chạy quá), lời nhắc phải giải thích, không được bấm vô ích. Test: `planMission keeps Earth up for the whole window` (Task 1), `relay refuses with a reason when Earth is hidden` (Task 10).
4. **Pip mắc kẹt ở dốc rồi người chơi bỏ đi.** Pip không được tự dịch chuyển lên đỉnh dốc bỏ qua thử thách. Trạng thái kẹt chỉ được giải bằng cắm neo hoặc thả thùng. Test: `stuck winch does not resolve by distance` (Task 7).
5. **Bấm phím lung tung hoặc thiếu file GLB trong `?demo=1`:** máy trạng thái demo bỏ qua phím không liên quan, phím N luôn nhảy bước, và demo chạy được cả với thân placeholder. Test: `demo ignores unrelated input and N skips` (Task 13).

---

## File Structure

```
scripts/fetch-horizons.mjs          — sửa: cả năm 2028, bước 1 h
scripts/scout-layout.ts             — mới: dò vị trí thỏa ràng buộc ánh sáng (chạy bằng vite-node), in ra đề xuất
src/data/mission.ts                 — planMission(): cửa sổ sứ mệnh + các mốc thật
src/world/lighting.ts               — horizonElevationDeg, isSunlit, earthVisible, sunlitFraction, SunlightCache
src/world/zones.ts                  — sửa: 8 điểm dừng mới, thùng, mẫu, vệt, Mica, các spot Hồi 1 tương đối theo bãi đáp
src/journey/stops.ts                — định nghĩa 8 điểm dừng (id, tên, thẻ, thoại)
src/journey/journeySystem.ts        — phát hiện điểm dừng, thoại Pip, Pip lo khi đi xa
src/survival/resources.ts           — tài nguyên thuần: oxy, nhiệt bộ đồ, pin Pip, cứu hộ
src/survival/survivalSystem.ts      — nối tài nguyên với thế giới (nắng, Hố tối, căn cứ, Pip)
src/ui/resourceHud.ts               — thanh oxy, nhiệt, pin Pip
src/pip/upgrades.ts                 — nâng cấp theo module
src/challenges/winch.ts             — trượt dốc + máy trạng thái tời (thuần)
src/challenges/winchSystem.ts       — Đồi Nắng: Pip kẹt, neo, dây, kéo lên
src/challenges/boulderTrail.ts      — Bãi đá lăn: tảng đá + vệt lăn, manh mối giả
src/challenges/freshCrater.ts       — Hố mới: mẫu hạt thủy tinh chỉ thấy bằng mắt nhiệt
src/challenges/earthRelay.ts        — Đỉnh Trái Đất: trạm chuyển tiếp, căn ăng-ten
src/challenges/darkCrater.ts        — Hố tối: lạnh, đèn Pip, mẫu băng, Mica chỉ đường
src/challenges/flagPlant.ts         — cắm cờ Artemis IV ở bãi đáp
src/ui/mapView.ts                   — bản đồ phím M (mở sau trạm chuyển tiếp)
src/demo/demoDirector.ts            — máy trạng thái demo (thuần) + bộ điều khiển dịch chuyển
tests/mission.test.ts, lighting.test.ts, layout.test.ts, journey.test.ts, resources.test.ts,
      upgrades.test.ts, winch.test.ts, relay.test.ts, demo.test.ts
```

---

### Task 1: Lịch thiên văn cả năm 2028 và cửa sổ sứ mệnh

**Files:**
- Modify: `scripts/fetch-horizons.mjs` (`START = '2028-01-01'`, `STOP = '2029-01-01'`; SOURCES ghi lại khoảng mới), `public/data/ephemeris/{sun,earth}.json`, `SOURCES.md`
- Create: `src/data/mission.ts`, `tests/mission.test.ts`
- Modify: `src/scenes/surfaceScene.ts` (dùng `planMission(eph).start` thay `findMissionStart`); `src/data/ephemeris.ts` (giữ `findMissionStart` cho tương thích, đánh dấu `@deprecated`)

**Interfaces:**
- Produces:
  - `interface MissionPlan { start: number; earthUpUntil: number; earthSet: number; sunSet: number; dawn: number; minSunElDeg: number }` (epoch ms UTC).
  - `planMission(e: Ephemeris, windowHours = 72): MissionPlan`
    - Duyệt từng mẫu theo giờ, chọn `start` sao cho trong `[start, start + windowHours]` Trái Đất luôn cao > 1° và Mặt Trời luôn > 0°. Trong các ứng viên, **cực đại hóa độ cao Mặt Trời nhỏ nhất** của cửa sổ (trùng nhau thì chọn sớm hơn).
    - `earthUpUntil`: lúc đầu tiên sau `start` mà Trái Đất ≤ 0°.
    - `earthSet = earthUpUntil`.
    - `sunSet`: lúc Mặt Trời ≤ 0° đầu tiên sau `start + windowHours`.
    - `dawn`: lúc Mặt Trời > 0° đầu tiên sau `sunSet`.
    - Mốc nào không có trong dữ liệu thì bằng mẫu cuối.
    - Dữ liệu fallback (1 mẫu) trả `start = 0` và các mốc bằng 0.

- [ ] **Step 1: Viết test hỏng** (`tests/mission.test.ts`). Dữ liệu tổng hợp theo giờ: Mặt Trời `el = 1 + 0.5·sin(2π t/(30 ngày))`, Trái Đất lên/xuống mỗi 14 ngày.
  - `planMission keeps Earth up for the whole window`: với mọi giờ trong `[start, start + 72 h]`, Trái Đất > 1° và Mặt Trời > 0°.
  - `planMission prefers the highest Sun`: `minSunElDeg` ≥ độ cao Mặt Trời nhỏ nhất của mọi cửa sổ hợp lệ khác (vét cạn trên dữ liệu tổng hợp).
  - `milestones are ordered`: `start < earthSet` và `start < sunSet < dawn`.
  - `fallback ephemeris gives zeros`: với `{sun:[{t:0,az:0,el:1.5}], earth:[{t:0,az:0,el:3}]}` thì `start === 0`.
- [ ] **Step 2:** `npx vitest run tests/mission.test.ts`. Kỳ vọng: FAIL (không có module).
- [ ] **Step 3:** Cài đặt `mission.ts`. Sửa `fetch-horizons.mjs` rồi chạy `node scripts/fetch-horizons.mjs`. Kỳ vọng in ra khoảng 8.785 mẫu mỗi vật thể; ghi khoảng độ cao Mặt Trời cả năm vào ledger.
- [ ] **Step 4:** Nối vào `surfaceScene.ts`: `const mission = planMission(eph); new GameClock(mission.start)`. Thêm `mission` vào `SurfaceWorld`. Thanh trạng thái hiển thị ngày giờ UTC của đồng hồ.
- [ ] **Step 5:** `npx vitest run` toàn bộ PASS. Chạy `npm run dev` rồi ghi vào ledger: ngày bắt đầu, `minSunElDeg`, và Mặt Trời trên HUD có cao hơn 0,63° không.
- [ ] **Step 6: Commit** `feat: full-year 2028 ephemeris and best-Sun mission window`

---

### Task 2: Đường chân trời, ánh nắng và tầm nhìn Trái Đất trên heightmap

**Files:**
- Create: `src/world/lighting.ts`, `tests/lighting.test.ts`

**Interfaces:**
- Produces:
  - `horizonElevationDeg(hm: Heightmap, x: number, z: number, azDeg: number, eyeM = 1.0, maxDistM = 1400, stepM = 5): number`: góc nâng lớn nhất từ mắt `(x, h+eye, z)` tới địa hình dọc phương vị (0 = bắc/+z, 90 = đông/+x), dừng ở mép bản đồ.
  - `isSunlit(hm, x, z, sun: {az: number; el: number}, eyeM = 0.5): boolean = sun.el > horizonElevationDeg(...)`
  - `earthVisible(hm, x, z, earth: {az; el}): boolean` (mắt 2 m: ăng-ten).
  - `sunlitFraction(hm, x, z, sun: EphemSample[], fromMs, toMs, stepH = 3): number` ∈ [0, 1]
  - `class SunlightCache { constructor(hm: Heightmap, cellM = 8, azBucketDeg = 2); isSunlit(x: number, z: number, sun: {az; el}): boolean }`: cache theo ô lưới × xô phương vị, trả kết quả cũ khi sun.el đổi < 0,05°.

- [ ] **Step 1: Viết test hỏng.** Heightmap tổng hợp: phẳng y = 0, có một "tường" cao 50 m ở x ∈ [100, 110].
  - `flat ground sees the Sun at any positive elevation`
  - `a wall to the east blocks a low eastern Sun`: điểm (0,0), Mặt Trời az 90°, el 2°: không có nắng (tường 50 m cách 100 m che khoảng 26,6°).
  - `the same wall does not block a western Sun`
  - `horizon elevation matches atan(height/distance)`: tại (0,0), az 90 cho ≈ atan(49.5/100) độ (sai số 1°).
  - `earth visible when Earth is above the local horizon`
  - `cache returns the same answer as the direct test and reuses cells`: 1.000 truy vấn trong cùng một ô chỉ gọi ray-march 1 lần (đếm qua tham số debug hoặc `cache.misses`).
- [ ] **Step 2:** `npx vitest run tests/lighting.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `feat: terrain horizon, sunlight and Earth visibility with cache`

---

### Task 3: Dò tìm và đặt lại 8 điểm dừng theo ánh sáng thật

**Files:**
- Create: `scripts/scout-layout.ts`, `tests/layout.test.ts`
- Modify: `src/world/zones.ts`, `tests/zones.test.ts`, `src/science/scienceSystem.ts` (các spot Hồi 1 thành offset từ `zone('landing')`), `src/mica/repairSystem.ts` (`REPAIR_SPOT` = `zone('base')` + offset)

**Interfaces:**
- Consumes: `planMission` (T1), `horizonElevationDeg`/`isSunlit`/`earthVisible`/`sunlitFraction` (T2).
- Produces (`zones.ts`):
  - `type ZoneId = 'landing' | 'base' | 'solarHill' | 'boulderField' | 'freshCrater' | 'earthPeak' | 'tracks' | 'darkCrater'`
  - `ZONES: Zone[]` gồm đúng 8 phần tử, đúng thứ tự trên. Mỗi phần tử có `name` tiếng Anh: Landing Zone, Shackleton Camp, Sunny Hill, Rolling Boulder Field, Fresh Crater, Earth View Peak, Strange Tracks, Dark Crater.
  - Giữ nguyên tên các export cũ: `PLAYER_SPAWN`, `PIP_SPAWN`, `HLS_POS`, `CRATES`, `MICA_POS`, `TRACKS_PATH`, `SAMPLE_SPOTS`, `zone()`.
  - Thêm: `FLAG_SPOT`, `RELAY_SPOT`, `ICE_SPOT`, `BOULDER = { top: P2; bottom: P2 }`, `WINCH_ANCHOR` (đỉnh dốc).
  - `CRATES.solarTower.site` nằm trên Đồi Nắng, còn thùng nằm dưới chân dốc của đồi.
  - `MICA_POS` ở mép `darkCrater`. Vệt bánh `TRACKS_PATH` đi từ `zone('tracks')` tới `MICA_POS`.

**Ràng buộc** (được `layout.test.ts` kiểm trên dữ liệu thật: đọc `public/data/terrain/heightmap.f32` + `.json` và `public/data/ephemeris/*.json` qua `node:fs`, `W = [mission.start, mission.start + 72 h]`):

| Điểm | Ràng buộc |
|---|---|
| mọi điểm | trong `clampToWorld` (|x|, |z| ≤ 740) và cách `zone('base')` ≤ 650 m |
| landing | dốc < 5° trong bán kính 15 m; `sunlitFraction` trên W ≥ 0,8 |
| base | dốc < 6° trong 20 m; `sunlitFraction` W ≥ 0,7; cách landing 120–350 m |
| solarHill | `sunlitFraction` W ≥ 0,9 tại site tháp pin; đoạn từ thùng tới site có dốc lớn nhất ∈ [18°, 30°] |
| boulderField | trong 30 m có dốc ≥ 15° (đặt `BOULDER.top`/`bottom` trên dốc đó) |
| freshCrater | `sunlitFraction` W ≥ 0,5 (có đá nóng) |
| earthPeak | `earthVisible` tại `RELAY_SPOT` suốt W (bước 3 h) |
| MICA_POS | `sunlitFraction` W ∈ [0,15; 0,65] (nửa sáng nửa tối) |
| darkCrater / ICE_SPOT | không có nắng ở bất kỳ mẫu nào trong cả năm (bước 6 h): vùng tối vĩnh cửu |

- [ ] **Step 1: Viết test hỏng** `tests/layout.test.ts`: mỗi hàng của bảng là một `it(...)`. Cập nhật `tests/zones.test.ts` thành 8 zones.
- [ ] **Step 2:** `npx vitest run tests/layout.test.ts`. Kỳ vọng: FAIL (zone ids mới chưa có).
- [ ] **Step 3: Viết và chạy `scripts/scout-layout.ts`** (`npx vite-node scripts/scout-layout.ts`).
  - Quét lưới 10 m, chấm điểm ứng viên cho từng ràng buộc.
  - Ưu tiên cụm gọn (tổng đường đi landing → base → các điểm nhỏ nhất).
  - In ra toạ độ đề xuất.
  - Nếu một ràng buộc không thể thỏa trên dữ liệu thật: nới đúng ràng buộc đó ít nhất có thể, ghi **Ruling** với số liệu, sửa ngưỡng trong test tương ứng kèm comment dẫn Ruling.
- [ ] **Step 4:** Ghi toạ độ vào `zones.ts`, đặt lại thùng, mẫu (mỗi mẫu trong zone hợp lý: anorthosite ở landing, breccia ở boulderField, glassBeads ở freshCrater, regolith ở base, freshCrater ở freshCrater, iceRegolith ở `ICE_SPOT`), vệt bánh ≥ 12 điểm có một vòng xoay tại chỗ.
- [ ] **Step 5:** `npx vitest run` PASS. Kiểm tra bằng mắt: Đồi Nắng có nắng, căn cứ có nắng, Mica nửa sáng, Hố tối đen. Chụp `docs/screens/plan3-layout-*.png`.
- [ ] **Step 6: Commit** `feat: relocate the eight journey stops to real-light positions`

---

### Task 4: Hệ thống điểm dừng và Pip đồng hành

**Files:**
- Create: `src/journey/stops.ts`, `src/journey/journeySystem.ts`, `tests/journey.test.ts`
- Modify: `src/content/lines.en.ts`, `src/scenes/surfaceScene.ts`

**Interfaces:**
- Consumes: `ZONES`, `zone()` (T3).
- Produces:
  - `interface Stop { id: ZoneId; radiusM: number; lineId: string; cardId?: string }`
  - `STOPS: Stop[]`: 8 phần tử, `lineId = 'stop_' + id` (vd. `stop_solarHill`).
  - `discoverStops(state: GameState, p: {x; z}, stops: Stop[]): Stop[]`: trả các điểm vừa vào bán kính lần đầu và đặt cờ `stop:<id>`.
  - `class PipFarWatcher { constructor(farM = 40, cooldownS = 60); update(dt: number, distM: number): boolean }`: trả true khi nên phát `pipFar`.
  - `JourneySystem.update(dt, player)`:
    - Gọi `discoverStops`, với mỗi điểm mới: toast `Discovered: <name>`, phát thoại `stop_<id>`, mở thẻ nếu có.
    - Phát `pipFar` khi `PipFarWatcher` trả true, đặt mặt Pip `worried`.
  - `lines.en.ts` thêm 8 `stop_*` (mỗi cái 2–3 câu Pip, đúng tính cách v2 §3.2: hài hước, hay đặt tên đồ vật; riêng `stop_darkCrater` nghiêm túc) và `pipFar` (2 câu).

- [ ] **Step 1: Viết test hỏng:**
  - `stops are discovered in any order`: đi earthPeak → darkCrater → landing, mỗi lần trả đúng 1 điểm.
  - `a stop is discovered only once`
  - `far watcher fires after leaving 40 m and respects the 60 s cooldown`
  - `every stop has a dialogue line`: mọi `STOPS[i].lineId` có trong `LINES`.
- [ ] **Step 2:** `npx vitest run tests/journey.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối vào scene.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `feat: journey stops with Pip companion lines`

---

### Task 5: Tài nguyên và cứu hộ (không có màn thua)

**Files:**
- Create: `src/survival/resources.ts`, `src/survival/survivalSystem.ts`, `src/ui/resourceHud.ts`, `tests/resources.test.ts`
- Modify: `src/content/lines.en.ts` (`rescue_o2`, `rescue_heat`, `rescue_pip`), `src/scenes/surfaceScene.ts`

**Interfaces:**
- Consumes: `SunlightCache` (T2), `zone('base')` (T3).
- Produces:
  - `interface Resources { o2: number; heat: number; pip: number }`: mỗi giá trị 0..100.
  - `interface Env { playerInSun: boolean; inDarkCrater: boolean; nearPip: boolean; atCamp: boolean; pipInSun: boolean; pipMoving: boolean; pipLamp: boolean; pipPanelFactor: number /*0..1*/; pipDust: number /*0..1*/ }`
  - `interface Upg { heater: boolean; fastCharge: boolean; batteryX: number }` (khớp T6).
  - `RATES` (mỗi giây thực):

| Tài nguyên | Thay đổi |
|---|---|
| O2 | −0,08 (cạn sau khoảng 20 phút); `atCamp` +5 |
| Heat | Hố tối: −1,6, hoặc −0,35 nếu có heater. Ngoài Hố tối: hồi +0,8 về 100 |
| Pip | −0,15 khi chạy, −0,1 khi đèn bật, −0,2 khi sưởi (ở Hố tối và có heater) |
| Pip sạc | `+1,2 · pipPanelFactor · (1 − pipDust)` khi `pipInSun`; ×2 nếu `fastCharge` và `atCamp`; trần `100 · batteryX` quy về % |

  - `stepResources(r: Resources, env: Env, upg: Upg, dt: number): Resources` (thuần, kẹp 0..100).
  - `needsRescue(r): 'o2' | 'heat' | 'pip' | null`: o2 ≤ 0 ưu tiên trước, rồi heat, rồi pip (pip = 0 khi không có nắng).
  - `rescue(r): Resources` trả đầy 100.
  - `SurvivalSystem.update(dt, player)`:
    - Tính `Env` (dùng `SunlightCache` với Mặt Trời hiện tại).
    - Mặt trước của tấm pin dựng đứng quay về Mặt Trời: `pipPanelFactor = max(cos(Δaz) cho 3 tấm L/R/B, 0)`.
    - Khi cần cứu hộ: mờ đen 1,5 s, dịch chuyển người chơi và Pip về `zone('base')`, `rescue`, phát thoại `rescue_*`.
    - **Không** xóa cờ, mẫu, module, thẻ.
  - `resourceHud`: 3 thanh nhỏ góc dưới trái (O2 xanh, Suit heat cam, Pip battery vàng). Nhấp nháy khi < 20%.

- [ ] **Step 1: Viết test hỏng:**
  - `o2 drains about 0.08 per second and refills at camp`
  - `dark crater drains heat fast without the heater and slower with it`: sau 30 s không heater < 55, có heater > 85.
  - `pip charges in sun facing the panels and not in shadow`
  - `dust halves charging at 0.5 coat`
  - `rescue keeps progress and refills`: mô phỏng `GameState` có 2 module, 3 mẫu, cờ `stop:solarHill`; gọi luồng cứu hộ thuần `applyRescue(state, r)` → r đầy, `state` không đổi.
  - `needsRescue priority is o2, then heat, then pip`
- [ ] **Step 2:** `npx vitest run tests/resources.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt, HUD và nối vào scene.
- [ ] **Step 4:** `npx vitest run` PASS. Kiểm tra bằng mắt: ba thanh hiển thị; vào bóng thì pin Pip không sạc.
- [ ] **Step 5: Commit** `feat: suit oxygen, suit heat and Pip battery with gentle rescue`

---

### Task 6: Pip nâng cấp theo module

**Files:**
- Create: `src/pip/upgrades.ts`, `tests/upgrades.test.ts`
- Modify: `src/science/scienceSystem.ts` (tầm quét LIDAR theo nâng cấp), `src/survival/survivalSystem.ts`, `src/interact/moduleSystem.ts` (toast nâng cấp khi lắp module), `src/content/lines.en.ts` (`upgrade_<moduleId>`)

**Interfaces:**
- Produces:
  - `interface Upgrades { batteryX: number; fastCharge: boolean; heater: boolean; eds: boolean; lidarRangeM: number; map: boolean }`
  - `upgradesFor(modules: Set<ModuleId>, flags: Set<string>): Upgrades`:

| Điều kiện | Hiệu ứng |
|---|---|
| solarTower | batteryX 1,5; fastCharge |
| radiator | heater |
| habitat | eds |
| cờ `relay:aligned` | lidarRangeM 150 (mặc định 60); map |

  - Đặc biệt: `antenna` (module ăng-ten ở căn cứ) **không** mở map; map chỉ mở bằng trạm chuyển tiếp ở Đỉnh Trái Đất (spec §7.1).
  - `eds` dùng ở căn cứ: khi có `habitat`, đứng cạnh Pip trong `zone('base')` sẽ có lời nhắc `E — EDS-clean Pip's panels`. Bấm thì `pipCoat.clean(1)` và phát hạt EDS (tái dùng hiệu ứng `edsBurst` của `repairSystem`). Pip sạc lại nhanh như mới (thể hiện bài học bụi phủ pin của Mica).

- [ ] **Step 1: Viết test hỏng:**
  - `no modules gives the base Pip`
  - `habitat enables EDS cleaning of Pip`
  - `each module adds exactly its upgrade`
  - `map and long LIDAR come only from the aligned relay`
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt và nối (Pip nói `upgrade_<id>` sau khi module lắp xong).
- [ ] **Step 4:** PASS. **Step 5: Commit** `feat: Pip upgrades unlocked by base modules`

---

### Task 7: Đồi Nắng: dốc trượt, neo và tời kéo

**Files:**
- Create: `src/challenges/winch.ts`, `src/challenges/winchSystem.ts`, `tests/winch.test.ts`
- Modify: `src/pip/pip.ts` (hệ số tốc độ khi trượt, bánh vẫn quay khi kẹt), `src/interact/moduleSystem.ts` (thùng tháp pin cần tời), `src/content/lines.en.ts` (`winch_stuck`, `winch_anchor`, `winch_done`), `src/content/cards.en.json` (`spiritStuck`)

**Interfaces:**
- Consumes: `CRATES`, `WINCH_ANCHOR` (T3).
- Produces:
  - `slopeDeg(hm, x, z, dirYawRad, sampleM = 2): number`: dốc dọc hướng đi.
  - `wheelSlip(slopeDeg: number): number`: 0 khi < 12°, 1 khi ≥ 20°, tuyến tính ở giữa (bụi mềm, spec §7 điểm 3).
  - `type WinchState = 'idle' | 'stuck' | 'anchored' | 'reeling' | 'done'`
  - `class Winch { state: WinchState; ropeLeftM: number; constructor(ropeM = 40); onPipSlip(slip: number): void; plantAnchor(distFromAnchorM: number): boolean; startReel(): void; reel(dt: number, speedMs = 0.4): void; dropLoad(): void }`
    - `onPipSlip(≥1)` đưa `idle` → `stuck`.
    - `plantAnchor` chỉ thành công khi `stuck` và người chơi cách `WINCH_ANCHOR` ≤ 2,5 m.
    - `startReel` (lệnh Q của Pip) đưa `anchored` → `reeling`.
    - `reel` giảm `ropeLeftM`, về 0 thì `done`.
    - `dropLoad` đưa `stuck` → `idle`.
  - `WinchSystem.update(dt, player, keyboard): string | null`:
    - Pip chở thùng `solarTower` lên dốc có `wheelSlip = 1`: Pip đứng yên, bánh quay tại chỗ, phun bụi, mặt `worried`, thoại `winch_stuck`.
    - Khi đang `stuck`/`reeling`, `WinchSystem` đặt `pip.mode = 'task'` (PipBrain không di chuyển, không teleport đuổi theo) và tự đặt vị trí Pip. Xong (`done`) hoặc thả thùng (`dropLoad`) thì trả `pip.mode = 'follow'`.
    - Lời nhắc ở đỉnh dốc: `E — plant the winch anchor`. Sau đó lệnh ngữ cảnh của Pip là `pull`.
    - Khi `reeling`: Pip và thùng trượt dọc dây về phía neo với 0,4 m/s; vẽ dây bằng `CreateLines`; xong thì thoại `winch_done`, mở thẻ `spiritStuck`.
  - Thẻ `spiritStuck` (`real`): rover Spirit kẹt trong đất mềm năm 2009 và mất liên lạc năm 2010; VIPER được thiết kế để "đi bằng bánh" thoát kẹt. Nguồn: trang NASA về Spirit (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng:**
  - `no slip below 12 degrees, full slip from 20`
  - `slope of a 1-in-2 ramp is about 26.6 degrees` (heightmap tổng hợp)
  - `winch goes stuck → anchored → reeling → done`
  - `anchor only plants within 2.5 m of the anchor point while stuck`
  - `stuck winch does not resolve by distance`: gọi `update` mô phỏng người chơi cách 100 m trong 60 s, trạng thái vẫn `stuck`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt và nối.
- [ ] **Step 4:** PASS. Kiểm tra bằng mắt: Pip kẹt quay bánh, cắm neo, dây vàng cam, kéo lên, lắp tháp pin. Chụp `docs/screens/plan3-winch-*.png`.
- [ ] **Step 5: Commit** `feat: Sunny Hill slope, wheel slip and winch co-op challenge`

---

### Task 8: Bãi đá lăn: manh mối giả, và Hố mới: mẫu chỉ thấy bằng mắt nhiệt

**Files:**
- Create: `src/challenges/boulderTrail.ts`, `src/challenges/freshCrater.ts`
- Modify: `src/science/scienceSystem.ts` (mẫu `glassBeads` ẩn tới khi mắt nhiệt bật trong 25 m), `src/scenes/surfaceScene.ts`, `src/content/lines.en.ts` (`boulder_seen`, `boulder_scan`, `crater_thermal`), `src/content/cards.en.json` (`boulderTracks`), `tests/journey.test.ts` (thêm test)

**Interfaces:**
- Consumes: `BOULDER`, `zone('freshCrater')` (T3); `TrailRenderer` (Plan 2); thermal view `.on` (Plan 1).
- Produces:
  - `createBoulderTrail(scene, hm, sky): { update(player, keyboard, pip): void }`
    - Một tảng đá thủ tục (polyhedron biến dạng, ~2 m) ở `BOULDER.bottom`.
    - Chuỗi vết lõm kéo dài từ `top` tới `bottom` (dùng `TrailRenderer` kiểu `'boulder'`, rộng 1,6 m, bước 1,2 m, hình vết nảy lặp lại).
    - Người chơi cách vệt < 12 m: phát `boulder_seen` (Pip tưởng là vết bánh).
    - Nhấn R gần đó: phát `boulder_scan`, mở `boulderTracks`, đặt cờ `boulder:solved`.
  - `glassBeadsVisible(thermalOn: boolean, distM: number): boolean = thermalOn && distM <= 25` (thuần, export từ `freshCrater.ts`).
  - Thẻ `boulderTracks` (`real`): ảnh LRO cho thấy rất nhiều vệt đá lăn trên Mặt Trăng. Nguồn LROC/NASA (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng** (thêm vào `tests/journey.test.ts`): `glass beads show only through the thermal view within 25 m`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt; `TrailRenderer` nhận kiểu `'boulder'` (SIZE `{w: 1.6, l: 1.0}`, texture vết lõm tròn).
- [ ] **Step 4:** PASS. Kiểm tra bằng mắt và chụp `docs/screens/plan3-boulder.png`, `plan3-crater-thermal.png`.
- [ ] **Step 5: Commit** `feat: boulder-track red herring and thermal-only glass beads`

---

### Task 9: Cắm cờ Artemis IV ở bãi đáp

**Files:**
- Create: `src/challenges/flagPlant.ts`
- Modify: `src/scenes/surfaceScene.ts`, `src/content/lines.en.ts` (`flag_plant`), `src/content/cards.en.json` (`apolloFlags`), `tests/journey.test.ts`

**Interfaces:**
- Consumes: `FLAG_SPOT` (T3), `loadModel(scene,'flag')` (Plan 2).
- Produces:
  - `createFlagPlant(scene, hm, sky, state, dialogue, hud): { update(player, keyboard): string | null }`
    - Lời nhắc `E — plant the Artemis IV flag` trong 2,5 m quanh `FLAG_SPOT`.
    - Khi bấm: cờ mọc từ đất trong 1,5 s (cột nhô lên), đặt cờ `flag:planted`, phát `flag_plant`, mở `apolloFlags`.
    - Chỉ một lần. Thân placeholder (cột + khối đỏ) nếu GLB lỗi.
  - Thẻ `apolloFlags` (`real`): cờ Apollo 11 bị luồng khí động cơ thổi đổ khi cất cánh (Buzz Aldrin kể lại); ảnh LRO cho thấy các cờ Apollo 12, 16, 17 vẫn đứng, nhiều khả năng đã bạc màu do tia cực tím. Nguồn NASA/LROC (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng:** `flag can be planted only once` (hàm thuần `tryPlant(state)` trả true lần đầu, false lần sau).
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS, chụp `docs/screens/plan3-flag.png`.
- [ ] **Step 5: Commit** `feat: plant the Artemis IV flag at the landing zone`

---

### Task 10: Đỉnh Trái Đất: trạm chuyển tiếp và bản đồ

**Files:**
- Create: `src/challenges/earthRelay.ts`, `src/ui/mapView.ts`, `tests/relay.test.ts`
- Modify: `src/scenes/surfaceScene.ts` (phím M), `src/content/lines.en.ts` (`relay_deploy`, `relay_align`, `relay_noEarth`), `src/content/cards.en.json` (`earthVisibility`)

**Interfaces:**
- Consumes: `RELAY_SPOT` (T3), `earthVisible` (T2), `upgradesFor` (T6), `loadModel(scene,'relay')`.
- Produces:
  - `relayStep(state: 'packed' | 'deployed' | 'aligned', action: 'deploy' | 'align', earthUp: boolean, pipNear: boolean): { next: 'packed' | 'deployed' | 'aligned'; reason: 'ok' | 'noEarth' | 'needPip' | 'nothing' }` (thuần):
    - `deploy` chỉ từ `packed` khi `earthUp`.
    - `align` chỉ từ `deployed` khi `pipNear` (≤ 4 m).
    - Khi `aligned`: đặt cờ `relay:aligned`, thoại `relay_align`, mở thẻ `earthVisibility`, toast `Map unlocked (M)`.
  - `createMapView(ui, hm): { toggle(): void; update(player, pip, state): void; readonly open: boolean }`:
    - Bảng 360×360 px: ảnh bóng địa hình vẽ một lần từ heightmap (hillshade xám).
    - Chấm người chơi (trắng), Pip (cyan), điểm đã phát hiện (cam + tên), điểm chưa phát hiện thì ẩn.
    - Chỉ mở khi `upgradesFor(...).map`.
  - Thẻ `earthVisibility` (`real`): ở cực nam, Trái Đất nằm sát chân trời và có lúc lặn, nên liên lạc trực tiếp bị gián đoạn; Artemis cần vệ tinh chuyển tiếp hoặc trạm trên đỉnh cao. Nguồn NASA (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng:**
  - `relay deploys only with Earth up and aligns only with Pip near`
  - `relay refuses with a reason when Earth is hidden`: `relayStep('packed','deploy',false,true)` → `{next:'packed', reason:'noEarth'}`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS, chụp `docs/screens/plan3-relay.png`, `plan3-map.png`.
- [ ] **Step 5: Commit** `feat: Earth View Peak relay and the M map`

---

### Task 11: Hố tối: lạnh, đèn của Pip, Mica chỉ đường và mẫu băng

**Files:**
- Create: `src/challenges/darkCrater.ts`
- Modify: `src/survival/survivalSystem.ts` (`inDarkCrater` theo bán kính `zone('darkCrater')`), `src/science/scienceSystem.ts` (mẫu `iceRegolith` tại `ICE_SPOT`, chỉ nhặt được khi đèn Pip bật trong 8 m), `src/mica/repairSystem.ts` (sau khi Mica tỉnh: phát `mica_ice`, bật marker Hố tối), `src/content/lines.en.ts` (`dark_enter`, `dark_noHeater`, `mica_ice`, `ice_found`), `src/content/cards.en.json` (`lcrossIce`), `tests/journey.test.ts`

**Interfaces:**
- Consumes: `zone('darkCrater')`, `ICE_SPOT` (T3); `upgradesFor` (T6); `Resources` (T5).
- Produces:
  - `iceCollectable(pipLampOn: boolean, pipDistM: number, playerDistM: number): boolean = pipLampOn && pipDistM <= 8 && playerDistM <= 2.5` (thuần).
  - `darkCrater` system:
    - Vào vùng: thoại `dark_enter`, tự bật đèn Pip, mặt `worried`.
    - Nếu chưa có `heater`: thoại `dark_noHeater` ("Too cold for my joints without a heater").
    - Mica tỉnh → `mica_ice` (giọng Mica: tọa độ, "hydrogen signal: high") và một cột sáng cam mảnh đánh dấu `ICE_SPOT` khi nhìn từ xa (ẩn khi đã nhặt).
  - Nhặt băng: `addSample('iceRegolith')`, đặt cờ `act4:ice`, thoại `ice_found`, mở thẻ `lcrossIce` (`real`): LCROSS 2009 đo khoảng 5,6% nước trong đất hố Cabeus; nguồn NASA (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng:** `ice is collectable only with Pip's lamp on and both close`.
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt. **Step 4:** PASS. Kiểm tra bằng mắt: Hố tối đen, chỉ đèn Pip và đèn mũ chiếu; thanh nhiệt tụt; nhặt băng. Chụp `docs/screens/plan3-dark-crater.png`.
- [ ] **Step 5: Commit** `feat: Dark Crater cold, Pip's light, Mica's directions and the ice sample`

---

### Task 12: Thẻ VIPER và rà soát nội dung

**Files:**
- Modify: `src/content/cards.en.json` (`viperPanels`), `src/content/lines.en.ts`, `tests/cards.test.ts` (đếm thẻ mới, mọi `source.url` là https)
- Modify: `src/journey/stops.ts` (`solarHill.cardId = 'viperPanels'`)

**Interfaces:**
- Thẻ `viperPanels` (`real`): ở cực nam, Mặt Trời chỉ cao khoảng 1–1,5°, nên tấm pin nằm ngang chỉ nhận khoảng sin(1,5°) ≈ 2,6% (ở độ cao 0,6° là khoảng 1%), còn tấm pin dựng đứng nhận gần 100%. VIPER mang ba tấm pin dựng đứng; tháp VSAT của NASA dùng cùng ý tưởng. Mica (giả tưởng) là bài học ngược lại. Nguồn NASA VIPER (kiểm chứng URL).

- [ ] **Step 1: Viết test hỏng:** `cards include the Plan 3 set`: có `spiritStuck`, `boulderTracks`, `apolloFlags`, `earthVisibility`, `lcrossIce`, `viperPanels`; mọi thẻ có `source.url` bắt đầu bằng `https://`.
- [ ] **Step 2:** FAIL (thiếu `viperPanels` nếu chưa thêm). **Step 3:** Thêm thẻ; đọc lại mọi thoại mới cho đúng giọng Pip/Mica (v2 §3.2, §3.3). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: VIPER vertical-panel card and Plan 3 content pass`

---

### Task 13: Chế độ demo 3 phút `?demo=1`

**Files:**
- Create: `src/demo/demoDirector.ts`, `tests/demo.test.ts`
- Modify: `src/main.ts` (đọc `?demo=1`), `src/scenes/surfaceScene.ts`, `src/ui/hud.ts` (dòng chú thích demo trên cùng)

**Interfaces:**
- Produces:
  - `type DemoStep = 'meetPip' | 'jump' | 'winch' | 'tracks' | 'micaFound' | 'micaWake' | 'end'`
  - `class DemoDirector { step: DemoStep; constructor(); input(ev: 'jumped' | 'winchDone' | 'tracksSeen' | 'micaFound' | 'micaAwake' | 'skip' | string): DemoStep }`: chuyển đúng một bước theo sự kiện khớp với bước hiện tại hoặc `'skip'` (phím N); sự kiện khác bị bỏ qua. `end` là trạng thái cuối.
  - `DEMO_HINTS: Record<DemoStep, string>`: một dòng tiếng Anh cho mỗi bước (vd. `jump`: "Press Space: watch the dust fly in a perfect arc").
  - Bộ điều khiển trong scene, mỗi lần vào bước mới:
    - `meetPip`: người chơi ở bãi đáp, Pip lại gần.
    - `jump`: chờ 1 lần nhảy.
    - `winch`: dịch chuyển người chơi và Pip có thùng tháp pin tới chân dốc Đồi Nắng.
    - `tracks`: dịch chuyển tới đầu vệt, đặt điều kiện mở vệt (2 module, 3 mẫu) bằng cách gán state.
    - `micaFound`: người chơi tự đi theo vệt (vệt ngắn ở demo: dịch chuyển tới 30 m trước Mica).
    - `micaWake`: tua nhanh sửa chữa (dịch chuyển Mica về căn cứ, `dust = 0`, chạy các bước `MicaRepair` trực tiếp) rồi phát `micaWake`.
    - `end`: hiện bảng "Thanks! Full game: 8 stops…".
  - Thời lượng mục tiêu ≤ 3:30 nếu người chơi không bấm N.

- [ ] **Step 1: Viết test hỏng:**
  - `demo walks the beats in order`
  - `demo ignores unrelated input and N skips`: `input('micaFound')` khi đang ở `jump` không đổi bước; `input('skip')` đổi bước.
  - `end is terminal`
- [ ] **Step 2:** FAIL. **Step 3:** Cài đặt; demo không phụ thuộc GLB (chạy được với placeholder).
- [ ] **Step 4:** PASS. Chạy `http://localhost:5173/?demo=1` từ đầu đến cuối, bấm giờ, ghi vào ledger. Chụp `docs/screens/plan3-demo-*.png`.
- [ ] **Step 5: Commit** `feat: three-minute ?demo=1 path for judges`

---

### Task 14: Hiệu năng và chơi trọn hành trình

**Files:** chỉ sửa khi đo thấy vượt ngân sách. Create: `docs/screens/plan3-overview.png`.

- [ ] **Step 1:** `npx vitest run` và `npm run build`. Kỳ vọng: toàn bộ PASS, build OK.
- [ ] **Step 2: Đo FPS** như Plan 2 Task 10 ở 3 nơi: căn cứ đủ 4 module, Đồi Nắng khi đang kéo tời, Hố tối. Kỳ vọng: ≥ 30. Ghi vào ledger.
- [ ] **Step 3: Chơi trọn từ đầu không dùng demo** (dùng dịch chuyển debug khi cần):
  - cắm cờ;
  - Hồi 1;
  - đủ 8 điểm dừng;
  - 4 module (có tời);
  - vệt đá lăn;
  - mẫu thủy tinh;
  - trạm chuyển tiếp và bản đồ;
  - vệt bánh, Mica, sửa, tỉnh;
  - Hố tối và băng;
  - một lần cứu hộ cố ý.

  Ghi mọi lỗi; lỗi chặn tiến trình phải sửa trong task này (TDD).
- [ ] **Step 4: Commit** `chore: plan 3 performance pass and full journey playthrough`
