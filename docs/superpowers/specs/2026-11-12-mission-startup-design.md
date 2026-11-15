# Hiệu ứng nút và tải nhiệm vụ

Người dùng chọn tải khi bắt đầu chơi. Menu dùng Babylon GUI, có nền và viền gradient nhẹ trên ba nút chính. Khi rê chuột, nút tăng tối đa 3% và một vệt sáng lướt một lần. Tùy chọn giảm chuyển động của hệ thống áp dụng cho hiệu ứng này.

Sau khi chọn Tiếp tục hoặc xác nhận Chơi mới, hiển thị thanh phần trăm theo các bước hoàn thành thực tế. Nạp mã gameplay, các GLB trong manifest, texture Mặt Trăng, địa hình, dữ liệu NASA đi kèm và Havok WASM. Dùng lại dữ liệu đã nạp trong cảnh quỹ đạo và bề mặt. Dựng cảnh đích trước khi mở điều khiển. Nếu tải lỗi, cho thử lại hoặc về menu. Dữ liệu DONKI trực tiếp vẫn dùng luồng cập nhật và dự phòng hiện có.

Phương án đã chọn chỉ tải tài nguyên nhiệm vụ sau khi chọn vào game. Tải nền ở menu có thể giảm thời gian chờ sau khi bấm và dùng băng thông sớm hơn.
