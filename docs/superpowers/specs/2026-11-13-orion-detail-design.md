# Orion — nâng chi tiết model, giữ camera hiện tại

Ngày: 2026-11-13. Trạng thái: người dùng đã duyệt ngày 2026-11-13.

## Mục đích và phạm vi

Người dùng chọn hướng B: nâng chi tiết toàn bộ Orion, ưu tiên cụm động cơ phía sau. Kết quả cần thuyết phục hơn về cấu tạo và vật liệu trong chính cảnh game đang có. Giữ nguyên camera, FOV, chuyển động, thời lượng cảnh, kích thước tổng thể và điểm ghép với HLS.

Đây là thay đổi asset và cách áp vật liệu cho một model trong pipeline Blender → GLB → Babylon hiện có. Không thay HLS, địa hình, Eagle, Trái Đất, vầng sáng hoặc ánh sáng chung của cảnh. Ảnh người dùng gửi là tham khảo cảm giác chi tiết; cấu tạo dựa trên nguồn NASA/ESA, không coi ảnh đó là bản vẽ kỹ thuật đã xác minh.

## Các hướng đã cân nhắc

- A: chỉ nâng đáy và động cơ. Ít công, nhưng thân tàu và tấm pin vẫn đơn giản, chênh mức chi tiết.
- B — người dùng đã chọn: nâng toàn bộ Orion, ưu tiên phần đuôi. Dùng hình học cho cấu tạo lớn, texture cho chi tiết nhỏ để các bộ phận đồng đều và hạn chế tải thêm.

## Thiết kế hình ảnh đề xuất

1. **Động cơ chính:** thay hình nón kín bằng miệng chuông mở có thành, mép, lòng vòi tối và cổ họng sâu. Có vòng nối, giá đỡ và mặt đáy liên kết rõ với module dịch vụ. Những đường ống/chi tiết cơ khí nhìn thấy phải có điểm nối hợp lý, tránh thêm chi tiết tùy tiện để lấp chỗ trống.
2. **Cụm đẩy phụ:** thể hiện bố cục ESM gồm một động cơ chính, tám động cơ phụ và 24 vòi điều khiển tư thế. Vòi nhỏ được đơn giản hóa theo kích thước nhìn thấy; kiểm tra vị trí với ảnh và sơ đồ chính thức trước khi dựng.
3. **Module dịch vụ:** phân biệt tấm tản nhiệt, đường ghép, vòng nối và lớp cách nhiệt bằng độ sâu vừa phải cùng vật liệu có độ nhám khác nhau. Nếp nhăn tiết chế, tránh lấp lánh và nhiễu hạt.
4. **Khoang phi hành gia:** thêm khung cửa sổ, đường cửa khoang, mép tấm chắn nhiệt và các vòng docking. Không dịch điểm ghép hay thay silhouette tổng thể.
5. **Bốn cánh pin:** giữ cấu hình chữ X, ba đoạn mỗi cánh; bổ sung khung mảnh, khớp đỡ và ô pin bằng texture có mipmap. Duy trì khoảng cách thật giữa các lớp bề mặt để không chớp nháy.

## Cách thực hiện đề xuất và ràng buộc

- Tiếp tục sửa bộ dựng `tools/blender/build_orion.py`, xuất `public/models/orion.glb`; giữ root, các node và tên vật liệu mà manifest hiện yêu cầu.
- Giữ origin ở tâm module dịch vụ, trục hướng, tỉ lệ và đầu docking hiện tại. Chi tiết bổ sung nằm trong ngân sách kích thước hiện có.
- Hàm đưa Orion vào cảnh hiện giảm mọi vật liệu kim loại xuống metallic 0.15. Điều chỉnh xử lý riêng Orion để giữ vật liệu mới, không đổi lighting toàn cảnh.
- Đề xuất ngân sách ban đầu: tối đa khoảng 25.000 tam giác, GLB khoảng 2 MB; texture dùng chung tối đa 2K khi cần. Đây là mục tiêu kỹ thuật của người thực hiện, cần đo lại sau xuất; ưu tiên chi tiết đọc được ở camera hiện tại thay vì thêm hình học siêu nhỏ.
- Giữ đường dẫn asset và cơ chế preload. Nếu phát sinh texture ngoài GLB, đưa đầy đủ vào danh sách tải và tiến độ; không vào game khi asset cần thiết chưa sẵn sàng.
- Nếu ảnh menu/loading có Orion cũ, cập nhật từ cùng bố cục chụp hiện có; không thiết kế lại màn hình hoặc góc camera.
- Hình học chi tiết, UV và giá trị roughness cụ thể thuộc quyền quyết định của người thực hiện. Đây là mô hình minh họa dựa trên tài liệu công khai, không phải CAD kỹ thuật chứng nhận bởi NASA.

## Tiêu chí nghiệm thu

- So ảnh trước/sau ở cùng camera trong game: silhouette và docking trùng vị trí; phần đuôi đọc được là động cơ mở, có lòng vòi và giá đỡ.
- Không có chi tiết xuyên nhau, bộ phận lơ lửng, bề mặt đồng phẳng gây nháy hoặc ô pin gây nhiễu mạnh khi tàu chuyển động.
- Kiểm tra model contract, build và các kiểm thử liên quan; đo dung lượng, số tam giác và số draw call tăng thêm.
- QA Chơi mới, Tiếp tục và tiến độ loading; kiểm tra cảnh ghép/tách tàu. Chụp ảnh tại góc camera game hiện có để người dùng đối chiếu. Góc kiểm tra kỹ thuật riêng nếu dùng không trở thành camera mới trong game.
- Đối chiếu diff để xác nhận HLS, địa hình, Trái Đất và vầng sáng không bị thay đổi.

## Nguồn tham khảo

- NASA, European Service Module: https://www.nasa.gov/reference/european-service-module/
- ESA, European Service Module — Propulsion: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion/European_Service_Module_Propulsion
- NASA, Orion Spacecraft: https://www.nasa.gov/reference/orion-spacecraft/

Khi triển khai, ghi lại nguồn thực sự dùng vào `public/models/SOURCES.md` và cập nhật mục Data trong DESIGN.md nếu bổ sung nguồn NASA chưa được ghi nhận.
