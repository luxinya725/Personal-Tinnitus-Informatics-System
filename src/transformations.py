import re
import pandas as pd

# ORDINAL MAPPINGS

LEVEL_ORDER = {"Little": 1, "Low": 1, "Moderate": 2, "A lot": 3, "High": 3, "Yes": 2}

SEVERITY_LABEL = {1: "Mild", 2: "Moderate", 3: "Severe", 4: "Unbearable"}

CATEGORIES_TO_DROP = [
    "Gratitudes",
    "Personal care",
    "Health measurements",
    "Work",
    "Behavioural patterns",
    "Social",
    "Nutrition",
    "Meds/Supplements",
    # Sleep rows carry no data (all NaN); sleep_quality is the real signal
    "Sleep",
]

CATEGORIES_TO_KEEP = [
    "Sleep quality",
    "Energy",
    "Mood",
    "Period",
    "Symptom",
    "Active",
    "Lifestyle",
]


# LOW LEVEL HELPERS

def _strip_emoji(text: str) -> str:
    """Remove leading emoji / non-word characters from a string."""
    return re.sub(r"^[^\w]+", "", text).strip()


def _split_pipe(text: str) -> list[str]:
    """Split a ' | ' delimited detail cell into individual items."""
    return [item.strip() for item in text.split(" | ") if item.strip()]


def _parse_name_level(item: str) -> tuple[str, str]:
    """
    Split 'Caffeine - Little' → ('Caffeine', 'Little').
    Items without ' - ' get level 'Yes' (boolean presence).
    """
    item = _strip_emoji(item)
    if " - " in item:
        name, level = item.split(" - ", 1)
        return name.strip(), level.strip()
    return item.strip(), "Yes"


# COLUMN LEVEL CLEANERS

def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.drop(columns=["date"])
    df = df.rename(columns={"date formatted": "date"})
    df["date"] = pd.to_datetime(df["date"])
    return df


def parse_notes(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(columns=["notes"])


def drop_redundant_categories(df: pd.DataFrame) -> pd.DataFrame:
    return df[~df["category"].isin(CATEGORIES_TO_DROP)].copy()


# PER-CATEGORY ROW PARSERS

def _parse_period_row(row: pd.Series) -> dict:
    """
    Period rows encode the cycle phase in 'rating/amount' (a string, not a
    number) and the cycle day in 'time of day'.  The optional detail cell
    may contain bleeding level and/or sex drive.
    """
    result: dict = {
        "cycle_phase": row["rating/amount"],  # Follicular / Ovulation / Luteal / Period
    }

    # Cycle day: 'Day 7' → 7
    time_val = row.get("time of day", "")
    if isinstance(time_val, str) and time_val.startswith("Day "):
        try:
            result["cycle_day"] = int(time_val.split(" ", 1)[1])
        except ValueError:
            pass

    # Detail: '🩸 Bleeding level (Heavy)' and/or '💗 Sex drive (Medium)'
    detail = row.get("detail", "")
    if isinstance(detail, str):
        bleed = re.search(r"Bleeding level \((\w+)\)", detail)
        if bleed:
            result["bleeding_level"] = bleed.group(1)

        sex = re.search(r"Sex drive \((\w+)\)", detail)
        if sex:
            result["sex_drive"] = sex.group(1)

    return result


def _parse_symptom_row(row: pd.Series) -> dict:
    """
    Each symptom row is one symptom with a numeric severity (1–4) and a
    matching label embedded in the detail string, e.g. 'Anxiety (Moderate)'.
    Returns {'symptom_name': <name>, 'severity': <int>}.
    """
    detail = row.get("detail", "")
    severity = row.get("value")

    name = re.sub(r"\s*\(\w+\)\s*$", "", str(detail)).strip() if isinstance(detail, str) else ""

    return {"symptom_name": name, "severity": severity}


def _parse_active_row(row: pd.Series) -> list[dict]:
    """
    Active detail cells are pipe-delimited, e.g.:
        '👣 Walk - Moderate | 🤒 Sick'
    Returns a list of {'active_name': ..., 'active_level': ...} dicts,
    one per item in the cell.
    """
    detail = row.get("detail", "")
    if not isinstance(detail, str):
        return []

    results = []
    for item in _split_pipe(detail):
        name, level = _parse_name_level(item)
        if name:
            results.append({"active_name": name, "active_level": level})
    return results


def _parse_lifestyle_row(row: pd.Series) -> list[dict]:
    """
    Lifestyle detail cells are pipe-delimited, e.g.:
        '☕ Caffeine - Little | 💣 Stress - Moderate'
    Returns a list of {'lifestyle_name': ..., 'lifestyle_level': ...} dicts.
    """
    detail = row.get("detail", "")
    if not isinstance(detail, str):
        return []

    results = []
    for item in _split_pipe(detail):
        name, level = _parse_name_level(item)
        if name:
            results.append({"lifestyle_name": name, "lifestyle_level": level})
    return results


# AGGREGATORS: LONG ROWS -> ONE DICT PER DAY

def _aggregate_day(date: str, day_df: pd.DataFrame) -> dict:
    """
    Collapse all rows for a single date into one flat record suitable for
    Vega-Lite (one row per day, one column per metric)
    """
    record: dict = {"date": date}

    for cat, sub in day_df.groupby("category"):

        if cat == "Sleep quality":
            # Single numeric rating per night (1-5)
            vals = sub["value"].dropna()
            if len(vals):
                record["sleep_quality"] = vals.iloc[0]

        elif cat == "Energy":
            vals = sub["value"].dropna()
            if len(vals):
                record["energy_avg"] = round(vals.mean(), 2)

        elif cat == "Mood":
            vals = sub["value"].dropna()
            if len(vals):
                record["mood_avg"] = round(vals.mean(), 2)
                record["mood_min"] = vals.min()
                record["mood_max"] = vals.max()

        elif cat == "Period":
            # Only one row per day for Period
            parsed = _parse_period_row(sub.iloc[0])
            record.update(parsed)

        elif cat == "Symptom":
            # Multiple symptoms per day. pivot each symptom to its own column
            # keeping the worst (max) severity logged that day
            for _, row in sub.iterrows():
                parsed = _parse_symptom_row(row)
                name = parsed["symptom_name"]
                sev = parsed["severity"]
                if not name or pd.isna(sev):
                    continue
                col = "symptom_" + name.lower().replace(" ", "_").replace("(", "").replace(")", "")
                existing = record.get(col)
                if existing is None or sev > existing:
                    record[col] = sev

        elif cat == "Active":
            # Multiple items per cell, multiple rows per day
            # Keep highest level per activity name
            for _, row in sub.iterrows():
                for item in _parse_active_row(row):
                    col = "active_" + item["active_name"].lower().replace(" ", "_")
                    level = item["active_level"]
                    existing = record.get(col)
                    if existing is None or LEVEL_ORDER.get(level, 0) > LEVEL_ORDER.get(existing, 0):
                        record[col] = level

        elif cat == "Lifestyle":
            # Same pattern as Active
            for _, row in sub.iterrows():
                for item in _parse_lifestyle_row(row):
                    col = "lifestyle_" + item["lifestyle_name"].lower().replace(" ", "_")
                    level = item["lifestyle_level"]
                    existing = record.get(col)
                    if existing is None or LEVEL_ORDER.get(level, 0) > LEVEL_ORDER.get(existing, 0):
                        record[col] = level

    return record


# MAIN ENTRY POINT

def build_daily_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform the raw Bearable long-format export into a wide daily table
    ready for Vega-Lite.

    Steps:
      1. Drop columns that carry no information (notes).
      2. Normalise dates.
      3. Drop categories not used in analysis.
      4. Parse rating/amount to numeric where applicable (Period phase strings
         become NaN and are handled separately in _parse_period_row).
      5. Aggregate all rows for each date into a single flat record.
    """
    df = parse_notes(df)
    df = parse_dates(df)
    df = drop_redundant_categories(df)

    # Numeric value column - Period phase strings become NaN here, which is
    # intentional. _parse_period_row reads 'rating/amount' directly.
    df["value"] = pd.to_numeric(df["rating/amount"], errors="coerce")

    records = [
        _aggregate_day(str(date.date()), day_df)
        for date, day_df in df.groupby("date")
    ]

    result = pd.DataFrame(records).sort_values("date").reset_index(drop=True)
    return result