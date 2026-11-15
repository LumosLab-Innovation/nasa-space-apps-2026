import type { Script } from '../dialogue/runner';

/** Lời thoại tiếng Việt (bản dịch của lines.en.ts). Cùng khóa, cùng thứ tự, cùng số dòng. */
export const LINES_VI: Script = {
  meetPip: [
    { speaker: 'pip', face: 'happy', text: 'Mình là Pip. Robot xây dựng. Mình đi theo các tàu chở hàng và dựng cả cái trại này theo bản vẽ. Chẳng ai bảo mình là xây cho ai.' },
    { speaker: 'pip', face: 'happy', text: 'Suốt thời gian đó mình nói chuyện với cánh tay của mình. Nó tên là Tay. Mình đặt đấy.' },
    { speaker: 'pip', face: 'curious', text: 'Tay ít nói lắm. Có bạn là tiến bộ vượt bậc rồi.' },
  ],
  rover_ready: [
    { speaker: 'houston', text: 'Artemis IV, xe tự hành đã xuống bề mặt. Tốc độ tối đa 18 km/giờ, và xe không leo được dốc quá 20 độ.' },
    { speaker: 'pip', face: 'excited', text: 'Xe hơi! Cho mình ngồi phía sau nhé? Mình sẽ bám bằng Tay. Tay khoẻ lắm.' },
  ],
  houston_pip: [
    { speaker: 'houston', text: 'Artemis IV, đó là robot xây dựng đi theo các tàu chở hàng. Bộ đàm của nó chỉ xa được vài chục mét, nên tới giờ mới có người nghe thấy nó.' },
    { speaker: 'pip', face: 'curious', text: 'Houston? Một giọng nói từ... Trái Đất? Qua mũ của bạn à? Xin chào! Xin chào Trái Đất!' },
  ],
  pip_heard: [
    { speaker: 'pip', face: 'scared', text: 'Khoan... bạn NGHE được mình à?!' },
    { speaker: 'pip', face: 'excited', text: 'Bảy tháng rồi chưa ai trả lời mình cả! Một con người thật! Một con người THẬT! Xin lỗi. Mình hơi xúc động.' },
  ],
  pip_mutter: [
    { speaker: 'pip', face: 'curious', text: 'Tay ơi, thấy chưa? Một con tàu to đùng. Siêu to luôn. Nó đáp ngay trên bãi đáp sạch sẽ của tụi mình.' },
    { speaker: 'pip', face: 'worried', text: 'Có ai đó bước ra kìa... Có nên chào không? Cậu chào trước đi. Không, cậu ấy. Cậu có bàn tay mà.' },
  ],
  silenceExplain: [
    { speaker: 'pip', face: 'curious', text: 'Bạn có nghe thấy gì ngoài này không? Không à? Chính xác!' },
    { speaker: 'pip', face: 'happy', text: 'Không có không khí thì không có âm thanh. Bạn chỉ nghe mình qua bộ đàm thôi. Mình biết. Bạn may ghê.' },
  ],
  hammerFeatherIntro: [
    { speaker: 'pip', face: 'happy', text: 'Mình giữ chiếc lông vũ này suốt bảy tháng, chỉ để chờ đúng khoảnh khắc này. Thả nó cùng lúc với cây búa nào!' },
  ],
  hammerFeatherResult: [
    { speaker: 'pip', face: 'curious', text: 'Chúng chạm đất cùng lúc! Không có không khí cản chiếc lông. Galileo đã đúng, và phi hành gia David Scott đã chứng minh điều đó ngay tại đây năm 1971.' },
  ],
  shadowQuiz: [
    { speaker: 'pip', face: 'curious', text: 'Đố vui! Tảng đá này cao một mét. Bóng của nó dài bao nhiêu?' },
    { speaker: 'pip', face: 'happy', text: 'Khoảng 38 mét! Ở cực nam, Mặt Trời chỉ vừa ló lên khỏi đường chân trời.' },
  ],
  firstSample: [
    { speaker: 'pip', face: 'curious', text: 'Hòn đá trắng kia là anorthosite. Nó là một phần lớp vỏ cổ xưa của Mặt Trăng.' },
    { speaker: 'pip', face: 'happy', text: 'Chụp ảnh, ghi vị trí, mô tả, cho vào túi. Giờ bạn là nhà địa chất thực địa thứ thiệt rồi.' },
  ],
  houstonWelcome: [
    { speaker: 'player', text: 'Houston, Artemis IV đây. Ăng-ten đã dựng xong.' },
    { speaker: 'houston', text: 'Chào mừng tới Mặt Trăng, Artemis IV. Chúng tôi đang gửi danh sách nhiệm vụ lên.' },
    { speaker: 'pip', face: 'curious', text: 'Bạn có để ý khoảng lặng không? Sóng vô tuyến mất khoảng 1,3 giây để tới Trái Đất, và 1,3 giây để quay lại.' },
    { speaker: 'pip', face: 'excited', text: 'Mình... mình tự nói với Houston được không? Bằng cái ăng-ten to này? Xin chào Houston! Mình là Pip! Mình xây cái trại này đấy!' },
    { speaker: 'houston', text: 'Chào Pip. Chúng tôi nghe rõ lắm. Cảm ơn bạn vì cái trại. Trông tuyệt lắm.' },
    { speaker: 'pip', face: 'love', text: 'Họ cảm ơn mình. Tay ơi, nghe chưa? Trái Đất cảm ơn mình đấy.' },
    { speaker: 'houston', text: 'Lưu ý: vài ngày nữa Trái Đất sẽ lặn xuống dưới đường chân trời của các bạn. Hãy lên kế hoạch làm việc.' },
  ],
  moduleDone: [
    { speaker: 'pip', face: 'happy', text: 'Khớp rồi! Làm việc nhóm! Chủ yếu là Tay làm, nhưng vẫn là làm việc nhóm.' },
    { speaker: 'pip', face: 'curious', text: 'Ở đây đồ vật nhẹ hơn sáu lần, nhưng khi đã chuyển động thì vẫn khó dừng y như cũ. Khối lượng không đổi, chỉ trọng lượng thay đổi.' },
  ],
  tracksFound: [
    { speaker: 'pip', face: 'curious', text: 'Khoan. Vết bánh xe. Sáu bánh, lưới kim loại...' },
    { speaker: 'pip', face: 'worried', text: 'Đây không phải vết của mình. Mình có bốn bánh, không phải sáu. Mà theo mình biết, ở đây đâu có robot nào khác.' },
  ],
  followTracks: [
    { speaker: 'pip', face: 'worried', text: 'Vết này cũ rồi. Ở đây không có gió, nên vết bánh có thể còn đó hàng triệu năm. Dấu giày của Apollo đến giờ vẫn còn.' },
    { speaker: 'pip', face: 'worried', text: 'Nhìn kìa, vết đi loạng choạng. Thứ tạo ra nó đang yếu dần.' },
  ],
  micaFound: [
    { speaker: 'pip', face: 'dots', text: '', pauseBeforeMs: 5000 },
    { speaker: 'pip', face: 'curious', text: 'Một... robot khác? Ở đây sao?' },
    { speaker: 'pip', face: 'sad', text: '...Nó đã ở đây một mình. Lâu lắm rồi.' },
    { speaker: 'pip', face: 'sad', text: 'Tụi mình không thể bỏ nó lại đây. Đúng không?' },
  ],
  micaIdentify: [
    { speaker: 'player', text: 'Dưới lớp bụi có một cái tên. M-I-C-A. Houston, nghe rõ không?' },
    { speaker: 'houston', text: 'MICA? Chúng tôi mất liên lạc với rover đó gần hai năm trước. Không ai biết chuyện gì đã xảy ra với nó.' },
  ],
  micaIdentifyEarthDown: [
    { speaker: 'player', text: 'Dưới lớp bụi có một cái tên. M-I-C-A.' },
    { speaker: 'pip', face: 'sad', text: 'Trái Đất đang ở dưới đường chân trời. Giờ không ai nghe được tụi mình. Giống như ngày xưa không ai nghe được MICA.' },
  ],
  micaWake: [
    { speaker: 'mica', text: 'Hệ thống: đã khởi động lại. Ngày hiện tại: không rõ. Năng lượng: 6 phần trăm. ...Có ai đó ở đây. Xác suất: ngoài dự kiến.' },
    { speaker: 'pip', face: 'happy', text: 'XIN CHÀO! Mình là Pip! Bạn là MICA đúng không? Mình kéo bạn suốt đường tới đây đó! Bạn nặng ghê, nhưng mình không phiền đâu!' },
    { speaker: 'mica', text: 'Đơn vị Pip. Đã nói 41 từ trong 8 giây. Hiệu suất giao tiếp: thấp.' },
    { speaker: 'pip', face: 'happy', text: '(thì thầm) Mình nghĩ nó thích mình.' },
  ],
  // ---- Plan 3: các điểm dừng trên hành trình (spec v3 §7) ----
  stop_landing: [
    { speaker: 'pip', face: 'happy', text: 'Bãi đáp! Mình tự tay quét đấy. Mà nói thật thì Tay làm gần hết.' },
    { speaker: 'pip', face: 'curious', text: 'Tàu đổ bộ của bạn cao năm mươi mét. Bóng của nó dài hai cây số. Mặt Trời ở đây thấp đến vậy đó.' },
    { speaker: 'pip', face: 'excited', text: 'Ồ! Bạn còn mang theo lá cờ nữa. Vòng màu cam cạnh tàu đổ bộ là chỗ cắm. Bấm E ở đó nhé.' },
  ],
  stop_base: [
    { speaker: 'pip', face: 'happy', text: 'Chào mừng tới Trại Shackleton! Bốn bệ trống, bốn thùng hàng ngoài kia. Đến giờ làm việc nhóm rồi.' },
    { speaker: 'pip', face: 'proud', text: 'Mình chọn chỗ này vì nó có nắng gần như suốt. Mình rành bất động sản lắm đó.' },
  ],
  stop_solarHill: [
    { speaker: 'pip', face: 'excited', text: 'Đồi Nắng! Gần như lúc nào cũng có nắng. Hoàn hảo cho tháp pin mặt trời.' },
    { speaker: 'pip', face: 'worried', text: 'Nhưng con dốc thì... Bụi tơi, dốc đứng. Mình và mấy cái bánh xe có... chút lo ngại.' },
  ],
  stop_boulderField: [
    { speaker: 'pip', face: 'curious', text: 'Bãi Đá Lăn. Vài tảng đá ở đây đã đi dạo xuống dốc. Từ rất, rất lâu rồi.' },
  ],
  stop_freshCrater: [
    { speaker: 'pip', face: 'curious', text: 'Một hố mới! Vành hố vẫn còn sáng. Có thứ gì đó va vào đây cách đây chưa lâu, tính theo giờ Mặt Trăng.' },
    { speaker: 'pip', face: 'worried', text: 'Cẩn thận: đá hướng về Mặt Trời nóng đến mức nấu ăn được. Bóng râm ngay cạnh thì lạnh hơn mọi tủ đông.' },
  ],
  stop_earthPeak: [
    { speaker: 'pip', face: 'love', text: 'Đỉnh Ngắm Trái Đất. Nhìn kìa. Viên bi xanh nhỏ xíu đó là nhà. Mọi người bạn quen đều ở trên đó.' },
    { speaker: 'pip', face: 'happy', text: 'Từ dưới trại, Trái Đất bị đồi che khuất. Trên này tụi mình gọi Houston được thường xuyên hơn nhiều, nhưng ngay cả ở đây Trái Đất vẫn từ từ hạ xuống rồi nhô lên lại trong tháng.' },
  ],
  stop_tracks: [
    { speaker: 'pip', face: 'curious', text: 'Hừm. Mặt đất ở đây trông... bị xáo trộn. Để mắt kỹ nhé.' },
  ],
  stop_darkCrater: [
    { speaker: 'pip', face: 'scared', text: 'Hố Tối. Hàng tỉ năm nay, Mặt Trời chưa từng chạm tới đáy của nó.' },
    { speaker: 'pip', face: 'worried', text: 'Dưới đó còn lạnh hơn bề mặt Sao Diêm Vương. Ở gần đèn của mình nhé.' },
  ],
  pipFar: [
    { speaker: 'pip', face: 'worried', text: 'Ê! Chờ mình với! Bánh xe mình nhanh, nhưng cảm xúc của mình còn nhanh hơn.' },
    { speaker: 'pip', face: 'sad', text: 'Bảy tháng một mình là đủ rồi. Làm ơn đừng bỏ mình lại nữa.' },
  ],
  // ---- Plan 3: giải cứu nhẹ nhàng (không thua game, v2 §5.8) ----
  rescue_o2: [
    { speaker: 'pip', face: 'worried', text: 'Bạn hết oxy, nên mình kéo bạn về trại. Nhẹ nhàng lắm. Gần như thế.' },
    { speaker: 'pip', face: 'curious', text: 'Các chuyến đi bộ thật trên Mặt Trăng được tính theo ba lô trên lưng: khoảng tám tiếng không khí. Luôn nhớ đường về nhà nhé.' },
  ],
  rescue_heat: [
    { speaker: 'pip', face: 'worried', text: 'Bộ đồ của bạn lạnh quá, nên mình đưa bạn về. Dưới Hố Tối nhiệt độ khoảng âm 230 độ.' },
    { speaker: 'pip', face: 'curious', text: 'Khi lắp mô-đun tản nhiệt, mình sẽ có máy sưởi, và tụi mình có thể ở dưới đó lâu hơn nhiều.' },
  ],
  rescue_pip: [
    { speaker: 'pip', face: 'sleep', text: 'Pin của mình về 0 trong bóng tối. Cảm ơn bạn đã khiêng mình về.' },
    { speaker: 'pip', face: 'happy', text: 'Tấm pin mặt trời cần nắng. Đó là toàn bộ vấn đề của cực nam Mặt Trăng, gói trong một câu.' },
  ],
  // ---- Plan 3: nâng cấp cho Pip (spec v3 §7.1) ----
  upgrade_solarTower: [
    { speaker: 'pip', face: 'excited', text: 'Yeee! Mình lại thấy nắng rồi. Robot cần nắng như bạn cần bữa sáng vậy.' },
  ],
  upgrade_radiator: [
    { speaker: 'pip', face: 'happy', text: 'Bộ tản nhiệt cho mình một máy sưởi! Giờ mình có thể theo bạn xuống Hố Tối mà khớp không bị đóng băng.' },
  ],
  upgrade_habitat: [
    { speaker: 'pip', face: 'love', text: 'Mô-đun nhà ở có tấm chắn bụi điện động. Nếu tấm pin của mình bám bụi, hãy làm sạch cho mình ở trại. Làm ơn. Mình năn nỉ đó.' },
  ],
  upgrade_antenna: [
    { speaker: 'pip', face: 'happy', text: 'Ăng-ten trại đã hoạt động. Khi Trái Đất ở trên trời, Houston có thể nghe tụi mình từ đây.' },
  ],
  eds_clean: [
    { speaker: 'pip', face: 'excited', text: 'Yeee! Mình lại cảm nhận được nắng rồi. Đây chính là thứ MICA chưa bao giờ có.' },
  ],
  // ---- Plan 3: tời ở Đồi Nắng (spec v3 §7, điểm dừng 3) ----
  winch_stuck: [
    { speaker: 'pip', face: 'worried', text: 'Ối. Bánh xe mình quay tít mà chẳng nhích được chút nào. Bụi ở đây mềm như bột mì.' },
    { speaker: 'pip', face: 'curious', text: 'Bạn leo lên đỉnh và cắm neo tời của mình nhé. Rồi mình sẽ tự kéo mình lên. Làm việc nhóm!' },
  ],
  winch_anchor: [
    { speaker: 'pip', face: 'happy', text: 'Neo xong! Bạn hô một tiếng là mình tời tụi mình lên. Mình và thùng hàng. Chủ yếu là thùng hàng.' },
  ],
  winch_done: [
    { speaker: 'pip', face: 'excited', text: 'Tụi mình làm được rồi! Có một rover tên Spirit bị kẹt trong đất mềm trên Sao Hỏa và không bao giờ thoát ra. Tụi mình thì không nhé!' },
  ],
  // ---- Plan 3: vết đá lăn đánh lạc hướng & hố mới (spec v3 §7, điểm dừng 4–5) ----
  boulder_seen: [
    { speaker: 'pip', face: 'excited', text: 'VẾT BÁNH XE! Có thứ gì đó đã chạy xuống con dốc này! Một rover khác? Một người bạn?' },
    { speaker: 'pip', face: 'curious', text: 'Khoan đã. Để mình quét bằng LIDAR trước khi phấn khích quá. Bấm R.' },
  ],
  boulder_scan: [
    { speaker: 'pip', face: 'laugh', text: 'Ha! Không phải bánh xe. Một tảng đá! Nó lăn xuống đồi và để lại một rãnh. Suýt nữa mình kết bạn với một hòn đá.' },
    { speaker: 'pip', face: 'curious', text: 'Vết bánh thật sẽ có hoa lốp hoặc dấu bánh xe. Nhớ nhé. Sau này có khi cần đến đó.' },
  ],
  crater_thermal: [
    { speaker: 'pip', face: 'curious', text: 'Thấy màu sắc không? Đá có nắng khoảng 115 độ. Bóng râm ngay cạnh khoảng âm 150.' },
    { speaker: 'pip', face: 'excited', text: 'Còn mấy đốm sáng nhỏ kia là hạt thủy tinh, bị nóng chảy do va chạm. Lấy mẫu đi!' },
  ],
  // ---- Plan 3: lá cờ Artemis IV (spec v3 §6) ----
  flag_plant: [
    { speaker: 'player', text: 'Biển Tĩnh Lặng, 1969. Cực nam Mặt Trăng, 2028.' },
    { speaker: 'pip', face: 'love', text: 'Nó không bay phấp phới. Không có không khí, không có gió. Thanh ngang trên đỉnh giữ cờ căng ra, y như cờ của Apollo.' },
  ],
  // ---- Plan 3: trạm chuyển tiếp ở Đỉnh Ngắm Trái Đất (spec v3 §7, điểm dừng 6) ----
  relay_deploy: [
    { speaker: 'pip', face: 'excited', text: 'Trạm chuyển tiếp đã dựng! Giờ để mình chỉnh chảo ăng-ten. Trái Đất thì nhỏ xíu, nhưng Tay mình vững lắm.' },
  ],
  relay_noEarth: [
    { speaker: 'pip', face: 'sad', text: 'Lúc này Trái Đất đang trốn sau đường chân trời. Không nhìn thấy nhau thì không có tín hiệu. Tụi mình phải chờ nó mọc lên.' },
  ],
  relay_align: [
    { speaker: 'houston', text: 'Artemis IV, chúng tôi đã nhận tín hiệu trạm chuyển tiếp. Nghe rất rõ. Dữ liệu bản đồ đang được gửi xuống.' },
    { speaker: 'pip', face: 'happy', text: 'LIDAR của mình giờ nhìn xa hơn nhiều, và bạn có bản đồ. Bấm M. Không có chi.' },
  ],
  // ---- Plan 3: Hố Tối (spec v3 §7, điểm dừng 8; §7.4) ----
  dark_enter: [
    { speaker: 'pip', face: 'scared', text: 'Bật máy sưởi. Bật đèn. Lòng dũng cảm... đang tải.' },
  ],
  dark_noHeater: [
    { speaker: 'pip', face: 'scared', text: 'Không có máy sưởi thì khớp mình lạnh cứng mất! Bộ đồ của bạn cũng không trụ lâu được đâu. Lắp bộ tản nhiệt ở trại trước đã.' },
  ],
  mica_ice: [
    { speaker: 'mica', text: 'Đơn vị Pip. Con người. Ngày 612: tín hiệu hydro, rất cao, bên trong hố tối. Đã truyền tọa độ.' },
    { speaker: 'mica', text: 'Mẫu băng: chưa thu thập. Nhiệm vụ: chưa hoàn thành. Yêu cầu: hoàn thành nó.' },
    { speaker: 'pip', face: 'excited', text: 'MICA đã tìm ra băng trước khi bị kẹt! Thấy tia sáng màu cam không? Chỗ đó đấy. Cùng hoàn thành nhiệm vụ của nó nào.' },
  ],
  ice_found: [
    { speaker: 'pip', face: 'love', text: 'Băng! Nước đóng băng, cất giữ trong bóng tối hàng tỉ năm. Nước uống, không khí, một ngày nào đó cả nhiên liệu tên lửa nữa.' },
    { speaker: 'mica', text: 'Mẫu đã xác nhận. Nhiệm vụ: hoàn thành. ...Cảm ơn.' },
  ],
  // ---- Plan 3 final review: lời thoại về băng khớp với những gì đã xảy ra ----
  ice_found_alone: [
    { speaker: 'pip', face: 'love', text: 'Băng! Nước đóng băng, cất giữ trong bóng tối hàng tỉ năm. Nước uống, không khí, một ngày nào đó cả nhiên liệu tên lửa nữa.' },
    { speaker: 'pip', face: 'curious', text: 'Lạ ghê. Mấy vết bánh xe tụi mình thấy cũng đang đi về hướng này...' },
  ],
  mica_ice_done: [
    { speaker: 'mica', text: 'Đơn vị Pip. Con người. Ngày 612: tín hiệu hydro, rất cao, bên trong hố tối.' },
    { speaker: 'pip', face: 'proud', text: 'Tụi mình biết rồi! Tụi mình lấy được băng rồi. Nhiệm vụ của bạn đã hoàn thành, MICA.' },
    { speaker: 'mica', text: '...Nhiệm vụ: hoàn thành. Cảm ơn.' },
  ],
  // ---- Plan 4: bão bức xạ (v2 cảnh 4.2) ----
  storm_warning: [
    { speaker: 'houston', text: 'Artemis IV, Houston đây. Đang có sự kiện hạt Mặt Trời. Proton sẽ tới Mặt Trăng trong khoảng năm mươi phút. Vào nơi che chắn ngay.' },
    { speaker: 'pip', face: 'scared', text: 'Đi thôi! Không phải mình sợ đâu nhé. Chỉ là mạch điện của mình quý giá lắm.' },
    { speaker: 'pip', face: 'worried', text: 'Vào chỗ trú ở trại hoặc tàu đổ bộ. MICA có thể chờ ngoài này. Nó đã chờ lâu lắm rồi.' },
  ],
  storm_shelter: [
    { speaker: 'pip', face: 'curious', text: 'Sao không trốn sau một tảng đá to? Vì proton trong bão không bay thẳng từ Mặt Trời tới. Chúng đến từ gần như mọi hướng.' },
    { speaker: 'pip', face: 'proud', text: 'Một lớp đất dày trên đầu sẽ chặn chúng lại. Cả chỗ trú này là mình tự đắp đó. Bảy tháng. Không có chi.' },
  ],
  storm_clear: [
    { speaker: 'houston', text: 'Artemis IV, thông lượng proton đang giảm về mức bình thường. Các bạn có thể ra ngoài.' },
    { speaker: 'pip', face: 'happy', text: 'An toàn rồi! Giờ thì, tụi mình để người bạn buồn ngủ ở đâu nhỉ?' },
  ],
  storm_clear_camp: [
    { speaker: 'houston', text: 'Artemis IV, thông lượng proton đang giảm về mức bình thường. Các bạn có thể ra ngoài.' },
    { speaker: 'pip', face: 'happy', text: 'An toàn rồi! Còn MICA đã vượt qua cơn bão ngay tại trại. Robot già cứng cáp lắm.' },
  ],
  rescue_storm: [
    { speaker: 'pip', face: 'worried', text: 'Bắt được bạn rồi! Mình kéo bạn vào chỗ trú. Ở ngoài trời, bộ đồ của bạn đang hứng bức xạ.' },
    { speaker: 'pip', face: 'curious', text: 'Trên Mặt Trăng không có khí quyển dày và không có từ trường để chặn bão Mặt Trời. Chỉ che chắn mới có tác dụng. MICA vẫn ở đúng chỗ tụi mình để nó.' },
  ],
  // ---- Plan 4: ký ức của MICA (v2 cảnh 4.5) và mở đầu Màn 5 ----
  mica_memory_intro: [
    { speaker: 'mica', text: 'Chỉ mục bộ nhớ: hỏng. Hình ảnh: nguyên vẹn. Ngày tháng: mất.' },
    { speaker: 'pip', face: 'curious', text: 'Ảnh chụp cùng một tảng đá! Nếu xếp chúng theo thứ tự, MICA có thể dựng lại nhật ký của nó.' },
  ],
  mica_logs: [
    { speaker: 'mica', text: 'Ngày 588. Đã tới vành hố tối. Bắt đầu tìm băng nước.' },
    { speaker: 'mica', text: 'Ngày 612. Tín hiệu hydro rất mạnh ở đáy hố. Xác suất có băng nước: cao.' },
    { speaker: 'mica', text: 'Ngày 640. Tấm pin mặt trời: 31% bị bụi phủ. Không có dụng cụ làm sạch.' },
    { speaker: 'mica', text: 'Ngày 655. Lỗi bộ nhớ do bức xạ: đang tăng.' },
    { speaker: 'mica', text: 'Ngày 671. Năng lượng 3%. Ưu tiên: gửi dữ liệu về Trái Đất.' },
    { speaker: 'mica', text: '...Không có Trái Đất trên bầu trời.', pauseBeforeMs: 1500 },
  ],
  mica_mission: [
    { speaker: 'mica', text: 'Nhiệm vụ của tôi chưa hoàn thành. Dữ liệu chưa từng được gửi đi. Băng chưa từng được lấy mẫu.' },
    { speaker: 'pip', face: 'excited', text: 'Vậy thì từ giờ tụi mình là bộ ba!' },
  ],
  act5_bridge: [
    { speaker: 'player', text: 'Nhiều tuần làm việc ở trại, có PIP và MICA bên cạnh. Giờ cả nhóm phải chuẩn bị cho đêm dài đầu tiên.' },
  ],
  act5_news: [
    { speaker: 'houston', text: 'Artemis IV, Houston đây. Lưu ý: khoảng sáu tiếng nữa Mặt Trời sẽ khuất sau ngọn đồi phía bắc trại. Mô hình địa hình cho thấy các bạn sẽ ở trong bóng tối ba ngày rưỡi.' },
    { speaker: 'houston', text: 'Trái Đất vẫn ở trên đường chân trời, nên ta vẫn liên lạc được, nhưng pin của các bạn phải nuôi chỗ trú, Pip và MICA suốt thời gian tối.' },
    { speaker: 'houston', text: 'Từ giờ trở đi... các bạn quyết định.' },
    { speaker: 'pip', face: 'worried', text: 'Ba ngày rưỡi không có nắng. Được rồi. Được rồi! Tụi mình chuẩn bị. Lo chỗ trú trước, hoảng sau.' },
  ],
  act5_sunset: [
    { speaker: 'pip', face: 'sad', text: 'Nhìn bóng ngọn đồi kìa. Nó đang trượt qua trại như một con sóng chậm.' },
    { speaker: 'pip', face: 'worried', text: 'Đây là bóng dài. Nó tới rồi.' },
  ],
  // ---- Plan 4: khe núi đón bình minh (v2 cảnh 5.2) ----
  notch_intro: [
    { speaker: 'pip', face: 'curious', text: 'Đây là ngọn đồi thật quanh trại, được đo bằng tia laser từ quỹ đạo. Các chấm là những chỗ Mặt Trời đã đi qua.' },
    { speaker: 'pip', face: 'curious', text: 'Mỗi ngày nó trượt khoảng mười hai độ và gần như không đổi độ cao. Nó sẽ ló qua đồi ở chỗ nào trước?' },
  ],
  notch_pick: [
    { speaker: 'pip', face: 'proud', text: 'Xoay tấm pin của mình về phía khe núi đó. Cả MICA nữa. Tia nắng đầu tiên tới là tụi mình đón ngay.' },
    { speaker: 'mica', text: 'Đã đặt góc phương vị tấm pin. Chờ đợi là một kỹ năng. Tôi giỏi kỹ năng này.' },
  ],
  // ---- Plan 4: chỗ rò nhiệt (v2 cảnh 5.2) ----
  leak_found: [
    { speaker: 'pip', face: 'curious', text: 'Thấy ánh cam không? Đó là nhiệt rò ra khỏi chỗ trú và bức xạ vào bầu trời đen.' },
    { speaker: 'pip', face: 'happy', text: 'Ở đây không có không khí, nên chẳng có gió mang nhiệt đi. Nó chỉ tỏa đi dưới dạng hồng ngoại. Để mình che lại.' },
  ],
  leak_fixed: [
    { speaker: 'pip', face: 'proud', text: 'Đắp bờ đất xong! Bụi Mặt Trăng dẫn nhiệt cực kém. Đây là tấm chăn xốp nhất hệ Mặt Trời.' },
  ],
  // ---- Plan 4: đêm dài (v2 cảnh 5.3, 5.5) ----
  mica_offer: [
    { speaker: 'mica', text: 'Phân tích: năng lượng không đủ cho ba. Tôi là robot cũ. Đề xuất: tắt tôi đi để tiết kiệm năng lượng cho các bạn.' },
    { speaker: 'pip', face: 'sad', text: 'Không. Không, không, không.' },
  ],
  mica_enough: [
    { speaker: 'mica', text: 'Phân tích: năng lượng đủ cho ba. ...Ngoài dự kiến.' },
    { speaker: 'mica', text: 'Cảm ơn.' },
    { speaker: 'pip', face: 'love', text: 'Bịt mấy chỗ rò nhiệt quả là đáng công! Chăn bụi Mặt Trăng cho tất cả mọi người!' },
  ],
  mica_kept: [
    { speaker: 'pip', face: 'happy', text: 'Không ai bị bỏ lại trong bóng tối. Lần này thì không.' },
    { speaker: 'mica', text: 'Đã định tuyến lại năng lượng. Từng watt đều có giá trị. ...Chấp nhận được. Cảm ơn.' },
  ],
  mica_slept: [
    { speaker: 'mica', text: 'Chấp nhận tắt máy. Đánh thức tôi khi Mặt Trời trở lại. Tôi sẽ ở đây.' },
    { speaker: 'pip', face: 'sad', text: 'Chỉ tới sáng thôi, MICA. Mình hứa.' },
  ],
  pip_sleep_fear: [
    { speaker: 'pip', face: 'worried', text: 'Mình phải ngủ đông để tiết kiệm pin. Nhưng... MICA cũng từng ngủ. Gần hai năm.' },
    { speaker: 'mica', text: 'Xác nhận. Tôi đã ngủ một lần. Không khuyến khích.' },
    { speaker: 'pip', face: 'dizzy', text: 'MICA!' },
    { speaker: 'mica', text: '...Đó là một câu đùa. Tôi đang học.' },
    { speaker: 'pip', face: 'laugh', text: 'Bạn vừa đùa đấy à?! Dở tệ! Mình thích lắm! Chúc ngủ ngon...' },
  ],
  night_day2: [
    { speaker: 'player', text: 'Giờ sao ở khắp nơi. Còn Trái Đất chỉ là một vầng lưỡi liềm bạc mảnh, cạnh chỗ Mặt Trời vừa lặn.' },
  ],
  pip_sleep_alone: [
    { speaker: 'pip', face: 'worried', text: 'MICA ngủ rồi. Tới lượt mình tiết kiệm pin… Khi nắng trở lại, bạn vẫn ở đây chứ?' },
    { speaker: 'player', text: 'Mình sẽ trông trại. Ngủ ngon nhé, PIP. Tụi mình sẽ cùng đánh thức MICA.' },
  ],
  night_day3_offline: [
    { speaker: 'player', text: 'Đã tắt bộ đàm để tiết kiệm điện. Trái Đất vẫn ở đó. Khi nối lại liên lạc, mình sẽ kể Houston nghe cả nhóm đã vượt qua thế nào.' },
  ],
  night_day4_alone: [
    { speaker: 'player', text: 'Sườn núi phía đông bắt đầu sáng lên. Cố lên, PIP. Cố lên, MICA. Sắp sáng rồi.' },
  ],
  night_day3: [
    { speaker: 'houston', text: 'Artemis IV, Houston đây. Chúng tôi luôn nghĩ về các bạn. Mặt Trời đang đi vòng sau ngọn đồi của các bạn, đúng lịch trình.' },
  ],
  night_day4: [
    { speaker: 'mica', text: 'Quan sát: sườn núi phía đông đang sáng lên. Bình minh trong chưa đầy một ngày.' },
  ],
  // ---- Plan 4: bình minh và kết thúc (v2 K.1–K.3) ----
  dawn_pip_good: [
    { speaker: 'pip', face: 'excited', text: 'Ánh sáng! Xuyên thẳng qua khe núi, rọi thẳng vào tấm pin của mình!' },
    { speaker: 'pip', face: 'laugh', text: '...Mình vừa mơ thấy một câu đùa siêu hay. Mình quên mất rồi. Nhưng nó hay lắm.' },
  ],
  dawn_pip_late: [
    { speaker: 'pip', face: 'dizzy', text: 'Ưm... Mặt Trời mọc ở đằng kia à? Tấm pin của mình quay sai hướng rồi. Đang sạc... chậm...' },
    { speaker: 'pip', face: 'happy', text: 'Dù sao mình cũng tỉnh rồi! Khi nào được thì xoay mình về phía ánh sáng nhé. Bấm Q là mình tới chỗ bạn.' },
  ],
  dawn_mica_kept: [
    { speaker: 'mica', text: 'Hệ thống: trực tuyến. Pin ấm. Tỉ lệ thành công: 100%.' },
    { speaker: 'mica', text: '...Pip. Câu đùa sáng nay: chấp nhận được.' },
  ],
  dawn_mica_slept: [
    { speaker: 'mica', text: 'Hệ thống: đang khởi động lại. Lần khởi động thứ hai. Tỉ lệ thành công: 100%.' },
    { speaker: 'mica', text: '...Pip. Bạn đã giữ lời hứa. Câu đùa sáng nay: chấp nhận được.' },
  ],
  comms_on: [
    { speaker: 'pip', face: 'happy', text: 'Liên lạc đã trở lại! Trái Đất vẫn ở trên kia. Nhưng chưa đầy một ngày nữa nó sẽ lặn. Không được phí thời gian!' },
  ],
  send_data: [
    { speaker: 'player', text: 'Houston, Artemis IV đây. Đang gửi dữ liệu của MICA. Ngày 612: tín hiệu hydro. Kèm một mẫu băng mà nó đã tìm ra.' },
    { speaker: 'houston', text: '...Chúng tôi nhận được rồi. Dữ liệu của MICA. Gần hai năm... cuối cùng nó cũng về tới nhà.' },
    { speaker: 'mica', text: 'Nhiệm vụ: hoàn thành. Lần này, trước khi Trái Đất lặn.' },
  ],
  farewell: [
    { speaker: 'pip', face: 'sad', text: 'Bạn sẽ quay lại chứ? Mình sẽ giữ căn cứ sạch sẽ. Gần như sạch.' },
    { speaker: 'pip', face: 'love', text: 'Và lần này... mình không còn một mình.' },
    { speaker: 'mica', text: 'Xác nhận. Tôi sẽ giám sát Pip. Hiệu suất giám sát dự kiến: thấp.' },
  ],

  // ---- Plan 5: mở đầu hạ cánh từ quỹ đạo (v2 M1–M5) ----
  landing_m1: [
    { speaker: 'houston', text: 'Artemis IV, Houston đây. Các bạn được phép chuyển sang tàu đổ bộ (GO).' },
    { speaker: 'commander', text: 'Rõ, Houston. Cửa khoang đã mở. Mặt Trăng ở ngay ngoài cửa sổ.' },
  ],
  landing_tranquility: [
    { speaker: 'houston', text: 'Hãy nhìn xuống vùng đồng bằng tối màu kia. Đó là Biển Tĩnh Lặng.' },
    { speaker: 'houston', text: 'Điểm đánh dấu là Căn cứ Tĩnh Lặng. Apollo 11 đã hạ cánh ở đó ngày 20/7/1969. Hãy cùng nhìn lại nơi hành trình bắt đầu.' },
  ],
  landing_undock: [
    { speaker: 'commander', text: 'Tách tàu hoàn tất. Tôi thấy bạn rồi, mọi thứ đều ổn. Chúc may mắn dưới đó.' },
  ],
  landing_burn: [
    { speaker: 'houston', text: 'Bắt đầu đốt động cơ hãm. Giữ SPACE để bật động cơ và giữ tốc độ trong dải màu xanh lá.' },
  ],
  landing_brake_assist: [
    { speaker: 'houston', text: 'Lái tự động đang thực hiện pha đốt hãm. Theo dõi tốc độ bám theo dải xanh lá.' },
  ],
  landing_warn_fast: [
    { speaker: 'houston', text: 'Bạn đang quá nhanh so với độ cao. Giữ SPACE để hãm mạnh hơn.' },
  ],
  landing_warn_slow: [
    { speaker: 'houston', text: 'Bạn đang giảm tốc quá sớm. Nhả bớt SPACE để tàu lướt đi.' },
  ],
  landing_alarm: [
    { speaker: 'commander', text: 'Cảnh báo chương trình! Máy tính quá tải. Houston, chúng ta làm gì đây?' },
    { speaker: 'houston', text: '...Cảnh báo đó không sao, vẫn tiếp tục (GO)! Máy tính chỉ bận, không hỏng. Cứ tiếp tục.' },
  ],

  // ---- Plan 5: hạ cánh cuối cùng xuống cực nam ----
  land_start: [
    { speaker: 'commander', text: 'Ba trăm mét. Động cơ hạ cánh đã bật. Bạn điều khiển.' },
    { speaker: 'commander', text: 'Giữ SPACE để đẩy lên, A và D để nghiêng. Hạ xuống chậm và thẳng: chậm hơn 1 mét mỗi giây!' },
  ],
  land_start_auto: [
    { speaker: 'commander', text: 'Ba trăm mét. Lái tự động đang điều khiển hạ cánh. Chú ý bụi.' },
  ],
  land_ok: [
    { speaker: 'commander', text: 'Đèn tiếp đất sáng. Tắt động cơ. Chúng ta đã ở trên Mặt Trăng.' },
    { speaker: 'commander', text: 'Chào mừng tới cực Nam. Nhìn cái bóng ngoài cửa sổ kìa. Có gì đó nhỏ nhỏ vừa động đậy cạnh mấy thùng hàng...' },
  ],
  land_tipped: [
    { speaker: 'commander', text: 'Úi! Bạn nghiêng quá nhiều và tàu đổ bộ bị lật.' },
    { speaker: 'commander', text: 'Chuyện đó từng xảy ra thật với tàu Odysseus năm 2024. Nó vẫn gửi dữ liệu khoa học về. Thử lại nào, thật thẳng nhé.' },
  ],
  land_tooFast: [
    { speaker: 'commander', text: 'Mạnh quá! Thử lại nào, lần này nhẹ nhàng thôi.' },
  ],
  land_noFuel: [
    { speaker: 'commander', text: 'Hết sạch nhiên liệu và tàu rơi xuống! Bay lơ lửng tốn nhiên liệu từng giây. Hạ xuống đều đặn, đừng treo lơ lửng trên không.' },
  ],
  land_drift: [
    { speaker: 'commander', text: 'Êm đấy, nhưng đang trượt ngang! Nghiêng ngược hướng trôi bằng A hoặc D cho tới khi dưới 1 mét mỗi giây.' },
  ],
  land_suggest_auto: [
    { speaker: 'commander', text: 'Khó nhỉ? Bấm H là lái tự động sẽ bay. Phi công thật cũng dùng lái tự động mà.' },
  ],

  // ---- Plan 5: tàu chở hàng (màn 2E) ----
  cargo_warn: [
    { speaker: 'houston', text: 'Artemis IV, Houston đây. Một tàu chở hàng không người lái sẽ hạ cánh cách trại khoảng 650 mét về phía bắc trong 90 giây nữa.' },
    { speaker: 'houston', text: 'Luồng khí phụt của nó bắn bụi và sạn ngang ra, rất nhanh và rất xa. Đưa Pip ra sau một gờ đất.' },
    { speaker: 'pip', face: 'worried', text: 'Cát bay nghìn cây số một giờ á? Lớp sơn của mình xin kiếu nha.' },
  ],
  cargo_pip_hide: [
    { speaker: 'pip', face: 'excited', text: 'Trốn đây! Gờ đất này chắn đường thẳng tới bãi hạ cánh. Ở đây bụi bay là là mặt đất, nên chỗ nấp thấp là đủ.' },
  ],
  cargo_stow_tower: [
    { speaker: 'houston', text: 'Tháp pin mặt trời của các bạn đã được lắp. Hãy gập tấm pin trước khi tàu chở hàng tới.' },
  ],
  cargo_pip_safe: [
    { speaker: 'pip', face: 'proud', text: 'Vèo! Bụi bay vọt qua gờ đất của mình. Không dính một hạt nào!' },
  ],
  cargo_pip_dusty: [
    { speaker: 'pip', face: 'dizzy', text: 'Mình... mình thành lâu đài cát rồi. Chỗ nào cũng lạo xạo. Bánh xe mình chậm rì.' },
  ],
  cargo_pip_eds: [
    { speaker: 'pip', face: 'happy', text: 'Tấm chắn bụi ở trại có thể xẹt điện đánh bay chỗ bụi này. Đưa mình về và bấm E cạnh mình nhé.' },
  ],
  cargo_pip_noeds: [
    { speaker: 'pip', face: 'sad', text: 'Khi mô-đun nhà ở dựng xong, tụi mình sẽ có tấm chắn bụi. Tới lúc đó mình sẽ... lạo xạo.' },
  ],
  cargo_tower_dusty: [
    { speaker: 'houston', text: 'Tấm pin của tháp pin mặt trời bị dính bụi, nên sạc chậm hơn. Phủi sạch đi: bấm E ở tháp.' },
  ],
  cargo_tower_brushed: [
    { speaker: 'pip', face: 'happy', text: 'Tấm pin sáng bóng trở lại! Sạc nhanh đã quay về.' },
  ],

  // ---- Plan 5: ánh sáng chân trời (2G, vẫn đang tranh luận) ----
  glow_seen: [
    { speaker: 'pip', face: 'curious', text: 'Nhìn kìa, ngay trên đường chân trời về phía Mặt Trời. Ánh sáng mờ mờ đó!' },
    { speaker: 'pip', face: 'curious', text: 'Có thể là bụi tích điện đang lơ lửng... các nhà khoa học vẫn còn tranh luận. Mình đứng về phe... để mình xem thêm chút nữa.' },
  ],
};
