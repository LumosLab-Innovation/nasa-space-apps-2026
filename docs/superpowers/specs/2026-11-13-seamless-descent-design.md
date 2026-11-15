# Chuyển tiếp điện ảnh từ quỹ đạo sang hạ cánh — hướng A

Ngày: 2026-11-13. Trạng thái: chờ duyệt thiết kế cụ thể.

## Mục tiêu và lựa chọn

Người dùng chọn đoạn camera điện ảnh ngắn rồi bàn giao điều khiển hạ cánh, không tối màn hình và không hiện loading lần hai. Giữ model Orion/HLS đã duyệt, Trái Đất/vầng sáng, hình menu, các cảnh mở đầu và cảnh Apollo. Chỉ thay đoạn cuối pha đốt hãm và phần vào cảnh đáp.

- **A — đã chọn:** chuẩn bị hai scene trước, dùng một đường camera chuyển tiếp và căn khớp hình tàu để nối cảnh. Tận dụng địa hình và hệ điều khiển hiện có; phải quản lý trạng thái hai scene cẩn thận.
- **B — không chọn:** mô phỏng một chuyến bay liên tục trong một hệ tọa độ/địa hình thống nhất. Phạm vi lớn, thay sâu mô phỏng và hệ tọa độ.

Đây là thay đổi phối hợp giữa chuẩn bị scene, camera, HUD và bàn giao input; không phải chỉ xóa lớp fade.

## Hiện trạng đã kiểm tra

`missionStartup.ts` tải bytes asset ngay từ đầu nhưng chỉ dựng cảnh bề mặt sau khi `orbit()` kết thúc, qua `withLoadingScreen` lần hai. `landingScene.ts` hiện fade đen khoảng 1,2 giây rồi dispose scene. Camera đốt hãm cập nhật ngay theo mục tiêu và HLS được thu nhỏ theo khoảng cách. Cảnh đáp tạo một ArcRotateCamera mới và `landStart()` đặt h=300 m, vy=-12 m/s, vx=4 m/s, tilt=0, nhiên liệu đáp=10.000 kg.

Hai pha không cùng mô hình vật lý: `BrakeState.v` không phải tốc độ rơi `LandState.vy`; nhiên liệu hãm và ngân sách nhiên liệu đáp cũng khác nhau. Không chép trực tiếp một scalar vận tốc hay nội suy phần trăm giữa hai bình nhiên liệu.

## Trải nghiệm đề xuất — khoảng 5 giây

Các con số dưới đây là đề xuất của người thực hiện, không phải thông số NASA.

| Thời gian | Hình ảnh và âm thanh | Điều khiển/HUD |
|---|---|---|
| 0–1,5 s | Ở đoạn cuối đốt hãm, camera bắt đầu tiến về HLS; tàu trở thành tâm khung hình. Orion đã ở phía sau, không teleport trở lại. | Hiện nhãn nhỏ “Đang chuyển sang dẫn đường hạ cánh”. Máy lái tiếp quản đoạn chuyển tiếp. |
| 1,5–3,5 s | Camera vòng nhẹ sang góc nhìn đáp; HLS dựng dần về tư thế thẳng đứng, bề mặt tiến lại gần. | HUD hãm rút gọn, HUD đáp xuất hiện dần. Một chỉ số độ cao duy nhất. |
| 3,5–4,3 s | Hai scene nối ở cùng kích thước và hướng tàu trên màn hình. Nền địa hình hòa ngắn tối đa khoảng 0,6 s, không có lớp đen. | HUD và nút Pause/Settings không bị nhân đôi. |
| 4,3–5 s | Camera ổn định ở góc điều khiển đáp, chuyển động chậm lại ở cuối. Tiếng động cơ vẫn liên tục. | Chế độ tay: “Bạn có quyền điều khiển · A/D nghiêng · SPACE lực đẩy”. Chế độ tự động: tiếp tục lái tự động. |

Khởi động chuyển tiếp ở vùng cuối pha hãm, **đề xuất ngưỡng 500 m**, và kết thúc tại đúng trạng thái vào màn đáp hiện có (300 m, vy=-12, vx=4, tilt=0). Như vậy người chơi vẫn có đủ độ cao luyện đáp. Đoạn cầu nối là chuyển động dẫn đường được đạo diễn trong game, không tuyên bố là mô phỏng quỹ đạo tự do chính xác; không tích phân đồng thời cả `brakeStep` và `landStep` trong cùng đoạn.

Người thực hiện thiết kế đường vị trí Hermite và quaternion của tàu từ pose thực tại lúc vào chuyển tiếp tới pose bàn giao, bảo đảm vị trí/hướng liên tục, độ cao giảm đơn điệu và vận tốc cuối khớp trạng thái đáp. Đường camera có easing ở đầu/cuối; không zoom giật, lắc mạnh hoặc rung màn hình. Không cần blur để che lỗi.

## Chuẩn bị cảnh và quyền sở hữu

- Loading đầu tiên của Chơi mới phải bao gồm dựng cả cảnh quỹ đạo lẫn cảnh bề mặt, vật lý, giải mã texture và làm nóng shader cần cho đáp. Chỉ báo 100% khi các bước này thực sự xong. Tiếp tục chỉ chuẩn bị cảnh cần khôi phục.
- Cảnh bề mặt chuẩn bị ở chế độ **dormant**: không chạy đồng hồ, survival, hội thoại, AI, physics bước thời gian, input, autosave hoặc triển khai chân đáp. Render làm nóng nếu cần phải nằm trong chế độ này, không làm gameplay chạy ngầm.
- Một coordinator sở hữu tiến độ chuyển tiếp, render và input. Không để hai render loop hoặc hai bộ xử lý phím cùng hoạt động khi đổi scene.
- Ngay khi vào cầu nối, thôi nhận input lái tay; scene cũ vẫn được render cho tới khi frame mới đã sẵn sàng. Khi bàn giao, bật cập nhật gameplay của scene mới và dispose tài nguyên scene cũ sau frame thành công, không trước.
- `intro=only` dùng để debug vẫn xem được intro độc lập; không vô tình tạo/bỏ rơi scene bề mặt. Bỏ qua hạ cánh vào cảnh bề mặt đã chuẩn bị, không đi qua loading lần hai.

## Căn khớp hình ảnh

- Không copy tọa độ tuyệt đối: scene quỹ đạo dùng hệ quanh Mặt Trăng, cảnh đáp dùng mét cục bộ. Dùng frame cục bộ của tàu và tỉ lệ chiếu lên màn hình để chuyển camera/pose.
- Căn tâm tàu, kích thước chiếu, trục dọc, hướng camera và đường chân trời tại điểm nối. Tính cả scale HLS thay đổi trong cảnh quỹ đạo; không bỏ cơ chế scale rồi để tàu phình ra.
- Giữ một hình tàu rõ tại điểm nối. Nếu dùng hòa hai render target, đồng bộ silhouette và pose của hai bản HLS, HUD render một lần; không để thấy hai bóng tàu. Hòa toàn màn hình sang màu đen bị loại trừ.
- Sắc độ/ánh sáng có thể chuyển nhẹ trong đoạn nối để đi từ cảnh xa tới cảnh bề mặt; giá trị ánh sáng/Trái Đất ở các cảnh ổn định vẫn như trước. Mặt Trăng không có khí quyển nên không dùng mây hoặc sương để che cảnh.
- Tại frame cuối, camera cảnh đáp nhận chính pose/FOV cuối của cầu nối, sau đó mới tiếp tục logic chase hiện có một cách liên tục.

## HUD, nhiên liệu, cơ cấu và âm thanh

- Độ cao AGL hiển thị theo đường chuyển tiếp, kết thúc 300 m; không có bước nhảy về lại 300 sau khi đã xuống thấp hơn.
- HUD đổi tên rõ từ “Vận tốc tiếp cận” sang “Tốc độ rơi”; không tween hai đại lượng khác nhau như một số duy nhất.
- Trong lúc thay HUD, ẩn thanh nhiên liệu hãm rồi hiện **“Nhiên liệu đáp”** với ngân sách 10.000 kg hiện tại. Đây là phân chia gameplay hiện có, không phải mô tả tank thực của HLS. Không tạo cảm giác cùng một bình tự nạp từ phần trăm thấp lên 100%. Chưa thay cân bằng nhiên liệu/thrust của màn đáp.
- Duy trì trạng thái chân/cửa khoang giữa hai bản HLS. Đề xuất bắt đầu mở chân ở cuối cầu nối (khoảng giây 3,5); bàn giao cả vị trí lẫn vận tốc animation để tiếp tục đủ chu kỳ 7 giây. Không gọi lại reset rig về 0 ở đầu màn đáp. Thang máy luôn thu kín khi bay.
- Máy lái giữ lực đẩy an toàn tới lúc bàn giao. Khi nhận quyền điều khiển, không reset throttle/plume về 0; cho lực đẩy chuyển theo rate hiện có tới input người chơi. Giữ SPACE xuyên chuyển tiếp không gây hụt động cơ; phím nhấn một lần cũ không kích hoạt lại. A/D trước lúc bàn giao không làm tàu nghiêng ngầm.
- Nhạc không khởi động lại. Hội thoại/radio đang nói được hoàn tất hoặc chuyển tiếp theo một chủ sở hữu, không chồng lời và không bị cắt khi dispose scene. Không chèn thoại dài mới buộc người chơi chờ màn đen.

## Pause, bỏ qua, lỗi và hiệu năng

- Pause/Settings sử dụng được suốt 5 giây. Pause dừng tiến độ camera, vị trí tàu, animation và thời gian game; resume tiếp tục đúng frame. Đóng Settings không bàn giao sớm.
- Bỏ qua hoặc về menu hủy coordinator một lần, tháo input/render observers, giải phóng cả scene/target không còn dùng. Không lưu game từ cảnh dormant hoặc giữa cầu nối.
- Lỗi asset/shader phát hiện ở loading đầu phải hiện Retry/Back tại đó; không bắt đầu chuyến bay với cảnh đáp chưa sẵn sàng. Không tự chuyển sang đen/loading lần hai để giấu lỗi. WebGL context loss dùng đường phục hồi riêng và được kiểm tra như tình huống lỗi, không coi là chuyển tiếp bình thường.
- Chi phí: loading đầu dài hơn và bộ nhớ đỉnh tăng do giữ hai scene. Chỉ render cả hai trong cửa sổ hòa ngắn; dùng render target cấp phát một lần, tối đa kích thước viewport và có trần độ phân giải. Giảm chất lượng target nếu cần, không thay bằng màn đen. Đo thời gian frame/bộ nhớ trước và sau trên cùng máy, không cam kết 60 FPS khi chưa đo.

## Nghiệm thu

1. Quay clip từ cuối hãm tới khi người chơi thực sự nghiêng/đẩy tàu: không frame đen, không loading lần hai, không nhảy kích thước/pose tàu rõ rệt.
2. Frame cuối cầu nối và frame đầu điều khiển khớp camera, h/vx/vy/tilt/throttle và trạng thái animation; không bước physics lớn do thời gian tích lũy.
3. QA cả lái tay và tự động, SPACE giữ xuyên đoạn nối, A/D chỉ bắt đầu tác động sau bàn giao; Pause/Settings đầu/giữa/cuối, skip và về menu.
4. Mô phỏng tải chậm/lỗi: scene chưa sẵn sàng thì vẫn ở loading ban đầu; dormant scene không làm thay đổi save, giờ game, tài nguyên hay hội thoại.
5. Continue vẫn khôi phục cảnh bề mặt trực tiếp, không phát lại cầu nối; retry đáp giữ hành vi hiện tại.
6. Không leak scene, input listener, GUI, audio owner hoặc render target khi new → menu → new/continue nhiều lần.
7. Ảnh/clip ở cùng kích thước viewport, có ghi frame timing lúc nối. Build và kiểm thử phù hợp phải qua.

## Quyền quyết định khi triển khai

Người thực hiện chọn đường cong camera cụ thể, ngưỡng gần 500 m sau khi đo shot, cấu trúc coordinator và cách quản lý render target. Giữ ý đồ 4–6 giây, bàn giao ở 300 m và không đen/loading lần hai. Nếu căn hai scene không đạt, phải sửa bố cục/đường camera, không âm thầm chuyển sang hướng B hay thay địa hình/model đã duyệt.

Các file dự kiến liên quan: `missionStartup.ts`, `landingScene.ts`, `surfaceScene.ts`, `finalDescent.ts`, `introDirector.ts`, HUD/nội dung VI–EN và một coordinator riêng. Những đề xuất này chưa phải thay đổi code.

Rà soát thiết kế độc lập: không còn câu hỏi quan trọng cần làm rõ trước khi lập kế hoạch; các lựa chọn triển khai còn lại đã được giao cho người thực hiện. Chưa triển khai trước khi người dùng duyệt tài liệu này.
