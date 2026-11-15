# Plan 5: Hoàn thiện gameplay 100% — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lấp nốt mọi phần *gameplay* còn thiếu so với spec v3 §5, §6, §8:
- Cảnh hạ cánh 3D có 2 tương tác: bay qua Biển Tĩnh Lặng, tách tàu, hãm tốc, còi kiểu "1202", đáp xuống giữa bụi phụt, có thể bỏ qua.
- Sự kiện tàu hàng hạ cánh (Hồi 2E).
- Lớp bụi lơ lửng phát sáng sát chân trời (2G, thẻ CÒN TRANH LUẬN).
- Sửa các lỗi nhỏ còn để lại từ Plan 2–4.

Sau plan này, demo 3 phút (người dùng muốn làm sau) chỉ còn là việc chọn cảnh.

**Architecture:**
- Như Plan 3–4: luật chơi là hàm thuần có test; Babylon chỉ gọi.
- Cảnh quỹ đạo là một `Scene` Babylon riêng (`landingScene.ts`), chạy trước bề mặt rồi được dispose.
- Pha đáp cuối (tương tác 2) diễn ra **ngay trên bề mặt thật** ở bãi đáp. Tàu HLS hạ từ 300 m xuống, bụi dùng `DustSystem.plume` sẵn có.
- Vật lý hạ cánh theo phương trình tên lửa: khối lượng giảm theo nhiên liệu, g = 1,62.

**Tech Stack:** như Plan 4. Ảnh Mặt Trăng: NASA SVS CGI Moon Kit `lroc_color_2k.jpg`.

**Spec:**
- `docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md` (v3), các mục §5 (bảng bụi: luồng phụt, bụi lơ lửng), §6.1 (cutscene chỉ chỗ Apollo 11), §8 (hàng Cutscene và Hồi 2).
- v2.0 `docs/2026-11-06-pip-mica-thiet-ke-game.md`, các mục MỞ ĐẦU M1–M6, 2E, 2G, §7 (phương trình tên lửa, vận tốc quỹ đạo).
- Ledger Plan 4: `docs/superpowers/plans/2026-11-07-plan-4-ledger.md` (danh sách "minor (deferred)").

**Quyết định của người dùng (07/11/2026):** hoàn thiện gameplay 100% trước, rồi mới làm demo 3 phút cho giám khảo.

**Phạm vi:** Tiếng Việt, hiệu ứng âm thanh trong mũ, chứng chỉ và video thuộc Plan 6. Đó là phần trình bày, không phải gameplay. Ghi ở đây để không bị coi là thiếu.

**Bổ sung của người dùng (07/11/2026, đã duyệt):** nhạc nền thích ứng "hay và ấn tượng như Interstellar": lúc gay cấn nhịp dồn dập nhanh, lúc bình thường thư thả. Thêm thành Task 8. Thiết kế đã duyệt trong hội thoại:
- 4 mức: thư thả ~60 BPM, kỳ vĩ ~72, căng thẳng ~90, dồn dập 120–140.
- 3 khoảnh khắc chính: chạm đất (cắt nhạc → một hợp âm), bình minh qua khe núi (organ dâng), cất cánh (chủ đề chính lần cuối).
- Lúc tìm thấy Mica thì im lặng hẳn.
- Motif riêng cho Pip (vui, 4 nốt) và Mica (chuông máy thưa).
- Phím bật/tắt.

## Global Constraints

- **Vật lý đúng:**
  - g = 1,62 m/s², không lực cản không khí.
  - Phương trình tên lửa: `dm/dt = −F/vₑ`, `a = F/m − g`.
  - Bụi phụt bay parabol, tỏa ngang sát đất, không thành mây (spec v3 §5).
- **Không có màn thua** (v2 §5.8). Đáp hỏng: dừng, kể chuyện Odysseus 2024, cho thử lại. Có **chế độ lái tự động** cho trẻ nhỏ. Mọi cảnh đều **bỏ qua được** (Esc).
- **Ánh sáng thật:** pha đáp cuối dùng đồng hồ và Mặt Trời thật của `mission.start`. Cảnh quỹ đạo chiếu sáng theo hướng Mặt Trời thật lúc đó, nếu làm được với dữ liệu sẵn có. Nếu không, ghi `Ruling`.
- **Thẻ kiến thức mới:** `tag`, `source.url` https **đã mở bằng WebFetch/WebSearch khi viết**, số liệu khớp nguồn. Ghi URL vào ledger.
- **Model:** Orion và HLS trên quỹ đạo dựng thủ tục bằng Babylon, low-poly đúng tỉ lệ. Không dùng Blender trong plan này. Trên bề mặt dùng lại `hls.glb`.
- **Ảnh NASA:** `public/textures/moon/lroc_color_2k.jpg`, ghi công "NASA's Scientific Visualization Studio" trong `public/textures/moon/SOURCES.md` và trong màn bỏ qua cảnh.
- **Hiệu năng ≥ 30 FPS.** Cảnh quỹ đạo dispose hết trước khi vào bề mặt.
- **Nhạc gốc:** sáng tác mới, tạo bằng Web Audio API. Chỉ lấy *không khí* organ tối giản của Interstellar. Không chép giai điệu, chuỗi hợp âm hay tiếng tích tắc 1,25 s đặc trưng của phim; tiếng đếm của game bám theo giây đếm ngược thật của game. Không dùng file nhạc ngoài.
- **Không thêm dependency runtime.** Chữ mới nằm trong `lines.en.ts` và `cards.en.json`. Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không merge hay push.

## Review Focus

1. **Bỏ qua cảnh hạ cánh ở bất kỳ lúc nào** (Esc khi đang hãm tốc, khi đang đáp, hoặc ngay khung đầu) → vào Hồi 1 sạch sẽ:
   - không còn cảnh hoặc camera cũ;
   - HLS đứng đúng chỗ;
   - không tốn nhiên liệu giả;
   - `?demo=1` và `?jump=` luôn bỏ qua.

   Test: `skipping at any phase lands the same final state` (Task 1), `intro is skipped for demo and jump` (Task 3).
2. **Đáp hỏng nhiều lần:** lật (nghiêng quá), quá nhanh, hết nhiên liệu. Mỗi lần có lời giải thích và thử lại với nhiên liệu đầy. Sau 2 lần hỏng thì gợi ý bật lái tự động. Test: `failed touchdown explains and resets fuel` (Task 1).
3. **Tàu hàng hạ cánh khi người chơi đang dở việc khác:** đang kéo tời, đang bê thùng, đang ở Hố tối, hoặc đã sang Hồi 4–5. Sự kiện chỉ nổ trong Hồi 2, chỉ một lần, và không làm hỏng trạng thái tời hay thùng. Test: `cargo landing fires once, only in act 2, never mid-winch` (Task 4).
4. **Bụi lơ lửng xuất hiện lúc không hợp lý:** giữa trưa có nắng, trong mắt nhiệt, hay bị lặp mỗi khung. Chỉ hiện khi người chơi đứng trong bóng, Mặt Trời gần chân trời và vùng gần đó có nắng (ranh giới sáng–tối). Thoại chỉ một lần. Test: `horizon glow only at the light–dark boundary` (Task 5).
5. **Các bản sửa lỗi nhỏ không phá luồng cũ:** hai lượt chơi A/B của Plan 4 vẫn tới được Hồ sơ nhiệm vụ. Test: chơi lại ở Task 8.

---

## File Structure

```
scripts/fetch-moon-texture.mjs     — mới: tải lroc_color_2k.jpg (NASA SVS 4720) → public/textures/moon/
src/landing/descent.ts             — vật lý hạ cánh (thuần): hãm tốc quỹ đạo, pha đáp cuối, lái tự động, chấm điểm
src/scenes/landingScene.ts         — cảnh quỹ đạo: Mặt Trăng, Orion + HLS, bay qua Apollo 11, tách tàu, hãm tốc, còi 1202
src/landing/finalDescent.ts        — pha đáp cuối trên bề mặt: HLS hạ 300 m → 0, bụi phụt, CONTACT, thử lại
src/ui/descentHud.ts               — đồng hồ độ cao, vận tốc, nhiên liệu, độ nghiêng, vùng xanh
src/challenges/cargoLanding.ts     — sự kiện 2E (thuần + Babylon)
src/fx/horizonGlow.ts              — 2G: lớp sáng mờ sát chân trời ở ranh giới sáng–tối
src/main.ts, src/scenes/surfaceScene.ts — nối cảnh mở đầu và pha đáp
src/content/lines.en.ts, src/content/cards.en.json
src/audio/musicScore.ts           — nốt, hợp âm, motif Pip/Mica, bảng BPM (thuần)
src/audio/musicMood.ts            — chọn mức nhạc từ trạng thái game, nhịp mượt, lịch phách (thuần)
src/audio/musicEngine.ts          — Web Audio: organ, chuỗi nốt lặp, nhịp tim, tiếng đếm, vang
src/audio/musicSystem.ts          — nối trạng thái game → engine, phím B, mở khoá âm thanh lần bấm đầu
tests/descent.test.ts, tests/cargo.test.ts, tests/glow.test.ts, tests/finalReviewFixes5.test.ts, tests/music.test.ts
```

---

### Task 1: Vật lý hạ cánh (thuần)

**Files:** Create `src/landing/descent.ts`, `tests/descent.test.ts`

**Interfaces:**
- Produces:
  - `HLS = { dryKg: 120_000, fuelKg: 30_000, ve: 3_700, maxThrustN: 2_000_000 }`: con số gọn cho trò chơi, có ghi chú là xấp xỉ, không phải thông số SpaceX. Thẻ kiến thức nói đúng điều này.
  - **Pha hãm tốc (tương tác 1):**
    - `interface BrakeState { v: number; h: number; fuelKg: number; t: number }`
    - Bắt đầu với `v = 1_680` m/s (vận tốc quỹ đạo thấp, khoảng 6 000 km/h như v2 M4) và `h = 15_000` m.
  - `brakeStep(s: BrakeState, throttle: 0..1, dt): BrakeState`
    - Vận tốc ngang giảm theo `a = throttle·maxThrust/m`.
    - `h` giảm theo một đường cong mục tiêu gọn.
    - Nhiên liệu giảm theo `throttle·maxThrust/ve·dt`.
  - `brakeBand(h: number): { lo: number; hi: number }`: vùng xanh của vận tốc theo độ cao. Mục tiêu: `v ≈ 1680·(h/15000)^0.8` ±12 %.
  - `brakeDone(s): boolean`: đúng khi `h ≤ 300`.
  - **Pha đáp cuối (tương tác 2):**
    - `interface LandState { h: number; vy: number; vx: number; tiltDeg: number; fuelKg: number; massKg: number }`
    - Bắt đầu: `h = 300`, `vy = −12`, `vx = 4`, `tilt = 0`.
  - `landStep(s, input: { throttle: 0..1; tiltInput: −1..1 }, dt): LandState`
    - `a_y = T·cos(tilt)/m − 1,62`.
    - `a_x = T·sin(tilt)/m`.
    - Nghiêng thay đổi 8°/s theo `tiltInput`, kẹp ±15°.
    - Khối lượng giảm theo phương trình tên lửa.
  - `touchdown(s): 'ok' | 'tipped' | 'tooFast' | null`
    - Khi `h ≤ 0`: `|vy| ≤ 1` và `|vx| ≤ 1` và `|tilt| ≤ 6°` thì `'ok'`.
    - Nếu nghiêng quá thì `'tipped'`; ngược lại `'tooFast'`.
  - `autopilot(s): { throttle; tiltInput }`: bộ điều khiển PD hạ đều về `vy = −0,8` m/s và triệt tiêu `vx`.
  - `skipToEnd(): { landed: true }`: trạng thái cuối khi bỏ qua.

- [ ] **Step 1: Viết test hỏng** `tests/descent.test.ts`:
  - `free fall from 1.5 m takes about 1.36 s` (kiểm `landStep` không ga, không nghiêng, `h = 1,5`, `vy = 0`).
  - `burning fuel lightens the ship so the same throttle accelerates more` (phương trình tên lửa).
  - `autopilot always lands ok from the standard start` (mô phỏng 120 s, `dt = 1/60`).
  - `tilt over 6° at touchdown tips the ship (Odysseus)`
  - `brake band follows the target curve and full throttle can stay in it from the start`
  - `failed touchdown explains and resets fuel`: hàm `retryLand(prev)` trả trạng thái xuất phát với nhiên liệu đầy và tăng `attempts`. Từ `attempts ≥ 2` thì `suggestAutopilot` đúng.
  - `skipping at any phase lands the same final state`
- [ ] **Step 2:** `npx vitest run tests/descent.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `feat: lunar descent physics (rocket equation, braking band, touchdown, autopilot)`

---

### Task 2: Cảnh quỹ đạo — Biển Tĩnh Lặng, tách tàu, hãm tốc, còi 1202

**Files:**
- Create: `scripts/fetch-moon-texture.mjs`, `public/textures/moon/lroc_color_2k.jpg`, `public/textures/moon/SOURCES.md`, `src/scenes/landingScene.ts`, `src/ui/descentHud.ts`
- Modify: `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `brakeStep`, `brakeBand`, `brakeDone`, `autopilot` (T1); `createStoryPanel`/`InputLock` (Plan 4); `houstonDelayMs` (trễ radio).
- Produces:
  - `runLandingIntro(engine: Engine, opts: { assist: boolean }): Promise<'done' | 'skipped'>`. Tự tạo `Scene`, tự dispose khi xong.
  - **Mặt Trăng:**
    - Cầu bán kính 1 737,4 đơn vị (1 đơn vị = 1 km), texture `lroc_color_2k.jpg`.
    - Một `DirectionalLight` từ hướng Mặt Trời. Trời đen, có sao (sao thấy được vì camera ở trong bóng Orion: ghi chú).
  - **Orion + HLS:** khối thủ tục.
    - Orion: nón 5 m đặt trên ống phục vụ 4 m, có 4 cánh pin chữ X.
    - HLS: trụ 9 × 50 m màu thép.
    - Tỉ lệ thật so với nhau, phóng to ×1 000 so với Mặt Trăng chỉ để nhìn thấy (ghi chú trong code).
  - **Kịch bản cảnh** (≈ 60–90 s, mỗi đoạn Enter để tua thoại):

    | Đoạn | Nội dung |
    |---|---|
    | M1 | Chỉ huy: *"Artemis IV, prepare to transfer to the lander."* |
    | M1b | Camera lia qua **Biển Tĩnh Lặng**. Vòng sáng đánh dấu bãi Apollo 11 (0,674° B; 23,473° Đ). Houston/Pip: *"Down there is Tranquility Base. Apollo 11 landed there on 20 July 1969."* Thẻ `apollo11Site` (real, nguồn NASA, kiểm chứng) |
    | M2 | HLS tách khỏi Orion, hai tàu bay song song. Phi hành gia Orion: *"I see you, everything looks good. Good luck."* (gợi nhớ Michael Collins) |
    | M3 | Pip qua bộ đàm lần đầu: *"Hello, lander! I'm Pip. I cleaned your landing pad. Mostly. Mostly clean."* |
    | M4 — tương tác 1 | `descentHud` hiện vận tốc, độ cao, nhiên liệu, và vạch vận tốc so với vùng xanh `brakeBand`. **Giữ Space** để đốt (ga 0..1 tăng giảm mượt). Lái tự động (`opts.assist`) tự giữ trong vùng. Ra khỏi vùng quá 3 s thì Houston nhắc, không thua |
    | M5 | Ở `h ≈ 2 000` m: còi `PROGRAM ALARM — COMPUTER OVERLOAD`, Houston (trễ radio thật): *"...We're GO on that alarm!"* Thẻ `alarm1202` (real: Apollo 11 lỗi 1202/1201, nguồn NASA, kiểm chứng) |
    | Kết | `brakeDone` thì màn mờ và trả `'done'` |

  - **Esc** bất kỳ lúc nào trả `'skipped'` (dispose sạch).
  - Góc màn hình ghi công: `Moon imagery: NASA's Scientific Visualization Studio (CGI Moon Kit)`.

- [ ] **Step 1:** `node scripts/fetch-moon-texture.mjs`. Script tải `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg`, kiểm kích thước 2048×1024 qua header JPEG, rồi ghi `SOURCES.md` (URL, ngày, ghi công). Kỳ vọng: file khoảng 447 KB.
- [ ] **Step 2: Viết test hỏng** (thêm vào `tests/descent.test.ts`):
  - `Apollo 11 site maps to the right point on the textured sphere`: hàm thuần `latLonToSphere(lat, lon, r)` (để trong `descent.ts` hoặc `src/landing/moonMath.ts`). (0, 0) → +x... theo quy ước UV của Babylon `CreateSphere`. Test kiểm hai điểm: (0°, 0°) và (0,674°, 23,473°) với toạ độ kỳ vọng tính tay.
  - `the alarm happens once per intro`
- [ ] **Step 3:** `npx vitest run tests/descent.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 4:** Cài đặt cảnh và HUD.
- [ ] **Step 5:** `npx vitest run` PASS.
- [ ] **Step 6: Kiểm tra trong trình duyệt**, dùng trang tạm `?intro=only`, chỉ khi DEV:
  - Thấy Biển Tĩnh Lặng và vòng đánh dấu.
  - Giữ Space thì vạch đi vào vùng xanh.
  - Còi báo xuất hiện một lần.
  - Esc thì thoát sạch.
  - Đo FPS.
  - Chụp `docs/screens/plan5-orbit.png`.
- [ ] **Step 7: Commit** `feat: orbital intro over Tranquility Base, undocking, braking burn and 1202-style alarm`

---

### Task 3: Pha đáp cuối trên bề mặt thật (tương tác 2) và nối vào Hồi 1

**Files:**
- Create: `src/landing/finalDescent.ts`
- Modify: `src/ui/descentHud.ts`, `src/main.ts`, `src/scenes/surfaceScene.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`, `tests/descent.test.ts`

**Interfaces:**
- Consumes: `landStep`, `touchdown`, `autopilot`, `retryLand` (T1); `DustSystem.plume` (Plan 4); `InputLock`; `hlsRoot` (đã re-parent thân tàu ở Plan 4).
- Produces:
  - `createFinalDescent(world, hlsRoot, opts: { assist: boolean }): { readonly active: boolean; update(dt, keyboard): void; skip(): void }`
    - Bắt đầu: HLS ở `HLS_POS`, cao 300 m. Camera bám sau tàu. Người chơi và Pip ẩn hoặc chờ: người chơi ở trong tàu, Pip đứng ở `PIP_SPAWN` nhìn lên.
    - Phím: Space là ga; A/D nghiêng theo trục hướng ra xa bãi đáp; H bật/tắt lái tự động.
    - Dưới 30 m: `dust.plume` tỏa ngang. Lượng hạt tỉ lệ ga, giảm theo độ cao. Có một lớp "tấm bụi" mờ sát đất che tầm nhìn (spec v3 §5: tấm bụi tỏa ngang sát mặt đất, bay rất xa).
    - Kết quả `touchdown`:
      - `'ok'`: đèn `CONTACT`, *"Engine stop"*, hiện nhiên liệu còn lại theo giây. Màn chữ *"Sea of Tranquility, 1969… South Pole, 2028."* Rồi bắt đầu Hồi 1: người chơi ra khỏi thang máy ở `PLAYER_SPAWN`.
      - `'tipped'`: dừng, thoại và thẻ `odysseusTip` (đã có thẻ `story_odysseus`; dùng lại, không thêm thẻ trùng), thử lại.
      - `'tooFast'`: Pip *"Too hard! Let's try that again, gently this time."*, thử lại.
    - Từ lần thử thứ 2 trở đi, gợi ý H (lái tự động).
    - Trong lúc đáp: `InputLock` được giữ, tài nguyên không trừ.
  - `main.ts`:
    - Nếu không có `?demo=1` hay `?jump=` → chạy `runLandingIntro`, rồi tạo bề mặt và bắt đầu `finalDescent`.
    - Nếu intro trả `'skipped'` → bề mặt tạo xong là bắt đầu Hồi 1 ngay (`skip()`), không có pha đáp.
    - Màn khởi đầu (chữ + phím) hỏi: `1 — Fly the landing yourself`, `2 — Autopilot (younger pilots)`, `Esc — skip the landing`.
  - Thẻ `rocketEquation` (real: phương trình Tsiolkovsky; nguồn NASA Glenn "Ideal Rocket Equation", kiểm chứng).

- [ ] **Step 1: Viết test hỏng** (thêm vào `tests/descent.test.ts`):
  - `intro is skipped for demo and jump`: hàm thuần `introMode(search: string, dev: boolean): 'intro' | 'skip'`. `?demo=1` → skip; `?jump=act5` khi dev → skip; trống → intro.
  - `plume dust scales with throttle and fades with height`: hàm thuần `plumeRate(h, throttle)`: 0 khi `h > 30`, tăng khi `h` giảm, bằng 0 khi `throttle = 0`.
- [ ] **Step 2:** chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối vào `main.ts` / `surfaceScene.ts`.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt:**
  - Đáp tay thành công.
  - Cố ý nghiêng để lật → thẻ Odysseus → thử lại.
  - Lái tự động.
  - Esc ở pha quỹ đạo → vào Hồi 1 ngay.
  - Chụp `plan5-touchdown.png`.
  - Đo FPS lúc bụi nhiều nhất.
- [ ] **Step 6: Commit** `feat: fly the final descent onto the real landing site, plume dust sheet, CONTACT and retry`

---

### Task 4: Tàu hàng hạ cánh (Hồi 2E)

**Files:** Create `src/challenges/cargoLanding.ts`, `tests/cargo.test.ts`. Modify `src/scenes/surfaceScene.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `horizonElevationDeg` (`lighting.ts`), `DustCoat` của Pip (scene), `ModuleSystem` (tháp pin), `WinchSystem.winch.state`, `DustSystem.plume`, `createSolarStorm`-style HUD countdown.
- Produces:
  - `CARGO_SITE = { x: 560, z: -620 }`: mép bản đồ, cách căn cứ khoảng 700 m, nhìn thấy từ trại. Chọn bằng `scripts/scout-cargo.ts`: điểm phẳng (độ dốc < 5°) cách căn cứ ≥ 600 m. Ghi `Ruling` nếu toạ độ đổi.
  - `cargoShouldStart(s: { modules: number; act3Started: boolean; winchBusy: boolean; carrying: boolean; done: boolean }): boolean`
    - `modules ≥ 2` và chưa sang Hồi 3 (`!state.flags.has('act3:micaFound')`).
    - Không đang kéo tời hay bê thùng.
    - Chưa xảy ra.
  - `ejectaShielded(hm, target: {x; z}, site: {x; z}): boolean`: đúng khi địa hình giữa hai điểm che đường nhìn thẳng ở góc thấp. Mảnh vụn của luồng phụt bay gần như ngang, 1–3°, không có không khí cản. Tính bằng `horizonElevationDeg(target, az→site)` so với góc tới điểm phụt (cao 2 m), cộng biên 1°.
  - `createCargoLanding(...)`: `{ update(dt, player): string | null }`
    - Houston báo *"cargo lander coming down about 700 metres away, 90 seconds"*.
    - Hai việc (lời nhắc, đếm ngược):
      1. `E — stow the solar tower panels` tại tháp pin (nếu đã lắp).
      2. `Q — "Pip, hide behind that ridge!"`: có ít nhất một chỗ đứng được che (`ejectaShielded`) trong 60 m quanh Pip. Lời nhắc chỉ hướng; Pip đi tới chỗ gần nhất.
    - Hết giờ: tàu hàng đáp, dùng `dust.plume` ở `CARGO_SITE` cùng một "tia" hạt bay ngang tới trại.
    - Pip không được che: `pipCoat` tăng tới 0,8, Pip đi chậm, mặt `dizzy`, thoại cần EDS. EDS có sẵn khi đã có module ở; nếu chưa có, thoại hướng tới việc lắp module ở.
    - Tháp chưa gập: hệ số sạc nhanh tắt cho tới khi `E — brush the solar tower` (một lần).
    - Một lần duy nhất. Cờ `cargo:landed`, `cargo:pipShielded`, `cargo:towerStowed`.
  - Thẻ `apollo12Surveyor` (real: Apollo 12 đáp cách Surveyor 3 khoảng 160 m, luồng phụt phun cát lên tàu; nguồn NASA, kiểm chứng con số).

- [ ] **Step 1: Viết test hỏng** `tests/cargo.test.ts`:
  - `cargo landing fires once, only in act 2, never mid-winch`
  - `a ridge between Pip and the cargo site shields it; open ground does not` (dữ liệu thật: ít nhất một điểm trong 60 m quanh `zone('base')` được che, và chính tâm căn cứ thì không. Nếu tâm căn cứ được che thì đổi `CARGO_SITE` qua script scout và ghi `Ruling`).
  - `cargo site is flat and at least 600 m from camp`
- [ ] **Step 2:** chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt (kèm `scripts/scout-cargo.ts` nếu cần dò điểm).
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt:**
  - Lắp 2 module → cảnh báo → gập tháp và giấu Pip → tàu hàng đáp, Pip sạch.
  - Lượt hai không giấu → Pip phủ bụi → EDS làm sạch.
  - Chụp `plan5-cargo.png`.
- [ ] **Step 6: Commit** `feat: cargo lander event (act 2E): stow panels, hide Pip from low-angle ejecta`

---

### Task 5: Bụi lơ lửng phát sáng ở ranh giới sáng–tối (2G)

**Files:** Create `src/fx/horizonGlow.ts`, `tests/glow.test.ts`. Modify `src/scenes/surfaceScene.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `SunlightCache`, `sky.sunDir`, `sky.sunElevDeg`, `thermal.on`.
- Produces:
  - `glowVisible(s: { playerInSun: boolean; sunElDeg: number; litNearby: boolean; thermal: boolean }): boolean`
    - Đúng khi `!playerInSun` và `−1 ≤ sunElDeg ≤ 2` và `litNearby` và `!thermal`.
    - `litNearby`: có ít nhất một điểm sáng trong 8 điểm cách người chơi 150 m, kiểm qua `SunlightCache` mỗi 2 s, không mỗi khung.
  - `createHorizonGlow(scene, sky, sunCache)`: `{ update(dt, player, thermalOn): void }`
    - Một dải mỏng additive, mờ, nằm ngang sát chân trời ở phương vị Mặt Trời. Rộng khoảng 25°, cao khoảng 0,6°, `alpha ≤ 0,25`, hiện và tắt dần trong 2 s.
    - Lần đầu thấy: thoại `glow_seen` (v2 2G: *"Could be charged dust floating... scientists still argue about it. I'm on the side of... let me watch a bit longer."*) và thẻ `horizonGlow`.
  - Thẻ `horizonGlow` (`tag: 'debated'`): Surveyor chụp được "ánh sáng chân trời"; phi hành gia Apollo 17 Gene Cernan phác hoạ tia sáng trước bình minh; LADEE 2013–2014 không thấy bụi đủ dày ở độ cao; vẫn còn tranh luận. Nguồn NASA (kiểm chứng).

- [ ] **Step 1: Viết test hỏng** `tests/glow.test.ts`:
  - `horizon glow only at the light–dark boundary`: liệt kê từng điều kiện sai thì trả `false`.
  - `glow line plays once`: bộ đếm thuần `firstTime(set, key)`.
- [ ] **Step 2:** chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt:** đứng trong bóng ở Hồi 5 lúc gần hoàng hôn → thấy dải sáng. Chụp `plan5-glow.png`.
- [ ] **Step 6: Commit** `feat: horizon glow at the light–dark boundary (2G, still debated)`

---

### Task 6: Sửa lỗi nhỏ Plan 4

**Files:** `src/challenges/solarStorm.ts`, `src/content/lines.en.ts`, `src/story/act5System.ts`, `src/story/endingSystem.ts`, `src/ui/nightPlanner.ts`, `src/data/donki.ts`, `src/content/cards.en.json`, `src/scenes/surfaceScene.ts`, `tests/finalReviewFixes5.test.ts`

Mỗi mục dưới đây có test thuần nếu kiểm được bằng hàm; còn lại kiểm bằng mắt trong Task 8. Lấy nguyên văn từ ledger Plan 4:

1. **Rời nhà trú giữa bão.** `stormStep` kiểm lộ diện **cả trong pha `storm`**: ra ngoài quá 5 s liên tục thì `exposed`, chỉ một lần. Test: `leaving the shelter during the storm counts as exposure once`.
2. **Bán kính tàu đáp.** Đổi 30 m quanh tàu thành 6 m quanh chân thang máy (`HLS_POS`). Test cập nhật.
3. **`storm_clear`.** Hai biến thể: Mica đã về trại, hoặc còn ở ngoài.
4. **`act5_news`.** "the hill north of your camp" đổi thành hướng tính từ `night.sunsetAzDeg` (hàm `compass(az)` → `'south-east'`...). Test: `compass(147) === 'south-east'`.
5. **Ngày giờ ghi cứng.** Thẻ tiêu đề, toast bình minh và thoại Houston định dạng từ `night` (`formatDay(ms)`, `hoursUntil`). Test: `formatDay(Date.parse('2028-11-29T19:20Z')) === '29 November 2028'`.
6. **Hết giờ Trái Đất lặn.** Nếu `now ≥ earthSetMs` ở pha `sendData` thì dừng đồng hồ ở `earthSetMs − 1 h` (truyện ưu tiên). Ghi `Ruling`. Thoại vẫn đúng. Test thuần `sendClock(now, earthSet)`.
7. **Thứ tự thoại.** Thoại cột sáng chỉ băng của Mica phát sau `mica_mission`, không chen giữa.
8. **Thẻ Artemis.** Thêm câu: game đặt sứ mệnh vào tháng 9–12/2028 để có ánh sáng tốt nhất, trong khi kế hoạch thật là đầu 2028.
9. **Mất nhật ký khi chưa có nhật ký.** Toast và Hồ sơ nói "the sample freezer was switched off" thay vì "a data log was lost" khi `dataLogs` rỗng. Test cho `missionRecord`.
10. **DONKI chỉ có bản dự báo.** Phản hồi live chỉ có `MODEL:` thì rơi xuống bản lưu. Test: `live with only model forecasts falls back to the cache`.
11. **Vào nhà trú khi bắt đầu đêm.** Khi `beginNight`, dịch người chơi vào trong vòm và khoá input trong 12 s tua nhanh.
12. **Ký tự xuống dòng.** Kiểm tra `thermalColor.ts`, `demoDirector.ts`, `demo.test.ts` đang dùng LF, khớp phần còn lại.
13. **Ảnh bình minh.** Chụp `docs/screens/plan4-dawn.png` (làm ở Task 8).
14. **`locked` đọc đầu khung.** Đọc lại `lock.locked` sau phần cập nhật truyện.

- [ ] **Step 1:** Viết các test hỏng trong `tests/finalReviewFixes5.test.ts`.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Sửa từng mục.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `fix: plan 4 deferred minors (storm exposure, shelter radii, computed dates and directions, data-log wording, DONKI forecasts)`

---

### Task 7: Sửa lỗi nhỏ Plan 3 (và Plan 2 nếu ảnh hưởng người chơi)

**Files:** theo từng mục; test thêm vào `tests/finalReviewFixes5.test.ts`

Từ ledger Plan 3:
1. Neo tời bị tiêu E âm thầm ở 2,5–6 m, và chỗ cắm neo không có dấu. Thêm vòng đánh dấu khi `winch.state === 'stuck'`. Lời nhắc rõ khoảng cách.
2. Bước nhảy trong demo có thể bị đặt sẵn: chỉ tính lần nhảy **sau khi** vào bước `jump`.
3. `stop_earthPeak` nói "always talk to Houston": sửa câu cho đúng là Trái Đất lặn theo chu kỳ.
4. `playerInSun` không được dùng (Plan 4 đã dùng cho sao, nên mục này coi như xong; xác nhận).
5. Input khi màn tối dần lúc cứu hộ: Plan 4 Task 4 đã sửa; xác nhận bằng test sẵn có.
6. Thẻ `longShadows`: "Right at the pole" đổi thành "Near the pole".
7. Thẻ `viperPanels`: kiểm lại con số "about 10°" bằng WebFetch nguồn NASA VIPER; sửa hoặc bỏ con số.

Từ ledger Plan 2, chỉ những mục người chơi thấy được:
8. File GLB không khớp hợp đồng thì game không khởi động được: chuyển sang cảnh báo và dùng thân placeholder. Test với manifest sai.

Các mục Plan 2 còn lại (cấp phát mỗi khung, tải model tuần tự, mắt nhiệt bỏ sót mesh tải muộn, kiểm hướng mặt phi hành gia) giữ "deferred" vì không ảnh hưởng gameplay. Ghi lại trong ledger.

- [ ] **Step 1:** Viết test hỏng cho mục 1, 2, 8.
- [ ] **Step 2:** Chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Sửa. Mục 7 cần WebFetch trước.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `fix: plan 3 and plan 2 player-facing minors (winch anchor marker, demo jump, copy and card accuracy, GLB contract fallback)`

---

### Task 8: Nhạc nền thích ứng (bổ sung của người dùng)

**Files:**
- Create: `src/audio/musicScore.ts`, `src/audio/musicMood.ts`, `src/audio/musicEngine.ts`, `src/audio/musicSystem.ts`, `tests/music.test.ts`
- Modify: `src/scenes/landingScene.ts`, `src/landing/finalDescent.ts`, `src/scenes/surfaceScene.ts`, `src/main.ts`

**Interfaces:**
- Consumes: `stormStep` phases (`solarStorm.ts`), `micaSys.silent`, `Act5Stage`, the landing phases from Tasks 2–3, the cargo countdown from Task 4, survival vitals.
- Produces:
  - `type MusicLevel = 0 | 1 | 2 | 3`
  - `type MusicCue = 'none' | 'silence' | 'night' | 'dawn' | 'finale'`
  - `interface MusicTarget { level: MusicLevel; urgency: number /* 0..1 */; cue: MusicCue }`
  - `interface MusicInputs { micaSilent: boolean; touchdownHold: boolean; storm: 'none'|'warning'|'storm'; stormLeftS: number; landing: 'none'|'cruise'|'braking'|'alarm'|'final'|'low'; countdownLeftS: number | null; countdownTotalS: number; tense: boolean; wonder: boolean; act5: Act5Stage | null }`
  - `pickMusic(i: Partial<MusicInputs>): MusicTarget`
  - `BPM: Record<MusicLevel, number>` = `{0: 60, 1: 72, 2: 90, 3: 128}`. Urgency raises level 3 up to 140.
  - `targetBpm(t: MusicTarget): number`, `stepBpm(cur, target, dt): number` (at most ±20 BPM/s, so tempo never jumps)
  - `beatTimes(from, to, bpm, phase0): number[]` (lookahead scheduler)
  - `countTickEvery(urgency): number` (beats between count ticks: 1 at 0, 0.25 at 1)
  - `loadMusicOn(storage): boolean`, `saveMusicOn(storage, on)` (try/catch; default ON)
  - `createMusic(): { setTarget(t: MusicTarget): void; stinger(kind: 'touchdown'|'discovery'): void; motif(who: 'pip'|'mica'): void; setOn(on: boolean): void; duck(on: boolean): void; unlock(): void; update(dt: number): void; dispose(): void }`

**Priority order in `pickMusic`** (highest first):
1. `micaSilent` or `touchdownHold` → cue `silence` (this beats a storm too).
2. `act5`: `liftoff` / `record` → `finale`; `dawn` / `sendData` / `farewell` → `dawn`; `night` / `nightPlanner` → `night` (sparse, level 0).
3. Urgent → level 3: storm `warning` / `storm`; landing `braking` / `alarm` / `low` (below 30 m); a countdown (cargo lander). `urgency = 1 − left/total`, clamped. Storm total = `STORM.warningS`; during `storm` urgency is 1.
4. `tense` → level 2: dark crater, a vital under 25%, towing MICA, landing `final` above 30 m.
5. `wonder` → level 1: landing `cruise` over Tranquility, the first 20 s after reaching a stop or planting the flag.
6. Otherwise level 0.

**Sound (composer's call; original):**
- Key: D Dorian / D minor.
  - Calm progression: Dm(add9) → B♭maj7 → Gm9 → Asus4, 2 bars each.
  - Dawn: ends on D major.
  - Finale: the main theme over full organ.
- **Organ voice:** additive partials 1, 2, 3, 4, 8 (drawbar-like gains). Slow attack 0.8 s. Long release. Shared convolver reverb from a generated 4 s noise impulse.
- **Layers by level:**
  - 0: pad plus sparse single notes.
  - 1: adds an octave pad and the main theme fragment.
  - 2: low D pedal plus an 8th-note ostinato, quieter pad.
  - 3: 16th-note ostinato, a heartbeat thump on beats 1 and 2, a high metallic count tick every `countTickEvery(urgency)` beats.
- Layers crossfade over 2 s, and tempo follows `stepBpm`.
- **`silence`:** all layers fade out in 0.3 s.
- **`stinger('touchdown')`:** fires after a 2 s hold. One wide D-major organ chord, 6 s decay, under the "Sea of Tranquility, 1969… South Pole, 2028" card.
- **Motifs:**
  - Pip: G4–C5–E5–D5, light triangle wave. Plays when Pip gives a hint (rate-limited 1/60 s).
  - Mica: sparse sine bells E6, B5 with 1.5 s gaps. Plays on MICA's lines.
- **Master gain:** 0.35. Music sits under dialogue: duck −6 dB while a dialogue line plays.

- [ ] **Step 1: Write the failing tests in `tests/music.test.ts`**
  - `silence beats the storm`: `micaSilent: true, storm: 'storm'` → cue `'silence'`.
  - `storm warning is urgent and urgency rises toward zero`: `stormLeftS` 150 → urgency ≈ 0; 15 → ≥ 0.9; level 3.
  - `calm by default at 60 BPM`: empty inputs → level 0, `targetBpm` 60.
  - `act 5 cues`: `night` → `'night'`; `dawn` → `'dawn'`; `liftoff` → `'finale'`.
  - `landing below 30 m is urgent, above is tense`.
  - `tempo ramps instead of jumping`: `stepBpm(60, 128, 0.5)` = 70.
  - `count ticks speed up`: `countTickEvery(0)` = 1, `countTickEvery(1)` = 0.25, monotonic.
  - `beatTimes` at 60 BPM from 0 to 2.5 → `[0, 1, 2]`; honours `phase0`.
  - `music preference survives broken storage`: a storage whose `getItem` throws → `true`.
- [ ] **Step 2:** `npx vitest run tests/music.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `musicScore.ts` and `musicMood.ts`.
- [ ] **Step 4:** `npx vitest run tests/music.test.ts`. Expected: PASS.
- [ ] **Step 5:** Implement `musicEngine.ts` (Web Audio, 100 ms lookahead scheduler on a 25 ms timer) and `musicSystem.ts`:
  - `AudioContext` resumes on the first keydown or pointerdown.
  - B toggles music (toast "Music on/off · B").
  - One engine is shared by the landing intro and the surface (created in `main.ts`).
- [ ] **Step 6:** Wire it in:
  - Landing scene: cruise → braking → alarm.
  - Final descent: final → low → touchdown hold → stinger.
  - Surface: storm, cargo countdown, dark crater, vitals, towing, stops, `micaSys.silent`, Act 5 stages.
  - Duck under dialogue.
- [ ] **Step 7: Browser check (Playwright).** Read the engine's debug state (`window.__music`: level, bpm, cue) at:
  - orbit cruise;
  - braking;
  - touchdown, where it should go silent then play the stinger;
  - camp;
  - storm countdown, where bpm should rise;
  - finding MICA, where it should go silent;
  - the long night;
  - dawn;
  - liftoff.

  Confirm in the console that there are no audio errors and that FPS is unchanged (≥ 30).
- [ ] **Step 8:** `npx vitest run` PASS, `npm run build` OK.
- [ ] **Step 9: Commit** `feat: adaptive original organ score (calm to urgent, silence for MICA, dawn swell, liftoff finale)`

---

### Task 9: Chơi trọn từ đầu và kiểm tra cuối

**Files:** `docs/screens/plan5-*.png`, `docs/screens/plan4-dawn.png`

- [ ] **Step 1:** `npx vitest run` và `npm run build`. Kỳ vọng: toàn bộ PASS, build OK.
- [ ] **Step 2: Chơi từ đầu không dùng `?jump`.** Dùng dịch chuyển debug qua `window.__world` để rút ngắn đường đi:
  - cảnh quỹ đạo;
  - hãm tốc;
  - đáp tay (một lần lật, rồi thành công);
  - Hồi 1 và cắm cờ;
  - module và tàu hàng (giấu Pip);
  - 8 điểm dừng;
  - Mica, bão, ký ức;
  - Hồi 5 (thấy bụi lơ lửng lúc hoàng hôn);
  - bình minh, Hồ sơ.

  Lỗi chặn tiến trình sửa ngay (TDD).
- [ ] **Step 3:** Chạy lại lượt A và B của Plan 4 từ `?jump=act4`. Cả hai tới Hồ sơ.
- [ ] **Step 4: Đo FPS** ở 4 nơi (nhạc bật): quỹ đạo, bụi lúc đáp, tàu hàng đáp, dải sáng chân trời. Kỳ vọng: ≥ 30. Ghi vào ledger.
- [ ] **Step 5: Commit** `chore: plan 5 full playthrough from orbit to mission record`
