# HUD nhiệm vụ của Pip & Mica

Ngày 11/11/2026 · Bản phác thảo để xem trước

## Hướng đã chọn

Người dùng chọn cách nhóm chỉ số theo từng pha và yêu cầu tối giản phần hiển thị. Tên chỉ số và số liệu đặt trực tiếp trên cảnh 3D. Bỏ khung lớn phía sau và ô viền quanh từng chỉ số để giảm diện tích che cảnh.

## Bố cục

- Hai nút Tạm dừng và Cài đặt ở góc trên phải, mỗi nút 44 × 44 px, cách nhau 7 px. Chỉ biểu tượng hiển thị thường trực. Nhãn xuất hiện khi rê chuột hoặc đưa tiêu điểm bàn phím vào nút.
- Quỹ đạo, khi đốt hãm, ưu tiên vận tốc và độ cao. Bên dưới có nhiên liệu, lực đẩy và dải vận tốc mục tiêu. Hộp thoại vô tuyến nằm giữa mép dưới.
- Hạ cánh đặt độ cao và tốc độ rơi ở hàng trên. Hàng dưới có trôi ngang và góc nghiêng, tiếp theo là nhiên liệu và lực đẩy. Lời nhắc A, D, Space và H nằm giữa mép dưới.
- Bề mặt đặt số module và mẫu vật ở góc trên trái. UTC, góc Mặt Trời và góc Trái Đất ở phần phụ. Góc dưới trái có ba thanh tài nguyên với phần trăm căn phải. Lời nhắc thao tác nằm gần giữa mép dưới.
- Dùng chữ đơn cách cho số liệu, bóng chữ tối để đọc trên nền sáng và điểm nhấn đỏ ở tên pha. Nhiên liệu, lực đẩy, oxy, nhiệt, pin PIP và dải vận tốc có dạng hình bình hành với hai cạnh đầu thanh nghiêng 24° so với phương dọc. Thanh dày 6 px, dải vận tốc dày 7 px. Oxy xanh lam, nhiệt cam và pin PIP vàng. Cảnh báo ghi rõ lý do bằng chữ.
- Màn hình hẹp đặt bảng chỉ số dưới hàng biểu tượng. Bảng tài nguyên nằm trên lời nhắc thao tác để hai vùng đọc riêng biệt.

## Tích hợp sau khi duyệt

Dựng HUD bằng Babylon GUI. Dùng dữ liệu mô phỏng và luật cảnh báo hiện có. Kiểm tra vị trí, cỡ chữ và trạng thái cảnh báo bằng ảnh chụp game ở cả ba pha. Thử nút Pause và Settings bằng chuột, bàn phím và trên màn hình hẹp. Bản xem trước dùng số liệu mẫu và hai hộp thoại minh họa thao tác với nút.
