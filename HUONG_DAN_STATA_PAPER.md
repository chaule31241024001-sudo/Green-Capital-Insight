# Hướng dẫn chạy mô hình theo paper bằng Stata 17

Tài liệu này đi kèm với `run_paper_adapted_148x8.do`. Do-file được viết cho bộ dữ liệu hiện tại gồm 148 công ty, 8 năm (2016–2023), và bám theo quy trình hai bước của paper *Climate transition and the speed of leverage adjustment*.

## 1. Điều quan trọng nhất trước khi chạy

Do-file tái tạo **cấu trúc phương pháp** của paper, nhưng chưa thể gọi là tái lập hoàn toàn paper vì dữ liệu hiện tại thiếu một số biến gốc.

Paper còn loại doanh nghiệp tài chính và công ty tiện ích được quản lý theo mã SIC. File hiện tại không có `sic`, nên do-file chỉ cảnh báo và không thể tự xác nhận điều kiện này. Nếu bổ sung cột số `sic`, do-file sẽ tự loại SIC 6000–6999, 4000–4049 và 4900–4999 trước khi phân tích.

| Nội dung | Paper dùng | Dữ liệu hiện tại dùng | Đánh giá |
|---|---|---|---|
| Đòn bẩy `LEV` | Tổng nợ / tổng tài sản | `tl/ta` | Chỉ đúng nếu `tl` thực sự là tổng nợ; nếu `tl` là tổng nợ phải trả thì đây chỉ là proxy |
| Lợi nhuận `PROF` | Lợi nhuận sau thuế trước khoản mục bất thường / tổng tài sản | `ebit/ta` | Proxy, không cùng định nghĩa |
| `MTB` | Giá trị thị trường vốn chủ / giá trị sổ sách vốn chủ | `mcap/(ta-tl)` | Đúng về công thức nếu `tl` là tổng nợ phải trả |
| `SIZE` | ln(tổng tài sản tính bằng USD) | `ln(ta)` | Dùng được; đổi VND sang USD chỉ cộng/trừ một hằng số nếu cùng một tỷ giá mỗi năm |
| `R&DEXP`, `DUMR&D` | Có | Chưa có | Bị bỏ khỏi mô hình hiện tại |
| `DEP` | Khấu hao và phân bổ / tài sản | `dep/ta` | Đúng về ý tưởng nhưng đang thiếu nhiều quan sát |
| `TANG` | PPE thuần / tổng tài sản | `ppe/ta` | Phù hợp nếu `ppe` là tài sản cố định hữu hình thuần |
| `INDLEV` | Trung vị LEV theo ngành-năm | Tự tính từ mẫu | Phù hợp |
| Biến khí hậu | Chỉ số văn bản cấp công ty-năm từ earnings calls | `ctr`, không đổi trong mỗi ngành-năm | Không tương đương; phải trình bày là biến đại diện cấp ngành-năm |
| `RRF` | Không có trong mô hình gốc | `reserve/ta` | Phần mở rộng riêng của nghiên cứu |
| GDP, lạm phát | Biến quốc gia-năm trong bước 2 | `gdp`, `infl` | Chỉ đưa vào panel robustness; không thể đưa vào hồi quy chéo Fama–MacBeth của mẫu một quốc gia |

Không nên viết trong luận văn rằng nghiên cứu “tái lập chính xác” paper. Cách diễn đạt phù hợp hơn là: “Nghiên cứu vận dụng mô hình điều chỉnh từng phần hai bước của paper cho mẫu doanh nghiệp Việt Nam và thay thế biến phơi nhiễm chuyển đổi khí hậu cấp công ty bằng chỉ số CTR cấp ngành-năm.”

## 2. Vì sao mẫu 148 công ty × 8 năm cần thận trọng

Dữ liệu gốc có 1.184 quan sát. Vì tất cả biến giải thích được trễ một năm, năm 2016 không tham gia hồi quy bước 1 hoặc bước 2; tối đa chỉ còn 7 năm hồi quy chéo.

Fama–MacBeth ước lượng một hồi quy chéo riêng cho từng năm rồi lấy trung bình hệ số. Với 2017–2023, sai số chuẩn Fama–MacBeth chỉ dựa trên **7 hệ số theo năm**, tức bậc tự do rất thấp. Vì vậy:

- Kết quả Fama–MacBeth là mô hình bám paper.
- Hồi quy panel có hiệu ứng năm/ngành và sai số chuẩn cụm theo công ty là kiểm định độ bền cần báo cáo.
- Không nên kết luận “không có tác động” chỉ vì p-value lớn; mẫu ngắn có công suất kiểm định thấp.
- Không dùng hiệu ứng cố định công ty làm mô hình thay thế cho Table 5 của paper. Table 5 của paper dùng hiệu ứng thời gian, quốc gia và có thể thêm ngành; với dữ liệu này chỉ dùng thời gian và ngành vì tất cả doanh nghiệp thuộc Việt Nam.

## 3. Cách chạy trong Stata

Mở Stata 17, chọn **Window > Do-file Editor > New Do-file Editor**, hoặc bấm biểu tượng tờ giấy có bút. Sau đó có hai cách.

### Cách nhanh nhất

Dán ba lệnh này vào cửa sổ Command, chạy từng dòng:

```stata
cd "C:/Users/kimngoo/Desktop/ForChau"
ssc install xtfmb, replace
do "run_paper_adapted_148x8.do"
```

Nếu muốn xuất bảng RTF đẹp hơn, cài thêm một lần:

```stata
ssc install estout, replace
```

Sau khi chạy xong, thư mục sẽ có:

- `paper_adapted_148x8.log`: toàn bộ kết quả và thông báo kiểm tra.
- `analysis_paper_adapted.dta`: dữ liệu phân tích đã tạo biến, lag, target và interaction.
- `paper_adapted_results.rtf`: bảng mô hình, nếu đã cài `estout`.

Nếu Stata báo `file data_output.xlsx not found`, lỗi là thư mục làm việc hoặc tên file. Chạy:

```stata
pwd
dir
```

`pwd` phải hiện `C:/Users/kimngoo/Desktop/ForChau`, còn `dir` phải nhìn thấy `data_output.xlsx`.

## 4. Phần 1 của do-file: nhập dữ liệu và kiểm tra panel

Các lệnh chính:

```stata
import excel using "data_output.xlsx", sheet("data_clean") firstrow clear
isid firm_id year
encode ind_code, gen(industry_id)
xtset firm_id year
xtdescribe
```

### Cách đọc

- `count` nên cho 1.184 quan sát nếu bảng cân bằng 148 × 8.
- `isid firm_id year` chạy im lặng là tốt: mỗi công ty-năm là duy nhất.
- `xtset` phải nhận `firm_id` là panel và `year` là thời gian.
- `xtdescribe` cho biết dữ liệu có cân bằng hay không.

### Dấu hiệu lỗi và cách sửa

Nếu Stata báo `variables firm_id year do not uniquely identify the observations`, chạy:

```stata
duplicates report firm_id year
duplicates list firm_id year
```

Không tự động chạy `duplicates drop, force`. Hai dòng có cùng mã-năm có thể là hai báo cáo khác nhau hoặc lỗi ghép dữ liệu. Mở Excel, đối chiếu doanh nghiệp và năm, rồi giữ đúng báo cáo theo quy tắc đã định trước.

Nếu `check_gap` liệt kê khoảng cách năm lớn hơn 1, công ty có năm bị đứt quãng. Paper loại các chuỗi không liên tục. Có hai cách hợp lệ:

1. Bổ sung lại năm thiếu từ nguồn gốc; đây là cách tốt nhất.
2. Loại quan sát/công ty có khoảng trống và trình bày quy tắc chọn mẫu.

Không nên biến một năm không liên tục thành lag kế tiếp bằng cách tự trừ hàng trong Excel. `L.variable` của Stata sẽ để missing đúng cách khi có khoảng trống.

## 5. Phần 2: kiểm tra missing và tính hợp lệ của dữ liệu gốc

Các lệnh:

```stata
misstable summarize rev tl ta reserve ebit mcap dep ppe ctr gdp infl
misstable patterns rev tl ta reserve ebit mcap dep ppe, frequency
tab year if missing(dep), missing
```

### Cách đọc `misstable summarize`

- `Obs=.` là số missing chuẩn `.`.
- `Obs>.` là các mã missing mở rộng như `.a`, `.b`.
- `Unique` là số giá trị khác nhau trong phần không missing.

Trong dữ liệu hiện tại, vấn đề lớn nhất là `dep`: khoảng 238/1.184 quan sát thiếu, xấp xỉ 20%. Các biến khác chỉ thiếu rải rác hơn. Vì `DEP` nằm trong mô hình mục tiêu và tất cả biến điều chỉnh, một giá trị `dep` thiếu có thể làm mất cả quan sát hiện tại lẫn quan sát năm kế tiếp do dùng lag.

### Quy tắc xử lý missing

- Không thay `dep = 0` nếu báo cáo không có dữ liệu. Missing không đồng nghĩa bằng 0.
- Ưu tiên lấy lại khấu hao và phân bổ từ báo cáo lưu chuyển tiền tệ/thuyết minh.
- Nếu chưa bổ sung được, dùng complete-case làm mô hình chính và mô hình “không DEP” làm kiểm định độ bền. Do-file đã chạy cả hai.
- Không nội suy kế toán một cách mặc định. Nếu buộc phải nội suy, phải có lý do, kiểm định độ nhạy và trình bày rõ.

### Các phép kiểm tra kế toán

Do-file đếm:

```stata
count if ta <= 0 & !missing(ta)
count if tl < 0 & !missing(tl)
count if mcap < 0 & !missing(mcap)
count if dep < 0 & !missing(dep)
count if reserve < 0 & !missing(reserve)
```

`ta<=0`, `tl<0`, `mcap<0`, hoặc `dep<0` thường là lỗi đơn vị, dấu âm, hay sai cột; cần quay lại báo cáo nguồn. `reserve<0` có thể có ý nghĩa kinh tế tùy định nghĩa quỹ dự phòng, nhưng phải đối chiếu từng công ty-năm được liệt kê. Nếu `reserve` thực chất là một khoản lỗ lũy kế hoặc dự phòng âm, không được gọi biến đó là “risk reserve” nếu định nghĩa không phù hợp.

### Vốn chủ sở hữu sổ sách

Do-file tạo:

```stata
gen book_equity = ta - tl
gen mtb = mcap/book_equity if book_equity != 0
```

- `book_equity==0`: MTB không xác định, phải missing.
- `book_equity<0`: MTB âm có thể là dữ liệu thật, không tự đổi thành 0. Tuy nhiên cần báo cáo số lượng và kiểm tra độ bền khi loại các quan sát này.
- Nếu `tl` không phải tổng nợ phải trả, công thức `ta-tl` không phải vốn chủ sở hữu. Khi đó phải bổ sung trực tiếp biến `book_equity` từ báo cáo tài chính.

## 6. Kiểm tra biến CTR và biến vĩ mô

Do-file kiểm tra biến thiên trong nhóm ngành-năm. Dữ liệu hiện tại cho thấy `ctr` giống nhau cho mọi doanh nghiệp cùng ngành và năm. Điều này có ba hệ quả:

1. `ctr` là chỉ số cấp ngành-năm, không phải phơi nhiễm khí hậu cấp công ty-năm như paper.
2. Không thể nhận diện khác biệt CTR giữa các công ty trong cùng ngành-năm.
3. Nếu thêm đầy đủ tương tác ngành × năm, tác động CTR sẽ bị hấp thụ hoàn toàn.

GDP và lạm phát phải giống nhau giữa tất cả công ty trong cùng năm vì mẫu chỉ có Việt Nam. Hai dòng sau phải cho 0:

```stata
count if check_tag_y==1 & abs(check_gdp_max-check_gdp_min)>1e-10
count if check_tag_y==1 & abs(check_infl_max-check_infl_min)>1e-10
```

Nếu khác 0, dữ liệu vĩ mô đã bị ghép sai. Hãy tạo một bảng chỉ có `year gdp infl`, bảo đảm mỗi năm một dòng, rồi merge `m:1 year`.

## 7. Phần 3: tạo biến theo paper

### LEV

Paper định nghĩa:

```stata
gen lev = 100*total_debt/ta
```

Do chưa có `total_debt`, do-file dùng:

```stata
gen lev = 100*tl/ta
```

Đây là khác biệt quan trọng. Nếu `tl` là total liabilities, tỷ lệ có thể cao hơn rõ rệt so với debt/assets. Nên thêm cột `total_debt` gồm nợ vay ngắn hạn + nợ vay dài hạn, rồi do-file sẽ tự ưu tiên cột này.

### PROF

Paper cần `nibe`. Nếu thêm cột `nibe`, do-file tự dùng `100*nibe/ta`. Hiện tại nó dùng `100*ebit/ta` và in cảnh báo `PROXY WARNING`.

### R&D

Nếu bổ sung cột `rd`, do-file tạo:

```stata
gen dum_rd = missing(rd)
gen rdexp = 100*rd/ta if !missing(rd)
replace rdexp = 0 if dum_rd==1
```

Đây là cách paper giữ quan sát thiếu R&D: `rdexp=0` đi cùng dummy missing. Chỉ áp dụng nếu missing mang ý nghĩa không được báo cáo; cần kiểm tra cách nguồn dữ liệu mã hóa R&D.

### Đơn vị phần trăm

`lev`, `prof`, `dep_ratio`, `tang`, `rrf` được nhân 100. Ví dụ `lev=45` nghĩa là 45%, không phải 0,45. Khi diễn giải, một đơn vị là một điểm phần trăm.

## 8. Phần 4: winsorize 1% và 99%

Paper winsorize các biến liên tục ở phân vị 1 và 99. Do-file không xóa quan sát mà kéo giá trị nhỏ hơn p1 lên p1 và lớn hơn p99 xuống p99.

Trước khi sửa, do-file lưu bản gốc với tiền tố `raw_`, ví dụ `raw_mtb`, `raw_ctr`, `raw_rrf`. Số quan sát bị thay đổi được in ra log.

### Cách nhận biết vấn đề

- Một biến có rất nhiều quan sát bị winsorize có thể do phân phối rời rạc hoặc lỗi đơn vị.
- Nếu chỉ một số ít giá trị cực đoan bị thay đổi, đó là chức năng bình thường của winsorization.
- Winsorization không sửa được sai đơn vị. Ví dụ một công ty nhập tài sản theo đồng trong khi phần còn lại theo triệu đồng vẫn là lỗi nguồn, không phải outlier kinh tế.

So sánh trước và sau bằng:

```stata
summ raw_mtb mtb, detail
list mck year raw_mtb mtb if raw_mtb!=mtb
```

## 9. Thống kê mô tả và tương quan

Đọc bảng `tabstat` theo thứ tự:

- `N`: số quan sát hợp lệ. Nếu khác nhiều giữa các biến, hồi quy sẽ bị thu hẹp bởi complete-case.
- `mean`, `sd`: trung bình và độ phân tán.
- `p1`, `p99`: ngưỡng winsor.
- `min`, `max`: sau winsor phải trùng hoặc nằm trong p1–p99.

Ở `pwcorr ..., sig`, số nằm dưới hệ số là p-value. Tương quan cặp cao, ví dụ trên |0,8|, là cảnh báo đa cộng tuyến, không tự động chứng minh phải xóa biến. Sau hồi quy panel có thể kiểm tra:

```stata
estat vif
```

Không diễn giải tương quan như quan hệ nhân quả.

## 10. Phần 5–6: Bước 1 ước lượng đòn bẩy mục tiêu

Do-file tạo các biến trễ bằng toán tử panel:

```stata
gen l_prof = L.prof
...
```

Sau đó chạy mô hình Fama–MacBeth:

```stata
xtfmb lev l_prof l_mtb l_size l_dep_ratio l_tang l_indlev if candidate_stage1
```

Nếu có `rd`, hai biến R&D cũng tự được thêm.

### Cách đọc kết quả bước 1

- `Number of obs`: tổng số quan sát complete-case trong tất cả hồi quy năm.
- `Num. time periods`: dự kiến tối đa 7.
- `Coefficient`: trung bình hệ số chéo theo năm.
- `FMB Std. Err.`: sai số chuẩn dựa trên chuỗi hệ số theo năm.
- `P>|t|`: p-value; thông lệ đánh dấu 10%, 5%, 1%.

Dấu hệ số cần được xem xét về kinh tế, nhưng mục tiêu trực tiếp của bước 1 là dự báo `lev_target`, không phải chọn biến chỉ theo p-value. Không xóa biến kiểm soát chỉ vì không có ý nghĩa trong mẫu nhỏ nếu biến được quy định trước bởi lý thuyết/paper.

Do-file tính:

```stata
lev_target = hệ số chặn + tổng(hệ số FMB trung bình × biến trễ)
devlev = lev_target - L.lev
```

### Kiểm tra target

```stata
summ lev_target devlev, detail
count if lev_target<0 | lev_target>100
```

Target ngoài 0–100 là cảnh báo ngoại suy hoặc đặc tả yếu. Không tự động chặn target về 0/100 vì làm thay đổi mô hình. Hãy kiểm tra các dòng được liệt kê, đơn vị của biến, MTB do vốn chủ âm, và độ lớn CTR/RRF. Có thể báo cáo một kiểm định độ bền dùng logistic fractional target, nhưng đó không còn là mô hình gốc.

## 11. Bước 2: mô hình tốc độ điều chỉnh

Do-file định nghĩa:

```stata
lev_adj = lev - L.lev
devlev = lev_target - L.lev
```

Sau đó tạo từng tích đúng theo phương trình (4):

```stata
dx_ctr  = devlev*L.ctr
dx_prof = devlev*L.prof
...
dx_gdp  = devlev*L.gdp
dx_infl = devlev*L.infl
```

Hai biến `dx_gdp` và `dx_infl` được tạo để dùng trong mô hình panel, nhưng **không được đưa vào Fama–MacBeth** của mẫu hiện tại. Trong một năm, mọi doanh nghiệp đều có cùng GDP và lạm phát của Việt Nam, nên `devlev`, `devlev×GDP` và `devlev×Inflation` chỉ là các bội số của nhau và đồng tuyến hoàn toàn trong hồi quy chéo. Paper có nhiều quốc gia nên không gặp giới hạn này.

Mô hình chính:

```stata
xtfmb lev_adj devlev dx_ctr dx_prof dx_mtb dx_size ///
    dx_dep_ratio dx_tang dx_indlev if sample_main
```

### Cách đọc hệ số quan trọng

- `devlev`: tốc độ điều chỉnh cơ sở khi các biến tương tác bằng 0. Không nhất thiết bằng tốc độ tại “doanh nghiệp trung bình” vì các biến chưa center.
- `dx_ctr`: CTR làm thay đổi tốc độ điều chỉnh bao nhiêu khi CTR tăng một đơn vị.
- Nếu `dx_ctr>0`: CTR cao đi cùng tốc độ tiến về mục tiêu nhanh hơn.
- Nếu `dx_ctr<0`: CTR cao đi cùng tốc độ chậm hơn.
- Chỉ kết luận có bằng chứng thống kê khi p-value đạt ngưỡng đã đặt trước; đồng thời phải báo cáo độ lớn và khoảng tin cậy.

Vì CTR không được center, tốc độ điều chỉnh có điều kiện của doanh nghiệp `i,t` là:

```text
lambda_it = b(devlev)
          + b(dx_ctr)*L.ctr
          + b(dx_prof)*L.prof + ...
```

Do đó không nên mô tả riêng `b(devlev)` là “SOA trung bình 30%” nếu chưa tính tại giá trị trung bình của các biến. Có thể tính sau mô hình bằng `nlcom`; cách chắc chắn hơn là mean-center các biến trước khi tạo tích nếu mục tiêu là cho `devlev` biểu thị SOA tại doanh nghiệp trung bình.

Do-file còn tính tỷ lệ thay đổi SOA khi CTR tăng một độ lệch chuẩn theo phương trình (5):

```stata
nlcom 100*SD(CTR)*_b[dx_ctr]/_b[devlev]
```

Nếu mẫu số `_b[devlev]` gần 0, tỷ lệ này không ổn định và không nên nhấn mạnh.

### Newey–West lag(1)

Mô hình `xtfmb ..., lag(1)` là kiểm tra độ nhạy tự tương quan theo thời gian. Chỉ có 7 năm nên ước lượng Newey–West rất mong manh; cần trình bày là robustness, không coi là bằng chứng chính.

## 12. Mô hình panel theo Table 5 của paper

Do-file chạy:

```stata
reg lev_adj devlev dx_ctr ... i.year i.industry_id, vce(cluster firm_id)
```

Trong lệnh thực tế, `dx_gdp` và `dx_infl` được giữ ở mô hình panel này. Chúng được nhận diện từ việc hệ số của `devlev` thay đổi qua năm, nhưng chỉ có 7 năm hữu dụng nên phải diễn giải thận trọng.

### Cách đọc

- Sai số chuẩn được cluster theo `firm_id`, cho phép sai số tương quan trong cùng công ty theo thời gian.
- `i.year` hấp thụ cú sốc chung từng năm.
- `i.industry_id` hấp thụ khác biệt cố định giữa các ngành.
- Không có `i.country` vì chỉ có Việt Nam; biến này sẽ đồng tuyến hoàn toàn.

Nếu dấu của `dx_ctr` giống Fama–MacBeth nhưng p-value khác, đó không hẳn là lỗi. Hai mô hình xử lý phụ thuộc chéo/thời gian và hiệu ứng cố định khác nhau. Báo cáo cả hai và giải thích mẫu ngắn.

Nếu Stata báo một số dummy `omitted because of collinearity`, thường do nhóm cơ sở hoặc biến không có biến thiên; một dummy cơ sở bị bỏ là bình thường. Nếu `dx_ctr` bị bỏ, kiểm tra xem CTR có bị hấp thụ bởi cấu trúc fixed effects hay không.

## 13. Phần mở rộng CTR × RRF

Phần này không thuộc paper gốc. Do-file chạy:

```stata
xtfmb lev_adj devlev dx_ctr dx_rrf dx_ctr_rrf controls...
```

Trong đó:

```stata
dx_rrf     = devlev*L.rrf
dx_ctr_rrf = devlev*L.ctr*L.rrf
```

### Diễn giải đúng

- Tác động biên của CTR lên SOA: `b(dx_ctr) + L.rrf*b(dx_ctr_rrf)`.
- Tác động biên của RRF lên SOA: `b(dx_rrf) + L.ctr*b(dx_ctr_rrf)`.
- `dx_ctr_rrf` dương có nghĩa RRF làm mối quan hệ CTR–SOA tích cực hơn; âm nghĩa làm yếu đi.
- Không diễn giải `dx_ctr` là tác động chung của CTR; đó là tác động khi RRF bằng 0.

Do-file dùng `lincom` để tính hai tác động biên tại trung bình mẫu. Để trình bày tốt hơn, nên mean-center `ctr` và `rrf`, hoặc dùng `margins` sau một mô hình factor-variable tương thích.

Trước khi tin kết quả, phải làm rõ `reserve` là gì, vì dữ liệu có giá trị âm. Nếu không có cơ sở lý thuyết cho tỷ lệ quỹ dự phòng âm, cần sửa định nghĩa hoặc đổi tên biến.

## 14. Bất đối xứng doanh nghiệp trên/dưới mục tiêu

Paper đặt:

```stata
overlev = 1 nếu devlev<0
```

`devlev<0` nghĩa đòn bẩy kỳ trước cao hơn mục tiêu, nên doanh nghiệp đang over-leveraged.

Mô hình có:

- `devlev`: SOA cơ sở của nhóm dưới mục tiêu.
- `dx_over = devlev*overlev`: phần chênh SOA cơ sở của nhóm trên mục tiêu.
- `dx_ctr`: tác động CTR lên SOA của nhóm dưới mục tiêu.
- `dx_ctr_over`: phần chênh tác động CTR ở nhóm trên mục tiêu.

Các tổng cần báo cáo:

```stata
lincom dx_ctr                         // tác động CTR, under-leveraged
lincom dx_ctr + dx_ctr_over           // tác động CTR, over-leveraged
lincom devlev                         // base SOA, under-leveraged
lincom devlev + dx_over               // base SOA, over-leveraged
test dx_ctr_over=0                    // hai nhóm có khác nhau không
```

Sai lầm thường gặp là thấy `dx_ctr` có ý nghĩa ở một nhóm và tổng ở nhóm kia không có ý nghĩa rồi kết luận hai nhóm khác nhau. Kết luận khác nhau chỉ được hỗ trợ trực tiếp khi kiểm định `dx_ctr_over=0` bị bác bỏ.

## 15. Mô hình không DEP

Do-file ước lượng lại từ đầu target, deviation và bước 2 sau khi bỏ DEP. Đây không phải cách “lấp dữ liệu”; nó trả lời câu hỏi liệu kết luận có phụ thuộc vào việc mất nhiều quan sát do DEP hay không.

So sánh bốn yếu tố giữa `fmb_ctr` và `fmb_no_dep`:

1. Số quan sát.
2. Dấu của hệ số CTR.
3. Độ lớn của hệ số CTR.
4. Khoảng tin cậy/p-value.

Nếu dấu đổi hoặc độ lớn thay đổi mạnh, kết quả nhạy với lựa chọn mẫu/đặc tả. Khi đó nên ưu tiên thu thập lại DEP thay vì chọn mô hình cho kết quả “đẹp”.

## 16. Những phần paper chưa thể chạy hợp lệ

### Active leverage adjustment

Paper loại phần thay đổi đòn bẩy cơ học do lợi nhuận giữ lại. Phần này cần tối thiểu tổng nợ và lợi nhuận ròng. `EBIT` không thay thế được lợi nhuận ròng trong công thức. Cần bổ sung `total_debt` và `net_income`/`nibe`.

### ESG moderation

Cần điểm ESG cấp công ty-năm. Dữ liệu hiện tại không có.

### Country risk, GPR và country fixed effects

Mẫu một quốc gia không nhận diện hiệu ứng cố định quốc gia. Chỉ số rủi ro quốc gia/GPR biến thiên theo năm vẫn có thể thêm, nhưng với 8 năm sẽ cạnh tranh mạnh với year fixed effects; không thể ước lượng đồng thời đầy đủ nếu biến chỉ thay đổi theo năm.

### IV/2SLS giống paper

Paper dùng trung bình khí hậu theo ngành-quốc gia-năm làm công cụ cho biến khí hậu cấp công ty. `ctr` hiện tại đã không đổi trong ngành-năm, nên công cụ tạo từ trung bình nhóm sẽ bằng chính `ctr`. Công cụ như vậy không cung cấp biến thiên ngoại sinh mới và không nên dùng. Cần biến khí hậu cấp công ty-năm trước khi cân nhắc IV này.

### Ba chỉ số khí hậu của paper

Paper ước lượng riêng tổng phơi nhiễm, cơ hội và rủi ro chuyển đổi. Dữ liệu hiện tại chỉ có một `ctr`; vì vậy chỉ có thể chạy một cột đại diện, không thể tái tạo đủ ba cột kết quả.

## 17. Khi nào phải dừng và sửa dữ liệu

Phải dừng trước khi diễn giải hồi quy nếu gặp một trong các tình huống:

- `isid firm_id year` thất bại.
- `ta<=0`, `mcap<0`, `dep<0` nhưng chưa xác minh nguồn.
- Cùng một năm có nhiều giá trị GDP/lạm phát cho các doanh nghiệp Việt Nam.
- `tl` được xác định là total liabilities nhưng luận văn vẫn gọi LEV là total debt/assets.
- Hơn một đơn vị tiền tệ hoặc thang đo được trộn trong cùng một cột.
- Target có quá nhiều giá trị ngoài 0–100 và truy ngược cho thấy sai công thức/đơn vị.
- CTR không có biến thiên phù hợp với cấp độ mà giả thuyết tuyên bố.

Không nhất thiết phải dừng, nhưng phải báo cáo và kiểm định độ bền nếu:

- Missing DEP làm giảm mạnh N.
- Vốn chủ sở hữu âm tạo MTB âm/cực đoan.
- Số năm Fama–MacBeth chỉ là 7.
- Hệ số đổi dấu giữa Fama–MacBeth, panel cluster và mô hình không DEP.

## 18. Các bảng nên đưa vào bài nghiên cứu

1. **Quy trình chọn mẫu:** 1.184 firm-years ban đầu, số mất do lag, missing và từng điều kiện loại.
2. **Thống kê mô tả:** N, mean, sd, p25, median, p75, min, max.
3. **Ma trận tương quan.**
4. **Bước 1:** mô hình xác định target leverage.
5. **Kết quả chính:** Fama–MacBeth bước 2 với CTR.
6. **Robustness:** FMB Newey–West và panel year/industry FE cluster firm.
7. **Bất đối xứng:** over- vs under-leveraged.
8. **Phần mở rộng:** CTR × RRF, ghi rõ không thuộc paper gốc.
9. **Kiểm định missing DEP:** mô hình có và không DEP.

Trong mọi bảng, báo cáo N, số năm/cụm, loại fixed effects, cách tính sai số chuẩn, định nghĩa LEV/PROF đang dùng proxy, và việc winsorize 1%–99%.

## 19. Checklist trước khi chấp nhận kết quả

```text
[ ] firm_id-year duy nhất
[ ] không có khoảng trống năm chưa giải thích
[ ] xác nhận tl là total debt hay total liabilities
[ ] xác nhận ta, tl, mcap, dep, ppe cùng đơn vị
[ ] bổ sung/giải thích missing DEP
[ ] giải thích bản chất và cấp độ của CTR
[ ] xác minh các reserve âm
[ ] target leverage được kiểm tra
[ ] báo cáo chỉ có 7 Fama–MacBeth periods
[ ] kết quả chính đi kèm panel clustered robustness
[ ] không gọi RRF là biến trong paper gốc
[ ] không chạy IV ngành-năm khi CTR đã là biến ngành-năm
```

## 20. Biến nên bổ sung để nghiên cứu gần paper hơn

Ưu tiên thu thập theo thứ tự:

1. `total_debt`: tổng nợ vay ngắn hạn + dài hạn.
2. `nibe` hoặc lợi nhuận ròng trước khoản mục bất thường.
3. `rd`: chi phí R&D và trạng thái không báo cáo.
4. Ba biến phơi nhiễm khí hậu cấp công ty-năm, ít nhất là transition exposure/risk.
5. `net_income` để tính active leverage adjustment.
6. ESG score nếu làm kiểm định tương tác ESG.

Khi thêm đúng tên `total_debt`, `nibe`, hoặc `rd` vào sheet `data_clean`, do-file đã được viết để tự ưu tiên các biến chính xác hơn ở lần chạy sau.
