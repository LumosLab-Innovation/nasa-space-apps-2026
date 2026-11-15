# Tiếp cận cực Nam và hạ cánh liên tục — hướng A

Ngày: 2026-11-13. Trạng thái: chờ người dùng duyệt; chỉ thiết kế, chưa triển khai.

## 1. Ý đồ và phạm vi

Người dùng chọn hướng A: đồng bộ địa hình cực Nam từ tiếp cận tới đáp, sửa khựng sau tách Orion và ở đoạn chuyển sang điều khiển đáp 300 m. Người chơi phải cảm thấy đang theo cùng một con tàu xuống cùng một địa điểm: sườn núi, miệng hố, bóng đổ tiếp tục chuyển động; camera không dừng rồi bật chạy, không màn đen, không loading lần hai.

Đây là thay đổi phối hợp địa hình, camera, nhịp mô phỏng và vòng đời render. Tài liệu này thay thế phần căn địa hình, hòa cảnh và giải phóng scene của `2026-11-13-seamless-descent-design.md`. Các yêu cầu đã duyệt về điều khiển, cơ cấu HLS, Pause/Settings và chuẩn bị asset vẫn áp dụng, với chi tiết bên dưới là quyết định mới nhất.

### Các hướng đã cân nhắc

- **A — người dùng đã chọn:** giữ hai scene, dùng chung định nghĩa địa hình cực Nam, trạng thái trình diễn và điều phối chuyển tiếp; hòa ngắn hai hình đang chuyển động trên GPU. Phạm vi vừa phải nhưng cần kiểm soát bộ nhớ và chi phí render kép.
- **B — không chọn:** hợp nhất toàn bộ thành một thế giới liên tục từ quỹ đạo xuống mặt đất. Giải quyết tận gốc nhiều hệ tọa độ nhưng thay lớn kiến trúc, mô phỏng và nội dung hiện có.
- Chỉ kéo dài fade hoặc chèn ảnh đứng không đáp ứng mục tiêu, nên không dùng.

Giữ model Orion/HLS, vật liệu đã duyệt, cơ cấu chân và thang máy; giữ hình thức Trái Đất/vầng sáng. Không sửa menu, ảnh loading hay cân bằng nhiên liệu/thrust. Không tuyên bố đường bay đạo diễn của game là mô phỏng quỹ đạo Artemis thật. Không mở rộng vùng gameplay hay di chuyển căn cứ, mẫu vật, điểm lưu.

## 2. Những gì code hiện tại cho thấy

- `landingScene.ts` đặt chuyến bay quanh vĩ độ 0°; `orbitalTerrain.ts` có vùng chi tiết Biển Tĩnh Lặng. `surfaceScene.ts` dùng Connecting Ridge, cực Nam. Đây là hai nơi khác nhau, không phải hai mức chi tiết của cùng địa hình.
- Bản đồ chơi là crop LOLA 3 km × 3 km, thu về 1,5 km × 1,5 km; cao độ cũng nhân 0,5. Dùng dữ liệu này ở một cảnh và độ cao vật lý chưa quy đổi ở cảnh kia sẽ tiếp tục lệch địa hình.
- Sau Orion, camera có nội suy 2,4 giây nhưng tốc độ mô phỏng chuyển từ ×1 sang ×10 khi bắt đầu hãm. Liên tục vị trí chưa bảo đảm liên tục vận tốc nhìn thấy.
- Cầu nối gần 300 m đang giữ ảnh chụp cảnh cũ 0,45 giây, giữ pose đầu cảnh mới, chụp canvas và dispose cảnh cũ tại điểm bàn giao. Đây là công việc cần loại khỏi điểm nối; mức đóng góp của từng việc vào spike phải đo, không suy ra hoàn toàn từ code.
- Cảnh bề mặt đã được chuẩn bị dưới loading đầu. Có thể tận dụng cơ chế dormant, nhưng khi render cảnh này để hòa, không được vô tình chạy gameplay thêm lần nữa qua render observers.

## 3. Trải nghiệm người chơi

Các thời lượng là đề xuất của người thiết kế để triển khai thử và đo, không phải dữ kiện NASA.

| Đoạn | Diễn biến nhìn thấy | Quyền điều khiển |
|---|---|---|
| Tách Orion | Hai tàu tiếp tục trôi; camera bám HLS và vào góc quan sát hãm trong khoảng 2,4 giây. Orion rời khung theo chuyển động, không biến mất đột ngột. | Máy dẫn đường giữ ổn định trong đoạn camera. |
| Bắt đầu hãm | Địa hình cực Nam lướt nhanh dần theo mức tăng tốc mô phỏng, không bật ngay từ ×1 lên ×10. HUD hiện đúng hệ số đang dùng. | Khi góc camera đã sẵn sàng, chuyển sang chế độ tay/tự động đã chọn; máy quay vẫn chuyển động liên tục. |
| Tiếp cận thấp | Một vùng cực Nam xuyên suốt. Các sườn núi và miệng hố chỉ rõ thêm khi đến gần. Giảm dần tăng tốc về ×1 trước khi vào cầu nối cuối. | Giữ hành vi hãm hiện có. |
| Khoảng 500 → 300 m | Đoạn dẫn đường khoảng 5 giây: camera tiến gần, tàu dựng thẳng và vào góc đáp. Hai scene có thể cùng render trong khoảng 0,45 giây nhưng cả hai đều đang chuyển động. | Máy lái giữ đường vào đáp; HUD đổi theo pha, chỉ một bộ nút Pause/Settings. |
| Tại 300 m | Cùng camera, con tàu, nền đất và bóng đổ tiếp tục sang frame điều khiển đầu tiên. | Lái tay nhận SPACE/A/D; tự động tiếp tục đáp. Không giữ hình để đợi hội thoại. |

Cảnh Apollo 11/Eagle tiếp tục là **góc nhìn tái dựng lịch sử riêng**. Khi trở lại chuyến bay hiện tại, bối cảnh là cực Nam; không trình bày một cú bay vài giây từ Biển Tĩnh Lặng xuống cực Nam. Dòng tọa độ mở đầu và nội dung có liên quan phải khớp vị trí cực Nam. Phần tái dựng Apollo được phép có cách chuyển riêng hiện có; hai điểm nối nhiệm vụ nêu trên tuyệt đối không dùng màn đen.

## 4. Một định nghĩa địa hình cho cả hai scene

### 4.1. Hệ quy chiếu và vùng lõi

- Trung tâm dữ liệu: Connecting Ridge, vĩ độ −89,45°, kinh độ 222,7° Đông, theo cấu hình đang dùng.
- Frame chuẩn: mét trong game, +X Đông, +Y lên, +Z Bắc. Adapter sang đơn vị km của cảnh quỹ đạo chỉ chuyển đơn vị và frame; không tự đổi kích thước địa hình.
- Giữ nguyên toàn bộ Float32 của heightmap lõi 513 × 513 và phạm vi ±750 m. Giữ `zones.ts`, điểm đáp HLS, player spawn, collision và tọa độ save hiện có.
- Ánh xạ ra dữ liệu địa lý: 1 m game theo phương ngang ứng với 2 m trong crop nguồn; cao độ game là `(cao độ nguồn − mốc nguồn) × 0,5`. Tỉ lệ này phải dùng cho cả vùng bao quanh và cảnh tiếp cận, không chỉ cho mesh lõi.
- Mốc cao độ phải được truy xuất chính xác từ quy trình dựng dữ liệu; con số 1837 m trong SOURCES là mô tả làm tròn, không đủ để đăng ký hai DEM. Heightmap hiện hành là chuẩn cuối cùng của vùng lõi. Nếu tái tạo không khớp byte, không ghi đè lõi: căn dữ liệu bao quanh vào rìa lõi và ghi rõ phép hiệu chỉnh trong metadata.
- Metadata chung ghi phép chiếu, tâm, trục, scale, datum, nguồn, phạm vi và checksum. Hai scene dùng cùng sampler/metadata; không duy trì hai công thức đổi tọa độ độc lập.

### 4.2. Địa hình xa và chi tiết gần

Tạo một bộ dữ liệu cực Nam có vùng lõi hiện tại và các vành bao quanh theo mức chi tiết. Vùng chi tiết dùng LOLA Site01 ở nơi dữ liệu có coverage hợp lệ; vùng xa dùng dữ liệu LOLA thô hơn, được đăng ký về cùng frame. Người triển khai kiểm tra coverage/no-data trước khi chọn độ rộng, không giả định Site01 bao phủ toàn bộ tầm nhìn từ 15 km.

Phạm vi vành xa được tính từ camera/frustum lớn nhất của đường tiếp cận đã dựng, kèm biên dự phòng; phần chân trời còn lại dùng mesh Mặt Trăng thô cùng vị trí địa lý và quy ước tỉ lệ. Không dùng `sampleHeight` đang clamp ở mép lõi để kéo dài thành vùng đất phẳng. Không để lộ mép ô vuông hoặc khoảng rỗng khi camera vòng.

- Tăng chi tiết bằng các mức lưới lấy mẫu từ cùng trường độ cao. Khi đổi LOD, blend hình học trong một khoảng hữu hạn; không sinh một bộ miệng hố ngẫu nhiên mới.
- Khóa vùng lõi ở mức chi tiết cần cho đáp trước khi vào cầu nối. Trong cửa sổ hòa hai scene, dùng cùng mức lưới và cùng dữ liệu hiển thị quanh tàu.
- Vành nối hai nguồn được xử lý ngoài vùng lõi; không làm thay đổi collision và vị trí vật thể trong bản đồ chơi.
- LROC 4K đã duyệt được giữ nguyên file và chất lượng; UV địa lý phải đúng vùng cực Nam. Không dùng tile chi tiết Biển Tĩnh Lặng hoặc shadow/relief bake cho hướng nắng vùng xích đạo để phủ lên cực Nam.
- Bụi chi tiết gần là lớp vật liệu có tọa độ chung, chỉ tăng độ rõ theo khoảng cách; không đổi màu nền toàn cảnh ở 300 m. Nếu cần thêm normal/relief cực Nam, sinh từ chính trường cao độ chung.

Đây là địa hình NASA được thu gọn phục vụ game. HUD tiếp tục dùng đơn vị độ cao của gameplay hiện tại; không tuyên bố tỉ lệ hiển thị toàn cảnh là 1:1 ngoài đời.

### 4.3. Ánh sáng và thời gian

Hai scene dùng chung hướng Mặt Trời trong frame chuẩn, màu/cường độ ánh sáng, exposure/tone mapping và định nghĩa vật liệu mặt đất. Shadow của terrain và HLS phải khớp hướng, độ đậm, bias tại điểm nối. Chuyển mức shadow theo khoảng cách từ sớm; không bật shadow cao cấp đúng frame bàn giao.

**Đề xuất kỹ thuật:** dùng giờ đến đã lên lịch của nhiệm vụ làm mốc trình diễn ánh sáng cho đoạn tiếp cận; cả hai scene lấy cùng một sample ephemeris này. Đồng hồ gameplay bề mặt bắt đầu chạy từ mốc đó khi nhận điều khiển đáp. Chữ ngày giờ không được tự nhảy 15 phút lúc đổi scene. Đây là rút gọn điện ảnh của game, không tích phân ephemeris theo warp của bài tập hãm. Đồng hồ thời gian bay có thể tiến riêng nhưng không dùng để tạo hai hướng nắng khác nhau.

Giữ shader, texture, tốc độ xoay và tham số quầng sáng Trái Đất đã duyệt; vị trí/hướng trên bầu trời được quy đổi nhất quán sang frame cực Nam. Không giữ một tọa độ sai địa lý chỉ để khớp cảnh xích đạo cũ. Trong đoạn hòa không reset góc quay Trái Đất, mức thích nghi sao hay exposure.

## 5. Sửa hai điểm khựng

### 5.1. Tách Orion → điều khiển hãm

Một coordinator giữ pose camera/tàu, vận tốc tuyến tính, vận tốc góc và tốc độ thay đổi zoom tại điểm bắt đầu. Đường nối phải liên tục cả vị trí và vận tốc nhìn thấy (C1), không chỉ dùng easing làm camera dừng ở mỗi đầu rồi đổi sang một camera đang chạy.

Camera vào góc điều khiển khoảng 2,4 giây. Hệ số mô phỏng tăng mềm ×1 → ×10 trong khoảng 2 giây, bắt đầu khi góc quan sát đã đủ rõ; có thể chồng với cuối đoạn camera. Thời điểm chính xác giao người triển khai tinh chỉnh theo C1, không thêm một đoạn đứng chờ. Giảm ×10 → ×1 trong khoảng 2 giây trước cầu nối 500 m; dùng dự báo thời gian tới ngưỡng từ lịch hãm, không đợi chạm ngưỡng rồi đổi đột ngột.

Coordinator xuất một `simulationDt = realDt × warp` dùng nhất quán cho bài tập hãm và tiến trình đường bay trình diễn. Camera dùng thời gian trình diễn thực để theo pose đã cập nhật. Tách bước physics theo bước nhỏ giới hạn để tăng warp không tạo một bước tích phân lớn. Không để `stepBrake` tự nhân 10 lần nữa. Không dùng thời gian mô phỏng tăng tốc để đẩy animation UI, chân hoặc thang máy nhanh gấp 10.

**Chính sách khi người chơi hãm chưa tốt — đề xuất giữ cách chơi hiện có:** không thêm màn thua/retry mới ở pha hãm; mọi lượt vẫn được dẫn vào bài tập đáp. `BrakeState.v` tiếp tục là tốc độ của bài tập, ảnh hưởng HUD/dải mục tiêu/cảnh báo và nhiên liệu theo luật hiện có. Đường bay hiển thị là một đường tiếp cận cực Nam đã đạo diễn, lấy tiến độ từ lịch độ cao của bài tập; không tích phân kinh độ bằng `BrakeState.v` để quyết định bãi đáp. Điều này cũng xác định được phạm vi địa hình cần tải trước.

Đường trình diễn này được áp dụng từ đầu pha tiếp cận, không đợi 500 m mới kẹp tốc độ hoặc dịch tàu về site. Nó đưa tàu vào điểm đầu cầu nối đã định trước với vận tốc trình diễn hữu hạn, rồi nối C1 tới bãi đáp. Vận tốc đầu cầu nối là đạo hàm của chính đường trình diễn, không phải `BrakeState.v` (có thể vẫn gần 1.680 m/s nếu người chơi không đốt). Orion dùng đường trôi trình diễn liên tục riêng sau undock, cùng clock; camera không kéo Orion theo HLS. HUD không đổi số tốc độ bài tập thành số tốc độ trình diễn để giả vờ người chơi hãm đúng. Đây là mức nén điện ảnh được nêu rõ trong thiết kế, không thêm gia tốc vật lý vô hạn để cứu một quỹ đạo thật.

Điều kiện hết thoại không được đóng băng tàu ở ngưỡng: thoại đầu cầu nối được lên lịch đủ sớm; nếu người chơi đang nghe câu trước, chuyển tiếp bay vẫn chạy và hàng đợi thoại tiếp tục theo một owner, không chồng hai câu. Thông báo hướng dẫn ngắn không khóa bàn giao.

### 5.2. Tiếp cận → đáp tại 300 m

Giữ đường vào đáp được đạo diễn, kết thúc ở trạng thái gameplay hiện tại: 300 m AGL, vy = −12 m/s, vx = 4 m/s, tilt = 0. `BrakeState.v` không được chép làm tốc độ rơi. Ngân sách nhiên liệu đáp vẫn là 10.000 kg và được ghi nhãn riêng.

Đường cầu nối nhận pose/vận tốc trình diễn ở đầu, dùng quỹ đạo liên tục tới trạng thái cuối. AGL tính từ cùng sampler địa hình ngay dưới tàu ở cả hai scene. Camera chuyển tới góc đáp bằng đường có đạo hàm đầu/cuối khớp chuyển động chase; không chỉ Lerp pose rồi bật một luật chase khác.

**Quy ước độ cao và tiếp đất — đề xuất kỹ thuật:** −12 m/s là vận tốc dọc trục +Y của frame game, không phải đạo hàm AGL khi bay qua dốc. Sau 300 m vẫn tích phân Y bằng vận tốc này; không cập nhật Y thành `cao độ mới dưới tàu + h cũ`, vì cách đó sẽ nâng/hạ tàu theo sườn dốc mà không có lực. Có thể giữ `LandState.h` là độ cao so với mốc bãi đáp để tránh đổi API vật lý, nhưng HUD/radar và input của autopilot dùng `AGL = Y chân tàu − terrainHeight(x,z)`. Khi đổi qua lại phải giữ nguyên vận tốc thế giới.

Tiếp đất sau 300 m kiểm tra địa hình dưới vị trí hiện tại bằng sampler/mesh chung, thay phép chạm mặt phẳng `groundY` cố định; không cho chân tàu xuyên sườn hoặc đứng giữa không trung. Dùng điểm thấp nhất của các chân đã triển khai khi kiểm tra tiếp xúc, giữ tiêu chí tốc độ và góc nghiêng hiện có để phân loại đáp tốt/hỏng. Đổi cao độ tiếp xúc là sửa tính nhất quán hình học, không đổi gravity, thrust, nhiên liệu, hệ số autopilot hay giới hạn trôi ngang. Bàn giao tại offset = 0 trên điểm đáp hiện có, với 300 m tính từ mặt đất tại đó và rig/offset chân được tính đúng; các mốc này không phụ thuộc slope của đoạn trước. Kiểm thử thêm trôi ngang trên dốc và frame rơi xuyên bề mặt, không chỉ vị trí giữa bãi.

Thay ảnh canvas bằng hai render target GPU chuẩn bị sẵn. Trong khoảng hòa đề xuất 0,45 giây:

1. Coordinator cập nhật trạng thái bay/camera **một lần**.
2. Hai scene nhận cùng snapshot qua adapter đơn vị/frame; cả hai render thế giới đang chuyển động.
3. Compositor hòa hai ảnh đã khớp; GUI, hội thoại và nút điều khiển render một lần sau thế giới.
4. Sau frame cảnh mới hoàn chỉnh, đổi owner điều khiển, ngừng render cảnh cũ; không reset pose, vận tốc hoặc animation.

Không chụp canvas, `readPixels`, `drawImage`, mã hóa ảnh, tạo ảnh DOM phủ đứng hình hoặc dùng một texture frame cũ tại điểm nối. Không khóa pose đầu cảnh mới trong thời gian hòa. Hai snapshot phải có cùng silhouette và kích thước HLS, cùng terrain landmark, FOV, camera up và bóng đổ; fade không được dùng để giấu việc hai cảnh vẫn khác nhau.

Handoff gồm pose/vận tốc camera và HLS, frame/scale, FOV và tốc độ zoom, clock/warp, throttle/plume, tiến độ và vận tốc rig, chế độ lái, các phím đang giữ. Bàn giao một lần. Thang máy vẫn thu khi bay; animation chân đang mở tiếp tục đúng nhịp, không chạy lại từ đầu. Giữ SPACE xuyên đoạn nối không tắt động cơ; các phím dạng nhấn một lần không được phát lại.

Cảnh quỹ đạo hiện phóng đại HLS theo khoảng cách camera. Hệ số phóng đại này phải hội tụ mềm về kích thước model thật trong frame game trước cửa sổ hòa; tốc độ đổi scale về 0 trước khi giao điều khiển. Cảnh mới không kế thừa một tàu phóng đại rồi thu nhỏ đột ngột. Pose, footprint bóng và kích thước chiếu của cả hai bản HLS đều dùng cùng scale tại điểm nối.

## 6. Chuẩn bị, hiệu năng và vòng đời

- Loading đầu của Chơi mới bao gồm tải/giải mã địa hình cần thiết, chuẩn bị cả hai scene, shader/material/shadow variants và render target. 100% chỉ khi những công việc bắt buộc đã hoàn tất. Tải thiếu hoặc compile lỗi xử lý Retry/Back tại loading đầu.
- Không fetch dữ liệu, tạo mesh lớn, đổi LOD chưa warm hoặc biên dịch shader lần đầu tại hai điểm bàn giao. Có thể dựng tài nguyên theo batch trong loading để thanh tiến độ tiếp tục cập nhật.
- Scene bề mặt dormant không chạy gameplay, physics, survival, AI, autosave hoặc input. Khi render để hòa, chỉ cập nhật presentation từ coordinator; render observers không được bước game hai lần.
- Chỉ render kép trong cửa sổ hòa. Đề xuất cap target ở 1920 × 1080; ghi lại GPU cost và bộ nhớ đỉnh. Chọn mức target trước đoạn nối, dùng cùng mức cho cả hai ảnh trong cửa sổ hòa, không đổi độ phân giải đột ngột giữa chừng. Không giảm texture 4K hay độ chính xác heightmap để bù chi phí.
- Sau handoff, tháo render/input/update owner cũ ngay; đưa tài nguyên riêng vào hàng đợi giải phóng theo batch. Budget khởi điểm 2 ms CPU/frame, đo thực tế và giới hạn số tài nguyên xử lý mỗi batch. Texture/geometry dùng chung có ownership/refcount rõ ràng.
- Chỉ gọi dispose cuối scene sau khi tài nguyên nặng riêng đã được tháo dần; `setTimeout(() => disposeEverything())` không được coi là sửa khựng. GPU driver có thể vẫn phát sinh stall nên phải đo cả vùng sau handoff, không chỉ frame nối.
- Hàng đợi cleanup phải hữu hạn và hoàn thành trước khi cho tạo thêm cặp scene mới. New → menu → new/continue không tích lũy scene/RT/observer. Khi rời gameplay có thể cleanup trực tiếp trong menu/loading.
- Resize giữa cầu nối: giữ target đã cấp phát và cập nhật projection/compositor cùng frame; trì hoãn cấp target kích thước mới tới sau cửa sổ hòa. Không cấp phát lại render target lớn trong frame bàn giao.

Chi phí chấp nhận: loading đầu và bộ nhớ đỉnh có thể tăng. Hướng A không bảo đảm 60 FPS trên mọi thiết bị; nghiệm thu cần cùng máy, cùng viewport và báo cáo CPU/GPU cụ thể. Không tự đổi sang hướng B nếu render kép chưa đạt budget.

## 7. Các luồng phụ

- Pause/Settings dừng đồng thời tiến trình cầu nối, camera, tàu, warp ramp, rig và audio theo chính sách pause hiện có; resume không cộng thời gian đã pause vào physics.
- Skip trong mọi đoạn hủy coordinator một lần và kích hoạt bề mặt chuẩn bị sẵn theo hành vi hiện có, không loading lần hai.
- Continue khôi phục save bề mặt, không phát lại intro hoặc tạo cặp scene không cần thiết. Giữ vị trí/địa hình/save cũ.
- Không autosave trạng thái nửa bàn giao. Về menu hoặc Retry hủy callback cũ; callback hết hạn không được kích hoạt scene sau khi người chơi đã rời.
- Context loss là luồng lỗi có thông báo phục hồi riêng; không dùng nó hay fallback đen như đường chuyển cảnh bình thường.
- Nếu dữ liệu NASA bắt buộc hỏng/thiếu, báo lỗi ở loading đầu; không để một scene tự fallback procedural và scene kia vẫn dùng LOLA. Công cụ debug có thể chủ động chọn cùng một fallback cho cả hai, không mặc định bật trong gameplay.
- `intro=only` chỉ chuẩn bị tài nguyên phục vụ intro và kết thúc theo hành vi debug; luồng Chơi mới bình thường phải chuẩn bị đủ cảnh đáp từ đầu.

## 8. QA và điều kiện nghiệm thu

### Liên tục không gian

- Kiểm tra cùng ít nhất ba landmark quanh vùng đáp, đường chân trời, điểm chân tàu và bóng đổ. Hình chụp cùng thời điểm/camera ở hai scene phải khớp; sai khác vị trí landmark/silhouette tại điểm bàn giao mục tiêu ≤2 px ở 1440 × 810. Đây là đo căn cảnh, không yêu cầu mọi pixel shader giống tuyệt đối.
- Vùng lõi có checksum và giá trị cao độ không đổi; điểm đặt căn cứ/vật thể/save và raycast collision giữ nguyên. Các vành LOD không nứt, không bật miệng hố mới, không hiện mép tile.
- Mốc 300 m không có reset độ cao >0,1 m game do bàn giao. So sánh snapshot vận tốc tuyến tính/góc và camera FOV tại cùng thời điểm; đạo hàm qua biên không có bước nhảy do đổi owner. Chuyển động physics bình thường sau biên không bị tính nhầm là sai số handoff.

### Khung hình và độ mượt

- Đo production build, chạy riêng không quay/chụp để tránh overhead đo ảnh; ghi frame interval, thời gian update/render/cleanup, shader compile, GPU timing nếu thiết bị hỗ trợ. Quay clip bằng lượt riêng sau đó.
- Trên cùng máy và viewport, đo ít nhất 5 lượt cold-start và 5 lượt cache-warm cho mỗi chế độ tay/tự động; ghi rõ máy, browser, viewport và mức chất lượng.
- Báo cáo p50/p95/p99/max cho từng cửa sổ hai giây trước/sau mỗi điểm nối và đoạn bay ổn định tương đương. Mục tiêu ban đầu trên máy đủ sức chạy cảnh ổn định 60 FPS: p95 cửa sổ nối ≤25 ms; không có frame >50 ms do công việc chuyển cảnh. Không dùng số trung bình để che spike.
- Với máy chậm hoặc giới hạn 30 FPS, so sánh với baseline tương ứng, báo rõ nếu chưa đạt; không tuyên bố đã hết khựng khi chưa có số đo. Không có chủ ý giữ frame 0,45 giây, frame đen, restart render loop hoặc loading lần hai.

### Hành vi

- Chơi mới tay và tự động: tách Orion → hãm → cầu nối 500–300 m → điều khiển thật → tiếp đất; SPACE giữ xuyên handoff, A/D có hiệu lực đúng lúc, throttle/plume và chân đáp liên tục.
- Pause/Settings trước/giữa/sau mỗi biên; skip, resize, về menu, retry, Continue, asset lỗi rồi Retry và context loss có kiểm tra riêng.
- Kiểm tra dormant không đổi save/tài nguyên/giờ game; không double-update physics/audio/HUD. Theo dõi tài nguyên qua 5 chu kỳ new → menu → new/continue để phát hiện tích lũy.
- Build và kiểm thử liên quan phải qua. Bàn giao báo cáo timing, ảnh ba độ cao cùng địa điểm và hai clip (tay/tự động) có cả hai điểm nối, kèm thao tác điều khiển sau 300 m.

## 9. Tổ chức triển khai và dữ liệu

Các vùng code dự kiến: `missionStartup.ts`, `landingScene.ts`, `surfaceScene.ts`, `introDirector.ts`, `burnEntry.ts`, `descentBridge.ts`, `finalDescent.ts`; dữ liệu/sampler terrain, `orbitalTerrain.ts`, `orbitalMoon.ts`, `sky.ts`, coordinator/compositor mới và tests liên quan. Đây là ranh giới trách nhiệm, không bắt buộc tên class mới.

Nguồn lõi hiện có: NASA GSFC PGDA, High-Resolution LOLA South Pole Sites, Site01 Connecting Ridge; Barker và cộng sự (2021). URL trong `public/data/terrain/SOURCES.md`: `https://pgda.gsfc.nasa.gov/products/78`. Mọi dữ liệu bao quanh bổ sung phải ghi nguồn, coverage, datum, cách resample và checksum trong SOURCES; cập nhật phần Data của DESIGN.md và credit trong game. Không coi texture/shadow sinh thêm là ảnh NASA gốc.

Người triển khai được chọn thuật toán tessellation, khoảng LOD, kích thước vành theo frustum, cách warm shader, tên module và điều chỉnh thời lượng trong khoảng camera đầu 2–3 giây/cầu nối cuối 4–6 giây để đạt các điều kiện trên. Không được thay vùng lõi, dùng ảnh đứng, đổi sang thế giới đơn scene B hoặc sửa hình thức Trái Đất/vầng sáng để né lỗi chuyển cảnh.

Các quyết định kỹ thuật do người thiết kế đề xuất để người dùng duyệt: ánh sáng tiếp cận cùng mốc giờ đến, đường bay trình diễn cố định không thêm hình phạt pha hãm, AGL/tiếp xúc theo địa hình, time-warp ramp khoảng 2 giây, hòa GPU khoảng 0,45 giây, cap target 1080p và cleanup batch budget 2 ms. Chúng là điểm xuất phát để đo, không phải kết quả hiệu năng đã đạt.

## 10. Rà soát và phê duyệt

Đã rà soát độc lập bằng builder-check. Hai câu hỏi về lượt hãm không đạt tốc độ và quy ước AGL/tiếp đất đã được giải quyết rõ ở §5; lượt đọc lại kết luận không còn câu hỏi quan trọng trước khi lập kế hoạch. Đây là rà soát thiết kế, không phải xác nhận hiệu năng thực tế.

Việc duyệt tài liệu này mới cho phép lập kế hoạch triển khai. Chưa thay đổi code game hoặc chạy QA bản sửa trong lượt thiết kế này.
