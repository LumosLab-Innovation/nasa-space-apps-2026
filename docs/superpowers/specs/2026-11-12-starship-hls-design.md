# Starship HLS — thiết kế dựng lại theo concept chính thức

Ngày: 2026-11-12. Trạng thái: người dùng đã duyệt thiết kế. Triển khai bước preview đối chiếu; tích hợp game sau khi duyệt ngoại hình theo thứ tự giao bên dưới.

## Mục tiêu và phạm vi

Dựng lại Starship HLS cho ARTEMIS IV: COMMON GROUND để ngoại hình thuyết phục ở cảnh ghép nối Orion, quỹ đạo, hạ cánh và khám phá bề mặt. Ưu tiên silhouette, tỷ lệ các bộ phận, vật liệu và cơ cấu nhìn thấy. Đây là bản tái dựng từ concept công khai, không phải CAD được NASA chứng nhận hoặc khẳng định cấu hình tàu Artemis IV cuối cùng.

Người dùng đã chọn hướng B: dựng lại theo một bộ concept NASA/SpaceX thống nhất, tối ưu web và cho xem đối chiếu trước khi tích hợp. Giữ nguyên Trái Đất, khí quyển/vầng sáng, ánh sáng toàn cảnh, địa hình, Eagle, dấu chân và cờ. Không đổi cốt truyện, cân bằng nhiên liệu, mô phỏng quỹ đạo, lưu game, bố cục HUD hoặc quy trình xác nhận Chơi mới.

## Approaches

| Hướng | Đánh đổi | Kết luận |
|---|---|---|
| A. Chỉnh model đang có | Nhanh nhưng giữ phần lớn hình học giản lược | Không chọn |
| B. Dựng lại từ concept chính thức | Kiểm soát ngoại hình, cơ cấu và dung lượng; tốn công dựng lại | Người dùng chọn |
| C. Model có sẵn | Có thể nhanh nhưng chưa xác minh được HLS chính thức, giấy phép và độ nặng | Không chọn |

## Nguồn và độ chính xác

Chuẩn ngoại hình chính là hình SpaceX được NASA đăng trong bài 23/10/2026, ảnh có tên 07-24-25. Ngày đăng bài không đồng nghĩa ngày thiết kế hoặc cấu hình bay cuối cùng.

- Bài nguồn: https://www.nasa.gov/missions/artemis/nasa-partners-accelerate-lander-development-for-2028-moon-missions/
- Ảnh chuẩn: https://www.nasa.gov/wp-content/uploads/2026/10/07-24-25-hls-on-surface-elevator-down.jpg
- Bộ ảnh bổ trợ năm 2024: https://www.nasa.gov/humans-in-space/nasa-spacex-illustrate-key-moments-of-artemis-lunar-lander-mission/
- Góc ghép nối: https://www.nasa.gov/wp-content/uploads/2024/11/11-03-24-orion-transfer.jpg
- Thử nghiệm thang máy, chỉ làm nguồn tham khảo chức năng: https://www.nasa.gov/image-article/nasa-astronauts-test-spacex-elevator-concept-for-artemis-lunar-lander/

![Concept chuẩn NASA/SpaceX](https://www.nasa.gov/wp-content/uploads/2026/10/07-24-25-hls-on-surface-elevator-down.jpg?w=1024)

![Góc tham khảo ghép nối năm 2024](https://www.nasa.gov/wp-content/uploads/2024/11/11-03-24-orion-transfer.jpg?w=1024)

Không chép chi tiết không tương thích từ ảnh 2024 vào mẫu chính. Trước khi dựng, ghi bảng chi tiết: quan sát được từ mẫu chính / được nguồn bổ trợ xác nhận / suy dựng. Không tự khẳng định số lượng cửa sổ, chân đáp, động cơ hoặc cấu trúc khuất là thông số NASA nếu ảnh và tài liệu không chứng minh. Chi tiết khuất được dựng tối giản, đối xứng hợp lý và ghi là suy dựng. Không gọi ảnh concept là ảnh chụp tàu trên Mặt Trăng.

Giữ quy mô mô hình khoảng 50 m cao, thân đường kính 9 m làm quy ước tương thích hiện tại; cần ghi rõ đây là kích thước tái dựng, không đo chính xác từ phối cảnh. Phần vị trí chi tiết lấy tỷ lệ tương đối từ ảnh chuẩn. NASA hiện để việc chọn nhà cung cấp đổ bộ tùy mức độ sẵn sàng; game dùng phương án Starship, không tuyên bố đó là cấu hình Artemis IV đã chốt ngoài đời.

## Thiết kế hình ảnh

- Đầu tàu và thân: chỉnh đường cong, vai chuyển tiếp, vòng cổng ghép nối; silhouette phải mềm mượt ở đường cong hình học nhưng giữ chi tiết cơ khí rõ. Không dùng đường chia ô nổi dày phủ toàn thân như hiện tại.
- Phân vùng bề mặt theo ảnh: lớp phủ sáng, vùng kim loại, kính, pin mặt trời; các rãnh ghép chỉ có độ nổi nhỏ. Không mặc định toàn bộ thân là thép trần.
- Chân đáp: đúng dáng nhìn được, có khớp và bàn chân rõ; tách từng cụm để thu/mở. Không suy diễn độ chính xác cơ khí từ concept.
- Cửa khoang và thang máy: nhận diện được cửa, sàn, lan can và kết cấu đỡ theo ảnh. Tách cabin/sàn di chuyển khỏi ray cố định; không kéo cả cụm ray theo sàn.
- Động cơ và vòi điều khiển: phân biệt về hình dáng ở khoảng cách gần; giữ chức năng luồng phụt hiện tại, không thay lực đẩy hoặc thêm mô phỏng động lực học mới.
- Vật liệu: PBR có độ nhám hợp lý, kim loại không đen mất chi tiết hoặc bóng gương. Áp dụng điều chỉnh riêng HLS, không sửa vật liệu Orion hay môi trường chung. Không tạo nguồn sáng hay bloom toàn cảnh ảnh hưởng Trái Đất.

## Các trạng thái và chuyển cảnh

| Trạng thái | Chân đáp | Thang máy |
|---|---|---|
| Ghép nối / tách tàu / hãm quỹ đạo | Thu gọn, không che cổng ghép nối | Thu tại cửa khoang; các phần triển khai gập gọn |
| Hạ cánh cuối | Mở một lần trước tiếp đất; nếu Continue đã ở sát đất thì thiết lập trạng thái mở ngay | Thu gọn |
| Chạm đất ổn định | Mở và giữ yên | Hạ sàn xuống vị trí tiếp cận |
| Khám phá / tải save trên bề mặt | Mở | Đã hạ; không phát lại hoạt ảnh làm người chơi chờ |
| Rời bề mặt ở đoạn kết | Mở trong lúc rời đất, thu sau khi có khoảng hở | Thu trước khi tàu bay |

Đề xuất của người thiết kế: hoạt ảnh mở chân khoảng 2 giây, thang máy hạ khoảng 4 giây, có easing nhẹ và được ghi là nén thời gian cho game. Không khẳng định tốc độ thật. Triển khai chân khi bước vào final descent; nếu thời gian tới tiếp đất quá ngắn thì rút ngắn chuyển động hoặc đặt mở ngay, không để chân xuyên đất.

Hoạt ảnh chạy theo thời gian mô phỏng được Pause/Settings khóa, không dùng đồng hồ thực bỏ qua pause. Không thêm điều khiển lái thang máy, va chạm sàn di chuyển hoặc yêu cầu người chơi đứng trên sàn. Khi Chơi mới, hoàn tất hạ sàn trước khi trả quyền khám phá; Continue ở bề mặt khôi phục trạng thái cuối ngay. Mọi trạng thái được suy ra từ phase hiện tại, không đổi định dạng save. Rời bề mặt chỉ chờ thu thang máy khi bắt đầu đoạn liftoff, không làm phát lại hội thoại hoặc thay điều kiện thắng.

## Tích hợp đã khảo sát

Repo đang phục vụ localhost: C:/Users/ADMIN/Downloads/NASA_Hackathon (Babylon.js + Vite + TypeScript). Repo D:/Documents/Vin-AI-in-Action/NASA_Hackathon/nasa-space-apps-2026 là workspace khác; không chép thay đổi qua đó trong phạm vi này.

- Model hiện tại: public/models/hls.glb (405104 byte); được dựng trong tools/blender/build_props.py.
- Giữ ID hls và đường dẫn tương thích; tách script dựng HLS để không tái xuất habitat, cờ, Eagle hoặc các asset khác.
- Giữ các node hợp đồng hls_root, hull, elevator, legs, thrusters. Thêm pivot/nhóm con và điểm neo docking, engine, elevatorFloor; cập nhật kiểm tra hợp đồng nếu cần. Không dựa vào index mesh.
- landingScene.ts hiện đặt tâm GLB bằng -21 và khoảng ghép nối bằng hằng số 29 + 5.7. Thay phần phụ thuộc HLS bằng điểm neo model để tránh hai mũi xuyên nhau. Không thay hình học Orion.
- Cảnh quỹ đạo có cách phóng đại tàu riêng; giữ quy ước này. Ảnh đối chiếu kỹ thuật dùng viewer riêng đơn vị mét và góc máy tương ứng, không lấy phối cảnh game làm bằng chứng đúng tỷ lệ.
- swapInModel hiện ép kim loại mọi tàu xuống 0.15. Bỏ qua cơ chế này riêng HLS và xử lý phản xạ cục bộ nếu cần; giữ Orion như hiện tại.
- surfaceScene.ts hiện mergeStatic toàn tàu. Chỉ gộp phần thân tĩnh; giữ các cụm hoạt ảnh độc lập và có vòng đời/dispose rõ ràng. Phần hạ cánh dùng cùng rig với cảnh khám phá.
- Collider đơn giản giữ kích thước phù hợp thân tàu; không mở rộng thành lưới va chạm chi tiết. Vị trí chân đáp cần kiểm tra nền ở điểm hạ cánh; không sửa địa hình để chữa model lơ lửng. Có thể đặt độ cao tàu dựa vào cao độ dưới chân, không thay luật hạ cánh.
- missionAssets.ts tải đủ byte trước khi tạo cảnh. Mọi GLB/texture mới đi qua manifest hiện tại, dùng lại byte đã tải; không tải lén lần hai khi vào game. Chỉ báo hoàn tất startup khi import, vật liệu và trạng thái ban đầu đã sẵn sàng; không thay tiến độ thực bằng bộ đếm thời gian.
- Menu chính dùng artwork sẵn có. Sau khi model qua đối chiếu, cập nhật nền menu/loading từ cảnh đã sửa, giữ bố cục và hiệu ứng trôi; không tải HLS 3D vào menu sớm.

## Hiệu năng — mục tiêu đề xuất, chưa phải kết quả đo

Hai mức chi tiết cùng tỷ lệ và pivot: gần không quá khoảng 40000 tam giác, xa khoảng 10000; tổng HLS tải nén mục tiêu không quá 4 MB, tối đa khoảng 10 draw call ở trạng thái gần. Có thể đóng gói hai mức trong cùng GLB hoặc quản lý asset riêng nếu loader yêu cầu; builder chọn, nhưng chỉ một mức được render và cast shadow tại một thời điểm.

Chuyển LOD theo kích thước chiếu trên màn hình có hysteresis, tránh nhấp nháy khi zoom. Có thể khóa LOD trong shot gần ngắn nếu đơn giản và mượt hơn. Texture tối đa 2K cho thân, 1K cho phụ kiện; ưu tiên dùng chung atlas. Không đưa thêm decoder nặng chỉ để nén model nhỏ. Các con số là ngân sách đề xuất; nếu vượt phải ghi lại đo đạc và lý do trước khi tích hợp.

Benchmark cùng máy/trình duyệt, resolution và shot trước/sau; mục tiêu thời gian frame trung vị và p95 tăng không quá 10% khi đo ổn định, không tự hứa 60 FPS trên mọi máy. Báo kích thước tải thực, tam giác, draw call, thời gian import và texture memory ước lượng. Menu không tăng tải JS hoặc asset 3D vì HLS mới.

## Thứ tự giao và tiêu chí nghiệm thu

1. Dựng asset và viewer đối chiếu cách ly, chưa thay model game. Xuất ảnh góc ngang, nghiêng 3/4, đứng trên bề mặt và góc ghép nối. Đặt ảnh nguồn cạnh render, ghi điểm suy dựng và ngày nguồn. Đây là bằng chứng để người dùng duyệt ngoại hình trước tích hợp.
2. Sau duyệt ngoại hình, tích hợp rig/material/loading, rồi chụp trong game: ghép nối, tách tàu, cuối hạ cánh và bề mặt. Không lấy ảnh dựng AI làm bằng chứng model chạy trong game.
3. QA Chơi mới (xác nhận + loading + intro), Tiếp tục (save quỹ đạo và bề mặt), pause/settings trong mỗi trạng thái, quay về menu rồi vào lại. Mô phỏng tải chậm và lỗi asset: không vào cảnh khi HLS chưa sẵn sàng; không kẹt loading, không chồng hai model, không rò scene.
4. Kiểm tra cổng ghép nối, chân tiếp đất, ray/sàn không xuyên thân; bóng không tự gây chớp nháy; không z-fighting ở panel. Kiểm tra liftoff và LOD không mất chân hoặc thang máy.
5. Chạy npm run build và các test loader/startup, hợp đồng model, pause/trạng thái có liên quan; không thêm test chỉ chép lại hằng số hình ảnh. Repo hiện không có script lint; không báo đã chạy lint.
6. Ảnh so sánh Trái Đất/vầng sáng, địa hình và Eagle phải cùng góc máy/thời điểm; xác nhận không thay các asset/mã của chúng. Ghi nguồn trong public/models/SOURCES.md và DESIGN.md → Data, kèm nơi xem nguồn hiện có trong game; không thêm lại dòng credit nhỏ mà người dùng đã yêu cầu bỏ.

## Quyết định giao builder

### Bổ sung đã duyệt: thang máy gập sát thân

### Bổ sung đã duyệt: đáy tàu và cơ cấu liên kết liên tục

Người dùng chọn kỹ thuật thực tế nhưng đẹp khi nhìn cận; yêu cầu sửa đáy rỗng, động cơ thưa/giản lược, sàn lơ lửng và cáp bị ẩn. Dựng vách đáy, khung chịu lực, vòi phun hai mặt có cổ/lòng sâu, khớp và đường ống tiết chế, tham khảo Starship/Raptor đời mới từ nguồn chính thức. Cụm sáu động cơ theo dáng Starship là diễn giải HLS cho game, không phải cấu hình bay được chứng nhận. Thang có khung chịu lực cố định hình dạng, sàn gập nối với khung bằng bản lề, puly/tang cuốn nhìn thấy; dây nối các điểm neo thật trong toàn bộ quá trình. Chuyển động theo cơ cấu, không ẩn dây lúc mở, không di chuyển sàn độc lập khỏi liên kết. QA góc đáy/cận/chéo và quay trọn mở-hạ-nâng-thu. Cho phép tối đa20 mesh để giữ các khớp thật; vẫn <4MB và40k/10k tam giác. Giữ nguyên phạm vi preview và các đối tượng được bảo vệ.

Người dùng xác nhận thang máy gập sát thân khi bay, chỉ triển khai sau tiếp đất, với animation mượt và có nhịp cơ khí. Không giấu cả lồng vào một khoang sâu trong thân. Tay đỡ vươn ra, sàn mở, lan can dựng lên rồi mới hạ; thu theo thứ tự ngược. Easing nhẹ, không nảy/lắc như đồ chơi; pause đóng băng mọi khớp. Cơ cấu là diễn giải cho game. Preview được phép tối đa 16 primitive để tách các bộ phận chuyển động; đo lại trước tích hợp. Giữ nguyên các giới hạn phạm vi và bước duyệt ngoại hình.

Được chọn topology, cách tạo atlas, tổ chức module rig, ngưỡng LOD và thông số vật liệu sau đối chiếu hình. Không được tự thay nguồn chuẩn, đổi ánh sáng toàn cảnh, sửa Earth/Eagle/terrain, thay gameplay hoặc trình bày chi tiết suy dựng thành thông số NASA. Các tham số kỹ thuật ở trên là đề xuất của người thiết kế, chưa phải lựa chọn riêng được người dùng xác nhận.
