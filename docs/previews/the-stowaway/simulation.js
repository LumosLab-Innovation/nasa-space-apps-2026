"use strict";

const chapters = [
  { short: "01 · Dựng trạm", name: "Người đầu tiên mở cửa", caption: "Bạn gặp PIP đang căn kiện nguồn tại bãi mô-đun.", story: [
    "Bạn là phi hành gia Artemis IV. Sau khi chuyển từ Orion sang tàu đổ bộ, bạn chứng kiến tàu tách, hiệu chỉnh quỹ đạo, hãm và tiếp cận bãi đáp Cực Nam. Trong câu chuyện, chuyến hàng SpaceX đã đưa các mô-đun LANTERN và PIP tới trước.",
    "Bạn bước xuống, kiểm tra bộ đồ EVA rồi tới bãi mô-đun. PIP đang căn kiện nguồn. Bạn trò chuyện để PIP tự đi theo, sau đó chọn lối vận chuyển. Trên gờ sáng, bạn xoay tấm pin, ra hiệu PIP giữ linh kiện rồi tự khóa đầu nối của mô-đun kín. Hộp cây thử nghiệm vào nhà kính, chiếc lá đầu tiên sáng lên. Bên cạnh đường hàng có dấu bánh nhỏ hơn bánh PIP. Vệt cũ ấy dẫn tới một mốc khảo sát đã bạc màu."
  ] },
  { short: "02 · Khảo sát", name: "Những vết sẹo biết kể chuyện", caption: "Bạn ghi số liệu ở vành hố, PIP theo sau với hộp mẫu.", story: [
    "Từ trạm sạc, bạn mở tuyến tới vành miệng hố. Đường trên gờ cần xử lý tải khi leo dốc. Lối thấp ít dốc hơn nhưng qua đoạn lạnh, nên cần dành điện sưởi và điện quay về. Đổi góc quan sát, bạn nhận ra một đường viền trên ảnh chỉ là bóng đổ. Trong bài tập với hai hố mô phỏng, vành của hố nhỏ cắt vành hố lớn, cho phép lập luận về thứ tự tương đối.",
    "Bạn chụp ảnh, tự lấy mẫu lớp phủ và mẫu đối chứng, rồi ghi vị trí, điều kiện chiếu sáng và số hiệu mẫu vào nhật ký. PIP giữ hộp mẫu. Cả hai chưa biết tuổi tuyệt đối hay có băng ở đó. Các mốc cũ tiếp tục dẫn qua một đoạn dốc tới một trạm đã tắt. Trong bóng của khung trạm là MICA, một rover đời cũ đang nằm im với tấm pin phủ bụi."
  ] },
  { short: "03 · Cứu MICA", name: "Đừng khởi động vội", caption: "Đủ điện để chẩn đoán là bước đầu của cuộc cứu hộ.", story: [
    "Bạn kiểm tra nắng tới panel, nhiệt của robot và nguồn qua cổng bảo trì. Cùng một vị trí, tấm pin cho ít công suất khi bám bụi. Nguồn bảo trì phụ cho phép kích hoạt một phần bề mặt có tấm loại bụi điện động. Công suất đo lại tăng. MICA vẫn chưa thể khởi động bộ điều khiển chính.",
    "Bản log còn đọc được ghi các lỗi dai dẳng từ trước khi nguồn cạn. Trong câu chuyện, bức xạ ion hóa tích lũy đã làm suy thoái bo đời cũ. Bạn có thể thử một lần reset an toàn và thấy lỗi lặp, rồi xác định bo cần thay. Bạn chọn bệ chở hoặc tời, đưa MICA về LANTERN, thay bo dự phòng, kiểm tra bản sao và chạy thử tải thấp. Một phần nhật ký mất, nhưng bản đồ cũ vẫn dùng được. MICA nói câu đầu ngắn gọn: “Công việc đang chờ. Chuẩn bị trạm.”"
  ] },
  { short: "04 · Giữ nhiệt", name: "Ánh sáng không đủ", caption: "Căn cứ sáng đèn và vẫn có thể thiếu khả năng thải nhiệt.", story: [
    "Bạn nối các mô-đun thử nghiệm và chạy nhiều tải cùng lúc. Pin vẫn còn điện nhưng tản nhiệt không đủ cho cấu hình đang thử. Hệ thống giảm tải để bảo vệ thiết bị. PIP đề nghị xem mặt tản nhiệt trước khi nghĩ đến chuyện đem thêm pin.",
    "MICA đưa ra tuyến bảo trì cũ. Bạn kiểm tra lại địa hình và điểm lạnh, dành điện sưởi rồi đưa thiết bị tới bề mặt tản nhiệt. Có thể phục hồi một mặt hỗ trợ loại bụi hoặc lắp tấm bổ sung để có thêm khoảng dự phòng. Tại điểm bàn giao, bạn cách ly hộp thu bụi có gioăng mòn. Việc sửa nguồn tái nhiễm giúp lần vận chuyển sau giữ được các đầu nối sạch."
  ] },
  { short: "05 · Nghiệm thu", name: "Ba người thợ", caption: "PIP giữ tải. MICA tiếp cận đầu nối mà thân PIP không lọt qua.", story: [
    "Bạn đi tới điểm lắp cuối cùng với PIP. Robot chống chân và giữ tải để bạn khóa kết nối. MICA vào khe bảo trì theo tuyến và giới hạn tải bạn xác nhận. Hai robot hoàn thành đầu nối bằng những khả năng riêng, với bạn điều phối từng bước. Sau đó bạn chọn vị trí cấu kiện bảo vệ, xếp lịch đèn và bơm nhà kính, dành nước sinh hoạt và giữ tải sống giả lập qua pha bóng che.",
    "Bài thử có thể báo thiếu dự phòng hoặc vượt giới hạn nhiệt nếu bạn dồn quá nhiều việc cùng pha. Bạn đọc từng pha, đổi lịch hoặc nạp thêm nguồn rồi thử lại. Một chuyến chuyển hàng qua điểm bàn giao sạch là bài kiểm tra cuối cùng. Khi cả điện, nhiệt, tải sống, nhà kính, khu bảo vệ và tuyến sạch đạt, LANTERN đủ điều kiện bàn giao trong nhiệm vụ."
  ] },
  { short: "Kết · Bàn giao", name: "Những người đến trước", caption: "Dấu chân người đến sau hai hàng dấu bánh.", story: [
    "Một ảnh từ bản sao của MICA hiện ra. Khi vùng đất còn trống, nó đã đặt các mốc với nhiệm vụ chuẩn bị vị trí cho những người đến sau. Đó là những mốc bạn dùng từ chuyến khảo sát đầu tiên. PIP nhìn căn cứ và nói nó đã tưởng hai bạn đến để bắt đầu. MICA đáp rằng công việc được tiếp tục.",
    "Bạn đặt chỗ đỗ sạch cho MICA cạnh PIP, ghi kết quả nghiệm thu và mang mẫu niêm phong về tàu. Ánh đèn nhà kính vẫn bật khi bạn chuẩn bị trở lại quỹ đạo. Dấu chân của bạn đi cạnh hai hàng dấu bánh. PIP nói đã chuẩn bị một câu đùa, ngừng một nhịp rồi bảo để lát nữa."
  ] }
];

const byId = (id) => document.getElementById(id);
const descent = [
  { art:0, title:"Tách khỏi Orion", desc:"Tàu đã tới quỹ đạo Mặt Trăng. Bạn và đồng đội chuyển sang tàu đổ bộ rồi kiểm tra trước khi tách.", line:"Orion · Đường tách đã thông. Hẹn gặp ở quỹ đạo.", caption:"Tàu đổ bộ tách khỏi Orion trên quỹ đạo Mặt Trăng." },
  { art:0, title:"Hạ điểm thấp quỹ đạo", desc:"Tàu đốt động cơ hiệu chỉnh để hạ điểm thấp của quỹ đạo. Cảnh chuyển tới lúc tàu vào đường tiếp cận.", line:"Dẫn đường · Đã vào quỹ đạo tiếp cận.", caption:"Quỹ đạo tiếp cận đưa tàu tới điểm bắt đầu hãm." },
  { art:1, title:"Hãm bằng động cơ", desc:"Động cơ chính giảm vận tốc ngang. Tàu hạ thấp dần và giữ đường tiếp cận theo dẫn đường.", line:"Đồng đội · Vận tốc ngang đang giảm.", caption:"Giai đoạn hãm chính trước khi tiếp cận Cực Nam." },
  { art:1, title:"Nhìn thấy bãi đáp", desc:"Tàu chỉnh tư thế và bãi đáp hiện qua cửa sổ. Bóng dài làm những tảng đá khó đọc. Điểm đáp được đánh dấu trên nền bằng, cách khu mô-đun đã gửi trước.", line:"Dẫn đường · Bãi đáp xác nhận. Tiếp tục hạ thẳng đứng.", caption:"Từ buồng lái, bạn thấy vùng bằng phẳng cạnh những bóng đá dài." },
  { art:2, title:"Tiếp xúc bề mặt", desc:"Tín hiệu tiếp xúc bật. Pha động cơ kết thúc và tàu ổn định trên chân đáp. Hai phi hành gia chuẩn bị EVA.", line:"Đồng đội · Đã tiếp đất. Chuẩn bị ra ngoài.", caption:"Tàu tiếp đất tại Cực Nam. Nhiệm vụ trên bề mặt bắt đầu." }
];
const introFrames = [descent[0], descent[3], descent[4]];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const initial = () => ({
  intro: 0, introPaused: false, step: 0, pipJoined: false, eva: 100,
  energy: 72, dust: 6, solar: 0, cooling: 18, mica: 0, evidence: 0,
  water: 20, panelReading: 12, shield: "", isolated: false, passed: false,
  greenhousePhase: 1, servicePhase: 1, greenhouseWater: 9, test: null,
  travel: null, message: "", journal: []
});
let state = initial();
let view = "play";
let descentTimer;

function record(message) {
  state.message = message;
  state.journal.push(message);
}

function advance(message, change) {
  if (change) change(state);
  state.energy = clamp(state.energy, 0, 100);
  state.dust = clamp(state.dust, 0, 100);
  if (message) record(message);
  state.step += 1;
  render(true);
}

function explain(message) {
  state.message = message;
  byId("feedback").textContent = message;
}

function option(label, detail, action) { return { label, detail, action }; }
function next(label, detail, message, change) { return option(label, detail, () => advance(message, change)); }
function hint(label, detail, message) { return option(label, detail, () => explain(message)); }

function travel(label, detail, path, energy, dust, message) {
  return option(label, detail, () => {
    state.message = "Nhấn → hoặc chọn Tiến tới mốc tiếp theo. Bạn đi trước, PIP tự theo phía sau.";
    state.travel = { path, cursor: 0, energy, dust, message };
    render();
    byId("drive").focus();
  });
}

const ridge = [[35,98],[119,43],[211,35],[323,68]];
const bypass = [[35,98],[118,115],[222,120],[323,68]];

const steps = [
  { c:0, art:2, title:"Bước xuống Cực Nam", desc:"Bạn là một trong hai phi hành gia Artemis IV trên bề mặt. Kiểm tra bộ đồ EVA và đánh dấu tàu là điểm quay về. Bãi mô-đun LANTERN nằm phía trước.", line:"Đồng đội · Kiểm tra bộ đồ xong. Bãi thiết bị cách khu tiếp đất một đoạn.",
    choices:()=>[next("Kiểm tra bộ đồ và đi tới bãi mô-đun", "Lưu điểm quay về tàu trong nhật ký.", "Đã lưu đường về tàu. Bạn thấy một robot đang căn kiện nguồn ở bãi mô-đun.")] },
  { c:0, title:"Gặp PIP ở bãi mô-đun", desc:"PIP đang căn một kiện nguồn trên bệ chở, công việc được giao trước khi tàu bạn tới. Bạn tiến lại, giới thiệu và đề nghị nó đi cùng chuyến khảo sát.", line:"PIP · Tôi được giao sắp kiện số một. Phi hành gia số một cũng nằm trong danh sách bàn giao à?", plain:"PIP · Kiện nguồn đã được căn. Tôi có thể đi cùng khi bạn sẵn sàng.",
    choices:()=>[next("Trò chuyện và mời PIP đi cùng", "Bạn đi trước. PIP tự chọn lối an toàn để theo sau và hỗ trợ khi được gọi.", "PIP kết thúc việc tại bãi và chuyển sang đi theo phi hành gia.", s=>{s.pipJoined=true;})] },
  { c:0, title:"Đưa kiện nguồn tới trạm", desc:"Đường gờ ngắn nhưng dốc. Lối bảo trì dài hơn, ít bụi bám vào bánh và mặt bàn giao hơn. Giữ đủ dự phòng cho việc lắp ráp.", line:"PIP · Lộ trình ngắn tiết kiệm điện. Tôi cũng có thể dành phần điện đó để than phiền ít hơn.", plain:"PIP · Đường gờ ngắn. Lối bảo trì ít bụi hơn.",
    choices:()=>[travel("Qua gờ ngắn", "−8 điện · +9 bụi.",ridge,8,9,"Đã qua gờ ngắn. Kiện nguồn đến sớm, bánh PIP bám thêm bụi."),travel("Theo lối bảo trì", "−12 điện · +3 bụi.",bypass,12,3,"Đã tới bãi lắp bằng đường vòng. Tuyến giao sạch hơn.")] },
  { c:0, title:"Chọn chỗ đặt cột pin", desc:"Xem hướng chiếu sáng trước khi đặt. Gờ cao có lợi thế ánh sáng và cần kéo cáp xa hơn. Gần kho dễ lắp, nhưng một phần cửa sổ nắng bị địa hình che.", line:"PIP · Mặt Trời đã ở đúng chỗ. Bây giờ tới lượt chúng ta.",
    choices:()=>[next("Lắp trên gờ sáng", "−5 điện lắp đặt · sản lượng cao hơn trong bài thử.","Đặt pin trên gờ sáng. Dự phòng nắng tốt hơn, tuyến cáp dài hơn.",s=>{s.energy-=5;s.solar=18;}),next("Lắp gần kho", "−2 điện lắp đặt · sản lượng thấp hơn khi chạy thử.","Đặt pin gần kho. Đường cáp ngắn và dễ sửa.",s=>{s.energy-=2;s.solar=15;})] },
  { c:0, title:"Ghép mô-đun đầu tiên", desc:"Mô-đun tới trên bệ chở. Tay PIP chỉ căn đầu nối và nhấc linh kiện phù hợp. Ra hiệu PIP chống chân trước khi vươn tay. Bạn tự căn và khóa đầu nối.", line:"PIP · Tôi tính được mô-men. Tôi vẫn thích đặt chân chống trước.", plain:"PIP · Chân chống cần được triển khai trước khi vươn tay.",
    choices:()=>[next("Ra hiệu PIP giữ tải, tự khóa và nối trạm", "Lắp cụm tản nhiệt cơ bản và bật nhà kính thử nghiệm.","Mô-đun kín qua kiểm tra. Chiếc lá đầu tiên sáng lên. PIP nạp dự phòng và phát hiện dấu bánh nhỏ.",s=>{s.energy+=22;}),next("Lắp thêm mặt tản nhiệt dự phòng", "Tốn thêm điện lắp đặt · có thêm khoảng nhiệt ở chương 4.","Trạm mở đèn với mặt tản nhiệt dự phòng đã lắp. Bên ngoài có dấu bánh cũ nhỏ hơn bánh PIP.",s=>{s.energy+=15;s.cooling=29;}),hint("Yêu cầu PIP nâng khi chưa chống chân", "Kiểm tra phản ứng với tải lệch trọng tâm.","PIP dừng tay theo giới hạn mô-men. Triển khai chân chống để tiếp tục.")] },
  { c:1, title:"Đi bộ tới vành miệng hố", desc:"Bạn đã có nguồn quay về. Hãy chọn giữa gờ dốc có nắng và lối thấp mát hơn. Lối thấp cần sưởi, nên ít dốc không đồng nghĩa với tốn ít điện hơn.", line:"PIP · Hai tuyến đều tới nơi. Chỉ có một tuyến cho tôi sưởi chân.", plain:"PIP · Lối thấp cần dành điện sưởi.",
    choices:()=>[travel("Đi dọc gờ có nắng", "−9 điện · +6 bụi.",ridge,9,6,"Bạn tới điểm nhìn trên gờ. PIP theo sau và giữ khoảng cách trên đoạn dốc."),travel("Qua lối thấp có sưởi", "−13 điện · +2 bụi.",bypass,13,2,"Đã qua vùng lạnh và vẫn giữ dự phòng. Chi phí sưởi xuất hiện trong nhật ký.")] },
  { c:1, title:"Một miệng hố, hay một cái bóng?", desc:"Ở ảnh góc thấp, một vùng tối trông giống hố mới. Quan sát từ điểm cao và so với cao độ. Gần đó, hai vành hố thật chồng lên nhau.", line:"PIP · Ảnh cho tôi một giả thuyết. Tôi cần thêm một phép đo.",
    choices:()=>[next("Đổi góc và so cao độ", "Kiểm tra bóng đổ, sau đó xem vành nào bị cắt.","Một rìa tối chỉ là bóng. Vành hố nhỏ cắt vành hố lớn, hỗ trợ kết luận hố nhỏ hình thành sau.",s=>{s.evidence=1;}),hint("Kết luận chỉ từ vùng tối", "Thử đánh giá bằng một bức ảnh.","Vùng tối có thể do bóng che hoặc địa hình sâu. So cao độ và đổi góc để phân biệt.")] },
  { c:1, title:"Mang bằng chứng về, cùng viên đá", desc:"Một mẫu ở lớp phủ và một mẫu đối chứng cho phép so sánh. Bạn dùng dụng cụ lấy mẫu. Ghi ảnh, vị trí, số hiệu và điều kiện trước khi niêm phong.", line:"PIP · Tôi có thể nhặt mọi thứ. Nhà khoa học sẽ thích việc bạn chọn đúng hai mẫu hơn.", plain:"PIP · Chọn mẫu mục tiêu và mẫu đối chứng.",
    choices:()=>[next("Lấy mẫu, ghi số liệu và niêm phong", "Lưu hai mẫu vào sổ khoa học.","Sổ thực địa đã lưu ảnh, vị trí và số liệu minh họa. M01 ở gờ sáng, dốc 11°, nhiệt bề mặt −28 °C. M02 đối chứng ở rìa bóng, dốc 5°, nhiệt bề mặt −64 °C.",s=>{s.evidence=2;}),hint("Chỉ nhặt viên đá dễ thấy", "Thử bỏ bước ghi vị trí.","Thiếu ảnh và mẫu đối chứng thì chưa đủ để giải thích lớp vật liệu. Bổ sung ngữ cảnh trước khi rời điểm đo.")] },
  { c:2, title:"Tìm thấy MICA", desc:"Các mốc cũ dẫn tới trạm tiền trạm. Dưới chân giá bảo trì, một rover nhỏ nằm im. Tấm pin phủ bụi và màn trạng thái đã tắt. Bạn đánh dấu vị trí trước khi động vào thiết bị.", line:"PIP · Thiết kế cũ hơn tôi. Đường đi thì có vẻ tốt hơn của tôi.", plain:"PIP · Đây là MICA. Dấu bánh cũ trùng với kích thước bánh của nó.",
    choices:()=>[next("Quét panel, đầu nối và nhiệt độ", "Kiểm tra đủ điều kiện trước khi cấp điện.","Đã kiểm tra đầu nối và nhiệt. Panel có ánh sáng nhưng công suất dưới tải thấp. MICA vẫn bất động.",s=>{s.mica=1;}),hint("Khởi động trực tiếp", "Thử cấp điện ngay cho mạch chính.","Khóa an toàn giữ mạch chính cô lập. Hãy kiểm tra nguồn, đầu nối và nhiệt trước.")] },
  { c:2, title:"Thiếu nắng hay thiếu công suất?", desc:"Giữ hướng và điều kiện chiếu sáng khi so phép đo. Dùng nguồn bảo trì giới hạn dòng để đọc cổng chẩn đoán, rồi xử lý vùng panel có EDS tích hợp.", line:"PIP · Nắng vẫn tới. Ta cần đo xem bao nhiêu điện thực sự đi qua tải.",
    choices:()=>[next("Đo trước và sau khi chạy EDS", "−6 điện phụ · giữ cùng vị trí đo.","Công suất minh họa tăng từ 12 lên 34. Nguồn chẩn đoán ổn định nhưng mạch chính vẫn báo lỗi.",s=>{s.energy-=6;s.panelReading=34;s.mica=2;}),hint("Chỉ chuyển MICA ra nắng", "Kiểm tra giả thuyết bóng che.","Panel đã nhận ánh sáng tại vị trí thử. Lớp bụi vẫn che bề mặt. So phép đo trước và sau khi xử lý bụi.")] },
  { c:2, title:"Nguồn đã về. MICA vẫn chưa thức.", desc:"Cổng phục hồi đọc được bản ghi trước khi mất nguồn. Lỗi bo đã xuất hiện nhiều lần. Bạn cần xác định lỗi phần cứng dai dẳng và tìm bản sao có thể kiểm chứng.", line:"PIP · Có điện để đọc bệnh án. Đây mới là lúc bắt đầu sửa.",
    choices:()=>[next("Chạy tự kiểm tra và đối chiếu bản sao", "Khoanh vùng bo giao tiếp và điều khiển chuyển động.","Tự kiểm tra lặp lại cùng lỗi khi nguồn đã ổn định. Bản sao có phần hợp lệ để chuyển sang bo dự phòng."),hint("Thử reset qua cổng phục hồi", "Kiểm tra khả năng lỗi thoáng qua.","Một lần reset an toàn đã chạy. Lỗi vẫn lặp. Hãy cô lập và thay mô-đun lỗi thay vì tiếp tục reset.")] },
  { c:2, title:"Đưa MICA về nhà", desc:"Bộ bo tương thích đã có ở khu bảo trì LANTERN. PIP có thể chở MICA trên bệ hoặc dùng tời trên lối thấp. Cả hai cần đủ điện và giữ nguyên dữ liệu đang cứu.", line:"PIP · Tôi đã tính khối lượng của nó. Xin đừng bảo nó nhẹ cân.", plain:"PIP · Dùng bệ hoặc tời theo tải cho phép.",
    choices:()=>[travel("Chống chân và dùng bệ chở", "−10 điện · +3 bụi.",ridge,10,3,"MICA tới khu bảo trì trên bệ chở. Phần chứa mẫu đã được giữ kín."),travel("Neo tời qua lối thấp", "−14 điện · +1 bụi.",bypass,14,1,"MICA về bằng tời trên tuyến ít bụi. Tải được giữ ổn định.")] },
  { c:2, title:"Khởi động lại, theo một cách khác", desc:"Thay bo, xác minh bản sao và chạy chuyển động tải thấp. Sau đó cô lập hộp thu bụi ở trạm cũ. Gioăng hỏng của hộp giải thích vì sao tuyến bảo trì từng bị tái nhiễm.", line:"PIP · Cổng phục hồi đọc được bản sao. MICA đang chờ bo mới.",
    choices:()=>[next("Thay bo, xác minh và chạy thử", "MICA giữ bản đồ cũ, di chuyển với tải giới hạn.","MICA · Công việc đang chờ. Chuẩn bị trạm. Một phần nhật ký mất, bản đồ vẫn còn. Hộp thu bụi hỏng được cách ly và PIP nạp lại nguồn.",s=>{s.mica=3;s.isolated=true;s.energy+=14;s.dust-=8;})] },
  { c:3, title:"Chạy thử căn cứ", desc:"Bật mô-đun sống giả lập và nhà kính ở tải kiểm tra. Hãy so dự phòng điện với khả năng đưa nhiệt ra ngoài. Đây là hai số đo riêng.", line:"PIP · Điện có thể còn nhiều. Tôi vẫn cần một chỗ để đưa nhiệt đi.",
    choices:()=>[next("Chạy tải thử và đọc nhiệt", "Xem cấu hình bạn đã lắp từ chương 1.",state.cooling>=27?"Mặt dự phòng bạn lắp sớm giữ bài thử trong giới hạn. Bây giờ xác minh tuyến bảo trì và khoảng dự phòng.":"Tải nhiệt 27 vượt năng lực 18 dù vẫn còn điện. Trạm tự giảm tải. Cần phục hồi hoặc mở rộng cụm tản nhiệt.")] },
  { c:3, title:"Theo bản đồ cũ của MICA", desc:"Một tuyến đi qua vùng lạnh và cần sưởi. Tuyến có nắng dài hơn và thuận tiện chở tấm bổ sung. Dùng mốc cũ, rồi kiểm tra lại các chướng ngại đã thay đổi.", line:"MICA · Đường này từng đi được. Cần cập nhật.",
    choices:()=>[travel("Đi tuyến có nắng", "−5 điện · +3 bụi.",ridge,5,3,"Bạn đến mặt tản nhiệt từ phía sáng, PIP theo sau và MICA tới điểm bảo trì."),travel("Qua lối lạnh với sưởi", "−7 điện · +1 bụi.",bypass,7,1,"Đã đến điểm bảo trì. Nhiệt trong thân giảm từ từ, sưởi giữ thiết bị trong giới hạn.")] },
  { c:4, title:"Ba người thợ, một đầu nối", desc:"PIP chống chân và giữ tấm. MICA vừa đủ nhỏ để tới đầu nối trong khe. Bạn xác nhận đường lui, rồi tự kiểm tra và khóa đầu nối ngoài khi hai robot hỗ trợ.", line:"MICA · Tôi có thể thực hiện. Tải cho phép đã giảm.",
    choices:()=>[next("Cho MICA nối tấm bổ sung", "−7 điện · năng lực tản nhiệt 34.","Bạn khóa đầu nối ngoài. PIP giữ tải, MICA nối từ khe hẹp. Tấm bổ sung cho khoảng dự phòng lớn hơn.",s=>{s.cooling=34;s.energy-=7;}),next("Khôi phục mặt tương thích bằng EDS", "−4 điện · năng lực tản nhiệt 29, cần xếp lịch tải cẩn thận.","Bạn cô lập và xác nhận kết nối. MICA nối bộ điều khiển EDS. Mặt tương thích hoạt động trở lại, tải đồng thời vẫn cần theo dõi.",s=>{s.cooling=29;s.energy-=4;s.dust-=5;})] },
  { c:4, title:"Đặt cấu kiện bảo vệ", desc:"Cả hai vị trí đều đã được thiết kế để bảo vệ khoang thử. Vị trí gần kho tiết kiệm điện lắp, nhưng giao cắt đường hàng. Vị trí xa hơn giữ hai tuyến tách nhau.", line:"PIP · Tôi đã kiểm tra khoảng trống. Chọn đường đi cũng là một phần thiết kế căn cứ.",
    choices:()=>[next("Lắp gần kho, dành điểm bàn giao", "−3 điện · kiểm soát giao cắt ở chuyến thử cuối.","Đã lắp cấu kiện gần kho. Chuyến giao hàng phải qua điểm bàn giao sạch.",s=>{s.shield="gần kho";s.energy-=3;}),next("Lắp ở điểm xa có tuyến riêng", "−5 điện · giữ đường sạch tách khỏi kho.","Đã lắp cấu kiện ở tuyến riêng. Lối vận chuyển sạch rõ ràng hơn.",s=>{s.shield="tuyến riêng";s.energy-=5;})] },
  { c:4, title:"Xếp lịch nghiệm thu LANTERN", desc:"Giữ tải sống giả lập trong cả ba pha. Chọn lúc bật nhà kính và chạy bảo trì. Dành nước cho cây mà vẫn giữ dự phòng sinh hoạt. Bạn có thể chạy thử nhiều lần.", line:"PIP · Ba pha, một bộ pin. Tôi đề nghị đừng bật mọi thứ vào cùng lúc.", plain:"PIP · So tải và nhiệt theo từng pha trước khi xác nhận.", schedule:true },
  { c:4, title:"Chuyến hàng kiểm chứng", desc:"Căn cứ đã qua bài thử tải. Bây giờ đưa một kiện hàng mới qua tuyến đã thiết kế để chứng minh bụi không quay lại các đầu nối nhạy cảm.", line:"MICA · Kiểm tra điểm bàn giao.",
    choices:()=>[next("Chuyển hàng qua điểm sạch", "Giữ phương tiện ngoài, quét hộp và chuyển phần đóng kín.","Chuyến giao thử đạt. Không tái nhiễm đầu nối và lịch tải đã được xác nhận.",s=>{s.dust-=7;}),hint("Đi thẳng từ bãi hàng vào khu sạch", "Thử tuyến ngắn nhất.","Tuyến này đưa bánh và vỏ kiện tới vùng nhạy cảm. Khu bảo trì giữ kiện ở ngoài, hãy chuyển qua điểm sạch.")] },
  { c:5, title:"Những người đến trước", desc:"Một ảnh cũ từ bản sao của MICA hiện lên. Cả khu đất từng trống, trừ những mốc nhỏ nó đặt cho người đến sau. Bạn nhận ra những mốc đã dẫn PIP đi từ chuyến đầu tiên.", line:"PIP · Tôi tưởng chúng ta đến đây để bắt đầu.\nMICA · Công việc được tiếp tục.",
    choices:()=>[next("Đặt chỗ đỗ cho MICA và mang mẫu về tàu", "Niêm phong mẫu, chốt sổ khoa học và chuẩn bị về quỹ đạo.","MICA đỗ cạnh PIP. Bạn bàn giao LANTERN và đưa mẫu cùng nhật ký lên tàu.")] },
  { c:5, title:"Trước bước chân đầu tiên", desc:"Bạn nhìn lại LANTERN trên đường về tàu. Dấu chân của bạn nằm cạnh hai hàng dấu bánh. Qua cửa nhà kính, chiếc lá đầu tiên vẫn sáng dưới đèn.", line:"PIP · Tôi đã chuẩn bị một câu đùa. Để lát nữa.", finish:true }
];

function artworkStyle(index) {
  return `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`;
}

function renderTravel() {
  const trip = state.travel;
  const points = trip.path.map(point => point.join(",")).join(" ");
  const visited = trip.path.slice(0, trip.cursor + 1).map(point => point.join(",")).join(" ");
  const [x, y] = trip.path[trip.cursor];
  byId("interaction").innerHTML = `
    <div class="route">
      <svg viewBox="0 0 360 150" role="img" aria-label="Sơ đồ phi hành gia đi trước và PIP theo sau qua ${trip.cursor + 1} trong ${trip.path.length} mốc">
        <path d="M0 75 Q125 5 265 39 T360 57 M0 93 Q125 19 268 56 T360 75 M0 126 Q150 71 360 105" fill="none" stroke="#334247" stroke-width="2"/>
        <polyline points="${points}" fill="none" stroke="#6c7778" stroke-width="3" stroke-dasharray="5 5"/>
        <polyline points="${visited}" fill="none" stroke="#ffc18a" stroke-width="4"/>
        ${trip.path.map(([px, py]) => `<circle cx="${px}" cy="${py}" r="4" fill="#abc2c2"/>`).join("")}
        ${state.pipJoined ? `<circle cx="${x-16}" cy="${y+9}" r="6" fill="#ffc18a" stroke="#0b1316" stroke-width="2"/>` : ""}
        <circle cx="${x}" cy="${y}" r="9" fill="#a1dfdf" stroke="#0b1316" stroke-width="3"/>
        <text x="24" y="141" fill="#aab8b9" font-size="11">ĐIỂM ĐI</text><text x="292" y="38" fill="#aab8b9" font-size="11">ĐIỂM ĐẾN</text>
      </svg>
      <small>Mốc ${trip.cursor + 1}/${trip.path.length} · Phi hành gia đi trước, PIP theo sau · Dự phòng EVA khi tới ${state.eva - Math.ceil(trip.energy / 2)}</small>
    </div>
    <div class="actions"><button class="primary" id="drive" type="button">Tiến tới mốc tiếp theo →</button><button id="cancel-travel" type="button">Chọn lại tuyến</button></div>`;
  byId("drive").onclick = drive;
  byId("cancel-travel").onclick = () => { state.travel = null; state.message = "Bạn đã trở lại điểm chọn tuyến."; render(); };
}

function drive() {
  const trip = state.travel;
  if (!trip) return;
  trip.cursor += 1;
  if (trip.cursor === trip.path.length - 1) {
    state.travel = null;
    advance(trip.message, s => { s.energy -= trip.energy; s.dust += trip.dust; s.eva -= Math.ceil(trip.energy / 2); });
  } else {
    renderTravel();
    byId("drive").focus({preventScroll:true});
  }
}

function evaluateSchedule() {
  let reserve = state.energy;
  const rows = [state.solar, Math.max(0,state.solar - 4), 4].map((solar, index) => {
    const growth = Number(index === state.greenhousePhase);
    const service = Number(index === state.servicePhase);
    const load = 14 + growth * 12 + service * 10;
    reserve = Math.min(100,reserve + solar - load);
    return { solar, load, reserve, heat: 13 + growth * 12 + service * 9 };
  });
  const water = state.water - state.greenhouseWater;
  const issues = [];
  if (rows.some(row=>row.reserve < 15)) issues.push("Dự phòng điện xuống dưới 15. Dời tải về pha nhiều nắng hoặc nạp ở trạm.");
  if (rows.some(row=>row.heat > state.cooling)) issues.push(`Tải nhiệt vượt năng lực ${state.cooling}. Tách lịch nhà kính và bảo trì.`);
  if (water < 12) issues.push("Cần giữ ít nhất 12 điểm nước sinh hoạt.");
  if (state.greenhouseWater < 5) issues.push("Nhà kính cần ít nhất 5 điểm nước để đạt lịch thử.");
  if (!state.shield || !state.isolated || state.mica !== 3) issues.push("Chưa hoàn thành cấu hình bảo vệ, cách ly bụi hoặc kiểm tra MICA.");
  return { rows, reserve, water, issues };
}

const phaseLabels = ["Ổn định nguồn", "Cấp công việc", "Bóng che"];

function renderSchedule() {
  const result = state.test ?? evaluateSchedule();
  const select = (id,label,current) => `<label for="${id}">${label}<select id="${id}" ${state.passed?"disabled":""}>${phaseLabels.map((phase,i)=>`<option value="${i}" ${i===current?"selected":""}>${phase}</option>`).join("")}</select></label>`;
  byId("interaction").innerHTML = `
    <div class="schedule">${select("growth","Bật nhà kính",state.greenhousePhase)}${select("service","Chạy bảo trì",state.servicePhase)}</div>
    <div class="settings"><label for="water">Nước cấp nhà kính</label><input id="water" type="range" min="0" max="12" value="${state.greenhouseWater}" ${state.passed?"disabled":""}><output id="water-value">${state.greenhouseWater}</output></div>
    <div id="prediction">${prediction(result)}</div>
    <div class="actions">${state.passed?'<button class="primary" type="button" id="leave-test">Tiếp tục bàn giao thử</button>':`<button class="primary" type="button" id="run-test">Chạy thử 3 pha</button><button type="button" id="recharge" ${state.energy>=100?"disabled":""}>Chờ nạp thêm 12 điện</button>`}</div>`;
  if (state.passed) {
    byId("leave-test").onclick = () => advance("Đã nghiệm thu điện, nhiệt, tải sống, nước, nhà kính và cấu kiện bảo vệ.");
    return;
  }
  for (const [id,key] of [["growth","greenhousePhase"],["service","servicePhase"],["water","greenhouseWater"]]) {
    byId(id).oninput = event => {
      state[key] = Number(event.currentTarget.value);
      state.test = null;
      state.message = "";
      byId("feedback").textContent = "";
      byId("water-value").value = state.greenhouseWater;
      byId("prediction").innerHTML = prediction(evaluateSchedule());
    };
  }
  byId("recharge").onclick = () => {
    state.energy = Math.min(100,state.energy+12);
    state.test = null;
    record("Đã chờ một lượt để nạp thêm điện tại điểm sạc. Chạy lại dự đoán với nguồn mới.");
    render();
  };
  byId("run-test").onclick = () => {
    state.test = evaluateSchedule();
    if (state.test.issues.length) {
      explain(`Chưa đạt. ${state.test.issues.join(" ")}`);
      return;
    }
    state.passed = true;
    state.energy = state.test.reserve;
    state.water = state.test.water;
    record("Bài thử đạt cả ba pha. Nguồn sống được duy trì và nhà kính nhận đủ nước.");
    render();
    byId("leave-test").focus();
  };
}

function prediction(result) {
  return `<table aria-label="Dự đoán tải theo pha"><thead><tr><th>Pha</th><th>Nắng</th><th>Tải điện</th><th>Dự phòng</th><th>Nhiệt tải</th></tr></thead><tbody>${result.rows.map((row,index)=>`<tr><td>${phaseLabels[index]}</td><td>${row.solar}</td><td>${row.load}</td><td>${row.reserve}</td><td>${row.heat}/${state.cooling}</td></tr>`).join("")}</tbody></table>
    <p class="note">Nước sinh hoạt còn <strong>${result.water}</strong> · ngưỡng 12. Nhà kính cần 5 điểm nước trở lên. Điện dự phòng cần giữ từ 15.</p>`;
}

function renderFinish() {
  byId("interaction").innerHTML = `<div class="report"><p><strong>LANTERN đã bàn giao.</strong></p><ul><li>MICA đã phục hồi với giới hạn tải.</li><li>Bằng chứng khoa học đầy đủ ${state.evidence}/2 bước.</li><li>Điện dự phòng ${state.energy} · nước sinh hoạt ${state.water}.</li><li>Cấu kiện bảo vệ ${state.shield} · chuyến bàn giao sạch đã đạt.</li></ul></div><button type="button" data-view="story">Đọc lại toàn bộ câu chuyện</button>`;
}

function setDialogue() {
  const step = steps[state.step];
  const humor = Number(byId("humor").value);
  byId("humor-value").value = humor;
  byId("dialogue").textContent = humor < 35 && step.plain ? step.plain : step.line;
  byId("dialogue").style.whiteSpace = "pre-line";
}

function finishDescent() {
  state.intro = descent.length;
  record("Đã tiếp đất tại Cực Nam. Tàu là điểm an toàn cho chuyến EVA đầu tiên.");
  render(true);
}

function nextDescent() {
  if (state.intro + 1 === descent.length) finishDescent();
  else { state.intro += 1; render(); }
}

function setArtwork(index, caption) {
  byId("caption").textContent = caption;
  byId("scene-art").setAttribute("aria-label", caption);
  byId("scene-art").style.backgroundPosition = artworkStyle(index);
}

function renderDescent() {
  const scene = descent[state.intro];
  byId("chapter").textContent = "MỞ ĐẦU · Artemis IV";
  byId("progress").textContent = `Cảnh ${state.intro + 1} / ${descent.length}`;
  byId("title").textContent = scene.title;
  byId("description").textContent = scene.desc;
  byId("dialogue").textContent = scene.line;
  byId("feedback").textContent = "";
  byId("visual-title").textContent = "CUTSCENE · Quỹ đạo đến bề mặt";
  byId("log").replaceChildren();
  setArtwork(scene.art,scene.caption);
  for (const id of ["metrics","timeline","pip-settings"]) byId(id).hidden = true;
  byId("interaction").innerHTML = `<div class="actions"><button type="button" id="next-descent">Cảnh tiếp</button><button type="button" id="pause-descent">${state.introPaused?"Tiếp tục tự chạy":"Tạm dừng"}</button><button type="button" id="skip-descent">Bỏ qua cảnh mở đầu</button></div><p class="note">Trình tự lấy cảm hứng từ Apollo 11. Đây là cảnh bay minh họa cho Artemis IV trong game.</p>`;
  byId("next-descent").onclick = nextDescent;
  byId("pause-descent").onclick = () => {
    state.introPaused = !state.introPaused;
    render();
    byId("pause-descent").focus();
  };
  byId("skip-descent").onclick = finishDescent;
  if (view === "play" && !state.introPaused) descentTimer = setTimeout(nextDescent, 5500);
}

function render(focusTitle = false) {
  clearTimeout(descentTimer);
  if (state.intro < descent.length) { renderDescent(); return; }
  const step = steps[state.step];
  const chapter = chapters[step.c];
  byId("metrics").hidden = false;
  byId("timeline").hidden = false;
  byId("pip-settings").hidden = !state.pipJoined;
  byId("visual-title").textContent = `PHÁC THẢO CẢNH · ${state.pipJoined?"PIP đồng hành":"Góc nhìn phi hành gia"}`;
  byId("chapter").textContent = `${step.c === 5 ? "KẾT" : `CHƯƠNG 0${step.c + 1}`} · ${chapter.name}`;
  byId("progress").textContent = `${state.step + 1} / ${steps.length}`;
  byId("title").textContent = step.title;
  byId("description").textContent = step.desc;
  byId("feedback").textContent = state.message;
  setArtwork(step.art ?? step.c+3, step.art === 2 ? "Bạn chuẩn bị bước xuống từ tàu đổ bộ." : chapter.caption);
  setDialogue();
  const evidenceMetric = step.c === 2 && state.mica > 0 && state.mica < 3
    ? ["Công suất thử",state.panelReading]
    : ["Bằng chứng",`${state.evidence}/2`];
  const metrics = [["Điện dự phòng",state.energy], ["Dự phòng EVA",state.eva], evidenceMetric,["MICA",["Chưa gặp","Bất động","Chẩn đoán","An toàn"][state.mica]]];
  byId("metrics").innerHTML = metrics.map(([label,value])=>`<div class="metric"><small>${label}</small><strong>${value}</strong></div>`).join("");
  byId("timeline").innerHTML = chapters.map((entry,index)=>`<span class="${index===step.c?"current":index<step.c?"done":""}" ${index===step.c?'aria-current="step"':""}>${entry.short}</span>`).join("");
  byId("log").replaceChildren(...state.journal.map(message=>{
    const entry = document.createElement("li");
    entry.textContent = message;
    return entry;
  }));
  if (step.finish) renderFinish();
  else if (step.schedule) renderSchedule();
  else if (state.travel) renderTravel();
  else {
    const choices = step.choices();
    const list = document.createElement("div");
    list.className = "choices";
    for (const choice of choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      const title = document.createElement("strong");
      title.textContent = choice.label;
      const detail = document.createElement("small");
      detail.textContent = choice.detail;
      button.append(title,detail);
      button.onclick = choice.action;
      list.append(button);
    }
    byId("interaction").replaceChildren(list);
  }
  if (focusTitle) byId("title").focus({preventScroll:true});
}

function switchView(name) {
  view = name;
  for (const panel of ["play","story","gallery"]) byId(panel).hidden = panel !== name;
  for (const button of document.querySelectorAll(".tabs [data-view]")) button.setAttribute("aria-pressed",String(button.dataset.view===name));
  if (state.intro < descent.length) render();
}

const opening = `<article class="box"><div class="visual" style="background-position:${artworkStyle(0)}" role="img" aria-label="Tàu đổ bộ tách khỏi Orion"></div><div class="panel"><div class="eyebrow">Mở đầu</div><h2>Từ quỹ đạo tới Cực Nam</h2><ol>${descent.map(scene=>`<li><strong>${scene.title}.</strong> ${scene.desc}</li>`).join("")}</ol></div></article>`;
byId("story").innerHTML = opening + chapters.map((chapter,index)=>`<article class="box"><div class="visual" style="background-position:${artworkStyle(index+3)}" role="img" aria-label="${chapter.caption}"></div><div class="panel"><div class="eyebrow">${chapter.short}</div><h2>${chapter.name}</h2>${chapter.story.map(paragraph=>`<p>${paragraph}</p>`).join("")}</div></article>`).join("");
byId("gallery-labels").innerHTML = [...introFrames.map(frame=>({name:frame.title,caption:frame.caption})),...chapters].map(frame=>`<li><strong>${frame.name}.</strong> ${frame.caption}</li>`).join("");
document.addEventListener("click",event=>{
  const button = event.target.closest("button[data-view]");
  if (button) switchView(button.dataset.view);
});
document.addEventListener("keydown",event=>{
  if (event.key === "ArrowRight" && view === "play" && state.travel && !["INPUT","SELECT"].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    drive();
  }
});
byId("humor").addEventListener("input",setDialogue);
byId("restart").onclick = () => {
  if ((state.step > 0 || state.intro > 0) && !window.confirm("Bắt đầu lại từ quỹ đạo và xóa nhật ký lượt này?")) return;
  state = initial();
  render(true);
};
render();
