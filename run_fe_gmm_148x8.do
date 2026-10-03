********************************************************************************
* ALTERNATIVE SPECIFICATION: FE TARGET LEVERAGE + PANEL GMM ADJUSTMENT MODEL
* User sample: 148 firms, 2016-2023
*
* This is an alternative/robustness design. It is NOT the Fama-MacBeth design
* used in Climate transition and the speed of leverage adjustment.
********************************************************************************

version 17.0
clear all
set more off
set linesize 255

global PROJECT "C:/Users/kimngoo/Desktop/ForChau"
cd "$PROJECT"

capture log close
log using "fe_gmm_148x8.log", text replace

********************************************************************************
* 0. INSTALL/CHECK XTabond2
********************************************************************************

capture which xtabond2
if _rc {
    display as text "xtabond2 is not installed. Stata will try SSC installation."
    capture noisily ssc install xtabond2
}
capture which xtabond2
if _rc {
    display as error "STOP: install xtabond2 first: ssc install xtabond2"
    log close
    exit 199
}

********************************************************************************
* 1. IMPORT AND PANEL CHECKS
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

capture noisily isid firm_id year
if _rc {
    display as error "STOP: firm_id-year is not unique."
    duplicates list firm_id year
    log close
    exit 459
}

encode ind_code, generate(industry_id)
sort firm_id year
xtset firm_id year
xtdescribe

********************************************************************************
* 2. CONSTRUCT PAPER VARIABLES, WITH CURRENT-DATA PROXIES WHERE NECESSARY
********************************************************************************

capture confirm numeric variable total_debt
if !_rc {
    generate double lev = 100 * total_debt / ta if ta > 0 & !missing(total_debt, ta)
    local debt_source "total_debt"
}
else {
    generate double lev = 100 * tl / ta if ta > 0 & !missing(tl, ta)
    local debt_source "tl_proxy"
    display as error "PROXY WARNING: LEV uses TL/TA, not total debt/TA."
}

capture confirm numeric variable nibe
if !_rc {
    generate double prof = 100 * nibe / ta if ta > 0 & !missing(nibe, ta)
    local profit_source "nibe"
}
else {
    generate double prof = 100 * ebit / ta if ta > 0 & !missing(ebit, ta)
    local profit_source "ebit_proxy"
    display as error "PROXY WARNING: PROF uses EBIT/TA, not NIBE/TA."
}

generate double book_equity = ta - tl if !missing(ta, tl)
generate double mtb = mcap / book_equity if book_equity != 0 & !missing(mcap, book_equity)
generate double size = ln(ta) if ta > 0
generate double dep_ratio = 100 * dep / ta if ta > 0 & !missing(dep, ta)
generate double tang = 100 * ppe / ta if ta > 0 & !missing(ppe, ta)
generate double rrf = 100 * reserve / ta if ta > 0 & !missing(reserve, ta)

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
    display as error "DATA GAP: R&D controls from the paper are unavailable."
}

********************************************************************************
* 3. WINSORIZE CONTINUOUS VARIABLES AT 1% AND 99%
********************************************************************************

local winsor_vars lev prof mtb size dep_ratio tang rrf ctr gdp infl
if `have_rd' == 1 {
    local winsor_vars `winsor_vars' rdexp
}

foreach variable of local winsor_vars {
    clonevar raw_`variable' = `variable'
    quietly summarize `variable', detail
    if r(N) >= 2 {
        local lower = r(p1)
        local upper = r(p99)
        quietly replace `variable' = `lower' if `variable' < `lower' & !missing(`variable')
        quietly replace `variable' = `upper' if `variable' > `upper' & !missing(`variable')
    }
}

bysort industry_id year: egen double indlev = median(lev)

local firm_controls prof mtb size dep_ratio tang indlev
if `have_rd' == 1 {
    local firm_controls prof mtb size rdexp dum_rd dep_ratio tang indlev
}

********************************************************************************
* 4. CREATE LAGS AND STEP-1 COMPLETE-CASE INDICATOR
********************************************************************************

sort firm_id year
xtset firm_id year

local lag_variables `firm_controls' ctr rrf gdp infl lev
foreach variable of local lag_variables {
    generate double l_`variable' = L.`variable'
}

local stage1_lags
foreach variable of local firm_controls {
    local stage1_lags `stage1_lags' l_`variable'
}

egen int nmiss_fe1 = rowmiss(lev `stage1_lags')
generate byte sample_fe1 = (nmiss_fe1 == 0)

tabulate year sample_fe1, row

********************************************************************************
* 5. STEP 1: FIRM FIXED-EFFECT TARGET LEVERAGE MODEL
********************************************************************************

xtreg lev `stage1_lags' i.year if sample_fe1, fe vce(cluster firm_id)
estimates store target_fe

* xb excludes the estimated firm effect; uhat is the estimated firm effect.
* Their sum (xbu) is the FE fitted target leverage.
predict double target_xb if e(sample), xb
predict double target_ui if e(sample), u
generate double lev_target_fe = target_xb + target_ui if e(sample)

* Equivalent direct syntax, retained as a check.
predict double target_xbu_check if e(sample), xbu
assert abs(lev_target_fe-target_xbu_check) < 1e-8 if e(sample)

generate double l_lev_for_gap = L.lev
generate double devlev_fe = lev_target_fe - l_lev_for_gap if e(sample)
generate double lev_adj = lev - l_lev_for_gap if !missing(lev, l_lev_for_gap)

summarize lev_target_fe devlev_fe, detail
count if (lev_target_fe < 0 | lev_target_fe > 100) & !missing(lev_target_fe)
display as text "FE target predictions outside 0-100: " r(N)

* Conventional Hausman diagnostic for FE versus RE. This comparison is run
* without clustered VCE because the classic Hausman command requires the
* model-based covariance matrices. The reported target above still comes from
* the firm-clustered FE model.
quietly xtreg lev `stage1_lags' i.year if sample_fe1, fe
estimates store hausman_fe
quietly xtreg lev `stage1_lags' i.year if sample_fe1, re
estimates store hausman_re
capture noisily hausman hausman_fe hausman_re, sigmamore
estimates restore target_fe

********************************************************************************
* 6. STEP 2 VARIABLES
********************************************************************************

* Mean-center every determinant of adjustment speed. This does not change the
* economic interaction model, but it makes b[devlev_fe] interpretable as the
* speed of adjustment at average covariate values instead of at impossible
* zero values for SIZE, INDLEV, etc.
local speed_determinants ctr rrf `firm_controls' gdp infl
foreach variable of local speed_determinants {
    quietly summarize l_`variable' if sample_fe1, meanonly
    generate double c_`variable' = l_`variable' - r(mean)
}

generate double gx_ctr = devlev_fe * c_ctr
generate double gx_rrf = devlev_fe * c_rrf
generate double gx_ctr_rrf = devlev_fe * c_ctr * c_rrf
generate double gx_gdp = devlev_fe * c_gdp
generate double gx_infl = devlev_fe * c_infl

local gx_controls
foreach variable of local firm_controls {
    generate double gx_`variable' = devlev_fe * c_`variable'
    local gx_controls `gx_controls' gx_`variable'
}

* All variables containing DevLev are treated as endogenous in the baseline
* GMM specification. Their own second lags are used as internal instruments.
* GDP and inflation interactions are excluded from the PRIMARY GMM because
* there is only one country and seven usable time periods. They are retained
* in a separate macro robustness model below.
local gmm_endog_main  devlev_fe gx_ctr `gx_controls'
local gmm_endog_macro devlev_fe gx_ctr `gx_controls' gx_gdp gx_infl
local gmm_endog_ext   devlev_fe gx_ctr gx_rrf gx_ctr_rrf `gx_controls'

egen int nmiss_gmm = rowmiss(lev_adj `gmm_endog_main')
generate byte sample_gmm = (nmiss_gmm == 0)

egen int nmiss_gmm_ext = rowmiss(lev_adj `gmm_endog_ext')
generate byte sample_gmm_ext = (nmiss_gmm_ext == 0)

egen int nmiss_gmm_macro = rowmiss(lev_adj `gmm_endog_macro')
generate byte sample_gmm_macro = (nmiss_gmm_macro == 0)

display as text "==== STEP-2 GMM SAMPLE BY YEAR ===="
tabulate year sample_gmm, row
count if sample_gmm
display as result "Main FE-GMM candidate observations: " r(N)

* Generate time dummies for the usable period and omit the first usable year.
quietly tabulate year if sample_gmm, generate(gmmyear_)
unab gmmyear_all : gmmyear_*
local gmmyear_base : word 1 of `gmmyear_all'
local gmmyear_dummies : list gmmyear_all - gmmyear_base

********************************************************************************
* 7. STATIC FE BENCHMARK FOR THE SAME GENERATED TARGET GAP
********************************************************************************

xtreg lev_adj `gmm_endog_main' i.year if sample_gmm, fe vce(cluster firm_id)
estimates store step2_fe_benchmark

********************************************************************************
* 8. DIFFERENCE GMM: ROBUSTNESS/BENCHMARK
*    lag(2 3) produces overidentifying restrictions, while collapse keeps the
*    number of instruments low. With lag(2 2), this specification is exactly
*    identified and the Hansen test is unavailable.
********************************************************************************

xtabond2 lev_adj `gmm_endog_main' `gmmyear_dummies' if sample_gmm, ///
    gmm(`gmm_endog_main', lag(2 3) collapse) ///
    iv(`gmmyear_dummies') ///
    noleveleq twostep robust small
estimates store diff_gmm_main

********************************************************************************
* 9. SYSTEM GMM: MAIN ALTERNATIVE SPECIFICATION
********************************************************************************

xtabond2 lev_adj `gmm_endog_main' `gmmyear_dummies' if sample_gmm, ///
    gmm(`gmm_endog_main', lag(2 2) collapse) ///
    iv(`gmmyear_dummies') ///
    twostep robust small
estimates store sys_gmm_main

test gx_ctr = 0

display as text "Because all speed determinants were mean-centered, b[devlev_fe] is the estimated SOA at their sample means."

display as error "VALIDITY RULES: AR(1) is normally significant; AR(2) must not be significant."
display as error "Hansen must not reject instrument validity and must not be suspiciously close to 1."
display as error "The number of instruments must be below 148 firms; preferably much lower."

********************************************************************************
* 9B. SYSTEM-GMM SENSITIVITY: ALLOW LAGS 2-3
********************************************************************************

xtabond2 lev_adj `gmm_endog_main' `gmmyear_dummies' if sample_gmm, ///
    gmm(`gmm_endog_main', lag(2 3) collapse) ///
    iv(`gmmyear_dummies') ///
    twostep robust small
estimates store sys_gmm_lag23

********************************************************************************
* 9C. MACRO-INTERACTION ROBUSTNESS, NOT THE PRIMARY SPECIFICATION
********************************************************************************

xtabond2 lev_adj `gmm_endog_macro' `gmmyear_dummies' if sample_gmm_macro, ///
    gmm(`gmm_endog_macro', lag(2 2) collapse) ///
    iv(`gmmyear_dummies') ///
    twostep robust small
estimates store sys_gmm_macro

********************************************************************************
* 10. SYSTEM GMM: USER EXTENSION CTR x RRF
********************************************************************************

* Recreate time dummies so their nonmissing sample matches the extension.
capture drop ext_year_*
quietly tabulate year if sample_gmm_ext, generate(ext_year_)
unab ext_year_all : ext_year_*
local ext_year_base : word 1 of `ext_year_all'
local ext_year_dummies : list ext_year_all - ext_year_base

xtabond2 lev_adj `gmm_endog_ext' `ext_year_dummies' if sample_gmm_ext, ///
    gmm(`gmm_endog_ext', lag(2 2) collapse) ///
    iv(`ext_year_dummies') ///
    twostep robust small
estimates store sys_gmm_ctr_rrf

test gx_ctr_rrf = 0

********************************************************************************
* 11. EXPORT AND SAVE
********************************************************************************

estimates table target_fe step2_fe_benchmark diff_gmm_main ///
    sys_gmm_main sys_gmm_lag23 sys_gmm_macro sys_gmm_ctr_rrf, ///
    b(%10.4f) se(%10.4f) stats(N)

capture which esttab
if !_rc {
    esttab step2_fe_benchmark diff_gmm_main sys_gmm_main sys_gmm_lag23 ///
        sys_gmm_macro sys_gmm_ctr_rrf ///
        using "fe_gmm_results.rtf", replace se ///
        star(* 0.10 ** 0.05 *** 0.01) stats(N, labels("N")) ///
        title("FE target leverage and GMM adjustment models")
}
else {
    display as text "Optional: ssc install estout to create fe_gmm_results.rtf."
}

compress
save "analysis_fe_gmm.dta", replace

display as result "DONE: FE-GMM workflow completed."
display as result "Debt source: `debt_source'; profitability source: `profit_source'."

log close
