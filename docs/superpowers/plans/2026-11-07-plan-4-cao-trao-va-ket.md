# Plan 4: Bão Mặt Trời, ký ức của Mica, Bóng Dài và Bình minh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho câu chuyện có cao trào và kết thúc trọn vẹn:
- Bão Mặt Trời dựa trên sự kiện DONKI thật, xảy ra lúc đang kéo Mica về.
- Câu đố ghép ký ức của Mica bằng hướng bóng.
- Hồi 5 "Bóng Dài" trong đêm thật 3,6 ngày ở căn cứ (29/11–03/12/2028): đoán khe núi Mặt Trời mọc, bịt chỗ rò nhiệt, ngân sách năng lượng, lựa chọn của Mica.
- Bình minh, gửi dữ liệu của Mica trước khi Trái Đất lặn, chia tay, cất cánh và Hồ sơ nhiệm vụ.

**Architecture:**
- Như Plan 3: mọi luật chơi là hàm thuần có test Vitest; lớp Babylon chỉ gọi các hàm đó.
- Các mốc thời gian của Hồi 5 **không ghi cứng**. Chúng được tính lúc chạy từ heightmap LOLA và lịch JPL, bằng `findCampNight()`. Test trên dữ liệu thật chứng minh kết quả rơi đúng 29/11 → 03/12.
- Hồi 5 do một máy trạng thái thuần `Act5Director` điều khiển. Các màn hình (khe núi, ngân sách đêm, lựa chọn, Hồ sơ) là panel Babylon GUI, điều khiển **bằng phím số và Enter**, vì chuột đang dùng để xoay camera.

**Tech Stack:** như Plan 3 (Vite 8, TypeScript ~5.9, Babylon.js 9.34 core/gui/loaders, Havok 1.3, Vitest 5, Node 24). Script TS chạy bằng `npx vite-node`.

**Spec:** `docs/superpowers/specs/2026-11-06-hanh-trinh-va-model-design.md` (v3), các mục:
- §8: hàng Hồi 4, Hồi 5, Kết, Âm thanh.
- §7.4.
- §10.2: đồng hồ nhảy theo nhịp truyện.

Spec v3 là delta trên `docs/2026-11-06-pip-mica-thiet-ke-game.md` (v2.0). Phần v2.0 cần đọc:
- Cảnh 4.2 và 4.5.
- Hồi 5 (5.1–5.5).
- Kết (K.1–K.5).
- §3.2–3.3 (tính cách Pip và Mica).
- §5.8 (không có màn thua).

Executor cũng đọc ledger Plan 3: `docs/superpowers/plans/2026-11-06-plan-3-ledger.md`.

**Quyết định của người dùng (07/11/2026):** Hồi 5 tua tới đêm thật gần nhất ở căn cứ.
- Màn hình hiện "11 tuần sau…".
- Đêm bắt đầu 29/11/2028 khoảng 20:00Z: Mặt Trời khuất sau ngọn đồi ở phương vị khoảng 135°.
- Bình minh khoảng 10:00–12:00Z ngày 03/12, Mặt Trời ló qua khe ở khoảng 116°.
- Trái Đất ở trên trời suốt đêm và lặn ở căn cứ khoảng 07:00Z ngày 04/12.
- Vì Trái Đất vẫn còn, việc mất liên lạc là **lựa chọn tắt liên lạc để dành điện** trong ngân sách đêm.
- Phần Kết là gửi dữ liệu của Mica **trước khi Trái Đất lặn**, gợi lại việc Mica từng tắt máy đúng lúc Trái Đất lặn.

## Global Constraints

- **Ánh sáng 100% dữ liệu thật** (spec §10.1): không nâng Mặt Trời giả, không làm tối giả. Đêm Hồi 5 là bóng địa hình thật (`isSunlit` trên heightmap LOLA với Mặt Trời JPL).
- **Đồng hồ** (spec §10.2): `TIME_SCALE = 20` giữ nguyên. Các bước nhảy thời gian chỉ đi tới và là mốc thật do `findCampNight()` tính.
- **Không có màn thua** (v2 §5.8):
  - Bão bắt gặp ngoài trời thì cứu hộ về căn cứ, giữ nguyên tiến độ.
  - Thiếu năng lượng thì vẫn giữ được Mica, đổi lại mất một nhật ký dữ liệu. "Game không phạt lòng tốt."
  - Không có trạng thái kẹt cứng.
- **Mọi thử thách cần phối hợp** (spec §2): bịt rò nhiệt cần Pip đắp đất; khe núi cần Pip xoay pin; Hố tối cần đèn của Pip và Mica chỉ đường.
- **Bão Mặt Trời dùng dữ liệu DONKI** (spec §3, v2 §8), máy chủ mới `ccmc.gsfc.nasa.gov/DONKI-API`: thử API trước (timeout 4 s), lỗi thì dùng bản lưu `public/data/donki/sep.json`. **Không bịa số liệu sự kiện.** Nếu cả API lẫn bản lưu đều không có, dùng câu chữ chung chung không nêu ngày.
- **Vật lý bức xạ đúng:**
  - Hạt năng lượng cao của bão đến gần như từ mọi hướng, nên **bóng tảng đá không che được**.
  - Chỗ nấp là nơi có đất phủ dày hoặc thân tàu: nhà trú bão phủ regolith ở căn cứ, hoặc tàu đáp.
  - Lời thoại và thẻ phải nói đúng điều này. Ghi `Ruling` vì v2.0 Cảnh 4.2 có nhắc "nấp bóng tảng đá".
- **Chữ hiển thị mới** nằm trong `src/content/lines.en.ts` và `src/content/cards.en.json` (tiếng Anh; tiếng Việt ở Plan 6).
  - Câu thoại mẫu của v2.0 được dùng gần nguyên văn (dịch sang tiếng Anh).
  - Các câu khác do executor viết, đúng tính cách v2 §3.2–3.3.
- **Thẻ kiến thức mới:**
  - `tag ∈ real | fiction | debated`.
  - `source.url` là https và **đã mở bằng WebFetch/WebSearch khi viết**. Ghi URL vào ledger.
  - Số liệu trong thẻ phải khớp nguồn.
- **Không dựng model Blender mới.** Nhà trú bão, ụ đất và chỗ rò nhiệt là khối thủ tục Babylon. Dùng lại `hls.glb` cho cảnh cất cánh.
- **Hiệu năng ≥ 30 FPS** (đo như Plan 3 Task 14). Không ray-march mỗi khung: hồ sơ chân trời của khe núi tính một lần và cache.
- **Không thêm dependency runtime.**
- Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không merge hay push.

## Review Focus

1. **Bão nổ ra khi người chơi đang ở xa căn cứ hoặc đang kéo tời ở Đồi Nắng.**
   - Đếm ngược phải đủ thời gian để về kịp từ rìa hố của Mica (khoảng 290 m, chạy 2,8 m/s mất khoảng 104 s).
   - Nếu không kịp: cứu hộ, tời và việc kéo Mica được reset hợp lệ, bão không nổ lần hai.
   - Test: `storm warning gives enough time to reach camp from MICA's rim` và `storm happens once and exposure triggers rescue` (Task 3).
2. **Kích hoạt Hồi 5 khi trạng thái chưa sạch:** đang có thoại, đang kéo Mica, đang mở panel, đang bị cứu hộ, hoặc chưa ghép xong ký ức. Hồi 5 chỉ bắt đầu khi đủ điều kiện, và chỉ một lần. Test: `act 5 starts only once, only when memory is restored and the player is in camp and idle` (Task 5).
3. **Người chơi bấm "Bắt đầu đêm" khi chưa xong việc chuẩn bị.** Điều kiện bắt buộc là đã chọn khe núi và đã lấy băng. Bịt rò nhiệt là tùy chọn, chỉ ảnh hưởng ngân sách. Lời nhắc phải nói còn thiếu gì. Test: `night cannot begin until notch chosen and ice sampled, and says what is missing` (Task 5).
4. **Thiếu năng lượng mà vẫn giữ Mica:** không chặn, không thua; tắt bớt thiết bị và mất một nhật ký. Đủ năng lượng thì không ép lựa chọn khó. Test: `keeping MICA with a deficit never blocks and costs one data log` (Task 8).
5. **Input trong lúc panel đang mở hoặc màn hình đang tối:** WASD không di chuyển người chơi, E/Q không kích hoạt tương tác phía sau panel, tài nguyên không bị trừ khi đang ở panel đêm. Test: `input lock blocks movement and world interactions while a story panel is open` (Task 4).

---

## File Structure

```
scripts/fetch-donki.mjs              — mới: tải sự kiện SEP từ DONKI → public/data/donki/sep.json
scripts/scout-act5.ts                — mới (đã có từ lúc lập plan): in các mốc sáng/tối và Trái Đất ở căn cứ
src/core/clock.ts                    — sửa: jumpTo, fastForwardTo
src/data/night.ts                    — findCampNight(): đêm thật ở căn cứ, bình minh, phương vị khe
src/data/donki.ts                    — parseSep, loadStormEvent (API → cache → null)
src/challenges/solarStorm.ts         — máy trạng thái bão (thuần) + createSolarStorm (nhà trú bão, HUD)
src/mica/memoryPuzzle.ts             — ảnh bóng đổ, kiểm tra thứ tự (thuần)
src/ui/memoryPuzzleView.ts           — panel ghép ảnh (phím 1–5)
src/ui/storyPanel.ts                 — khung panel chung + khóa input (dùng cho mọi panel Plan 4)
src/story/act5.ts                    — Act5Director (thuần): các giai đoạn Hồi 5 và Kết
src/story/act5System.ts              — nối Act5Director với thế giới (nhảy giờ, thoại, checklist)
src/story/sunriseNotch.ts            — hồ sơ chân trời, ứng viên khe núi, góc đỗ Pip (thuần)
src/ui/horizonView.ts                — panel khe núi: bóng đồi + đường đi của Mặt Trời
src/story/heatLeaks.ts               — chỗ rò nhiệt ở nhà trú bão, ụ đất của Pip
src/story/nightBudget.ts             — ngân sách năng lượng đêm (thuần)
src/ui/nightPlanner.ts               — panel ngân sách + lựa chọn của Mica + 4 lượt đêm
src/story/ending.ts                  — missionRecord() (thuần) + cảnh bình minh, gửi dữ liệu, cất cánh
src/ui/missionRecord.ts              — màn Hồ sơ nhiệm vụ + thẻ chuyện thật + câu kết
src/world/sky.ts                     — sửa: sao hiện dần trong bóng tối, ánh Trái Đất theo pha
src/pip/pip.ts, src/pip/brain.ts     — sửa: lệnh 'berm', parkYaw(), sleep()
src/mica/repairSystem.ts             — sửa: phát sự kiện bắt đầu kéo; mở câu đố ký ức sau khi tỉnh
src/challenges/darkCrater.ts         — sửa: cột sáng chỉ đường khi ký ức đã ghép (thay vì khi vừa tỉnh)
src/survival/survivalSystem.ts       — sửa: rescue(kind) công khai; paused
src/scenes/surfaceScene.ts, src/main.ts, src/demo/demoDirector.ts
tests/night.test.ts, donki.test.ts, storm.test.ts, memory.test.ts, storyPanel.test.ts, act5.test.ts,
      notch.test.ts, nightBudget.test.ts, ending.test.ts, sky.test.ts
```

---

### Task 1: Đêm thật ở căn cứ và đồng hồ nhảy giờ

**Files:**
- Create: `src/data/night.ts`, `tests/night.test.ts`
- Modify: `src/core/clock.ts`, `tests/clock.test.ts`
- Commit kèm: `scripts/scout-act5.ts`, `scripts/scout-notch.ts` (đã có)

**Interfaces:**
- Consumes: `isSunlit`, `earthVisible`, `horizonElevationDeg` (`src/world/lighting.ts`); `sampleAt` (`src/data/ephemeris.ts`); `MissionPlan` (`src/data/mission.ts`); `zone('base')`.
- Produces:
  - `interface CampNight { sunsetMs: number; dawnMs: number; dawnAzDeg: number; sunsetAzDeg: number; earthSetMs: number; hours: number }`
  - `findCampNight(e: Ephemeris, hm: Heightmap, at: {x:number; z:number}, fromMs: number, minHours = 48): CampNight | null`
    - Quét theo giờ từ `fromMs` để tìm khoảng tối liên tục đầu tiên dài ≥ `minHours` giờ tại `at`.
    - Mốc bắt đầu tối và mốc sáng lại được tinh chỉnh với bước 10 phút. `isSunlit` dùng mắt cao 0,5 m.
    - `earthSetMs` là lần đầu `earthVisible` = false sau `dawnMs`.
    - Không tìm thấy trong dữ liệu thì trả `null`.
  - `GameClock.jumpTo(ms: number): void`: chỉ đi tới; `ms` nhỏ hơn hiện tại thì bỏ qua.
  - `GameClock.fastForwardTo(ms: number, overRealS: number): void`: trong `overRealS` giây thực tới, `tick` tăng tốc tuyến tính sao cho tới đúng `ms`, rồi trở lại `timeScale`. Dùng để xem bóng quét qua căn cứ lúc hoàng hôn và bình minh.
  - `GameClock.fastForwarding: boolean` (getter).

- [ ] **Step 1: Viết test hỏng** trong `tests/night.test.ts` (dữ liệu thật qua `tests/helpers/realWorld.ts`):
  - `the first long camp night after the mission start is 29 Nov – 3 Dec 2028`:

    ```ts
    const n = findCampNight(e, hm, zone('base'), planMission(e).start + 7 * 24 * H)!;
    expect(n.sunsetMs).toBeGreaterThanOrEqual(Date.parse('2028-11-29T18:00Z'));
    expect(n.sunsetMs).toBeLessThanOrEqual(Date.parse('2028-11-29T21:00Z'));
    expect(n.dawnMs).toBeGreaterThanOrEqual(Date.parse('2028-12-03T09:00Z'));
    expect(n.dawnMs).toBeLessThanOrEqual(Date.parse('2028-12-03T12:00Z'));
    expect(n.dawnAzDeg).toBeGreaterThan(113); expect(n.dawnAzDeg).toBeLessThan(119);
    expect(n.hours).toBeGreaterThan(80); expect(n.hours).toBeLessThan(92);
    ```

  - `Earth stays in view at camp through the whole night and sets less than a day after dawn`: `earthVisible` đúng tại `sunsetMs`, giữa đêm và `dawnMs`; `earthSetMs − dawnMs` nằm trong khoảng (12 h, 24 h).
  - `returns null when no night that long exists in the data`: `minHours = 5000` → `null`.

  Trong `tests/clock.test.ts`:
  - `jumpTo only moves forward`
  - `fastForwardTo lands exactly on the target after overRealS and then runs at the normal scale`: tick 10 lần × 0,1 s với `overRealS = 1` → `nowMs === target`; tick thêm 1 s → `target + 20 000`.
- [ ] **Step 2:** `npx vitest run tests/night.test.ts tests/clock.test.ts`. Kỳ vọng: FAIL (chưa có `findCampNight`, `jumpTo`).
- [ ] **Step 3:** Cài đặt `findCampNight` và các phương thức của `GameClock`. Mỗi bước 10 phút gọi `isSunlit` (ray-march khoảng 280 bước); tổng cộng dưới 3 000 lần gọi là chấp nhận được.
- [ ] **Step 4:** `npx vitest run`. Kỳ vọng: toàn bộ PASS.
- [ ] **Step 5: Commit** `feat: find the real camp night (29 Nov–3 Dec 2028) and story clock jumps`

---

### Task 2: Dữ liệu bão Mặt Trời DONKI

**Files:**
- Create: `scripts/fetch-donki.mjs`, `public/data/donki/sep.json`, `public/data/donki/SOURCES.md`, `src/data/donki.ts`, `tests/donki.test.ts`, `tests/fixtures/donki-sep.json`

**Interfaces:**
- Produces:
  - `interface StormEvent { id: string; timeMs: number; instrument: string | null; link: string | null }`
  - `parseSep(json: unknown): StormEvent[]`
    - Chịu lỗi: bỏ phần tử thiếu `sepID` hoặc thiếu `eventTime`.
    - `instrument` lấy từ `instruments[0].displayName`.
    - Sắp xếp theo thời gian tăng dần.
  - `pickStorm(events: StormEvent[]): StormEvent | null`: sự kiện mới nhất.
  - `loadStormEvent(fetchFn = fetch, nowMs = Date.now()): Promise<{ event: StormEvent | null; source: 'live' | 'cache' | 'none' }>`
    - Live: `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=<now−59d>&endDate=<now>`, huỷ sau 4 s bằng `AbortController`.
      - Đây là địa chỉ mới của DONKI từ 30/09/2026. `api.nasa.gov/DONKI` và `kauai.ccmc…` đã chết (503 / timeout).
      - Không cần API key. Có `Access-Control-Allow-Origin: *`.
      - **Mỗi lần gọi tối đa 60 ngày** (lỗi 400 nếu dài hơn).
    - Lỗi hoặc rỗng thì đọc `${BASE_URL}data/donki/sep.json`. Ngày 07/11/2026, 60 ngày gần nhất có 0 sự kiện SEP, nên phần lớn thời gian game sẽ dùng bản lưu. Vẫn lỗi thì `{ event: null, source: 'none' }`.
  - `stormBlurb(ev: StormEvent | null): string`
    - Có sự kiện: `Based on a real solar energetic particle event recorded by NASA's DONKI on <D Month YYYY>` + ` (<instrument>)` nếu có.
    - `null`: câu chung `Based on the kind of solar particle events NASA tracks in its DONKI database`.

- [ ] **Step 1: Chạy `node scripts/fetch-donki.mjs`.**
  - Script gọi `https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP` theo từng khúc **≤ 60 ngày**, phủ từ 2024-01-01 tới 2025-12-31 (khoảng 13 lần gọi). Mỗi khúc thử 3 lần, timeout 60 s. Gộp kết quả và bỏ trùng theo `sepID`.
  - Ghi mảng JSON gốc vào `public/data/donki/sep.json`. Ghi URL, ngày tải và số sự kiện vào `SOURCES.md`.
  - Đã thử ngày 07/11/2026: khúc 05/2024 trả 200 kèm nhiều sự kiện thật. Ví dụ `2024-05-09T13:59Z`, instrument `MODEL: REleASE:ACE/EPAM 15.8-39.8 MeV`, link `https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30609/-1`.
  - Nếu máy chủ lỗi lúc làm: không bịa dữ liệu. Ghi `sep.json` = `[]`, ghi `Ruling` vào ledger, và thử lại ở Task 10.
- [ ] **Step 2: Viết test hỏng** `tests/donki.test.ts`. Fixture `tests/fixtures/donki-sep.json` gồm 3 phần tử theo định dạng DONKI SEP: `sepID`, `eventTime` dạng `"2024-05-11T02:15Z"`, `instruments: [{displayName}]`, `link`. Thêm 1 phần tử hỏng thiếu `eventTime`.
  - `parseSep keeps valid events sorted and drops broken ones`
  - `loadStormEvent falls back to the cache when the API fails, then to none`: dùng `fetchFn` giả lập. Lần 1 ném lỗi, cache trả fixture → `source 'cache'`. Cả hai lỗi → `source 'none'`.
  - `stormBlurb names the real date and never invents one`: `null` → không chứa chữ số.
- [ ] **Step 3:** `npx vitest run tests/donki.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 4:** Cài đặt `src/data/donki.ts`.
- [ ] **Step 5:** `npx vitest run` PASS.
- [ ] **Step 6: Commit** `feat: DONKI solar particle events (live API, cached fallback)`

---

### Task 3: Bão Mặt Trời khi đang kéo Mica về (v2 Cảnh 4.2)

**Files:**
- Create: `src/challenges/solarStorm.ts`, `tests/storm.test.ts`
- Modify:
  - `src/mica/repairSystem.ts`: `onTowStart: () => void`, gọi một lần khi Pip móc dây.
  - `src/survival/survivalSystem.ts`: `rescue(kind: 'o2' | 'heat' | 'pip' | 'storm')` công khai, dùng lại luồng mờ đen; `rescue_storm`.
  - `src/content/lines.en.ts`, `src/content/cards.en.json`, `src/scenes/surfaceScene.ts`, `src/world/zones.ts` (thêm `SHELTER_POS`).

**Interfaces:**
- Consumes: `loadStormEvent`, `stormBlurb` (T2); `zone('base')`, `HLS_POS`; `SurvivalSystem.onRescue` (Plan 3).
- Produces:
  - `type StormPhase = 'idle' | 'warning' | 'storm' | 'clear'`
  - `STORM = { warningS: 150, stormS: 45 }`: giây thực. 150 s × 20 = 50 phút sim, khớp thời gian báo trước thật của bão hạt là hàng chục phút.
  - `stormStep(phase: StormPhase, t: number, ev: 'start' | 'tick', sheltered: boolean, dt: number): { phase: StormPhase; t: number; exposed: boolean }`
    - Thuần. `'start'` chỉ có tác dụng khi `idle`.
    - Hết `warningS` mà chưa nấp thì `exposed = true` và chuyển sang `storm`.
    - Hết `stormS` thì `clear`. Từ `clear` không quay lại được.
  - `isSheltered(p: {x; z}): boolean`: trong 8 m quanh `SHELTER_POS` hoặc trong 30 m quanh `HLS_POS`.
  - `SHELTER_POS = add(BASE, 2, -18)` trong `zones.ts`: nhà trú bão bán cầu phủ regolith, đường kính 6 m, do Pip đắp trong 7 tháng. Nhà trú tồn tại ngay từ đầu game.
  - `createSolarStorm(scene, hm, sky, hud, dialogue, pip, survival, stormEvent): { start(): void; update(dt, player): string | null; readonly phase: StormPhase }`
    - Lời nhắc: `RADIATION STORM in 2:14 — get inside the regolith shelter at camp or the lander`.
    - `exposed` gọi `survival.rescue('storm')`. Dịch chuyển của cứu hộ về `zone('base')` đã ở trong nhà trú.
  - Thoại:

    | ID | Nội dung |
    |---|---|
    | `storm_warning` | Houston báo + câu của Pip: *"Let's go! Not that I'm scared. My circuits are just very precious."* + `stormBlurb` hiện dạng toast |
    | `storm_shelter` | Pip giải thích: hạt bay tới từ mọi hướng nên bóng tảng đá không che được; vài mét đất phủ thì che được |
    | `storm_clear` | Báo hết bão |
    | `rescue_storm` | Pip kéo người chơi về và giải thích |

  - Thẻ `lunarRadiation` (real): Chang'e 4 LND năm 2019 đo khoảng 1 369 µSv/ngày trên bề mặt, khoảng 2,6 lần liều của phi hành gia ISS. Nguồn: Zhang et al. 2020, *Science Advances* (kiểm chứng URL và con số).
  - Thẻ `regolithShield` (real): đất phủ làm lá chắn bức xạ. Nguồn NASA (kiểm chứng).

- [ ] **Step 1: Viết test hỏng** `tests/storm.test.ts`:
  - `storm warning gives enough time to reach camp from MICA's rim`: `STORM.warningS * LOPE_SPEED_MS >= 1.3 * dist(MICA_POS, SHELTER_POS)`.
  - `storm happens once and exposure triggers rescue`: chạy hết `warningS` mà không nấp → `exposed` đúng một lần. Sau `clear`, gửi `'start'` lần nữa → vẫn `clear`.
  - `sheltering before the countdown ends means no exposure`
  - `shelter sits inside camp and away from module sites`: `SHELTER_POS` cách tâm `zone('base')` ≤ 30 m và cách mọi `CRATES[].site` cùng `REPAIR_SPOT` ≥ 8 m.
  - `boulder shadow is not a shelter`: một điểm trong bóng tảng đá ở Bãi đá lăn → `isSheltered` false.
- [ ] **Step 2:** `npx vitest run tests/storm.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
  - Nhà trú: bán cầu dẹt màu regolith, có cửa vòm, có collider Havok tĩnh.
  - Bão bắt đầu 15 s sau `onTowStart`.
  - Trong pha `storm`, HUD hiện liều kế nhỏ.
  - Trong `?demo=1`, bão không xảy ra (demo tua nhanh phần sửa Mica).
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt** (`npm run dev`; đặt cờ và dịch chuyển qua `window.__world`): bắt đầu kéo Mica ở rìa hố → đếm ngược → chạy về nhà trú kịp. Lần thứ hai cố ý đứng ngoài → cứu hộ, Mica nằm lại chỗ đang kéo dở.
- [ ] **Step 6: Commit** `feat: DONKI-based radiation storm while towing MICA, regolith shelter at camp`

---

### Task 4: Khung panel truyện và khóa input

**Files:**
- Create: `src/ui/storyPanel.ts`, `tests/storyPanel.test.ts`
- Modify: `src/scenes/surfaceScene.ts`, `src/survival/survivalSystem.ts` (`paused: boolean`), `src/player/keyboard.ts` (nếu cần `consumeDigit()`)

**Interfaces:**
- Produces:
  - `class InputLock { push(reason: string): void; pop(reason: string): void; readonly locked: boolean }`: thuần. Nhiều lý do chồng nhau; chỉ mở khóa khi đã pop hết.
  - `sceneInputGate(lock: InputLock, input: MoveInput): MoveInput`: khi khóa trả input rỗng (không đi, không nhảy).
  - `createStoryPanel(ui: AdvancedDynamicTexture, lock: InputLock): StoryPanel`, với:

    ```ts
    interface StoryPanel {
      show(opts: { title: string; body?: string; options?: string[]; canvas?: HTMLCanvasElement; footer?: string }): void;
      hide(): void;
      readonly open: boolean;
      setBody(text: string): void;
      setCanvas(c: HTMLCanvasElement): void;
    }
    ```

    - Panel giữa màn hình, nền tối mờ.
    - `options` hiện dạng `1 — …`, `2 — …`.
    - `canvas` hiện bằng GUI `Image` (dùng `canvas.toDataURL()`).
    - `show` thì push khóa, `hide` thì pop.
  - `readDigit(keyboard: Keyboard, max: number): number | null`: đọc `Digit1..DigitN` và `Numpad1..N`, trả 1-based.
  - Trong scene, khi `lock.locked`:
    - `player.update` nhận input rỗng.
    - Không gọi `update` của module/repair/science/winch/flag/relay/dark/heatLeaks.
    - Không đọc Q/E/M/T/Tab.
    - `survival.paused = true`.
  - Màn mờ đen của cứu hộ cũng push khóa (`'rescue'`). Cách này sửa luôn một lỗi nhỏ còn để lại từ Plan 3.

- [ ] **Step 1: Viết test hỏng** `tests/storyPanel.test.ts`:
  - `input lock blocks movement and world interactions while a story panel is open`: kiểm `InputLock` chồng hai lý do, và `sceneInputGate` trả input rỗng.
  - `readDigit reads 1..max and ignores others`
  - `paused survival does not drain`: `SurvivalSystem` với `paused` bật → tài nguyên không đổi sau 10 s. Dùng bản thuần: tách `shouldStep(paused, rescuing)` để test.
- [ ] **Step 2:** `npx vitest run tests/storyPanel.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối vào scene.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `feat: story panel with input lock (also locks input during rescue fade)`

---

### Task 5: Ký ức của Mica (v2 Cảnh 4.5) và máy trạng thái Hồi 5

**Files:**
- Create: `src/mica/memoryPuzzle.ts`, `src/ui/memoryPuzzleView.ts`, `src/story/act5.ts`, `src/story/act5System.ts`, `tests/memory.test.ts`, `tests/act5.test.ts`
- Modify:
  - `src/mica/repairSystem.ts`: khi `stage === 'awake'` và chưa có cờ `act4:memory`, lời nhắc là `E — restore MICA's memory`.
  - `src/challenges/darkCrater.ts`: cột sáng và thoại `iceLines('micaWakes', …)` kích hoạt bởi `act4:memory` thay cho `act4:micaAwake`. Vì vậy test và thoại `mica_ice`/`mica_ice_done` nói sau khi ghép ký ức.
  - `src/content/lines.en.ts`, `src/content/cards.en.json`, `src/scenes/surfaceScene.ts`.

**Interfaces:**
- Consumes: `StoryPanel`, `InputLock`, `readDigit` (T4); `GameClock.jumpTo`, `findCampNight` (T1).
- Produces:
  - `SUN_AZ_RATE_DEG_PER_DAY = -12.19`: Mặt Trời trên trời cực nam dịch phương vị một vòng mỗi tháng giao hội (29,53 ngày). Dấu âm (phương vị giảm dần) được kiểm trên dữ liệu thật.
  - `interface MemoryPhoto { day: number; shadowAzDeg: number }`
  - `memoryPhotos(seed: number): { photos: MemoryPhoto[]; order: number[] }`
    - 5 ảnh, ngày 663, 665, 667, 669, 671.
    - Bóng đổ ngược hướng Mặt Trời: `shadowAz = sunAz0 + 180 + RATE·(day − 663)`. Mỗi ảnh cách nhau 24,4°.
    - Thứ tự hiển thị xáo trộn theo `seed`. Ảnh ngày 663 luôn được đánh dấu là "ảnh đầu tiên" để làm mốc.
  - `checkOrder(picked: number[], order: number[]): 'ok' | 'partial' | 'wrong'`
  - `drawMemoryPhoto(ctx: CanvasRenderingContext2D, p: MemoryPhoto, label: string): void`: ảnh nhìn từ trên xuống, có tảng đá tham chiếu, bóng dài, mũi tên chỉ hướng Trái Đất (hướng cố định) và nhãn số.
  - Panel ghép ảnh:
    - Bấm 1–5 theo thứ tự thời gian.
    - Sai 2 lần thì reset, và Pip gợi ý: *"Shadows point away from the Sun, and the Sun creeps around the horizon about 12° a day..."*
    - Đúng: cờ `act4:memory`, phát thoại `mica_logs` (6 dòng nhật ký v2.0, ngày 588–671, kết bằng *"...No Earth in the sky."*), rồi `mica_mission` (*"My mission is not complete…"* / Pip: *"Then there are three of us now!"*).
    - Thẻ `shadowClock` (real): Mặt Trời ở cực đi vòng quanh chân trời mỗi tháng nên bóng đổ là một cái đồng hồ. Nguồn NASA (kiểm chứng).
  - `type Act5Stage = 'waiting' | 'titleCard' | 'prep' | 'nightPlanner' | 'night' | 'dawn' | 'sendData' | 'farewell' | 'liftoff' | 'record'`
  - `class Act5Director`: thuần, không phụ thuộc Babylon.
    - `stage`
    - `canStart(s: { memory: boolean; inCamp: boolean; dialogueBusy: boolean; towing: boolean; locked: boolean }): boolean`
    - `next(ev: Act5Event): Act5Stage`, với `Act5Event = 'start' | 'titleDone' | 'beginNight' | 'plannerDone' | 'nightDone' | 'dawnDone' | 'dataSent' | 'boarded' | 'liftoffDone'`. Sự kiện không hợp lệ ở giai đoạn hiện tại thì bị bỏ qua.
    - `nightBlockers(s: { notchChosen: boolean; ice: boolean }): string[]`: trả các dòng còn thiếu, ví dụ `'Choose where the Sun will rise (horizon view at the shelter)'` và `'Sample the ice in the Dark Crater (follow MICA's beacon)'`.
  - `createAct5System(world, night: CampNight | null): { update(dt, player, keyboard): string | null }`
    - Khi `canStart`:
      - Màn đen với chữ `11 weeks later… · 29 November 2028`.
      - `clock.jumpTo(night.sunsetMs − 6 h)`.
      - Thoại `act5_news`: Houston báo Mặt Trời sẽ khuất sau ngọn đồi khoảng 3,6 ngày; Trái Đất vẫn ở trên trời nhưng pin dự trữ có hạn; *"From here on… you decide."*
      - HUD checklist qua `hud.setHint`.
    - Ở giai đoạn `prep`, đứng tại nhà trú bão có các lựa chọn:
      - `E — horizon view` (mở Task 6).
      - `Enter — begin the long night` (chỉ khi `nightBlockers` rỗng; nếu chưa thì lời nhắc liệt kê việc còn thiếu).
    - `beginNight`: `clock.fastForwardTo(max(now, night.sunsetMs + 20 min), 12)` để xem bóng nuốt căn cứ, rồi mở panel ngân sách (Task 8).
    - `night === null` (dữ liệu hỏng): bỏ bước nhảy giờ, vẫn chơi được, ghi `console.warn`.

- [ ] **Step 1: Viết test hỏng** `tests/memory.test.ts`:
  - `the Sun's azimuth decreases about 12.2° per day at the site`: trung bình `(az(t+24h) − az(t))` (chuẩn hóa về [−180, 180]) trên dữ liệu 2028 nằm trong [−12.6, −11.8].
  - `photos are 24.4° apart and the shuffled order solves the puzzle`
  - `checkOrder reports partial progress and wrong picks`
- [ ] **Step 2: Viết test hỏng** `tests/act5.test.ts`:
  - `act 5 starts only once, only when memory is restored and the player is in camp and idle`: liệt kê từng điều kiện thiếu → false. Sau `start`, `canStart` → false.
  - `stages advance only on their own event`: ví dụ `'dataSent'` ở `prep` bị bỏ qua.
  - `night cannot begin until notch chosen and ice sampled, and says what is missing`
- [ ] **Step 3:** `npx vitest run tests/memory.test.ts tests/act5.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 4:** Cài đặt `memoryPuzzle`, panel, `Act5Director` và `act5System` (chưa có khe núi và ngân sách; hai panel đó để stub gọi `next`).
- [ ] **Step 5:** `npx vitest run` PASS. Sửa `tests/finalReviewFixes3.test.ts` nếu `iceLines` đổi ý nghĩa (không đổi tên hàm).
- [ ] **Step 6: Kiểm tra trong trình duyệt:** sửa xong Mica → E → ghép ảnh → nhật ký → cột sáng ở Hố tối → về căn cứ → màn "11 weeks later" → giờ trên HUD là 29/11 khoảng 14:00Z.
- [ ] **Step 7: Commit** `feat: MICA memory puzzle by shadow direction, Act 5 director and the 11-week jump`

---

### Task 6: Khe núi Mặt Trời mọc (v2 Cảnh 5.2 câu đố 3)

**Files:**
- Create: `src/story/sunriseNotch.ts`, `src/ui/horizonView.ts`, `tests/notch.test.ts`
- Modify: `src/pip/pip.ts` (`parkYaw(yaw: number)`: ở chế độ `wait` thì xoay thân tới góc đó), `src/mica/mica.ts` (dùng `root.rotation.y`), `src/story/act5System.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `CampNight` (T1), `horizonElevationDeg`, `panelFactor` (`src/survival/resources.ts`), `StoryPanel` (T4).
- Produces:
  - `horizonProfile(hm, at, fromAz = 85, toAz = 175, stepDeg = 1): { az: number; el: number }[]`: mắt cao 0,5 m; tính một lần.
  - `sunPath(e: Ephemeris, night: CampNight, stepH = 6): { t: number; az: number; el: number }[]`: từ `sunsetMs − 12 h` tới `dawnMs + 12 h`.
  - `notchCandidates(profile, night): { azDeg: number[]; correct: number }`
    - Đúng 4 ứng viên, sắp xếp theo phương vị giảm dần (như thứ tự Mặt Trời đi qua).
    - Gồm: chỗ Mặt Trời lặn (`sunsetAzDeg`); đỉnh đồi (phương vị có `el` lớn nhất giữa chỗ lặn và chỗ mọc); khe đúng (`dawnAzDeg`); chỗ trũng sâu nhất trong `profile` ở phía phương vị nhỏ hơn khe đúng.
    - `correct` là chỉ số của `dawnAzDeg`.
  - `parkYawForSunAz(azDeg: number): number`: góc thân để một tấm pin bên hông của Pip quay thẳng về `azDeg`, tức `panelFactor(yaw, azDeg) ≈ 1`.
  - `drawHorizon(ctx, profile, path, candidates, labels)`
    - Bóng đồi màu xám trên nền đen.
    - Các điểm Mặt Trời theo từng mốc 6 giờ: tròn đặc khi trên chân trời, rỗng khi bị đồi che.
    - Nhãn A–D ở các ứng viên; trục phương vị có chia độ.
    - Phần sau thời điểm hiện tại thì ẩn: người chơi chỉ thấy đường đi tới lúc này, cộng một mũi tên chỉ hướng đi *"≈12°/day"*.
  - Panel: `1–4` chọn khe → cờ `act5:notch:<i>`, `act5:notchChosen`, và `act5:notchCorrect` nếu đúng.
    - Pip `parkYaw(parkYawForSunAz(az))` ở `mode = 'wait'` cạnh nhà trú; Mica xoay theo.
    - Thoại `notch_pick`. **Không** tiết lộ đúng hay sai trước bình minh.
  - Thẻ `peaksOfLight` (real): đỉnh và khe ở cực nam được chiếu sáng gần như liên tục; các bản đồ chiếu sáng LOLA được dùng để chọn bãi đáp Artemis. Nguồn NASA (kiểm chứng).

- [ ] **Step 1: Viết test hỏng** `tests/notch.test.ts` (dữ liệu thật):
  - `the correct notch is where the Sun really comes back (~116°)`: `candidates.azDeg[candidates.correct]` lệch `night.dawnAzDeg` ≤ 2° và nằm trong (113, 119).
  - `the candidates include the sunset point and the hilltop as tempting wrong answers`: có một ứng viên trong ±3° quanh `sunsetAzDeg`; có một ứng viên là đỉnh đồi trong (128, 142).
  - `four distinct candidates at least 8° apart`
  - `parking yaw points a side panel straight at the notch`: với az ∈ {0, 116, 250}, `panelFactor(parkYawForSunAz(az), az) > 0.999`.
- [ ] **Step 2:** `npx vitest run tests/notch.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt. `horizonView` vẽ lên canvas 720×300 và đưa vào `StoryPanel.setCanvas`.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt:** panel hiện đúng bóng đồi, 4 nhãn; sau khi chọn, Pip xoay thân.
- [ ] **Step 6: Commit** `feat: sunrise notch puzzle from real LOLA horizon and JPL Sun path`

---

### Task 7: Bịt chỗ rò nhiệt bằng ụ đất (v2 Cảnh 5.2 việc 2)

**Files:**
- Create: `src/story/heatLeaks.ts`, thêm test vào `tests/nightBudget.test.ts` (tạo mới)
- Modify: `src/pip/pip.ts` + `src/pip/brain.ts` (`PipCommand` thêm `'berm'`: tư thế `reach` 1 500 ms), `src/ui/thermalView.ts` (chỗ rò hiện như đốm nóng chỉ khi bật mắt nhiệt), `src/story/act5System.ts`, `src/content/lines.en.ts`

**Interfaces:**
- Consumes: `SHELTER_POS` (T3), `thermal.on`, `pip.contextCommand`, `InputLock` (T4).
- Produces:
  - `HEAT_LEAKS: { id: 'door' | 'vent' | 'cable'; x: number; z: number }[]`: 3 điểm trên vỏ nhà trú, cách `SHELTER_POS` 3,2 m ở phương vị 0°, 140° và 230°.
  - `createHeatLeaks(scene, hm, state, pip, dialogue, hud, thermal): { update(player): string | null; readonly fixed: number }`
    - Chỉ hoạt động ở giai đoạn `prep` của Hồi 5.
    - Đứng cách một chỗ rò ≤ 2,5 m mà mắt nhiệt tắt: `T — thermal view: find where heat escapes`.
    - Khi mắt nhiệt đang bật:
      - Pip ở xa: `Pip needs to be next to you`.
      - Pip cách ≤ 4 m: `Q — "Pip, pile regolith on that leak!"` (context `'berm'`).
    - Ra lệnh thì Pip tạo một ụ đất (nón thấp, bán kính 0,8 m, màu regolith) và đặt cờ `act5:leak:<id>`.
    - Thoại `leak_fixed`: đất bụi dẫn nhiệt rất kém, giống chăn.
  - Đốm rò trong mắt nhiệt: quả cầu phát sáng màu cam kèm vệt hạt nhỏ bốc lên trời đen. Đúng vật lý: nhiệt thoát ra bằng **bức xạ**, không phải khói. Đốm biến mất khi bịt xong.

- [ ] **Step 1: Viết test hỏng:**
  - `the three leaks sit on the shelter shell, at least 3 m from each other`
  - `leak count reads back from flags`: hàm thuần `leaksFixed(flags)`.
- [ ] **Step 2:** `npx vitest run tests/nightBudget.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt:** bật T thấy 3 đốm cam; Q thì Pip đắp ụ, đốm tắt.
- [ ] **Step 6: Commit** `feat: find heat leaks with thermal view, Pip piles regolith berms`

---

### Task 8: Ngân sách năng lượng đêm và lựa chọn của Mica (v2 Cảnh 5.2 việc 1, 5.3, 5.5)

**Files:**
- Create: `src/story/nightBudget.ts`, `src/ui/nightPlanner.ts`
- Modify: `tests/nightBudget.test.ts`, `src/pip/pip.ts` (`sleep(on: boolean)`: mặt `sleep`, tắt đèn, không bám theo người chơi), `src/story/act5System.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `leaksFixed` (T7), `CampNight.hours` (T1), `StoryPanel` (T4).
- Produces:
  - Bảng tiêu thụ, đơn vị % pin dự trữ mỗi ngày đêm:

    ```ts
    export const NIGHT = { capacity: 100, shelterHeat: 15, perLeakSaved: 3, pipWarm: 6, micaWarm: 5, lights: 3, comms: 4 };
    ```

  - `nightDays(hours: number): number = Math.ceil(hours / 24)`: cho đêm thật là 4.
  - `interface NightPlan { lights: boolean; comms: boolean; mica: boolean }`
  - `budget(plan: NightPlan, leaks: number, days: number): { need: number; enough: boolean }`
    - `need = days × (shelterHeat − perLeakSaved·leaks + pipWarm + (mica ? micaWarm : 0) + (lights ? lights : 0) + (comms ? comms : 0))`.
    - `enough = need <= capacity`.
  - `resolveNight(plan, leaks, days): { plan: NightPlan; dataLost: boolean }`
    - Nếu thiếu: tắt `lights`, rồi `comms`.
    - Vẫn thiếu mà `mica` bật thì giữ Mica và `dataLost = true` (tắt tủ lạnh mẫu khoa học, mất một nhật ký dữ liệu).
    - Không bao giờ tự tắt Mica.
  - Panel ngân sách:
    - Hiện thanh `need / capacity` và các dòng tiêu thụ.
    - `1` bật/tắt đèn, `2` bật/tắt liên lạc (*"Earth stays up, but every watt counts. Houston will understand."*).
    - `Enter` để xác nhận.
  - Sau khi xác nhận, theo `budget`:
    - Không đủ khi Mica bật: thoại `mica_offer` (*"Analysis: energy insufficient for three. I am an old robot. Proposal: shut me down to save energy for you."* / Pip: *"No. No, no, no."*), rồi lựa chọn:
      - `1 — Keep MICA warm, we'll make it work`
      - `2 — Let MICA sleep until dawn`
    - Đủ: thoại `mica_enough` (*"Analysis: energy sufficient for three. …Unexpected. Thank you."*). Không có lựa chọn.
  - Cờ: `act5:keptMica` hoặc `act5:micaSlept`; `act5:commsOff`; `act5:lightsOff`; `act5:dataLost`.
  - 4 lượt đêm, mỗi lượt khoảng 8 s:
    - Panel hiện `Night day N/4`, pin còn lại giảm dần, nhiệt độ ngoài trời khoảng −200 °C.
    - Lượt 1: thoại `pip_sleep_fear` (v2.0 5.3: *"I have to hibernate… But MICA slept too. Almost two years."* / Mica: *"Confirmed. I slept once. Not recommended."* / Pip: *"MICA!"* / Mica: *"…That was a joke. I am learning."*), rồi `pip.sleep(true)`.
    - Lượt 2–3: một câu ngắn mỗi lượt (sao hiện rõ, Trái Đất là lưỡi liềm mỏng).
    - Lượt 4: *"The ridge glows…"*
    - Trong đêm, đồng hồ nhảy giờ thật theo từng lượt: `jumpTo(sunsetMs + k·hours/4)`.
  - Thẻ `lunarNight` (real): các tàu đổ bộ thật phải "ngủ" qua đêm Mặt Trăng (ví dụ SLIM của JAXA sống sót qua nhiều đêm năm 2024). Nguồn chính thức (kiểm chứng).

- [ ] **Step 1: Viết test hỏng** (thêm vào `tests/nightBudget.test.ts`):
  - `the real night is 4 night-days`: `nightDays(findCampNight(...).hours) === 4` (dữ liệu thật).
  - `with no leaks fixed, keeping everyone warm is not enough even with lights and comms off`: `budget({lights:false, comms:false, mica:true}, 0, 4).enough === false`.
  - `fixing all three leaks keeps all three robots warm with lights and comms on`: `budget({lights:true, comms:true, mica:true}, 3, 4).enough === true`.
  - `keeping MICA with a deficit never blocks and costs one data log`: `resolveNight` với 0 rò → `plan.mica === true`, `dataLost === true`, `lights === false`, `comms === false`.
  - `letting MICA sleep removes the deficit when one leak is fixed`
- [ ] **Step 2:** `npx vitest run tests/nightBudget.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt và nối `beginNight → nightPlanner → night → 'nightDone'`.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Commit** `feat: night energy budget, MICA's choice and four night turns`

---

### Task 9: Bình minh, gửi dữ liệu, chia tay, cất cánh và Hồ sơ nhiệm vụ (v2 K.1–K.5)

**Files:**
- Create: `src/story/ending.ts`, `src/ui/missionRecord.ts`, `tests/ending.test.ts`
- Modify: `src/world/sky.ts`, `tests/sky.test.ts` (mới), `src/story/act5System.ts`, `src/content/lines.en.ts`, `src/content/cards.en.json`

**Interfaces:**
- Consumes: `CampNight`, `GameClock.fastForwardTo` (T1); cờ từ T3, T5–T8; `pip.sleep`, `pip.wave()`; `mica.setAwake`; `DustSystem.burst`; `StoryPanel`.
- Produces:
  - **Bầu trời đêm** (`sky.ts`):
    - `earthPhase(sunDir: Vec3, earthDir: Vec3): number = (1 − cos θ) / 2`, với θ là góc giữa hướng Mặt Trời và hướng Trái Đất nhìn từ Mặt Trăng. Đầy khi θ = 180°.
    - Ánh Trái Đất: một `DirectionalLight` yếu từ hướng Trái Đất, `intensity = EARTHSHINE_FULL * earthPhase`, tắt khi Trái Đất dưới chân trời. Không đổ bóng.
    - Sao: `stars.visibility` tăng dần tới 1 sau khoảng 8 s người chơi ở trong bóng tối (dùng `survival.lastEnv.playerInSun`), giảm về 0 trong 1 s khi ra nắng.
    - Thẻ `earthshine` (real): ánh Trái Đất chiếu lên Mặt Trăng (*"ánh sáng tro"*, Leonardo da Vinci). Nguồn NASA (kiểm chứng).
  - **Bình minh** (giai đoạn `dawn`):
    - `jumpTo(night.dawnMs − 90 min)`, rồi `fastForwardTo(night.dawnMs + 20 min, 15)`.
    - Khi chỗ của Pip có nắng trở lại: `pip.sleep(false)` và thoại `dawn_pip`. Nếu `act5:notchCorrect` thì Pip bắt nắng ngay (*"…I just dreamed a really good joke. I forgot it. But it was great."*); nếu sai thì có câu Pip tỉnh chậm vì tấm pin quay lệch, sau đó người chơi tự xoay Pip được (Q `come`). Không bị phạt.
    - Thoại Mica: `dawn_mica_kept` (*"System: online. Second boot. Success rate: 100%. …Pip. This morning's joke: acceptable."*) hoặc `dawn_mica_slept` (khởi động lại lần hai).
  - **Gửi dữ liệu** (`sendData`):
    - Lời nhắc ở Mica: `E — send MICA's data to Houston (Earth sets in 20 h)`. Số giờ tính từ `night.earthSetMs − clock.nowMs`.
    - Nếu `act5:commsOff` thì trước đó cần `E — power the comms back on` ở anten căn cứ (đơn giản: cùng lời nhắc, hai bước).
    - Thoại `send_data` (Houston: *"…We got it. MICA's data. Almost two years… it finally made it home."*), có độ trễ radio sẵn có.
    - Cờ `ending:dataSent`.
  - **Chia tay và cất cánh** (`farewell`, `liftoff`):
    - Lời nhắc ở chân tàu đáp `HLS_POS`: `E — take the elevator back to Starship`.
    - Thoại `farewell` (K.3, 3 câu Pip/Mica).
    - Màn mờ, camera đặt cách tàu 120 m. Tàu bay lên với `a = 3 m/s²` trong 10 s. `dust.burst` mỗi 0,1 s ở chân tàu trong 3 s đầu, tốc độ 25 m/s. Bụi bay parabol, không có mây.
    - Pip `wave()`, mắt Mica nháy.
    - Sau đó `'liftoffDone'`.
  - **Hồ sơ nhiệm vụ** (`record`):
    - `missionRecord(state: GameState, totalCards: number): { lines: string[]; decisions: string[] }`: thuần.
      - `lines`: module x/4, mẫu x/6, nhật ký dữ liệu, thẻ x/tổng.
      - `decisions` theo cờ:
        - bão: `sheltered in time` / `rescued by Pip`;
        - khe núi: đúng / sai;
        - rò nhiệt: x/3;
        - Mica: kept / slept;
        - liên lạc tắt hay bật;
        - mất dữ liệu hay không;
        - cờ Artemis IV đã cắm hay chưa.
    - Panel cuối:
      - Hồ sơ.
      - 5 thẻ chuyện thật (K.5): Pragyan 2023, SLIM 2024, Odysseus 2024, EDS trên Blue Ghost 2025, Artemis (dòng thời gian **theo nguồn NASA hiện hành**, kiểm chứng; nếu Artemis IV không còn là 2028 thì viết đúng theo nguồn và ghi `Ruling`).
      - Câu kết: *"Dust, darkness and silence are still unsolved problems. Maybe you will be the one to solve them."*
      - `R — play again` (tải lại trang).
    - Chứng chỉ in được thuộc Plan 6.

- [ ] **Step 1: Viết test hỏng:**
  - `tests/sky.test.ts`:
    - `earthPhase is full when Earth is opposite the Sun and new when they line up`
    - `Earth is a thin crescent during the real camp night`: dùng hướng thật tại `sunsetMs` → `earthPhase < 0.15`. Lời thoại lượt 2–3 nói đúng điều này.
  - `tests/ending.test.ts`:
    - `mission record lists counts and every decision from flags`
    - `record works for a minimal run`: state rỗng → không ném lỗi, decisions có `not recorded` cho mục chưa làm.
    - `liftoff dust uses ballistic grains`: `burstVelocities` (Plan 2) với 25 m/s → mọi hạt có `vy > 0` và không có lực cản. Dùng lại hàm sẵn có, chỉ kiểm tham số.
- [ ] **Step 2:** `npx vitest run tests/sky.test.ts tests/ending.test.ts`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Cài đặt.
- [ ] **Step 4:** `npx vitest run` PASS.
- [ ] **Step 5: Kiểm tra trong trình duyệt** từ `?jump=act5` (Task 10): bình minh qua khe, gửi dữ liệu, cất cánh, Hồ sơ.
- [ ] **Step 6: Commit** `feat: dawn through the notch, MICA's data home before Earth sets, liftoff and mission record`

---

### Task 10: Lối tắt thử nghiệm, demo, nội dung và chơi trọn từ đầu tới cuối

**Files:**
- Modify: `src/main.ts`, `src/scenes/surfaceScene.ts`, `src/demo/demoDirector.ts` (`DEMO_HINTS.end`), `tests/demo.test.ts`, `tests/cards.test.ts`, `public/data/donki/*`
- Create: `docs/screens/plan4-*.png`

**Interfaces:**
- Produces:
  - `?jump=act4` và `?jump=act5`: **chỉ khi `import.meta.env.DEV`**.
    - `act4`: đặt cờ đã tìm Mica, dịch chuyển tới rìa hố.
    - `act5`: 4 module, 5 mẫu (chưa có băng), Mica tỉnh, đã ghép ký ức, Mica ở `REPAIR_SPOT`, người chơi ở căn cứ.
  - `DEMO_HINTS.end`: thêm câu *"…the full game continues with a radiation storm, MICA's memories and the long night."*
  - `tests/cards.test.ts`: thêm danh sách thẻ Plan 4: `lunarRadiation`, `regolithShield`, `shadowClock`, `peaksOfLight`, `lunarNight`, `earthshine`, cùng 5 thẻ chuyện thật `story_pragyan`, `story_slim`, `story_odysseus`, `story_eds`, `story_artemis`. Mỗi thẻ có https và `tag`.

- [ ] **Step 1: Viết test hỏng:**
  - Trong `tests/cards.test.ts`: `cards include the Plan 4 set with https sources`.
  - Trong `tests/demo.test.ts`: `demo end hint mentions the rest of the story`.
- [ ] **Step 2:** `npx vitest run tests/cards.test.ts tests/demo.test.ts`. Kỳ vọng: FAIL nếu Task 3–9 còn thiếu thẻ nào; viết bù cho đủ.
- [ ] **Step 3:** Cài đặt `?jump=`. Thử lại `node scripts/fetch-donki.mjs` nếu Task 2 phải dùng `[]`; ghi kết quả vào ledger.
- [ ] **Step 4:** `npx vitest run` và `npm run build`. Kỳ vọng: toàn bộ PASS, build OK.
- [ ] **Step 5: Đo FPS** ở 3 nơi: căn cứ lúc hoàng hôn (đang tua nhanh), trong đêm khi bật mắt nhiệt, cảnh cất cánh khi bụi nhiều nhất. Kỳ vọng: ≥ 30. Ghi vào ledger.
- [ ] **Step 6: Chơi trọn** từ `?jump=act4` tới Hồ sơ nhiệm vụ, hai lượt:
  - Lượt A: nấp bão kịp, bịt đủ 3 chỗ rò, chọn đúng khe.
  - Lượt B: bị bão bắt, không bịt chỗ rò, chọn sai khe, giữ Mica dù thiếu năng lượng.

  Cả hai lượt phải tới được Hồ sơ. Lỗi chặn tiến trình sửa ngay trong task này (TDD).

  Chụp ảnh: `plan4-storm.png`, `plan4-memory.png`, `plan4-notch.png`, `plan4-night.png`, `plan4-dawn.png`, `plan4-record.png`.
- [ ] **Step 7: Commit** `chore: plan 4 jump shortcuts, demo hint, content pass and full ending playthrough`
