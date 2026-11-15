# Ánh sáng quỹ đạo cho menu và màn loading

## Mục tiêu

Tạo cảm giác điện ảnh, chân thực khi bay trên quỹ đạo Mặt Trăng. Ánh sáng xiên làm rõ thân tàu và độ nổi của địa hình, với tông xanh lạnh nhẹ trên nền trời tối. Khung hình hiện tại là mốc để so vị trí đường chân trời, Trái Đất, tàu, logo, các nút và thanh tiến trình.

## Cách thực hiện

- Dựng lại ánh sáng trong cảnh 3D rồi xuất ảnh là phương án đã chọn. Bề mặt cong của tàu và địa hình Mặt Trăng sẽ bắt sáng theo hướng chiếu. Cách này dùng lại mô hình, địa hình và góc máy của cảnh hiện tại.
- Chỉnh hậu kỳ ảnh hiện tại cho phép giữ vị trí từng điểm ảnh và thay đổi màu nhanh. Ánh sáng xiên trên thân tàu và bóng trong hố sẽ cần mô phỏng trên ảnh phẳng.

## Kết xuất

Dùng khung 1470 × 720 của bộ ảnh gốc. Đặt ánh sáng xiên ở góc thấp, tạo viền sáng trên thân tàu và chừa vùng tối đủ rõ để nhìn thấy khối. Dùng hướng Mặt Trời tương thích với bóng địa hình đã tính sẵn từ dữ liệu LOLA. Cân tông xanh lạnh nhẹ trong bước xuất ảnh. Vùng sau logo và nút menu có độ tương phản đủ để đọc.

Xuất cảnh tĩnh cho menu, nền quỹ đạo cho loading và lớp tàu trong suốt khớp vùng cắt hiện tại để dùng chuyển động trôi nhẹ sẵn có. Thiết lập ánh sáng phục vụ bước kết xuất ảnh. Dùng WebP cho hai ảnh nền theo định dạng hiện hành.

## Duyệt ảnh và quay lại bản cũ

So sánh ảnh trước và sau trên bố cục hiện tại ở desktop và màn hình dọc. Kiểm tra độ rõ của tàu, địa hình, logo, nút và tiến trình, cùng chuyển động của tàu khi bật và tắt giảm chuyển động. Đặt phần thay ảnh trong một commit riêng trên nhánh codex/orbital-menu-lighting để có thể xem hoặc hoàn tác riêng lần đổi nền.
