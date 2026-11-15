# Plan 7: Cốt truyện Pip/MICA mới, phi hành gia AxEMU, chuyển động, xe tự hành, bụi, tàu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm game chân thực và đúng cốt truyện mới trước buổi demo 14–15/11:
- Pip và người chơi gặp nhau lần đầu trên bề mặt; Pip không biết MICA.
- Phi hành gia mặc AxEMU, chuyển động tự nhiên.
- Có xe tự hành LTV để lái.
- Bụi đẹp hơn; HLS, Orion, Pip, MICA chi tiết hơn.

**Architecture:**
- Như các plan trước: luật là hàm thuần có test, Babylon chỉ gọi.
- Model dựng bằng script Blender trong `tools/blender/`, chạy trong Blender của người dùng qua Blender MCP. Mọi datablock được gắn thẻ `pm_build`, xuất GLB ra `public/models/`, hợp đồng node nằm trong `src/models/manifest.ts`.
- **Phi hành gia giữ kiểu khúc cứng có khớp** (Claude chọn, spec §8 để builder quyết): bộ đồ AxEMU thật có vòng bi ở vai, hông, khuỷu và cổ tay, nên các khúc cứng nối bằng vòng khớp và nếp gấp vải trông đúng. Cách này giữ được cơ chế hiện có (code xoay node theo tên) và ít rủi ro nhất trước hạn.

**Tech Stack:** như Plan 6a (Babylon.js 9.34, Havok, Vite 8, TS 5.9, Vitest 5). Blender 5.2 qua Blender MCP (safe mode: một script inline gồm `common.py` + `build_<id>.py`, xem `tools/blender/run.md`).

**Spec:** `docs/superpowers/specs/2026-11-09-lam-dep-model-va-sua-cot-truyen-design.md` (đã duyệt 09/11).

## Global Constraints

- **Hiệu năng:**
  - ≥ 30 FPS ở quỹ đạo, bụi lúc đáp, tàu hàng, tua hoàng hôn, cất cánh, và **khi lái xe**.
  - Mỗi GLB nên dưới khoảng 5 MB.
- **Tốc độ không đổi:** đi 1,8 m/s (`WALK_SPEED_MS`), chạy 2,8 m/s (`LOPE_SPEED_MS`), nhảy 1,6 m/s (`JUMP_SPEED_MS`).
- **Không:** dùng Mixamo, model trả phí, hay thêm dependency runtime.
- **Bụi:** bay vòng cung, g = 1,62, không cản không khí, không thành mây lơ lửng (spec v3 §5).
- **Blender:** không mở hay lưu đè file Blender của người dùng; chỉ đụng datablock có thẻ `pm_build`; dọn bằng `end_build` sau mỗi lần dựng.
- **Nguồn:** ghi URL ảnh tham khảo và ghi công NASA/Axiom trong `public/models/SOURCES.md`.
- **Chữ:** mọi chữ mới có trong `lines.en.ts` + `lines.vi.ts` hoặc `tr()` + `vi.ts`. Pip xưng "mình / bạn". Test i18n hiện có phải xanh.
- **Thẻ kiến thức mới:** `source.url` https đã mở bằng WebFetch khi viết, số liệu khớp nguồn. Phần tưởng tượng phải ghi rõ.
- **Không làm hỏng:** tự lưu / chơi tiếp, menu tạm dừng, tiếng Việt, hai lượt chơi A/B tới Hồ sơ nhiệm vụ, demo `?demo=1`.
- **Máy hay thiếu bộ nhớ:** chỉ bật server dev khi cần kiểm, xong tắt ngay.
- **Git:** không merge hay push. Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Thứ tự** (spec §7): Task 1 → 8. Thiếu giờ trước 13/11 thì cắt từ cuối (Task 7, rồi Task 6).

## Review Focus

1. **Cảnh gặp Pip bị đi tắt:**
   - Esc bỏ qua cảnh hạ cánh, chơi tiếp từ bản lưu, `?demo=1`, `?jump=`.
   - Người chơi chạy vụt qua hoặc tới từ hướng khác.

   Cảnh gặp xảy ra đúng một lần (hoặc được coi là đã xong), rồi Hồi 1 chạy tiếp. Test: `meeting completes once from any approach; saved or skipped games count as met` (Task 1).
2. **Xe va chạm với thử thách:**
   - Lái vào Hố Tối, lúc bão, khi tời đang giữ Pip, lúc đếm ngược tàu hàng.
   - Xuống xe trên dốc gắt; xe kẹt hoặc lật.
   - Pip đang bận việc (chở thùng, kẹt tời) không được bỏ việc để lên xe.

   Test: `rover refuses forbidden ground and never takes a busy Pip; a stuck rover can be left` (Task 4).
3. **Chân trên địa hình dốc và đá:**
   - Chân không lơ lửng hay chìm.
   - Rơi từ mép hố cao xuống thì khuỵu mạnh hơn.
   - Xoay khi đang bay thì vẫn mượt.

   Test: `planted foot follows the ground; landing crouch grows with fall speed; turning rate is capped` (Task 3).
4. **Hiệu năng khi lái xe tung bụi và có model mới:** đo FPS trong Task 8, mỗi cảnh ≥ 30.
5. **Tự lưu và ngôn ngữ với nội dung mới:**
   - Cờ `pip:met` và trạng thái xe được khôi phục; xe đặt cạnh trại.
   - Thoại mới có tiếng Việt.

   Test: `restore marks Pip met and parks the rover at camp` (Task 4), cùng test i18n sẵn có (mọi task).

---

## File Structure

```
src/story/pipMeeting.ts          — mới: cảnh gặp Pip (thuần): giai đoạn, khoảng cách, cờ
src/story/pipMeetingSystem.ts    — mới: Pip lấp ló sau thùng, bộ đàm rè, E — chào Pip
src/player/gait.ts               — viết lại: dáng đi Mặt Trăng (thuần): tì chân, xoay, nhảy, đứng thở
src/player/legIk.ts              — mới: IK hai đốt cho chân (thuần)
src/player/astronaut.ts          — dùng gait mới, xoay mượt, node mới
tools/blender/build_astronaut.py — viết lại: AxEMU chi tiết
src/rover/rover.ts               — mới: vật lý xe (thuần): ga, lái, dốc, vùng cấm, nảy
src/rover/roverSystem.ts         — mới: model, lên/xuống xe, camera, Pip ngồi sau, bụi bánh
tools/blender/build_rover.py     — mới: xe LTV
src/fx/dustSystem.ts             — hạt tròn mềm + bụi mịn; vệt bụi bánh xe
tools/blender/build_props.py     — HLS chi tiết (thay phần hls)
tools/blender/build_orion.py     — mới: Orion
src/scenes/landingScene.ts       — dùng hls.glb + orion.glb (dự phòng: khối thủ tục cũ)
tools/blender/build_pip.py, build_mica.py — làm mịn, thêm chi tiết (giữ hợp đồng node)
src/models/manifest.ts           — node mới (astronaut), model mới (rover, orion)
src/content/lines.en.ts, lines.vi.ts, cards.en.json, cards.vi.json, src/i18n/vi.ts
tests/pipMeeting.test.ts, tests/gait.test.ts (mở rộng), tests/rover.test.ts, tests/dust.test.ts, tests/storyAudit.test.ts
```

---

### Task 1: Cốt truyện mới — gặp Pip lần đầu, Pip không biết MICA

**Files:**
- Create: `src/story/pipMeeting.ts`, `src/story/pipMeetingSystem.ts`, `tests/pipMeeting.test.ts`, `tests/storyAudit.test.ts`
- Modify:
  - `src/content/lines.en.ts`, `src/content/lines.vi.ts`
  - `src/science/scienceSystem.ts` (bỏ kích hoạt `meetPip` 6 m cũ)
  - `src/scenes/surfaceScene.ts`, `src/demo/demoController.ts`, `src/save/save.ts` (`restoreSteps`)

**Interfaces:**
- Produces:
  - `type MeetStage = 'hidden' | 'peeking' | 'overheard' | 'greeted' | 'done'`
  - `meetStep(stage, s: { playerDistM: number; ePressed: boolean; dialogueBusy: boolean; locked: boolean }): MeetStage`
    - `hidden` → `peeking` khi `playerDistM ≤ 45`
    - `peeking` → `overheard` khi `≤ 20`
    - `overheard` + `ePressed` → `greeted`
    - `greeted` → `done` khi hết thoại
  - `MEET = { peekM: 45, overhearM: 20 }`
  - `PIP_HIDE_SPOT`: sau thùng `habitat` ở `LANDING + (-20, 20)`, lệch 1,5 m về phía xa bãi đáp.
  - Cờ `pip:met` (đặt khi `done`).
  - `restoreSteps(...).pipMet` (cờ `pip:met` hoặc `dialogue:meetPip:done`).

**Thoại** (người viết soạn theo spec §4–5, ID cố định, có cả hai ngôn ngữ):
- `landing_pip` → đổi tên thành `landing_burn`. Chỉ còn câu Houston dặn giữ Space, bỏ câu của Pip.
- `land_start`, `land_ok`, `land_tipped`, `land_tooFast`, `land_noFuel`, `land_drift`, `land_suggest_auto`: chuyển hết câu của Pip cho `commander` hoặc `houston`, giữ nội dung khoa học.
- Mới:
  - `pip_mutter`: Pip lẩm bẩm với "Tay", không biết người chơi nghe được.
  - `pip_heard`: "Bạn… NGHE được mình à?! Bảy tháng rồi chưa ai trả lời mình cả!"
  - `houston_pip`: Houston giải thích robot xây dựng có bộ đàm tầm ngắn.
- `meetPip`: bỏ "building your base", thay bằng "xây theo bản vẽ, không biết ai sẽ tới".
- `commDelay` (ăng-ten Hồi 1): thêm 1–2 câu Pip lần đầu tự nói với Houston, Houston chào lại (spec §4.4).
- `tracksFound`: "Đây không phải vệt bánh của mình."
- `micaFound`: câu đầu của Pip là "Một… robot khác? Ở đây sao?"; Houston nhận ra MICA.
- Rà mọi câu ngầm cho rằng Pip biết MICA từ trước.

- [ ] **Step 1: Viết test hỏng** `tests/pipMeeting.test.ts`:
  - `stages advance by distance and E, never backwards`
  - `meeting completes once from any approach; saved or skipped games count as met`: đi thẳng vào 5 m vẫn qua `overheard`; `ePressed` khi `hidden` không làm gì; `restoreSteps` với `dialogue:meetPip:done` cho `pipMet = true`.
- [ ] **Step 2: Viết test hỏng** `tests/storyAudit.test.ts`:
  - `Pip never speaks before the meeting`: không id nào trong `landing_*`, `land_*` có `speaker: 'pip'` (cả hai ngôn ngữ).
  - `new meeting lines exist in both languages`: `pip_mutter`, `pip_heard`, `houston_pip`.
  - `Pip does not know MICA before finding it`: `tracksFound` và các id trước `micaFound` không chứa "MICA" trong câu của Pip (bản EN).
- [ ] **Step 3:** `npx vitest run tests/pipMeeting.test.ts tests/storyAudit.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 4: Cài đặt** `pipMeeting.ts` và `pipMeetingSystem.ts`:
  - Pip đứng ở `PIP_HIDE_SPOT`, ló ra rồi lùi lại (hoạt hình đơn giản bằng `gotoTarget` và `setFace`).
  - `overheard` phát `pip_mutter` kèm toast "📻 …"; lời nhắc `tr('E — say hello to Pip')`.
  - Sửa thoại hai ngôn ngữ; bỏ kích hoạt cũ trong `scienceSystem.update`.
  - Demo: bước `meetPip` xong khi có `pip:met`.
  - `restore`: bỏ qua cảnh gặp nếu `pipMet`.
- [ ] **Step 5:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 6: Kiểm trên trình duyệt** (bật server, xong tắt):
  - Đáp xong thấy Pip ló sau thùng; tới gần nghe lẩm bẩm; E → `pip_heard` → `houston_pip` → Hồi 1.
  - Esc bỏ qua cảnh đáp vẫn gặp được.
- [ ] **Step 7: Commit** `feat: first meeting with Pip on the surface; Pip learns about MICA with the player`

---

### Task 2: Model phi hành gia AxEMU

**Files:**
- Modify: `tools/blender/build_astronaut.py`, `tools/blender/common.py` (nếu cần hàm dựng mới), `src/models/manifest.ts`, `public/models/astronaut.glb`, `public/models/SOURCES.md`, `tests/models.test.ts`

**Interfaces:**
- Produces:
  - Node mới trong hợp đồng `astronaut`, ngoài các node cũ: `spine`, `neck`, `ankle_L`, `ankle_R`, `wrist_L`, `wrist_R`.
  - Pivot đặt tại tâm khớp, mặt trước +Z, `_L` ở +X (theo `run.md`).
- Chi tiết AxEMU (theo ảnh NASA/Axiom, ghi URL vào SOURCES):
  - Lớp vải ngoài màu xám đậm với các mảng màu nhận diện (bản trình diễn của Axiom).
  - Vòng khớp kim loại ở vai, hông, cổ tay; nếp gấp vải ở gối và khuỷu.
  - Mũ bong bóng có kính vàng nâng hạ được và đèn mũ hai bên.
  - Ba lô PLSS liền khối phía sau, cửa vào ở lưng.
  - Bảng điều khiển ngực, găng có ngón, ủng đế dày, cờ Mỹ và phù hiệu trên tay áo.
- Vật liệu PBR có độ nhám khác nhau. Bake ambient occlusion vào texture nếu kịp.
- Chiều cao 1,85–1,95 m (hợp đồng cũ).

- [ ] **Step 1: Viết test hỏng** (trong `tests/models.test.ts`): hợp đồng `astronaut` có 6 node mới; `front`/`left` đúng hướng; kích thước file `< 5 MB`.
- [ ] **Step 2:** `npx vitest run tests/models.test.ts`. Kỳ vọng: FAIL (thiếu node).
- [ ] **Step 3:** Viết lại `build_astronaut.py`, dựng và xuất qua Blender MCP (`run.md`), `look` kiểm 4 góc, rồi `end_build('astronaut')`.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS. Code cũ vẫn chạy vì node cũ còn nguyên.
- [ ] **Step 5:** Chụp `docs/screens/plan7-astronaut.jpg` (4 góc trong Blender `look`).
- [ ] **Step 6: Commit** `feat: detailed AxEMU astronaut model`

---

### Task 3: Chuyển động tự nhiên

**Files:**
- Modify: `src/player/gait.ts`, `src/player/astronaut.ts`, `tests/gait.test.ts`
- Create: `src/player/legIk.ts`

**Interfaces:**
- Consumes: node mới của Task 2.
- Produces:
  - `legIk(hip: V3, target: V3, thighM: number, shinM: number): { hip: number; knee: number }` (hai đốt, gối gập về trước)
  - `GaitState`: `{ phase, footL: V3|null, footR: V3|null, crouch: number, lean: number, yaw: number }`
  - `stepGait(st: GaitState, input: { speedMs, lope, supported, vy, groundAt(x,z): number, desiredYaw, dt }): { st: GaitState; pose: Pose }`. `Pose` mở rộng thêm `spine`, `neck`, `ankleL/R`, `wristL/R`, `crouch`, `lean`.
  - `MAX_TURN_RAD_S = 6` (≈ 340°/giây, xoay 180° mất khoảng 0,5 giây)
  - `LAND_CROUCH = { perMs: 0.12, max: 0.35 }`
- Hành vi (spec §3.2):
  - **Đi 1,8 m/s:** đi nhún, có pha bay ngắn; bàn chân bị khoá ở chỗ chạm đất trong pha tì (chân sau dùng IK theo `groundAt`); thân đổ trước khoảng 6°; tay vung ít.
  - **Chạy (lope):** hai chân đẩy gần cùng lúc, pha bay dài, thân đổ trước khoảng 12°.
  - **Nhảy:** cất cánh duỗi người. Trên không, tư thế thay đổi theo `vy` (lên thì co gối, xuống thì duỗi chân đón đất). Chạm đất thì `crouch = min(max, perMs·|vy|)` rồi hồi trong 0,4 giây.
  - **Xoay:** `yaw` tiến về `desiredYaw` với tốc độ tối đa `MAX_TURN_RAD_S`, thân nghiêng tỉ lệ tốc độ xoay. Hướng di chuyển vẫn theo phím ngay lập tức (không đổi lối chơi).
  - **Đứng yên:** thở (spine ±1,5°, chu kỳ khoảng 4 giây).

- [ ] **Step 1: Viết test hỏng** `tests/gait.test.ts` (giữ test cũ còn hợp lệ):
  - `planted foot follows the ground; landing crouch grows with fall speed; turning rate is capped`:
    - trong pha tì, `footL` giữ nguyên toạ độ x/z khi thân đi tới 0,3 m, và y bằng `groundAt`;
    - `crouch` sau khi chạm đất ở `vy = −1` nhỏ hơn ở `vy = −4`, và không vượt `0.35`;
    - sau `dt = 0.1`, `|Δyaw| ≤ 0.6`.
  - `legIk reaches reachable targets and stays straight for far ones`: khoảng cách hông–mắt cá khớp; gối không gập ngược.
  - `idle breathing stays within ±1.5°`
- [ ] **Step 2:** chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt `legIk.ts`, `stepGait`; nối vào `astronaut.ts` (xoay mượt `facingYaw`, áp `Pose` lên node).
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 5: Kiểm trên trình duyệt:** đi, chạy, nhảy, quay trên mặt phẳng và dốc. Không trượt chân, không xuyên đất. Quay video ngắn hoặc chụp chuỗi ảnh `docs/screens/plan7-gait-*.jpg`.
- [ ] **Step 6: Commit** `feat: lunar gait with planted feet, smooth turns, jump crouch and breathing`

---

### Task 4: Xe tự hành LTV

**Files:**
- Create: `src/rover/rover.ts`, `src/rover/roverSystem.ts`, `tools/blender/build_rover.py`, `public/models/rover.glb`, `tests/rover.test.ts`
- Modify:
  - `src/models/manifest.ts` (`rover`)
  - `src/scenes/surfaceScene.ts`, `src/pip/brain.ts` (chế độ `ride`)
  - `src/save/save.ts`
  - `src/content/*`, `src/i18n/vi.ts`, `cards.en.json`, `cards.vi.json`

**Interfaces:**
- Produces:
  - `ROVER = { maxSpeedMs: 5, accel: 1.2, brake: 2.5, steerRad: 0.5, wheelbaseM: 2.3, maxSlopeDeg: 20, bounce: 0.25 }`
    - Xe LRV thật đạt khoảng 13–18 km/h và leo được dốc khoảng 25°; game chọn 20° cho an toàn. Ghi ở thẻ.
  - `interface RoverState { x: number; z: number; yaw: number; speed: number; pitch: number; roll: number; bounceY: number; bounceV: number }`
  - `roverStep(s, input: { throttle: −1..1; steer: −1..1 }, ground: { height(x,z): number; slopeDeg(x,z,yaw): number; forbidden(x,z): boolean }, dt): RoverState`
    - Mô hình xe đạp (bicycle model).
    - Không vào được vùng `forbidden` (Hố Tối, quanh nhà trú) và dốc trên `maxSlopeDeg`: xe dừng ở mép.
    - Nảy là lò xo tắt dần theo g = 1,62.
  - `canBoard(s: { distM: number; pipMode: PipMode; pipBusy: boolean }): { player: boolean; pip: boolean }`
    - Người chơi lên được khi cách xe ≤ 3 m.
    - Pip chỉ lên khi không bận (không chở thùng, tời không giữ, không có thử thách đang dùng Pip).
  - `ROVER_PARK = add(BASE, 10, 6)`
  - `restoreSteps(...).roverAt = 'camp'`
- **Lúc đáp:** sau cảnh gặp Pip, xe được hạ từ HLS (toast + Pip phụ giúp, khoảng 5 giây) và đứng cạnh tàu. Nếu bỏ qua hoặc chơi tiếp thì xe đứng sẵn ở `ROVER_PARK`.
- **Lái:**
  - E lên/xuống. W/S, A/D điều khiển. Camera theo sau xe.
  - Đang lái thì `player` ẩn, ngồi trên ghế.
  - Pip `ride` ngồi thùng sau. Pip xuống khi người chơi xuống.
- **Bụi:** hai vệt bụi cong từ bánh sau, lượng tỉ lệ tốc độ (dùng `dust.plume` hoặc API mới của Task 5).
- **Thẻ mới** (WebFetch kiểm chứng khi viết):
  - `apolloLRV`: xe LRV của Apollo 15–17, nguồn NASA.
  - `artemisLTV`: chương trình xe LTV của Artemis, nguồn NASA, ghi rõ xe trong game là tưởng tượng về thời điểm.

- [ ] **Step 1: Viết test hỏng** `tests/rover.test.ts`:
  - `throttle accelerates to the top speed and brakes to a stop`
  - `steering turns the rover like a car (bicycle model)`
  - `rover refuses forbidden ground and never takes a busy Pip; a stuck rover can be left`: dốc 25° chặn; vùng cấm chặn; `canBoard` với `pipBusy` cho `pip: false`; người chơi vẫn xuống được khi `speed = 0` ở mọi chỗ.
  - `bounce settles under lunar gravity`
  - `restore marks Pip met and parks the rover at camp`
- [ ] **Step 2:** chạy test. Kỳ vọng: FAIL.
- [ ] **Step 3:** Dựng `build_rover.py` qua Blender MCP: khung, 4 bánh lưới thép, ghế, chảo ăng-ten, tấm pin, thùng sau; node `wheel_FL/FR/RL/RR`, `seat_driver`, `seat_cargo`. Rồi `end_build('rover')`.
- [ ] **Step 4:** Cài đặt `rover.ts`, `roverSystem.ts`, chế độ Pip `ride`, cảnh hạ xe, thẻ, chữ hai ngôn ngữ.
- [ ] **Step 5:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 6: Kiểm trên trình duyệt:**
  - Lái quanh trại; Pip ngồi sau.
  - Lái tới mép Hố Tối thì dừng; dốc gắt thì dừng.
  - Xuống xe, đi bộ làm thử thách.
  - Đo FPS khi lái (≥ 30). Chụp `docs/screens/plan7-rover.jpg`.
- [ ] **Step 7: Commit** `feat: drivable Artemis lunar rover with Pip riding along`

---

### Task 5: Bụi đẹp hơn

**Files:** Modify `src/fx/dustSystem.ts`, `src/fx/ballistic.ts` (nếu cần), `tests/dust.test.ts` (mới hoặc mở rộng `tests/ballistic.test.ts`)

**Interfaces:**
- Giữ API: `burst`, `trickle`, `plume`, `update`.
- Thêm: `spray(at: V3, dirYaw: number, speedMs: number, n: number)` cho bánh xe.
- Hạt:
  - Thay khối tứ diện bằng hạt bo tròn (icosphere bậc thấp, có pháp tuyến mượt) để vẫn nhận ánh sáng thật.
  - Thêm lớp "bụi mịn": sprite tròn mềm, mờ dần theo tuổi, tối trong bóng (lấy độ sáng từ `SunlightCache` mỗi đợt phát, không mỗi hạt).
- Mọi hạt vẫn bay vòng cung và biến mất khi chạm đất (không lơ lửng).
- Giữ giới hạn `capacity`.

- [ ] **Step 1: Viết test hỏng:**
  - `every grain lands within its ballistic time (no hovering)`: thời gian tồn tại ≤ thời gian bay tính theo `vy` và g = 1,62, cộng 0,1 giây.
  - `spray throws dust behind the wheel`: vận tốc ngang ngược hướng xe.
  - `pool never exceeds capacity`
- [ ] **Step 2:** chạy. Kỳ vọng: FAIL (chưa có `spray`).
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 5: Kiểm trên trình duyệt:** bước chân, nhảy, bụi phụt lúc đáp, bánh xe. Đo FPS khi bụi nhiều nhất. Chụp `docs/screens/plan7-dust.jpg`.
- [ ] **Step 6: Commit** `feat: soft lit lunar dust, wheel spray`

---

### Task 6: Starship HLS và Orion chi tiết

**Files:**
- Modify: `tools/blender/build_props.py` (HLS), `public/models/hls.glb`, `src/scenes/landingScene.ts`, `src/models/manifest.ts`, `public/models/SOURCES.md`, `tests/models.test.ts`
- Create: `tools/blender/build_orion.py`, `public/models/orion.glb`

**Interfaces:**
- **HLS:** giữ node `hls_root`, `hull`, `elevator`, `legs`, `thrusters`. Thêm chi tiết theo spec §3.4:
  - mối ghép tấm thép;
  - dải cửa sổ;
  - buồng thang máy;
  - 6 chân đáp;
  - cụm động cơ đáp đặt cao;
  - dải pin mặt trời;
  - cổng ghép nối;
  - đúng 50 × 9 m.
- **Orion** (model mới, node `orion_root`, `crew_module`, `service_module`, `wing_1..4`, `engine`):
  - module chở người hình nón 5 m;
  - ESM 4 m;
  - 4 cánh pin chữ X;
  - tấm chắn nhiệt.
- `landingScene.ts` dùng hai GLB này, phóng to ×100 như cũ. Nếu nạp lỗi thì dùng khối thủ tục cũ (dự phòng).

- [ ] **Step 1: Viết test hỏng:** hợp đồng `orion` (tồn tại, node, hướng, < 5 MB); `hls` vẫn đạt hợp đồng và chiều cao 48–52 m.
- [ ] **Step 2:** chạy. Kỳ vọng: FAIL.
- [ ] **Step 3:** Dựng hai model qua Blender MCP, `look`, `end_build`. Nối vào `landingScene.ts`.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: PASS.
- [ ] **Step 5: Kiểm trên trình duyệt:** cảnh quỹ đạo, bãi đáp, cất cánh. Chụp `docs/screens/plan7-ships.jpg`.
- [ ] **Step 6: Commit** `feat: detailed Starship HLS and Orion models`

---

### Task 7: Pip và MICA chi tiết hơn

**Files:** Modify `tools/blender/build_pip.py`, `tools/blender/build_mica.py`, `public/models/pip.glb`, `public/models/mica.glb`, `public/models/SOURCES.md`

**Interfaces:**
- Giữ nguyên toàn bộ node và vật liệu trong hợp đồng hiện có. Màn hình mặt Pip (`face_screen`, `PipFace`) phải chạy như cũ.
- Thêm chi tiết theo spec §3.5:
  - bo cạnh và chia mặt;
  - dây cáp, ốc vít, vân lốp;
  - cell pin có vân;
  - MICA cũ kỹ và phủ bụi hơn.
- Cảm hứng từ ảnh VIPER và Curiosity của NASA.

- [ ] **Step 1:** `npx vitest run tests/models.test.ts`. Kỳ vọng: PASS (đây là mốc trước khi dựng lại; hợp đồng không đổi).
- [ ] **Step 2:** Dựng lại hai model qua Blender MCP, `look`, `end_build`.
- [ ] **Step 3:** `npx vitest run`. Kỳ vọng: PASS (hợp đồng giữ nguyên, kích thước < 5 MB).
- [ ] **Step 4: Kiểm trên trình duyệt:** mặt Pip đổi biểu cảm; MICA sửa và thức dậy như cũ. Chụp `docs/screens/plan7-robots.jpg`.
- [ ] **Step 5: Commit** `feat: more detailed Pip and MICA`

---

### Task 8: Kiểm tra cuối

- [ ] **Step 1:** `npx vitest run` và `npm run build`. Kỳ vọng: toàn bộ PASS, build OK.
- [ ] **Step 2: Chơi bằng tiếng Việt:** màn khởi đầu → quỹ đạo → đáp → gặp Pip → lái xe → Hồi 1–2 → `?jump=act4` lượt A và B tới Hồ sơ nhiệm vụ. Thêm: chơi tiếp từ bản lưu (Pip đã gặp, xe ở trại) và demo `?demo=1`.
- [ ] **Step 3: Đo FPS:** quỹ đạo, bụi lúc đáp, lái xe, tàu hàng, tua hoàng hôn, cất cánh. Kỳ vọng: ≥ 30. Ghi vào ledger.
- [ ] **Step 4:** Review cuối toàn nhánh, sửa lỗi Critical/Important, chụp ảnh còn thiếu. Commit `chore: plan 7 playthrough and final checks`.
