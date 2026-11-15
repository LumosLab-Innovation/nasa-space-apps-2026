# PIP & MICA: BÓNG DÀI Ở CỰC NAM
### *(Pip & Mica: The Long Shadow)*
**Bản thiết kế game: kịch bản, cốt truyện, gameplay**
NASA Space Apps 2026, thử thách "Junior Astronaut Mission Trainer"
Phiên bản 2.0, ngày 06/11/2026

> Ký hiệu: **[Đã chốt]** là quyết định của tác giả. **[Claude đề xuất]** là đề xuất của Claude, tác giả có thể đổi.

---

## 0. Tóm tắt một trang

| Mục | Nội dung |
|---|---|
| **Một câu** | Em là phi hành gia Artemis IV đáp xuống cực Nam Mặt Trăng. Em cùng Pip, chú robot AI hay đùa, khám phá vùng đất lạ, thu mẫu, ghi số liệu và dựng căn cứ đầu tiên của loài người. Rồi em phát hiện một vệt bánh xe bí ẩn dẫn tới Mica, robot thám hiểm đã bị bụi Mặt Trăng "giết chết" từ trước. |
| **Thể loại** | **[Đã chốt]** Phiêu lưu khám phá **thế giới mở 3D**, có cốt truyện; hai nhân vật phối hợp (người chơi và robot AI đồng hành). |
| **Nền tảng** | **[Đã chốt]** 3D trên trình duyệt; các cảnh phim (kể cả hạ cánh) đều là 3D thời gian thực; mô phỏng sát thực tế. **[Claude đề xuất]** Engine Babylon.js (có sẵn vật lý Havok). |
| **Đồ họa** | **[Đã chốt]** Mô hình từ kho 3D của NASA, cộng thêm Pip, Mica và các mô hình còn thiếu dựng bằng Blender. |
| **Đối tượng** | *Giả định 8–14 tuổi, cần đối chiếu với đề chính thức.* |
| **Thời lượng** | Khoảng 40–60 phút cho toàn bộ; **lát cắt demo khoảng 3 phút** cho giám khảo. |
| **Vấn đề có thật làm lõi** | **Bụi Mặt Trăng** (hỏng pin, bộ tản nhiệt, đồ phi hành gia), **bóng tối ở cực**, **mất liên lạc khi Trái Đất lặn**. |
| **Thông điệp** | Những bài toán này vẫn chưa có lời giải trọn vẹn. Người giải chúng có thể là em. |

---

## 1. Ý đồ, mục tiêu, giới hạn

### 1.1 Vấn đề có thật
1. **Bụi Mặt Trăng:**
   - Hạt bụi sắc như thủy tinh vì không bị gió hay nước bào mòn, lại tích điện nên bám chặt vào mọi bề mặt.
   - Apollo 17: bụi gây "viêm mũi" cho phi hành gia, làm gãy chắn bùn xe tự hành (phải vá tạm bằng bản đồ và băng keo), và phủ lên bộ tản nhiệt khiến thiết bị quá nóng.
   - Tháng 3/2025, NASA mới thử thành công **tấm chắn bụi điện động (EDS)** trên tàu Blue Ghost.
2. **Bóng tối và giá lạnh:** Vikram và Pragyan (2023) cùng Odysseus (2024) không tỉnh lại sau khi mất nắng. SLIM (2024) bất ngờ sống sót.
3. **Cực Nam:**
   - Mặt Trời luôn sát chân trời (cao tối đa khoảng 1,5°), nên bóng đổ cực dài.
   - Có những hố **tối vĩnh viễn**, lạnh khoảng −240°C, chứa băng nước.
   - Trái Đất **lặn dưới chân trời theo chu kỳ khoảng 14 ngày**, gây mất liên lạc trực tiếp.

### 1.2 Mục tiêu
- Người chơi **cảm nhận vật lý bằng trải nghiệm**: trọng lực thấp, im lặng tuyệt đối, bóng dài, nóng và lạnh hai phía.
- Mỗi thử thách gắn với **một dữ kiện hoặc bộ dữ liệu NASA thật**.
- **Ấn tượng cảm xúc:** người chơi nhớ Pip, thương Mica, và hồi hộp chờ bình minh.

### 1.3 Không làm (non-goals)
- Không làm bản đồ khổng lồ. Thế giới mở **thu nhỏ nhưng dày đặc nội dung**.
- Không làm bảng quản lý tài nguyên khô khan.
- Không mô phỏng chính xác tuyệt đối: thời gian được nén, và mọi chỗ giả tưởng đều được đánh dấu.

### 1.4 Những điều coi là thất bại (anti-goals)
- Trẻ chơi xong mà không nhớ được kiến thức vật lý nào.
- Có thông tin khoa học sai nhưng không được ghi là giả tưởng.
- Quá u buồn hoặc đáng sợ: không có người chết, không có màn "thua" trừng phạt.
- Pip và Mica **sao chép** ngoại hình hoặc lời thoại của phim *Interstellar*. Phim chỉ là nguồn cảm hứng tính cách.
- Pip chỉ là "cái máy chỉ đường": Pip phải là **người bạn thật sự cần thiết** để vượt thử thách.

---

## 2. Bối cảnh

- **Thời gian:** đầu năm 2028, sứ mệnh **Artemis IV**, lần đầu tiên con người đi bộ trên Mặt Trăng kể từ năm 1972. *(Thật: tháng 2/2026, NASA đổi Artemis III thành nhiệm vụ thử nghiệm trên quỹ đạo Trái Đất; Artemis IV là lần đổ bộ đầu tiên, dự kiến năm 2028.)*
- **Địa điểm:** sườn núi gần **miệng hố Shackleton**, cực Nam Mặt Trăng.
- **Trước khi người chơi đến** *(giả tưởng có cơ sở)*:
  - Tàu chở hàng Starship của SpaceX đã thả các **thùng module căn cứ**.
  - Các thùng nằm rải rác, cách xa bãi dựng căn cứ. Lý do có thật: tàu hạ cánh phải đáp xa để **luồng phụt động cơ không bắn bụi và đá vụn vào căn cứ**.
  - Robot **Pip** đến cùng chuyến hàng, một mình dựng phần móng căn cứ suốt **7 tháng**.
- **Bí mật của vùng đất:** khoảng 2 năm trước, robot thám hiểm **Mica** của một sứ mệnh khác đã hạ cánh gần đây, rồi **mất liên lạc**. Không ai trên Trái Đất biết số phận của nó, và **Pip cũng không biết Mica tồn tại**.

---

## 3. Nhân vật

### 3.1 Người chơi: Phi hành gia Artemis IV
- Chuyên gia địa chất kiêm kỹ sư (tên và ngoại hình do người chơi đặt).
- **Nhiệm vụ chính thức:** hoàn thiện căn cứ, thu thập mẫu vật, ghi chép số liệu khoa học.

### 3.2 PIP: robot AI đồng hành **[Đã chốt: tính cách cố định, không chỉnh được]**
*Cảm hứng tính cách: TARS (hài hước, trung thành). Ngoại hình hoàn toàn khác TARS.*

- **Ngoại hình [Claude đề xuất]:**
  - Cao khoảng 1 m, đi bằng bánh xích, thân tròn như quả trứng, màu trắng có sọc cam.
  - **Màn hình mặt** hiển thị đôi mắt biểu cảm: vui, tò mò, lo lắng, buồn, ngủ.
  - **Một cánh tay robot** khỏe dùng để nâng và lắp ráp, một **đèn pha** trên đỉnh đầu.
  - Hai **cánh pin mặt trời** dựng đứng ở hai bên, gập lại được.
- **Tính cách:**
  - Hay đùa (thường là đùa dở), nói nhiều, tò mò, hơi tự tin quá mức.
  - Thích đặt tên cho mọi thứ: đặt tên cho từng tảng đá, gọi miệng hố là "cái bát của vũ trụ".
  - **Nỗi sợ thầm kín:** sợ cô đơn. 7 tháng một mình, Pip đã tự nói chuyện với… cánh tay của mình.
  - **Khi gặp chuyện nghiêm trọng, Pip im lặng.** Chính vì Pip luôn nói nhiều nên khoảnh khắc im lặng càng có sức nặng.
- **Năng lực, cũng là lý do người chơi cần Pip:**

| Năng lực | Dùng để |
|---|---|
| 🦾 Cánh tay khỏe | Nâng module, lật đá, kéo dây tời |
| 🔦 Đèn pha | Soi sáng trong bóng tối tuyệt đối |
| 🌡️ Camera nhiệt | Chia sẻ hình ảnh nhiệt lên kính mũ của người chơi ("Mắt nhiệt") |
| 📡 Máy quét LIDAR | Phát hiện mẫu vật, manh mối, vết bánh xe, đường đi an toàn |
| 🔋 Pin dự phòng | Sạc khẩn cấp cho bộ đồ phi hành gia |

- **Điểm yếu, cũng là lý do Pip cần người chơi:**
  - Không leo được dốc đứng.
  - Không làm được thao tác tinh tế như cầm ống lấy mẫu hay mở nắp nhỏ.
  - Pin mặt trời của Pip bị bụi phủ nhưng Pip **không tự lau được**.
  - Không tự quyết được những việc quan trọng.
- **Câu thoại tiêu biểu:**
  - *"Chào mừng đến Mặt Trăng! Tôi là Pip. Tôi đã ở đây 7 tháng, nói chuyện với cánh tay của mình. Nó không trả lời nhiều lắm."*
  - *"Trọng lực ở đây chỉ bằng 1/6. Tức là cân nặng của bạn giảm 6 lần, nhưng độ ngầu thì không đổi."*
  - *"Tôi phân tích được 12.000 loại đá. Còn cảm xúc thì… đang cập nhật."*

### 3.3 MICA: robot thám hiểm thế hệ cũ **[Đã chốt: mất liên lạc và hư hỏng vì bụi từ trước, không quen Pip]**
*Cảm hứng: KIPP (hỏng trước khi đoàn đến) và CASE (điềm đạm, coi trọng hiệu suất).*

- **Tên [Claude đề xuất]:** MICA, viết tắt của Mobile Instrumented Crater Analyzer.
- **Ngoại hình:** thân hộp vuông thấp, 6 bánh lưới kim loại, hai cánh pin phẳng kiểu cũ, sơn bạc đã ngả màu. Có một ống khoan nhỏ và một "mắt" camera tròn duy nhất.
- **Số phận:**
  - Mica đi thám hiểm rìa hố tối để tìm băng.
  - Bụi do chính bánh xe của nó tung lên, cộng với bụi tích điện ở ranh giới sáng và tối, **phủ dần lên pin mặt trời**. Không có công cụ làm sạch.
  - Năng lượng cạn dần, Mica kẹt lại ở rìa hố. Gần 2 năm chịu bức xạ làm bộ nhớ hỏng một phần.
  - Mica tắt máy đúng lúc **Trái Đất lặn**, nên dữ liệu cuối cùng không bao giờ được gửi về.
- **Tính cách khi được sửa:**
  - Điềm đạm, nói ngắn, toàn số liệu. Đối lập hoàn toàn với Pip.
  - Không hiểu câu đùa, nhưng dần dần… bắt đầu đùa theo kiểu của nó: khô khan, bất ngờ.
- **Câu thoại tiêu biểu:**
  - *"Hệ thống: khởi động lại. Ngày hiện tại: không xác định. Năng lượng: 6%. …Có người ở đây. Xác suất: không mong đợi."*
  - *"Pip. Bạn đã nói 214 từ trong 60 giây. Hiệu suất giao tiếp: thấp."*

### 3.4 Nhân vật chỉ có giọng
- **Chỉ huy Artemis IV** (đồng đội đổ bộ cùng): ở lại tàu Starship, hỗ trợ qua bộ đàm.
- **CAPCOM Houston:** chỉ liên lạc được khi Trái Đất ở trên chân trời. Mỗi câu trả lời **trễ khoảng 2,6 giây**.

---

## 4. Thế giới mở thu nhỏ **[Claude đề xuất cách bố trí]**

Một bản đồ 3D khoảng **1,5 × 1,5 km thu nhỏ theo tỉ lệ game**, đi bộ từ đầu này sang đầu kia khoảng 3 phút. Địa hình dựng từ **dữ liệu độ cao LOLA thật** của vùng quanh Shackleton, được cách điệu và nén lại.

| # | Khu vực | Đặc điểm | Hoạt động |
|---|---|---|---|
| 1 | **Bãi đáp** | Starship HLS đứng sừng sững cao khoảng 50 m; mặt đất bị luồng phụt thổi sạch bụi | Điểm xuất phát, điểm trở về cuối game |
| 2 | **Trại Shackleton** (căn cứ) | Sườn núi bằng phẳng, móng căn cứ Pip đã dựng | Trung tâm: lắp module, nghỉ ngơi, sửa Mica |
| 3 | **Đồi Pin** | Đỉnh cao nhất, có nắng nhiều nhất | Dựng tháp pin mặt trời; ngắm Trái Đất và chân trời |
| 4 | **Bãi Đá Cao Nguyên** | Đá trắng anorthosite, đá dăm kết, hạt thủy tinh | Thu mẫu vật |
| 5 | **Cánh Đồng Miệng Hố** | Hố đủ cỡ, có một hố mới toanh | Giải bí ẩn miệng hố; **nơi có vệt bánh xe của Mica** |
| 6 | **Rìa Hố Tối** | Bóng tối tuyệt đối, −240°C, có băng | Nơi tìm thấy Mica; cao trào lấy mẫu băng |

- **Các thùng module** nằm rải rác ở khu 1, 3, 4 và 5, kéo người chơi đi khắp bản đồ.
- **Kiểu "mở dần":** mọi khu đều đi tới được, nhưng Rìa Hố Tối quá tối và quá lạnh để vào sâu khi chưa có đèn của Pip và bộ sưởi nâng cấp.

---

## 5. Hệ thống gameplay

### 5.1 Vòng lặp chính
**Khám phá** (Pip đi theo, bình luận, quét) → **Tìm việc** (thùng module, mẫu vật, điểm đo số liệu, manh mối) → **Phối hợp vượt thử thách** → **Ghi vào Sổ tay Khoa học** → **Mở khóa thẻ kiến thức** → tiến độ căn cứ tăng.

### 5.2 Bảng nhiệm vụ từ Houston (làm theo thứ tự tùy ý)
- **Căn cứ (4 module):** Tháp pin dựng đứng · Bộ tản nhiệt · Module ở kèm buồng khóa bụi · Ăng-ten liên lạc
- **Mẫu vật (6 loại):** đá trắng anorthosite · đá dăm kết (breccia) · hạt thủy tinh va chạm · đất bề mặt · đá trong hố mới · *(ẩn)* đất chứa băng
- **Số liệu (5 bộ):** nhiệt độ chỗ nắng và chỗ bóng · độ dày lớp bụi · góc Mặt Trời và độ dài bóng · liều bức xạ · độ trễ liên lạc

### 5.3 Phối hợp hai nhân vật **[Đã chốt: hai bên phải phối hợp; Claude đề xuất các thử thách cụ thể]**

| Thử thách | Người chơi làm | Pip làm |
|---|---|---|
| Lắp module nặng hàng trăm kg (dù trọng lực thấp, **quán tính vẫn y nguyên**) | Căn chỉnh vị trí, siết khóa | Nâng và giữ |
| Thùng hàng đổ trên sườn dốc | Leo lên, cắm neo, nối dây | Kéo tời |
| Dốc quá đứng cho bánh xích | Cắm neo trên đỉnh dốc | Tự kéo mình lên theo dây |
| Vùng bóng tối | Đi trước, lấy mẫu | Soi đèn, theo sát |
| Tìm mẫu và manh mối | Nhặt mẫu, chụp ảnh, ghi chép | Quét LIDAR làm vật thể sáng lên |
| Pin của Pip phủ bụi | Lau bằng chổi hoặc EDS | Báo năng lượng tụt bằng biểu cảm |
| Bộ đồ sắp hết điện | Cắm cáp | Chia sẻ pin |
| Nóng và lạnh hai phía | Chọn hướng đứng, di chuyển | Bật mắt nhiệt cho người chơi xem |

- **Điều khiển Pip [Claude đề xuất]:**
  - Pip **tự đi theo** và tự tìm đường.
  - Khi gặp việc cần Pip, một nút ngữ cảnh hiện ra: "Pip, nâng!", "Pip, soi đèn!", "Pip, kéo!", "Pip, quét!".
  - Có một vòng lệnh nhanh để gọi Pip lại, bảo Pip đợi, hoặc đi tới một điểm.

### 5.4 Bụi
- **Nguồn bụi:** bước chân, bánh xích, luồng phụt tàu. **Không có gió**, nên bụi bay theo đường parabol rồi rơi ngay, không thành đám mây.
- **Tác hại:** giảm điện của pin, làm bộ tản nhiệt quá nóng, làm mờ kính mũ, kẹt khớp đồ phi hành gia.
- **Cách xử lý:** chổi (rẻ nhưng làm xước, giảm hiệu suất về lâu dài), **EDS** (mở khóa sau khi lắp module năng lượng; tốn điện), buồng khóa bụi.

### 5.5 Nhiệt và Mắt nhiệt
- **Mắt nhiệt** là ảnh nhiệt từ camera của Pip, chiếu lên kính mũ người chơi. Đây là một ví dụ của phối hợp: người chơi nhìn bằng "mắt" của Pip.
- **Nóng và lạnh hai phía:** đứng lâu một hướng thì mặt hướng nắng nóng lên, mặt trong bóng lạnh đi, và có cảnh báo.
- **Hai cách truyền nhiệt duy nhất:** bức xạ ra trời đen và dẫn nhiệt xuống đất. **Không có đối lưu.**

### 5.6 Đồng hồ Mặt Trời và Trái Đất
- **Mặt Trời đi vòng quanh chân trời**, khoảng 12° mỗi ngày Trái Đất. Bóng đổ quay chậm như kim đồng hồ.
- **Trái Đất gần như đứng yên** trên trời, chỉ nhấp nhô lên xuống, và có lúc lặn mất.
- Vị trí của cả hai được tính từ **dữ liệu thật của JPL Horizons** cho tọa độ bãi đáp.

### 5.7 Sổ tay Khoa học
Gồm các mục mẫu vật, số liệu và manh mối. Mỗi mục mở khóa **thẻ kiến thức** có ảnh NASA thật, nguồn dẫn, và nhãn **Thật / Giả tưởng**.

### 5.8 Không có màn "thua"
Khi thất bại, Pip giải thích chuyện gì đã xảy ra (có liên hệ với sự cố có thật nếu có) rồi cho thử lại.

### 5.9 Điều khiển (máy tính) [Claude đề xuất]
- WASD và chuột: di chuyển và xoay camera góc nhìn thứ ba.
- Space: nhảy (bật kiểu "thỏ" như phi hành gia Apollo).
- E: tương tác · Q: vòng lệnh cho Pip · T: mắt nhiệt · Tab: Sổ tay · M: bản đồ.

---

## 6. Kịch bản chi tiết

### MỞ ĐẦU: HẠ CÁNH (cảnh phim 3D xen tương tác)
Quy trình Apollo 11 được **chuyển thể sang kiến trúc Artemis thật**:

| Cảnh | Hình ảnh 3D | Tương tác / Thoại |
|---|---|---|
| **M1. Quỹ đạo** | Tàu Orion neo cùng Starship HLS trên quỹ đạo NRHO. Trái Đất nhỏ xíu phía xa | Chỉ huy: *"Artemis IV, chuẩn bị chuyển sang tàu đổ bộ."* Người chơi bay lơ lửng (không trọng lực) qua cửa nối |
| **M2. Tách tàu** | HLS tách khỏi Orion, hai tàu bay song song | Phi hành gia trên Orion: *"Tôi thấy tàu các bạn rồi, mọi thứ ổn. Chúc may mắn."* *(Gợi nhớ Michael Collins, Apollo 11)* |
| **M3. Hạ quỹ đạo** | Động cơ khai hỏa, bề mặt xám tiến lại gần | Pip (giọng qua bộ đàm từ mặt đất, lần đầu tiên): *"Xin chào tàu đổ bộ! Tôi là Pip, đã dọn sẵn bãi đáp. Gần như sạch. Gần như."* |
| **M4. Hãm tốc** | Tàu lao ở khoảng 6.000 km/h | **Tương tác 1:** giữ nút hãm tốc để vạch vận tốc nằm trong vùng xanh, quản lý nhiên liệu |
| **M5. Tiếp cận** | Bóng đổ dài che khuất địa hình | Còi báo **"QUÁ TẢI MÁY TÍNH"**, Houston (trễ 2,6 giây): *"…Vẫn đi tiếp!"* *(Gợi nhớ lỗi 1202.)* Bãi đáp tự động đầy đá tảng |
| **M6. Chạm đất** | Ở độ cao khoảng 30 m, **bụi bốc lên che kín camera** | **Tương tác 2:** lái bán thủ công theo đồng hồ độ cao và vận tốc. Cần vận tốc dưới 1 m/s và độ nghiêng nhỏ. Đèn **"CONTACT"**, tắt động cơ, nhiên liệu còn lại hiện theo giây |

- Nếu nghiêng quá: game dừng lại, kể chuyện tàu Odysseus bị lật năm 2024, rồi cho thử lại.
- **Chế độ hỗ trợ:** lái tự động cho trẻ nhỏ.
- **Kết cảnh:** im lặng, chỉ còn tiếng thở. Chữ trên màn hình: *"Biển Tĩnh Lặng, 1969… Cực Nam, 2028."*

### HỒI 1: BƯỚC CHÂN ĐẦU TIÊN (tuyến hướng dẫn, khoảng 8 phút)

**Cảnh 1.1, Thang máy.** Người chơi xuống bằng thang máy từ khoang tàu cao khoảng 50 m. Cửa mở ra và **toàn bộ âm thanh môi trường tắt**. Bầu trời đen kịt dù Mặt Trời đang chiếu. Trái Đất treo sát chân trời. **Không thấy sao**, vì mắt đang bị chói như camera chụp ban ngày.

**Cảnh 1.2, Gặp Pip.** Pip lao tới, bụi bắn thành hình vòng cung rồi rơi xuống ngay.
> **Pip:** "Người thật! Người thật đây rồi! Xin lỗi, tôi hơi xúc động. 7 tháng rồi tôi chỉ nói chuyện với cánh tay mình. Nó tên Tay. Tôi đặt đấy."
> **Pip:** "Bạn có nghe thấy gì không? Không à? Đúng rồi! Không có không khí thì không có âm thanh. Bạn chỉ nghe được tôi qua bộ đàm. Tôi biết, giọng tôi hay mà."

Từ đây **Pip đi theo người chơi**.

**Cảnh 1.3, Bước nhảy và thí nghiệm.** Hướng dẫn di chuyển với trọng lực 1/6, cách bật nhảy kiểu "thỏ".
- Pip đưa ra một chiếc lông chim: *"Tôi mang theo cái này 7 tháng, chờ đúng khoảnh khắc này."*
- Người chơi thả búa và lông chim: **cả hai rơi chạm đất cùng lúc**, sau khoảng 1,4 giây.
- Thẻ kiến thức: Apollo 15 (1971) và Galileo.

**Cảnh 1.4, Bóng dài.** Pip đứng cạnh một tảng đá cao 1 m.
> **Pip:** "Đố bạn bóng tảng đá này dài bao nhiêu? …38 mét! Mặt Trời ở đây chỉ nhô lên khỏi chân trời một chút xíu thôi."

Số liệu đầu tiên được ghi: góc Mặt Trời và độ dài bóng.

**Cảnh 1.5, Mẫu vật đầu tiên.** Pip quét LIDAR và một viên đá trắng sáng lên. Người chơi lấy mẫu **anorthosite** theo quy trình: chụp ảnh, ghi tọa độ, mô tả, cho vào túi.

**Cảnh 1.6, Liên lạc.** Người chơi dựng ăng-ten tạm, gọi Houston và **cảm nhận độ trễ**.
> **Houston:** "…Chào mừng đến Mặt Trăng, Artemis IV. Danh sách nhiệm vụ đã gửi. Lưu ý: Trái Đất sẽ lặn khỏi chân trời của bạn sau **[X] ngày**."

*(X tính từ dữ liệu JPL Horizons.)* Bảng nhiệm vụ mở ra và **thế giới mở bắt đầu**.

### HỒI 2: KHÁM PHÁ VÀ XÂY DỰNG (thế giới mở, khoảng 15–20 phút)
Người chơi tự do đi các khu 1–5 theo thứ tự tùy ý. Các sự kiện chính:

**2A. Tháp pin trên Đồi Pin.**
- Pin nằm ngang gần như không có điện. Người chơi xem **bản đồ chiếu sáng thật (dữ liệu LOLA)** để chọn đỉnh có nắng nhiều nhất.
- Pip nâng tháp lên, người chơi xoay tấm pin hướng theo Mặt Trời.
- Pip: *"Pin dựng đứng! Giống tôi, lúc nào cũng đứng thẳng trước khó khăn. Trừ lúc lên dốc."*

**2B. Bộ tản nhiệt.** Người chơi bật mắt nhiệt và thấy bộ tản nhiệt nóng rực khi quay về phía Mặt Trời. Phải xoay nó quay lưng lại với nắng, hướng ra trời đen.

**2C. Module ở và buồng khóa bụi.** Nhiệm vụ lắp ráp phối hợp nhiều bước, có thẻ kiến thức về bụi trong cabin Apollo.

**2D. Thùng hàng trên dốc.**
- Một thùng module nằm trên sườn dốc mà Pip không leo lên được. Người chơi leo lên, cắm neo, nối dây, Pip kéo tời.
- Bài học: **trọng lực thấp nhưng quán tính không đổi**. Thùng hàng nhẹ hơn nhưng vẫn khó dừng lại khi đang trượt.

**2E. Sự kiện bụi: tàu hàng hạ cánh** (xảy ra khi đã lắp 2 module).
- Houston báo một tàu hàng sắp đáp cách khoảng 2 km.
- Người chơi phải **che các tấm pin và đưa Pip nấp sau đá**. Luồng phụt bắn bụi và đá vụn bay rất xa vì không có không khí cản.
- Hậu quả: pin của Pip phủ bụi, Pip đi chậm và mắt lờ đờ. Người chơi phải lau cho Pip.
- **Mở khóa EDS.**

**2F. Bí ẩn miệng hố** (khu 5, nhiệm vụ tự chọn). Bốn manh mối:
1. Hình dạng và kích thước: hố nhỏ hình bát, hố lớn có đỉnh núi ở giữa.
2. Đếm hố để biết tuổi bề mặt.
3. Hố mới toanh, viền bụi còn sáng. *(Thật: tàu LRO đã phát hiện hơn 200 hố mới.)* Có sự kiện **chớp sáng va chạm** ở chân trời.
4. Hố tối vĩnh viễn: trục Mặt Trăng chỉ nghiêng khoảng 1,5°, đáy hố không bao giờ có nắng, thành "bẫy lạnh" giữ băng.

**2G. Ánh sáng chân trời** (sự kiện ngẫu nhiên ở ranh giới sáng và tối): một lớp sáng mờ lơ lửng sát mặt đất.
> **Pip:** "Bạn thấy không? Có thể là bụi tích điện bay lơ lửng. Các nhà khoa học vẫn đang cãi nhau về nó. Tôi đứng về phe… để tôi quan sát thêm."

### HỒI 3: VỆT BÁNH XE (bước ngoặt, khoảng 5 phút)

**Điều kiện kích hoạt [Claude đề xuất]:** đã lắp xong ít nhất 2 module và thu ít nhất 3 mẫu. Vệt bánh xe **luôn có sẵn** ở Cánh Đồng Miệng Hố, người chơi tinh mắt có thể tự thấy sớm. Nếu đủ điều kiện mà chưa thấy, khi người chơi đi gần, máy quét của Pip sẽ phát hiện.

**Cảnh 3.1, Phát hiện.**
> **Pip:** "Khoan. Vệt bánh xe. Sáu bánh, lưới kim loại… Không phải của tôi. Tôi đi bánh xích mà. Và… theo dữ liệu của tôi, không có robot nào khác ở đây cả."
> **Pip:** *(giọng nhỏ lại)* "Vết này đã cũ lắm rồi. Ở đây không có gió, nên dấu vết có thể nằm nguyên hàng triệu năm. Dấu giày Apollo bây giờ vẫn còn đấy."

**Cảnh 3.2, Lần theo.** Một đoạn khám phá có dẫn hướng: vệt bánh xe uốn lượn qua các hố, có chỗ dừng lại đào thử (dấu khoan nhỏ). **Câu chuyện được kể bằng môi trường:**
- Càng đi, vệt bánh xe càng ngoằn ngoèo, như thể cỗ máy đang yếu dần.
- Có chỗ nó quay vòng tại chỗ, như thể đang cố hướng tấm pin về phía Mặt Trời.
- Vệt dẫn về **Rìa Hố Tối**.

**Cảnh 3.3, Tìm thấy Mica.**
- Ở rìa hố, nửa thân trong nắng và nửa thân trong bóng tối, là một robot sáu bánh **phủ kín bụi xám**.
- Bật mắt nhiệt: **một bên khoảng 100°C, bên kia khoảng −150°C**.
- **Pip im lặng.** Lần đầu tiên từ đầu game, Pip không nói gì trong khoảng 5 giây. Màn hình mặt chỉ còn hai chấm nhỏ. Nhạc tắt, chỉ còn tiếng thở.
> **Pip:** *(rất khẽ)* "…Nó ở đây một mình. Lâu lắm rồi."
> **Pip:** "Mình không thể để nó ở lại đây. Đúng không?"

**Cảnh 3.4, Nhận dạng.** Người chơi lau bụi trên thân, đọc thấy chữ **"MICA"** và logo của một sứ mệnh năm 2026. Gọi Houston (nếu Trái Đất còn trên trời):
> **Houston:** "…MICA? Chúng tôi mất liên lạc với nó gần 2 năm trước. Không ai biết chuyện gì đã xảy ra."

### HỒI 4: ĐƯA MICA VỀ NHÀ (khoảng 8 phút)

**Cảnh 4.1, Giải cứu.**
- Bánh xe Mica kẹt đầy bụi, người chơi phải gỡ từng bánh.
- Pip móc dây kéo, người chơi đi trước dò đường **an toàn** bằng LIDAR, tránh dốc và đá.
- Ở đoạn dốc đứng, người chơi cắm neo để Pip kéo cả Mica lên.

**Cảnh 4.2, Bão Mặt Trời** (sự kiện lấy từ dữ liệu DONKI thật):
- Còi báo bức xạ vang lên, có đếm ngược.
- Người chơi phải về căn cứ hoặc nấp trong bóng những tảng đá lớn và ụ đất.
- Pip: *"Đi nhanh nào! Không phải tôi sợ đâu. Chỉ là mạch điện của tôi rất quý."*
- Thẻ kiến thức: bức xạ trên bề mặt Mặt Trăng **gấp khoảng 2,6 lần trên trạm ISS** (đo bởi Hằng Nga 4 năm 2019).

**Cảnh 4.3, Sửa Mica** (chuỗi câu đố phối hợp tại căn cứ):
1. Dùng **EDS** làm sạch pin mặt trời. Người chơi thấy rõ bụi "nhảy" khỏi bề mặt.
2. Pip dùng cánh tay mở nắp thân; người chơi tháo **bo mạch nhớ bị bức xạ phá hỏng** và thay bằng linh kiện dự phòng của căn cứ.
3. **Sưởi ấm pin từ từ**: sưởi nhanh quá sẽ hỏng (pin lithium không sạc được khi quá lạnh).

**Cảnh 4.4, Mica tỉnh dậy.** Con mắt camera tròn chớp chớp.
> **Mica:** "Hệ thống: khởi động lại. Ngày hiện tại: không xác định. Năng lượng: 6%. …Có người ở đây. Xác suất: không mong đợi."
> **Pip:** "XIN CHÀO! Tôi là Pip! Bạn tên Mica phải không? Tôi đã kéo bạn về đấy! Bạn nặng lắm, nhưng tôi không để bụng đâu!"
> **Mica:** "…Đơn vị Pip. Bạn đã nói 41 từ trong 8 giây. Hiệu suất giao tiếp: thấp."
> **Pip:** *(quay sang người chơi, thì thầm)* "Tôi nghĩ nó thích tôi."

**Cảnh 4.5, Ký ức của Mica** (câu đố ghép nhật ký): bộ nhớ hỏng thành nhiều mảnh. Người chơi **sắp xếp các ảnh Mica đã chụp theo thứ tự thời gian** dựa vào hướng và độ dài bóng, vì Mặt Trời đi vòng quanh chân trời. Đây là câu đố vật lý thuần túy. Nhật ký sau khi ghép:
> *"Ngày 588. Đến rìa hố tối. Bắt đầu tìm kiếm băng nước."*
> *"Ngày 612. Tín hiệu hydro rất mạnh dưới đáy hố. Khả năng có băng nước: cao."*
> *"Ngày 640. Pin mặt trời: 31% diện tích bị bụi che. Không có công cụ làm sạch."*
> *"Ngày 655. Lỗi bộ nhớ do bức xạ: tăng."*
> *"Ngày 671. Năng lượng 3%. Ưu tiên: gửi dữ liệu về Trái Đất."*
> *"…Không có Trái Đất trên bầu trời."*

> **Mica:** "Nhiệm vụ của tôi chưa hoàn thành. Dữ liệu chưa được gửi. Mẫu băng chưa được lấy."
> **Pip:** "Thì giờ có ba chúng ta mà!"

### HỒI 5: BÓNG DÀI (cao trào, khoảng 10 phút)

**Cảnh 5.1, Hai tin xấu cùng lúc.**
> **Houston:** "…Artemis IV, Trái Đất sắp lặn khỏi chân trời của bạn. Mất liên lạc khoảng 14 ngày. Và Mặt Trời sắp khuất sau dãy núi phía Bắc căn cứ. Các bạn sẽ ở trong bóng tối vài ngày. Từ giờ… các bạn tự quyết định."

Màn hình: Trái Đất từ từ chìm xuống chân trời. Tín hiệu mất.

*(Thời gian nén lại: mỗi "ngày" trong bóng tối là một lượt khoảng 1 phút.)*

**Cảnh 5.2, Chuẩn bị qua đêm.** Ba việc cùng lúc:
1. **Ngân sách năng lượng:** pin dự trữ có hạn, chia cho sưởi module ở, giữ ấm pin của Pip, giữ ấm pin cũ của Mica, và đèn.
2. **Bịt chỗ thất thoát nhiệt:** bật mắt nhiệt tìm chỗ nhiệt rò ra (những đốm cam bay lên trời đen). Pip đắp **ụ đất cách nhiệt**.
3. **Câu đố "Mặt Trời sẽ mọc ở đâu?":** Mặt Trời đi khoảng 12° mỗi ngày quanh chân trời. Người chơi tính và **xoay pin của Pip và Mica về đúng khe núi** nơi nắng sẽ ló ra đầu tiên.

**Cảnh 5.3, Pip sợ ngủ.**
> **Pip:** "Tôi phải ngủ đông để tiết kiệm pin. Nhưng… Mica cũng đã ngủ. Gần 2 năm."
> **Mica:** "Xác nhận. Tôi đã ngủ một lần. Không khuyến khích."
> **Pip:** "MICA!"
> **Mica:** "…Đó là một câu đùa. Tôi đang học."
> **Pip:** *(mắt cười)* "Bạn vừa đùa đấy à?! Tệ quá! Tôi thích lắm!"

**Cảnh 5.4, Vào Hố Tối** (cao trào hành động, trước khi Pip ngủ):
- Mica không đi được nữa nên **chỉ đường qua bộ đàm** từ căn cứ, dựa theo bản đồ trong ký ức của nó.
- Pip soi đèn, người chơi trèo xuống đáy hố. Lạnh khoảng −240°C; bộ sưởi đồ phi hành gia tụt nhanh nên phải đi đúng đường.
- Lấy **mẫu đất chứa băng**. Thẻ kiến thức: năm 2009, tàu LCROSS đo được khoảng **5,6% nước** trong đất hố Cabeus.
- Đây là thử thách **phối hợp cả ba**: Mica định hướng, Pip soi sáng, người chơi thực hiện.

**Cảnh 5.5, Lựa chọn của Mica.** Khi năng lượng cạn dần:
> **Mica:** "Phân tích: năng lượng không đủ cho cả ba. Tôi là robot cũ. Đề xuất: tắt tôi để giữ năng lượng cho các bạn."
> **Pip:** "Không. Không, không, không."

**Người chơi quyết định:**
- Nếu đã cách nhiệt tốt và tiết kiệm từ trước, sẽ **có đủ năng lượng để giữ cả ba**. Game thưởng cho sự hiểu biết.
- Nếu không đủ, người chơi vẫn chọn được cách giữ Mica, nhưng phải tắt bớt thiết bị khác, và một vài số liệu khoa học sẽ bị mất.
- **Game không phạt lòng tốt.**

### KẾT: BÌNH MINH (khoảng 5 phút)

**Cảnh K.1, Nắng về.** Một vệt nắng ló qua **đúng khe núi người chơi đã dự đoán**, rồi quét dần qua căn cứ. Pin của Pip bắt nắng ngay vì đã được làm sạch.
> **Pip:** *(mắt nhấp nháy, rồi sáng bừng)* "…Tôi vừa mơ thấy một câu đùa rất hay. Tôi quên mất rồi. Nhưng nó hay lắm."
> **Mica:** "Hệ thống: khởi động. Lần thứ hai. Tỷ lệ thành công: 100%. …Pip. Câu đùa sáng nay: chấp nhận được."

**Cảnh K.2, Trái Đất mọc.** Trái Đất nhô lên khỏi chân trời và tín hiệu trở lại. Người chơi gửi dữ liệu của Mica về Houston.
> **Houston:** "…Chúng tôi nhận được rồi. Dữ liệu của MICA. Gần 2 năm… cuối cùng nó cũng về đến nhà."

**Cảnh K.3, Chia tay.** Người chơi lên thang máy, trở về tàu Starship.
> **Pip:** "Bạn sẽ quay lại chứ? Tôi sẽ giữ căn cứ sạch sẽ. Gần như sạch."
> **Pip:** "Và lần này… tôi không ở một mình nữa."
> **Mica:** "Xác nhận. Tôi sẽ giám sát Pip. Hiệu suất giám sát dự kiến: thấp."

Tàu cất cánh, bụi tung lên. Dưới mặt đất, **hai robot nhỏ dần**: Pip vẫy cánh tay, Mica nháy con mắt camera.

**Cảnh K.4, Hồ sơ Nhiệm vụ:** mẫu vật, số liệu, và các quyết định của người chơi. Có **chứng chỉ Phi hành gia nhí** để in hoặc tải về.

**Cảnh K.5, Thẻ chuyện thật:** Pragyan 2023, SLIM 2024, Odysseus 2024, tấm chắn bụi EDS 2025, kế hoạch Artemis IV 2028.
> ***"Bụi, bóng tối và sự im lặng vẫn là những bài toán chưa có lời giải. Có thể người giải chúng là em."***

---

## 7. Mô phỏng thực tế: vật lý và hình ảnh

| Hiện tượng | Con số / Công thức | Thể hiện trong game |
|---|---|---|
| Trọng lực thấp | g = 1,62 m/s² | Vật lý Havok chỉnh g; nhảy cao, bước "thỏ" |
| Rơi trong chân không | t = √(2h/g), khoảng 1,4 giây từ độ cao 1,5 m | Búa và lông chim rơi cùng lúc |
| Quán tính không đổi | Khối lượng giữ nguyên, chỉ trọng lượng giảm | Thùng hàng trượt khó dừng |
| Bụi bay theo parabol | Không có lực cản không khí | Hạt bụi bay vòng cung rồi rơi, không có đám mây |
| Không có âm thanh | Âm thanh cần môi trường để truyền | Tắt âm thanh môi trường; chỉ còn bộ đàm, tiếng thở, và rung truyền qua tay khi chạm vật |
| Không tán xạ ánh sáng | Không có khí quyển | Trời đen giữa ban ngày; không có ánh sáng môi trường nên bóng đen tuyệt đối |
| Không thấy sao khi bị chói | Phơi sáng của mắt và camera | Sao chỉ hiện khi đứng lâu trong bóng tối |
| Mặt Trời thấp | Cao khoảng 1,5°: đá cao 1 m đổ bóng khoảng 38 m | Đổ bóng dài, pin phải dựng đứng |
| Trục nghiêng 1,5° | Đáy hố ở cực không có nắng | Hố tối vĩnh viễn, băng |
| Bức xạ nhiệt | Công suất tỏa nhiệt tỉ lệ T⁴; mặt hướng nắng khoảng 100°C | Mắt nhiệt, bộ tản nhiệt, nóng và lạnh hai phía |
| Dẫn nhiệt kém | Đất bụi cách nhiệt tốt | Ụ đất giữ ấm |
| Động năng va chạm | KE = ½mv²; 1 g ở 20 km/s bằng 200 kJ, khoảng 50 g thuốc nổ TNT | Chớp sáng va chạm, hố mới |
| Tĩnh điện | Bên sáng tích điện +, bên tối tích điện − | Bụi bám, ánh sáng chân trời, EDS |
| Định luật 3 Newton, phương trình tên lửa | Δv = vₑ·ln(m₀/m₁) | Hãm tốc và nhiên liệu khi hạ cánh |
| Vận tốc quỹ đạo | Khoảng 1,6 km/s | Đồng hồ vận tốc lúc hạ cánh |
| Tốc độ ánh sáng | Khoảng 1,28 giây mỗi chiều | Houston trả lời chậm |
| Khóa thủy triều | Trái Đất gần như đứng yên trên trời | Trái Đất nhấp nhô, lặn theo chu kỳ khoảng 14 ngày |

---

## 8. Dữ liệu và tài nguyên NASA

**Nguyên tắc:** tải **một lần**, lưu trong game để chạy được khi không có mạng. Riêng bão Mặt Trời thì thử gọi API trước, lỗi thì dùng bản đã lưu.

| Dữ liệu | Nguồn | Dùng trong game |
|---|---|---|
| Địa hình cực Nam | LOLA (LRO), mô hình độ cao trên kho PGDA của NASA Goddard | Dựng bản đồ thế giới mở |
| Địa hình quỹ đạo Biển Tĩnh Lặng | [NASA SVS LRO/LOLA](https://svs.gsfc.nasa.gov/4720/), bản đồ 64 điểm/độ, vùng 12–36° Đông và ±12° vĩ độ | Dựng địa hình 3D đúng tỷ lệ cao độ, vòng Apollo 11 theo địa hình. Lưới chi tiết khoảng 948 m; bản đồ pháp tuyến khoảng 474 m. Bóng địa hình tính sẵn theo Mặt Trời dàn dựng cao khoảng 20°; tàu có bóng động. Không phải tái dựng bãi đáp chính xác đến mét. |
| Bản đồ chiếu sáng và tầm nhìn Trái Đất | PGDA "Lunar Polar Illumination" | Câu đố Đồi Pin, hố tối, thời điểm mất liên lạc |
| Vân bề mặt | LROC, [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) và [NASA/JPL Moon Trek](https://trek.nasa.gov/moon/) | Ảnh toàn cầu và ảnh chi tiết Biển Tĩnh Lặng trong cảnh quỹ đạo |
| Ảnh Trái Đất | [Blue Marble, NASA SVS](https://svs.gsfc.nasa.gov/3615/) | Mây, đại dương và lục địa khi nhìn từ Mặt Trăng |
| Nhiệt độ | Diviner (LRO) | Giá trị nhiệt độ từng vùng, mắt nhiệt |
| Vị trí Mặt Trời và Trái Đất | JPL Horizons API | Đồng hồ bóng, Trái Đất lặn và mọc, câu đố "Mặt Trời mọc ở đâu" |
| Bão Mặt Trời | DONKI API (api.nasa.gov) | Sự kiện bão bức xạ ở Hồi 4 |
| Băng nước | LCROSS 2009 | Mẫu đất chứa băng |
| Hố va chạm mới | Nghiên cứu ảnh LROC trước và sau | Manh mối hố mới |
| Mẫu đá Apollo | NASA Astromaterials (ví dụ 15415 "Genesis Rock", 74220 "đất cam") | Thẻ so sánh mẫu vật |
| **Mô hình 3D** | **science.nasa.gov/3d-resources** | Orion, đồ phi hành gia, thiết bị, địa hình |
| Ảnh và video lịch sử | NASA Image and Video Library | Thẻ chuyện thật |

*Ghi chú kỹ thuật: kiểm tra lại đường dẫn API và giấy phép của từng mô hình khi bắt đầu code. Mô hình Starship HLS có thể không có trong kho NASA; khi đó dựng bằng Blender hoặc tìm mô hình có giấy phép dùng tự do.*

---

## 9. Danh sách mô hình 3D cần có

| Mô hình | Nguồn dự kiến |
|---|---|
| Orion | Kho 3D NASA |
| Starship HLS (kèm thang máy) | Blender (tự dựng) hoặc mô hình có giấy phép mở |
| Phi hành gia trong đồ du hành | Kho 3D NASA, chỉnh lại trong Blender |
| **Pip** (có các biểu cảm trên màn hình mặt) | Blender, tự dựng |
| **Mica** (bản phủ bụi và bản đã sạch) | Blender, tự dựng |
| 4 module căn cứ, thùng hàng, tháp pin, ăng-ten | Kho NASA và Blender |
| Đá, mẫu vật, búa, lông chim, dụng cụ lấy mẫu | Blender |
| Địa hình | Dựng từ dữ liệu độ cao LOLA |

---

## 10. Thật hay giả tưởng

| Yếu tố | Thật / Giả tưởng |
|---|---|
| Artemis IV đổ bộ cực Nam năm 2028; Orion, Starship HLS, quỹ đạo NRHO | **Thật** (theo kế hoạch NASA) |
| Module căn cứ được gửi trước | **Giả tưởng có cơ sở** |
| Pip và Mica có cảm xúc | **Giả tưởng** |
| Robot hỏng vì bụi phủ pin | **Thật** (vấn đề có thật của các sứ mệnh) |
| Bụi, EDS, bức xạ, nhiệt độ, bóng dài, mất liên lạc, băng trong hố tối | **Thật** |
| Ánh sáng chân trời do bụi bay lơ lửng | **Thật nhưng còn tranh cãi** |
| Phi hành gia ở lại nhiều tuần, qua cả giai đoạn bóng tối | **Giả tưởng** (các chuyến đầu dự kiến khoảng 1 tuần; game nén thời gian) |
| Còi báo quá tải khi hạ cánh | **Gợi nhớ Apollo 11** |

---

## 11. Phạm vi cho hackathon **[Claude đề xuất]**

### Lát cắt demo 3 phút (ưu tiên số 1)
Hạ cánh (rút gọn), rồi gặp Pip và nhảy thử với búa và lông chim, rồi lắp một module, rồi phát hiện vệt bánh xe và tìm thấy Mica, rồi Mica tỉnh dậy.

### Bắt buộc
- Mở đầu với 2 tương tác, Hồi 1, Hồi 2 (ít nhất 2 module và sự kiện bụi), Hồi 3, Hồi 4 (rút gọn: kéo về, sửa, tỉnh dậy).
- Kết thúc rút gọn: ngủ đông, bình minh, chia tay.
- Pip đi theo, tự tìm đường, có lệnh ngữ cảnh. Mắt nhiệt. Sổ tay với ít nhất 10 thẻ.
- Dữ liệu NASA: địa hình LOLA, JPL Horizons, DONKI.

### Nên có
Bí ẩn miệng hố đầy đủ, câu đố ghép nhật ký, chuyến vào hố tối, ánh sáng chân trời.

### Có thì tốt
Song ngữ, giọng đọc, xuất chứng chỉ, xe tự hành chở người.

---

## 12. Phần để người làm game quyết định
- Phong cách giao diện, bố cục màn hình, nhạc nền (chỉ phát "trong mũ"), cân bằng các con số gameplay, miễn đúng **chiều hướng** vật lý.
- Cách dựng cụ thể từng mô hình, cách tối ưu hiệu năng trên web.

## 13. Câu hỏi còn mở
1. **Độ tuổi và yêu cầu nộp bài** trong đề chính thức.
2. **Ngôn ngữ:** tiếng Anh, tiếng Việt, hay cả hai?
3. **Đội:** mấy người, mỗi người làm gì?
4. ~~Luật cuộc thi~~ **[Đã chốt]:** được bắt đầu làm ngay từ 06/11/2026.

**[Claude đề xuất] cho câu 2:** toàn bộ chữ và lời thoại được lưu trong file ngôn ngữ riêng. Bản đầu viết **tiếng Anh** cho giám khảo quốc tế, sau đó thêm tiếng Việt nếu kịp.
