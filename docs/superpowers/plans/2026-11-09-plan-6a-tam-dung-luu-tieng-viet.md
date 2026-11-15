# Plan 6a: Tạm dừng, tự lưu, tiếng Việt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm ba thứ người chơi cần trước buổi demo:
- Menu tạm dừng / cài đặt (Esc).
- Tự lưu và "Chơi tiếp".
- Đổi ngôn ngữ English / Tiếng Việt cho toàn bộ chữ trong game.

**Architecture:**
- Luật là hàm thuần có test, như các plan trước.
- **Tiếng Việt:**
  - Chữ giao diện dùng `tr(englishText, vars)` kiểu gettext. Chuỗi tiếng Anh giữ nguyên trong code làm khoá; bảng `VI` ánh xạ sang tiếng Việt; `{name}` là chỗ thay biến.
  - Thoại có bản song song `lines.vi.ts` (cùng id, cùng số câu, cùng người nói).
  - Thẻ kiến thức có `cards.vi.json` (cùng id, tag, nguồn).
- **Menu tạm dừng:** lớp DOM phủ lên canvas. Khi tạm dừng, cảnh bề mặt bỏ qua toàn bộ phần cập nhật nhưng vẫn render.
- **Tự lưu:** ghi `GameState` (các Set) và giờ mô phỏng vào `localStorage`. Khi chơi tiếp, `world.restore(save)` dựng lại thế giới bằng các hàm tắt sẵn có (`forceInstall`, `fastForwardWake`…) cộng vài hàm `restore` mới.

**Tech Stack:** như Plan 5. Không thêm dependency.

**Quyết định của người dùng (09/11/2026):**
- Làm tạm dừng, tự lưu và cài đặt đổi sang tiếng Việt trước buổi demo.
- Ngôn ngữ: màn khởi đầu hỏi chọn ngôn ngữ ở lần mở đầu tiên, các lần sau nhớ lựa chọn và đổi được trong menu Esc.
- Xưng hô: Pip nói với người chơi là **"mình / bạn"**.

**Design (đã trình bày cho người dùng trong hội thoại 09/11):**
- **Menu Esc:** Tiếp tục · Ngôn ngữ · Nhạc bật/tắt + âm lượng · Bảng phím điều khiển · Chơi lại từ điểm lưu gần nhất.
  - Khi menu mở: đồng hồ, oxy, pin, Pip và bão đều đứng yên.
  - Esc giữ nghĩa cũ khi pha đáp cuối đang chạy (bỏ qua cảnh) và trong góc nhìn chân trời (đóng).
  - Trong cảnh quỹ đạo, Esc vẫn là bỏ qua cảnh.
- **Tự lưu:**
  - Lưu ở các cột mốc (đáp xong, lắp module, lấy mẫu, gửi nhật ký, tìm thấy Mica, sửa xong Mica, ký ức, bắt đầu Hồi 5, Hồ sơ) và mỗi 30 s.
  - Màn khởi đầu có mục "Chơi tiếp" khi đã có bản lưu.
  - Tải lại giữa Hồi 5 thì quay về đầu Hồi 5: xoá các cờ tiến độ `act5:*` / `ending:*` / `night`.
- **Tiếng Việt:**
  - Dịch toàn bộ: thoại, thẻ, chữ trên màn hình, màn khởi đầu, ngày tháng (`29 tháng 11 năm 2028`), hướng (`đông nam`), độ dài đêm.
  - Có test bảo đảm không sót.
  - Đổi ngôn ngữ thì chữ mới đổi ngay, không cần tải lại trang.

## Global Constraints

- Số liệu khoa học và URL nguồn trong `cards.vi.json` giống hệt bản tiếng Anh. Không thêm thông tin mới khi dịch.
- Giọng nhân vật:
  - **Pip:** "mình / bạn", vui, lém lỉnh.
  - **MICA:** robot cũ, câu ngắn, xưng "tôi", có các từ máy móc như "Phân tích:".
  - **Houston:** chuẩn liên lạc, "Artemis IV, Houston đây".
  - **Chỉ huy:** đồng nghiệp.
- Tên riêng giữ nguyên: Pip, MICA, Houston, Artemis IV, Starship, Orion, Apollo, VIPER, Shackleton.
- Ký hiệu phím giữ nguyên: `E —`, `Q —`, `Space`.
- `localStorage` luôn bọc try/catch; game phải chạy được khi không có `localStorage`.
- Không thêm dependency runtime. Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Không merge hay push.

## Review Focus

1. **Tạm dừng giữa các pha khoá input** (panel câu chuyện, cứu hộ, tua hoàng hôn, cất cánh): mở rồi đóng menu không được làm lệch bộ đếm `InputLock`, không bỏ lỡ hay lặp phím.
2. **Chơi tiếp từ bản lưu cũ, hỏng, hoặc lưu giữa sự kiện** (đang kéo tời, đang bão, đang đếm ngược tàu hàng, giữa Hồi 5): game vẫn vào được, không kẹt, không phát lại thoại lắp module.
3. **Chuỗi tiếng Anh nào còn sót** khi chơi bằng tiếng Việt, gồm chữ ghép từ biến như đếm ngược, giờ và hướng.
4. **Đổi ngôn ngữ giữa chừng** (đang có thoại, đang mở panel): không lỗi, phần chữ mới dùng ngôn ngữ mới.
5. **`localStorage` bị chặn** (cửa sổ riêng tư): game chạy bình thường, chỉ không lưu.

---

### Task 1: Menu tạm dừng / cài đặt

**Files:** Create `src/ui/pauseMenu.ts`, `src/core/pause.ts`, `tests/pause.test.ts`. Modify `src/scenes/surfaceScene.ts`, `src/audio/musicEngine.ts` (`setVolume`), `src/main.ts`.

- [ ] Test (thuần):
  - `escOpensPause({ descentActive, horizonOpen, lockedBy })` → false khi đang đáp cuối hoặc góc nhìn chân trời đang mở.
  - Volume được lưu và nạp an toàn khi storage hỏng.
- [ ] Cài đặt:
  - Lớp DOM có các mục (phím): Esc/Enter tiếp tục · L ngôn ngữ · B nhạc · −/+ âm lượng · R chơi lại từ điểm lưu.
  - Bảng phím điều khiển.
  - Cảnh bề mặt bỏ qua cập nhật khi tạm dừng; nhạc giảm nhỏ.
- [ ] Kiểm trong trình duyệt. Commit `feat: pause and settings menu (Esc)`.

### Task 2: Tự lưu và chơi tiếp

**Files:** Create `src/save/save.ts`, `tests/save.test.ts`. Modify `src/scenes/surfaceScene.ts` (`restore`, autosave), `src/main.ts` (Chơi tiếp), `src/science/scienceSystem.ts`, `src/challenges/flagPlant.ts`, `src/challenges/earthRelay.ts` (hàm `restore`).

- [ ] Test (thuần):
  - `serialize` / `deserialize` khứ hồi đầy đủ; JSON hỏng hoặc sai phiên bản → null.
  - `prepareRestore(save)` bỏ các cờ tiến độ Hồi 5 khi chưa có `ending:*`.
  - `shouldAutosave(prevFlags, flags)` đúng khi có cột mốc mới.
  - Storage hỏng → không ném lỗi.
- [ ] Cài đặt:
  - `world.restore(save)`, chạy im lặng (không phát thoại hay toast lắp module).
  - Người chơi đứng ở trại, hoặc ở bãi đáp nếu đang Hồi 1.
  - Màn khởi đầu có "Chơi tiếp"; menu có "Chơi lại từ điểm lưu".
- [ ] Kiểm trong trình duyệt: lưu ở Hồi 2, 4, 5 → tải lại → chơi tiếp. Commit `feat: autosave and continue`.

### Task 3: Hạ tầng tiếng Việt và chữ giao diện

**Files:** Create `src/i18n/i18n.ts`, `src/i18n/vi.ts`, `tests/i18n.test.ts`. Modify mọi file có chữ giao diện (khoảng 24 file), `src/story/timeText.ts`, `src/main.ts` (chọn ngôn ngữ ở màn khởi đầu).

- [ ] Test:
  - `tr` thay biến; thiếu bản dịch thì trả về tiếng Anh.
  - **Mọi lời gọi `tr('…')` / `tr(\`…\`)` trong `src/` đều có trong `VI`** (quét mã nguồn).
  - `compass` / `formatDay` / `daysText` có bản tiếng Việt.
- [ ] Cài đặt: bọc toàn bộ chữ giao diện bằng `tr`. Commit `feat: language setting and Vietnamese UI text`.

### Task 4: Thoại và thẻ kiến thức tiếng Việt

**Files:** Create `src/content/lines.vi.ts`, `src/content/cards.vi.json`. Modify `src/scenes/surfaceScene.ts`, `src/scenes/landingScene.ts`, `src/ui/dialogueBox.ts` (tên người nói), `tests/i18n.test.ts`.

- [ ] Test:
  - `lines.vi` có đúng các id, đúng số câu mỗi id, cùng người nói và mặt Pip như bản tiếng Anh.
  - `cards.vi` cùng id, tag và URL nguồn.
  - Không câu nào để trống.
- [ ] Cài đặt:
  - Đổi ngôn ngữ sẽ thay `script` và danh sách thẻ ngay tại chỗ.
  - Thoại Hồi 5 tính từ đêm thật có bản tiếng Việt.
- [ ] Commit `feat: Vietnamese dialogue and knowledge cards`.

### Task 5: Kiểm tra cuối

- [ ] `npx vitest run`, `npm run build`.
- [ ] Chơi bằng tiếng Việt: màn khởi đầu → quỹ đạo → đáp → Hồi 1 → tạm dừng → đổi ngôn ngữ → tải lại → chơi tiếp → `?jump=act5` tới Hồ sơ.
- [ ] Chụp ảnh `docs/screens/plan6a-*.jpg`.
- [ ] Review cuối toàn nhánh. Commit.
