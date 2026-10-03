********************************************************************************
* MO HINH DIEU CHINH TUNG PHAN CUA CAU TRUC VON
* Du lieu: data_output.xlsx / sheet data_clean
* Panel: 148 cong ty, 2016-2023
********************************************************************************

version 17.0
clear all
set more off

* Doi duong dan neu file .do khong nam cung thu muc voi file Excel.
import excel using "data_output.xlsx", sheet("data_clean") firstrow clear

* Kiem tra va khai bao du lieu bang.
isid firm_id year, sort
xtset firm_id year
xtdescribe

********************************************************************************
* 0. TAO CAC BIEN NGHIEN CUU
********************************************************************************

* Dinh nghia dang ty le giup so sanh cac cong ty co quy mo khac nhau.
gen double lev       = tl / ta             if ta > 0 & !missing(tl, ta)
gen double prof      = ebit / ta           if ta > 0 & !missing(ebit, ta)
gen double mtb       = (mcap + tl) / ta    if ta > 0 & !missing(mcap, tl, ta)
gen double size      = ln(ta)              if ta > 0
gen double dep_ratio = dep / ta            if ta > 0 & !missing(dep, ta)
gen double tang      = ppe / ta            if ta > 0 & !missing(ppe, ta)
gen double rrf       = reserve / ta        if ta > 0 & !missing(reserve, ta)

* Neu de tai dinh nghia MTB = gia tri thi truong / gia tri so sach von CSH,
* thay dong tao mtb o tren bang dong sau:
* replace mtb = mcap / (ta - tl) if (ta - tl) > 0 & !missing(mcap, ta, tl)

* Don bay nganh: trung vi LEV cua tung nganh trong tung nam.
bysort ind_code year: egen double indlev = median(lev)
sort firm_id year

label variable lev       "Total liabilities / total assets"
label variable prof      "EBIT / total assets"
label variable mtb       "(Market capitalization + liabilities) / total assets"
label variable size      "Natural log of total assets"
label variable dep_ratio "Depreciation / total assets"
label variable tang      "PPE / total assets"
label variable indlev    "Industry-year median leverage"
label variable rrf       "Risk reserve fund / total assets"

* RRF am co the la lo luy ke/du phong am trong du lieu nguon.
* Khong tu dong chuyen missing thanh 0 va khong tu dong xoa/winsorize ngoai le.
summarize lev prof mtb size dep_ratio tang indlev rrf ctr gdp infl, detail

********************************************************************************
* BUOC 1. UOC LUONG DON BAY MUC TIEU
*
* LEV_it = alpha + beta * X_i,t-1 + error_it
* X = PROF, MTB, SIZE, DEP, TANG, INDLEV, GDP growth, Inflation
********************************************************************************

regress lev L.(prof mtb size dep_ratio tang indlev gdp infl), ///
    vce(cluster firm_id)

estimates store target_leverage_model
gen byte sample_step1 = e(sample)

* Gia tri du bao LEV*_it. Lenh xb bao gom he so chan cua hoi quy tren.
predict double lev_target if sample_step1, xb

* DevLev_i,t-1 trong ky hieu cua mo hinh:
* khoang cach tu LEV thuc te dau ky den muc tieu cua ky hien tai.
gen double lev_l1 = L.lev
gen double devlev = lev_target - lev_l1 if sample_step1

label variable lev_target "Predicted target leverage LEV*_it"
label variable lev_l1     "Actual leverage LEV_i,t-1"
label variable devlev     "LEV*_it - LEV_i,t-1"

********************************************************************************
* BUOC 2. MO HINH TOC DO DIEU CHINH
*
* LevAdj_it = LEV_it - LEV_i,t-1
* LevAdj_it = beta0*DevLev
*           + beta1*CTR_i,t-1*DevLev
*           + beta2*RRF_i,t-1*DevLev
*           + beta3*CTR_i,t-1*RRF_i,t-1*DevLev
*           + gamma*X_i,t-1*DevLev + error_it
********************************************************************************

gen double lev_adj = lev - lev_l1 if !missing(lev, lev_l1)
label variable lev_adj "LEV_it - LEV_i,t-1"

* Tao bien tre de cong thuc hoi quy de doc va tranh nham ky.
foreach variable in ctr rrf prof mtb size dep_ratio tang indlev gdp infl {
    gen double l_`variable' = L.`variable'
}

* Phuong trinh (5) khong co mot he so chan rieng: moi thanh phan cua lambda
* deu duoc nhan voi DevLev. Vi vay dung tuy chon noconstant.
regress lev_adj                                                   ///
    c.devlev                                                      /// beta0
    c.devlev#c.l_ctr                                              /// beta1
    c.devlev#c.l_rrf                                              /// beta2
    c.devlev#c.l_ctr#c.l_rrf                                      /// beta3
    c.devlev#c.l_prof                                             ///
    c.devlev#c.l_mtb                                              ///
    c.devlev#c.l_size                                             ///
    c.devlev#c.l_dep_ratio                                        ///
    c.devlev#c.l_tang                                             ///
    c.devlev#c.l_indlev                                           ///
    c.devlev#c.l_gdp                                              ///
    c.devlev#c.l_infl                                             ///
    if sample_step1, noconstant vce(cluster firm_id)

estimates store partial_adjustment_pooled

********************************************************************************
* DIEN GIAI VA KIEM DINH
********************************************************************************

* beta1: CTR co lam thay doi toc do dieu chinh hay khong?
test c.devlev#c.l_ctr = 0

* beta2: RRF co lam thay doi toc do dieu chinh hay khong?
test c.devlev#c.l_rrf = 0

* beta3: RRF co dieu tiet anh huong cua CTR den toc do dieu chinh hay khong?
test c.devlev#c.l_ctr#c.l_rrf = 0

* Kiem dinh dong thoi ba he so lien quan CTR/RRF.
test (c.devlev#c.l_ctr = 0)                                      ///
     (c.devlev#c.l_rrf = 0)                                      ///
     (c.devlev#c.l_ctr#c.l_rrf = 0)

* He so c.devlev chi la toc do dieu chinh tai CTR=RRF=X=0.
* Toc do dieu chinh tai gia tri cu the phai tinh bang lincom.
* Vi du ben duoi dung CTR=10, RRF=0.10 va cac bien kiem so bang 0:
lincom _b[devlev]                                                 ///
     + 10*_b[c.devlev#c.l_ctr]                                   ///
     + .10*_b[c.devlev#c.l_rrf]                                  ///
     + (10*.10)*_b[c.devlev#c.l_ctr#c.l_rrf]

* Neu lambda nam trong (0,1), thoi gian dieu chinh mot nua:
* half_life = ln(0.5) / ln(1-lambda)

********************************************************************************
* TUY CHON: MO HINH HIEU UNG CO DINH CONG TY VA NAM DE KIEM TRA DO BEN
* Day la mo hinh bo sung, khong phai phuong trinh (5) nguyen ban.
********************************************************************************

xtreg lev_adj                                                     ///
    c.devlev                                                      ///
    c.devlev#c.l_ctr                                              ///
    c.devlev#c.l_rrf                                              ///
    c.devlev#c.l_ctr#c.l_rrf                                      ///
    c.devlev#c.l_prof                                             ///
    c.devlev#c.l_mtb                                              ///
    c.devlev#c.l_size                                             ///
    c.devlev#c.l_dep_ratio                                        ///
    c.devlev#c.l_tang                                             ///
    c.devlev#c.l_indlev                                           ///
    c.devlev#c.l_gdp                                              ///
    c.devlev#c.l_infl i.year                                      ///
    if sample_step1, fe vce(cluster firm_id)

estimates store partial_adjustment_fe

* So sanh nhanh cac mo hinh da luu.
estimates table target_leverage_model partial_adjustment_pooled ///
    partial_adjustment_fe, b(%9.4f) se(%9.4f) stats(N r2)

* Luu bo du lieu da tao bien de tiep tuc phan tich.
compress
save "analysis_ready.dta", replace

********************************************************************************
* LUU Y PHUONG PHAP
* 1. Sai so chuan cluster tren chi xu ly phu thuoc trong cong ty; no chua dieu
*    chinh day du cho viec lev_target la gia tri du bao tu buoc 1. Neu can suy
*    dien nghiem ngat, nen bootstrap ca hai buoc theo firm_id.
* 2. GDP va infl chi thay doi theo nam. Khong them i.year vao buoc 1 cung luc
*    voi hai bien nay, vi se xay ra da cong tuyen hoan hao.
* 3. Du lieu dep thieu nhieu quan sat; Stata se loai theo listwise deletion.
********************************************************************************
