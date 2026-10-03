********************************************************************************
* CLIMATE TRANSITION AND THE SPEED OF LEVERAGE ADJUSTMENT
* Paper-adapted workflow for the user's sample: 148 firms, 2016-2023
*
* IMPORTANT DATA LIMITATIONS
* - Paper LEV uses TOTAL DEBT / TOTAL ASSETS. If total_debt is absent, this
*   file uses tl/ta as a proxy. Confirm that tl is actually total debt.
* - Paper PROF uses net income before extraordinary items / total assets.
*   If nibe is absent, this file uses EBIT/TA as a proxy.
* - Paper includes R&D expense and a missing-R&D dummy. They are included only
*   if a numeric variable named rd is present.
* - Paper climate-transition exposure is a firm-year textual measure named
*   rg_expo_ew. The user's ctr is an industry-year index, so it is an adaptation.
* - RRF does not appear in the original paper. CTR x RRF is the user's extension.
********************************************************************************

version 17.0
clear all
set more off
set linesize 255

global PROJECT "C:/Users/kimngoo/Desktop/ForChau"
cd "$PROJECT"

capture log close
log using "paper_adapted_148x8.log", text replace

********************************************************************************
* 0. REQUIRED COMMUNITY COMMAND: XTFMB
********************************************************************************

capture which xtfmb
if _rc {
    display as text "xtfmb is not installed. Stata will try to install it from SSC."
    capture noisily ssc install xtfmb
}
capture which xtfmb
if _rc {
    display as error "STOP: install xtfmb first by running: ssc install xtfmb"
    log close
    exit 199
}

********************************************************************************
* 1. IMPORT AND CHECK PANEL IDENTIFIERS
********************************************************************************

import excel using "data_output.xlsx", sheet("data_clean") firstrow clear

local required firm_id mck year ind_code ctr tl ta reserve ebit mcap dep ppe gdp infl
foreach variable of local required {
    capture confirm variable `variable'
    if _rc {
        display as error "STOP: required variable `variable' is missing."
        log close
        exit 111
    }
}

* Paper sample screen: exclude financial firms and regulated utilities by SIC.
* The current file has no SIC variable, so the screen cannot be automated yet.
capture confirm numeric variable sic
if !_rc {
    count if inrange(sic, 6000, 6999) | inrange(sic, 4000, 4049) | ///
        inrange(sic, 4900, 4999)
    display as text "Paper SIC exclusions to be removed: " r(N)
    drop if inrange(sic, 6000, 6999) | inrange(sic, 4000, 4049) | ///
        inrange(sic, 4900, 4999)
}
else {
    display as error "SAMPLE WARNING: SIC is absent; verify manually that finance and regulated utilities have already been excluded."
}

describe
count

capture noisily isid firm_id year
if _rc {
    display as error "STOP: firm_id-year is not unique. Inspect duplicates below."
    duplicates report firm_id year
    duplicates list firm_id year
    log close
    exit 459
}

capture drop industry_id
encode ind_code, generate(industry_id)
sort firm_id year
xtset firm_id year
xtdescribe

* Detect non-consecutive observations. The paper excludes firms with gaps.
capture drop check_gap
by firm_id (year): generate check_gap = year - year[_n-1] if _n > 1
count if check_gap != 1 & check_gap < .
if r(N) > 0 {
    display as error "WARNING: non-consecutive firm-year observations found."
    list firm_id mck year check_gap if check_gap != 1 & check_gap < ., sepby(firm_id)
}
else {
    display as result "PASS: no gaps in the original firm-year panel."
}

********************************************************************************
* 2. RAW-DATA AUDIT: DO NOT SKIP
********************************************************************************

display as text "==== MISSING VALUES IN RAW INPUTS ===="
misstable summarize rev tl ta reserve ebit mcap dep ppe ctr gdp infl
misstable patterns rev tl ta reserve ebit mcap dep ppe, frequency

display as text "==== MISSING DEP BY YEAR ===="
tabulate year if missing(dep), missing

display as text "==== INVALID OR SUSPICIOUS ACCOUNTING VALUES ===="
count if ta <= 0 & !missing(ta)
display as text "TA <= 0: " r(N)
count if tl < 0 & !missing(tl)
display as text "TL < 0: " r(N)
count if mcap < 0 & !missing(mcap)
display as text "MCAP < 0: " r(N)
count if dep < 0 & !missing(dep)
display as text "DEP < 0: " r(N)
count if reserve < 0 & !missing(reserve)
display as text "RESERVE < 0: " r(N)
list mck year reserve ta if reserve < 0 & !missing(reserve), sepby(mck) noobs

capture drop check_book_equity
generate double check_book_equity = ta - tl if !missing(ta, tl)
count if check_book_equity == 0
display as text "Book equity = 0 (MTB undefined): " r(N)
count if check_book_equity < 0
display as text "Book equity < 0 (negative MTB is possible): " r(N)
list mck year ta tl mcap check_book_equity if check_book_equity <= 0, sepby(mck) noobs

* In this data CTR is expected to be constant within industry-year.
capture drop check_ctr_min check_ctr_max check_tag_iy
bysort industry_id year: egen double check_ctr_min = min(ctr)
bysort industry_id year: egen double check_ctr_max = max(ctr)
egen byte check_tag_iy = tag(industry_id year)
count if check_tag_iy == 1 & abs(check_ctr_max-check_ctr_min) > 1e-10
if r(N) == 0 {
    display as error "NOTE: CTR is constant within every industry-year; it is not a firm-level exposure measure as in the paper."
}

* For one-country data, GDP and inflation must have one value per year.
capture drop check_gdp_min check_gdp_max check_infl_min check_infl_max check_tag_y
bysort year: egen double check_gdp_min = min(gdp)
bysort year: egen double check_gdp_max = max(gdp)
bysort year: egen double check_infl_min = min(infl)
bysort year: egen double check_infl_max = max(infl)
egen byte check_tag_y = tag(year)
count if check_tag_y == 1 & abs(check_gdp_max-check_gdp_min) > 1e-10
display as text "Years with inconsistent GDP values: " r(N)
count if check_tag_y == 1 & abs(check_infl_max-check_infl_min) > 1e-10
display as text "Years with inconsistent inflation values: " r(N)

********************************************************************************
* 3. CONSTRUCT VARIABLES USING THE PAPER'S DEFINITIONS WHERE POSSIBLE
********************************************************************************

* LEV: paper = total debt / total assets, in percentage points.
capture confirm numeric variable total_debt
if !_rc {
    generate double lev = 100 * total_debt / ta if ta > 0 & !missing(total_debt, ta)
    local debt_source "total_debt"
}
else {
    generate double lev = 100 * tl / ta if ta > 0 & !missing(tl, ta)
    local debt_source "tl_proxy"
    display as error "PROXY WARNING: LEV uses TL/TA because total_debt is absent."
}

* PROF: paper = net income before extraordinary items / TA.
capture confirm numeric variable nibe
if !_rc {
    generate double prof = 100 * nibe / ta if ta > 0 & !missing(nibe, ta)
    local profit_source "nibe"
}
else {
    generate double prof = 100 * ebit / ta if ta > 0 & !missing(ebit, ta)
    local profit_source "ebit_proxy"
    display as error "PROXY WARNING: PROF uses EBIT/TA because NIBE is absent."
}

* MTB: paper = market value of equity / book value of equity.
generate double book_equity = ta - tl if !missing(ta, tl)
generate double mtb = mcap / book_equity if book_equity != 0 & !missing(mcap, book_equity)

* Since every firm is Vietnamese, using VND rather than USD changes SIZE by a
* constant only. With an intercept, slope estimates are unaffected.
generate double size = ln(ta) if ta > 0
generate double dep_ratio = 100 * dep / ta if ta > 0 & !missing(dep, ta)
generate double tang = 100 * ppe / ta if ta > 0 & !missing(ppe, ta)

* User extension, not an original-paper variable.
generate double rrf = 100 * reserve / ta if ta > 0 & !missing(reserve, ta)

* Optional exact-paper R&D controls, used only if variable rd exists.
local have_rd = 0
capture confirm numeric variable rd
if !_rc {
    count if !missing(rd)
    if r(N) > 0 {
        generate byte dum_rd = missing(rd)
        generate double rdexp = 100 * rd / ta if ta > 0 & !missing(rd, ta)
        replace rdexp = 0 if dum_rd == 1 & ta > 0
        local have_rd = 1
    }
}
if `have_rd' == 0 {
    display as error "DATA GAP: R&D and missing-R&D dummy from the paper are omitted."
}

label variable lev       "Book leverage, percentage points"
label variable prof      "Profitability, percentage points"
label variable mtb       "Market value / book equity"
label variable size      "ln(total assets)"
label variable dep_ratio "Depreciation / assets, percentage points"
label variable tang      "PPE / assets, percentage points"
label variable rrf       "Reserve / assets, percentage points (user extension)"

********************************************************************************
* 4. WINSORIZE CONTINUOUS VARIABLES AT 1% AND 99% AS IN THE PAPER
********************************************************************************

local winsor_vars lev prof mtb size dep_ratio tang rrf ctr gdp infl
if `have_rd' == 1 {
    local winsor_vars `winsor_vars' rdexp
}

foreach variable of local winsor_vars {
    capture drop raw_`variable'
    clonevar raw_`variable' = `variable'
    quietly summarize `variable', detail
    if r(N) >= 2 {
        local lower = r(p1)
        local upper = r(p99)
        quietly replace `variable' = `lower' if `variable' < `lower' & !missing(`variable')
        quietly replace `variable' = `upper' if `variable' > `upper' & !missing(`variable')
        quietly count if raw_`variable' != `variable' & !missing(raw_`variable', `variable')
        display as text "Winsorized `variable': " r(N) " observations changed."
    }
}

* Industry-year median book leverage, calculated after winsorizing LEV.
capture drop indlev raw_indlev
bysort industry_id year: egen double indlev = median(lev)
clonevar raw_indlev = indlev
quietly summarize indlev, detail
local lower_indlev = r(p1)
local upper_indlev = r(p99)
replace indlev = `lower_indlev' if indlev < `lower_indlev' & !missing(indlev)
replace indlev = `upper_indlev' if indlev > `upper_indlev' & !missing(indlev)
label variable indlev "Industry-year median leverage"

local firm_controls prof mtb size dep_ratio tang indlev
if `have_rd' == 1 {
    local firm_controls prof mtb size rdexp dum_rd dep_ratio tang indlev
}

display as text "==== DESCRIPTIVE STATISTICS IN PAPER UNITS ===="
tabstat lev prof mtb size dep_ratio tang indlev ctr rrf gdp infl, ///
    statistics(n mean sd min p1 p25 p50 p75 p99 max) columns(statistics)

display as text "==== PAIRWISE CORRELATIONS ===="
pwcorr lev `firm_controls' ctr rrf gdp infl, sig

********************************************************************************
* 5. CREATE LAGS AND DIAGNOSE THE REGRESSION SAMPLE
********************************************************************************

sort firm_id year
xtset firm_id year

local lag_variables `firm_controls' gdp infl ctr rrf lev
foreach variable of local lag_variables {
    capture drop l_`variable'
    generate double l_`variable' = L.`variable'
}

generate double lev_adj = lev - l_lev if !missing(lev, l_lev)
label variable lev_adj "Actual leverage adjustment: LEV_t - LEV_t-1"

local stage1_lags
foreach variable of local firm_controls {
    local stage1_lags `stage1_lags' l_`variable'
}

egen int nmiss_stage1 = rowmiss(lev `stage1_lags')
generate byte candidate_stage1 = (nmiss_stage1 == 0)
display as text "==== STEP-1 COMPLETE CASES BY YEAR ===="
tabulate year candidate_stage1, row

display as text "Interpretation: 2016 must be unavailable because all regressors are lagged."
display as text "Large additional losses after 2016 indicate missing accounting inputs, mainly DEP."

********************************************************************************
* 6. STEP 1: FAMA-MACBETH TARGET LEVERAGE MODEL, PAPER EQ. (1)
********************************************************************************

xtfmb lev `stage1_lags' if candidate_stage1
estimates store target_fmb
generate byte sample_stage1 = e(sample)

* Construct target leverage from the average Fama-MacBeth coefficients.
generate double lev_target = _b[_cons] if sample_stage1
foreach variable of local stage1_lags {
    replace lev_target = lev_target + _b[`variable'] * `variable' if sample_stage1
}

generate double devlev = lev_target - l_lev if sample_stage1
generate byte overlev = (devlev < 0) if !missing(devlev)

label variable lev_target "Estimated target leverage"
label variable devlev     "Target gap: LEV target_t - LEV_t-1"
label variable overlev    "1 if over-leveraged (DevLev < 0)"

summarize lev_target devlev, detail
count if (lev_target < 0 | lev_target > 100) & !missing(lev_target)
display as text "Target predictions outside 0-100 (inspect, do not automatically cap): " r(N)
list mck year lev l_lev lev_target devlev if ///
    (lev_target < 0 | lev_target > 100) & !missing(lev_target), sepby(mck) noobs

********************************************************************************
* 7. BUILD EQ. (4) INTERACTIONS: EVERY DETERMINANT IS MULTIPLIED BY DEVLEV
********************************************************************************

generate double dx_ctr = devlev * l_ctr
generate double dx_rrf = devlev * l_rrf
generate double dx_ctr_rrf = devlev * l_ctr * l_rrf
generate double dx_gdp = devlev * l_gdp
generate double dx_infl = devlev * l_infl

* IMPORTANT FOR A ONE-COUNTRY SAMPLE:
* Within each annual Fama-MacBeth cross-section, GDP and inflation are
* constants. Therefore, DevLev x GDP, DevLev x Inflation, and DevLev are
* perfectly collinear. The macro interactions are used only in the panel
* robustness model, where slopes can vary across years.

local gap_controls
foreach variable of local firm_controls {
    generate double dx_`variable' = devlev * l_`variable'
    local gap_controls `gap_controls' dx_`variable'
}

egen int nmiss_main = rowmiss(lev_adj devlev dx_ctr `gap_controls')
generate byte sample_main = (nmiss_main == 0)

egen int nmiss_panel = rowmiss(lev_adj devlev dx_ctr `gap_controls' dx_gdp dx_infl)
generate byte sample_panel = (nmiss_panel == 0)

display as text "==== MAIN STEP-2 SAMPLE BY YEAR ===="
tabulate year sample_main, row
count if sample_main
display as result "Main paper-adapted sample: " r(N)

********************************************************************************
* 8. STEP 2A: MAIN FAMA-MACBETH MODEL CLOSEST TO PAPER TABLE 4
*    User CTR replaces the paper's firm-level TransECC variable.
********************************************************************************

display as error "ONE-COUNTRY ADAPTATION: GDP and inflation interactions are omitted from FMB because they are collinear with DevLev within each year."
xtfmb lev_adj devlev dx_ctr `gap_controls' if sample_main
estimates store fmb_ctr

test dx_ctr = 0

* Paper Eq. (5): percentage change in SOA for a one-SD rise in climate exposure.
quietly summarize l_ctr if e(sample)
local sd_ctr = r(sd)
capture noisily nlcom 100 * `sd_ctr' * _b[dx_ctr] / _b[devlev]

* With only seven usable years, Newey-West lag(1) is a sensitivity check only.
xtfmb lev_adj devlev dx_ctr `gap_controls' ///
    if sample_main, lag(1)
estimates store fmb_ctr_nw1

********************************************************************************
* 9. STEP 2B: FAMA-MACBETH WITH INDUSTRY FIXED EFFECTS
*    Country FE cannot be estimated because all firms are from Vietnam.
********************************************************************************

quietly tabulate industry_id, generate(indfe_)
unab industry_dummies_all : indfe_*
local industry_base : word 1 of `industry_dummies_all'
local industry_dummies : list industry_dummies_all - industry_base

capture noisily xtfmb lev_adj devlev dx_ctr `gap_controls' ///
    `industry_dummies' if sample_main
if _rc == 0 {
    estimates store fmb_ctr_indfe
}
else {
    display as error "Industry-FE FMB failed, usually because an industry is absent in one annual cross-section."
}

********************************************************************************
* 10. PAPER TABLE-5-STYLE PANEL MODEL
*     Paper absorbs time/country/industry effects and clusters by firm.
*     There is no country FE here because the sample has only one country.
********************************************************************************

regress lev_adj devlev dx_ctr `gap_controls' dx_gdp dx_infl ///
    i.year i.industry_id if sample_panel, vce(cluster firm_id)
estimates store panel_year_industry_fe

********************************************************************************
* 11. USER EXTENSION: CTR x RRF MODERATION
*     This section is not part of the original paper.
********************************************************************************

egen int nmiss_extension = rowmiss(lev_adj devlev dx_ctr dx_rrf dx_ctr_rrf ///
    `gap_controls')
generate byte sample_extension = (nmiss_extension == 0)

xtfmb lev_adj devlev dx_ctr dx_rrf dx_ctr_rrf ///
    `gap_controls' if sample_extension
estimates store fmb_ctr_rrf

test dx_ctr = 0
test dx_rrf = 0
test dx_ctr_rrf = 0
test (dx_ctr = 0) (dx_rrf = 0) (dx_ctr_rrf = 0)

* Conditional effects at the estimation-sample means.
quietly summarize l_rrf if e(sample)
local mean_rrf = r(mean)
quietly summarize l_ctr if e(sample)
local mean_ctr = r(mean)
capture noisily lincom dx_ctr + `mean_rrf' * dx_ctr_rrf
capture noisily lincom dx_rrf + `mean_ctr' * dx_ctr_rrf

********************************************************************************
* 12. PAPER EQ. (7): OVER- VS UNDER-LEVERAGED ASYMMETRY
********************************************************************************

generate double dx_over = devlev * overlev
generate double dx_ctr_over = devlev * l_ctr * overlev

egen int nmiss_asym = rowmiss(lev_adj devlev dx_ctr dx_ctr_over dx_over ///
    `gap_controls')
generate byte sample_asym = (nmiss_asym == 0)

tabulate overlev if sample_asym

xtfmb lev_adj devlev dx_ctr dx_ctr_over dx_over ///
    `gap_controls' if sample_asym
estimates store fmb_asymmetry

* H0: climate-transition effect is identical for over- and under-leveraged firms.
test dx_ctr_over = 0

* Under-leveraged climate effect = dx_ctr.
* Over-leveraged climate effect = dx_ctr + dx_ctr_over.
capture noisily lincom dx_ctr
capture noisily lincom dx_ctr + dx_ctr_over

* Base SOA under-leveraged = devlev.
* Base SOA over-leveraged = devlev + dx_over.
capture noisily lincom devlev
capture noisily lincom devlev + dx_over

********************************************************************************
* 13. ROBUSTNESS FOR THE USER'S LARGE DEP MISSINGNESS: OMIT DEP
********************************************************************************

local remove_dep dep_ratio
local firm_controls_nodep : list firm_controls - remove_dep

local stage1_lags_nodep
foreach variable of local firm_controls_nodep {
    local stage1_lags_nodep `stage1_lags_nodep' l_`variable'
}

egen int nmiss_stage1_nodep = rowmiss(lev `stage1_lags_nodep')
generate byte candidate_stage1_nodep = (nmiss_stage1_nodep == 0)

xtfmb lev `stage1_lags_nodep' if candidate_stage1_nodep
estimates store target_fmb_nodep
generate byte sample_stage1_nodep = e(sample)

generate double lev_target_nodep = _b[_cons] if sample_stage1_nodep
foreach variable of local stage1_lags_nodep {
    replace lev_target_nodep = lev_target_nodep + _b[`variable'] * `variable' ///
        if sample_stage1_nodep
}
generate double devlev_nodep = lev_target_nodep - l_lev if sample_stage1_nodep
generate double nd_ctr = devlev_nodep * l_ctr
generate double nd_gdp = devlev_nodep * l_gdp
generate double nd_infl = devlev_nodep * l_infl

local gap_controls_nodep
foreach variable of local firm_controls_nodep {
    generate double nd_`variable' = devlev_nodep * l_`variable'
    local gap_controls_nodep `gap_controls_nodep' nd_`variable'
}

egen int nmiss_nodep = rowmiss(lev_adj devlev_nodep nd_ctr ///
    `gap_controls_nodep')
generate byte sample_nodep = (nmiss_nodep == 0)

xtfmb lev_adj devlev_nodep nd_ctr `gap_controls_nodep' ///
    if sample_nodep
estimates store fmb_no_dep

********************************************************************************
* 14. WHY SOME ORIGINAL-PAPER TESTS CANNOT BE REPLICATED YET
********************************************************************************

display as error "ACTIVE ADJUSTMENT SKIPPED: requires total debt and net income, not EBIT."
display as error "ESG ROBUSTNESS SKIPPED: requires a firm-year ESG score."
display as error "COUNTRY/GPR/DEFAULT-RISK TESTS SKIPPED: one country and variables absent."
display as error "PAPER IV TEST IS INVALID WITH CURRENT CTR: CTR already equals its industry-year group value."
display as error "EXACT PAPER CLIMATE MEASURE ABSENT: paper uses firm-year rg_expo_ew from earnings calls."

********************************************************************************
* 15. DISPLAY, EXPORT, AND SAVE
********************************************************************************

estimates table target_fmb fmb_ctr fmb_ctr_nw1 panel_year_industry_fe ///
    fmb_ctr_rrf fmb_asymmetry fmb_no_dep, ///
    b(%10.4f) se(%10.4f) stats(N r2)

capture which esttab
if !_rc {
    esttab fmb_ctr fmb_ctr_nw1 panel_year_industry_fe fmb_ctr_rrf ///
        fmb_asymmetry fmb_no_dep using "paper_adapted_results.rtf", replace ///
        se star(* 0.10 ** 0.05 *** 0.01) stats(N r2, labels("N" "R-squared")) ///
        title("Paper-adapted leverage adjustment models")
}
else {
    display as text "Optional: run ssc install estout to export paper_adapted_results.rtf."
}

compress
save "analysis_paper_adapted.dta", replace

display as result "DONE: analysis_paper_adapted.dta and paper_adapted_148x8.log created."
display as result "Debt source used: `debt_source'; profitability source used: `profit_source'."

log close
