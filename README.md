# Green Capital Insight

Green Capital Insight là phần mềm nội bộ hỗ trợ doanh nghiệp phân tích cấu trúc vốn và mô phỏng rủi ro chuyển đổi khí hậu. Ứng dụng có hai chức năng chính:

1. **Capital Analysis** – tính cường độ carbon, đòn bẩy mục tiêu và tốc độ điều chỉnh vốn.
2. **Scenario Simulation** – thay đổi giả định CTR/RRF và so sánh với kịch bản cơ sở.

## 1. Tải và cài đặt

### Yêu cầu

- Windows 10/11 hoặc macOS.
- Google Chrome, Microsoft Edge hoặc Safari.
- Node.js 22 hoặc bản LTS mới hơn.
- Internet trong lần cài đặt đầu tiên.

Nếu chưa có Node.js, tải tại [nodejs.org](https://nodejs.org), chọn bản **LTS**, cài đặt rồi mở lại Terminal.

### Tải project

Nếu nhận file ZIP, nhấp chuột phải và chọn **Extract All... / Giải nén tất cả**. Không chạy project trực tiếp bên trong file ZIP.

Nếu tải từ GitHub: bấm **Code → Download ZIP**, sau đó giải nén.

### Mở Terminal trên Windows

1. Mở thư mục project vừa giải nén.
2. Nhấp chuột phải vào vùng trống, chọn **Open in Terminal**.
3. Nếu không thấy lựa chọn này, bấm thanh địa chỉ của File Explorer, nhập `powershell` rồi nhấn **Enter**.

### Cài và chạy ứng dụng

Nhập lần lượt:

```bash
npm install
npm run dev
```

Đợi Terminal hiển thị địa chỉ ứng dụng, sau đó mở trình duyệt tại:

```text
http://localhost:8443
```

Giữ Terminal mở trong lúc sử dụng. Để tắt ứng dụng, quay lại Terminal và nhấn `Ctrl + C`.

Trên macOS, mở Terminal, nhập `cd `, kéo thư mục project vào Terminal, nhấn **Enter**, rồi chạy hai lệnh trên.

> Nếu đang dùng Figma Make, server đã chạy sẵn; chỉ cần mở khu vực **Preview**.

## 2. Đăng nhập và thiết lập công ty

Khi mở ứng dụng, Dashboard sẽ hiện ở trạng thái khóa. Có thể dùng tài khoản thử nghiệm:

| Trường | Dữ liệu mẫu |
| --- | --- |
| Full name | Nguyễn Văn An |
| Company email | `test@company.vn` |
| Password | `123456` |

Email phải có ký tự `@`; mật khẩu cần ít nhất 6 ký tự. Bấm **Continue to company setup** để tiếp tục.

Tại màn hình Company Setup:

1. Tìm công ty bằng tên hoặc mã công ty.
2. Nếu chưa có, bấm **Add company**, nhập tên, mã và ngành rồi chọn **Add to directory**.
3. Kéo thanh **Analysis year** để chọn năm từ 1900–2030 hoặc nhập năm chính xác.
4. Bấm **Open Dashboard**.

Năm được chọn là năm phân tích `t`; dữ liệu đầu vào phải thuộc năm trước đó `t−1`. Ví dụ, chọn năm 2024 thì nhập số liệu FY2023.

Thanh chọn hỗ trợ 1900–2030, nhưng dữ liệu GDP, lạm phát và trung vị ngành hiện có cho FY2016–FY2023. Vì vậy mô hình hiện chạy đầy đủ cho năm phân tích **2017–2024**. Với năm khác, ứng dụng sẽ báo thiếu dữ liệu nền.

## 3. Sử dụng Capital Analysis

1. Chọn **Input Analysis Data** ở menu bên trái hoặc nút **Input Data** phía trên.
2. Kiểm tra công ty, năm phân tích và ngành.
3. Nhập **Financial Data** theo đơn vị tỷ đồng (VND bn):
   - Total Assets – Tổng tài sản.
   - Total Debt – Tổng nợ.
   - Revenue – Doanh thu.
   - EBIT, Depreciation, PPE và Market Capitalization.
4. Nhập **Fuel Consumption** theo đơn vị KTOE. Nếu không sử dụng một loại nhiên liệu, nhập `0`, không để trống.
5. Nhập **Internal Reserve Fund** gồm Development Fund, Financial Reserve và Retained Earnings.
6. Bấm **Save Draft** để lưu nháp hoặc **Run Analysis** để tính toán.

Nếu dữ liệu thiếu hoặc không hợp lệ, ứng dụng sẽ đánh dấu ô cần sửa. Sau khi chạy thành công, Capital Analysis cung cấp các màn hình:

- **Carbon & CTR:** phát thải CO₂ và cường độ carbon.
- **Target Leverage:** đòn bẩy thực tế, mục tiêu và độ lệch.
- **Adjustment Speed:** tốc độ điều chỉnh vốn theo System GMM.
- **Model Coefficients:** hệ số công nghệ đang được sử dụng.
- **Diagnostics:** các kiểm định mô hình.

## 4. Sử dụng Scenario Simulation

Bạn phải chạy Capital Analysis ít nhất một lần để tạo Baseline.

1. Chọn **Scenario Simulation** ở menu bên trái.
2. Kéo **Carbon Intensity Scenario** để thay đổi CTR.
3. Kéo **Internal Reserve Scenario** để thay đổi RRF.
4. Theo dõi kết quả Scenario và so sánh với Baseline.

Các nút chính:

- **Reset to Baseline:** trở về giả định ban đầu.
- **Save Scenario:** đặt tên và lưu kịch bản.
- **Compare Scenario:** so sánh các kịch bản đã lưu.
- **Export:** tải kết quả dưới dạng CSV.

## 5. Đổi công ty, đổi năm và lưu dữ liệu

- Bấm tên công ty trên thanh đầu trang để chuyển công ty.
- Bấm **Year** để đổi năm; kết quả cũ sẽ được xóa nhằm tránh trộn dữ liệu.
- Bấm ảnh đại diện → **Company & year setup** để quay lại thiết lập.
- Bấm ảnh đại diện → **Sign out** để đăng xuất.

Phiên bản hiện tại lưu tài khoản prototype, danh sách công ty, bản nháp và kịch bản bằng `localStorage` của trình duyệt. Dữ liệu chỉ tồn tại trên trình duyệt và máy đang dùng; xóa dữ liệu trình duyệt hoặc chuyển máy có thể làm mất dữ liệu.

> Đây là prototype, chưa có máy chủ xác thực hay cơ sở dữ liệu tập trung. Không nhập dữ liệu mật hoặc dùng làm hệ thống production.

## 6. Xử lý lỗi thường gặp

### `npm is not recognized`

Cài Node.js, đóng Terminal rồi mở lại. Kiểm tra bằng `node --version`.

### PowerShell không cho chạy `npm.ps1`

Dùng các lệnh sau thay thế:

```bash
npm.cmd install
npm.cmd run dev
```

### Không mở được `localhost:8443`

Kiểm tra Terminal vẫn đang chạy. Nếu cổng 8443 đã được dùng, chạy:

```bash
npm run dev -- --port 8444
```

Sau đó mở `http://localhost:8444`.

### Không chạy được phân tích

Kiểm tra các ô bắt buộc, bảo đảm Total Assets và Revenue lớn hơn 0, các giá trị còn lại không âm, nhiên liệu không để trống và năm `t−1` có dữ liệu nền.

## 7. Lệnh kiểm tra dành cho developer

```bash
npm test        # Chạy kiểm thử mô hình
npm run build   # Tạo bản production
npm run preview # Xem bản production
```

Logic mô hình nằm trong `src/model.ts` và `src/modelConfig.ts`. Đây là mô hình hỗ trợ quyết định; kết quả cần được đội ngũ chuyên môn xác nhận trước khi sử dụng chính thức.
