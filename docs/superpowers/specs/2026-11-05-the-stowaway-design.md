# THE STOWAWAY — Trước bước chân đầu tiên

Ngày: 2026-11-05. **Bản thiết kế đề xuất để duyệt; chưa triển khai game.**

## 1. Ý định và quyết định

Game phiêu lưu khoa học 3D trên trình duyệt. Bạn là phi hành gia Artemis IV, từ quỹ đạo đáp xuống Cực Nam, trực tiếp khảo sát, lấy mẫu, ghi số liệu và hoàn thiện căn cứ LANTERN từ các mô-đun gửi trước. Bạn gặp PIP đang làm việc, trò chuyện để nó đi cùng, rồi cùng tìm và cứu robot tiền trạm MICA.

Câu hỏi cảm xúc: một nơi trở thành nhà khi nào, và những người đến trước còn giá trị gì khi công nghệ đã đổi?

Câu hỏi khoa học: làm sao tìm nguyên nhân thật của sự cố và xây một hệ thống hoạt động trong giới hạn điện, nhiệt, bụi, bức xạ và thông tin?

Đề chính thức: [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/). Quản lý outpost cùng các đánh đổi duy trì sự sống, che chắn, năng lượng và thực phẩm là nền bắt buộc của thiết kế này; robot là cách dẫn dắt.

[DESIGN.md](../../../DESIGN.md) giữ quy tắc/thông số cân bằng chuẩn. Spec giữ cốt truyện và hành vi. Thay luật phải cập nhật cả hai; không tạo bộ số cân bằng thứ hai trong spec.

### Người dùng đã chọn

- Web 3D, cân nhắc Three.js và Babylon.js; thiên về tự khám phá cùng PIP, có quản lý căn cứ.
- Phiêu lưu theo chương trên một bản đồ mở dần; đầu ấm áp/tò mò, căng thẳng dần nhưng không kinh dị.
- Tương lai lấy cảm hứng Artemis IV; SpaceX đưa mô-đun và PIP lên trước trong câu chuyện.
- Người chơi là phi hành gia Artemis IV. Mở đầu bằng cutscene từ quỹ đạo đến tiếp đất. Sau EVA, phi hành gia lấy mẫu, ghi số liệu và trực tiếp lắp ráp. PIP có công việc riêng khi gặp và tự đi theo sau hội thoại.
- PIP có biểu cảm, nhận thức/cá tính AI giả tưởng và tay lắp ráp.
- MICA thế hệ cũ được tìm thấy ngừng hoạt động: pin phủ bụi, có hư hỏng sau phơi nhiễm bức xạ dài hạn.
- Khảo sát crater, lấy mẫu, lắp trạm; năng lượng/bụi/nóng/lạnh và dữ liệu NASA ảnh hưởng gameplay.
- Tinh thần robot Interstellar: dí dỏm, có năng lực, thực dụng và đáng tin.

### Tác giả đề xuất, chưa coi là người dùng đã chốt

- Đề xuất camera góc nhìn phi hành gia trong cutscene và góc nhìn thứ ba sau EVA. PIP giúp nâng và giữ tải theo hiệu lệnh, người chơi tự hoàn thành kết nối.
- Babylon.js là engine mặc định đề xuất, React/TypeScript/Vite giữ vỏ app/UI. Three.js là phương án thay, không chạy hai engine trong một scene.
- Hội thoại và phản ứng AI soạn trước, chạy local; không LLM/backend trong scope đầu.
- Demo ưu tiên bản gửi chấm tiếng Anh, có chuyển văn bản/phụ đề Anh–Việt. Đây là lựa chọn sản phẩm, không phải xác nhận thể lệ ngôn ngữ năm nay. Không lồng tiếng trong scope đầu.
- MICA được cứu ở giữa chiến dịch, trở thành đồng đội có giới hạn; không chạy bí mật lúc mất nguồn.
- Hỗ trợ nhóm 7–12 theo AGENTS.md bằng tutorial từng bước; đây không là giới hạn tuổi NASA.
- Thời lượng, humor setting, bản đồ và ngưỡng cảnh báo theo DESIGN.md là giả thuyết để playtest.

## 2. Mục tiêu và giới hạn

### Mục tiêu

1. Người chơi tự cứu MICA bằng các bước có nguyên nhân, nhớ hai robot như hai cá tính.
2. Tự hoàn tất chuỗi quan sát → giả thuyết → đo/đối chứng → can thiệp → kiểm tra lại.
3. Khảo sát thay đổi đường đi, vị trí mô-đun và cách vận hành.
4. Hiểu giảm trọng lượng không giảm khối lượng; pin không giải mọi lỗi; bụi và bức xạ gây lỗi khác nhau.
5. Biết nguồn NASA nào dùng, chỗ nào là mô phỏng và kết luận nào chưa đủ bằng chứng.

### Ngoài scope

Thế giới mở toàn Mặt Trăng; mô phỏng quỹ đạo/lander đầy đủ; multiplayer; chiến đấu/alien/hố đen; LLM online; mô phỏng từng hạt bụi; tính liều bức xạ dùng ngoài đời; nông nghiệp thu hoạch tức thì. Không tái tạo nhân vật, ngoại hình, giọng hoặc câu thoại trong Interstellar; lấy tinh thần đồng hành làm cảm hứng cho thiết kế nguyên bản.

### Anti-goals

- Lau vết bẩn lặp lại để mở cửa, học khoa học chỉ bằng đoạn văn dài.
- MICA phản diện/nhiễm virus/kinh dị, phải chết để tạo cảm xúc.
- Lau pin chữa bo hỏng, bóng tối chặn bức xạ, nhiệt đất bằng nhiệt robot.
- Deadline vô cớ, phạt thời gian đọc/cutscene, ép một lỗi tutorial dù người chơi làm đúng.

## 3. Approaches

| Hướng | Đánh đổi | Quyết định |
|---|---|---|
| Phiêu lưu theo chương, hub và nhánh mở dần | Giữ nhịp truyện/bài học, vẫn nhiều phương án; tự do có giới hạn | Người dùng đã chọn |
| Sandbox sinh tồn | Tự do cao nhưng scope lớn, loãng câu chuyện PIP/MICA | Không chọn |
| Chuỗi puzzle tuyến tính | Dễ demo nhưng yếu địa hình/khám phá và sở hữu căn cứ | Không chọn |

Babylon.js là lựa chọn kỹ thuật tác giả đề xuất để người dùng duyệt cùng sản phẩm; không gán cho người dùng một quyết định engine họ chưa đưa ra.

## 4. Khoa học và tương lai hư cấu

- [NASA Artemis IV](https://www.nasa.gov/mission/artemis-iv/) hiện ghi mục tiêu đầu năm 2028. Intro ghi rõ chuyện hư cấu lấy cảm hứng từ Artemis; lịch có thể đổi.
- [Báo cáo Apollo 11](https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf) là tham chiếu tách tàu, hiệu chỉnh quỹ đạo, hãm bằng động cơ, tiếp cận và tiếp đất. Eagle, Columbia, các mã 1201/1202, Biển Tĩnh Lặng và các trị số bay thuộc Apollo 11. Trong cảnh Artemis hư cấu, phi hành đoàn chuyển từ Orion sang tàu đổ bộ phi hành đoàn.
- SpaceX chở trạm LANTERN và PIP lên trước là tình tiết game, không phải bản tin nhiệm vụ đã xác nhận. [Kế hoạch tải lớn công bố trước đây](https://www.nasa.gov/news-release/nasa-plans-to-assign-missions-for-two-future-artemis-cargo-landers/) có phân công/lịch khác.
- MICA là robot tiền trạm hư cấu trước PIP, không phải robot từ Apollo hay có danh tính nhiệm vụ thật.
- Map/crater nhỏ được thiết kế dựa vùng cực thật; không gọi bản sao địa điểm Artemis được chọn.
- Phía xa khác phía tối. Bóng đổ thay đổi khác PSR (vùng khuất sáng vĩnh viễn).
- Bụi theo bánh xe, thao tác, tiếp xúc, hộp chứa lỗi; không có gió/bão bụi kiểu khí quyển Trái Đất trên mặt ngoài.
- Bức xạ ion hóa/hạt năng lượng cao khác ánh sáng/UV và nóng. Nguồn có thể gồm Mặt Trời và tia vũ trụ; MICA không hỏng chỉ vì “nhìn thấy nắng”.

## 5. Nhân vật

**Điểm lấy cảm hứng:** PIP kế thừa sự dí dỏm và năng lực đồng hành gợi TARS; MICA gợi KIPP ở trạng thái được tìm thấy hư hỏng và CASE ở sự điềm đạm, hiệu quả khi trở lại. Hai robot có thiết kế cơ khí, giọng và hành trình riêng.

### PIP — nhanh trí, dí dỏm, có trách nhiệm

**Cơ khí:** rover sáu bánh trọng tâm thấp, tay máy đầu kẹp thay được, chân chống triển khai, camera cổ ngắn, pin mặt trời gập. Pin/bộ điện tử nằm trong thân bảo vệ. Không cần tạo hình người.

**Biểu cảm:** hướng camera, nhịp đèn, nghiêng cổ, cách dừng/chờ; có biểu tượng và phụ đề, không chỉ mã màu/âm thanh.

**Tính cách:** tự tin tính toán, hài hước khô, tò mò về con người. Thừa nhận chưa đủ dữ kiện. Không pha trò che cảnh báo quan trọng. Humor setting theo DESIGN.md chỉ đổi thoại flavor; không có tùy chỉnh “độ trung thực” làm sai telemetry hay giấu nguy hiểm.

**Hành trình:** hoàn tất danh sách thiết bị → hiểu giá trị của MICA → đề nghị chỗ cho đồng đội cũ. Quyền thao tác quyết định vẫn thuộc người chơi.

**Cuộc gặp và trạng thái theo sau.** Ban đầu PIP tự căn kiện nguồn trên bệ. Trò chuyện để mời robot đi cùng. PIP theo phía sau, tránh chướng ngại, chờ tại mép dốc hoặc lối hẹp. Sau khi giữ tải xong, PIP quay lại đi theo. Nếu tách tuyến, người chơi gọi nó tới điểm tập kết an toàn.

**Thoại nguyên bản mẫu:**

- Dựng pin: “Mặt Trời đã ở đúng chỗ. Bây giờ tới lượt chúng ta.”
- Humor thấp: “Đã hiểu. Tôi sẽ thất vọng với hiệu suất tối đa.”
- Chưa chắc: “Tôi có hai giả thuyết. Chúng ta cần thêm một phép đo.”
- Gặp MICA: “Thiết kế cũ hơn tôi. Đường đi có vẻ tốt hơn của tôi.”
- Quá nhiệt: “Điện còn. Chỗ để đưa nhiệt đi thì không.”

### MICA — người khảo sát đến trước

**Cơ khí:** rover nhỏ bốn bánh, thân hẹp, tay dò đơn giản, pin cố định, cổng bảo trì chuẩn cũ. Tải nhỏ hơn PIP nhưng vào được khe hẹp và giữ bản đồ thực địa cũ.

**Khi phát hiện:** bất động đúng vị trí kể từ mất nguồn. Pin phủ bụi, dự phòng xuống ngưỡng bảo vệ. Bo giao tiếp/điều khiển chuyển động lỗi dai dẳng; đường phục hồi tách biệt còn dùng được; có bản sao bộ nhớ kiểm tra được.

**Tính cách sau cứu:** ít lời, điềm đạm, chính xác, tập trung công việc, đôi lúc buồn cười vì hiểu literal. Tự báo giới hạn; không thành nhân vật bất lực. PIP đề xuất nhiều phương án; MICA đưa một quan sát hoặc bước tiếp theo.

**Hành trình:** vật thể bị bỏ quên → đối tượng người chơi hiểu/cứu → đồng đội có năng lực riêng. Giữ một giới hạn sau sửa (tải nhỏ/mất một phần nhật ký) để không “hồi sinh như mới”.

**Thoại nguyên bản mẫu:**

- Phục hồi: “Công việc đang chờ: chuẩn bị trạm. Thời gian đã trôi: cần xác minh.”
- PIP hỏi cần nghỉ: “Đang nghỉ. Chưa hoàn tất.”
- Bản đồ cũ: “Đường này từng đi được. Cần cập nhật.”
- Sau test: “Tôi có thể thực hiện. Tải cho phép đã giảm.”
- Cuối game: “Nhiệm vụ tiếp theo?”

**Nguyên tắc cứu:** xử lý pin mở được đường cấp nguồn, không chữa bo. Không reset để khôi phục toàn bộ ký ức. Chẩn đoán xác nhận mô-đun lỗi, chỉ suy luận nguyên nhân phù hợp lịch sử phơi nhiễm; không chứng minh TID chỉ bằng nhìn panel.

### Người ở Trái Đất

Điều phối viên và nhà khoa học gửi mục tiêu/nhắc ngắn, bình tĩnh, không giải mọi puzzle. Không lấy tên/giọng người thật.

## 6. Map và nhịp mở

**Hub LANTERN:** bãi hàng; điện/sạc; điểm bàn giao sạch; mô-đun thử nghiệm kín; nhà kính; khu bảo trì/bảo vệ điện tử; cụm tản nhiệt ngoài.

**Ba nhánh:** Gờ Ánh Sáng (pin/đường chở hàng), Vành Miệng Hố (địa chất/mẫu/trạm cũ), Rìa Bóng Che (lạnh/cảm biến/khe bảo trì cuối).

Mở khu theo năng lực có lý do: nguồn dự phòng cho đi xa, neo/tời cho đoạn dốc, sưởi và tuyến rút cho vùng lạnh. Cảnh báo và điểm chuẩn bị thay tường vô hình vì thiếu sao.

Địa hình xa cho cảm giác quy mô; vùng tương tác theo DESIGN.md. Không đi từ vành tới đáy crater lớn thật trong vài phút. Ghi rõ phần địa hình được rút gọn/thiết kế lại.

## 7. Gameplay và tương tác

### Điều khiển và trợ giúp

Desktop chuột/bàn phím là đích đầu. WASD di chuyển phi hành gia, chuột điều khiển camera. Tương tác để quét, cầm dụng cụ, ghi sổ, lấy mẫu và căn đầu nối. Chi tiết lớn dùng bệ, tời hoặc tay máy PIP. Snap hỗ trợ khớp nối khi đến gần.

**Ranh giới điều khiển.** Người chơi điều khiển phi hành gia. PIP tự tìm đường, đi theo, chờ hoặc hỗ trợ. Người chơi chọn đích, ra hiệu giữ tải và thực hiện lắp. PIP tự dừng ở dốc hoặc khe hẹp vượt khả năng, sau đó gặp lại tại điểm an toàn. Dự phòng bộ đồ EVA và pin PIP được theo dõi riêng. Tàu đổ bộ là nơi trú ban đầu.

Bản đồ chẩn đoán có thể dừng mô phỏng. Đọc thoại/tài liệu không âm thầm làm cạn pin. Trợ giúp ba mức: nhắc công cụ → chỉ khu vực → minh họa bước. Manh mối không nằm trong câu đùa có thể tắt.

### Điều tra

Máy quét cần tầm nhìn/tiếp cận: mặt trước sạch không bảo đảm mặt sau sạch, không đọc bo bên trong bằng lia camera. Sổ có “đã thấy / đang nghĩ / cần kiểm tra”; chọn bằng chứng/thao tác thay nhập văn bản dài.

### Thu mẫu

Mẫu = vật + vị trí nhiệm vụ + ảnh ngữ cảnh + loại bề mặt + thời điểm/điều kiện. Lấy đối chứng, không nhặt hết vật sáng. Địa chất cần ít nhất hai bằng chứng phù hợp, kết luận tương đối với mức chắc chắn; không tuổi tuyệt đối sau một lần quét. Lạnh/sáng không chứng minh có băng. Mẫu chất dễ bay hơi cần cách bảo quản phù hợp; khai thác nước quy mô lớn ngoài scope.

### Lắp ráp

Khảo sát → chống chân/neo → chuyển linh kiện → khớp cơ khí → kết nối điện/dữ liệu an toàn → test. Anchor có lựa chọn thay freeform vô hạn. Mỗi vấn đề bố trí có ít nhất hai nghiệm đổi cáp/ánh sáng/đường hàng/khả năng bảo trì. Preview bóng che/khoảng trống trước xác nhận. Người chọn đúng sớm được ghi nhận, không ép script làm hỏng.

### Bụi

State trên bề mặt quan trọng truyền qua contact graph/tuyến xác định; hạt vẽ chỉ là hiệu ứng. EDS chỉ trên mặt thiết kế hỗ trợ. Hộp/gioăng/tuyến sạch là cơ chế riêng; EDS không chữa mòn hay bo hỏng. Thành công = thiết bị đạt và nguồn tái nhiễm được kiểm soát, không phải lau hết đất.

## 8. Cốt truyện và nhiệm vụ từng chương

### Mở đầu — Từ quỹ đạo tới Cực Nam

1. **Tách tàu.** Mở từ buồng lái khi hai phi hành gia đã sang tàu đổ bộ. Xác nhận sẵn sàng rồi tách khỏi Orion.
2. **Hạ điểm thấp quỹ đạo.** Một cú đốt hiệu chỉnh đưa tàu vào quỹ đạo tiếp cận. Có đoạn chuyển thời gian trước khi hãm chính.
3. **Hãm bằng động cơ.** Tàu giảm vận tốc ngang và xuống thấp theo đường tiếp cận có dẫn đường.
4. **Dựng góc quan sát.** Địa hình hiện qua cửa sổ. Hệ dẫn đường đánh dấu bãi đáp an toàn ở Cực Nam, cách khu mô-đun. Bóng dài và đá giúp đọc địa hình.
5. **Tiếp đất.** Xác nhận tiếp xúc bề mặt, kết thúc pha động cơ, ổn định tàu. Quyền điều khiển chuyển cho người chơi ở checkpoint sau khi chuẩn bị EVA.

Cutscene tự chạy, có phụ đề, tạm dừng và bỏ qua. Bỏ qua đưa đến cùng checkpoint sau tiếp đất. Nhịp bay được cô đọng cho game.

### Chương 1 — Người đầu tiên mở cửa

**Nhịp:** ấm áp. **Mở:** hub, đầu Gờ Ánh Sáng.

Bạn bước khỏi tàu, kiểm tra bộ đồ và đi tới bãi mô-đun. PIP đang dùng tay máy căn kiện nguồn. Sau khi trò chuyện, bạn mời PIP đi cùng và thử lệnh hỗ trợ đầu tiên.

**Chuỗi nhiệm vụ:**

1. Kiểm tra bộ đồ EVA và đánh dấu đường về tàu. Tới bãi mô-đun và trò chuyện với PIP để bắt đầu trạng thái đi theo. Tùy chỉnh hài hước mở sau cuộc gặp.
2. Chọn đường đưa thiết bị ra bãi: đường ngắn dốc và đường vòng đều có cách đi hợp lệ.
3. So hai anchor pin, chọn/hướng panel, dựng điểm sạc.
4. Ra hiệu PIP chống chân và giữ linh kiện. Phi hành gia căn chỉnh, khóa cơ khí, kết nối và kiểm tra mô-đun kín.
5. Đưa hộp cây đóng kín tới nhà kính và xác nhận điều kiện sử dụng trước khi mở khoang.

**Móc truyện:** dấu bánh nhỏ và mốc thực địa cũ. Không có MICA chạy quanh hay cửa tự đóng do nó. **Quản lý:** cấp nguồn cho thao tác theo thứ tự. **Đạt:** nguồn/sạc hoạt động, mô-đun qua test, biết điểm quay về.

### Chương 2 — Những vết sẹo biết kể chuyện

**Nhịp:** khám phá. **Mở:** Vành Miệng Hố.

Khảo sát tuyến cảm biến cũ/lấy mẫu để đề xuất mở rộng.

1. So dốc/dự phòng hai đường; chọn dụng cụ và hộp đối chứng.
2. So ảnh/địa hình tại điểm nhìn: một phần “hố mới” là bóng làm hiểu sai hình dạng.
3. Hai crater nhỏ chồng nhau: tìm ranh giới phủ/chồng và bằng chứng ảnh để suy tuổi tương đối.
4. Lấy mẫu có ngữ cảnh, đặt cảm biến làm mốc quay lại.
5. Theo mốc cũ tới trạm tiền trạm, phát hiện MICA bất động.

**Bất ngờ:** mốc bạn đã dùng do MICA đặt. **Đạt:** báo cáo có bằng chứng; MICA được định vị/chụp nguyên trạng và đánh dấu để lập phương án cứu. Không cấp điện tùy tiện ngay.

### Chương 3 — Đừng khởi động vội

**Nhịp:** quan tâm/chẩn đoán. **Mở:** trạm cũ và khu bảo trì hub.

MICA có hai vấn đề độc lập. Pin phủ bụi làm thu điện không đủ và nguồn dự phòng cạn. Trong cốt truyện, phơi nhiễm bức xạ ion hóa tích lũy (gồm các hạt năng lượng cao từ Mặt Trời) đã làm suy thoái một bo đời cũ với khả năng chịu bức xạ hạn chế. Người chơi dùng dấu hiệu để chẩn đoán, không được trao một phép đo liều tưởng tượng. Một lỗi không giải thích thay lỗi kia.

1. Đo nguồn, quét nhiều góc pin, kiểm tra/cô lập đầu nối có nguy cơ. Kiểm tra nhiệt pin/bo; nếu dưới giới hạn khởi động, chuẩn bị sưởi trước khi cấp nguồn.
2. Cấp nguồn chẩn đoán giới hạn dòng qua đường phục hồi được mô tả trong dossier.
3. Dùng nguồn bảo trì phụ cho một phần panel có EDS tích hợp còn hoạt động. So công suất có tải trước/sau ở cùng hướng chiếu và vị trí: thu điện tăng nhưng boot chính vẫn lỗi.
4. Đọc log sao lưu trước mất nguồn: thu điện giảm nhiều chu kỳ, lỗi điện tử có trước lần ngừng hoạt động. Log là telemetry hư cấu, không phải NASA đo.
5. Self-test khoanh vùng bo giao tiếp/điều khiển chuyển động: lỗi dai dẳng qua boot, không chỉ bit flip thoáng qua.
6. Chọn bệ chở hoặc tời đưa MICA về; đường/neo/dự phòng phù hợp đều có nghiệm.
7. Ở hub, thay bo tương thích, xác minh checksum bản sao bộ nhớ và test chuyển động tải thấp.

Bo dự phòng bảo trì đã được giới thiệu trong kho chương 1; không spawn bất ngờ. Không lấy phụ tùng duy nhất bắt buộc cho căn cứ để tạo softlock. Cổng phục hồi/hạn dòng là phần thiết kế robot giả tưởng được công khai.

**Điểm người chơi tự suy luận:** phải chọn phép thử để phân biệt các giả thuyết, không chỉ làm theo checklist. PIP có thể gợi ý sau khi người chơi đã thấy dấu hiệu.

| Giả thuyết của người chơi | Phép thử và phản hồi |
|---|---|
| Pin yếu vì đang trong bóng | Xác nhận nắng tới panel. Trong tình huống MICA, nắng vẫn tới nhưng công suất có tải thấp; cần so trước/sau khi xử lý bụi |
| Khôi phục nguồn là đủ | Dùng đường chẩn đoán giới hạn dòng. Nguồn ổn định, nhưng kiểm tra bo vẫn lỗi lặp; mở bước khoanh vùng |
| Bo lỗi chỉ cần reset | Reset qua chế độ phục hồi cho phép; lỗi dai dẳng tái hiện. Chọn bo cần cô lập/thay và xác minh bản sao |

Chọn giả thuyết thiếu bằng chứng cho kết quả để xem lại, không mất mẫu hoặc phụ tùng. Người chơi đưa hai kết luận độc lập: nguyên nhân thiếu nguồn và lý do vẫn không boot sau khi cấp đủ. Có thể đổi thứ tự nếu tuân khóa an toàn; không bỏ phép thử cần cho kết luận. Lịch sử phơi nhiễm hư cấu gợi hư hỏng tích lũy; phép thử tại chỗ xác định bo lỗi, không tự chứng minh liều hay nguyên nhân tuyệt đối.

**Bất ngờ:** lau pin mở chẩn đoán, không chữa phần cứng. MICA trở lại giới hạn tải/mất một phần log nhưng vẫn có ích. PIP thôi đùa về tuổi thiết kế, đề nghị chỗ đỗ cho bạn mới.

**Đạt:** MICA an toàn, chuyển động đã được xác minh. Hộp thu bụi của trạm cũ có gioăng mòn được cách ly/sửa; không giữ nguyên tuyến tái nhiễm.

### Chương 4 — Ánh sáng không đủ

**Nhịp:** tự tin rồi căng thẳng có căn cứ. **Mở:** Rìa Bóng Che, test tải căn cứ.

1. Lắp mô-đun còn thiếu: tải thử duy trì sự sống, nhà kính, cấu kiện bảo vệ và tuyến bàn giao.
2. Chạy đồng thời. Nếu khoảng nhiệt không đủ, hệ thống giảm tải dù pin còn. Bụi trên mặt tản nhiệt đã được báo trước góp phần giảm dự phòng.
3. Dùng map cũ MICA cùng đo mới để lập tuyến tới điểm bảo trì qua vùng lạnh.
4. Chọn tải trì hoãn, chuẩn bị sưởi/dự phòng/đường rút. Chỗ tối không luôn tốt hơn cho robot.
5. Kiểm tra mặt/đầu nối, lắp phần tản nhiệt mở rộng đã có trong thiết kế hoặc phục hồi bề mặt EDS tương thích.

**Không ép thất bại:** ai đã có đủ khoảng nhiệt được công nhận đạt test; chuyển sang xác minh dự phòng và tuyến MICA. Không script phá thiết bị/đổi số để giữ cảnh báo.

**Cửa sổ:** giai đoạn nhiệm vụ có trên lịch và preview trước chuyến đi. Không timer trong lúc đọc/cutscene, không bão ngẫu nhiên phút cuối. **Đạt:** biết nguyên nhân, phương án/tuyến đã chuẩn bị, MICA có điểm an toàn/lối rút.

### Chương 5 — Ba người thợ

**Nhịp:** căng thẳng có kiểm soát → thành tựu. **Mở:** nghiệm thu.

1. Xếp thứ tự tải, giữ nguồn an toàn, trì hoãn tải không cần ngay.
2. Bạn đi cùng PIP tới điểm lắp. PIP chống chân và giữ tải. Phi hành gia lắp đầu nối đã cô lập.
3. Giao MICA waypoint/công việc ngắn ở khe hẹp hợp thân. Preview đường ra và tải trước xác nhận.
4. Người chơi xác nhận kiểm tra từng bước; MICA không tự làm toàn bộ đoạn kết. Có thể thu hồi/đổi cách tiếp cận khi vướng.
5. Khôi phục tải theo thứ tự, theo dõi điện/nhiệt, tải sống giả lập, lịch nhà kính/tồn kho, cấu kiện bảo vệ và tuyến sạch.
6. Chạy một chuyến bàn giao thử mới làm bằng chứng hệ thống thực sự vận hành.

Chưa đạt thì hoãn nghiệm thu, giảm tải và sửa. Không ép MICA hy sinh hay phê duyệt trạm thiếu an toàn. Đây là bài tập mô phỏng, không robot chứng nhận công trình thật.

### Kết — Những người đến trước

Một ảnh sao lưu MICA chụp trước khi PIP tới cho thấy mốc thực địa giữa đất trống, nhiệm vụ “Chuẩn bị vị trí cho những người sẽ đến sau”. Một góc ảnh còn lỗi, không phục hồi mọi thứ.

Bạn nhận ra các mốc từng giúp tìm đường. Khảo sát MICA đã được bạn kiểm tra/cập nhật, không là dữ liệu thần kỳ cứu mọi tình huống.

PIP: “Tôi tưởng chúng ta đến đây để bắt đầu.”
MICA: “Công việc được tiếp tục.”

Bạn đặt chỗ đỗ MICA cạnh PIP, hoàn tất báo cáo và đưa mẫu niêm phong về tàu. Đoạn kết ghi nhận LANTERN sẵn sàng cho công việc tiếp theo khi phi hành đoàn chuẩn bị trở về quỹ đạo.

Hình ảnh cuối là dấu chân của bạn bên cạnh hai hàng dấu bánh. PIP nói mình đã chuẩn bị một câu đùa, ngừng một nhịp rồi để dành cho lần gặp sau.

## 9. Vật lý và giới hạn mô hình

### Đơn vị, chuyển động và lắp ráp

Mét, giây, kilogram, newton; joule/Wh có đổi rõ; kelvin khi tính nhiệt. Gravity theo DESIGN.md. F=m·a và W=m·g: giảm trọng lượng không giảm khối lượng/quán tính.

Rover có giới hạn bám/dốc và tải làm đổi trọng tâm; không cần terramechanics đầy đủ. Kiểm tra vùng chân đỡ/mô-men cánh tay, cảnh báo sớm/giảm tốc trước lật. Habitat lớn đi bằng bệ/tời; tay PIP chỉ kẹp linh kiện phù hợp, không nhấc cả căn cứ. Builder khai báo/tune khối lượng, tải và reach trong DESIGN.md.

### Điện

P_solar = S × A × eta × max(0,n·s) × visibility × dustFactor.

dE/dt = P_solar + P_external − P_drive − P_arm − P_heater − P_science − P_idle, tính thêm hiệu suất sạc/xả. Nếu E là Wh thì dt tính giờ. Không cộng W thẳng vào %.

Thông số hiệu suất/bụi/diện tích có nguồn hoặc nhãn giả định. Chế độ cơ bản thanh dễ hiểu; chế độ khoa học có Wh/W và dự đoán đường về. Không trừ pin tùy ý vì chương phải khó.

### Nhiệt

C·dT/dt = Q_solar + Q_internal + Q_conduction + Q_environment − Q_radiated. Bức xạ phát tỷ lệ epsilon·sigma·A·T^4, dùng K.

Không có gió làm mát ngoài chân không; quạt trong thể tích kín là trường hợp khác. Nhiệt có quán tính, không nhảy tức thì ở ranh bóng. Diviner là nhiệt bề mặt tham chiếu; nhiệt bo/pin tính riêng với giới hạn từng thiết bị. Hiệu quả phủ bụi/tản nhiệt được hiệu chỉnh, không gọi mô hình này là công cụ phân tích nhiệm vụ thật.

### Bụi và bức xạ

Bụi = state bề mặt/contact graph; particle vẽ không quyết định gameplay. Tách giảm thu điện, kẹt/mòn và lỗi bo. Mỗi loại có phép đo/cách can thiệp riêng.

MICA có lịch sử phơi nhiễm hư cấu trước campaign. Phân biệt SEE phục hồi được với lỗi tích lũy hoặc SEE phá hủy; không nói mọi SEE đều thoáng qua. Kịch bản chọn bo lỗi dai dẳng, cần thay/cô lập. Diviner/LROC không đo liều MICA; DONKI không tự chuyển thành liều linh kiện. Che chắn giảm rủi ro theo mô hình, không trường lực tuyệt đối; bóng tối không tự chặn hạt.

### Ánh sáng/thời gian

Dùng ephemeris/tọa độ/epoch được xác minh cho chế độ khoa học, hoặc lịch ánh sáng mô phỏng ghi nhãn. Bản đầu được dùng lịch mô phỏng có nhãn; không gọi là dự báo NASA. Illumination fraction không là chuỗi video để nội suy; bóng động không phải PSR. Đồng hồ/bước nhảy checkpoint/thời điểm dữ liệu đều xem được.

## 10. Tích hợp dữ liệu NASA

Nguồn/credit/tình trạng chuẩn ở DESIGN.md → Data. **Demo dự thi và campaign đều cần LOLA và Diviner được nhập thật**, có manifest và điều khiển được ít nhất một quyết định có hậu quả từ mỗi nguồn. LROC/ShadowCam là lớp đối chiếu chọn theo quyền sản phẩm; EDS/radiation là tài nguyên kỹ thuật, không dữ liệu đo của phiên chơi.

**Quyền quyết định của các lớp:**

- Giữ một đoạn khảo sát có hai tuyến đi được lấy cao độ/dốc từ LOLA đã kiểm tra; dốc thật sau đổi hệ ảnh hưởng tải/đường đi. Sổ hiển thị đúng lớp dùng để tính. Không dùng đường dựng tay rồi gắn số dốc NASA từ chỗ khác.
- Chọn vùng có sản phẩm Diviner với phạm vi và độ phân giải phù hợp để đối chiếu hai môi trường nhiệt. Giá trị tham chiếu/bucket có nguồn tham gia đầu vào dẫn nhiệt/lập dự phòng sưởi; thay đầu vào phải đổi dự đoán chuyến đi. Chọn đúng ý nghĩa thống kê của sản phẩm, không coi map nhiệt theo mùa là phép đo đúng giây trong game.
- Sàn căn cứ, đoạn dạy lái và crater nhỏ hư cấu được phép sửa hình học. Collision dùng địa hình đang thấy. Nơi đã sửa phải gắn nhãn “địa hình nhiệm vụ đã điều chỉnh”, không lấy mẫu từ điểm hư cấu rồi ghi là đo thực. Vùng hiệu chỉnh không thay cho đoạn LOLA bắt buộc.

### Pipeline offline cần triển khai sau duyệt

1. Chọn crop nhỏ đủ resolution/chất lượng, ghi product ID/version, bounds/projection/frame/datum/ngày.
2. Tải gốc bằng công cụ tiền xử lý, lưu checksum/documentation. Không tải raster GB trong browser.
3. Cắt/chuyển local frame có origin/hướng trục/đơn vị; resample giữ độ cao/dốc hợp lý. Không phóng dốc cho đẹp rồi gọi là terrain thật.
4. Đồng đăng ký Diviner với no-data mask; không upscale thô thành độ chính xác từng bánh xe.
5. Xuất terrain/texture/bảng môi trường nhẹ và manifest. Tách scientificReference khỏi authoredGameplay.
6. Điểm đo/mẫu/log nhiệm vụ mang nhãn simulatedObservation, dù thiết kế có căn cứ khoa học.
7. So điểm kiểm tra, min/max, trục, đơn vị và ảnh chồng trước bật nhãn NASA-derived.

### Thiếu dữ liệu/mạng

Snapshot đóng gói chơi khi mất mạng sau khi asset đã tải đủ trong phiên; không API key. Chưa cam kết khởi động lại trang hoàn toàn offline. Ô no-data là chưa biết, không 0 K hay 0°C. Pipeline chưa nhập thì fixture phải ghi “mô phỏng”, không nhận đã tích hợp và chưa đạt tiêu chí demo dự thi. Chưa xác minh quyền/credit ảnh thì không ship ảnh đó.

### Credit nhìn thấy được

Trong sổ có “Dữ liệu này đến từ đâu?”: agency/instrument, product, ngày, resolution/phạm vi và biến đổi của game. Cuối game có Data & Sources. Submission chỉ liệt kê tập thực sự dùng, không đếm planned thành kết quả.

## 11. Hệ thống căn cứ và nghiệm thu

Phi hành gia và robot làm việc ngoài trời. Các mô-đun dùng tải giả lập để nghiệm thu trước khi phi hành gia sử dụng. Tàu đổ bộ cung cấp chỗ trú trong thời gian lắp trạm.

| Hệ thống | Hành động | Kiểm tra đạt |
|---|---|---|
| Điện | Pin/hướng/cáp/dự phòng/lịch tải | Lịch tải và dự phòng đường về đạt |
| Nhiệt | Hướng/cách nhiệt/sưởi/tản nhiệt | Trong giới hạn cấu hình qua bài thử |
| Duy trì sự sống | Ghép mô-đun kín, thử tải và độ kín | Đạt thử, không mở khoang áp ra ngoài |
| Thực phẩm | Điện/nước/nhiệt/lịch nhà kính | Lịch đạt và tồn kho kê khai, cây nhỏ không thay bữa ăn |
| Che chắn | Cấu kiện định sẵn/vị trí thiết bị | Test cấu hình mô phỏng đạt; không tuyên bố liều an toàn thật |
| Bụi | Sửa hộp/gioăng/tuyến bàn giao | Chuyến thử không tái nhiễm điểm nhạy vượt ngưỡng khai báo |
| Khoa học | Mẫu đối chứng/ngữ cảnh/phép đo | Kết luận đúng mức, ghi điều chưa biết |

### Bài toán quản lý bắt buộc

Bài test có ba pha theo DESIGN.md: ổn định nguồn, chạy công việc và dự phòng khi bóng che. Người chơi xếp lịch ngắn và xem hệ quả trước khi xác nhận. Pin/giới hạn tản nhiệt dùng chung cho mô-đun sống, đèn/bơm nhà kính và thiết bị bảo trì; nước dùng chung giữa dự phòng sinh hoạt và nhà kính. Nước sử dụng cho tải giả lập sinh hoạt là ngân sách cần dành trước, không ngụ ý có người đang tiêu thụ nước ở trạm.

- **Giữ ngưỡng an toàn:** tải sống tối thiểu và lượng nước sinh hoạt dự phòng được bảo vệ. Phương án vượt ngưỡng báo chưa đạt và cho sửa. Không đổi an toàn lấy điểm.
- **Lựa chọn thực:** chạy nhà kính sớm giúp đúng lịch thử sinh trưởng nhưng dùng điện/nước ngay; dời sang lúc đủ nắng giảm rút pin, cần bù lịch trước nghiệm thu. Dùng EDS lúc này cũng lấy năng lượng và chiếm lượt bảo trì. Dự phòng thực phẩm đóng gói và cây thử được theo dõi riêng.
- **Che chắn có giá:** đặt cấu kiện ở vị trí được duyệt gần kho giúp chuyến lắp ngắn nhưng giao cắt tuyến chuyển hàng; vị trí sạch khác cần đi dài hơn và tốn điện/thời gian lắp. Cả hai phải vượt phép kiểm tra cấu hình bảo vệ trước khi đạt; không cho bỏ tấm để lấy điểm năng lượng.
- **Hệ quả:** chạy thử cho thấy biểu đồ dự phòng từng pha, nhiệt, lịch nhà kính và tuyến sạch; người chơi đổi phương án rồi chạy lại. Không biến các hệ thống thành ô pass độc lập không cạnh tranh tài nguyên.

Builder chọn ngưỡng/công suất/lượng nước và lịch sao cho có ít nhất hai nghiệm khả thi, ghi ở DESIGN.md. Mô phỏng sinh trưởng dài hạn không phải điều kiện để thực hiện bài test này.

## 12. Campaign và demo

Chiến dịch đầy đủ là đích sản phẩm theo DESIGN.md. Demo hackathon là tuyến riêng có nhãn, không gọi demo là campaign đã xong.

Demo đi từ cutscene quỹ đạo, tiếp đất và EVA tới gặp PIP, dựng nguồn, so tuyến LOLA và tham chiếu nhiệt Diviner, lấy mẫu và ghi sổ, cứu MICA, nghiệm thu và đưa mẫu về tàu. PIP tự đi theo người chơi sau cuộc gặp.

**Cổng giao demo dự thi:** (1) LOLA và Diviner có import/credit thật và quyết định quan sát được; (2) tự chọn phép kiểm tra để tách hai lỗi MICA; (3) ít nhất một lựa chọn xếp lịch điện/nhiệt giữa tải sống và nhà kính, một lựa chọn phân bổ nước và một thao tác đặt cấu kiện che chắn có đánh đổi; (4) chạy lại bài nghiệm thu được; (5) văn bản/phụ đề Anh–Việt theo DESIGN.md. Dùng mô-đun có sẵn và rút ngắn tuyến demo để giữ phạm vi; không cắt các cổng trên rồi gọi bản rút gọn là demo đã đạt.

Crater chồng lớp, hành trình lạnh dài và MICA qua khe thuộc phần mở rộng campaign sau demo. Kế hoạch triển khai tách rõ mốc demo và hoàn tất campaign.

## 13. Kiến trúc đề xuất, phần giao builder

Thiết kế này không yêu cầu cài package ngay.

- Vite/React/TypeScript hiện có; Babylon.js đề xuất cho scene/camera/picking/animation và lớp vật lý phù hợp sau chọn version. Không khóa API/plugin/version.
- Simulation điện/nhiệt/bụi/thiết bị độc lập renderer, đơn vị rõ, bước ổn định. Shader/animation không quyết định nhiệt/cổng nhiệm vụ.
- Mission graph có gates/bằng chứng/checkpoint/recovery; không hardcode người chơi chắc chắn thất bại.
- Dialogue cây soạn trước theo nhân vật/nhiệm vụ/humor, có subtitle/skip/log. Manh mối luôn có đường đọc lại. UI, hội thoại, mục tiêu, sổ và credit dùng khóa bản địa hóa ngay từ đầu.
- Asset GLB nguyên bản nhẹ, terrain/props tách lớp; LOD/instancing/texture budget theo máy thử khai báo.
- Save local có version ở checkpoint và kết thúc lắp/sửa quan trọng; Resume/Restart checkpoint/Reset có xác nhận. Không account/backend.
- Desktop WebGL2 là đích đầu, có thông báo không tương thích; mobile/gamepad/XR hoãn.
- Camera tránh vật cản, text scale, remap, reduced motion, ít thoại và trợ giúp. Thông tin không chỉ dựa màu/âm thanh.
- Performance budgets và giới hạn cấu hình do builder xác lập trước tuyên bố tối ưu; không hứa 60fps mọi máy.

Builder chọn version, scene partition, controller, crop NASA theo tiêu chí, conversion tools, art implementation và tuning rồi ghi vào DESIGN.md. Không tự đổi nhập vai, trạng thái/cách cứu MICA, campaign/demo, ranh giới dữ liệu thật/giả, safety và các hệ căn cứ.

## 14. Tiêu chí kiểm chứng khi triển khai

- Đi hết campaign/demo đúng nhãn, không softlock khi dùng phụ tùng; có hai nghiệm cho đường/bố trí và cấu hình tốt được công nhận.
- MICA bất động tới cứu; không log/effect kể nó đang chạy khi mất nguồn. Làm sạch không chữa bo; bản sao ký ức được xác minh.
- Humor không thay manh mối/cảnh báo/điều kiện/số mô phỏng.
- Điện/nhiệt/bề mặt/bức xạ khác đại lượng; có tình huống pin còn nhưng cần giảm nhiệt.
- Nhiệt có quán tính; trọng tâm/tải ảnh hưởng lắp; đọc/skip không làm cạn pin; nhảy lịch có nhãn và cập nhật nhất quán.
- NASA LOLA/Diviner thật có manifest và QA; no-data không giả thành đo thật; credits khớp asset dùng.
- Không bóng tối = khiên, lạnh = đủ bằng chứng băng, một mẫu = tuổi tuyệt đối.
- Nghiệm thu kiểm tra căn cứ; chưa đạt thì sửa, không đáp bất chấp an toàn.
- Khi triển khai, test tập trung đơn vị vật lý, chuyển trạng thái/recovery và traceability dữ liệu; playthrough kiểm tra cảm giác/thoại. Tài liệu chưa tuyên bố các test gameplay này đã chạy.

## 15. Nguồn kiểm chứng

Kiểm tra ngày 2026-11-05; lịch/link có thể đổi. Link dataset là điểm vào chọn asset, chưa chứng nhận raster đã nhập.

1. [Challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/).
2. [Artemis IV](https://www.nasa.gov/mission/artemis-iv/).
3. [Lunar South Pole](https://www.nasa.gov/reference/moonbase-environment/).
4. [LOLA DEM](https://pgda.gsfc.nasa.gov/products/81): 5m/pixel, projection/đơn vị/citation công bố ở nguồn; không tải toàn bộ vào browser.
5. [Diviner](https://www.diviner.ucla.edu/data): polar maps, citation Williams et al. (2019).
6. [LROC/ShadowCam](https://www.nasa.gov/missions/lro/nasa-moon-camera-mosaic-sheds-light-on-lunar-south-pole/).
7. [Illumination Map](https://science.nasa.gov/photojournal/south-pole-illumination-map/).
8. [Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html).
9. [Moon Craters](https://science.nasa.gov/moon/lunar-craters/).
10. [EDS demonstration](https://www.nasa.gov/image-article/nasas-dust-shield-successfully-repels-lunar-regolith-on-moon/): thực nghiệm trên mặt phù hợp, không chữa mọi lỗi.
11. [Avionics](https://www.nasa.gov/smallsat-institute/sst-soa/small-spacecraft-avionics/): bức xạ tích lũy/sự kiện đơn và thiết kế phần cứng.
12. [Radiation Engineering](https://www.nasa.gov/reference/jsc-radiation/).
13. [Thermal Control](https://www.nasa.gov/smallsat-institute/sst-soa/thermal-control/).
14. [Thermal impacts of dust](https://tfaws.nasa.gov/wp-content/uploads/TFAWS2024-PT-4-Paper.pdf): phụ thuộc bề mặt/điều kiện, không một hệ số chung.
15. [Cargo planning](https://www.nasa.gov/news-release/nasa-plans-to-assign-missions-for-two-future-artemis-cargo-landers/): phân biệt kế hoạch thật/câu chuyện vận chuyển của game.

## 16. Cổng duyệt

Người dùng duyệt tài liệu này cùng DESIGN.md trước kế hoạch triển khai. Ghi tài liệu vào git không phải duyệt sản phẩm. Sau duyệt, bước tiếp theo là superpowers:writing-plans. Bước thiết kế hiện tại không cài engine, sinh asset hoặc sửa App.tsx.
