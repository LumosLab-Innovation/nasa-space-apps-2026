# Menu chính, Pause và Settings của Pip & Mica

Ngày 11/11/2026 · Thiết kế đề xuất để duyệt

## Mục đích

Người chơi có thể vào nhiệm vụ và chỉnh cài đặt bằng nút bấm ngay từ màn hình đầu. Hai nút **Tạm dừng** và **Cài đặt** hoạt động từ quỹ đạo qua hạ cánh đến lúc khám phá Mặt Trăng. Đây là Non-Diegetic UI, hiển thị cố định theo màn hình. Dùng tiếng Việt và tiếng Anh như game hiện tại.

## Phương án đã xem xét

| Phương án | Đánh đổi |
|---|---|
| HTML/CSS xuyên suốt | Một giao diện dùng chung khi đổi cảnh, có sẵn điều hướng và focus của trình duyệt. |
| HTML ở màn đầu, Babylon GUI trong nhiệm vụ | Giữ cách dựng màn đầu hiện tại và đồng bộ cài đặt giữa hai bộ control. |
| **Babylon GUI xuyên suốt — người dùng chọn** | Dùng cùng hệ giao diện với HUD và hộp thoại. Thêm scene menu nhẹ cho màn đầu, dùng chung component và trạng thái qua các cảnh. Điều hướng bằng bàn phím và quản lý focus cần được thiết kế trong game. |

## Màn hình đầu và trong nhiệm vụ

| Giai đoạn | Nút và luồng |
|---|---|
| Màn hình đầu | Tiêu đề Pip & Mica, nền quỹ đạo, **Chơi mới**, **Cài đặt** và **Tiếp tục** khi có điểm lưu hợp lệ. Nếu có điểm lưu, Tiếp tục là nút chính. |
| Chơi mới | Mở lựa chọn **Tự lái** và **Lái tự động**, kèm mô tả ngắn. Giữ tùy chọn **Bỏ qua hạ cánh** như một hành động riêng. Nếu đã có điểm lưu, báo trước rằng lượt mới sẽ thay điểm lưu sau lần tự lưu đầu tiên. |
| Quỹ đạo | Nút Tạm dừng và Cài đặt ở góc trên phải, cùng vị trí ở các cảnh sau. Tạm dừng giữ nguyên nhịp chuyển cảnh, lời thoại, động cơ và dữ liệu bay. |
| Hạ cánh | Hai nút nằm ngoài vùng số liệu bay và cảnh báo. Khi mở menu, giữ nguyên độ cao, vận tốc, góc nghiêng, nhiên liệu và trạng thái tự lái. |
| Khám phá Mặt Trăng | Hai nút giữ vị trí. Khi mở menu, dừng đồng hồ nhiệm vụ, vật lý, chuyển động của phi hành gia và robot, hao hụt tài nguyên, lời thoại và các sự kiện. |

Giao diện lấy cảm hứng từ bảng điều khiển bay tương lai. Màn chính dành phần phải cho tàu ở quỹ đạo và giữ tiêu đề cùng các nút ở vùng xanh đêm bên trái. Khi có điểm lưu, nút Tiếp tục nổi bật và ghi rõ sẽ trở lại điểm lưu gần nhất. Pause mở thành bảng bên trái trên màn hình rộng, để người chơi vẫn thấy tàu và chỉ số bay trên cảnh đã làm tối. Settings dùng bảng xanh đậm với ba nhóm **Âm thanh**, **Ngôn ngữ** và **Điều khiển**. Trên màn hình hẹp, các nhóm chuyển lên trên phần nội dung.

Cảnh mở đầu tham khảo cách Starfield xây dựng tương lai từ phần cứng vũ trụ quen thuộc. Settings tham khảo cách Mass Effect Legendary Edition nhóm các tùy chọn và đặt giá trị cạnh thanh âm lượng. [Định hướng mỹ thuật Starfield](https://news.xbox.com/en-us/2022/02/17/exclusive-signed-starfield-art-giveaway/) · [Giao diện cài đặt Mass Effect Legendary Edition](https://www.ea.com/able/resources/mass-effect-legendary-edition/pc)

| Màu | Cách dùng |
|---|---|
| Xanh NASA `#0032A0` | Nút hành động chính và trạng thái được chọn, kết hợp chữ trắng. |
| Trắng `#FFFFFF` | Tiêu đề, nhãn nút và số liệu cần đọc rõ. |
| Đỏ NASA `#E4002B` | Viền cảnh báo và hành động kết thúc hoặc bỏ qua một phần nhiệm vụ, kèm nhãn giải thích. |
| Xanh đêm `#060D1D` và xanh sáng `#A8CDFF` | Nền và điểm sáng cho viền, biểu tượng, focus và giá trị cài đặt. |

Xanh và đỏ tham chiếu [bảng màu trong hướng dẫn NASA](https://www.nasa.gov/wp-content/uploads/2023/07/nasa-insignia-colorguide.png). Dùng chữ dễ đọc cho điều hướng và chữ đơn cách cho các giá trị như phần trăm âm lượng. Tên chức năng đi cùng biểu tượng, nút có vùng bấm đủ lớn và focus rõ. Khi chiều rộng hẹp, bảng menu cuộn nội dung theo chiều dọc. Bảng menu chặn chuột/chạm tới camera và nhân vật.

## Nội dung bảng

- **Tạm dừng** có **Tiếp tục**, **Cài đặt** và **Về menu chính**. Pha bay và hạ cánh có hành động **Bỏ qua hạ cánh** theo luồng hiện tại. Trên bề mặt, **Chơi lại từ điểm lưu** chỉ hiện khi có điểm lưu hợp lệ. Khi về menu chính, cho người chơi biết rằng tiến trình sẽ trở lại điểm lưu gần nhất nếu họ chọn Tiếp tục.
- **Cài đặt** có bật/tắt nhạc, thanh âm lượng theo phần trăm, ngôn ngữ Việt/Anh và bảng phím điều khiển theo ngữ cảnh. Thay đổi có hiệu lực ngay và dùng lại cài đặt lưu trong trình duyệt. Lượt đầu hiển thị menu chính với ngôn ngữ mặc định theo trình duyệt, có thể đổi ngay trong Cài đặt.
- **Quay lại** trong Cài đặt trở về đúng nơi đã mở. Từ menu chính thì trở về màn đầu. Từ bảng Tạm dừng thì trở về bảng Tạm dừng và giữ mô phỏng đứng yên. Từ nút Cài đặt trên HUD thì trở lại nhiệm vụ tại đúng thời điểm đã mở.

## Điều khiển và tích hợp

- `Esc` mở Tạm dừng trong nhiệm vụ hoặc lùi một lớp menu. Khi một bảng trong gameplay đang có chức năng đóng bằng `Esc`, cho bảng đó xử lý trước. Chuyển thao tác bỏ qua hạ cánh sang nút có nhãn trong menu để tránh nhấn nhầm.
- Nút và thanh trượt hỗ trợ chuột, chạm và bàn phím. `Tab` di chuyển focus khi menu mở, `Enter` kích hoạt nút được chọn, các phím mũi tên chỉnh thanh trượt. Sau khi đóng, trả focus về nút đã mở menu hoặc canvas. Xử lý nhả phím để thao tác giữ ga hoặc đi bộ trước khi mở menu không bị kẹt.
- Dùng `@babylonjs/gui` có sẵn. Scene menu chính có camera và ảnh nền nhẹ. Gắn các control dùng chung vào lớp GUI toàn màn hình hiện có của từng cảnh. Mỗi thời điểm chỉ scene đang hiển thị nhận input. Trạng thái menu và cài đặt dùng chung trong một lần chạy game.
- Dùng lại đồng hồ tạm dừng của lời thoại và cơ chế dừng vật lý bề mặt. Trong quỹ đạo, bỏ qua cập nhật mô phỏng khi menu mở. Trong hạ cánh và khám phá, chặn bước cập nhật mô phỏng và vật lý tương ứng. GUI vẫn được vẽ và nhận thao tác. Đồng bộ lại mốc thời gian khi tiếp tục để thời gian chờ không được tính vào nhiệm vụ.
- Phạm vi gồm giao diện, input và tạm dừng. Các lựa chọn lái, checkpoint, luật vật lý, độ khó và logic nhiệm vụ tiếp tục dùng hệ thống đang có. Bố cục, thứ tự nút và cách dùng `Esc` ở trên là đề xuất để người dùng duyệt.

## Tiêu chí chấp nhận

1. Mở game sạch thấy menu chính và mở Cài đặt ngay. Có điểm lưu hợp lệ thì thấy Tiếp tục, và nút này khôi phục đúng điểm lưu.
2. Mở được cả Pause và Settings bằng chuột ở quỹ đạo, khi đang hạ cánh và trên bề mặt. Các giá trị mô phỏng quan sát được giữ nguyên trong lúc menu mở. Đóng menu tiếp tục đúng trạng thái.
3. Chuyển từ Pause sang Settings rồi quay lại vẫn tạm dừng. Thoát Settings mở trực tiếp từ HUD tiếp tục nhiệm vụ.
4. Đổi ngôn ngữ, bật/tắt nhạc và chỉnh âm lượng hoạt động ở mọi giai đoạn. Tải lại giữ cài đặt đã chọn.
5. Dùng được menu bằng bàn phím. Khi đang thao tác menu, phím và chuột không lái tàu, xoay camera hoặc di chuyển nhân vật. Kiểm tra thêm khi đổi cảnh và ở kích thước màn hình hẹp.

Bản phác thảo tương tác minh họa bố cục và luồng bằng ảnh chụp từ game. Giá trị điểm lưu, cài đặt và giai đoạn trong bản phác thảo là dữ liệu mô phỏng.
