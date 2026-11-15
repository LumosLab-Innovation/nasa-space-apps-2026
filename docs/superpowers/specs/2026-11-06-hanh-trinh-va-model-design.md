# Thiết kế v3: Hành trình khám phá cùng Pip, model nhân vật và hiệu ứng tả thực

*Bổ sung cho bản thiết kế gốc `docs/2026-11-06-pip-mica-thiet-ke-game.md` (v2.0). Tài liệu này chỉ ghi phần **thay đổi và bổ sung**; mọi thứ không nhắc tới ở đây giữ nguyên như v2.0. Khi hai tài liệu mâu thuẫn, tài liệu này thắng.*

*Ngày: 06/11/2026 · Hạn: Space Apps 14–15/11/2026 · Nền tảng đã có: Plan 1 (nhánh `plan-1-surface-slice`, 86 test xanh).*

Ký hiệu: **[Người dùng chốt]** là quyết định của người dùng; **[Claude đề xuất]** là quyết định của Claude, người dùng chưa xác nhận riêng.

---

## 1. Ý đồ

Người dùng muốn người chơi nhớ nhất **hành trình khám phá bề mặt Mặt Trăng cùng Pip, vượt qua và hoàn thành các thử thách trên đường** **[Người dùng chốt]**. Vì vậy:

- Đầu tư sâu nhất vào: bản đồ, các điểm dừng, thử thách phối hợp, phản ứng của Pip, và cảm giác "đang ở Mặt Trăng thật" (model, bụi, ánh sáng, vật lý).
- Các phần khác của kịch bản v2.0 (cutscene hạ cánh, bão Mặt Trời, Hồi 5 Bóng Dài, Kết) vẫn làm, nhưng ở mức **gọn** **[Claude đề xuất]**.

Yêu cầu của lượt này: "hoàn thiện full gameplay cũng như model nhân vật, áp dụng vật lý, tả thực hiệu ứng chân thực như hạt bụi Mặt Trăng" **[Người dùng chốt]**.

## 2. Mục tiêu, không làm, thất bại

**Mục tiêu**
1. Chơi trọn từ hạ cánh tới bình minh, khoảng 30–45 phút **[Claude đề xuất]**, cộng chế độ demo 3 phút (`?demo=1`) cho giám khảo.
2. Toàn bộ khối hình tạm (Plan 1) được thay bằng model GLB phong cách phần cứng NASA thật.
3. Mỗi điểm dừng trên bản đồ có một thử thách gắn với một khó khăn có thật, chỉ vượt qua được khi phối hợp với Pip.
4. Bụi, ánh sáng, nhiệt và chuyển động tuân theo vật lý Mặt Trăng.

**Không làm**
- Không đặt lá cờ Apollo 11 trên bản đồ cực nam (sai địa lý) **[Người dùng chốt]**.
- Không có bụi bay lơ lửng thành mây khi nhảy/chạy (sai vật lý) **[Người dùng chốt, theo giải thích của Claude]**.
- Không dùng máy tạo 3D bằng AI hay thư viện model trả phí (Blender MCP hiện không bật nguồn nào) **[Claude đề xuất]**.
- Không có màn "thua" (giữ §5.8 của v2.0).

**Coi là thất bại dù chạy được**
- Pip trông như đồ chơi hoạt hình, lệch tông với địa hình NASA.
- Bụi trông như khói/mây trên Trái Đất.
- Người chơi đi qua các điểm dừng mà không cần Pip (thử thách giải được một mình).
- Trẻ bị kẹt không biết làm gì tiếp (phải luôn có gợi ý từ Pip hoặc bảng nhiệm vụ).
- Tụt dưới ~30 khung hình/giây trên laptop phổ thông.

## 3. Ràng buộc

- Giữ nguyên nền tảng Plan 1: Babylon.js 9.34, Havok, Vite, TypeScript, Vitest; bản đồ 1,5 × 1,5 km từ LOLA; Mặt Trời và Trái Đất từ JPL Horizons.
- Model dựng bằng **code Python trong Blender 5.2 qua Blender MCP**, xuất **GLB**, đặt trong `public/models/`. Model của NASA (science.nasa.gov/3d-resources) dùng khi có và giấy phép cho phép (ví dụ Orion).
- Chạy offline sau khi tải trang; dữ liệu NASA lưu sẵn trong `public/data/` (DONKI thử gọi API trước, lỗi thì dùng bản lưu, như v2.0 §8).
- Chữ và thoại trong file ngôn ngữ; bản đầu tiếng Anh (v2.0 §13).

---

## 4. Model nhân vật và vật thể **[Người dùng chốt: phong cách A, phần cứng NASA thật]**

Vật liệu chung: nhôm xước, lá cách nhiệt vàng (MLI), sơn trắng tản nhiệt, ốc vít, bó cáp, tem nhãn. Tỉ lệ thật.

### 4.1 Pip **[Người dùng chốt: dáng 1, bốn bánh kiểu VIPER, có cánh tay robot, có gương mặt, chi tiết cơ khí cải tiến]**
*Thay thế mô tả ngoại hình trong v2.0 §3.2 (thân trứng, bánh xích). Tính cách giữ nguyên.*

- **Khung gầm:** thấp và rộng, bốn bánh, mỗi bánh gắn trên một chân có khớp, lái độc lập (đi ngang, xoay tại chỗ). Cao tổng khoảng 1,2–1,5 m tính cả cột đầu **[Claude đề xuất]**.
- **Tấm pin dựng đứng** ở các mặt bên (đúng như VIPER, vì Mặt Trời ở cực nam nằm sát chân trời).
- **Đầu trên cột cao:** màn hình mặt hiển thị 6 biểu cảm hiện có (happy, curious, worried, sad, dots, sleep), hai camera stereo, hai đèn pha LED, LIDAR quay trên đỉnh. Đầu xoay ngang và gật lên xuống được (dùng để biểu cảm: nhìn theo người chơi, cúi soi đá).
- **Cánh tay robot 5–6 khớp** gắn bên hông, kẹp hai ngón, camera cổ tay. Gập sát thân khi không dùng. Dùng cho: nâng thùng, mở nắp, cầm dây tời, đưa lông chim.
- **Tời và dây** ở đuôi xe (dùng ở Đồi Nắng và khi kéo Mica).
- **Bụi bám dần:** bánh và gầm xám dần theo quãng đường **[Claude đề xuất]**.
- Hệ quả với kịch bản: câu thoại 3.1 của v2.0 "Tôi đi bánh xích mà" đổi thành "Tôi có bốn bánh, không phải sáu".

### 4.2 Mica **[Claude đề xuất, người dùng chưa phản đối]**
- Rover đời cũ 6 bánh lưới kim loại (rocker-bogie), thân hộp, **hai tấm pin nằm ngang** kiểu thiết kế cho vùng xích đạo, sơn bạc ngả màu, một "mắt" camera tròn trên cột, ống khoan nhỏ.
- **Ý nghĩa cốt truyện:** pin nằm ngang hứng rất ít nắng ở cực nam và dễ bị bụi phủ kín, đó là lý do Mica "chết". Pip là thế hệ sau đã sửa lỗi này. Thêm thẻ Sổ tay "Vì sao pin của VIPER dựng đứng?".
- Hai trạng thái: phủ bụi (khi tìm thấy) và đã làm sạch (sau EDS); hiện code đã có độ bụi 0–1 điều khiển màu.

### 4.3 Phi hành gia **[Claude đề xuất]**
- Dựa trên bộ đồ **AxEMU** của Artemis: thân trắng, sọc nhận diện màu trên tay/chân, mũ có kính chắn vàng kéo xuống được, ba lô sinh tồn (PLSS), đèn mũ hai bên.
- Góc nhìn thứ ba nên đây là model người chơi nhìn nhiều nhất.

### 4.4 Vật thể khác
Starship HLS kèm thang máy, Orion (kho NASA nếu có), 4 module căn cứ + thùng hàng, **lá cờ Artemis IV**, trạm chuyển tiếp sóng, búa, lông chim, túi mẫu, các loại đá mẫu, tảng đá lớn có vệt lăn.

### 4.5 Hoạt ảnh **[Claude đề xuất]**
Mỗi model gồm các khối cứng nối theo cây cha–con (không skin xương), hoạt ảnh bằng code trong game: bánh quay và lái theo vận tốc thật, chân bánh nhún theo địa hình, đầu Pip nhìn theo mục tiêu, khớp tay xoay theo động tác, tay chân phi hành gia vung theo nhịp bước "thỏ". Cách này rẻ, chắc chắn, và bám đúng vật lý của bộ điều khiển chuyển động sẵn có.

---

## 5. Bụi và hiệu ứng tả thực **[Người dùng chốt phần bụi khi nhảy/đáp]**

| Hiệu ứng | Khi nào | Vật lý / cách thể hiện |
|---|---|---|
| **Bụi khi nhảy và đáp đất** | Mỗi lần bật nhảy và tiếp đất | Hạt bay theo **parabol với g = 1,62 m/s², không có lực cản**, rơi thẳng xuống, không đọng thành mây. Lượng hạt và vận tốc tỉ lệ với vận tốc chạm đất. Hạt cuối đời rơi xuống mặt đất chứ không mờ dần giữa không trung **[Claude đề xuất]** |
| Bụi khi bước/chạy | Mỗi bước | Như trên, ít hạt hơn |
| Bụi bánh xe | Pip chạy, Mica bị kéo | Hình "đuôi gà trống" như video rover Apollo |
| Dấu chân và vệt bánh | Liên tục | **Ở lại vĩnh viễn** (không có gió), đúng như dấu chân Apollo **[Claude đề xuất]** |
| Bụi bám | Theo quãng đường | Chân đồ phi hành gia và gầm Pip xám dần |
| Luồng phụt tàu | Cutscene hạ cánh, cất cánh | Tấm bụi tỏa ngang sát mặt đất, bay rất xa |
| **Bụi lơ lửng thật sự** | Chỉ ở ranh giới sáng–tối, Hồi 5 | Lớp sáng mờ sát chân trời (đã có ở v2.0 2G); thẻ **CÒN TRANH LUẬN** **[Claude đề xuất]** |
| Tia EDS | Làm sạch pin | Hạt bụi bật khỏi bề mặt (đã có trong Plan 1) |

Ánh sáng và bầu trời giữ đúng v2.0 §7: trời đen giữa ban ngày, bóng đen tuyệt đối, sao chỉ hiện khi ở lâu trong bóng tối.

---

## 6. Lá cờ **[Người dùng chốt]**
1. **Cutscene mở đầu:** khi tàu bay qua Biển Tĩnh Lặng trên quỹ đạo, Pip hoặc Houston chỉ xuống nơi Apollo 11 đã đáp năm 1969.
2. **Trên bản đồ:** người chơi tự cắm **cờ Artemis IV** (cờ Mỹ) ở bãi đáp, như một khoảnh khắc nối tiếp năm 1969.
3. **Sổ tay:** thẻ "Lá cờ năm 1969 giờ ra sao?": cờ Apollo 11 bị luồng khí động cơ thổi đổ khi cất cánh (Buzz Aldrin kể lại); ảnh LRO cho thấy các cờ Apollo khác vẫn đứng, nhiều khả năng đã bạc trắng do tia cực tím. Cần nguồn NASA kiểm chứng khi viết.

---

## 7. Hành trình khám phá cùng Pip **[Người dùng chốt: duyệt bản đồ 8 điểm dừng và chuỗi thử thách]**

*Thay bảng khu vực ở v2.0 §4. Bản đồ vẫn là 1,5 × 1,5 km từ LOLA; thứ tự là gợi ý, người chơi đi tự do.*

| # | Điểm dừng | Ứng với v2.0 | Thử thách | Phối hợp với Pip | Khó khăn có thật |
|---|---|---|---|---|---|
| 1 | Bãi đáp | Khu 1 | Hướng dẫn Hồi 1, **cắm cờ** | Pip đi theo, đưa lông chim | — |
| 2 | Shackleton Camp | Khu 2 | Trung tâm: lắp module, sửa Mica, sạc | Pip nâng, giữ, mở nắp | — |
| 3 | Đồi Nắng | Khu 3 (Đồi Pin) | Sườn dốc phủ bụi mềm, bánh Pip trượt quay tại chỗ | Người chơi chọn đường thoải, cắm neo; Pip thả tời kéo thùng tháp pin lên | Spirit kẹt cát và "chết" năm 2009–2010; VIPER được thiết kế để tránh |
| 4 | Bãi đá lăn | Khu 4 | Thấy một vệt dài trên dốc, tưởng vết bánh xe, hóa ra là **vệt đá lăn** (manh mối giả) | Pip quét LIDAR, so hình dạng vệt, giải thích | LRO đã chụp rất nhiều vệt đá lăn |
| 5 | Hố va chạm mới | Khu 5 | Đá hướng nắng ~115 °C, sát bên trong bóng ~−150 °C; tìm hạt thủy tinh | Bật Mắt nhiệt của Pip để chọn đường và mẫu | Chênh nhiệt cực lớn làm vật liệu nứt |
| 6 | Đỉnh nhìn Trái Đất | **Mới** | Chỉ liên lạc được khi Trái Đất trên chân trời | Dựng trạm chuyển tiếp; Pip căn ăng-ten | Cực nam thường mất liên lạc trực tiếp (giờ thật từ JPL Horizons) |
| 7 | Vệt bánh xe | Khu 5, Hồi 3 | Lần theo vệt vào vùng tối dần | Đèn Pip soi đường; bụi nhảy che tầm nhìn | Bóng dài hàng trăm mét |
| 8 | Hố tối vĩnh cửu | Khu 6 + Cảnh 5.4 | ~−230 °C, không nắng nên Pip không sạc được; lấy mẫu băng | Chia năng lượng: Pip soi và giữ ấm, người chơi canh giới hạn bộ đồ; Mica chỉ đường qua bộ đàm | Băng nước trong hố tối, mục tiêu chính của Artemis (LCROSS 2009) |

### 7.1 Pip nâng cấp dần **[Người dùng chốt ý tưởng; Claude đề xuất cách gán]**
Mỗi module lắp xong mở một khả năng, nhờ đó vùng mới mở ra dần:

| Module | Pip có thêm | Mở ra |
|---|---|---|
| Tháp pin (Đồi Nắng) | Trạm sạc nhanh, pin Pip lớn hơn, đèn sáng lâu hơn | Đi xa hơn vào vùng tối |
| Bộ tản nhiệt | Bộ sưởi cho Pip và bộ đồ | Vào được Hố tối (điểm 8) |
| Module ở + buồng khóa bụi | EDS cho Pip và cho Mica | Làm sạch pin, sửa Mica |
| Trạm chuyển tiếp (Đỉnh Trái Đất) | LIDAR tầm xa, bản đồ (phím M), liên lạc Houston | Thấy điểm dừng trên bản đồ |

Tời là khả năng sẵn có của Pip ngay từ đầu (cần cho Đồi Nắng).

### 7.2 Pip phản ứng với mọi thứ
Mỗi điểm dừng có thoại, biểu cảm và chút hài hước riêng của Pip khi tới gần, khi giải xong, và khi thất bại. Pip lo lắng khi người chơi đi xa quá; Pip im lặng ở khoảnh khắc nghiêm trọng (v2.0 §3.2).

### 7.3 Tài nguyên **[Claude đề xuất]**
- **Pin Pip:** sạc khi tấm pin dựng đứng hứng nắng (phụ thuộc hướng Mặt Trời thật và độ bụi), tụt khi chạy, soi đèn, sưởi, hoặc ở trong bóng.
- **Bộ đồ phi hành gia:** oxy và nhiệt có giới hạn; về căn cứ hoặc đứng cạnh Pip để sạc/sưởi.
- **Không có màn thua:** khi một tài nguyên cạn, màn hình mờ đi, Pip kéo người chơi về căn cứ, giải thích chuyện gì đã xảy ra (kèm sự cố có thật nếu có), rồi cho làm tiếp. Không mất tiến độ đã có.

### 7.4 Mica mở bí ẩn cuối
Dữ liệu khôi phục từ Mica (câu đố ghép nhật ký v2.0 Cảnh 4.5) chỉ đường vào Hố tối, nơi Mica đã phát hiện tín hiệu băng trước khi "chết".

---

## 8. Phần còn lại của kịch bản, mức "gọn" **[Claude đề xuất]**

| Phần (v2.0) | Làm gì trong lượt này |
|---|---|
| Cutscene hạ cánh M1–M6 | Làm bằng 3D, rút gọn: quỹ đạo và **bay qua Biển Tĩnh Lặng** (chỉ chỗ Apollo 11), tách tàu, hãm tốc (1 tương tác), còi 1202-style, chạm đất có bụi phụt (1 tương tác). Có thể bỏ qua cutscene |
| Hồi 1 | Đã có từ Plan 1; thêm cắm cờ |
| Hồi 2 | Theo §7; gồm sự kiện tàu hàng hạ cánh (2E) ở mức đơn giản |
| Hồi 3 | Đã có; thêm manh mối giả vệt đá lăn |
| Hồi 4 | Đã có kéo về/sửa/tỉnh; thêm **bão Mặt Trời** (DONKI, đếm ngược, nấp sau đá hoặc về căn cứ) và **câu đố ghép nhật ký** |
| Hồi 5 | Một vòng gọn: tin xấu → ngân sách năng lượng → đoán khe núi Mặt Trời mọc → vào Hố tối → lựa chọn của Mica |
| Kết | Bình minh qua khe núi, Trái Đất mọc, gửi dữ liệu, chia tay, Hồ sơ nhiệm vụ |
| Âm thanh | Chỉ âm "trong mũ": thở, bộ đàm, rung khi chạm; không âm môi trường |

Vấn đề đã biết từ Plan 1 cần sửa: với Mặt Trời thật cao ~0,6°, căn cứ và chỗ Mica nằm trọn trong bóng. Cần đặt lại vị trí các điểm dừng sao cho Đồi Nắng thật sự có nắng và Hố tối thật sự tối, dựa trên địa hình LOLA và hướng Mặt Trời thật.

## 9. Thứ tự ưu tiên khi hết thời gian **[Claude đề xuất]**
1. Model Pip, Mica, phi hành gia, module + bụi khi nhảy/đáp, dấu chân (thứ người chơi nhìn thấy mọi lúc).
2. Hành trình 8 điểm dừng, thử thách, nâng cấp Pip, tài nguyên, thoại Pip.
3. Hồi 4 bổ sung (bão, ghép nhật ký) và Hồi 5 + Kết bản gọn.
4. Cutscene hạ cánh 3D và chế độ demo 3 phút.
5. Tiếng Việt, giọng đọc, chứng chỉ.

## 10. Quyết định sau khi rà soát

1. **Ánh sáng và thời điểm sứ mệnh [Người dùng chốt]:** giữ năm 2028 nhưng **đổi tháng**. Chọn khoảng thời gian trong năm 2028 khi Mặt Trời ở bãi đáp lên cao nhất (khoảng 1,5°), tải lại dữ liệu JPL Horizons cho Mặt Trời và Trái Đất, rồi đặt lại vị trí các điểm dừng theo ánh sáng thật: Đồi Nắng có nắng, Hố tối tối, Mica nửa sáng nửa tối. Thay cho "đầu năm 2028" trong v2.0 §2. Ánh sáng hoàn toàn từ dữ liệu thật, không nâng Mặt Trời giả.
2. **Đồng hồ trò chơi [Claude đề xuất]:** dùng lịch thiên văn thật nhưng **nhảy thời gian theo nhịp truyện**. Trong Hồi 1–4, cửa sổ thời gian được chọn sao cho Trái Đất ở trên chân trời và Mặt Trời còn chiếu, nên Đỉnh Trái Đất (điểm 6) luôn làm được, theo thứ tự nào cũng không bị kẹt. Giữa các nhịp lớn, đồng hồ chạy liên tục (bóng đổ quay chậm). Hồi 5 tua thẳng tới mốc thật Trái Đất lặn và Mặt Trời lặn; Kết tua tới mốc bình minh thật (dùng `skipHours` sẵn có).
3. **Mức độ mô phỏng vật lý [Claude đề xuất]:** lai.
   - **Havok thật** cho người chơi, nhảy, búa và lông chim, đá lăn, thùng hàng rơi hoặc trượt (quán tính).
   - **Hạt bụi** bay theo parabol đúng g = 1,62, không lực cản.
   - **Pip và Mica di chuyển theo động học có quy luật vật lý:** độ trượt bánh tính từ độ dốc và loại đất, tốc độ giới hạn theo dốc, dây tời có độ căng và chiều dài. Lý do: xe bốn bánh mô phỏng hoàn toàn bằng Havok rất tốn công cân chỉnh và dễ hỏng trong 8 ngày.
4. **Chế độ demo `?demo=1` [Claude đề xuất]:** chơi được, khoảng 3 phút, làm nổi bật hành trình. Gồm: hạ cánh rút gọn, gặp Pip, nhảy thử (bụi), một thử thách phối hợp (Đồi Nắng có tời), phát hiện vệt bánh và tìm thấy Mica, Mica tỉnh dậy. Nội dung được dịch chuyển nhanh giữa các điểm.
5. **Người làm, thời gian và duyệt model [Claude đề xuất]:**
   - Claude làm toàn bộ; còn 8 ngày.
   - **Mức tối thiểu để nộp:** ưu tiên 1 và 2 ở §9, cộng chế độ demo.
   - **Duyệt model:** model Pip được làm đầu tiên, rồi gửi ảnh render cho người dùng duyệt trước khi dựng các model còn lại và hệ thống hoạt ảnh.

## 11. Để người làm quyết định
- Số đo cụ thể của model, số polygon, cách tối ưu web, cách đóng gói GLB.
- Cân bằng con số gameplay (tốc độ tụt pin, giới hạn oxy, độ dốc trượt), miễn đúng chiều hướng vật lý.
- Bố cục HUD cho tài nguyên, phong cách bản đồ phím M.
- Câu thoại cụ thể của Pip ở từng điểm dừng, miễn đúng tính cách v2.0 §3.2.
- Vị trí chính xác các điểm dừng trên địa hình (theo ràng buộc ánh sáng ở §8).
