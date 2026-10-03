# GREEN CAPITAL INSIGHT

**Green Capital Insight** là phần mềm nội bộ hỗ trợ doanh nghiệp đánh giá mối quan hệ giữa rủi ro chuyển đổi khí hậu và cấu trúc vốn. Hệ thống sử dụng dữ liệu tài chính, tiêu thụ nhiên liệu và quỹ dự trữ để tính đòn bẩy mục tiêu, cường độ carbon, tốc độ điều chỉnh vốn và mô phỏng các kịch bản thay đổi.

## 1. Chức năng chính

### Quản lý bối cảnh phân tích

- Đăng nhập bằng tài khoản nội bộ.
- Tìm kiếm công ty theo tên/mã hoặc thêm công ty mới.
- Chọn ngành và năm phân tích bằng thanh trượt 1900–2030.
- Chuyển đổi công ty, năm và theo dõi kết quả trên Dashboard.

Năm được chọn là năm phân tích `t`; dữ liệu đầu vào thuộc kỳ trước `t−1`. Ví dụ, chọn năm 2024 thì nhập số liệu FY2023. Dữ liệu vĩ mô và trung vị ngành hiện tại hỗ trợ đầy đủ cho năm phân tích 2017–2024.

### Capital Analysis

Người dùng nhập ba nhóm dữ liệu:

- **Tài chính:** tổng tài sản, tổng nợ, doanh thu, EBIT, khấu hao, PPE và vốn hóa thị trường.
- **Nhiên liệu:** mức tiêu thụ than, xăng, dầu, LPG, khí tự nhiên… theo đơn vị KTOE.
- **Quỹ dự trữ:** quỹ đầu tư phát triển, dự phòng tài chính và lợi nhuận giữ lại.

Hệ thống tính tổng phát thải CO₂, cường độ carbon **CTR**, đòn bẩy thực tế, **Target Leverage**, độ lệch **DevLev**, tốc độ điều chỉnh vốn **SOA**, mức điều chỉnh đòn bẩy và nợ kỳ vọng. Kết quả kèm biểu đồ, công thức, đóng góp của từng biến, hệ số và chẩn đoán mô hình. Dữ liệu đang nhập có thể được lưu nháp trên trình duyệt.

### Scenario Simulation

Sau khi có kết quả cơ sở, người dùng có thể thay đổi giả định **CTR** và tỷ lệ quỹ dự trữ **RRF**, theo dõi tác động đến SOA và đường điều chỉnh vốn, so sánh với Baseline, lưu nhiều kịch bản hoặc xuất CSV. Trong mô phỏng, Target Leverage và DevLev được giữ cố định theo cấu hình mô hình.

## 2. Công nghệ sử dụng

- **React 19 + TypeScript:** xây dựng giao diện theo component.
- **Vite 8:** môi trường phát triển và đóng gói ứng dụng.
- **Tailwind CSS 4:** thiết kế giao diện responsive.
- **Recharts:** biểu đồ và trực quan hóa kết quả.
- **Lucide React:** hệ thống biểu tượng.
- **Vitest:** kiểm thử công thức và kết quả tính toán.
- **Fixed Effects Model (FEM):** ước lượng Target Leverage.
- **System GMM:** ước lượng tốc độ điều chỉnh vốn SOA.

Hệ số phát thải, hệ số mô hình, dữ liệu vĩ mô và trung vị ngành được quản lý trong `src/modelConfig.ts`; logic tính toán và kiểm tra dữ liệu nằm trong `src/model.ts`.

Đây là prototype chạy phía trình duyệt. Tài khoản, danh sách công ty, bản nháp và kịch bản được lưu bằng `localStorage`; chưa có máy chủ xác thực hoặc cơ sở dữ liệu tập trung.

## 3. Hướng dẫn thao tác thử nghiệm

### Cài đặt và khởi động

Máy cần có **Node.js 22** hoặc bản LTS mới hơn. Tải và giải nén project, mở Terminal tại thư mục project rồi chạy:

```bash
npm install
npm run dev
```

Mở `http://localhost:8443` trong trình duyệt. Nếu dùng Figma Make, server đã chạy sẵn và có thể mở trực tiếp trong Preview. Nhấn `Ctrl + C` trong Terminal để tắt ứng dụng.

### Đăng nhập thử nghiệm

| Trường | Dữ liệu mẫu |
| --- | --- |
| Full name | Nguyễn Văn An |
| Company email | `test@company.vn` |
| Password | `123456` |

Email phải chứa `@`, mật khẩu có ít nhất 6 ký tự. Bấm **Continue to company setup**.

### Thiết lập và chạy thử

1. Tìm một công ty có sẵn hoặc bấm **Add company** để thêm tên, mã và ngành.
2. Chọn năm **2024** để thử với dữ liệu FY2023, sau đó bấm **Open Dashboard**.
3. Chọn **Input Analysis Data**. Nhập dữ liệu tài chính theo đơn vị tỷ đồng, nhiên liệu theo KTOE và ba khoản quỹ dự trữ. Nhập `0` cho loại nhiên liệu không sử dụng, không để trống.
4. Bấm **Run Analysis**. Nếu dữ liệu chưa hợp lệ, hệ thống sẽ đánh dấu ô cần sửa.
5. Xem kết quả tại các tab **Carbon & CTR**, **Target Leverage**, **Adjustment Speed**, **Model Coefficients** và **Diagnostics**.
6. Chọn **Scenario Simulation**, kéo hai thanh **Carbon Intensity Scenario** và **Internal Reserve Scenario** để quan sát thay đổi so với Baseline.
7. Dùng **Save Scenario** để lưu, **Compare Scenario** để so sánh hoặc **Export** để tải CSV.

Có thể đổi công ty ở thanh đầu trang, đổi năm tại nút **Year** và đăng xuất từ ảnh đại diện. Khi đổi công ty hoặc năm, kết quả cũ được xóa để tránh trộn dữ liệu.

### Kiểm tra kỹ thuật

```bash
npm test
npm run build
```

> Phiên bản này phục vụ minh họa và kiểm chứng mô hình. Không nhập dữ liệu mật hoặc sử dụng kết quả làm tư vấn tài chính chính thức khi chưa được đội ngũ chuyên môn xác nhận.
