# FEM bước 1 và GMM bước 2

File chạy: `run_fe_gmm_148x8.do`.

Đây là mô hình thay thế/robustness cho nghiên cứu, không phải phương pháp chính xác của paper gốc. Paper dùng Fama–MacBeth để xác định target và để ước lượng mô hình điều chỉnh. Nếu dùng FEM–GMM, phần phương pháp phải nói rõ nghiên cứu đã thay đổi bộ ước lượng để phù hợp với panel 148 doanh nghiệp và 8 năm.

## 1. Lệnh chạy

```stata
cd "C:/Users/kimngoo/Desktop/ForChau"
ssc install xtabond2, replace
ssc install estout, replace
do "run_fe_gmm_148x8.do"
```

Kết quả được lưu trong:

- `fe_gmm_148x8.log`
- `analysis_fe_gmm.dta`
- `fe_gmm_results.rtf` nếu đã cài `estout`

## 2. Bước 1: target leverage bằng FEM

Mô hình:

```stata
xtreg lev L.prof L.mtb L.size L.dep_ratio L.tang L.indlev i.year, ///
    fe vce(cluster firm_id)
```

Nếu có biến `rd`, do-file tự thêm R&D và dummy missing R&D.

### Target phải dùng `xbu`, không chỉ dùng `xb`

```stata
predict target_xb, xb
predict target_ui, u
gen lev_target_fe = target_xb + target_ui
```

- `xb` chỉ chứa phần được giải thích bởi biến quan sát và dummy năm.
- `u` là hiệu ứng cố định ước lượng của từng doanh nghiệp.
- `xb+u`, hay `predict ..., xbu`, là fitted leverage đầy đủ của FEM.

Nếu mục đích thực sự là target riêng của từng doanh nghiệp, bỏ `u` sẽ loại bỏ phần dị biệt cố định mà FEM được chọn để kiểm soát. Tuy nhiên, dùng `xbu` cũng có hạn chế: hiệu ứng công ty được ước lượng từ toàn bộ chuỗi của chính doanh nghiệp, nên target là fitted value trong mẫu và có sai số ước lượng. Sai số bước 2 thông thường không phản ánh đầy đủ sai số sinh ra ở bước 1.

Do-file chạy thêm Hausman truyền thống giữa FE và RE. Đọc như sau:

- H0: RE nhất quán, chênh lệch hệ số FE và RE không có tính hệ thống.
- `p<0,05`: bác bỏ H0, ủng hộ FE.
- `p>=0,05`: chưa có bằng chứng phải dùng FE thay cho RE.
- Nếu Hausman báo ma trận không xác định dương, không được tự kết luận FE; cần dùng kiểm định robust phù hợp hoặc lập luận dựa trên tương quan giữa hiệu ứng công ty và biến giải thích.

Trong lần chạy hiện tại, Hausman cho `chi2(12)=42,90`, `p=0,0000`, nên bác bỏ RE theo kiểm định truyền thống và lựa chọn FE ở bước 1 có cơ sở thống kê.

## 3. Tạo deviation và adjustment

```stata
gen devlev_fe = lev_target_fe - L.lev
gen lev_adj   = lev - L.lev
```

- `devlev_fe>0`: doanh nghiệp đang dưới target, cần tăng leverage.
- `devlev_fe<0`: doanh nghiệp đang trên target, cần giảm leverage.
- `lev_adj` là thay đổi leverage thực tế.

## 4. Mean-center trước khi tạo tương tác

Do-file trừ trung bình các biến quyết định tốc độ điều chỉnh trước khi nhân với `DevLev`:

```stata
gen c_ctr = L.ctr - mean(L.ctr)
gen gx_ctr = devlev_fe*c_ctr
```

Tương tự với PROF, MTB, SIZE, DEP, TANG và INDLEV. Việc center không thay đổi nội dung kinh tế của mô hình khi `devlev_fe` và đầy đủ các tích tương tác cùng có mặt. Lợi ích là hệ số `devlev_fe` trở thành tốc độ điều chỉnh tại giá trị trung bình của các biến kiểm soát.

Nếu không center, hệ số `devlev_fe` là tốc độ khi CTR, SIZE, INDLEV và tất cả biến khác bằng 0—một doanh nghiệp không có ý nghĩa thực tế.

## 5. Vì sao bước 2 dùng System GMM

`devlev_fe` chứa `L.lev` và một target được ước lượng, nên có khả năng tương quan với sai số. Tất cả biến dạng `DevLev × Z` cũng thừa hưởng vấn đề đó. Do-file bảo thủ bằng cách xem toàn bộ các biến chứa `DevLev` là nội sinh và dùng độ trễ của chính chúng làm công cụ nội bộ.

Mô hình chính:

```stata
xtabond2 lev_adj devlev_fe gx_ctr gx_prof gx_mtb gx_size ///
    gx_dep_ratio gx_tang gx_indlev year_dummies, ///
    gmm(devlev_fe gx_ctr gx_prof gx_mtb gx_size ///
        gx_dep_ratio gx_tang gx_indlev, lag(2 2) collapse) ///
    iv(year_dummies) twostep robust small
```

Ý nghĩa các lựa chọn:

- `lag(2 2)`: chỉ dùng lag thứ hai, tránh dùng lag gần có thể còn nội sinh và hạn chế số công cụ.
- `collapse`: thu gọn ma trận công cụ.
- `twostep robust`: GMM hai bước với sai số chuẩn hiệu chỉnh Windmeijer.
- `small`: hiệu chỉnh suy luận cho mẫu hữu hạn.
- Dummy năm được coi là ngoại sinh.

GDP và lạm phát không nằm trong mô hình GMM chính vì chỉ có một quốc gia và 7 năm hữu dụng. Do-file vẫn chạy một mô hình có hai tương tác này để kiểm tra độ bền.

## 6. Cách đọc một bảng GMM

Phải kiểm tra theo thứ tự sau; không đọc hệ số trước khi mô hình vượt qua chẩn đoán.

### Số công cụ

`Number of instruments` phải nhỏ hơn số nhóm doanh nghiệp. Với 148 công ty, bắt buộc dưới 148 và nên thấp hơn nhiều. Do-file hiện dùng khoảng 23–31 công cụ.

Nếu công cụ quá nhiều:

```stata
gmm(..., lag(2 2) collapse)
```

Không bỏ `collapse` và không dùng `lag(2 .)` một cách mặc định với T=8.

### AR(1)

Trong phương trình sai phân, AR(1) thường được kỳ vọng có ý nghĩa:

```text
Pr > z < 0,05
```

AR(1) không có ý nghĩa là dấu hiệu cần xem lại đặc tả, mặc dù điều kiện quyết định tính hợp lệ của công cụ trễ thường tập trung vào AR(2).

### AR(2)

Giả thuyết H0 là không có tự tương quan bậc hai trong sai số sai phân.

- `p>0,05`: không bác bỏ H0; đạt kiểm tra ở mức 5%.
- `p<=0,05`: công cụ dựa trên lag có thể không hợp lệ; không dùng kết quả.
- Nếu p chỉ hơi trên 0,05 nhưng dưới 0,10, phải gọi là sát biên và kiểm tra lag khác.

### Hansen

H0: toàn bộ công cụ ngoại sinh/hợp lệ.

- `p<0,05`: bác bỏ tính hợp lệ của công cụ.
- p quá gần 1, đặc biệt đi cùng rất nhiều công cụ, có thể là dấu hiệu Hansen mất sức mạnh.
- Một vùng thực hành thường được xem là dễ chấp nhận là khoảng 0,10–0,90, nhưng đây không phải quy tắc cơ học.

### Difference-in-Hansen

Kiểm tra riêng các công cụ bổ sung của phương trình level trong System GMM. Nếu bị bác bỏ, giả định bổ sung của System GMM không được hỗ trợ; khi đó phải xem Difference GMM hoặc đặc tả công cụ khác.

### Kiểm tra độ nhạy lag

Do-file chạy cả:

```stata
lag(2 2) collapse
lag(2 3) collapse
```

Nếu dấu, độ lớn hoặc p-value thay đổi mạnh, kết quả nhạy với lựa chọn công cụ và không nên đưa ra kết luận mạnh.

## 7. Diễn giải hệ số

Vì các biến đã được center:

- `devlev_fe`: SOA tại doanh nghiệp có các đặc điểm ở mức trung bình.
- `gx_ctr`: CTR làm thay đổi SOA bao nhiêu khi CTR tăng một đơn vị.
- `gx_ctr>0`: CTR cao làm tăng tốc độ tiến về target.
- `gx_ctr<0`: CTR cao làm giảm tốc độ tiến về target.

Ví dụ `devlev_fe=0,26` nghĩa là doanh nghiệp trung bình điều chỉnh khoảng 26% khoảng cách tới target trong một năm. Chỉ diễn giải như vậy khi hệ số có ý nghĩa, nằm trong phạm vi hợp lý và mô hình vượt qua các kiểm định GMM.

Hệ số SOA nhỏ hơn 0 hoặc lớn hơn 1 có thể biểu thị di chuyển sai hướng hoặc điều chỉnh vượt mức; thường cũng là cảnh báo đặc tả, target hoặc công cụ không ổn định.

## 8. Phần mở rộng CTR × RRF

```stata
gx_ctr_rrf = devlev_fe*c_ctr*c_rrf
```

Mô hình phải đồng thời có `devlev_fe`, `gx_ctr`, `gx_rrf` và `gx_ctr_rrf`.

- `gx_ctr_rrf>0`: RRF làm tác động CTR lên SOA mạnh hơn.
- `gx_ctr_rrf<0`: RRF làm tác động CTR lên SOA yếu hơn.
- Kiểm định chính: `test gx_ctr_rrf=0`.

Không chỉ nhìn dấu; phải đọc p-value, khoảng tin cậy, AR(2), Hansen và số công cụ.

## 9. Kết quả chạy thử trên dữ liệu hiện tại

| Mô hình | SOA tại trung bình | CTR × DevLev | AR(2) | Hansen | Công cụ |
|---|---:|---:|---:|---:|---:|
| FE bước 2 đối chiếu | 0,6125; p<0,001 | -0,00053; p=0,905 | — | — | — |
| Difference GMM, lag 2–3 | 0,5921; p=0,006 | -0,00687; p=0,655 | 0,362 | 0,471 | 22 |
| System GMM chính, lag 2 | 0,2596; p=0,381 | 0,02277; p=0,064 | 0,409 | 0,767 | 23 |
| System GMM, lag 2–3 | 0,5574; p=0,013 | 0,00459; p=0,657 | 0,896 | 0,220 | 31 |
| System GMM có GDP/lạm phát | 0,0638; p=0,854 | 0,01738; p=0,289 | 0,060 | 0,729 | 27 |

Kết luận từ bảng này:

- Các kiểm định AR(1), AR(2) và Hansen của hai System GMM không vĩ mô nhìn chung đạt.
- Tuy nhiên, tác động CTR chỉ sát mức 10% khi dùng duy nhất lag 2; khi cho phép lag 2–3, p-value tăng lên 0,657.
- SOA cũng thay đổi từ khoảng 26% sang 56% theo bộ công cụ.
- Vì kết quả nhạy mạnh với dải lag, chưa thể kết luận CTR làm tăng SOA một cách bền vững.
- Mô hình có GDP/lạm phát có AR(2)=0,060, sát biên và không nên là mô hình chính.

Với phần mở rộng CTR × RRF:

- 799 quan sát, 147 doanh nghiệp, 27 công cụ.
- AR(1)=0,023; AR(2)=0,329; Hansen=0,534.
- `CTR × RRF × DevLev` có p=0,450.
- Các kiểm định đặc tả đạt, nhưng chưa có bằng chứng thống kê cho tác động điều tiết của RRF.

## 10. Những giới hạn vẫn không được GMM sửa chữa

GMM không thể sửa các vấn đề định nghĩa biến:

- `tl/ta` chưa chắc là total debt/total assets.
- `EBIT/TA` không phải lợi nhuận trước khoản mục bất thường như paper.
- Thiếu R&D.
- CTR là biến ngành-năm, không phải phơi nhiễm khí hậu cấp công ty-năm.
- DEP thiếu nhiều.
- 38 quan sát reserve âm cần xác minh.

GMM cũng không tự tạo ra công cụ hợp lệ. Tính hợp lệ phụ thuộc vào giả định rằng các độ trễ được chọn không tương quan với sai số hiện tại. AR(2) và Hansen chỉ là kiểm định cần thiết, không phải bằng chứng tuyệt đối rằng giả định nhân quả đúng.

## 11. Cách trình bày trong luận văn

Có thể viết:

> Nghiên cứu ước lượng đòn bẩy mục tiêu bằng mô hình hiệu ứng cố định doanh nghiệp với hiệu ứng năm. Trong bước hai, mô hình điều chỉnh từng phần được ước lượng bằng System GMM hai bước. Các biến chứa khoảng cách tới đòn bẩy mục tiêu được xem là nội sinh và được công cụ hóa bằng độ trễ bậc hai của chính chúng. Ma trận công cụ được thu gọn bằng tùy chọn collapse; sai số chuẩn sử dụng hiệu chỉnh Windmeijer. Tính hợp lệ của mô hình được đánh giá qua kiểm định Arellano–Bond AR(1), AR(2), Hansen và số lượng công cụ.

Nên báo cáo Fama–MacBeth theo paper làm benchmark, còn FE–GMM là mô hình thay thế hoặc robustness. Không nên đổi toàn bộ mô hình chính sang GMM chỉ vì GMM cho p-value thấp hơn.
