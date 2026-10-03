from __future__ import annotations

from pathlib import Path
import re

import numpy as np
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


SOURCE = Path("DATA (3).xlsx")
OUTPUT = Path("data_output.xlsx")

KEY_COLUMNS = ["mck", "year"]
TEXT_COLUMNS = ["id", "mck", "ind_code"]
INTEGER_COLUMNS = ["year"]
NUMERIC_COLUMNS = [
    "ctr",
    "rev",
    "tl",
    "ta",
    "reserve",
    "ebit",
    "mcap",
    "dep",
    "ppe",
    "gdp",
    "infl",
]

VARIABLE_LABELS = {
    "firm_id": "Mã số công ty, tạo từ mck theo thứ tự chữ cái",
    "id": "Tên công ty (giữ nguyên từ dữ liệu nguồn)",
    "mck": "Mã chứng khoán",
    "year": "Năm",
    "ind_code": "Ngành (giữ nguyên từ dữ liệu nguồn)",
    "ctr": "Biến ctr (giữ nguyên giá trị nguồn)",
    "rev": "Biến rev (giữ nguyên giá trị nguồn)",
    "tl": "Biến tl (giữ nguyên giá trị nguồn)",
    "ta": "Biến ta (giữ nguyên giá trị nguồn)",
    "reserve": "Biến reserve (giữ nguyên giá trị nguồn)",
    "ebit": "Biến ebit (giữ nguyên giá trị nguồn)",
    "mcap": "Biến mcap (giữ nguyên giá trị nguồn)",
    "dep": "Biến dep (giữ nguyên giá trị nguồn)",
    "ppe": "Biến ppe (giữ nguyên giá trị nguồn)",
    "gdp": "Biến gdp (giữ nguyên giá trị nguồn)",
    "infl": "Biến infl (giữ nguyên giá trị nguồn)",
}


def stata_name(value: object) -> str:
    """Return a conservative Stata-compatible variable name."""
    name = re.sub(r"[^A-Za-z0-9_]", "_", str(value).strip()).lower()
    name = re.sub(r"_+", "_", name).strip("_")
    if not name or name[0].isdigit():
        name = f"v_{name}"
    return name[:32]


def normalize_text(series: pd.Series) -> pd.Series:
    """Trim and collapse whitespace while retaining true missing values."""
    return series.map(
        lambda value: (
            re.sub(r"\s+", " ", value.strip())
            if isinstance(value, str) and value.strip()
            else (pd.NA if isinstance(value, str) else value)
        )
    ).astype("string")


def clean_source() -> tuple[pd.DataFrame, dict[str, int]]:
    raw = pd.read_excel(SOURCE, sheet_name=0, dtype=object)
    source_rows, source_columns = raw.shape

    # Formatting in the source extends well past the data; remove only fully
    # empty rows/columns, then normalize headers for Stata.
    raw = raw.dropna(axis=0, how="all").dropna(axis=1, how="all").copy()
    raw.columns = [stata_name(column) for column in raw.columns]
    if raw.columns.duplicated().any():
        duplicates = raw.columns[raw.columns.duplicated()].tolist()
        raise ValueError(f"Duplicate column names after normalization: {duplicates}")

    required = set(TEXT_COLUMNS + INTEGER_COLUMNS + NUMERIC_COLUMNS)
    missing_columns = sorted(required.difference(raw.columns))
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    for column in TEXT_COLUMNS:
        raw[column] = normalize_text(raw[column])
    raw["mck"] = raw["mck"].str.upper()

    invalid_numeric: dict[str, int] = {}
    for column in INTEGER_COLUMNS + NUMERIC_COLUMNS:
        before = raw[column].notna()
        converted = pd.to_numeric(raw[column], errors="coerce")
        invalid_numeric[column] = int((before & converted.isna()).sum())
        raw[column] = converted

    if any(invalid_numeric.values()):
        details = {key: value for key, value in invalid_numeric.items() if value}
        raise ValueError(f"Non-numeric values found in numeric columns: {details}")

    if raw[KEY_COLUMNS].isna().any().any():
        raise ValueError("Missing value found in the panel key (mck, year).")

    non_integer_year = raw["year"].notna() & (raw["year"] % 1 != 0)
    if non_integer_year.any():
        raise ValueError("Non-integer year value found.")
    raw["year"] = raw["year"].astype("int64")

    exact_duplicates = int(raw.duplicated().sum())
    raw = raw.drop_duplicates().copy()
    key_duplicates = int(raw.duplicated(KEY_COLUMNS, keep=False).sum())
    if key_duplicates:
        raise ValueError(
            f"Found {key_duplicates} rows involved in duplicate mck-year keys; "
            "manual resolution is required."
        )

    # Check that identifiers do not map to conflicting company names/industries.
    if raw.groupby("mck")["id"].nunique(dropna=True).max() > 1:
        raise ValueError("A ticker maps to more than one company name.")
    if raw.groupby("mck")["ind_code"].nunique(dropna=True).max() > 1:
        raise ValueError("A ticker maps to more than one industry.")

    raw = raw.sort_values(KEY_COLUMNS, kind="stable").reset_index(drop=True)
    ticker_order = sorted(raw["mck"].dropna().unique())
    firm_lookup = {ticker: index + 1 for index, ticker in enumerate(ticker_order)}
    raw.insert(0, "firm_id", raw["mck"].map(firm_lookup).astype("int64"))

    stats = {
        "source_rows": source_rows,
        "source_columns": source_columns,
        "output_rows": len(raw),
        "output_columns": len(raw.columns),
        "exact_duplicates_removed": exact_duplicates,
        "key_duplicates": key_duplicates,
        "companies": raw["mck"].nunique(),
        "years": raw["year"].nunique(),
        "missing_cells": int(raw.isna().sum().sum()),
        "rows_with_missing": int(raw.isna().any(axis=1).sum()),
    }
    return raw, stats


def build_audit_sheets(data: pd.DataFrame, stats: dict[str, int]):
    variable_dictionary = pd.DataFrame(
        {
            "variable": data.columns,
            "type": [
                "integer"
                if column in {"firm_id", "year"}
                else "numeric"
                if column in NUMERIC_COLUMNS
                else "string"
                for column in data.columns
            ],
            "description": [VARIABLE_LABELS.get(column, "") for column in data.columns],
        }
    )

    missing_summary = pd.DataFrame(
        {
            "variable": data.columns,
            "missing_n": [int(data[column].isna().sum()) for column in data.columns],
            "missing_pct": [float(data[column].isna().mean() * 100) for column in data.columns],
        }
    )

    rows_with_missing = data[data.isna().any(axis=1)].copy()
    missing_detail = rows_with_missing[["firm_id", "mck", "year"]].copy()
    missing_detail["missing_variables"] = rows_with_missing.apply(
        lambda row: ", ".join(row.index[row.isna()].tolist()), axis=1
    )

    cleaning_report = pd.DataFrame(
        [
            ("source_file", SOURCE.name),
            ("source_sheet", "DATA CHẠY (148 cty)"),
            ("source_rows", stats["source_rows"]),
            ("source_columns_with_data", stats["source_columns"]),
            ("output_rows", stats["output_rows"]),
            ("output_columns", stats["output_columns"]),
            ("companies", stats["companies"]),
            ("years", stats["years"]),
            ("year_range", f"{data['year'].min()}-{data['year'].max()}"),
            ("exact_duplicates_removed", stats["exact_duplicates_removed"]),
            ("duplicate_mck_year_keys", stats["key_duplicates"]),
            ("missing_cells_retained", stats["missing_cells"]),
            ("rows_with_missing", stats["rows_with_missing"]),
            ("text_cleaning", "Trimmed/collapsed whitespace; mck converted to uppercase"),
            ("numeric_cleaning", "Converted numeric columns; no invalid numeric text found"),
            ("missing_value_policy", "Retained as blank; no imputation"),
            ("outlier_policy", "Retained; no winsorization or deletion"),
            ("sort_order", "mck, year"),
            ("stata_panel_command", "xtset firm_id year"),
        ],
        columns=["check", "result"],
    )
    return variable_dictionary, missing_summary, missing_detail, cleaning_report


def format_workbook(path: Path) -> None:
    workbook = load_workbook(path)
    header_fill = PatternFill("solid", fgColor="1F4E78")
    header_font = Font(color="FFFFFF", bold=True)

    for sheet in workbook.worksheets:
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        sheet.sheet_view.showGridLines = False

        for cell in sheet[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for column_index, cells in enumerate(sheet.iter_cols(), start=1):
            values = ["" if cell.value is None else str(cell.value) for cell in cells[:300]]
            width = min(max(max((len(value) for value in values), default=0) + 2, 10), 42)
            sheet.column_dimensions[get_column_letter(column_index)].width = width

    data_sheet = workbook["data_clean"]
    column_positions = {cell.value: cell.column for cell in data_sheet[1]}
    for column in ["firm_id", "year"]:
        letter = get_column_letter(column_positions[column])
        for cell in data_sheet[letter][1:]:
            cell.number_format = "0"
    for column in NUMERIC_COLUMNS:
        letter = get_column_letter(column_positions[column])
        number_format = "0.0000000000" if column in {"ctr", "gdp", "infl"} else "0.############"
        for cell in data_sheet[letter][1:]:
            cell.number_format = number_format

    workbook.calculation.fullCalcOnLoad = False
    workbook.calculation.forceFullCalc = False
    workbook.save(path)


def main() -> None:
    data, stats = clean_source()
    variable_dictionary, missing_summary, missing_detail, cleaning_report = build_audit_sheets(
        data, stats
    )

    with pd.ExcelWriter(OUTPUT, engine="openpyxl") as writer:
        data.to_excel(writer, sheet_name="data_clean", index=False)
        variable_dictionary.to_excel(writer, sheet_name="variable_dictionary", index=False)
        missing_summary.to_excel(writer, sheet_name="missing_summary", index=False)
        missing_detail.to_excel(writer, sheet_name="missing_detail", index=False)
        cleaning_report.to_excel(writer, sheet_name="cleaning_report", index=False)

    format_workbook(OUTPUT)
    print(f"Created {OUTPUT.resolve()}")
    print(f"Rows: {len(data):,}; columns: {len(data.columns)}")
    print(f"Companies: {stats['companies']}; years: {stats['years']}")
    print(
        f"Missing cells retained: {stats['missing_cells']}; "
        f"rows affected: {stats['rows_with_missing']}"
    )


if __name__ == "__main__":
    main()
