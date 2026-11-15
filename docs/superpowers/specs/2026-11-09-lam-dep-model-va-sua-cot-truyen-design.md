# Thiết kế: Làm đẹp model, chuyển động, bụi, xe tự hành và sửa cốt truyện Pip / MICA

Ngày: 09/11/2026. Sự kiện NASA Space Apps diễn ra 14–15/11/2026, nên mọi thứ phải xong và ổn định trước 13/11.
Repo: `C:\Users\ADMIN\Downloads\NASA_Hackathon`. Game: Babylon.js 9 + Havok + Vite + TypeScript, chạy trên trình duyệt.

## 1. Ý định và lý do

Game "Pip & Mica: Bóng Dài Ở Cực Nam" đã chơi được từ đầu tới cuối (Plan 1–6a). Người dùng muốn hai việc trước buổi demo cho giám khảo:

1. **Hình ảnh và chuyển động phải chi tiết, chân thực** (lời người dùng: "có độ chi tiết, chân thực").
   - Hiện tại phi hành gia, tàu, Pip, MICA được ghép từ khối cơ bản (hộp, trụ, cầu, vát cạnh) trong `tools/blender/*.py`.
   - Chuyển động phi hành gia "chưa tự nhiên" khi đi bộ, chạy, nhảy và quay người.
   - Bụi là các hạt hình tam giác nhỏ.
2. **Cốt truyện cho đúng ý người dùng:** lúc đáp, người chơi và Pip chưa quen nhau và chưa từng liên lạc; Pip cũng không biết gì về MICA.

Thành công là khi giám khảo xem demo thấy phi hành gia đi lại như phim tư liệu Apollo, bụi bay đúng vật lý và đẹp, tàu trông như ảnh NASA, và câu chuyện gặp Pip / tìm MICA tự nhiên, cảm động.

## 2. Mục tiêu, ngoài phạm vi, điều cấm

**Mục tiêu**
- Phi hành gia: model chi tiết dựa trên **thư viện 3D của NASA**, có xương để cử động mịn, cùng chuyển động mới cho đi bộ, chạy, nhảy và quay người.
- Tàu Starship HLS và Orion: dựng lại chi tiết hơn **dựa trên ảnh NASA công bố**, vì NASA không có model chính thức.
- Pip và MICA: giữ hình dáng và tính cách, làm mịn và thêm chi tiết lấy cảm hứng từ ảnh rover thật của NASA (VIPER, Curiosity).
- Bụi: hạt mềm, có ánh sáng, bay đúng quỹ đạo không khí.
- Cốt truyện mới cho phần Pip (mục 4) và phần MICA (mục 5), cả tiếng Anh lẫn tiếng Việt.

**Ngoài phạm vi**
- Không dùng Mixamo, không mua model trả phí. Chuyển động làm bằng code.
- Không thêm hồi hay thử thách mới.
- Không đổi luật chơi, trừ ba thứ: cảnh gặp Pip, khoảnh khắc Pip lần đầu nói với Trái Đất (mục 4.4), và xe tự hành (mục 3.7).
- **Không đổi tốc độ đi bộ và chạy.** Người dùng thấy đi trên bản đồ vẫn còn chậm nên giữ nguyên 1,8 m/s; chuyển động phải đẹp ở đúng tốc độ này.
- Không làm demo 3 phút trong việc này.

**Điều cấm** (làm ra mà dính một trong các điều sau là thất bại, dù chạy được)
- FPS dưới 30 trên laptop thường ở các cảnh đã đo (quỹ đạo, bụi lúc đáp, tàu hàng, hoàng hôn, cất cánh).
- Phi hành gia trông ghê rợn hoặc gãy khớp: khớp xoay sai, tay chân xuyên qua người, chân trượt trên đất.
- Bụi thành mây lơ lửng. Trên Mặt Trăng không có không khí: bụi bay vòng cung rồi rơi ngay (spec v3 §5).
- Sai sự thật khoa học, hoặc dùng model không đúng giấy phép.
- Làm hỏng tự lưu / chơi tiếp, tiếng Việt, menu tạm dừng, hoặc hai lượt chơi A/B tới Hồ sơ nhiệm vụ.

## 3. Phần A: Làm đẹp model, chuyển động và bụi

Quyết định của người dùng: **dùng thư viện 3D của NASA**; chỗ nào NASA không có thì **tự dựng dựa trên ảnh NASA**.

### 3.1 Phi hành gia (ưu tiên 1)
- **Bộ đồ: AxEMU (bộ đồ Artemis), tự dựng từ ảnh** (quyết định người dùng 09/11).
  - Thư viện 3D của NASA chỉ có bộ đồ ISS (EMU) và đồ đời Apollo, không đúng với năm 2028, lại là một khối liền khó gắn xương.
  - Builder dựng AxEMU chi tiết trong Blender dựa trên ảnh NASA/Axiom công bố, và ghi URL ảnh tham khảo trong `public/models/SOURCES.md`.
- **Xương:** gắn xương ngay từ đầu, bằng script mới trong `tools/blender/` chạy qua Blender MCP. Tuyệt đối không mở hay lưu đè file Blender của người dùng.
  - Khớp tối thiểu: hông, gối, cổ chân, vai, khuỷu, cổ tay, cổ, lưng.
- **Hợp đồng model:** `src/models/manifest.ts` liệt kê tên node bắt buộc, và code `src/player/astronaut.ts` điều khiển các node đó. Builder có thể đổi sang điều khiển xương (skinned mesh), miễn là:
  - cập nhật manifest, test `tests/models.test.ts` và cơ chế dự phòng thân thay thế;
  - đèn mũ và hướng mặt vẫn đúng.
- **Chi tiết mong muốn:** ba lô PLSS, mũ với kính vàng, găng, ủng, nếp vải ở khớp, cờ và phù hiệu trên tay áo, đèn mũ. Vật liệu PBR có texture (vải trắng hơi xám, kim loại, cao su).

### 3.2 Chuyển động phi hành gia (ưu tiên 1)
Làm bằng code, bám theo phim tư liệu Apollo. Cơ sở khoa học:
- Phi hành gia Apollo hay nhảy cóc / nhảy chân sáo.
- Nghiên cứu NASA (De Witt): bộ đồ cứng là lý do lớn; chuyển từ đi sang chạy ở khoảng 5 km/h.
- Nhóm Minetti: nhảy chân sáo tiết kiệm sức ở trọng lực 1/6.

Yêu cầu:
- **Tốc độ giữ nguyên** (đi 1,8 m/s, Shift chạy nhanh hơn như hiện tại). Dáng đi phải hợp với tốc độ này.
- **Đi bộ:** nặng; chân tì đất thật (không trượt) bằng cách khoá vị trí bàn chân trong pha chạm đất; thân hơi đổ về trước; tay vung ít vì bộ đồ cứng. Ở 1,8 m/s nên có pha bay ngắn giữa các bước, kiểu "đi nhún" trên Mặt Trăng (Claude quyết).
- **Chạy (Shift):** nhảy chân sáo hoặc nhảy cóc kiểu Apollo, có pha bay dài giữa các bước theo trọng lực 1,62 m/s², hai chân đẩy gần như cùng lúc.
- **Nhảy (Space):** nhún lấy đà ngắn → bay vòng cung chậm (tư thế trên không thay đổi theo vận tốc dọc) → khuỵu gối hấp thụ khi chạm đất, mạnh hay nhẹ tuỳ vận tốc rơi.
- **Quay người:** xoay dần với tốc độ giới hạn, không xoay phắt; thân nghiêng nhẹ vào hướng rẽ; quay tại chỗ thì có bước chân nhỏ.
- **Đứng yên:** thở nhẹ, ba lô nhấp nhô rất nhẹ.
- Chuyển tiếp giữa các kiểu chuyển động phải mượt.
- Phần tính tư thế giữ là **hàm thuần có test** (như `src/player/gait.ts` hiện nay). Test gồm: bàn chân không trượt trong pha tì, giới hạn góc khớp, tốc độ xoay tối đa, độ cao nhún khi chạm đất tỉ lệ với vận tốc.

### 3.3 Bụi (ưu tiên 2)
- **Hạt:** bỏ hạt tam giác, thay bằng hạt tròn mềm. Hạt nhận ánh sáng Mặt Trời thấp (sáng phía có nắng, tối trong bóng) và có độ trong suốt giảm dần khi rơi.
- **Quỹ đạo:** giữ vật lý hiện có trong `src/fx/ballistic.ts` (bay vòng cung, g = 1,62, không cản không khí).
- **Các loại bụi:** bước chân hất bụi, bánh xe Pip tung bụi, nhảy và chạm đất, luồng phụt khi tàu đáp và cất cánh (tấm bụi toả ngang sát đất, bay rất xa), tàu chở hàng.
- Giữ giới hạn số hạt để đảm bảo FPS.

### 3.4 Starship HLS và Orion (ưu tiên 3 và 4)
- **Nguồn:** ảnh NASA công bố (ảnh minh hoạ HLS của NASA/SpaceX trên nasa.gov, ảnh Orion của NASA). Ghi URL ảnh tham khảo trong `public/models/SOURCES.md`.
- **HLS:** thân thép không gỉ có mối ghép tấm, dải cửa sổ, buồng thang máy, chân đáp, cụm động cơ đáp đặt cao trên thân, dải pin mặt trời quanh thân, cổng ghép nối. Đúng tỉ lệ khoảng 50 m × 9 m.
- **Orion:** module chở người hình nón có tấm chắn nhiệt, module phục vụ châu Âu (ESM) với 4 cánh pin xếp chữ X, động cơ chính. Đúng tỉ lệ thật so với HLS.
- Dùng cho: cảnh quỹ đạo `src/scenes/landingScene.ts` (hiện dựng bằng khối thủ tục trong code), bãi đáp và cất cánh trên bề mặt (`public/models/hls.glb`).

### 3.5 Pip và MICA (ưu tiên 5)
- Giữ hình dáng, tính cách, màn hình mặt của Pip, cùng hợp đồng node để code hoạt hình và các thử thách vẫn chạy.
- Làm mịn (bo cạnh, chia mặt), thêm chi tiết: dây cáp, ốc vít, vân lốp, tấm pin có vân cell, logo, vết bụi. MICA trông cũ, phủ bụi hơn.
- Cảm hứng từ ảnh VIPER và Curiosity của NASA.

### 3.7 Xe tự hành Mặt Trăng (LTV) (yêu cầu thêm của người dùng 09/11, đã duyệt)
- **Ngoài đời:** NASA có chương trình xe tự hành Mặt Trăng (Lunar Terrain Vehicle) cho Artemis. Xe hai chỗ, không mui, giống xe LRV của Apollo 15–17. Ngoài đời xe dự kiến dùng muộn hơn năm 2028; game ghi rõ chỗ đó là tưởng tượng.
- **Model:** dựng từ ảnh NASA về LTV và LRV (nếu thư viện 3D của NASA có LRV dùng được thì được phép tham khảo hoặc dùng).
- **Lúc đáp:** xe được chở trong tàu HLS. Sau khi đáp, xe được hạ xuống cạnh tàu, và Pip phụ giúp dỡ xe như việc làm chung đầu tiên sau khi quen nhau.
- **Lái xe:**
  - Đứng cạnh xe bấm **E** để lên/xuống.
  - **W/S** để ga/lùi, **A/D** để lái; camera theo xe.
  - Xe nảy theo trọng lực 1/6, dễ trượt bánh.
  - Bánh xe tung bụi thành hai vệt cong như phim Apollo.
- **Pip:** nhảy lên ngồi thùng sau xe khi người chơi lái, xuống khi người chơi xuống.
- **Giới hạn để không phá thử thách:** xe không leo được dốc quá gắt và không vào được Hố Tối, nên các thử thách cũ vẫn đi bộ (tời Đồi Nắng, lấy băng, trú bão, chỗ rò nhiệt…). Builder chọn ngưỡng dốc hợp lý, tham khảo giới hạn của LRV thật.
- **Hợp với hệ thống hiện có:** oxy và nhiệt vẫn tính khi lái; tự lưu phải nhớ vị trí xe (hoặc đặt xe về cạnh trại khi chơi tiếp, Claude quyết); có cả tiếng Anh lẫn tiếng Việt.
- **Thẻ kiến thức mới:** xe LRV thật của Apollo và chương trình LTV của Artemis, có nguồn NASA kiểm chứng.

### 3.6 Ràng buộc kỹ thuật cho phần A
- ≥ 30 FPS ở các cảnh đã đo. Kích thước từng GLB nên giữ dưới khoảng 5 MB, vì trang tải từ máy chủ dev hoặc mạng.
- Không thêm dependency runtime.
- Model mới đi qua pipeline sẵn có: script Blender trong `tools/blender/` xuất GLB ra `public/models/`, kiểm hợp đồng bằng `tests/models.test.ts`.
- Máy của người dùng hay thiếu bộ nhớ (server dev từng bị tắt). Builder chỉ bật server khi cần kiểm và tắt ngay sau đó.

## 4. Phần B: Cốt truyện mới của Pip (đã duyệt)

### 4.1 Pip là ai
- Pip là robot xây dựng, đi theo các chuyến tàu chở hàng lên trước 7 tháng để dựng trại.
- Pip chỉ có **bộ đàm tầm ngắn**, giống bộ đàm cầm tay, để làm việc với người ở gần. Pip không có đường liên lạc về Trái Đất, vì trạm chuyển tiếp do phi hành đoàn dựng sau (Hồi 2).
- Vì vậy chưa ai từng nói chuyện với Pip. Đó là chuyện bình thường của thiết bị, **không phải sự cố**: không có ăng-ten hỏng hay bụi phủ.

### 4.2 Trên quỹ đạo và lúc hạ cánh
- Bỏ câu Pip gọi bộ đàm trong cảnh quỹ đạo (`landing_pip`, M3). Không ai nhắc tới Pip trước khi gặp, để tạo bất ngờ.
- Mọi câu thoại của Pip trong cảnh quỹ đạo và pha đáp cuối (`landing_pip`, `land_start`, `land_ok`, `land_tipped`, `land_tooFast`, `land_noFuel`, `land_drift`, `land_suggest_auto`) chuyển cho Chỉ huy hoặc Houston, giữ nguyên nội dung khoa học (ví dụ chuyện Odysseus 2024).

### 4.3 Cảnh gặp Pip lần đầu (đã duyệt)
1. Tàu đáp, bụi lắng xuống. Một robot nhỏ **lấp ló sau thùng hàng** ở bãi đáp: nhìn, lùi lại, rồi tò mò nhích ra. Đây là hoạt hình mới của Pip.
2. Khi người chơi tới gần khoảng 20 m, bộ đàm trong mũ rè rè và bắt được giọng Pip đang lẩm bẩm với cánh tay tên "Tay":
   > "Tay ơi, thấy chưa? Một con tàu to đùng… Có nên chào không? Cậu chào trước đi."
   Pip không biết người chơi nghe được.
3. Lời nhắc **E — chào Pip**. Pip giật bắn: "Bạn… NGHE được mình à?! Bảy tháng rồi chưa ai trả lời mình cả!" Rồi vui sướng cuống cuồng.
4. Houston giải thích ngắn: "Đó là robot xây dựng đi theo tàu hàng. Bộ đàm của nó chỉ nói được ở gần, nên tới giờ mới có người nghe thấy nó."
5. Tiếp tục Hồi 1 như cũ (giải thích không có âm thanh, thí nghiệm búa và lông chim…).
   - Câu "xây trại cho bạn" trong `meetPip` đổi cho hợp: Pip xây theo bản vẽ, không biết ai sẽ tới.
   - Câu "mang chiếc lông chim 7 tháng" có thể giữ, vì Pip chờ một dịp đặc biệt.

### 4.4 Pip lần đầu nói chuyện với Trái Đất (Claude quyết, sau câu hỏi của reviewer)
- Houston liên lạc với phi hành gia qua bộ đàm của tàu đáp, nên ngay từ cảnh gặp, Houston đã nghe được Pip qua bộ đồ của người chơi.
- Khoảnh khắc "Pip lần đầu được nói thẳng với Trái Đất" đặt ở **cảnh dựng ăng-ten radio Hồi 1** (`commDelay`): Pip được tự mình nói với Houston, chờ 2,6 giây, và nghe Houston chào lại. Có một hai câu cảm động.
- Đặt ở đây vì game vốn có ăng-ten Hồi 1 và câu `upgrade_antenna`. Đặt ở trạm chuyển tiếp Hồi 2 sẽ mâu thuẫn với các cảnh đã có.

### 4.5 Hợp với hệ thống hiện có
- **Điều kiện kích hoạt:** cảnh gặp thay cho kích hoạt `meetPip` cũ (Pip trong vòng 6 m, ở `src/science/scienceSystem.ts`).
- **Demo `?demo=1`:** bước "Làm quen với Pip" phải chạy được với cảnh gặp mới, hoặc rút gọn.
- **Tự lưu / chơi tiếp:** cờ thoại của cảnh gặp phải được khôi phục để không phát lại.
- **Ngôn ngữ:** thoại mới có ở cả `lines.en.ts` và `lines.vi.ts`. Giọng Pip là "mình / bạn" (quyết định 09/11).

## 5. Phần B: MICA (đã duyệt)
- Pip **hoàn toàn không biết** MICA trước khi tìm thấy.
- **Vệt bánh lạ:** Pip nói kiểu "Đây không phải vệt bánh của mình. Bánh mình khác."
- **Tìm thấy MICA:**
  - Giữ khoảnh khắc im lặng.
  - Câu đầu tiên của Pip: "Một… robot khác? Ở đây sao?"
  - Houston nhận ra MICA là rover của một sứ mệnh cũ đã mất liên lạc nhiều năm. Đây là phần hư cấu, thẻ `micaFiction` vẫn ghi rõ.
- Mọi điều Pip biết về MICA đều học được cùng người chơi, qua nhật ký và câu đố ký ức.
- **Rà soát toàn bộ thoại** (cả hai ngôn ngữ): sửa mọi câu ngầm cho rằng Pip đã biết MICA trước đó. Ví dụ đã thấy: `tracksFound`, `micaFound`, câu "MICA found ice before it got stuck" chỉ được nói sau khi đã đọc nhật ký của MICA.

## 6. Ràng buộc chung
- Mọi chữ hiển thị mới có cả tiếng Anh và tiếng Việt (test i18n hiện có phải xanh).
- Không merge hay push khi chưa được người dùng cho phép. Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Tôn trọng các quyết định đã chốt: không có màn thua, mọi cảnh bỏ qua được, số liệu khoa học có nguồn.

## 7. Thứ tự (đã duyệt)
1. **Cốt truyện (phần B):** chủ yếu là thoại và một cảnh gặp, nhanh và ít rủi ro.
2. **Phi hành gia AxEMU và chuyển động.**
3. **Xe tự hành.**
4. **Bụi.**
5. **HLS, rồi Orion.**
6. **Pip và MICA.**

Nếu thiếu thời gian trước 13/11, cắt từ cuối danh sách lên.

Lý do: phần B và phi hành gia là thứ giám khảo thấy suốt demo; Pip và MICA đã có hình dáng ổn và nhiều hợp đồng code nhất.

## 8. Để lại cho builder
- Gắn xương phi hành gia bằng skinned mesh hay chia khúc cứng, miễn đạt yêu cầu ở 3.2 và không ghê rợn.
- Ngân sách đa giác, độ phân giải texture, cách dựng chi tiết trong Blender.
- Câu chữ chi tiết của thoại mới, theo giọng nhân vật đã chốt. Người dùng duyệt sau.
- Cách vẽ hạt bụi (sprite, instancing, shader), miễn đạt yêu cầu ở 3.3 và FPS.
