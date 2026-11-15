# HLS — chân đáp gập kín trong thân

Ngày: 2026-11-13. Trạng thái: người dùng đã duyệt hướng A và bản thiết kế qua annotation trong chat.

## Ý định
Khi bay, giấu hoàn toàn sáu chân và bàn chân sau nắp khoang cùng đường cong, màu và vật liệu với thân tàu. Chỉ còn đường ghép mảnh. Khi mở, cơ cấu có khớp nối rõ, chuyển động mượt và không giao với động cơ hay thang máy.

## Approaches
- **A — Gập lên hốc dọc thân, nắp bản lề (người dùng chọn):** bàn chân có khớp riêng; chân xoay lên vào khoang. Cơ khí dễ đọc ở góc cận, cần dựng lại hốc và kiểm tra toàn bộ quỹ đạo gập.
- **B — Chân co lồng, nắp trượt:** gọn nhưng thêm đoạn chân lồng và ray trượt; không chọn.

## Hình học và chuyển động
- Tách bàn chân khỏi mesh chân hiện tại; thêm trục bản lề, gối đỡ và chặn khóa nhìn thấy. Điều chỉnh thanh giằng/khớp theo đường gập, không kéo giãn chi tiết cứng để giả chuyển động.
- Tạo khoang có chiều sâu và miệng mở thật trong phần vỏ thân liên quan; không chỉ phủ nắp lên vỏ kín hoặc cho chân xuyên qua vỏ. Nắp cong khớp bề mặt thân khi đóng, khớp nắp gắn vào mép khoang.
- Thu: mở nắp nếu đang đóng → bàn chân xoay dọc theo cụm chân → chân gập lên vào hốc → nắp đóng sau khi toàn bộ chân đã nằm trong khoang. Động tác thu được xem ở trạng thái tàu đã rời đất.
- Mở: nắp mở hết → chân xoay xuống và ra ngoài → bàn chân về mặt ngang, khóa tư thế đáp. Nắp giữ mở trong trạng thái chân triển khai để không kẹp chân; lựa chọn này do người thiết kế đề xuất.
- Các đoạn chuyển động nối tiếp có tăng/giảm tốc nhẹ, giảm tốc ở điểm khóa; Pause giữ toàn bộ khớp và đổi chiều không giật. Đề xuất 6–8 giây mỗi chiều trong preview, điều chỉnh sau khi xem chuyển động thật.
- Vị trí hốc, kích thước nắp, góc khớp và thời điểm cụ thể do người triển khai chọn theo kiểm tra hình học. Giữ khoảng trống phía trước cho thang máy và khoảng hở quanh khoang động cơ.

## Phạm vi và giới hạn
- Thay cơ cấu chân của candidate HLS trong preview hiện có; chưa thay model ở game chính. Không đổi động cơ, thang máy, Trái Đất, vầng sáng, địa hình hoặc gameplay ngoài những điều chỉnh cục bộ cần cho khớp chân.
- Cơ cấu khoang kín là tái dựng phục vụ game, không được gọi là CAD hay cơ cấu HLS chính thức. Không suy diễn giảm lực cản trong môi trường chân không.
- Duy trì LOD gần/xa, vật liệu và tải asset hiện có. Bổ sung mesh cho khớp/nắp khi cần, ghi lại dung lượng, tam giác và draw calls thực tế thay vì giữ giới hạn mesh cũ bằng cách bỏ khớp.

## Điều kiện nghiệm thu
- Góc bên và đáy ở trạng thái thu: không thấy chân/bàn chân lòi khỏi vỏ, không lộ lỗ khoang; nắp không nhấp nháy với vỏ.
- Kiểm tra toàn bộ chuyển động cả hai LOD: chân/bàn chân/thanh giằng không xuyên động cơ, vỏ khoang, nắp hoặc thang máy; bản lề luôn nối đúng. Kiểm tra khoang thật, không chỉ khoảng hở quanh động cơ như bản trước.
- Trạng thái mở: bàn chân nằm ngang, tiếp đất đúng cao độ và giữ ổn định; khớp không tách rời. Pause, tiếp tục, đảo chiều và đặt ngay trạng thái đầu/cuối đều đồng bộ.
- QA asset, TypeScript/build và các kiểm tra thang máy liên quan; chụp góc bên/đáy khi đóng, góc cận khi mở và quay trọn chu trình thu/mở.
